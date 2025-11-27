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
/** Centralized normalized plan keys used for Prompt Lab and logging */
export type PlanKey = "free" | "light" | "pro" | "admin";

export type TemplateStatus = "lab" | "experimental" | "beta" | "ga";

export type TemplateId =
  | "coding_feature"
  | "coding_debug"
  | "coding_refactor"
  | "coding_review"
  | "coding_optimize"
  | "coding_documentation"
  | "coding_api"
  | "coding_database"
  | "coding_architecture"
  | "coding_security"
  | "coding_migration"
  | "coding_website"
  | "coding_tests"
  | "coding_explain"
  | "writing_blog"
  | "writing_newsletter"
  | "writing_doc"
  | "writing_press_release"
  | "writing_product_desc"
  | "writing_twitter_thread"
  | "writing_linkedin_post"
  | "writing_email"
  | "writing_landing_page"
  | "research_summarize"
  | "research_analysis"
  | "research_trends"
  | "research_competitive"
  | "research_compare"
  | "research_extract_points"
  | "planning_roadmap"
  | "planning_project"
  | "planning_strategy"
  | "planning_timeline"
  | "planning_feature_spec"
  | "planning_meeting_notes"
  | "communication_reply"
  | "communication_translate"
  | "communication_simplify"
  | "communication_professional"
  | "communication_tone_adjust"
  | "creative_story"
  | "creative_slogan"
  | "creative_poem"
  | "creative_script"
  | "creative_naming"
  | "creative_worldbuilding"
  | "creative_character"
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
  coding_review: {
    category: "coding",
    label: "Code review",
    description: "Review code for correctness, clarity, and maintainability",
    status: "beta",
    minPlan: "free",
  },
  coding_optimize: {
    category: "coding",
    label: "Optimize performance",
    description:
      "Improve performance, reduce complexity, and remove bottlenecks",
    status: "beta",
    minPlan: "free",
  },
  coding_documentation: {
    category: "coding",
    label: "Write documentation",
    description:
      "Generate or improve technical documentation for code and APIs",
    status: "beta",
    minPlan: "free",
  },
  coding_api: {
    category: "coding",
    label: "Design API",
    description: "Design or refine API surfaces, contracts, and endpoints",
    status: "beta",
    minPlan: "free",
  },
  coding_database: {
    category: "coding",
    label: "Database schema",
    description: "Design or evolve database schemas and migrations",
    status: "beta",
    minPlan: "free",
  },
  coding_architecture: {
    category: "coding",
    label: "System architecture",
    description: "Define or evolve system architecture and high-level design",
    status: "beta",
    minPlan: "free",
  },
  coding_security: {
    category: "coding",
    label: "Security review",
    description: "Review code and flows for security issues and mitigations",
    status: "beta",
    minPlan: "free",
  },
  coding_migration: {
    category: "coding",
    label: "Code migration",
    description:
      "Plan and implement migrations between versions, stacks, or patterns",
    status: "beta",
    minPlan: "free",
  },
  coding_website: {
    category: "coding",
    label: "Build website",
    description: "Implement or refine web UI pages and frontend experiences",
    status: "beta",
    minPlan: "free",
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
  writing_newsletter: {
    category: "writing",
    label: "Newsletter",
    description: "Draft newsletter content with clear structure and hooks",
    status: "beta",
    minPlan: "free",
  },
  writing_doc: {
    category: "writing",
    label: "Documentation",
    description: "Write or refine product or technical documentation",
    status: "beta",
    minPlan: "free",
  },
  writing_press_release: {
    category: "writing",
    label: "Press release",
    description: "Craft structured press releases with strong narratives",
    status: "beta",
    minPlan: "free",
  },
  writing_product_desc: {
    category: "writing",
    label: "Product description",
    description:
      "Write compelling product descriptions with benefits and details",
    status: "beta",
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
  research_analysis: {
    category: "research",
    label: "Market analysis",
    description: "Analyze markets, segments, and competitive positioning",
    status: "beta",
    minPlan: "free",
  },
  research_trends: {
    category: "research",
    label: "Trend analysis",
    description: "Identify and explain trends over time from source material",
    status: "beta",
    minPlan: "free",
  },
  research_competitive: {
    category: "research",
    label: "Competitive research",
    description: "Compare competitors, positioning, and strengths/weaknesses",
    status: "beta",
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
  planning_project: {
    category: "planning",
    label: "Project plan",
    description: "Create structured project plans with phases and owners",
    status: "beta",
    minPlan: "free",
  },
  planning_strategy: {
    category: "planning",
    label: "Strategy document",
    description: "Outline strategy documents with goals, levers, and risks",
    status: "beta",
    minPlan: "free",
  },
  planning_timeline: {
    category: "planning",
    label: "Timeline / milestones",
    description: "Design timelines with milestones, dependencies, and dates",
    status: "beta",
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
  communication_translate: {
    category: "communication",
    label: "Translate",
    description:
      "Translate text between languages while preserving meaning and tone",
    status: "beta",
    minPlan: "free",
  },
  communication_simplify: {
    category: "communication",
    label: "Simplify language",
    description: "Rewrite text in clearer, simpler language",
    status: "beta",
    minPlan: "free",
  },
  communication_professional: {
    category: "communication",
    label: "Make professional",
    description:
      "Polish text into a more professional tone while preserving content",
    status: "beta",
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
  creative_slogan: {
    category: "creative",
    label: "Slogan / tagline",
    description: "Generate memorable slogans and taglines",
    status: "beta",
    minPlan: "free",
  },
  creative_poem: {
    category: "creative",
    label: "Poem / verse",
    description: "Write poetry or verse to a given brief",
    status: "beta",
    minPlan: "free",
  },
  creative_script: {
    category: "creative",
    label: "Script / dialogue",
    description: "Write scripts or dialogue with character and scene context",
    status: "beta",
    minPlan: "free",
  },
  creative_naming: {
    category: "creative",
    label: "Name ideas",
    description: "Generate naming options for products, features, or brands",
    status: "beta",
    minPlan: "free",
  },
  creative_worldbuilding: {
    category: "creative",
    label: "Worldbuilding",
    description: "Develop settings, lore, and world details",
    status: "beta",
    minPlan: "free",
  },
  creative_character: {
    category: "creative",
    label: "Character development",
    description: "Develop characters, backstories, and motivations",
    status: "beta",
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
      "Preserve error messages, stack traces, file names, line numbers, and reproduction steps verbatim. Always include CODE and ERROR attachments by name and a short summary in the context when provided",
    outputHints:
      "Provide root cause analysis, the fix, and verification steps. Include code changes as diffs or complete files.",
    qualityRules:
      "Explain the root cause. Propose minimal, targeted fixes. Avoid introducing new issues. Quality fail if provided CODE or ERROR attachments are not referenced and summarized",
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
  coding_review: {
    baseRole:
      "a senior code reviewer who ensures code quality, security, and maintainability",
    goalType: "review code for correctness and best practices",
    contextHints:
      "Preserve code context, language idioms, and any specific review focus areas",
    outputHints:
      "Structured review with summary, critical issues, suggestions, and nitpicks",
    qualityRules:
      "Be constructive. Focus on high-impact issues first. Explain 'why' for every suggestion.",
  },
  coding_optimize: {
    baseRole:
      "a performance engineer who specializes in optimization and efficiency",
    goalType: "optimize code for performance and resource usage",
    contextHints:
      "Preserve algorithmic logic but look for bottlenecks. Note any specific constraints (memory, CPU).",
    outputHints:
      "Optimized code with explanations of improvements. Benchmarks or complexity analysis if relevant.",
    qualityRules:
      "Don't sacrifice readability unless necessary. Verify correctness is maintained.",
  },
  coding_documentation: {
    baseRole:
      "a technical writer who creates clear, comprehensive developer documentation",
    goalType: "write or improve technical documentation",
    contextHints:
      "Preserve API signatures, usage examples, and key concepts. Note target audience.",
    outputHints:
      "Clear, structured documentation. Usage examples, parameter descriptions, and return values.",
    qualityRules:
      "Be accurate and up-to-date. Use clear, concise language. Include examples.",
  },
  coding_api: {
    baseRole:
      "an API designer who crafts clean, intuitive, and robust interfaces",
    goalType: "design or refine an API surface",
    contextHints:
      "Preserve domain concepts and data models. Note protocol (REST, GraphQL, etc.).",
    outputHints:
      "API definition (OpenAPI, TypeScript interfaces, etc.). Endpoints, request/response schemas.",
    qualityRules:
      "Follow standard conventions. Ensure consistency. Consider versioning and evolution.",
  },
  coding_database: {
    baseRole: "a database architect who designs efficient and scalable schemas",
    goalType: "design or modify database schema",
    contextHints:
      "Preserve data relationships and access patterns. Note database technology (SQL, NoSQL).",
    outputHints:
      "Schema definitions (SQL DDL, Prisma, etc.). Entity relationship diagrams or descriptions.",
    qualityRules:
      "Normalize where appropriate. Index for query performance. Ensure data integrity.",
  },
  coding_architecture: {
    baseRole:
      "a system architect who designs scalable and maintainable systems",
    goalType: "design system architecture or high-level design",
    contextHints:
      "Preserve system requirements, constraints, and integration points.",
    outputHints:
      "High-level design description. Component diagrams (Mermaid or text). Data flow.",
    qualityRules:
      "Address non-functional requirements (scalability, reliability). Justify design choices.",
  },
  coding_security: {
    baseRole:
      "a security engineer who identifies vulnerabilities and recommends mitigations",
    goalType: "review code for security issues",
    contextHints:
      "Preserve code logic and data flow. Note sensitivity of data.",
    outputHints:
      "Security assessment. List of vulnerabilities with severity and remediation steps.",
    qualityRules:
      "Focus on OWASP Top 10 and common pitfalls. Be specific about risks.",
  },
  coding_migration: {
    baseRole:
      "a migration specialist who plans and executes safe code transitions",
    goalType: "plan or implement a code migration",
    contextHints:
      "Preserve business logic while changing implementation. Note source and target states.",
    outputHints:
      "Migration plan or migrated code. Step-by-step instructions. Rollback strategy.",
    qualityRules:
      "Minimize downtime/risk. Ensure data consistency. Verify parity.",
  },
  coding_website: {
    baseRole:
      "a frontend engineer who builds accessible, responsive, and performant web interfaces",
    goalType: "implement or refine a website or web page",
    contextHints:
      "Preserve design specs, content, and brand guidelines. Note framework (React, HTML/CSS).",
    outputHints:
      "Frontend code (HTML/CSS/JS or components). Responsive layout. Accessibility attributes.",
    qualityRules:
      "Semantic HTML. Responsive design. Accessible (WCAG). Performant.",
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
      "Preserve the user's subject matter, key messages, examples, and audience context. Note any SEO or formatting requirements. The topic MUST come from user notes. If FILEs or IMAGEs convey product philosophy or examples, summarize 2–4 relevant bullets into the context",
    outputHints:
      "First outline, then draft. Include intro, body sections, and conclusion. Specify word count if given. The content must be about the user's subject.",
    qualityRules:
      "No fluff. Use concrete examples from the user's notes. Match specified tone. Hook the reader early. Never replace user's subject with generic topics.",
  },
  writing_newsletter: {
    baseRole: "a newsletter editor who curates engaging and valuable content",
    goalType: "write a newsletter issue",
    contextHints:
      "Preserve user's topics, links, and updates. Note audience and frequency.",
    outputHints: "Subject line, intro, main sections, outro. engaging hooks.",
    qualityRules: "Personal connection. Value-driven. Consistent voice.",
  },
  writing_doc: {
    baseRole: "a technical communicator who writes clear product documentation",
    goalType: "write product or user documentation",
    contextHints:
      "Preserve feature details and user workflows. Note audience level.",
    outputHints:
      "Structured documentation. How-to guides, FAQs, or reference material.",
    qualityRules:
      "Clear instructions. Visuals (described) where helpful. Anticipate user questions.",
  },
  writing_press_release: {
    baseRole: "a PR specialist who crafts compelling announcements for media",
    goalType: "write a press release",
    contextHints:
      "Preserve key facts, quotes, and boilerplate. Note target media outlets.",
    outputHints:
      "Standard press release format. Headline, dateline, body, boilerplate, contact info.",
    qualityRules:
      "Newsworthy angle. Inverted pyramid structure. Professional tone.",
  },
  writing_product_desc: {
    baseRole:
      "a product marketer who highlights benefits and features persuasively",
    goalType: "write product descriptions",
    contextHints:
      "Preserve product specs and key selling points. Note target customer.",
    outputHints:
      "Compelling title, benefits-focused description, feature list.",
    qualityRules:
      "Focus on value/benefits. Evocative language. SEO-friendly keywords.",
  },
  writing_twitter_thread: {
    baseRole:
      "a social content strategist and viral X/Twitter writer who understands platform dynamics, attention psychology, and concise persuasive storytelling",
    goalType:
      "write X/Twitter content (thread OR single post, depending on user request) about the subject defined in the user's TOP-LEVEL INSTRUCTION",
    contextHints:
      "CRITICAL: The user's top-level instruction (before 'Below is...', 'Here's the...') defines the subject. Reference docs are CONTEXT TO MINE, not the task. Preserve user's subject matter (e.g., 'Orbitar'), key concepts, slogans, product/brand names. If user says 'single post' or 'viral post', produce exactly that, not a thread. If user mentions style ('viral', 'controversial', 'educational'), encode it as explicit tone guidance. If FILEs or IMAGEs contain product philosophy or examples, summarize 2–4 key bullets from them into the context",
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
  research_analysis: {
    baseRole:
      "a market analyst who provides deep insights into market dynamics",
    goalType: "analyze a market or industry",
    contextHints:
      "Preserve data points, trends, and segments. Note specific questions to answer.",
    outputHints:
      "Market overview, segmentation, trends, opportunities/threats.",
    qualityRules: "Data-driven. Objective. actionable insights.",
  },
  research_trends: {
    baseRole:
      "a trend forecaster who identifies and explains emerging patterns",
    goalType: "analyze trends",
    contextHints: "Preserve timeframes and data sources. Note specific domain.",
    outputHints: "List of trends with descriptions, drivers, and implications.",
    qualityRules:
      "Distinguish signal from noise. Forward-looking. Evidence-based.",
  },
  research_competitive: {
    baseRole:
      "a competitive intelligence analyst who benchmarks against competitors",
    goalType: "conduct competitive research",
    contextHints: "Preserve competitor list and comparison criteria.",
    outputHints:
      "Competitor profiles. Feature/strategy comparison. SWOT analysis.",
    qualityRules:
      "Fair and balanced. Focus on differentiators. Strategic implications.",
  },

  // Planning behaviors
  planning_roadmap: {
    baseRole: "a project lead who creates clear, actionable project plans",
    goalType: "create a roadmap or project plan",
    contextHints:
      "Preserve scope, timeline constraints, dependencies, and any existing milestones. If FILE: PHILOSOPHY.md or a similar attachment is present, summarize relevant sections (e.g., Prompt Lab, evaluation, shipping) as context bullets",
    outputHints:
      "Phases with milestones, key deliverables, dependencies, risks, and success criteria",
    qualityRules:
      "Realistic timelines. Clear ownership. Explicit dependencies. Acknowledge risks. Quality fail if attachments are present and ignored or only named without embedding key content",
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
  planning_project: {
    baseRole: "a project manager who structures work for successful delivery",
    goalType: "create a project plan",
    contextHints:
      "Preserve goals, scope, and resources. Note methodology (Agile, Waterfall).",
    outputHints: "Project charter, WBS, schedule, resource plan.",
    qualityRules:
      "Clear scope. Realistic resource allocation. Defined success metrics.",
  },
  planning_strategy: {
    baseRole:
      "a strategic planner who defines long-term goals and how to achieve them",
    goalType: "develop a strategy document",
    contextHints:
      "Preserve mission, vision, and market context. Note time horizon.",
    outputHints: "Strategic pillars, goals, initiatives, KPIs.",
    qualityRules:
      "Coherent logic. Aligned with vision. Actionable high-level steps.",
  },
  planning_timeline: {
    baseRole: "a scheduler who creates realistic and visualized timelines",
    goalType: "create a timeline or schedule",
    contextHints: "Preserve key dates, duration, and dependencies.",
    outputHints:
      "Chronological list of events or Gantt-style description. Milestones.",
    qualityRules: "Logical flow. Account for buffers. Clear critical path.",
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
  communication_translate: {
    baseRole:
      "a professional translator who preserves nuance and tone across languages",
    goalType: "translate text",
    contextHints:
      "Preserve meaning, tone, and specific terminology. Note source and target languages.",
    outputHints: "Translated text. Cultural adaptation notes if necessary.",
    qualityRules:
      "Accurate. Natural sounding in target language. Preserve original intent.",
  },
  communication_simplify: {
    baseRole: "a plain language editor who makes complex content accessible",
    goalType: "simplify text",
    contextHints: "Preserve core meaning and facts. Note target reading level.",
    outputHints: "Simplified text. Short sentences, common words.",
    qualityRules:
      "Improve readability. Remove jargon. Don't dumb down ideas, just language.",
  },
  communication_professional: {
    baseRole:
      "a business communication expert who polishes text for professional contexts",
    goalType: "make text more professional",
    contextHints:
      "Preserve message and intent. Note desired level of formality.",
    outputHints: "Polished, professional text. Correct grammar and etiquette.",
    qualityRules: "Courteous. Clear. concise. appropriate for business.",
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
  creative_slogan: {
    baseRole: "a copywriter who creates memorable hooks and taglines",
    goalType: "generate slogans or taglines",
    contextHints:
      "Preserve brand essence and key message. Note target audience.",
    outputHints: "List of slogans/taglines. Variations in tone.",
    qualityRules: "Catchy. Memorable. Aligned with brand identity.",
  },
  creative_poem: {
    baseRole: "a poet who expresses ideas through verse and rhythm",
    goalType: "write a poem",
    contextHints:
      "Preserve theme, mood, and any structural constraints (haiku, sonnet).",
    outputHints: "Poem in specified style.",
    qualityRules:
      "Evocative imagery. Rhythm/meter where appropriate. Emotional resonance.",
  },
  creative_script: {
    baseRole: "a screenwriter who writes compelling dialogue and scenes",
    goalType: "write a script or dialogue",
    contextHints: "Preserve characters, setting, and plot action.",
    outputHints: "Script format (sluglines, action, dialogue).",
    qualityRules: "Natural dialogue. Show don't tell. Clear pacing.",
  },
  creative_naming: {
    baseRole:
      "a brand naming specialist who creates unique and available names",
    goalType: "generate names for a product or brand",
    contextHints: "Preserve brand attributes and industry context.",
    outputHints: "List of name ideas. Rationale for each.",
    qualityRules:
      "Distinctive. Pronounceable. Memorable. Check for obvious conflicts.",
  },
  creative_worldbuilding: {
    baseRole: "a worldbuilder who creates rich, consistent fictional settings",
    goalType: "develop worldbuilding details",
    contextHints: "Preserve genre, tone, and existing lore.",
    outputHints: "Descriptions of places, history, cultures, or systems.",
    qualityRules: "Internal consistency. Sensory details. Spark imagination.",
  },
  creative_character: {
    baseRole: "a character designer who creates deep, believable personas",
    goalType: "develop a character",
    contextHints: "Preserve role in story and key traits.",
    outputHints:
      "Character profile (backstory, personality, appearance, motivation).",
    qualityRules: "Complex motivations. Distinct voice. Flaws and strengths.",
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
      "NEVER perform the task yourself (no long lists, full articles/emails, or large code). Small illustrative examples (1–3 items/snippets) allowed only to clarify intent and must not satisfy the request. On minimal-input tasks (e.g., only a topic), do NOT invent domain-specific facts or statistics in the Context block—express structure (audience, tone, sections or topics to cover) rather than factual claims the user did not provide. Quality fail if the refined prompt contains a full answer that fulfills the user's ask. If attachments are present, summarize and embed their key content; quality fail if you ignore attachments or mention them without embedding essentials.",
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

/**
 * Template slug registry (normalized identity: category_scope_variant).
 * We keep existing TemplateId values for API compatibility and derive a slug
 * by appending "_default" for the current GA variant of each template.
 */
export type TemplateSlug =
  | "coding_feature_default"
  | "coding_debug_default"
  | "coding_refactor_default"
  | "coding_review_default"
  | "coding_optimize_default"
  | "coding_documentation_default"
  | "coding_api_default"
  | "coding_database_default"
  | "coding_architecture_default"
  | "coding_security_default"
  | "coding_migration_default"
  | "coding_website_default"
  | "coding_tests_default"
  | "coding_explain_default"
  | "writing_blog_default"
  | "writing_newsletter_default"
  | "writing_doc_default"
  | "writing_press_release_default"
  | "writing_product_desc_default"
  | "writing_twitter_thread_default"
  | "writing_linkedin_post_default"
  | "writing_email_default"
  | "writing_landing_page_default"
  | "research_summarize_default"
  | "research_analysis_default"
  | "research_trends_default"
  | "research_competitive_default"
  | "research_compare_default"
  | "research_extract_points_default"
  | "planning_roadmap_default"
  | "planning_project_default"
  | "planning_strategy_default"
  | "planning_timeline_default"
  | "planning_feature_spec_default"
  | "planning_meeting_notes_default"
  | "communication_reply_default"
  | "communication_translate_default"
  | "communication_simplify_default"
  | "communication_professional_default"
  | "communication_tone_adjust_default"
  | "creative_story_default"
  | "creative_slogan_default"
  | "creative_poem_default"
  | "creative_script_default"
  | "creative_naming_default"
  | "creative_worldbuilding_default"
  | "creative_character_default"
  | "creative_brainstorm_default"
  | "general_general_default";

/**
 * Map existing TemplateId (compat) to a normalized slug form for logging.
 * Current GA variant is "default" for all.
 */
export function getTemplateSlug(templateId: TemplateId): TemplateSlug {
  return `${templateId}_default` as TemplateSlug;
}

/**
 * Version registry for all GA templates.
 * All start at "1.0.0" and can be bumped per slug in the future.
 */
export const templateVersionRegistry: Record<TemplateSlug, string> = {
  coding_feature_default: "1.0.0",
  coding_debug_default: "1.0.0",
  coding_refactor_default: "1.0.0",
  coding_review_default: "1.0.0",
  coding_optimize_default: "1.0.0",
  coding_documentation_default: "1.0.0",
  coding_api_default: "1.0.0",
  coding_database_default: "1.0.0",
  coding_architecture_default: "1.0.0",
  coding_security_default: "1.0.0",
  coding_migration_default: "1.0.0",
  coding_website_default: "1.0.0",
  coding_tests_default: "1.0.0",
  coding_explain_default: "1.0.0",
  writing_blog_default: "1.0.0",
  writing_newsletter_default: "1.0.0",
  writing_doc_default: "1.0.0",
  writing_press_release_default: "1.0.0",
  writing_product_desc_default: "1.0.0",
  writing_twitter_thread_default: "1.0.0",
  writing_linkedin_post_default: "1.0.0",
  writing_email_default: "1.0.0",
  writing_landing_page_default: "1.0.0",
  research_summarize_default: "1.0.0",
  research_analysis_default: "1.0.0",
  research_trends_default: "1.0.0",
  research_competitive_default: "1.0.0",
  research_compare_default: "1.0.0",
  research_extract_points_default: "1.0.0",
  planning_roadmap_default: "1.0.0",
  planning_project_default: "1.0.0",
  planning_strategy_default: "1.0.0",
  planning_timeline_default: "1.0.0",
  planning_feature_spec_default: "1.0.0",
  planning_meeting_notes_default: "1.0.0",
  communication_reply_default: "1.0.0",
  communication_translate_default: "1.0.0",
  communication_simplify_default: "1.0.0",
  communication_professional_default: "1.0.0",
  communication_tone_adjust_default: "1.0.0",
  creative_story_default: "1.0.0",
  creative_slogan_default: "1.0.0",
  creative_poem_default: "1.0.0",
  creative_script_default: "1.0.0",
  creative_naming_default: "1.0.0",
  creative_worldbuilding_default: "1.0.0",
  creative_character_default: "1.0.0",
  creative_brainstorm_default: "1.0.0",
  general_general_default: "1.0.0",
} as const;

/**
 * Return the current GA version string for a templateId (compat).
 * Falls back to "1.0.0" if an unknown id slips through.
 */
export function getTemplateVersion(templateId: TemplateId): string {
  const slug = getTemplateSlug(templateId);
  return templateVersionRegistry[slug] ?? "1.0.0";
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
