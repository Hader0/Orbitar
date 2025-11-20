'use server'

import { getServerSession } from "next-auth"
import { authOptions } from "./api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import crypto from 'crypto'

export async function generateApiKey() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    throw new Error("Unauthorized")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) throw new Error("User not found")

  // Generate a random key
  const key = 'orb_' + crypto.randomBytes(16).toString('hex')

  await prisma.apiKey.create({
    data: {
      key, // In prod, hash this!
      userId: user.id
    }
  })

  revalidatePath('/dashboard')
}

export async function revokeApiKey(keyId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    throw new Error("Unauthorized")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) throw new Error("User not found")

  // Verify ownership
  const apiKey = await prisma.apiKey.findUnique({
    where: { id: keyId }
  })

  if (apiKey?.userId !== user.id) {
    throw new Error("Unauthorized")
  }

  await prisma.apiKey.delete({
    where: { id: keyId }
  })

  revalidatePath('/dashboard')
}
