/**
 * Model Router for Orbitar refine path (OpenRouter)
 *
 * Centralizes model selection logic based on domain/template/category,
 * user plan, and optional A/B variant. Returns OpenRouter model IDs.
 *
 * Transport target: https://openrouter.ai/api/v1/chat/completions
 */

export type RefineDomain =
  | "default"
  | "coding"
  | "writing"
  | "planning"
  | "research";
export type UserPlanKey = "free" | "light" | "pro" | "enterprise" | "unknown";

export interface ResolveModelParams {
  templateId?: string | null;
  category?: string | null;
  domain?: RefineDomain | null;
  userPlan?: UserPlanKey | null;
  abTestVariant?: "control" | "alt" | null;
}

/**
 * Heuristic: infer domain from category or templateId prefix.
 */
export function inferDomain(params: {
  category?: string | null;
  templateId?: string | null;
}): RefineDomain {
  const cat = (params.category || "").toLowerCase();
  const tid = (params.templateId || "").toLowerCase();

  if (cat === "coding" || tid.startsWith("coding_")) return "coding";
  if (cat === "writing" || tid.startsWith("writing_")) return "writing";
  if (cat === "planning" || tid.startsWith("planning_")) return "planning";
  if (cat === "research" || tid.startsWith("research_")) return "research";
  return "default";
}

/**
 * Resolve model for refine engine calls via OpenRouter.
 *
 * Routing rules:
 * - Coding: qwen/qwen-2.5-coder-32b-instruct
 * - A/B alt (if enabled): anthropic/claude-3.5-haiku
 * - Free/Light (non-coding): prefer meta-llama/llama-3.1-8b-instruct, else qwen/qwen-2.5-7b-instruct
 * - Default: openai/gpt-4o-mini
 */
export function resolveRefineModel(params: ResolveModelParams): string {
  const domain = (
    params.domain && params.domain !== "default"
      ? params.domain
      : inferDomain(params)
  ) as RefineDomain;
  const userPlan: UserPlanKey = (params.userPlan || "unknown") as UserPlanKey;
  const abVariant = params.abTestVariant || null;

  // Alt / A/B path (developer-controlled; opt-in)
  if (abVariant === "alt") {
    return "anthropic/claude-3.5-haiku";
  }

  // Coding-first routing
  if (domain === "coding") {
    return "qwen/qwen-2.5-coder-32b-instruct";
  }

  // Free / Light tier fallback for non-coding
  if (userPlan === "free" || userPlan === "light") {
    // Prefer Llama 3.1 8B; fallback to Qwen 7B if needed (OpenRouter will error if model is unavailable)
    return "meta-llama/llama-3.1-8b-instruct";
    // Alternative fallback you can switch to if needed:
    // return "qwen/qwen-2.5-7b-instruct";
  }

  // Default general-purpose model
  return "openai/gpt-4o-mini";
}
