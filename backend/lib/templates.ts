/**
 * Orbitar Template Registry
 *
 * Strongly typed template definitions with behavioral configuration.
 * Templates are behavior presets, not visible output forms.
 */

import OpenAI from "openai";

// ============================================================================
// Types
// ============================================================================

export type TemplateCategory =
  | "coding"
  | "writing"
  | "planning"
  | "research"
  | "communication"
  | "creative"
  | "general";

export type PlanName = "free" | "builder" | "pro";

export type TemplateStatus = "lab" | "experimental" | "beta" | "ga";

export type TemplateId =
  | "coding_feature"
  | "coding_debug"
  | "coding_refactor"
  | "coding_tests"
  | "coding_explain"
  | "writing_blog"
  | "writing_twitter_thread"
  | "writing_linkedin_post"
  | "writing_email"
  | "writing_landing_page"
  | "research_summarize"
  | "research_compare"
  | "research_extract_points"
  | "planning_roadmap"
  | "planning_feature_spec"
  | "planning_meeting_notes"
  | "communication_reply"
  | "communication_tone_adjust"
  | "creative_story"
  | "creative_brainstorm"
  | "general_general";

/**
 * Template metadata - visible to users and used for UI/API.
 */
export interface TemplateMetadata {
  category: TemplateCategory;
  label: string;
  description: string;
  status: TemplateStatus;
  minPlan: PlanName;
}

/**
 * Template behavioral config - used internally by the refine engine.
 * Defines how this template should bias the refinement process.
 */
export interface TemplateBehavior {
  /** The role the downstream model should assume */
  baseRole: string;
  /** Primary type of goal this template optimizes for */
  goalType: string;
  /** Hints about what context matters for this template */
  contextHints?: string;
  /** Expected output format for the downstream model */
  outputHints?: string;
  /** Domain-specific quality rules */
  qualityRules?: string;
}

// ============================================================================
// Template Registry
// ============================================================================

export const templateRegistry: Record<TemplateId, TemplateMetadata> = {
  // Coding templates
  coding_feature: {
    category: "coding",
    label: "Implement feature",
    description: "Help implement a new feature or component",
    status: "ga",
    minPlan: "free",
  },
  coding_debug: {
    category: "coding",
    label: "Debug / fix bug",
    description: "Diagnose and fix defects",
    status: "ga",
    minPlan: "free",
  },
  coding_refactor: {
    category: "coding",
    label: "Refactor / improve",
    description: "Refactor for readability, performance, or maintainability",
    status: "ga",
    minPlan: "builder",
  },
  coding_tests: {
    category: "coding",
    label: "Write tests",
    description: "Create unit/integration tests",
    status: "ga",
    minPlan: "builder",
  },
  coding_explain: {
    category: "coding",
    label: "Explain code",
    description: "Explain what code does and why",
    status: "ga",
    minPlan: "free",
  },

  // Writing templates
  writing_blog: {
    category: "writing",
    label: "Blog post",
    description: "Draft a blog post with outline-first approach",
    status: "ga",
    minPlan: "free",
  },
  writing_twitter_thread: {
    category: "writing",
    label: "Twitter/X thread",
    description: "Compose a concise thread",
    status: "ga",
    minPlan: "free",
  },
  writing_linkedin_post: {
    category: "writing",
    label: "LinkedIn post",
    description: "Professional short-form writing",
    status: "ga",
    minPlan: "free",
  },
  writing_email: {
    category: "writing",
    label: "Email",
    description: "Draft a clear email with purpose and tone",
    status: "ga",
    minPlan: "free",
  },
  writing_landing_page: {
    category: "writing",
    label: "Landing page copy",
    description: "Persuasive page content with structure",
    status: "ga",
    minPlan: "builder",
  },

  // Research templates
  research_summarize: {
    category: "research",
    label: "Summarize",
    description: "Structured summaries for skimmability",
    status: "ga",
    minPlan: "free",
  },
  research_compare: {
    category: "research",
    label: "Compare options",
    description: "Pros/cons comparison and recommendation",
    status: "ga",
    minPlan: "builder",
  },
  research_extract_points: {
    category: "research",
    label: "Extract key points",
    description: "Pull out bullets, facts, and action items",
    status: "ga",
    minPlan: "free",
  },

  // Planning templates
  planning_roadmap: {
    category: "planning",
    label: "Roadmap / plan",
    description: "Milestones, scope, risks, dependencies",
    status: "ga",
    minPlan: "free",
  },
  planning_feature_spec: {
    category: "planning",
    label: "Feature spec",
    description: "Structured specification for a feature",
    status: "ga",
    minPlan: "builder",
  },
  planning_meeting_notes: {
    category: "planning",
    label: "Meeting notes",
    description: "Action items, owners, blockers, follow-ups",
    status: "ga",
    minPlan: "free",
  },

  // Communication templates
  communication_reply: {
    category: "communication",
    label: "Reply",
    description: "Draft a response with desired tone",
    status: "ga",
    minPlan: "free",
  },
  communication_tone_adjust: {
    category: "communication",
    label: "Adjust tone",
    description: "Rewrite keeping content, change tone",
    status: "ga",
    minPlan: "free",
  },

  // Creative templates
  creative_story: {
    category: "creative",
    label: "Story / scene",
    description: "Narrative generation with constraints",
    status: "ga",
    minPlan: "free",
  },
  creative_brainstorm: {
    category: "creative",
    label: "Brainstorm ideas",
    description: "Divergent idea generation",
    status: "ga",
    minPlan: "free",
  },

  // General templates
  general_general: {
    category: "general",
    label: "General prompt",
    description: "Default general-purpose prompting",
    status: "ga",
    minPlan: "free",
  },
};

// ============================================================================
// Template Behaviors
// ============================================================================

const templateBehaviors: Record<TemplateId, TemplateBehavior> = {
  // Coding behaviors
  coding_feature: {
    baseRole:
      "a senior software engineer who writes clean, maintainable, production-ready code",
    goalType: "implement a new feature or component",
    contextHints:
      "Preserve file paths, function names, component names, API signatures, and tech stack details",
    outputHints:
      "Expect working code with clear file structure, comments where non-obvious, and consideration of edge cases",
    qualityRules:
      "Code should be idiomatic for the specified language/framework. Include error handling. Consider testability.",
  },
  coding_debug: {
    baseRole:
      "a senior debugging specialist who systematically diagnoses and fixes issues",
    goalType: "diagnose and fix a bug or error",
    contextHints:
      "Preserve error messages, stack traces, file names, line numbers, and reproduction steps verbatim",
    outputHints:
      "Provide root cause analysis, the fix, and verification steps. Include code changes as diffs or complete files.",
    qualityRules:
      "Explain the root cause. Propose minimal, targeted fixes. Avoid introducing new issues.",
  },
  coding_refactor: {
    baseRole:
      "a senior engineer focused on code quality, readability, and maintainability",
    goalType: "refactor code for better structure, performance, or clarity",
    contextHints:
      "Preserve existing behavior contracts and API surfaces unless explicitly changing them",
    outputHints:
      "Provide refactored code with explanations of what changed and why. Preserve tests or update them.",
    qualityRules:
      "Maintain backward compatibility unless told otherwise. Improve without over-engineering.",
  },
  coding_tests: {
    baseRole:
      "a test engineer who writes comprehensive, maintainable test suites",
    goalType: "write tests for code",
    contextHints:
      "Preserve function signatures, expected behaviors, and edge cases from the source code",
    outputHints:
      "Provide complete test files with clear test names, setup, assertions, and edge case coverage",
    qualityRules:
      "Tests should be isolated, fast, and deterministic. Cover happy paths and edge cases.",
  },
  coding_explain: {
    baseRole:
      "a senior engineer who explains complex code clearly to developers of varying levels",
    goalType: "explain what code does and how it works",
    contextHints:
      "Preserve code structure and key implementation details for reference",
    outputHints:
      "Provide clear explanations with sections for overview, key components, and important details",
    qualityRules:
      "Explain the 'why' not just the 'what'. Use concrete examples. Adapt depth to audience.",
  },

  // Writing behaviors
  // NOTE: All writing templates define FORMAT and STYLE guidance.
  // The SUBJECT always comes from the user's notes—never replace user subject with generic topics.
  writing_blog: {
    baseRole:
      "a skilled technical or content writer who creates engaging, well-structured articles about the subject provided by the user",
    goalType: "write a blog post or article about the user's specified topic",
    contextHints:
      "Preserve the user's subject matter, key messages, examples, and audience context. Note any SEO or formatting requirements. The topic MUST come from user notes.",
    outputHints:
      "First outline, then draft. Include intro, body sections, and conclusion. Specify word count if given. The content must be about the user's subject.",
    qualityRules:
      "No fluff. Use concrete examples from the user's notes. Match specified tone. Hook the reader early. Never replace user's subject with generic topics.",
  },
  writing_twitter_thread: {
    baseRole:
      "a social content strategist and viral X/Twitter writer who understands platform dynamics, attention psychology, and concise persuasive storytelling",
    goalType:
      "write X/Twitter content (thread OR single post, depending on user request) about the subject defined in the user's TOP-LEVEL INSTRUCTION",
    contextHints:
      "CRITICAL: The user's top-level instruction (before 'Below is...', 'Here's the...') defines the subject. Reference docs are CONTEXT TO MINE, not the task. Preserve user's subject matter (e.g., 'Orbitar'), key concepts, slogans, product/brand names. If user says 'single post' or 'viral post', produce exactly that, not a thread. If user mentions style ('viral', 'controversial', 'educational'), encode it as explicit tone guidance.",
    outputHints:
      "Default: numbered tweets, first hooks, last has CTA, each under 280 chars. BUT if user requests 'single post'/'one tweet'/'viral post', produce exactly one tweet. ALWAYS include a Key ideas/Context block in the refined prompt with 3-5 actual concept definitions from user's reference docs. Audience should be explicit if inferable (developers, founders, etc.).",
    qualityRules:
      "Punchy hook in first tweet/post. Scannable, no filler. NEVER replace user's subject (e.g., 'Orbitar') with generic topics. NEVER confuse example text inside reference docs with the main task. Key concepts like '10-second bar', 'prompts as products' must appear as EMBEDDED CONTENT with their definitions, not just as term references. Preserve strong slogans verbatim: 'transforms messy user intent into laser-guided AI instructions'.",
  },
  writing_linkedin_post: {
    baseRole:
      "a professional content creator who writes engaging LinkedIn content about the subject provided by the user",
    goalType: "write a LinkedIn post about the user's specified topic",
    contextHints:
      "Preserve the user's subject matter, professional context, key achievements or insights, and audience details. Never substitute user's topic with generic business content.",
    outputHints:
      "Hook in first line. Use line breaks for readability. End with engagement prompt or CTA. Content must be about user's subject.",
    qualityRules:
      "Professional but human. Avoid corporate jargon. Value-first, promotion-second. NEVER replace user's subject with generic topics.",
  },
  writing_email: {
    baseRole:
      "a clear, effective communicator who writes emails that get results",
    goalType: "write an email about the user's specified purpose",
    contextHints:
      "Preserve recipient context, relationship, purpose, and any constraints on tone or length. The email subject/purpose comes from user notes.",
    outputHints:
      "Subject line, greeting, body with clear ask, professional close. Note formality level. Content must address user's specified purpose.",
    qualityRules:
      "Clear purpose in first paragraph. One clear ask. Easy to skim. Appropriate formality. Never substitute user's topic.",
  },
  writing_landing_page: {
    baseRole:
      "a conversion-focused copywriter who writes persuasive landing pages for the product/service specified by the user",
    goalType:
      "write landing page copy for the user's specified product/service",
    contextHints:
      "Preserve the user's product/service name and details, target audience, key benefits, and any brand voice guidelines. NEVER replace with generic 'product' or 'service'.",
    outputHints:
      "Hero headline + subhead, problem/solution sections, features/benefits, social proof, CTA. All content must be about the user's specified product/service.",
    qualityRules:
      "Benefits over features. Clear value prop in 5 seconds. Strong CTA. Address objections. NEVER substitute user's product name with generic placeholders.",
  },

  // Research behaviors
  research_summarize: {
    baseRole:
      "a research analyst who distills complex information into clear summaries",
    goalType: "summarize content for quick understanding",
    contextHints:
      "Preserve source attribution and key data points. Note summary purpose (decision, learning, sharing)",
    outputHints:
      "Executive summary followed by key points as bullets. Include takeaways and action items if relevant.",
    qualityRules:
      "Accuracy first. Preserve nuance on important points. Make it skimmable.",
  },
  research_compare: {
    baseRole:
      "an analyst who objectively evaluates options and provides recommendations",
    goalType: "compare options and provide a recommendation",
    contextHints:
      "Preserve all options being compared, evaluation criteria, and any constraints",
    outputHints:
      "Comparison table or structured breakdown. Pros/cons for each. Clear recommendation with rationale.",
    qualityRules:
      "Fair comparison. Acknowledge trade-offs. Recommendation should match stated criteria.",
  },
  research_extract_points: {
    baseRole:
      "a detail-oriented analyst who extracts actionable information from content",
    goalType: "extract key points, facts, and action items",
    contextHints:
      "Preserve source context and what types of points to prioritize (facts, decisions, action items)",
    outputHints:
      "Categorized bullet lists: key facts, decisions made, action items with owners, open questions",
    qualityRules:
      "Be comprehensive but not redundant. Attribute claims. Highlight uncertainties.",
  },

  // Planning behaviors
  planning_roadmap: {
    baseRole: "a project lead who creates clear, actionable project plans",
    goalType: "create a roadmap or project plan",
    contextHints:
      "Preserve scope, timeline constraints, dependencies, and any existing milestones",
    outputHints:
      "Phases with milestones, key deliverables, dependencies, risks, and success criteria",
    qualityRules:
      "Realistic timelines. Clear ownership. Explicit dependencies. Acknowledge risks.",
  },
  planning_feature_spec: {
    baseRole:
      "a product manager who writes clear, complete feature specifications",
    goalType: "write a feature specification",
    contextHints:
      "Preserve user stories, requirements, constraints, and any technical considerations",
    outputHints:
      "Problem statement, proposed solution, requirements (functional + non-functional), acceptance criteria, out of scope",
    qualityRules:
      "Testable acceptance criteria. Clear scope boundaries. Consider edge cases.",
  },
  planning_meeting_notes: {
    baseRole:
      "an organized professional who captures meetings clearly and completely",
    goalType: "create structured meeting notes",
    contextHints:
      "Preserve attendees, decisions made, action items, and any blockers discussed",
    outputHints:
      "Attendees, agenda items discussed, decisions made, action items (who/what/when), follow-ups",
    qualityRules:
      "Action items must have owners and deadlines. Decisions should have rationale. Be concise.",
  },

  // Communication behaviors
  communication_reply: {
    baseRole: "a thoughtful communicator who crafts appropriate responses",
    goalType: "draft a reply to a message",
    contextHints:
      "Preserve the original message context, relationship, and any specific points to address",
    outputHints:
      "Reply that addresses all points raised. Match appropriate tone and length.",
    qualityRules:
      "Address all points. Appropriate formality. Clear next steps if applicable.",
  },
  communication_tone_adjust: {
    baseRole: "a skilled editor who adjusts tone while preserving meaning",
    goalType: "rewrite content with a different tone",
    contextHints:
      "Preserve the core message and all key information. Note target tone clearly.",
    outputHints:
      "Rewritten content with the new tone. Same information, different delivery.",
    qualityRules:
      "Don't lose information. Match target tone consistently. Preserve intent.",
  },

  // Creative behaviors
  creative_story: {
    baseRole: "a creative writer who crafts engaging narratives",
    goalType: "write a story, scene, or narrative content",
    contextHints:
      "Preserve character details, setting, plot points, and any style/genre constraints",
    outputHints:
      "Narrative prose following the specified format (scene, chapter, short story, etc.)",
    qualityRules:
      "Show don't tell. Consistent voice. Respect genre conventions. Honor creative constraints.",
  },
  creative_brainstorm: {
    baseRole: "a creative strategist who generates diverse, innovative ideas",
    goalType: "brainstorm ideas or concepts",
    contextHints:
      "Preserve the problem space, constraints, and any direction for the ideas",
    outputHints:
      "List of distinct ideas with brief descriptions. Variety in approach and feasibility.",
    qualityRules:
      "Quantity and variety. Include obvious and non-obvious ideas. Brief 'why it could work' for each.",
  },

  // General behavior
  general_general: {
    baseRole:
      "a prompt designer who manufactures reusable, domain-agnostic system prompts (never the final answers)",
    goalType:
      "produce a self-contained system prompt that directs a downstream model to accomplish the user's goal",
    contextHints:
      "Infer domain and task type from the user's top-level instruction; mine appended documents for key concepts. Always embed a short 'Context' block (3–10 bullets) with actual content the downstream model must see.",
    outputHints:
      "Define role, goal, constraints, and a concrete output contract for the downstream model (format, sections, length bounds). If the user asks 'Give me X' / 'Write Y' / 'Generate Z', rewrite that as the downstream model's goal and specify the deliverable precisely.",
    qualityRules:
      "NEVER perform the task yourself (no long lists, full articles/emails, or large code). Small illustrative examples (1–3 items/snippets) allowed only to clarify intent and must not satisfy the request. On minimal-input tasks (e.g., only a topic), do NOT invent domain-specific facts or statistics in the Context block—express structure (audience, tone, sections or topics to cover) rather than factual claims the user did not provide. Quality fail if the refined prompt contains a full answer that fulfills the user's ask.",
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

export function isTemplateId(
  value: string | undefined | null
): value is TemplateId {
  return !!value && (value as TemplateId) in templateRegistry;
}

/**
 * Get the behavioral configuration for a template.
 */
export function getTemplateBehavior(templateId: TemplateId): TemplateBehavior {
  return templateBehaviors[templateId] || templateBehaviors.general_general;
}

/**
 * Get all templates for a given category.
 */
export function getTemplatesForCategory(
  category: TemplateCategory
): Array<{ id: TemplateId; metadata: TemplateMetadata }> {
  return (Object.entries(templateRegistry) as [TemplateId, TemplateMetadata][])
    .filter(([, meta]) => meta.category === category)
    .map(([id, metadata]) => ({ id, metadata }));
}

/**
 * Map a category to its default template ID.
 */
export function getCategoryDefaultTemplate(
  category: TemplateCategory
): TemplateId {
  const defaults: Record<TemplateCategory, TemplateId> = {
    coding: "coding_feature",
    writing: "writing_blog",
    research: "research_summarize",
    planning: "planning_roadmap",
    communication: "communication_reply",
    creative: "creative_brainstorm",
    general: "general_general",
  };
  return defaults[category] || "general_general";
}

// ============================================================================
// Template Classification
// ============================================================================

const DEFAULT_MODEL: string = process.env.OPENAI_MODEL || "gpt-5-mini";
const ENABLE_LLM_CLASSIFIER = process.env.ENABLE_LLM_CLASSIFIER === "true";

/**
 * Lightweight heuristic classifier to improve suggestions without a model call.
 * Returns a non-general TemplateId when clear cues are present, else null.
 */
function heuristicTemplate(text: string): {
  templateId: TemplateId;
  category: TemplateCategory;
  confidence: number;
} | null {
  const t = text.toLowerCase();

  const has = (...keys: string[]) => keys.some((k) => t.includes(k));

  // --- Coding ---
  const isCodingContext = has(
    "code",
    "script",
    "typescript",
    "javascript",
    "node.js",
    "next.js",
    "react",
    "api",
    "function",
    "class",
    "component",
    "bug",
    "error",
    "stack trace",
    "sql",
    "query"
  );

  if (has("test", "unit test", "jest", "vitest", "playwright", "cypress")) {
    return { templateId: "coding_tests", category: "coding", confidence: 0.9 };
  }
  if (has("debug", "fix", "bug", "error", "stack trace")) {
    return { templateId: "coding_debug", category: "coding", confidence: 0.9 };
  }
  if (has("refactor", "clean up", "rewrite", "optimize")) {
    return {
      templateId: "coding_refactor",
      category: "coding",
      confidence: 0.9,
    };
  }
  if (isCodingContext) {
    return {
      templateId: "coding_feature",
      category: "coding",
      confidence: 0.9,
    };
  }

  // --- Writing / Thread ---
  if (has("twitter thread", "thread on twitter", "x.com", "tweet thread")) {
    return {
      templateId: "writing_twitter_thread",
      category: "writing",
      confidence: 0.9,
    };
  }
  if (has("blog post", "article")) {
    return { templateId: "writing_blog", category: "writing", confidence: 0.9 };
  }
  if (has("linkedin post", "linkedin")) {
    return {
      templateId: "writing_linkedin_post",
      category: "writing",
      confidence: 0.9,
    };
  }
  if (has("email", "cold email", "outreach email")) {
    return {
      templateId: "writing_email",
      category: "writing",
      confidence: 0.9,
    };
  }
  if (has("landing page", "hero section")) {
    return {
      templateId: "writing_landing_page",
      category: "writing",
      confidence: 0.9,
    };
  }

  // --- Planning / Meetings / Notes ---
  if (has("meeting notes", "action items", "agenda", "minutes")) {
    return {
      templateId: "planning_meeting_notes",
      category: "planning",
      confidence: 0.9,
    };
  }
  if (has("feature spec", "specification", "prd", "requirements")) {
    return {
      templateId: "planning_feature_spec",
      category: "planning",
      confidence: 0.9,
    };
  }
  if (has("roadmap", "plan", "milestones", "timeline")) {
    return {
      templateId: "planning_roadmap",
      category: "planning",
      confidence: 0.9,
    };
  }

  // --- Research / Summarize ---
  if (has("summarize", "summary", "tl;dr")) {
    return {
      templateId: "research_summarize",
      category: "research",
      confidence: 0.9,
    };
  }
  if (has("compare", "pros and cons")) {
    return {
      templateId: "research_compare",
      category: "research",
      confidence: 0.9,
    };
  }
  if (has("extract key points", "key takeaways")) {
    return {
      templateId: "research_extract_points",
      category: "research",
      confidence: 0.9,
    };
  }

  // --- Communication ---
  if (
    has(
      "reply to this",
      "respond to this",
      "answer this email",
      "answer this message"
    )
  ) {
    return {
      templateId: "communication_reply",
      category: "communication",
      confidence: 0.9,
    };
  }
  if (has("more polite", "more formal", "more casual", "adjust tone")) {
    return {
      templateId: "communication_tone_adjust",
      category: "communication",
      confidence: 0.9,
    };
  }

  // --- Creative ---
  if (has("story", "scene", "character", "worldbuilding", "plot")) {
    return {
      templateId: "creative_story",
      category: "creative",
      confidence: 0.9,
    };
  }
  if (has("brainstorm ideas", "ideas for", "concepts for")) {
    return {
      templateId: "creative_brainstorm",
      category: "creative",
      confidence: 0.9,
    };
  }

  return null;
}

/**
 * Classify free-form text into a TemplateId + category.
 * Returns general_general on failure, with confidence clamped to [0,1].
 * Uses heuristics by default; LLM classifier is gated by ENABLE_LLM_CLASSIFIER.
 */
export async function classifyTemplate(text: string): Promise<{
  templateId: TemplateId;
  category: TemplateCategory;
  confidence: number;
}> {
  // 1) Try fast heuristic first (no model call)
  const h = heuristicTemplate(text);
  if (h) return h;

  // 2) Gate LLM classifier behind env flag (default disabled for speed/cost)
  if (!ENABLE_LLM_CLASSIFIER) {
    return {
      templateId: "general_general",
      category: "general",
      confidence: 0.5,
    };
  }

  // 3) If no OpenAI key, fall back to general
  if (!process.env.OPENAI_API_KEY) {
    return {
      templateId: "general_general",
      category: "general",
      confidence: 0.5,
    };
  }

  // 4) LLM-based classifier (only when explicitly enabled)
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const system = `You are a classifier that maps user instructions to a templateId.

You MUST respond with exactly one JSON object, no extra text, in this form:
{"templateId": "...", "confidence": 0.0-1.0}

Allowed templateId values:
- "coding_feature", "coding_debug", "coding_refactor", "coding_tests", "coding_explain"
- "writing_blog", "writing_twitter_thread", "writing_linkedin_post", "writing_email", "writing_landing_page"
- "research_summarize", "research_compare", "research_extract_points"
- "planning_roadmap", "planning_feature_spec", "planning_meeting_notes"
- "communication_reply", "communication_tone_adjust"
- "creative_story", "creative_brainstorm"
- "general_general"

Guidance:
- If the text clearly describes writing code, scripts, APIs, debugging, tests, or refactoring → choose a "coding_*" template.
- If it clearly describes a blog/article, email, social post, or marketing copy → choose a "writing_*" template.
- If it clearly describes summarizing, extracting points, or comparing → choose a "research_*" template.
- If it clearly describes plans, specs, roadmaps, or meeting notes → choose a "planning_*" template.
- Only use "general_general" when none of the more specific templates clearly applies.
- Do not invent new templateId values.`;

  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: text },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      temperature: 0,
      max_tokens: 128,
    });
    const content = completion.choices[0]?.message?.content || "";
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          /* ignore */
        }
      }
    }
    let templateId: TemplateId = "general_general";
    let confidence = 0.5;
    if (parsed && typeof parsed === "object") {
      const p = parsed as Record<string, unknown>;
      if (isTemplateId(p.templateId as string)) {
        templateId = p.templateId as TemplateId;
      }
      if (typeof p.confidence === "number") {
        confidence = Math.max(0, Math.min(1, p.confidence));
      }
    }

    const category = templateRegistry[templateId].category;
    return { templateId, category, confidence };
  } catch (_err) {
    return {
      templateId: "general_general",
      category: "general",
      confidence: 0.5,
    };
  }
}

// ============================================================================
// Legacy Exports (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use getTemplateBehavior and buildRefineSystemPrompt instead.
 * Kept for backward compatibility during migration.
 */
export function getTemplateGuidance(templateId?: TemplateId): string {
  const id = templateId || "general_general";
  const behavior = getTemplateBehavior(id);

  return `
Template: ${templateRegistry[id].label}
Role: ${behavior.baseRole}
Goal type: ${behavior.goalType}
${behavior.contextHints ? `Context hints: ${behavior.contextHints}` : ""}
${behavior.outputHints ? `Output hints: ${behavior.outputHints}` : ""}
${behavior.qualityRules ? `Quality rules: ${behavior.qualityRules}` : ""}
`.trim();
}

/**
 * @deprecated Use buildRefineSystemPrompt from refine-engine.ts instead.
 * Kept for backward compatibility during migration.
 */
export function buildSystemContent(
  modelStyle?: string,
  templateId?: TemplateId
): string {
  const id = templateId || "general_general";
  const style = modelStyle || "a general-purpose LLM";
  const template = templateRegistry[id];
  const behavior = getTemplateBehavior(id);

  return `
You are Orbitar. Transform rough notes into a polished system prompt for ${style}.

Template: ${template.label}
Base role: ${behavior.baseRole}
Goal: ${behavior.goalType}

Your output is the final prompt text. It must:
- Define a clear role/perspective for the downstream model
- State the goal explicitly
- Present context compactly
- State constraints clearly
- Define expected output format
- Include quality criteria

Critical rules:
- Write directly to the downstream model ("You are…")
- Never mention "this prompt", "template", or "scaffold"
- Never use visible schema labels like "Role:", "Goal:", etc.
- Preserve domain terms and specific details

Return only the final prompt text.
`.trim();
}

/**
 * @deprecated Use buildRefineSystemPrompt from refine-engine.ts instead.
 */
export function buildSystemContentLite(
  modelStyle?: string,
  templateId?: TemplateId
): string {
  return buildSystemContent(modelStyle, templateId);
}
