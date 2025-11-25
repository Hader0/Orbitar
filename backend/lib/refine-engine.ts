/**
 * Orbitar Refine Engine
 *
 * Central module for prompt refinement. Handles:
 * - Building the system prompt for the refinement model
 * - Processing user input through the LLM
 * - Returning the refined prompt
 *
 * ============================================================================
 * REGRESSION EXAMPLE 1: X Post with Self-Contained Context
 * ============================================================================
 *
 * Template: Writing → Twitter/X Thread
 *
 * User input:
 *   "Make an X post that will go viral when I post it about Orbitar. Below is
 *   the philosophy:
 *   - Orbitar is a prompt engine, not a fancy text box
 *   - The 10-second bar: if output isn't obviously better than what a user could
 *     write in 10 seconds, we failed
 *   - Prompts are treated as products, not one-off strings
 *   - Every refinement must feel obviously superior"
 *
 * EXPECTED refined prompt (self-contained):
 *   "You are a skilled social content writer creating a single viral X post.
 *
 *   Key ideas to convey about Orbitar:
 *   • Orbitar is a prompt engine, not a fancy text box
 *   • The "10-second bar": if the output isn't obviously better than what a
 *     user could write in 10 seconds, Orbitar failed
 *   • Prompts are treated as products, not one-off strings
 *   • Every refinement must feel obviously superior to what the user would
 *     have written themselves
 *
 *   Write a single punchy post under 280 characters that captures this
 *   philosophy. Hook immediately. No hashtags."
 *
 * NOT ACCEPTABLE:
 *   - "Write a post about Orbitar. Mention the 10-second bar and prompts as
 *     products." (missing actual content - downstream model won't know what
 *     these concepts mean)
 *   - Generic "cold traffic → landing page" subject
 *   - Forcing thread format when user asked for single post
 *
 * ============================================================================
 * REGRESSION EXAMPLE 2: Coding Debug with Embedded Context
 * ============================================================================
 *
 * Template: Coding → Debug
 *
 * User input:
 *   "Fix this bug:
 *   FILE: api/routes/user.ts line 47
 *   ERROR: PrismaClientKnownRequestError P2002
 *   Stack: Next.js 14, Prisma 5.12.1, Postgres 15
 *   Happens on duplicate email signup"
 *
 * EXPECTED refined prompt (self-contained):
 *   "You are a senior debugging specialist for Node.js/Prisma applications.
 *
 *   Context:
 *   • FILE: api/routes/user.ts, line 47
 *   • ERROR: PrismaClientKnownRequestError P2002 (unique constraint violation)
 *   • Stack: Next.js 14, Prisma 5.12.1, PostgreSQL 15
 *   • Trigger: duplicate email addresses during signup
 *
 *   Diagnose the root cause and provide a minimal, targeted fix. Include:
 *   1. Root cause explanation
 *   2. Corrected code for the affected section
 *   3. Verification steps to confirm the fix"
 *
 * NOT ACCEPTABLE:
 *   - "Debug a Prisma error" (missing file, error code, stack, trigger details)
 *   - Generic debugging instructions without the specific error context
 *
 * ============================================================================
 */

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import {
  CORE_ORBITAR_CONTRACT,
  USER_PRIORITY_RULES,
  CONTEXT_PACKAGING_RULES,
  QUALITY_BAR,
  DOMAIN_SNIPPETS,
  type DomainKey,
} from "./philosophy-snippets";
import {
  type TemplateId,
  type TemplateCategory,
  templateRegistry,
  getTemplateBehavior,
} from "./templates";

// ============================================================================
// Types
// ============================================================================

export interface RefineRequest {
  /** Raw user text (notes, spec, rough prompt) */
  text: string;
  /** Template ID if explicitly selected */
  templateId?: TemplateId;
  /** Category if selected (used to map to default template) */
  category?: TemplateCategory;
  /** Target model style hint (e.g., "GPT-4", "Claude", "general-purpose LLM") */
  modelStyle?: string;
  /** Metadata about attachments (future use) */
  attachments?: {
    files?: string[];
    codeSnippets?: string[];
    images?: string[];
    errors?: string[];
  };
}

export interface RefineResponse {
  /** The refined prompt text */
  refinedText: string;
  /** The template ID that was used */
  templateIdUsed: TemplateId;
  /** The category of the template used */
  categoryUsed: TemplateCategory;
  /** Token usage info if available */
  usage?: {
    inputTokens: number | null;
    outputTokens: number | null;
  };
  /** Latency in milliseconds */
  latencyMs: number;
}

export interface RefineEngineConfig {
  /** OpenAI API key */
  apiKey: string;
  /** Model to use for refinement */
  model?: string;
  /** Maximum input characters */
  maxInputChars?: number;
  /** Maximum output tokens */
  maxOutputTokens?: number;
  /** Temperature for generation */
  temperature?: number;
  /** Enable debug logging */
  debug?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_MAX_INPUT_CHARS = 8000;
const DEFAULT_MAX_OUTPUT_TOKENS = 512;
const DEFAULT_TEMPERATURE = 0.3;

const MODEL_PRIORITY = ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"];

// ============================================================================
// System Prompt Builder
// ============================================================================

/**
 * Build the system prompt for the refinement model.
 *
 * This is the core of Orbitar's behavior. It instructs the LLM how to
 * transform user notes into a polished system prompt.
 */
export function buildRefineSystemPrompt(
  templateId: TemplateId,
  modelStyle?: string
): string {
  const template = templateRegistry[templateId];
  const behavior = getTemplateBehavior(templateId);
  const domain = template.category as DomainKey;
  const domainSnippet = DOMAIN_SNIPPETS[domain] || DOMAIN_SNIPPETS.general;

  const targetModel = modelStyle || "a general-purpose LLM";

  // Build the system prompt in sections
  const sections: string[] = [];

  // 1. Core identity and contract
  sections.push(CORE_ORBITAR_CONTRACT);

  // 2. USER PRIORITY RULES - CRITICAL: Must come early to ensure user content takes precedence
  sections.push(USER_PRIORITY_RULES);

  // 3. Template-specific behavior (as FORMAT GUIDANCE, not content override)
  sections.push(
    `
Template context (format guidance, not content mandate):
- Template: ${template.label}
- Target model: ${targetModel}
- Suggested role for downstream model: ${behavior.baseRole}
- Typical goal type: ${behavior.goalType}

IMPORTANT: The template provides format/style hints. The SUBJECT and specific OUTPUT TYPE
must come from the user's notes. If the user's request conflicts with template defaults
(e.g., user asks for "single post" but template is "thread"), honor the user's request.
`.trim()
  );

  // 4. Domain-specific guidance
  sections.push(domainSnippet);

  // 5. Self-contained context packaging rules - CRITICAL for ensuring downstream model has all needed context
  sections.push(CONTEXT_PACKAGING_RULES);

  // 6. Quality bar
  sections.push(QUALITY_BAR);

  // 7. Template-specific output hints (as suggestions, not mandates)
  if (behavior.outputHints) {
    sections.push(
      `
Output format guidance (adapt to user's specific request):
${behavior.outputHints}
`.trim()
    );
  }

  // 8. Template-specific quality rules
  if (behavior.qualityRules) {
    sections.push(
      `
Quality rules for this domain:
${behavior.qualityRules}
`.trim()
    );
  }

  // 9. Final instruction with emphasis on self-contained context
  sections.push(
    `
Your task:
Transform the user's text into a single, polished, SELF-CONTAINED system prompt. The downstream model will ONLY see your refined prompt—it will NOT see the original user notes.

Your refined prompt MUST include two intertwined parts:
1. CLEAR INSTRUCTIONS for the downstream model (role, goal, constraints, output format, quality criteria)
2. EMBEDDED CONTEXT from the user's notes (3-10 key bullets summarizing essential facts, concepts, principles)

CRITICAL: The downstream model must be able to perform the task using ONLY your refined prompt.
- Do NOT just say "write about X, mention concept Y"
- DO include the actual content: "Key concept: [definition/explanation from user notes]"

Example of WRONG approach:
  "Write a post about Orbitar. Mention the 10-second bar and prompts as products."

Example of RIGHT approach:
  "You are writing about Orbitar, a prompt engine. Key ideas to convey:
   • The 10-second bar: if Orbitar's output isn't obviously better than what a user could write in 10 seconds, it failed
   • Prompts are treated as products, not one-off strings
   • Every refinement must feel obviously superior to what a user would have written"

REMINDERS:
- The refined prompt must be ABOUT the subject in the user's notes (e.g., if they mention "Orbitar", the prompt must be about Orbitar)
- Key concepts and principle-like statements must appear as ACTUAL CONTENT, not just references
- Honor user's explicit output format requests over template defaults
- Never replace user subjects with generic placeholders

Do not expose internal structure or use meta-language about prompts.
Return only the final prompt text. No explanations, no markdown fences, no commentary.
`.trim()
  );

  return sections.join("\n\n");
}

// ============================================================================
// Refine Engine Class
// ============================================================================

export class RefineEngine {
  private openai: OpenAI;
  private config: Required<RefineEngineConfig>;

  constructor(config: RefineEngineConfig) {
    this.openai = new OpenAI({ apiKey: config.apiKey });
    this.config = {
      apiKey: config.apiKey,
      model: config.model || DEFAULT_MODEL,
      maxInputChars: config.maxInputChars || DEFAULT_MAX_INPUT_CHARS,
      maxOutputTokens: config.maxOutputTokens || DEFAULT_MAX_OUTPUT_TOKENS,
      temperature: config.temperature || DEFAULT_TEMPERATURE,
      debug: config.debug || false,
    };
  }

  /**
   * Refine user text into a polished system prompt.
   */
  async refine(request: RefineRequest): Promise<RefineResponse> {
    const start = Date.now();

    // Resolve template ID
    const templateId = request.templateId || "general_general";
    const category = templateRegistry[templateId].category;

    // Build system prompt
    const systemPrompt = buildRefineSystemPrompt(
      templateId,
      request.modelStyle
    );

    // Prepare user text (truncate if too long)
    const userText =
      request.text.length > this.config.maxInputChars
        ? request.text.slice(-this.config.maxInputChars)
        : request.text;

    // Build messages
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userText },
    ];

    // Try models in priority order
    const modelsToTry = [
      this.config.model,
      ...MODEL_PRIORITY.filter((m) => m !== this.config.model),
    ];

    let refinedText: string | undefined;
    let inputTokens: number | null = null;
    let outputTokens: number | null = null;
    let lastError: unknown;

    for (const model of modelsToTry) {
      try {
        if (this.config.debug) {
          console.debug(`RefineEngine: Attempting model ${model}`);
        }

        const completion = await this.openai.chat.completions.create({
          model,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxOutputTokens,
        });

        refinedText = completion.choices[0]?.message?.content || undefined;
        inputTokens = completion.usage?.prompt_tokens ?? null;
        outputTokens = completion.usage?.completion_tokens ?? null;

        if (this.config.debug) {
          console.debug(`RefineEngine: Success with model ${model}`);
        }

        break;
      } catch (err) {
        lastError = err;
        if (this.config.debug) {
          console.warn(`RefineEngine: Model ${model} failed:`, err);
        }
        continue;
      }
    }

    if (!refinedText) {
      // All models failed, try REST fallback
      refinedText = await this.restFallback(messages, modelsToTry);
    }

    // Final fallback: return original text
    if (!refinedText) {
      console.error("RefineEngine: All attempts failed", lastError);
      refinedText = request.text;
    }

    const latencyMs = Date.now() - start;

    return {
      refinedText,
      templateIdUsed: templateId,
      categoryUsed: category,
      usage: { inputTokens, outputTokens },
      latencyMs,
    };
  }

  /**
   * REST API fallback when SDK fails.
   */
  private async restFallback(
    messages: ChatCompletionMessageParam[],
    models: string[]
  ): Promise<string | undefined> {
    for (const model of models) {
      try {
        if (this.config.debug) {
          console.debug(`RefineEngine: REST fallback with model ${model}`);
        }

        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages,
              temperature: this.config.temperature,
              max_tokens: this.config.maxOutputTokens,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          return data?.choices?.[0]?.message?.content ?? undefined;
        }
      } catch (err) {
        if (this.config.debug) {
          console.warn(`RefineEngine: REST fallback failed for ${model}:`, err);
        }
        continue;
      }
    }
    return undefined;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a RefineEngine instance with default configuration from environment.
 */
export function createRefineEngine(): RefineEngine {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new RefineEngine({
    apiKey,
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    debug: process.env.DEBUG === "true",
  });
}
