# Orbitar Project Status & Roadmap

## Quick Status Checklist (Updated 2025-11-25)

This checklist summarizes what is implemented vs. still pending, based on the current codebase. It complements the narrative sections below.

### ✅ Completed

- Backend foundation

  - [x] Next.js 14 App Router with TypeScript and Tailwind
  - [x] Prisma schema and SQLite dev DB
    - [x] Models: User, ApiKey, Account, Session, VerificationToken, PromptEvent, UserTemplatePreference
  - [x] Migrations present in `backend/prisma/migrations`
  - [x] NextAuth CredentialsProvider “Dev Login” with JWT sessions

- Core APIs

  - [x] `/api/refine-prompt` with:
    - [x] API key auth (Bearer), per-plan rate limits
    - [x] Template resolution (explicit id → category default → legacy mapping → heuristic/LLM)
    - [x] OpenAI SDK with prioritized model fallback; REST fallback path
    - [x] PromptEvent logging on success and error paths
    - [x] Incognito flag respected (user default + per-request override)
    - [x] Token and latency capture when available
  - Templates
    - [x] `/api/templates` (public registry listing)
    - [x] `/api/templates/me` (session-scoped enabled flags)
    - [x] `/api/templates/for-key` (plan and user preferences filtered via API key)
    - [x] `/api/templates/preferences` (persist enable/disable)
    - [x] `templateRegistry` with categories and `minPlan` rules
    - [x] Heuristic `classifyTemplate` with optional LLM classifier gate
  - User and Admin
    - [x] `/api/user/me` (plan, usage counters, privacy flags)
    - [x] `/api/user/stats` (per-user totals, last 7d, byCategory/byTemplate)
    - [x] `/api/admin/stats` (guarded by `ADMIN_EMAIL`; totals, last 30d, byCategory/byTemplate)
    - [x] `/api/settings/privacy` (update `allowDataUse`/`defaultIncognito`)
  - Stripe
    - [x] `/api/stripe/checkout` (creates subscription Checkout session; ensures customer)
    - [x] `/api/webhooks/stripe` (verifies signature, maps price → plan, updates user)
    - [x] Stripe library wrapper and env guards

- Web app UI

  - [x] Dashboard page
    - [x] Plan card with usage display
    - [x] Subscription status surfaced (`stripeSubscriptionStatus`)
    - [x] API key management (generate/revoke via server actions)
    - [x] UsageCard and PrivacyCard wired
    - [x] UpgradeCard and CheckoutButtons present
  - [x] Templates section scaffold (`templates/page.tsx`, `TemplatesClient.tsx`)
  - [x] Installed page and Privacy form scaffolds present

- Chrome extension

  - [x] Manifest V3 with permissions/host_permissions
  - [x] Background script:
    - [x] Refine flow → calls web app `/api/refine-prompt` using stored API key
    - [x] Classify flow (legacy), Get templates, Get user plan
    - [x] Dev-friendly endpoint fallbacks (`:3000` primary)
  - [x] Popup page to store Orbitar API key in `chrome.storage.sync`
  - [x] Content script and styles present (injection UI and ChatGPT adapter per spec)
  - [x] Keyboard shortcut handler for “refine-prompt”

- Data and privacy

  - [x] PromptEvent model and writes on success/failure
  - [x] Privacy flags on User (`allowDataUse`, `defaultIncognito`) and update API
  - [x] Incognito respected in logs; token/latency captured where available

- Prompt Lab v0 – instrumentation & versioning

  - [x] `RefineEvent` table (`refine_events`) with:
    - `userId`, `plan`, `category`, `templateId` (slug), `templateVersion`
    - `rawTextLength`, `refinedTextLength`
    - `promptLabOptIn`, `isIncognito`
    - `acceptedAt`, `reverted`, `editDistanceBucket`
  - [x] `promptLabOptIn` boolean on `User` + privacy API wiring
  - [x] Installed settings UI toggle: **“Help improve Orbitar’s templates (Prompt Lab)”**
  - [x] Template identity:
    - `TemplateSlug` (e.g. `coding_feature_default`)
    - `templateVersionRegistry` with semver versions (all GA templates start at `"1.0.0"`)
  - [x] Refine route:
    - Normalizes plan to `PlanKey` (`free` | `light` | `pro` | `admin`)
    - Logs both legacy `PromptEvent` and new `RefineEvent` on each refine
  - [x] Behavior fields & API
    - `/api/refine-events/behavior` (session-auth, input validation, structured errors)
    - Extension forwards/stores `refineEventId` for future UX hooks

### ⏳ Outstanding / To Do

- Local dev setup polish

  - [ ] Ensure `backend/.env` contains `OPENAI_API_KEY` and `OPENAI_MODEL`
  - [ ] Verify `/api/refine-prompt` end-to-end latency and model priority behavior
  - [ ] Add `DEBUG=true` toggle docs and recommended usage

- Stripe wiring and testing

  - [ ] Set `STRIPE_SECRET_KEY` in `.env`
  - [ ] Set `STRIPE_PRICE_LIGHT`/`STRIPE_PRICE_BUILDER` and `STRIPE_PRICE_PRO` and verify plan mapping
  - [ ] Configure `STRIPE_WEBHOOK_SECRET` and test webhook signature verification
  - [ ] Wire Upgrade buttons fully and run checkout flow (Free → Light/Pro), confirm plan/status updates in DB

- Authentication (Production)

  - [ ] Add Google OAuth (`GoogleProvider`) with proper consent screen
  - [ ] Replace Dev Login in prod; set `NEXTAUTH_URL` and `NEXTAUTH_SECRET`

- Logging/analytics depth

  - [ ] Add acceptance/edit behavior tracking (post-refine edit intensity and accept/revert signals) using `acceptedAt`, `reverted`, `editDistanceBucket` on `RefineEvent`
  - [ ] Extend PromptEvent/RefineEvent for error taxonomies and model attribution consistency
  - [ ] Token accounting consistency across SDK/REST paths

- Prompt Lab data & metrics

  - [x] Read-only Prompt Lab admin view at `/admin/prompt-lab` (top-level stats + template leaderboard)
  - [x] Dev seed tools embedded (disabled in production): SyntheticTask + PromptSample
  - [x] Lab runner v0 (dev-only) and heuristic scoring (structure/contract/domain/overall)

  - [ ] Populate core Lab tables (`synthetic_tasks`, `prompt_samples`, `lab_runs`, `lab_scores`) with real data
  - [ ] Nightly/periodic jobs to run Lab tasks and compute scores off `RefineEvent` + synthetic/user samples
  - [ ] Admin views for Lab runs/scores (leaderboard, drilldown, explorer)

- Dashboard and templates UX

  - User dashboard
    - [ ] Toast notifications for API actions/errors
    - [ ] Time-range filters and charts (24h/7d/30d/custom) in UsageCard
  - Master dashboard
    - [ ] Deep time-series, by plan/model/category charts
    - [ ] “Promising Results” pipeline for template evolution
    - [ ] Prompt Lab–specific views (overview, template leaderboard, template drilldown, prompt explorer, lab scoring)
  - Templates store
    - [ ] Browsing by category/tags
    - [ ] Enable/disable management UX and status badges (GA/Beta/Experimental)
    - [ ] Ratings/feedback stubs

- Privacy, consent, and onboarding

  - [ ] Build the “Data Use” onboarding screen (extension + web app)
  - [ ] Opt-in control copy and flows; “Incognito refine” UI affordance in extension
  - [ ] Document collection/anonymization/retention (website pages)
  - [ ] Public `/prompt-lab` page using the copy in section **4.3**

- Production readiness

  - [ ] Switch Prisma provider to PostgreSQL and move `DATABASE_URL` to Postgres
  - [ ] Migrate and validate on hosted DB (Supabase/Neon/Vercel Postgres)
  - [ ] Configure Vercel/host envs (DB, NextAuth, OpenAI, Stripe, Google)
  - [ ] Update extension `API_BASE_URL` to prod; package and publish to Chrome Web Store

- QA and hardening

  - [ ] Structured manual test plan for extension (ChatGPT + generic inputs)
  - [ ] Error handling polish in extension (backend down, invalid key, rate limit)
  - [ ] E2E smoke tests for dashboard actions and key flows
  - [ ] Security review (hash API keys in prod, input limits, auth checks)

- Legal/compliance

  - [ ] Publish Privacy Policy and Terms of Service pages (needed for OAuth + Chrome Store)

---

This document outlines the current state of the Orbitar project, detailing what has been completed, what remains for both a functional Development environment and a Production-ready launch, and the broader product/UX direction (dashboards, analytics, background agents, and template ecosystem).

Orbitar is a **Chrome extension + SaaS** that turns messy user text into **clean, model-ready prompts** via an inline, “native-feeling” toolbar that appears inside tools like ChatGPT and other text areas. The backend provides authentication, plans/limits, analytics, and an evolving template system.

---

## 1. Product Overview

### 1.1 What Orbitar Is

- A **Chrome extension** that:

  - Detects focused text areas (e.g., ChatGPT composer).
  - Injects an inline Orbitar toolbar above the input.
  - Lets users select a **category**, **template**, tone/model style, etc.
  - Refines the raw text into a **high-quality AI prompt**, then replaces the input with the refined version.

- A **SaaS backend** (Next.js 14, Prisma, NextAuth, Stripe wiring) that:
  - Issues and manages **API keys**.
  - Applies **per-plan daily limits**.
  - Routes refinement requests to OpenAI.
  - Uses a **template system** to enforce structure (goal/context/task/output rules).

The core promise: Orbitar becomes a **prompt pre-processor** — it optimizes _what_ you send to AI, regardless of which model/provider you use.

---

## 2. Dashboards & Analytics

When a user logs in on the website, they see a **User Dashboard**.  
When an admin logs in, they see a **Master Dashboard** with full analytics.

These dashboards are central to Orbitar’s “trained on real usage” story.

### 2.1 User Dashboard (Per-User View)

**Audience:** Individual users (Free, Light, Pro, etc.).

**Primary responsibilities:**

- **API Key Management**

  - Generate/revoke keys (soft delete).
  - Show last-used timestamp and total calls per key.

- **Usage Overview**

  - Total prompts refined (global and per key).
  - Daily usage vs. plan limit (e.g., Free vs Light vs Pro).
  - Average latency over selectable time windows.

- **Template & Category Breakdown**

  - Which **categories** (coding, writing, planning, research, communication, creative, general) they use most.
  - Which **templates** they rely on heavily.

- **Time-Based Insights**

  - Filters: `Last 24h`, `Last 7 days`, `Last 30 days`, `Custom range`.
  - Charts:
    - Line chart: prompts refined per day.
    - Stacked bar: templates/categories per time window.

- **Quality/Behavior Signals (per user)**
  - Approximate **acceptance rate**:
    - % of refinements that are used “as is” (minimal edits before send).
  - Edit intensity:
    - Light vs heavy edits after refinement.
  - Optional: “Prompt satisfaction” if you ever add rating UI.

The User Dashboard should feel like a **personal prompt cockpit**: clean overview + nerdy detail for people who care.

---

### 2.2 Master Dashboard (Admin / “Mission Control”)

**Audience:** You (and any future admins).

**Primary responsibilities:**

- **Global Metrics**

  - Total prompts refined (lifetime and per time range).
  - Total users per plan (Free / Light / Pro / future Team).
  - Aggregate latency statistics:
    - p50 / p90 / p99 latency.
    - Error rates per endpoint/model.
  - Token-level metrics if tracked:
    - Total input tokens vs output tokens.

- **Per-Category Analytics**

  - Volume per category (coding, writing, planning, research, communication, creative, general).
  - Category growth over time:
    - Which categories are trending up/down.

- **Per-Template Analytics**

  - Top templates by:
    - Usage (total refinements).
    - Acceptance rate / low-edit rate.
    - Latency and error rate.
  - Underperforming templates:
    - High error rate.
    - Low usage.
    - High edit/revert behavior.

- **Time-Series & Trend Analysis (Deep)**

  - Time filters: `Last 24h`, `7d`, `30d`, `90d`, `YTD`, `All`, `Custom`.
  - Graph examples:
    - Line charts:
      - Total prompts/day, segmented by plan.
      - Avg latency/day, segmented by model or category.
    - Stacked bars:
      - Category breakdown per week/month.
    - Heatmaps:
      - Activity by hour of day vs day of week (usage patterns).
  - Drill-down interactions:
    - Click a data point (e.g. “coding_feature template last 7 days”) → see:
      - Plan distribution.
      - Model distribution (fast vs precise).
      - Behavior signals (accept/edit/revert).

- **“Promising Results” / Template Pipeline Tab**

  - A dedicated area for **template evolution**:
    - Shows templates and experimental variants ranked by:
      - Usage (last 7/30/90 days).
      - Acceptance/edit behavior.
      - User ratings (from template store).
    - Columns like:
      - `TemplateId`
      - `Version`
      - `Status` (experimental / beta / GA / deprecated)
      - `Usage (last 30d)`
      - `Acceptance rate`
      - `Average latency`
    - This becomes the **“next templates to release”** triage board:
      - Promote from Experimental → Beta → GA.
      - Flag candidates for deprecation.

- **Plan & Monetization Insights**
  - Revenue/plan breakdown (once Stripe is wired).
  - Usage-per-dollar estimates.
  - Overuse/abuse detection (e.g., users constantly hitting max limits).

The Master Dashboard should feel like a **dark-theme mission control UI** with strong accent colors, animated counters, and smooth drill-downs.

### 2.3 Prompt Lab Master Dashboard (Vision)

Goal: everything about Prompt Lab is observable and explorable — not just aggregate numbers. You can see trends, failures, “hidden gems”, and even individual prompts (for opt-in, non-incognito users) in one “mission control” view.

This section describes the _target_ Prompt Lab Master Dashboard, so future implementation work can line up with it.

#### 1. Top-level Prompt Lab overview

Cards + charts:

- **Total Lab coverage**

  - % of templates under Prompt Lab evaluation
  - # of template versions active (1.0.0, 1.1.0, etc.)
  - # of synthetic tasks in corpus

- **User behavior**

  - Opt-in rate over time, by plan.
  - Refines per day/week by category.

- **Quality trend**
  - Global acceptance vs heavy-edit rate over time.
  - Average raw → refined length change.

This gives a “health at a glance” for Prompt Lab.

#### 2. Template leaderboard

A table like:

- Template (slug)
- Current GA version
- Usage (last 7/30 days)
- Acceptance rate
- Heavy-edit rate
- Lab score (once we have `lab_scores`)
- Trend arrows (improving / flat / declining)

Filters:

- By category (coding, writing, planning, etc.)
- By plan (free vs pro vs admin)
- By status (GA vs Experimental vs Deprecated)

Use cases:

- Spot “hidden gems” (low usage but great metrics).
- Catch “silent failures” (high usage, high heavy-edit).

#### 3. Template detail drilldown

When you click into a template (e.g. `coding_feature_default`), you see:

- **Version history table**, e.g.:

  | Version | Period           | Usage | Accept % | Heavy-edit % | Lab score | Notes           |
  | ------- | ---------------- | ----- | -------- | ------------ | --------- | --------------- |
  | 1.0.0   | 2025-11-20 → now | 4,231 | 72%      | 14%          | 0.83      | Initial GA      |
  | 1.1.0   | (future)         | …     | …        | …            | …         | Prompt Lab bump |

- **Graphs**

  - Usage over time.
  - Acceptance vs heavy-edit over time.
  - (Later) Lab score over time and across versions.

- **Samples**
  - Anonymized example prompts + refined outputs pulled from:
    - Synthetic tasks (`synthetic_tasks`).
    - Opt-in user samples (`prompt_samples`).

This is where you answer: “Is this template actually getting better?”

#### 4. Prompt-level exploration (for you only, not public)

We want a way to “see every prompt” while respecting privacy.

Data model:

- `RefineEvent` = high-level metadata, _no_ raw content.
- `prompt_samples` = separate table with:
  - `refineEventId` (FK)
  - `rawText` (sanitized)
  - `refinedText` (optional/sanitized)
  - `templateSlug`, `templateVersion`, `plan`, `category`
  - Timestamps

UI:

- Filters:

  - Category, template, plan
  - Edit bucket (`none` | `light` | `heavy`)
  - Date range
  - Opt-in status, incognito=false

- List of prompts:
  - Raw text snippet
  - Refined text snippet
  - Key metadata (templateSlug, version, plan, category, edit bucket)

Use this to:

- See what “messy” input users actually send.
- Find patterns that drive heavy edits.
- Choose where to invest in new templates/variants.

#### 5. Lab scoring views (after we add lab tables)

With Prompt Lab tables in place (`synthetic_tasks`, `lab_runs`, `lab_scores`), each template version gets offline scores such as:

- `structure_score`
- `contract_score`
- `domain_score`
- Pass/fail on Orbitar Prompt Contract conditions

Dashboard views:

- Compare Lab scores vs real acceptance rate.
- Compare template versions on the same task set (A/B style).
- Highlight variants that are promising in Lab but under-used in production.

This is the R&D view of Prompt Lab.

#### What’s left to do to fully realize this vision

Data/model work:

- [x] Extend `RefineEvent` with:
  - `acceptedAt`
  - `reverted`
  - `editDistanceBucket` (`"none" | "light" | "heavy"`)
- [x] Add Prompt Lab–specific tables:
  - `synthetic_tasks`
  - `prompt_samples`
  - `lab_runs`
  - `lab_scores`
- [ ] (Optional) Add aggregated/materialized metrics views such as
  - `template_version_daily_metrics` for quicker dashboard queries.

UX work:

- [ ] Build `/admin/prompt-lab` or `/admin/master` with:
  - Overview
  - Template leaderboard
  - Template detail pages
  - Prompt explorer
  - Lab scoring views
- [ ] Use the anti–“AI slop” dashboard aesthetic:
  - Dark “mission control” vibe
  - Strong accent colors for status/health
  - Smooth charts and animations

Operational:

- [ ] Decide a cadence for Lab runs (nightly/weekly) and how they’re triggered.
- [ ] Implement jobs/pipelines to:
  - Populate `synthetic_tasks` and `prompt_samples`.
  - Create `lab_runs` and `lab_scores` for selected template versions.
- [ ] Keep `PROMPT_LAB_CHANGELOG.md` updated for each schema/behavior change so graphs can be interpreted historically.

---

## 3. Data Collection, Logging & Privacy

Goal: capture **as much useful signal as possible** while staying privacy-respectful and aligned with best practices. This is a top priority.

### 3.1 Default Per-Refinement Logs

For **every** refinement, log:

**Metadata (high value, low risk):**

- `userId` (internal UUID or hashed ID).
- `plan` (Free / Light / Pro / future Team).
- `timestamp` + time zone offset.
- `source` (ChatGPT, Notion, Gmail, “Other Web”, etc.).
- `category` and `templateId`.
- `modelStyle` (fast/precise) and actual `model` used.
- `latencyMs`.
- `status` (success / error type).
- `inputLengthTokens`, `outputLengthTokens`.

**Behavioral signals:**

- Was the refined text:
  - Used as-is?
  - Edited lightly (small changes) before send?
  - Edited heavily?
  - Abandoned (user reverted or cleared input)?
- Derived by:
  - Comparing post-refinement text vs final text sent.
  - Measuring the time from **Refine → Send** or **Refine → editor changes**.

These signals feed:

- Template ranking.
- Template pruning (what to drop).
- The **“Promising Results”** view in the Master Dashboard.
- Marketing claims like “Refined based on thousands/millions of real prompts.”

---

### 3.2 Logging Prompt Content Safely

Raw text is the most powerful data but also the most sensitive.

#### A. Explicit consent and controls

- Onboarding and settings clearly explain:
  - By default, Orbitar uses your text **only** to generate refinements (it must go to Orbitar + model provider).
  - Using your content to **improve templates** is optional and controlled.
- Controls:
  - Global toggle: **“Share anonymized prompts to improve Orbitar”** (opt-in is safest).
  - Per-refinement override: **“Incognito refine”** in the toolbar that:
    - Skips content logging even if the global toggle is on.

#### B. Aggressive anonymization

Before anything is used for improvement / analytics:

- Automatic PII redaction pipeline:
  - Strip emails, phone numbers, URLs, obvious IDs, credit-card patterns, etc.
  - Optionally redact likely names / usernames if they follow certain patterns.
- Store `userId` as internal IDs, not emails or raw identifiers.
- Keep a clear boundary between:
  - **Operational logs** (debugging, abuse detection).
  - **Improvement data** (for template analytics and Prompt Lab).

#### C. Retention policy

- Keep raw or lightly redacted text for a limited period (e.g. 30–90 days).
- Periodically aggregate into:
  - Usage counts & distributions.
  - Template performance metrics.
- After the retention window:
  - Delete or fully anonymize raw text.
  - Keep only aggregate, non-identifying metrics.

#### D. Ecosystem context & positioning

- Many AI tools log prompts to improve models/features; this is **normal** when users consent.
- The bad reputation comes from:
  - Silent collection.
  - Over-collection (grabbing whole pages, passwords, etc.).
  - Vague or misleading privacy policies.
- Orbitar’s positioning:
  - **Transparent**: clear, front-and-center explanation of what is collected and why.
  - **Constrained**: only used to provide/improve Orbitar, never sold, never shared with unrelated third parties.
  - **User-controlled**: explicit opt-in, easy opt-out, Incognito refines.

#### E. Truthful marketing language

You **cannot** honestly say:

> “No private data leaves your keyboard.”

Because:

- The text must be sent to Orbitar’s backend and your AI provider in order to generate a refinement.

What you **can** say:

- “Your text is only sent to Orbitar and our AI provider to generate the refinement.”
- “We never sell your data.”
- “We never train our own models on your content unless you explicitly opt in.”
- “When you opt in, we strip common identifiers before using anonymized snippets to improve templates.”
- “Incognito refines always skip content logging.”

The marketing narrative becomes:

> “Refined based on thousands/millions of prompts from users who explicitly chose to help improve Orbitar — with aggressive anonymization and clear controls.”

---

### 3.3 Onboarding & Data Use Screen (Post-Install)

After installing the extension (and ideally on first login to the web app), users should be shown a **“Thank you / Data Use”** screen that:

- Explains what Orbitar does.
- Explains how text is handled.
- Asks for **explicit opt-in** to share anonymized prompt results.

**Concept copy (draft):**

> **Thanks for installing Orbitar 🚀**  
> Orbitar helps you turn half-baked ideas into sharp, model-ready prompts — right inside tools like ChatGPT.
>
> To keep improving the templates and categories that power Orbitar, we’d love your help.
>
> **How we handle your text**
>
> - Your text is sent securely to Orbitar and our AI provider **only** to generate a refined prompt.
> - By default, we **don’t use your content to train models or build new templates**.
> - If you choose to help improve Orbitar, we:
>   - Strip out common identifiers (emails, phone numbers, URLs, IDs).
>   - Store anonymized snippets for a limited time to analyze which templates work best.
>   - Never sell your text or share it with advertisers.
>
> **Help improve Orbitar** > [ ] Share anonymized prompts & refinements to improve templates  
> _(You can change this any time in Settings. “Incognito refine” always skips logging.)_

**Implementation notes:**

- This screen should appear:
  - Immediately after first install (extension opens a new tab).
  - Or on first login if discovered via the web app.
- The same settings should be:
  - Accessible in the User Dashboard.
  - Reflected in extension UI (e.g. Settings → “Data & privacy”).

---

### 3.4 Prompt Ledger & Cloud-Agnostic Storage

Goal: capture every refinement event in a portable, provider-agnostic way, so Orbitar can (a) keep a complete history of prompts and (b) move that history between GCP accounts or even clouds in the future.

#### 3.4.1 Prompt Ledger – append-only event log

Orbitar maintains a **Prompt Ledger**: an append-only log of every refinement event.

**Storage:**

- Primary store: a Cloud Storage bucket, e.g. `orbitar-prompt-ledger`.
- Layout: partitioned by date for easy querying and movement, e.g.:

  - `logs/year=2025/month=11/day=25/part-00001.ndjson`
  - `logs/year=2025/month=11/day=25/part-00002.ndjson`, etc.

- Format: **NDJSON** (newline-delimited JSON). Each line = one refine event.

**Event shape (conceptual):**

This closely mirrors `PromptEvent` and `RefineEvent` in the DB so everything stays in sync:

````jsonc
{
  "eventId": "uuid",
  "timestamp": "2025-11-25T10:23:45Z",
  "userId": "user_xxx",            // internal ID or hash, never raw email
  "plan": "light",                 // free | light | pro | admin
  "source": "extension:chatgpt",   // where the refine happened
  "category": "writing",
  "templateSlug": "writing_x",
  "templateVersion": "1.0.0",

  "promptLabOptIn": true,
  "isIncognito": false,

  "rawTextLength": 2743,
  "refinedTextLength": 932,
  "inputTokens": 800,
  "outputTokens": 220,
  "latencyMs": 2135,
  "model": "gpt-5.1-codex",

  // Only present when allowed by privacy rules (see below)
  "rawText": "user's messy input, anonymized",
  "refinedText": "final refined prompt, anonymized"
}
Two layers of data:

Meta-only (always logged):

Plan, category, templateSlug, templateVersion

Source, timings, token counts, error status, flags

Content snapshots (conditional):

rawText and/or refinedText, only when:

promptLabOptIn = true

isIncognito = false

Text has passed the anonymization/redaction pipeline described in §3.2

This gives Orbitar a complete behavioral history while still respecting privacy and Incognito guarantees.

3.4.2 Analytics layer – BigQuery as a view, not the source of truth
On top of the Prompt Ledger bucket, Orbitar uses BigQuery as an analytics and Prompt Lab driver:

Dataset: prompt_lab

Table: prompt_events (partitioned, optionally external table over the bucket or periodically loaded)

BigQuery is used for:

Dashboard queries (user + admin + Prompt Lab views)

Sampling data for background experiments

Quick ad-hoc analysis (e.g., “show me all writing_x prompts from Pro users last 7 days”)

However, the canonical record is the NDJSON in Cloud Storage. If we ever change warehouses (new GCP project, different cloud, local analysis), we can:

Rebuild tables by re-importing from the bucket.

Or stream the NDJSON elsewhere entirely.

3.4.3 Portability across GCP accounts and clouds
Because the Prompt Ledger is just NDJSON in a bucket:

Moving to a new GCP project/account:

gsutil cp gs://old-bucket/... gs://new-bucket/...

Update env vars: PROMPT_LEDGER_BUCKET, BIGQUERY_PROJECT_ID, etc.

Moving off GCP:

Sync the bucket to another provider (S3, R2, local disk) and rebuild analytics there.

This directly supports the goal of keeping every prompt and still being able to “store it elsewhere later” without locking Orbitar into a single GCP account or vendor.

3.4.4 Interaction with Prompt Lab
Prompt Lab consumes data from two places:

Prompt Ledger / prompt_events for:

Usage patterns, plan/category/template stats

Candidate samples per template/version

Prompt Lab–specific tables (synthetic_tasks, prompt_samples, lab_runs, lab_scores) for:

Controlled experiments

Judge scores (heuristic + Vertex)

Version-to-version comparisons

The ledger is the long-term brainstem; Prompt Lab is the R&D cortex sitting on top of it.

vbnet
Copy code

---

## 2️⃣ Optional future-direction subsection under “4. Background ‘Prompt Lab’ Agents”

If you want the doc to explicitly encode the “no-template / learned-from-best-prompts” direction, add this at the end of section 4 as **4.5 Prompt Memory & Retrieval (Future Direction)**:

```md
### 4.5 Prompt Memory & Retrieval (Future Direction)

Long-term, Orbitar should be able to learn from its own successes instead of relying only on hand-authored templates.

**Idea:** use Prompt Lab + Prompt Ledger to build a **Prompt Memory** layer:

- For each category/template, store:
  - Refined prompts that scored highly in LabRuns.
  - Real-world prompts with strong acceptance/low-edit behavior.
  - Their associated metadata (task type, domain, model, plan).

Over time, this becomes a bank of **“elite prompts”** that empirically work well.

Future refinement path:

1. User sends messy text and clicks Refine.
2. Refine engine:
   - Classifies the task (coding debug, blog post, X thread, etc.).
   - Retrieves a small set of high-performing refined prompts from Prompt Memory that match the task.
3. The model sees:
   - User’s raw text.
   - Orbitar’s philosophy + core rules.
   - 2–3 retrieved “winner” prompts as patterns/examples.
4. It synthesizes a new refined prompt that:
   - Keeps user-specific context and constraints.
   - Respects Orbitar’s contract (10-second bar, context packaging, etc.).
   - Borrows structure/phrasing from what has already been proven to work.

In this world, the current **TemplateBehavior configs** act as:

- A **strong prior / fallback** for new or rare tasks.
- A safety net when retrieval has little or no data.

Prompt Memory + retrieval lets Orbitar gradually shift from **hand-designed behavior presets** toward **learned, data-driven prompt patterns**, while still staying debuggable and controllable.

---

## 4. Background “Prompt Lab” Agents

Background agents exist primarily for **R&D and testing**, not as your core marketing claim.

### 4.1 Core Purposes

1. **Stress-Test Templates**

   - Feed them structured tasks:
     - Coding bugs, feature requests, doc-writing tasks, blog intros, research questions, planning tasks.
   - Compare how different templates perform on the same input.
   - Measure:
     - Structural adherence (did it follow the format rules?).
     - Length, clarity, token usage.
     - Latency and error rate per template/model.

2. **Auto-Generate & Refine Templates**

   - “Meta-agents” ingest:
     - Best-performing real prompts (aggregated/anonymized).
     - Worst-performing ones (high edit/revert).
   - They propose:
     - Improved system instructions.
     - New template variants.
   - You review proposals → keep the winners → mark them as **experimental** in the Master Dashboard.

3. **Build a Synthetic Test Corpus**
   - Maintain a fixed benchmark set:
     - e.g. 100 coding, 100 writing, 100 planning, 100 research prompts.
   - Agents can:
     - Generate realistic-but-not-real-user prompts to expand this corpus.
   - Every time you change templates/models:
     - Re-run the corpus to see if quality or latency improved/regressed.

### 4.2 Continuous Validation Loop

- **Nightly job:**

  - Sample 100–500 recent prompts (from users who opted in to data use).
  - Run them through:
    - Current production templates.
    - 1–2 experimental templates.
  - Score outputs (automatic + heuristic checks).

- **Master Dashboard “Prompt Lab” panel:**
  - Shows:
    - Experimental templates and variants.
    - Test corpus metrics.
    - Nightly job results.
  - Feeds directly into the **“Promising Results”** tab.

This enables the statement:

> “Orbitar’s templates are continuously improved by a feedback loop of real user prompts, analytics from our Master Dashboard, and an internal ‘Prompt Lab’ of AI agents stress-testing new ideas.”

---

### 4.3 Prompt Lab – User-Facing Copy

This section stores the canonical copy for the public `/prompt-lab` page and the settings toggle, without revealing implementation details to competitors.

#### What is Prompt Lab?

Prompt Lab is Orbitar’s behind-the-scenes engine that tests and improves the prompts used by the Refine button.

Instead of freezing your prompts in time, Orbitar runs controlled experiments in the background to keep templates sharp, structured, and aligned with how people actually use the product.

#### What happens if I opt in?

If you opt in, a small sample of your prompts is anonymized and used in internal tests to make better templates.

- Uses a sample of your prompts to test better prompt templates.
- Anonymized & time-limited.
- Incognito refinements are never included.

#### What Prompt Lab does _not_ do

Prompt Lab does **not**:

- Expose your individual prompts or data publicly.
- Share implementation details, template names, or metrics that would help competitors copy the system.
- Use Incognito refinements in any experiments.

#### Settings toggle (short form)

- **Label**:
  `Help improve Orbitar’s templates (Prompt Lab)`

- **Subtext (2 lines)**:
  `Uses a sample of your prompts to test better prompt templates.`
  `Anonymized & time-limited. Incognito is never included.`

  ### 4.4 Prompt Lab Changelog Discipline

Any time you make Prompt Lab–related changes (migrations, new tables, or big behavior changes), add a one-line entry to `PROMPT_LAB_CHANGELOG.md`.

Why:

- When a metric shifts, you can line it up with a concrete change.
- Future you can see when versioning, metrics, or sampling logic changed.

Example entries:

```md
## 2025-11-25

- v0.1 – Added RefineEvent table, promptLabOptIn, isIncognito. Basic refine logging wired.
- v0.2 – Introduced templateSlug + semver version registry. All GA templates at 1.0.0.

---

## 5. Template Ecosystem & Store

### 5.1 Internal Template System

- Categories (coding, writing, planning, research, communication, creative, general).
- Each template has:
  - `id`, `label`, `description`, `category`.
  - Internal system instructions + output rules.

### 5.2 Template Lifecycle

- **Lab** → **Experimental** → **Beta** → **General Availability (GA)** → **Deprecated**

- Driven by:
  - Usage metrics.
  - Acceptance/edit behavior.
  - User ratings/feedback (from template store).
  - Background agent experiments (Prompt Lab).

### 5.3 Website Template Section / Store

- Public **Templates** section on the site:

  - Users can:
    - Browse templates by category and tags.
    - Enable/disable templates in their personal profile.
    - See which templates are:
      - GA
      - Beta (early access)
      - Experimental (admin-only view)

- **Plan-based access:**

  - **Free**:
    - Limited set of core templates.
  - **Light** (renamed from “Builder”; geared toward lighter AI users):
    - Access to a broader set.
    - Some Beta templates.
  - **Pro**:
    - Full template library.
    - **Early access** to upcoming templates (more Beta / pre-release).
    - Stronger daily limits.
  - (Optional future) **Team**:
    - Shared template collections.
    - Org-level preferences.

- **Master Dashboard integration:**
  - “Promising Results” area lists templates rising in performance.
  - Admin can:
    - Promote templates from Experimental → Beta → GA.
    - Attach “Beta” flags that show up in the store.
    - Review user feedback/rating summaries.

---

## 6. Design System & Anti–“AI Slop” Frontend Direction

All web UI (marketing site + dashboards) should follow this anti–“AI slop” brief:

- **Typography**

  - Use distinctive, beautiful fonts.
  - Avoid generic system fonts (Arial, Inter, Roboto).
  - Choose typefaces that reinforce mood (e.g., IDE-inspired mono fonts for metrics, expressive sans/serif for headings).

- **Color & Theme**

  - Commit to a cohesive aesthetic:
    - Bold primary background (often dark).
    - Strong, sharp accent color(s).
  - Use CSS variables for palette consistency.
  - Draw inspiration from:
    - IDE themes.
    - Specific cultural/visual aesthetics.

- **Motion**

  - Use animations intentionally:
    - Page-load sequences with staggered reveals.
    - Subtle hover/micro-interactions on cards and charts.
  - Prefer CSS-only animations where possible.
  - For React, use Framer Motion / Motion library for high-impact transitions.

- **Backgrounds**

  - Avoid flat, boring, single-color backgrounds.
  - Layer:
    - Gradients.
    - Noise textures.
    - Abstract shapes or geometric patterns.
  - Make backgrounds feel “ambient” and contextual, not generic.

- **Dashboard Aesthetic**

  - **User Dashboard:**

    - Polished IDE-style theme.
    - Tight typography, rich background.
    - Beautiful charts, smooth hover interactions.

  - **Master Dashboard:**
    - Dark “mission control” vibe.
    - Strong accent colors for status indicators.
    - Animated number counters and cards for key metrics (total prompts, total tokens, avg latency, active users, etc.).
    - Clear layout for drill-down analytics and Prompt Lab views.

Above all: avoid predictable layouts, overused fonts, generic purple-on-white gradients, and cookie-cutter component patterns. Each page should feel specifically designed for Orbitar.

---

## 7. Plans & Pricing (Conceptual Direction)

Conceptual tiering:

- **Free**

  - Limited daily refinements.
  - Core template set only.

- **Light** (renamed from “Builder”; for lighter AI usage)

  - Medium daily limits.
  - Access to more templates and some Beta ones.
  - Geared towards users who benefit from better prompts but aren’t heavy AI users.

- **Pro**

  - High daily limits.
  - All templates + early access to new ones.
  - Best suited for builders, founders, power users.

- **(Future) Team**
  - Shared usage pool.
  - Shared template libraries.
  - Organization-level analytics.

These tiers will be wired to Stripe and exposed in the marketing site + dashboards.

---

## 8. ✅ Completed (Current State)

### Backend (`/backend`)

- **Framework**: Next.js 14 App Router with TypeScript & Tailwind CSS.
- **Database**: Prisma Schema defined (`User`, `ApiKey`, `Plans`). SQLite configured for local dev.
- **Authentication**: NextAuth.js set up with `CredentialsProvider` for "Dev Login" (bypassing Google OAuth for now).
- **API**:
  - `/api/auth/*`: Handles login/session.
  - `/api/refine-prompt`: Validates API keys, checks daily limits, selects templates, and calls OpenAI (logic implemented).
  - Server Actions: `generateApiKey`, `revokeApiKey` (with soft delete).
- **Dashboard**: UI for viewing plan, usage, and managing API keys.
- **Styling**: Fixed dark mode text visibility issues.

### Chrome Extension (`/extension`)

- **Manifest V3**: Correctly configured with permissions and host permissions.
- **Content Script**:
  - Detects focus on inputs/textareas/content-editables.
  - Injects floating Orbitar icon on generic sites.
  - **ChatGPT adapter**:
    - Renders a “ChatGPT-style” inline toolbar positioned _above_ the input/composer.
    - Shows plan pill, category/template selects, model style, and a styled **Refine** button.
- **Logic**:
  - Sends text + options to backend via background script.
  - Receives refined text and replaces the input value.
- **Popup**:
  - Simple settings page to save the Orbitar API Key into `chrome.storage.sync`.
- **Background**:
  - Handles API calls to backend (`localhost:3001` and fallbacks) to avoid CORS issues in the content script.

---

## 9. 🛠 To Do: Development Environment

_Goal: Get the app fully working on your local machine for testing and demoing._

1. **OpenAI API Key**

   - [ ] Get a real OpenAI API Key.
   - [ ] Update `backend/.env` with `OPENAI_API_KEY=sk-...` and `OPENAI_MODEL` (e.g. `gpt-5-mini` or equivalent).
   - [ ] Verify `/api/refine-prompt` works reliably and quickly (optimize away double-model calls where possible).

2. **Stripe Integration (Mock/Test)**

   - [ ] Set up Stripe CLI for local webhook forwarding.
   - [ ] Implement `/api/webhooks/stripe` to handle:
     - `checkout.session.completed`
     - `customer.subscription.updated`
   - [ ] Wire “Subscribe/Upgrade” buttons on the dashboard to Stripe Checkout URLs and test plan transitions (Free → Light → Pro).

3. **Error Handling & Polish**
   - [ ] Add toast notifications for success/error states in the Dashboard.
   - [ ] Improve extension error messages (backend down, key invalid, rate limit, etc.).
   - [ ] Add clear UI around “Incognito refine” and data-usage preferences (even if stubbed initially).

---

## 10. 🚀 To Do: Production Environment

_Goal: Deploy the app for real users._

1. **Database Migration**

   - [ ] Switch from SQLite (`file:./dev.db`) to PostgreSQL (e.g., Supabase, Neon, or Vercel Postgres).
   - [ ] Update `schema.prisma` provider to `postgresql`.
   - [ ] Run `npx prisma migrate deploy`.

2. **Authentication (Real)**

   - [ ] Create a Google Cloud Project.
   - [ ] Configure OAuth Consent Screen and get Client ID / Secret.
   - [ ] Switch `authOptions` in NextAuth from `CredentialsProvider` to `GoogleProvider`.
   - [ ] Set `NEXTAUTH_URL` to the real domain (e.g., `https://getorbitar.com`).

3. **Environment Variables**

   - [ ] Set production variables in Vercel/host:
     - `DATABASE_URL` (Postgres)
     - `NEXTAUTH_SECRET`
     - `OPENAI_API_KEY`
     - `OPENAI_MODEL`
     - `STRIPE_SECRET_KEY` (Live mode)
     - `STRIPE_WEBHOOK_SECRET` (Live mode)
     - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`

4. **Extension Deployment**

   - [ ] Update `API_BASE_URL` in `extension/background.js` to the production URL.
   - [ ] Create a production build of the extension (zip `extension/` folder).
   - [ ] Submit to Chrome Web Store (pay fee, provide screenshots, privacy URL, etc.).

5. **Legal & Compliance**
   - [ ] Add Privacy Policy and Terms of Service pages (required for Google OAuth and Chrome Web Store).
   - [ ] Document data collection, anonymization, and retention policies clearly.
````

## 11. 12-Week Prompt Lab & GCP Rollout Plan

Goal: use the next ~12 weeks and ~$300 in GCP credits to turn Prompt Lab from “v0 works” into a real, continuously-running, Vertex-judged template engine that clearly improves refinement quality.

This plan assumes:

- Refinement stays on OpenAI/OpenRouter.
- Prompt Lab batches (LabRun/LabScore) run on a dedicated Cloud Run worker.
- Vertex AI is used as a **judge** for a subset of runs, with results stored in extra fields.

---

### Week 1–2: Solidify Infra & Cadence

**Focus:** Get the Cloud Run worker and Scheduler reliably running, with heuristic scoring only.

- [ ] Finish GCP one-time setup (if not already done):

  - Project + APIs (Cloud Run, Cloud Build, Scheduler, Artifact Registry, Secret Manager).
  - Artifact Registry repo created (e.g. `prompt-lab`).
  - Service account for `prompt-lab-worker` with Secret Manager + Cloud Run Invoker.

- [ ] Build & deploy Prompt Lab worker to Cloud Run using `Dockerfile.prompt-lab`:

  - Image in Artifact Registry: `$REGION-docker.pkg.dev/$PROJECT_ID/prompt-lab/prompt-lab-worker:latest`.
  - Env/secrets wired:
    - `DATABASE_URL` via Secret Manager.
    - `OPENROUTER_API_KEY` (or equivalent) via Secret Manager.
    - `NODE_ENV=production`, `LAB_BATCH_LIMIT` (start ~10–20).

- [ ] Create Cloud Scheduler job:

  - Cron: `0 * * * *` (hourly) or start with `0 3 * * *` (nightly).
  - HTTP POST to Cloud Run URL with OIDC auth.
  - Verify in logs:
    - `[PromptLabCron] Starting Lab batch { limit: ... }`
    - `[PromptLabCron] Completed Lab batch { runsCreated, scoresCreated }`.

- [ ] Monitor dev DB:
  - Confirm `LabRun` / `LabScore` counts steadily increase.
  - Check no obvious failure patterns or runaway error logging.

---

### Week 3–4: Wire Vertex Judge Fields & Stubs

**Focus:** Extend schema + code so Vertex-based judging can plug in cleanly, even if initial calls are manual/limited.

- [ ] Extend `LabScore` model with judge fields (Prisma migration):

  - `judgeModel       String?` // e.g. "vertex:gemini-1.5-pro"
  - `judgeScore       Float?` // 0–1 or normalized 0–10
  - `judgeExplanation String?` // short rationale

- [ ] Create `lib/promptLabVertexJudge.ts`:

  - Input: `{ category, templateSlug, templateVersion, rawText, refinedPrompt, heuristicScores }`.
  - Output: `{ judgeModel, judgeScore, judgeExplanation }`.
  - Initially:
    - Stub with a **fake/local** scoring function that just wraps heuristic scores.
    - Keep the surface area stable for when Vertex is added.

- [ ] Add `scripts/runPromptLabJudgeBatch.ts`:

  - Finds recent `LabScore` rows where `judgeScore IS NULL`.
  - Joins to `LabRun` + underlying `PromptSample`/`SyntheticTask`.
  - Calls `promptLabVertexJudge` and updates `LabScore`.
  - Logging prefix: `[PromptLabJudge] ...`.

- [ ] Add `"lab:judge-batch"` npm script and (optionally) a second Dockerfile or `LAB_MODE=judge` branch.

- [ ] Run judge batches locally against a small set and validate:
  - No crashes, fields populated as expected.
  - Judge scores/explanations look sane (even if stubbed).

---

### Week 5–8: Integrate Real Vertex AI & Focus on High-Impact Templates

**Focus:** Start actually burning GCP credits, but surgically, where it matters.

- [ ] Enable Vertex AI in the GCP project and set up auth for the worker:

  - Service account with Vertex AI permissions.
  - Vertex endpoint & model name configured via env (e.g. `VERTEX_JUDGE_MODEL`).

- [ ] Replace stub logic in `promptLabVertexJudge.ts` with real Vertex model calls:

  - Build a **strict JSON-returning prompt** for the judge:
    - Inputs: raw user text, refined prompt, category, template slug/version, heuristic scores.
    - Output: `{ "score": number between 0 and 1, "explanation": "..." }`.
  - Parse safely; defensive checks on malformed JSON.

- [ ] Budget strategy (to stretch credits over ~3 months):

  - Start with **low daily cap**:
    - e.g. 50–100 judge calls/day.
  - Only judge **interesting** samples:
    - New template versions.
    - Runs where heuristic `overallScore` is mid-range (e.g. 0.3–0.7).
    - Categories/templates you care most about (coding_feature, writing_blog, planning_roadmap, etc.).

- [ ] Update `/admin/prompt-lab` to surface judge metrics (read-only v0):

  - For each template/version:
    - Show `avg judgeScore` and `N judged`.
  - A simple table or column added to the leaderboard is fine.

- [ ] Start template improvement cycles:

  - Pick 2–3 templates per category (coding/writing/planning/research).
  - Review:
    - Heuristic scores.
    - Judge scores.
    - Heavy-edit rates (once tracked).
  - Draft improved template variants (bump version: `1.0.0 → 1.1.0`) and mark them as internal/beta.

---

### Week 9–12: A/B Template Evaluation & Lock-In of “Better Than 10-Second” Prompts

**Focus:** Use the data to actually make Orbitar’s templates meaningfully better and lock in improvements.

- [ ] For top templates, run focused A/B comparisons:

  - Take old version (e.g. `coding_feature_default@1.0.0`) and new version (`1.1.0`).
  - Run both on the same synthetic tasks + a sample of real prompts (opt-in, non-incognito).
  - Compare:
    - Heuristic `overallScore`.
    - Vertex `judgeScore`.
    - Real-world acceptance/edit metrics (once behavior API is wired to UX).

- [ ] Promotion rules (can be written into docs/UI later):

  - Promote `1.1.0` to GA if:
    - JudgeScore is significantly higher (e.g. +0.1 or more).
    - Acceptance is not worse and heavy-edit rate is lower or stable.
  - If results are mixed, iterate once more (1.2.0) with targeted changes.

- [ ] Use Prompt Lab results to drive template registry updates:

  - Update `templateVersionRegistry` for promoted versions.
  - Mark underperforming templates as **deprecated** or demoted to experimental.
  - Record major changes in `PROMPT_LAB_CHANGELOG.md` with clear, dated entries.

- [ ] Tighten the loop with the Master Dashboard:

  - Add basic charts/tables that combine:
    - `usage` + `acceptance/edit` + `judgeScore` for each template version.
  - Identify:
    - “Hero” templates (high usage, high judgeScore, low heavy-edit).
    - “Problem” templates (high usage, low judgeScore, high heavy-edit).

- [ ] End-of-credits checkpoint (~3 months):

  - Summarize:

    - # of LabRuns, LabScores, judged samples.
    - Improvements in acceptance/heavy-edit metrics vs starting point.
    - Template versions that clearly beat the “10-second bar”.

  - Use this summary for:
    - Internal confidence that Prompt Lab is **actually** working.
    - External marketing narrative about “continuously optimized templates trained on real-world usage (with explicit opt-in and anonymization).”
