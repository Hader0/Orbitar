import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  builder: 75,
  pro: 500
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]

  // 1. Validate Token
  const apiKey = await prisma.apiKey.findFirst({
    where: { 
      key: token,
      revoked: false
    },
    include: { user: true }
  })

  if (!apiKey) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  const user = apiKey.user

  // 2. Check Limits
  const now = new Date()
  const resetTime = new Date(user.dailyUsageResetAt)
  
  // If reset time has passed, reset count
  if (now > resetTime) {
    // Set next reset to tomorrow midnight
    const nextReset = new Date(now)
    nextReset.setHours(24, 0, 0, 0)
    
    await prisma.user.update({
      where: { id: user.id },
      data: { dailyUsageCount: 0, dailyUsageResetAt: nextReset }
    })
    user.dailyUsageCount = 0
  }

  const limit = PLAN_LIMITS[user.plan] || 10
  if (user.dailyUsageCount >= limit) {
    return NextResponse.json({ error: 'Daily limit reached' }, { status: 429 })
  }

  // 3. Process Request
  try {
    const { text, modelStyle, template } = await req.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Increment usage
    await prisma.user.update({
      where: { id: user.id },
      data: { dailyUsageCount: { increment: 1 } }
    })

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using mini as requested
      messages: [
        {
          role: "system",
          content: `You are a prompt engineering expert. Rewrite the user's text into a high-quality prompt optimized for ${modelStyle || 'General AI'}. 
          Template/Goal: ${template || 'General'}.
          Return ONLY the refined prompt text. Do not add explanations.`
        },
        { role: "user", content: text }
      ]
    })

    const refinedText = completion.choices[0]?.message?.content || text

    return NextResponse.json({ refinedText })

  } catch (error) {
    console.error('Refine error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
