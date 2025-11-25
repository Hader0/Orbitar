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
import {
  getTemplateVersion,
  getTemplateSlug,
  type PlanKey,
} from "@/lib/templates";
import { RefineEngine, type RefineRequest } from "@/lib/refine-engine";
import type { UserPlanKey } from "@/lib/model-router";

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
    const body = await req.json();
    const {
      text,
      modelStyle,
      templateId: templateIdRaw,
      category: categoryRaw,
      template: legacyTemplate,
      incognito: incognitoRaw,
      source,
      attachments,
    } = body;

    // Validate text
    if (!text || typeof text !== "string") {
      return jsonCors(
        { error: "BAD_REQUEST", message: "Text is required" },
        400
      );
    }

    // Check OpenRouter configuration
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("Backend not configured: missing OPENROUTER_API_KEY.");
      return jsonCors(
        {
          error: "BACKEND_NOT_CONFIGURED",
          message: "Backend not configured: missing OPENROUTER_API_KEY.",
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
    const templateVersion = getTemplateVersion(templateId);
    if (!templateVersion) {
      return jsonCors(
        {
          error: "TEMPLATE_RESOLUTION_ERROR",
          message: "Failed to resolve template version",
        },
        400
      );
    }

    if (DEBUG) {
      console.debug("Resolved template:", { templateId, categoryUsed });
    }

    // Derive user plan key for routing (lightweight mapping)
    // TODO: Thread richer plan info if/when available (e.g. enterprise tiers)
    const planRaw = (user.plan || "").toLowerCase();
    let userPlanKey: UserPlanKey = "unknown";
    if (planRaw === "free") userPlanKey = "free";
    else if (planRaw === "builder" || planRaw === "light")
      userPlanKey = "light";
    else if (planRaw === "pro") userPlanKey = "pro";
    else if (planRaw === "enterprise") userPlanKey = "enterprise";

    // Normalized plan key for Prompt Lab logging
    let planForLab: PlanKey = "free";
    if (planRaw === "free") planForLab = "free";
    else if (planRaw === "builder" || planRaw === "light") planForLab = "light";
    else if (planRaw === "pro") planForLab = "pro";
    else if (planRaw === "admin") planForLab = "admin";

    // 6. Run Refine Engine
    const start = Date.now();

    // Attachments plumbing (optional)
    // Expecting attachments: Array<{ name: string; type?: "FILE"|"CODE"|"IMAGE"|"ERROR"; content?: string }>
    const rawAttachments = Array.isArray(attachments) ? attachments : [];
    const ATTACHMENTS_MAX_CHARS = 4000;
    let used = 0;
    const attachmentNames: string[] = [];
    const parts: string[] = [];

    const IMAGE_EXTS = [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
      ".tiff",
    ];
    const CODE_EXTS = [
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".mjs",
      ".cjs",
      ".py",
      ".rb",
      ".go",
      ".rs",
      ".java",
      ".cs",
      ".php",
      ".swift",
      ".kt",
      ".scala",
      ".sh",
      ".bash",
      ".zsh",
      ".sql",
      ".prisma",
      ".json",
      ".yml",
      ".yaml",
      ".toml",
      ".ini",
      ".env",
      ".md",
      ".txt",
      ".log",
    ];

    function inferType(
      name: string,
      provided?: string | null
    ): "FILE" | "CODE" | "IMAGE" | "ERROR" {
      const p = (provided || "").toUpperCase();
      if (p === "FILE" || p === "CODE" || p === "IMAGE" || p === "ERROR")
        return p as any;
      const lower = name.toLowerCase();
      if (IMAGE_EXTS.some((ext) => lower.endsWith(ext))) return "IMAGE";
      if (CODE_EXTS.some((ext) => lower.endsWith(ext))) return "CODE";
      return "FILE";
    }

    function previewText(raw: string, remainingBudget: number): string {
      if (remainingBudget <= 0) return "[content omitted due to size]";
      // Take up to ~40 lines but also respect remaining character budget
      const lines = raw.split(/\r?\n/);
      const limited = lines.slice(0, 40).join("\n");
      return limited.slice(0, remainingBudget);
    }

    for (const a of rawAttachments) {
      if (!a || typeof a !== "object") continue;
      const name = typeof a.name === "string" ? a.name : "attachment";
      const type = inferType(
        name,
        typeof a.type === "string" ? a.type : undefined
      );
      const rawContent =
        typeof (a as Record<string, unknown>).content === "string"
          ? ((a as Record<string, unknown>).content as string)
          : "";

      attachmentNames.push(name);

      const remaining = Math.max(0, ATTACHMENTS_MAX_CHARS - used);

      if (type === "IMAGE") {
        if (rawContent && remaining > 0) {
          const slice = rawContent.slice(0, Math.min(remaining, 600)); // short caption/alt text
          parts.push(`IMAGE: ${name}\n${slice}`);
          used += slice.length;
        } else if (!rawContent) {
          parts.push(`IMAGE: ${name}\n[no textual description provided]`);
        } else {
          parts.push(`IMAGE: ${name}\n[content omitted due to size]`);
        }
        continue;
      }

      // FILE / CODE / ERROR – treat as text-like and show a compact preview
      if (rawContent) {
        const slice = previewText(rawContent, remaining);
        parts.push(`${type}: ${name}\n${slice}`);
        used += slice.length;
      } else {
        parts.push(`${type}: ${name}`);
      }
    }

    const attachmentsBlock =
      parts.length > 0 ? `\n\nATTACHMENTS:\n${parts.join("\n\n")}` : "";
    const combinedText =
      (typeof text === "string" ? text : "") + attachmentsBlock;

    if (DEBUG) {
      console.debug("Refine payload preview", {
        templateId,
        categoryUsed,
        textPreview: combinedText.slice(0, 400),
        attachments:
          attachmentNames.length > 0
            ? attachmentNames.map((n) => ({ name: n }))
            : [],
      });
    }

    const engine = new RefineEngine({
      apiKey: process.env.OPENROUTER_API_KEY as string,
      maxInputChars: MAX_INPUT_CHARS,
      debug: DEBUG,
    });

    const refineRequest: RefineRequest = {
      text: combinedText,
      templateId,
      category: categoryUsed,
      modelStyle: typeof modelStyle === "string" ? modelStyle : undefined,
      userPlan: userPlanKey,
      abTestVariant: process.env.AB_TEST_ALT === "true" ? "alt" : "control",
      attachments: attachmentNames.length
        ? { files: attachmentNames }
        : undefined,
    };

    const result = await engine.refine(refineRequest);
    const latencyMs = Date.now() - start;

    // 7. Handle Incognito Flag
    if (typeof incognitoRaw === "boolean") {
      effectiveIncognito = incognitoRaw;
    }

    let refineEventId: string | null = null;

    // 8. Log Events (non-blocking)
    try {
      // Legacy event for dashboards
      await prisma.promptEvent.create({
        data: {
          userId: user.id,
          plan: user.plan,
          source: typeof source === "string" ? source : null,
          category: categoryUsed,
          templateId: templateId,
          model: "openrouter",
          modelStyle: typeof modelStyle === "string" ? modelStyle : null,
          latencyMs,
          status: "success",
          inputTokens: result.usage?.inputTokens ?? null,
          outputTokens: result.usage?.outputTokens ?? null,
          incognito: effectiveIncognito,
        },
      });

      // Prompt Lab: refine_events row
      const rawTextLength = typeof text === "string" ? text.length : 0;
      const refinedTextLength =
        typeof result.refinedText === "string" ? result.refinedText.length : 0;
      const promptLabOptIn =
        ((user as any)?.promptLabOptIn as boolean | undefined) ?? false;

      try {
        const refineEvent = await prisma.refineEvent.create({
          data: {
            userId: user.id,
            plan: planForLab,
            category: categoryUsed,
            templateId: getTemplateSlug(templateId),
            templateVersion: templateVersion,
            rawTextLength,
            refinedTextLength,
            // acceptedAt: null, // set later by acceptance flow
            // reverted: false,  // default
            // editDistanceBucket: null, // to be computed later
            promptLabOptIn,
            isIncognito: !!effectiveIncognito,
          },
        });
        refineEventId = refineEvent.id;
      } catch (err) {
        console.error(
          "[RefineEvent] create failed",
          { userId: user.id, templateId, categoryUsed },
          err
        );
      }
    } catch (logErr) {
      console.error("Refine logging error:", logErr);
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
        // Non-breaking extra field: allows extension/UI to update behavior later
        refineEventId: typeof refineEventId === "string" ? refineEventId : null,
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
          model: "openrouter",
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
