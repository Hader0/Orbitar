/**
 * Orbitar Refine Prompt API
 *
 * POST /api/refine-prompt
 *
 * Transforms rough user text into a polished system prompt using the
 * Orbitar refine engine. Uses templates as behavior presets, not visible forms.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  type TemplateId,
  type TemplateCategory,
  templateRegistry,
  classifyTemplate,
  isTemplateId,
  getCategoryDefaultTemplate,
} from "@/lib/templates";
import { RefineEngine, type RefineRequest } from "@/lib/refine-engine";

// ============================================================================
// Configuration
// ============================================================================

const PLAN_LIMITS: Record<string, number> = {
  free: 5,
  builder: 75,
  pro: 500,
};

const MAX_INPUT_CHARS = 8000;
const DEBUG = process.env.DEBUG === "true";

// ============================================================================
// CORS Helpers
// ============================================================================

function jsonCors(body: unknown, status = 200) {
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

// ============================================================================
// Template Resolution
// ============================================================================

/**
 * Resolve the template ID from various input sources.
 * Priority: explicit templateId > category mapping > legacy template > heuristic classification
 */
async function resolveTemplateId(
  templateIdRaw: unknown,
  categoryRaw: unknown,
  legacyTemplate: unknown,
  text: string
): Promise<TemplateId> {
  // 1. Explicit templateId
  if (typeof templateIdRaw === "string" && isTemplateId(templateIdRaw)) {
    return templateIdRaw;
  }

  // 2. Category mapping
  if (typeof categoryRaw === "string") {
    const category = categoryRaw.toLowerCase() as TemplateCategory;
    if (category in getCategoryDefaults) {
      return getCategoryDefaultTemplate(category);
    }
  }

  // 3. Legacy template mapping (backward compatibility)
  if (typeof legacyTemplate === "string") {
    const t = legacyTemplate.toLowerCase();
    if (t === "coding") return "coding_feature";
    if (t === "blog" || t === "writing") return "writing_blog";
    if (t === "summarize" || t === "summary") return "research_summarize";
  }

  // 4. Heuristic/LLM classification
  const classification = await classifyTemplate(text);
  return classification.templateId;
}

const getCategoryDefaults: Record<string, boolean> = {
  coding: true,
  writing: true,
  planning: true,
  research: true,
  communication: true,
  creative: true,
  general: true,
};

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(req: NextRequest) {
  // 1. Validate Authorization
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonCors(
      { error: "AUTH_ERROR", message: "Missing or invalid token" },
      401
    );
  }

  const token = authHeader.split(" ")[1];

  // 2. Validate API Key
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

  // 3. Check Usage Limits
  const now = new Date();
  const resetTime = new Date(user.dailyUsageResetAt);

  if (now > resetTime) {
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

  // 4. Parse Request
  let effectiveIncognito: boolean =
    (user as Record<string, unknown>)?.defaultIncognito === true;

  try {
    const {
      text,
      modelStyle,
      templateId: templateIdRaw,
      category: categoryRaw,
      template: legacyTemplate,
      incognito: incognitoRaw,
      source,
    } = await req.json();

    // Validate text
    if (!text || typeof text !== "string") {
      return jsonCors(
        { error: "BAD_REQUEST", message: "Text is required" },
        400
      );
    }

    // Check OpenAI configuration
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

    // 5. Resolve Template
    const templateId = await resolveTemplateId(
      templateIdRaw,
      categoryRaw,
      legacyTemplate,
      text
    );
    const categoryUsed = templateRegistry[templateId].category;

    if (DEBUG) {
      console.debug("Resolved template:", { templateId, categoryUsed });
    }

    // 6. Run Refine Engine
    const start = Date.now();

    const engine = new RefineEngine({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      maxInputChars: MAX_INPUT_CHARS,
      debug: DEBUG,
    });

    const refineRequest: RefineRequest = {
      text,
      templateId,
      category: categoryUsed,
      modelStyle: typeof modelStyle === "string" ? modelStyle : undefined,
    };

    const result = await engine.refine(refineRequest);
    const latencyMs = Date.now() - start;

    // 7. Handle Incognito Flag
    if (typeof incognitoRaw === "boolean") {
      effectiveIncognito = incognitoRaw;
    }

    // 8. Log Event (non-blocking)
    try {
      await prisma.promptEvent.create({
        data: {
          userId: user.id,
          plan: user.plan,
          source: typeof source === "string" ? source : null,
          category: categoryUsed,
          templateId: templateId,
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          modelStyle: typeof modelStyle === "string" ? modelStyle : null,
          latencyMs,
          status: "success",
          inputTokens: result.usage?.inputTokens ?? null,
          outputTokens: result.usage?.outputTokens ?? null,
          incognito: effectiveIncognito,
        },
      });
    } catch (logErr) {
      console.error("PromptEvent log error:", logErr);
    }

    // 9. Increment Usage
    await prisma.user.update({
      where: { id: user.id },
      data: { dailyUsageCount: { increment: 1 } },
    });

    // 10. Return Response
    return jsonCors(
      {
        refinedText: result.refinedText,
        templateIdUsed: result.templateIdUsed,
        categoryUsed: result.categoryUsed,
      },
      200
    );
  } catch (error) {
    console.error("Refine error:", error);

    // Log failure event
    try {
      await prisma.promptEvent.create({
        data: {
          userId: user.id,
          plan: user.plan,
          source: null,
          category: null,
          templateId: null,
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          modelStyle: null,
          latencyMs: null,
          status: "error_internal",
          inputTokens: null,
          outputTokens: null,
          incognito: effectiveIncognito,
        },
      });
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
