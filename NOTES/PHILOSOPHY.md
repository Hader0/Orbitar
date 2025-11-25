# Orbitar Philosophy

> **Orbitar manufactures prompts that are structurally smarter, context-aware, and measurably more effective than anything the user could dash off themselves.**

---

## In One Sentence

Orbitar is a prompt engine that transforms messy user intent into laser-guided AI instructions—every refinement must be an **obvious upgrade** over what the user could write in 10 seconds.

---

## The Orbitar Prompt Contract

Every refined prompt must contain these elements, presented naturally (not as visible schema labels):

### 1. Role / Perspective

Define how the downstream model should think before responding:

- "You are a senior full-stack engineer who writes production-ready code…"
- "You are a ruthless editor focused on clarity and concision…"
- "You are a research assistant prioritizing evidence and citations…"

### 2. Goal / Outcome

A single, crisp statement of the desired result:

- "Your goal is to produce a production-ready implementation plan for…"
- "Your goal is to refactor this code for readability and testability…"
- "Your goal is to draft a landing page that turns cold traffic into signups…"

### 3. Context & Inputs

Structured, labeled references to user-provided material:

- **Selective, not exhaustive**: Include what matters, not everything available
- **Summarize before stuffing**: Extract key points from long inputs
- **Explicit references**: "In `LoginForm.tsx`…", "From the error trace…"
- **Labeled attachments**: `FILE:`, `CODE:`, `IMAGE:`, `ERROR:`
- **Honest about gaps**: Note assumptions when context is incomplete

### 4. Constraints & Preferences

Explicit guardrails and non-goals:

- Tech stack, versions, tools
- Non-goals ("Do not change API contracts…")
- Style and tone requirements
- Safety and behavioral boundaries

### 5. Output Contract

Clear specification of expected response format:

- Required sections or keys
- Format (markdown, JSON, code blocks, etc.)
- Length bounds ("~500 words max", "one screenful")
- Machine-checkable where possible

### 6. Quality Criteria / Self-Check

Instructions for the downstream model to verify its own output:

- "Verify you followed the requested structure…"
- "If critical info is missing, ask clarifying questions first…"
- "Avoid vague statements; prefer concrete steps and examples…"

---

## The 10-Second Bar

> If Orbitar's output isn't obviously better than what the user could write in 10 seconds, we failed.

This is the core quality standard. A refined prompt must:

1. **Clarify the goal** — make the desired outcome explicit
2. **Surface and organize context** — structure the relevant information
3. **Enforce structure** — provide a frame the model can "snap into"
4. **Constrain output** — clear formatting and guardrails
5. **Respect domain best practices** — coding, writing, research, etc.

If a refined prompt is basically just "rewrite this more nicely," that's a **hard fail**.

---

## Context Handling Philosophy

Orbitar's job is to build a compact, labeled "context package" the model can reliably reason over:

1. **Summarize before you stuff** — for long inputs, chunk and extract
2. **Reference sources explicitly** — "In `api/routes/user.ts`…"
3. **Use labeled prefixes** — `FILE:`, `CODE:`, `IMAGE:`, `ERROR:`
4. **Keep attachments modular** — each attachment is a named unit
5. **Be honest about missing context** — note assumptions, request clarification

---

## Templates as Behavior Presets

Templates are **internal behavior configurations**, not visible output forms:

### What Templates Define

- **Base role**: How the downstream model should see itself
- **Goal type**: What kinds of outcomes this template optimizes for
- **Context hints**: What information matters for this domain
- **Output hints**: Expected response format and structure
- **Quality rules**: Domain-specific constraints and best practices

### What Templates Are NOT

- Visible "skeleton" or "form" the user sees
- Labeled sections like "Role: … / Goal: … / Context: …"
- Meta-commentary about prompt structure

### Template Lifecycle

- **Lab** → **Experimental** → **Beta** → **GA** → **Deprecated**
- Decisions driven by usage, acceptance behavior, lab scores, and user ratings

---

## Backend Behavior Rules

The refinement engine must:

1. **Treat user text as authoritative source material**

   - Preserve domain wording and details where strong
   - Restructure, group, and sharpen—don't just paraphrase

2. **Write directly to the downstream model**

   - Use second person: "You are…", "Your goal is…"
   - No meta-commentary about "this prompt"

3. **Never expose internal structure**

   - No visible schema labels (Role:, Goal:, Context:, etc.)
   - No mentions of "template", "scaffold", "skeleton"
   - No phrases like "structured prompt", "clear sections"
   - Never call the model a "prompt engineer"

4. **Maintain information density**

   - Similar density to input—don't aggressively compress
   - Prefer restructuring over summarizing away detail

5. **Ask for clarification sparingly**
   - Only when absolutely necessary
   - Append a clearly marked "Clarifying questions" section

---

## Data & R&D Philosophy

### Prompt Lab

Continuous testing and improvement:

- Synthetic corpora for coding, writing, planning, research
- Multi-model experiments (GPT-4o, others for robustness)
- Automatic scoring: structure adherence, length, required sections
- A/B testing of template variants
- Keep winners, retire losers

### What We Learn From

- Public codebases and documentation (patterns, best practices)
- Style guides (technical writing, marketing, editorial)
- AI provider docs (recommended prompt patterns)
- High-quality prompt research and collections

### Privacy Constraints

- User text never sold or shared for unrelated purposes
- Content logging is opt-in, anonymized, time-limited
- "Incognito refine" means no content-level logging

---

## Evaluation Framework

### Behavioral Metrics (Real Users)

- **Acceptance rate**: % of refinements used with minor edits
- **Heavy edit / revert rate**: signals template missed the mark
- **Time to send**: short delay = "nailed it"; long delay = friction

### Template Metrics (Prompt Lab)

- Structure adherence: can we parse output as requested?
- Task-specific checks (compilable code, correct sections, etc.)
- Comparative testing: old vs new variants on same corpus

### Baselines

Compare Orbitar output against:

- Raw user prompt → model
- Minimal prompts ("You are X, do Y")

If not consistently outperforming, template isn't done.

---

## Shipping Philosophy

### v1: Sharp Launch

- Focus on categories where we can be **excellent**: coding, writing, planning
- Templates must follow this philosophy
- Manual testing by team + minimal Prompt Lab eval

### v1.5+: Relentless Improvement

- Expand only where analytics show demand **and** we can maintain quality
- Nightly Prompt Lab: re-evaluate, promote/demote, propose variants
- Continuous curiosity: track new best practices, refactor when needed

---

## Cultural Rules

1. **"Good enough" isn't**

   - "Decent" stays in Lab or Experimental
   - Only "clearly better than my own prompt" gets to GA

2. **Every template has an owner**

   - Someone watches its metrics
   - Underperformers are improved or killed

3. **Constant curiosity**

   - Read provider docs and research
   - Track new best practices
   - Willing to refactor completely when landscape changes

4. **User trust > cleverness**
   - No dark patterns around data use
   - No dishonest claims about data handling
   - Clear controls, clear language, predictable behavior

---

## Connection to Backend Implementation

| Philosophy Concept           | Backend Location                                                   |
| ---------------------------- | ------------------------------------------------------------------ |
| Orbitar Prompt Contract      | `lib/philosophy-snippets.ts` → `CORE_ORBITAR_CONTRACT`             |
| Context handling rules       | `lib/philosophy-snippets.ts` → `CONTEXT_HANDLING_RULES`            |
| Quality bar (10-second rule) | `lib/philosophy-snippets.ts` → `QUALITY_BAR`                       |
| Domain-specific guidance     | `lib/philosophy-snippets.ts` → `DOMAIN_SNIPPETS`                   |
| Template behaviors           | `lib/templates.ts` → `templateBehaviors`                           |
| Template metadata            | `lib/templates.ts` → `templateRegistry`                            |
| Refine engine                | `lib/refine-engine.ts` → `RefineEngine`, `buildRefineSystemPrompt` |
| API endpoint                 | `app/api/refine-prompt/route.ts`                                   |

---

_Last updated: November 2024_
