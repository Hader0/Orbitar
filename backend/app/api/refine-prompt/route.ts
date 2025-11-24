import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  TemplateId,
  buildSystemContentLite,
  classifyTemplate,
  templateRegistry,
  isTemplateId,
} from "@/lib/templates";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  builder: 75,
  pro: 500,
};

const DEFAULT_MODEL: string = process.env.OPENAI_MODEL || "gpt-5-mini";
const MAX_INPUT_CHARS = 8000;
const MAX_OUTPUT_TOKENS = 384;

/**
 * Debug flag — enable by setting DEBUG=true in backend/.env for verbose logs.
 */
const DEBUG = process.env.DEBUG === "true";

function mapCategoryToDefaultTemplateId(cat?: string): TemplateId | null {
  if (!cat) return null;
  const c = cat.toLowerCase();
  switch (c) {
    case "coding":
      return "coding_feature";
    case "writing":
      return "writing_blog";
    case "research":
      return "research_summarize";
    case "planning":
      return "planning_feature_spec";
    case "communication":
      return "communication_reply";
    case "creative":
      return "creative_brainstorm";
    case "general":
      return "general_general";
    default:
      return null;
  }
}

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
    return jsonCors(
      { error: "AUTH_ERROR", message: "Missing or invalid token" },
      401
    );
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
    return jsonCors({ error: "AUTH_ERROR", message: "Invalid API key" }, 401);
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
    return jsonCors(
      { error: "RATE_LIMIT", message: "Daily limit reached" },
      429
    );
  }

  // 3. Process Request
  // effectiveIncognito holds the runtime incognito flag:
  // - If the request includes a boolean `incognito` it will override the user's default.
  // - Otherwise it mirrors user.defaultIncognito, defaulting to false.
  let effectiveIncognito: boolean = (user as any)?.defaultIncognito ?? false;
  try {
    const {
      text,
      modelStyle,
      templateId: templateIdRaw,
      category: categoryRaw,
      template,
      incognito: incognitoRaw,
      source,
    } = await req.json();

    if (!text) {
      return jsonCors(
        { error: "BAD_REQUEST", message: "Text is required" },
        400
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("Backend not configured: missing OPENAI_API_KEY.");
      return jsonCors(
        {
          error: "BACKEND_NOT_CONFIGURED",
          message: "Backend not configured: missing OPENAI_API_KEY.",
        },
        500
      );
    }

    // Resolve TemplateId (prefer explicit templateId, else map category, else map legacy "template", else classify heuristically)
    let templateId: TemplateId | undefined;
    if (typeof templateIdRaw === "string" && isTemplateId(templateIdRaw)) {
      templateId = templateIdRaw as TemplateId;
    } else {
      const fromCategory = mapCategoryToDefaultTemplateId(categoryRaw);
      if (fromCategory) {
        templateId = fromCategory;
      } else if (typeof template === "string") {
        // Legacy mapping for backward compatibility
        const t = template.toLowerCase();
        if (t === "coding") templateId = "coding_feature";
        else if (t === "blog" || t === "writing") templateId = "writing_blog";
        else if (t === "summarize" || t === "summary")
          templateId = "research_summarize";
        else templateId = "general_general";
      }
    }
    if (!templateId) {
      const cls = await classifyTemplate(text);
      templateId = cls.templateId;
    }
    const categoryUsed = templateRegistry[templateId].category;

    // Build richer system content and messages (keep contract unchanged)
    const systemContent = buildSystemContentLite(modelStyle, templateId);
    const textToSend =
      typeof text === "string"
        ? text.length > MAX_INPUT_CHARS
          ? text.slice(-MAX_INPUT_CHARS)
          : text
        : "";
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemContent },
      { role: "user", content: textToSend },
    ];

    // Try official SDK first; fall back to direct fetch if unavailable/fails
    const start = Date.now();
    let refinedText: string | undefined;
    let inputTokens: number | null = null;
    let outputTokens: number | null = null;
    // Try the SDK with a small prioritized model list first to handle accounts
    // where the preferred model (e.g. gpt-5-mini) isn't available.
    let sdkErr: any = null;
    const MODEL_PRIORITY = [
      ...(process.env.OPENAI_MODEL ? [process.env.OPENAI_MODEL] : []),
      "gpt-5-mini",
      "gpt-4o-mini",
      "gpt-3.5-turbo",
    ].filter(Boolean) as string[];

    let sdkSucceeded = false;
    for (const m of MODEL_PRIORITY) {
      try {
        if (DEBUG) {
          console.debug("Attempting OpenAI SDK call with model", m);
        }
        const completion = await openai.chat.completions.create({
          model: m,
          messages,
          temperature: 0.2,
          max_tokens: MAX_OUTPUT_TOKENS,
        });
        refinedText = completion.choices[0]?.message?.content || undefined;
        inputTokens = (completion as any)?.usage?.prompt_tokens ?? null;
        outputTokens = (completion as any)?.usage?.completion_tokens ?? null;
        // record which model succeeded (we'll use DEFAULT_MODEL later for logging)
        if (DEBUG) {
          console.debug("OpenAI SDK call succeeded with model", m);
        }
        sdkSucceeded = true;
        break;
      } catch (err) {
        sdkErr = err;
        if (DEBUG) {
          console.warn("OpenAI SDK model attempt failed:", m, err);
        }
        // try next model
        continue;
      }
    }

    if (!sdkSucceeded) {
      console.warn("OpenAI SDK calls failed for all prioritized models.", {
        modelsTried: MODEL_PRIORITY,
        lastError: sdkErr,
      });

      // Try the REST endpoint with the same model priority list so we don't hard-fail on DEFAULT_MODEL
      let restSucceeded = false;
      for (const m of MODEL_PRIORITY) {
        try {
          if (DEBUG) {
            console.debug("Attempting OpenAI REST call with model", m);
          }
          const r = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: m,
              messages,
              temperature: 0.2,
              max_tokens: MAX_OUTPUT_TOKENS,
            }),
          });

          if (r.ok) {
            const d = await r.json();
            refinedText = d?.choices?.[0]?.message?.content ?? undefined;
            inputTokens = d?.usage?.prompt_tokens ?? null;
            outputTokens = d?.usage?.completion_tokens ?? null;

            // log success with this model
            try {
              await (prisma as any).promptEvent.create({
                data: {
                  userId: user.id,
                  plan: user.plan,
                  source: typeof source === "string" ? source : null,
                  category: categoryUsed,
                  templateId: templateId,
                  model: m,
                  modelStyle: modelStyle || null,
                  latencyMs: Date.now() - start,
                  status: "success_rest_fallback",
                  inputTokens,
                  outputTokens,
                  incognito: effectiveIncognito,
                },
              });
            } catch (logErr) {
              console.error(
                "PromptEvent log error (rest fallback success):",
                logErr
              );
            }

            restSucceeded = true;
            break;
          } else {
            const bodyText = await r.text().catch(() => "");
            if (DEBUG) {
              console.debug("OpenAI REST attempt failed", {
                model: m,
                status: r.status,
                bodyText,
              });
            }
            // continue to next model
            continue;
          }
        } catch (err) {
          if (DEBUG)
            console.warn("OpenAI REST attempt error for model", m, err);
          continue;
        }
      }

      if (!restSucceeded) {
        // All REST attempts failed — treat as upstream error
        console.error(
          "All OpenAI REST attempts failed for models:",
          MODEL_PRIORITY
        );
        return jsonCors(
          {
            error: "OPENAI_ERROR",
            message:
              "OpenAI rejected the request. Check model name and parameters.",
            upstreamStatus: null,
          },
          502
        );
      }
    }

    refinedText = refinedText || text;
    const latencyMs = Date.now() - start;
    // Update effectiveIncognito based on request-level flag.
    // Request-level boolean overrides the user's default; otherwise keep the user's default (or false).
    if (typeof incognitoRaw === "boolean") {
      effectiveIncognito = incognitoRaw;
    }

    // Log PromptEvent (non-blocking)
    try {
      await (prisma as any).promptEvent.create({
        data: {
          userId: user.id,
          plan: user.plan,
          source: typeof source === "string" ? source : null,
          category: categoryUsed,
          templateId: templateId,
          model: DEFAULT_MODEL,
          modelStyle: modelStyle || null,
          latencyMs,
          status: "success",
          inputTokens: inputTokens,
          outputTokens: outputTokens,
          incognito: effectiveIncognito,
        },
      });
    } catch (logErr) {
      console.error("PromptEvent log error:", logErr);
    }

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
    // Attempt to log failure (non-blocking)
    try {
      const data: any = {
        plan: null,
        source: null,
        category: null,
        templateId: null,
        model: DEFAULT_MODEL,
        modelStyle: null,
        latencyMs: null,
        status: "error_internal",
        inputTokens: null,
        outputTokens: null,
        incognito: null,
      };
      // user is available in outer scope after token validation
      // only set userId if present to avoid Prisma complaining about undefined
      if (typeof user?.id === "string") data.userId = user.id;
      // ensure error-path events also record the effective incognito flag
      data.incognito = effectiveIncognito;
      await (prisma as any).promptEvent.create({ data });
    } catch (logErr) {
      console.error("PromptEvent log error (failure path):", logErr);
    }
    return jsonCors(
      {
        error: "INTERNAL_ERROR",
        message: "Unexpected error. Please try again.",
      },
      500
    );
  }
}
