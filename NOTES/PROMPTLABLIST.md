Prompt Lab – Setup Checklist
This is a linear setup guide you can drop into the repo as PROMPT_LAB_SETUP.md.

0. Goals & Definitions
   Goal: Turn Prompt Lab into an always-on R&D loop that:

Tests templates against synthetic + opt-in real prompts.

Scores them using the Orbitar Prompt Contract.

Surfaces winners in the Master Dashboard for promotion to GA.

Key pieces you’re wiring up:

Data: synthetic tasks + anonymized real prompts.

Infra: lab jobs + workers that call your existing refine engine.

Metrics: structure/quality scores + real usage stats.

UI: dashboards + template lifecycle (Lab → Experimental → Beta → GA → Deprecated).

1. Prerequisites

Working Orbitar backend (Next.js / API routes) and DB (Prisma + Postgres).

refine-prompt (or equivalent) API that:

Accepts: raw user text, category, template ID/version, model config.

Returns: refined prompt + metadata.

Master Dashboard skeleton in place (admin-only).

If any of this is still in progress, finish those first.

2. Instrument the Existing Refine Path

Attach template metadata to every refine call

Ensure every refine request has:

template_id

template_version

category (coding/writing/planning/research/etc.)

plan (Free / Light / Pro)

Make sure you can log this even if the user didn’t explicitly pick a template (default template in each category).

Log per-refine event (minimal schema)

Add a refine_events table with fields like:

id

user_id (nullable / hashed)

plan

category

template_id

template_version

raw_text_length

refined_text_length

created_at

accepted_at (nullable)

reverted (bool)

edit_distance_bucket (e.g. none / light / heavy)

Create a simple mechanism to record:

“User accepted prompt” (sent without big edits).

“User heavily edited or reverted” (if you can detect it).

Add a privacy-safe sharing toggle

Add user_settings.prompt_lab_opt_in (boolean).

In the extension UI + app, add:

“Help improve Orbitar’s templates (Prompt Lab)” toggle.

Ensure Incognito requests never feed into Prompt Lab, regardless of toggle.

3. Create Core Prompt Lab Tables
   Add these tables (names can vary; keep the concepts):

Templates & Versions

templates:

id, slug, category, description, owner_user_id

template_versions:

id, template_id

version

status (lab, experimental, beta, ga, deprecated)

prompt_body (the system instructions / template text)

created_at, created_by

notes

Synthetic Task Corpus

synthetic_tasks:

id

category (coding/writing/planning/research/etc.)

input_text

difficulty (optional)

tags (JSONB)

Opt-in Real Prompt Samples (anonymized)

prompt_samples:

id

source (user_opt_in, internal, other)

category

raw_text (sanitized)

plan

created_at

Add a small pipeline that:

Reads from refine_events where prompt_lab_opt_in = true.

Samples a subset (e.g. 1–5%) into prompt_samples.

Strips obvious PII where possible.

Lab Runs & Scores

lab_runs:

id

template_version_id

task_type (synthetic, real_sample)

task_id (FK to synthetic_tasks or prompt_samples)

model_name

status (pending, running, done, error)

started_at, finished_at

raw_refined_prompt (text)

lab_scores:

lab_run_id

structure_score (0–1)

length_score

contract_score (e.g. JSON validity, section presence)

domain_score (coding/writing specific)

overall_score

metrics_json (extra details)

4. Seed the Synthetic Corpus

Define minimum coverage

Decide counts per category:

Coding: e.g. 100–200 tasks (bugfixes, features, refactors).

Writing: 100 tasks (blog posts, emails, docs).

Planning: 50–100 tasks (roadmaps, study plans, itineraries).

Research: 50–100 tasks (comparisons, summaries, evaluations).

Create v0 corpus

Manually seed a handful of high-quality examples in each category.

Use an AI helper to generate more tasks, but review lightly.

Tag each task with:

Difficulty

Domain (frontend/backend, marketing/technical, etc.)

Store corpus

Insert all tasks into synthetic_tasks.

Add a simple admin view to browse/edit them later (optional for v0, but nice).

5. Implement the Prompt Lab Job Pipeline

Define Lab job type

Create a worker job structure:

lab_job with:

id

template_version_id

task_type

task_id

model_name

status, tries, timestamps.

Create job scheduling logic

Nightly cron (or Cloud Scheduler) that:

Picks N synthetic_tasks per category.

Picks M prompt_samples from the last X days.

For each selected task:

Enqueues jobs for:

Each template_version with status in {lab, experimental, ga} (or some subset).

Add guardrails:

Global token budget per day.

Per-template cap (e.g. 100 tasks/night).

Build the Lab worker

Worker pulls lab_job from queue.

For each job:

Look up task (synthetic or sample).

Look up template_version.

Build system prompt using existing template engine.

Call the refine API / model.

Save raw_refined_prompt to lab_runs.

Call scoring functions (next section).

Save results to lab_scores.

Update job status → done or error.

6. Implement Scoring (Orbitar Prompt Contract)

Create a scoring module

Given:

task + raw_refined_prompt + category

Compute:

Presence of required sections:

Role, Goal, Context, Constraints, Output Contract, Quality/Self-check.

Length & density:

Min/max tokens.

Ratios vs input length.

Contract compliance:

If JSON output is required, can it be parsed?

Code blocks present where expected?

Domain signals:

Coding: mentions tests, error handling, non-breaking changes.

Writing: clarity, audience, tone instructions.

Return normalized scores (0–1) + details.

Optional: add judge model pass

For selected Lab runs, add:

A judge model evaluating: “Is this prompt obviously better than a naive 10-second version?”

Fold its score into overall_score.

Store metrics

Persist all scores in lab_scores.metrics_json.

Consider a template_version_aggregates table to store:

Mean / median scores per template_version per day.

7. Wire Real-World Metrics into Template Versions

Daily aggregations

Nightly job that aggregates refine_events into:

template_version_daily_metrics:

template_version_id, date

usage_count

accept_rate

heavy_edit_rate

revert_rate

avg_time_to_send

Make sure metrics are per-version (not just per template).

Join Lab + live data

Create a view or query that joins:

template_versions

lab_scores (aggregate per version)

template_version_daily_metrics (last 7/30 days)

This is what drives the dashboard.

8. Update the Master Dashboard (Prompt Lab UI)

Add “Prompt Lab” section

In the Master Dashboard, add a “Prompt Lab” tab or section.

For each template_version display:

Template name + version + status.

Overall Lab score + breakdown.

Recent usage, acceptance, heavy edit rate.

Trend indicators (improving / declining).

Add “Promising Results” panel

Sort template versions by:

High Lab score

High usage

Better real-world metrics than current GA

Provide quick links:

View sample refined prompts from the Lab.

Compare GA vs candidate side-by-side.

Template detail view

For a single template_version:

Show raw template text.

Show metrics over time.

Show example Lab runs.

Link to related versions (GA / Experimental / deprecated).

9. Implement Template Lifecycle Controls

Status management

In admin UI, allow changing template_versions.status among:

lab, experimental, beta, ga, deprecated.

Add guardrails:

Only admins/owners can promote to ga.

Deprecating GA forces you to choose a new GA or revert to previous.

Plan & category mapping

Ensure templates link to:

category

allowed plans

When promoting a new GA:

Update the mapping so production requests start using that version.

Rollout strategy

For new GA versions:

Optionally roll out by plan:

Pro → Light → Free.

Or by percentage of traffic (feature flag / experiment key).

10. Cost & Scheduling Controls (GCP)

Budget configuration

Decide a daily/weekly Lab token budget.

Encode limits into:

Job scheduler (e.g., stop enqueuing when total estimated tokens reached).

Infra choices

Run Lab workers via:

Cloud Run jobs / background workers.

Use:

Cloud Scheduler (or cron) to kick off nightly Lab jobs + daily aggregations.

Monitoring

Add basic dashboards/alerts for:

Lab errors (job failures).

Token usage exceeding expected budget.

Unusual drops in Lab scores for important templates.

11. QA & Rollout Checklist
    Before letting Prompt Lab influence production:

Manually run Lab on a small subset of tasks, inspect results.

Validate scoring:

Check that high scores correspond to obviously good prompts.

Check that obviously bad prompts get low scores.

Compare 1–2 new template variants vs current GA:

Use Lab + small internal dogfooding.

Turn on Lab scheduling with:

Conservative task counts.

Low daily budget.

Once stable:

Start promoting templates using the lifecycle (Lab → Experimental → Beta → GA).

Periodically review the “Promising Results” panel and retire weak templates.

Document your promotion rules in this file (so future you/team follow the same process).

12. Future Enhancements (Optional)

Meta-agent that proposes new template variants based on underperforming metrics.

Per-team / enterprise Lab metrics once you have org accounts.

Public marketing page that honestly explains:

Prompt Lab, opt-in data use, and privacy guarantees.

Drop this into the repo, tweak table/field names to match your current schema, and you’ve got a concrete implementation checklist for bringing Prompt Lab to life.
