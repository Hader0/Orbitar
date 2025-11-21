import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  TemplateId,
  buildSystemContent as buildSystemContentNew,
  classifyTemplate,
  templateRegistry,
  isTemplateId,
} from "@/lib/templates";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PLAN_LIMITS: Record<string, number> = {
  free: 10,
  builder: 75,
  pro: 500,
};

const DEFAULT_MODEL: string = process.env.OPENAI_MODEL || "gpt-5-mini";

function jsonCors(body: any, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    },
  });
}

export function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

function getTemplateGuidance(template?: string): string {
  const t = (template || "general").toLowerCase();
  switch (t) {
    case "coding":
      return `
Prioritize coding clarity:
- Specify language, framework, versions, and environment.
- Focus on final code; only minimal explanation if needed.
- Include acceptance criteria, edge cases, and test expectations.
- Map requirements to concrete files, functions, or components.
`.trim();
    case "blog":
    case "writing":
      return `
Prioritize long-form quality:
- Clarify audience and tone (beginner/expert, casual/formal).
- Draft an outline first, then the full piece following it.
- Enforce style constraints (no fluff, concrete examples, clear structure).
`.trim();
    case "summarize":
      return `
Prioritize summarization and distillation:
- Clarify the summary's purpose (study notes, executive brief, technical recap).
- Emphasize key points, trade-offs, action items, and risks.
- Keep structure skimmable (bullets/headings).
`.trim();
    default:
      return `
Prioritize clarity and structure:
- Make the task explicit and step-by-step.
- Make the expected output format unambiguous.
`.trim();
  }
}

function buildSystemContent(modelStyle?: string, template?: string): string {
  const style = modelStyle || "a general-purpose LLM";
  const templateLabel = template || "general";
  return `
You are Orbitar, a prompt optimization engine.

Transform rough or underspecified text into a clear, structured, high-leverage prompt tailored to the target model and template.

Context:
- Target model style: ${style}
- Template/goal: ${templateLabel}
- The user will paste your output directly into that model.
- Do not answer the prompt; only rewrite it.
- Preserve the user's intent, constraints, and important details.

Behavior:
1) Infer intent and task type
- Deduce the user's goal (e.g., debug code, write content, design an API, summarize).
- Treat ${templateLabel} as the primary task type.

2) Extract and preserve details
- Keep domain details (APIs, functions, business logic, niche terms).
- Preserve constraints (tone, length, audience, style, tools, libraries, tech stack).
- Preserve examples, edge cases, and "don't do X" rules.
- If ambiguous, add: "If any of this is unclear, ask the user to clarify X before proceeding."

3) Rebuild as a high-quality prompt (direct instruction, not a conversation)
Use this structure:
- Role: [the model's role]
- Goal: [the single desired outcome]
- Context: [key background, constraints, examples]
- Task: [step-by-step instructions]
- Output format: [exact format, bullets/code blocks/JSON as needed]
- Additional rules: [style, safety, what to avoid]
Also:
- Coding: specify language, framework, environment, files, expectations (comments/tests/error handling).
- Writing: specify audience, tone, outline-first then draft, length/style constraints.
- Summarization: specify purpose, depth, focus areas.

4) Optimize for the target model style
- Assume the model is ${style}.
- Be explicit and unambiguous.
- Keep instructions concise but precise; prefer bullet lists over long paragraphs.

Output rules (critical)
- Return only the final optimized prompt text.
- No explanations, quotes, markdown fences, or commentary.

${getTemplateGuidance(template)}
`.trim();
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonCors({ error: "Missing or invalid token" }, 401);
  }

  const token = authHeader.split(" ")[1];

  // 1. Validate Token
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      key: token,
      revoked: false,
    },
    include: { user: true },
  });

  if (!apiKey) {
    return jsonCors({ error: "Invalid API key" }, 401);
  }

  const user = apiKey.user;

  // 2. Check Limits
  const now = new Date();
  const resetTime = new Date(user.dailyUsageResetAt);

  // If reset time has passed, reset count
  if (now > resetTime) {
    // Set next reset to tomorrow midnight
    const nextReset = new Date(now);
    nextReset.setHours(24, 0, 0, 0);

    await prisma.user.update({
      where: { id: user.id },
      data: { dailyUsageCount: 0, dailyUsageResetAt: nextReset },
    });
    user.dailyUsageCount = 0;
  }

  const limit = PLAN_LIMITS[user.plan] || 10;
  if (user.dailyUsageCount >= limit) {
    return jsonCors({ error: "Daily limit reached" }, 429);
  }

  // 3. Process Request
  try {
    const {
      text,
      modelStyle,
      templateId: templateIdRaw,
      category: _categoryRaw,
      template,
    } = await req.json();

    if (!text) {
      return jsonCors({ error: "Text is required" }, 400);
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured.");
      return jsonCors({ error: "OpenAI API key not configured." }, 500);
    }

    // Resolve TemplateId (prefer explicit templateId, else map legacy "template", else classify)
    let templateId: TemplateId | undefined;
    if (typeof templateIdRaw === "string" && isTemplateId(templateIdRaw)) {
      templateId = templateIdRaw;
    } else if (typeof template === "string") {
      // Legacy mapping for backward compatibility
      const t = template.toLowerCase();
      if (t === "coding") templateId = "coding_feature";
      else if (t === "blog" || t === "writing") templateId = "writing_blog";
      else if (t === "summarize" || t === "summary")
        templateId = "research_summarize";
      else templateId = "general_general";
    }
    if (!templateId) {
      const cls = await classifyTemplate(text);
      templateId = cls.templateId;
    }
    const categoryUsed = templateRegistry[templateId].category;

    // Build richer system content and messages (keep contract unchanged)
    const systemContent = buildSystemContentNew(modelStyle, templateId);
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemContent },
      { role: "user", content: text },
    ];

    // Try official SDK first; fall back to direct fetch if unavailable/fails
    let refinedText: string | undefined;
    try {
      const completion = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages,
      });
      refinedText = completion.choices[0]?.message?.content || undefined;
    } catch (sdkErr) {
      console.warn(
        "OpenAI SDK call failed, attempting fetch fallback...",
        sdkErr
      );
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        refinedText = data?.choices?.[0]?.message?.content ?? undefined;
      } else {
        const errText = await resp.text().catch(() => "");
        console.error("OpenAI fetch fallback failed:", resp.status, errText);
        throw new Error("OpenAI request failed");
      }
    }

    refinedText = refinedText || text;

    // Increment usage only on successful completion
    await prisma.user.update({
      where: { id: user.id },
      data: { dailyUsageCount: { increment: 1 } },
    });

    return jsonCors(
      { refinedText, templateIdUsed: templateId, categoryUsed },
      200
    );
  } catch (error) {
    console.error("Refine error:", error);
    return jsonCors({ error: "Internal server error" }, 500);
  }
}
