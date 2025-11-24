# Orbitar Prompt Philosophy

> **If Orbitar’s output isn’t obviously better than what the user could write in 10 seconds, we failed.**

Orbitar is not a fancy text box. It’s a **prompt engine** whose job is to turn messy intent into **laser-guided instructions** for AI models.

That means:

- A “good” prompt is **not enough**.
- Every refinement must feel **obviously superior** to what the user would have written themselves.
- We treat prompts as **products**, not one-off strings.

This document defines what that actually means in practice.

---

## 1. Non-Negotiable Promise: Obvious Upgrade, Every Time

**Definition of success for a single refinement:**

> The user looks at Orbitar’s refined prompt and thinks:  
> “I wouldn’t have written that. This is clearer, sharper, and more likely to work.”

Concretely, an Orbitar refinement must:

1. **Clarify the goal**

   - Make the desired outcome explicit.
   - Pull out implied requirements (edge cases, constraints, formats).

2. **Surface and organize context**

   - Identify which parts of the user’s text (and attachments) actually matter.
   - Present that context in a structured way instead of dumping everything.

3. **Enforce structure**

   - Role → Goal → Context → Constraints → Output Format → Quality rules.
   - Models should “snap into” a consistent frame, not improvise each time.

4. **Constrain output**

   - Clear formatting instructions (sections, JSON, markdown, code blocks).
   - Guard rails against rambling, irrelevant output, or unsafe behavior.

5. **Respect domain best practices**
   - Coding templates follow solid engineering habits.
   - Writing templates follow strong editorial structure.
   - Research templates push for evidence, citations, and uncertainty handling.

If a refined prompt is basically just “rewrite this more nicely,” that’s a **hard fail**.  
Orbitar must _restructure_ the task, not just rephrase it.

---

## 2. The Orbitar Prompt Spec: What “Best Possible” Actually Contains

Every serious Orbitar template should implicitly or explicitly cover:

### 2.1 Role / Perspective

Examples:

- “You are a senior full-stack engineer…”
- “You are a ruthless editor focused on clarity and concision…”
- “You are a research assistant prioritizing evidence and citations…”

The role defines _how_ the model should think before it starts typing.

---

### 2.2 Goal / Outcome

A single, crisp sentence:

- “Your goal is to produce a production-ready implementation plan for…”
- “Your goal is to refactor this code for readability and testability…”
- “Your goal is to draft a landing page that turns cold traffic into signups…”

No vague “help me with this.” Always explicit.

---

### 2.3 Context & Inputs (Text + Files + Code + Screenshots)

Orbitar must be excellent at turning messy, multi-source context into something the model can actually use.

Principles:

1. **Selective, not exhaustive**

   - Don’t dump the entire input blob into the prompt.
   - Decide what’s relevant:
     - For text: key objectives, constraints, examples, audience.
     - For code: file names, function names, key snippets, error messages.
     - For docs: headings, sections, bullet summaries.
     - For images/screenshots (later): a concise description of what’s visible.

2. **Summarize before you stuff**

   - For long inputs, Orbitar should:

     - Chunk the content.
     - Extract and summarize the important pieces.
     - Only include those summaries plus _minimal_ raw snippets that absolutely matter (e.g., an error trace or a function body).

   - Bad:

     > “Use the context above.”

   - Good:
     > “Context summary:  
     > – You are working on X…  
     > – The relevant files are A.ts, B.tsx…  
     > – The core bug is Y, with this stack trace: … (truncated).”

3. **Reference context explicitly**

   - Instead of vague phrases, reference **where** the information came from:

     - “In `LoginForm.tsx` there is a component that…”
     - “From the user’s requirements list: 1) … 2) … 3) …”
     - “From the screenshot: the error banner reads ‘…’ and appears after clicking Submit.”

   - This anchors the model and makes it easier to debug later.

4. **Keep attachments modular**

   - Treat each attachment as a named unit:

     - `FILE: user-story.md`
     - `CODE: Dashboard.tsx`
     - `IMAGE: error-popup.png (description: …)`

   - The prompt format should make it clear to the model:  
     _“You’re seeing several pieces of context; use them all, but don’t hallucinate missing ones.”_

5. **Be honest about missing context**

   - If something important is obviously missing (e.g., we only have part of a stack trace), the prompt should tell the model to:
     - Make assumptions explicit **or**
     - Ask the user clarifying questions before proceeding.

Orbitar’s job is to build a compact, labeled “context package” that the model can reliably reason over, not to just shove bytes into a context window.

---

### 2.4 Constraints & Preferences

Examples:

- Tech stack: “React + TypeScript, Tailwind, Next.js app router…”
- Non-goals: “Do not change API contracts; only refactor internals.”
- Style: “Keep tone friendly but not cringey. Avoid emojis.”

These should be explicit, not implied.

---

### 2.5 Output Contract

The output should have a **clear contract** the model must follow:

- Required sections or keys.
- Formatting rules (markdown headings, bullet lists, JSON schema, code blocks).
- Length bounds (“~500 words max”, “one screenful”, etc.).

Ideally, the output is machine-checkable so Orbitar can later lint it.

---

### 2.6 Quality Criteria / Self-Check

Templates should nudge models to self-check:

- “Verify you followed the requested structure; if not, fix it before sending.”
- “If any critical info appears missing, ask clarifying questions first.”
- “Avoid vague statements; prefer concrete steps and examples.”

We bake evaluation hints into the prompt so we can inspect and grade the model’s behavior later.

---

## 3. We Do **Not** Rely on User Prompts for Quality

User prompts are _input_, not training data.

Most users:

- Underspecify.
- Mix multiple tasks.
- Forget constraints.
- Use vague language.

Orbitar’s philosophy:

> The user provides **intent**, Orbitar manufactures the **prompt**.

Implications:

1. **User data is signal, not ground truth**

   - We look at:

     - Category/template choice.
     - Acceptance vs heavy-edit vs abandon.
     - Latency and error rates.

   - We do **not** assume:
     - “What users type is the right way to phrase prompts.”

2. **We build our own training & eval corpora**

   - Synthetic prompts describing realistic scenarios.
   - Scenario-based tasks:

     - Bugs to fix.
     - Features to implement.
     - Posts to write.
     - Research questions to answer.

   - Benchmarks that mimic real workflows, not toy problem sets.

User prompts tell us **where** the pain is.  
Orbitar decides **how** to solve it.

---

## 4. Data & R&D Philosophy: Aggressive but Responsible

We want to be at the frontier of prompt quality, without being creepy or reckless.

### 4.1 Wide Intake of Public Knowledge

Orbitar should learn from:

- Public codebases and documentation (for coding patterns & best practices).
- Open style guides for product copy, technical writing, marketing, etc.
- Official AI provider docs (OpenAI, others) on recommended prompt patterns.
- High-quality public prompt collections and research papers.

Rule of thumb:

> “Learn from everything, copy from nothing.”

We synthesize new prompts from what we’ve observed; we don’t just paste other people’s strings.

---

### 4.2 Background “Prompt Lab”

We maintain an internal **Prompt Lab** that:

- Continuously tests templates:

  - Synthetic corpora (coding, writing, planning, research, etc.).
  - Opt-in anonymized real prompts (heavily redacted).

- Runs multi-model experiments:

  - GPT-5-mini as baseline.
  - Optionally other models (open-source, OpenRouter, etc.) to ensure robustness.

- Scores templates automatically based on:

  - Structure adherence.
  - Output length vs target.
  - Presence of required sections.
  - Heuristics for hallucinations and low-signal output.

- Proposes new variants:
  - Internal “meta-agents” generate candidate prompt tweaks.
  - We keep only variants that consistently win in A/B tests.

Your cloud credits (e.g., the $300 GCP trial and any future grants) are perfect for this lab: cheap compute for experimentation, isolated from production traffic.

---

### 4.3 Privacy & Consent Are Hard Constraints

We are aggressive about quality but conservative about privacy:

- User text is never sold or shared for unrelated purposes.
- Content logging for improvement is **opt-in**, anonymized, and time-limited.
- “Incognito refine” means **no content-level logging** for that refinement.

We push quality **inside** these constraints, not around them.

---

## 5. Scalability: Templates as an Engine, Not One-Offs

Orbitar’s prompt system must scale to many templates without collapsing.

Principles:

1. **Single Source of Truth**

   - All templates live in a structured registry.
   - Each template includes:
     - `id`, `category`, `label`, `description`.
     - Plan gating (Free / Light / Pro / Team).
     - Status (Lab / Experimental / Beta / GA).
     - Internal system prompt text & rules (private, backend-only).

2. **Configurable, Not Scattered**

   - Adding a new template should mostly be a config/registry change.
   - The Prompt Lab should be able to generate new candidates in this format.

3. **Lifecycle Management**

   - Templates move through:

     - Lab → Experimental → Beta → GA → Deprecated.

   - Decisions driven by:
     - Usage.
     - Acceptance/edit behavior.
     - Lab scores.
     - User ratings from the Template Store.

4. **Plan-Aware**

   - Free tier gets a carefully chosen core set.
   - Light / Pro tiers unlock deeper, more specialized templates and early access.

---

## 6. Evaluation: How We Know We’re “The Best”

We don’t just _feel_ like prompts are better; we prove it.

### 6.1 Behavioral Metrics (Real Users)

- **Acceptance rate**: % of refinements used with minor edits.
- **Heavy edit / revert rate**: signals the template missed the mark.
- **Time to send**: short delay usually means “nailed it”; long delay suggests friction.

---

### 6.2 Template Metrics (Prompt Lab)

- Structure adherence: can we parse the output as requested?
- Task-specific checks:

  - Coding: compilable, tests included, comments present.
  - Writing: correct sections, no obvious nonsense.

- Comparative templates:
  - Old template vs new variant on the same corpus.
  - Keep the winner; retire the loser.

---

### 6.3 Baselines & Benchmarks

- Compare Orbitar’s refined prompt vs:
  - A naive “raw user prompt → model” baseline.
  - Minimal prompt patterns (e.g., trivial “You are X, do Y” prompts).

If Orbitar isn’t consistently outperforming these baselines, that template isn’t done.

---

## 7. Shipping Philosophy: Sharp v1, Relentless v1.5+

We aim to release fast, but not sloppy.

### 7.1 v1 (Launch)

- Focus on a small set of categories where we can already be **excellent**:

  - Coding.
  - Writing (short + long).
  - Planning / basic research.

- Templates must:
  - Follow this philosophy.
  - Be manually tested by us.
  - Pass a minimal Prompt Lab eval.

---

### 7.2 v1.5+ (Post-Launch)

- Expand templates only where:

  - Analytics show demand.
  - We can maintain the quality bar.

- Make the Prompt Lab a nightly routine:
  - Re-evaluate templates.
  - Promote / demote based on data.
  - Continuously propose variants.

---

## 8. Cultural Rules for Orbitar

These are the rules for anyone touching Orbitar’s prompts (including future collaborators and future you):

1. **“Good enough” isn’t**

   - “Decent” templates stay in Lab or Experimental.
   - Only “this is clearly better than my own prompt” gets to GA.

2. **Every template has an owner**

   - Somebody is responsible for watching its metrics.
   - If it underperforms, it’s improved or killed.

3. **Constant curiosity**

   - We read provider docs and research.
   - We track new best practices.
   - We are willing to refactor templates completely when the landscape changes.

4. **User trust > cleverness**

   - No dark patterns around data use.
   - No dishonest claims (“no data ever leaves your keyboard”) when we clearly must call models.
   - Clear controls, clear language, and predictable behavior.

---

Orbitar’s philosophy in one sentence:

> **We manufacture prompts that are structurally smarter, context-aware, and measurably more effective than anything the user could dash off themselves — and we keep improving them with real data, deliberate testing, and zero shortcuts on trust.**
