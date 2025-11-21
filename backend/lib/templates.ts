import OpenAI from "openai";

export type TemplateCategory =
  | "coding"
  | "writing"
  | "planning"
  | "research"
  | "communication"
  | "creative"
  | "general";

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

export const templateRegistry: Record<
  TemplateId,
  { category: TemplateCategory; label: string; description: string }
> = {
  // coding
  coding_feature: {
    category: "coding",
    label: "Implement feature",
    description: "Help implement a new feature or component",
  },
  coding_debug: {
    category: "coding",
    label: "Debug / fix bug",
    description: "Diagnose and fix defects",
  },
  coding_refactor: {
    category: "coding",
    label: "Refactor / improve",
    description: "Refactor for readability, performance, or maintainability",
  },
  coding_tests: {
    category: "coding",
    label: "Write tests",
    description: "Create unit/integration tests",
  },
  coding_explain: {
    category: "coding",
    label: "Explain code",
    description: "Explain what code does and why",
  },

  // writing
  writing_blog: {
    category: "writing",
    label: "Blog post",
    description: "Draft a blog post with outline-first approach",
  },
  writing_twitter_thread: {
    category: "writing",
    label: "Twitter/X thread",
    description: "Compose a concise thread",
  },
  writing_linkedin_post: {
    category: "writing",
    label: "LinkedIn post",
    description: "Professional short-form writing",
  },
  writing_email: {
    category: "writing",
    label: "Email",
    description: "Draft a clear email with purpose and tone",
  },
  writing_landing_page: {
    category: "writing",
    label: "Landing page copy",
    description: "Persuasive page content with structure",
  },

  // research
  research_summarize: {
    category: "research",
    label: "Summarize",
    description: "Structured summaries for skimmability",
  },
  research_compare: {
    category: "research",
    label: "Compare options",
    description: "Pros/cons comparison and recommendation",
  },
  research_extract_points: {
    category: "research",
    label: "Extract key points",
    description: "Pull out bullets, facts, and action items",
  },

  // planning
  planning_roadmap: {
    category: "planning",
    label: "Roadmap / plan",
    description: "Milestones, scope, risks, dependencies",
  },
  planning_feature_spec: {
    category: "planning",
    label: "Feature spec",
    description: "Structured specification for a feature",
  },
  planning_meeting_notes: {
    category: "planning",
    label: "Meeting notes",
    description: "Action items, owners, blockers, follow-ups",
  },

  // communication
  communication_reply: {
    category: "communication",
    label: "Reply",
    description: "Draft a response with desired tone",
  },
  communication_tone_adjust: {
    category: "communication",
    label: "Adjust tone",
    description: "Rewrite keeping content, change tone",
  },

  // creative
  creative_story: {
    category: "creative",
    label: "Story / scene",
    description: "Narrative generation with constraints",
  },
  creative_brainstorm: {
    category: "creative",
    label: "Brainstorm ideas",
    description: "Divergent idea generation",
  },

  // general
  general_general: {
    category: "general",
    label: "General prompt",
    description: "Default general-purpose prompting",
  },
};

export function isTemplateId(
  value: string | undefined | null
): value is TemplateId {
  return !!value && (value as TemplateId) in templateRegistry;
}

export function getTemplateGuidance(templateId?: TemplateId): string {
  const id = templateId || "general_general";
  if (id.startsWith("coding_")) {
    return `
Prioritize coding clarity:
- Specify language, framework, versions, and environment.
- Focus on final code; only minimal explanation if needed.
- Include acceptance criteria, edge cases, and test expectations.
- Map requirements to concrete files, functions, or components.
`.trim();
  }
  if (id.startsWith("writing_")) {
    return `
Prioritize long-form quality:
- Clarify audience and tone (beginner/expert, casual/formal).
- Draft an outline first, then the full piece following it.
- Enforce style constraints (no fluff, concrete examples, clear structure).
`.trim();
  }
  if (id.startsWith("research_")) {
    return `
Prioritize summarization/analysis:
- Clarify purpose (study notes, executive brief, technical recap).
- Emphasize key points, trade-offs, action items, and risks.
- Keep structure skimmable (bullets/headings).
`.trim();
  }
  if (id.startsWith("planning_")) {
    return `
Prioritize planning/spec clarity:
- Define scope, milestones, owners, risks, dependencies.
- Provide checklists and clear acceptance criteria.
- Keep structure actionable and concise.
`.trim();
  }
  if (id.startsWith("communication_")) {
    return `
Prioritize communication intent and tone:
- Respect constraints (audience, tone, brevity, key points).
- Keep actionable, clear, and respectful of context.
- Offer concise alternatives when suitable.
`.trim();
  }
  if (id.startsWith("creative_")) {
    return `
Prioritize creative output:
- Respect style, voice, constraints, and narrative rules.
- Encourage variety and originality while staying on-brief.
- Keep structure coherent and purposeful.
`.trim();
  }
  // general
  return `
Prioritize clarity and structure:
- Make the task explicit and step-by-step.
- Make the expected output format unambiguous.
`.trim();
}

export function buildSystemContent(
  modelStyle?: string,
  templateId?: TemplateId
): string {
  const style = modelStyle || "a general-purpose LLM";
  const templateLabel = templateId
    ? templateRegistry[templateId]?.label ?? templateId
    : "general";
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
- Planning/Communication/Creative: enforce intent-specific rules.

4) Optimize for the target model style
- Assume the model is ${style}.
- Be explicit and unambiguous.
- Keep instructions concise but precise; prefer bullet lists over long paragraphs.

Output rules (critical)
- Return only the final optimized prompt text.
- No explanations, quotes, markdown fences, or commentary.

${getTemplateGuidance(templateId)}
`.trim();
}

const DEFAULT_MODEL: string = process.env.OPENAI_MODEL || "gpt-5-mini";

/**
 * Classify free-form text into a TemplateId + category.
 * Returns general_general on failure, with confidence clamped to [0,1].
 */
export async function classifyTemplate(
  text: string
): Promise<{
  templateId: TemplateId;
  category: TemplateCategory;
  confidence: number;
}> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const ids = Object.keys(templateRegistry) as TemplateId[];
  const idList = ids.join(", ");

  const system = `You are a classifier that maps user tasks to a template ID.
You MUST respond with exactly one JSON object, no prose:
{"templateId":"<one-of: ${idList}>","confidence":0.0-1.0}`;

  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: text },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      temperature: 0,
    });
    const content = completion.choices[0]?.message?.content || "";
    let parsed: any = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      // try to extract JSON substring
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
      if (isTemplateId(parsed.templateId)) templateId = parsed.templateId;
      if (typeof parsed.confidence === "number") {
        confidence = Math.max(0, Math.min(1, parsed.confidence));
      }
    }
    const category = templateRegistry[templateId].category;
    return { templateId, category, confidence };
  } catch (err) {
    // Fallback
    return {
      templateId: "general_general",
      category: "general",
      confidence: 0.5,
    };
  }
}
