At a high level, the Prompt Lab is going to be Orbitar’s R&D factory: a background system that constantly stress-tests, evolves, and retires templates so that the stuff behind the Refine button keeps getting sharper without you manually hand-tuning everything forever.

I’ll break it down into:

How it will actually work (end-to-end loop)

Why this design will work (and outperform “static prompt libraries”)

How it scales technically and operationally

1. How Prompt Lab will work

Think of Prompt Lab as a separate lane next to production:

Production lane: real users → extension → /api/refine-prompt → templates → model → refined prompts → dashboards.

Lab lane: synthetic + opt-in user prompts → templates/variants → judge models + metrics → dashboards → promotion/demotion of templates.

1.1 Inputs into the Lab

a) Synthetic corpora (your permanent benchmark)
From the docs: collections of coding, writing, planning, and research tasks that look like real user asks but aren’t tied to specific people.

e.g. 100 coding bugs, 100 feature requests, 100 blog tasks, 100 planning/research prompts.

You can expand these with AI “meta-agents” that generate realistic problem sets.

b) Opt-in anonymized real prompts

When users enable “Share anonymized prompts to improve templates”, a sample of their refinements (with PII stripped + incognito opted-out) gets fed into the Lab as extra test cases.

Incognito refines are never used here.

So the Lab always has:

A stable benchmark set (for regression testing).

A fresh stream of weird real-world prompts (for discovery).

1.2 What the Lab actually runs

On some schedule (nightly / hourly at scale), Prompt Lab jobs do things like:

Pick a batch of tasks

Some from the synthetic corpus, some from recent real prompts (opt-in only).

Pick a set of template variants to test

The current GA template for a category (“coding_feature_standard”).

One or more experimental variants proposed by you or by meta-agents.

Run them through the refine engine + models

For each (task, templateVariant):

Build the Orbitar system prompt using that template.

Call the model(s) through /api/refine-prompt in a sandboxed / non-user environment.

Optionally also run the resulting prompt through a judge model or target model to get a sample of “final answers” (for deeper checks in coding/writing).

Score the results automatically

Using the Orbitar Prompt Contract, you can score a refinement on:

Structure adherence: did we clearly get role, goal, context, constraints, output contract, self-check?

Format correctness:

For JSON output contracts: can we parse it?

For code: does it compile / pass linters / basic tests?

Length & density: is it within desired length bounds and information-dense rather than waffle?

Domain rules: for coding, does it mention tests, error handling, non-breaking changes, etc.?

From Project Status: Prompt Lab is explicitly meant to measure structure adherence, length, required sections, task-specific checks, and comparative performance old vs new templates.

Combine that with real-world behavioral metrics

Separately, your production logging captures:

Acceptance rate (% used almost as-is).

Heavy edit / revert rate.

Time-to-send after refinement.

Those are not from the Lab – they’re from actual users – but Prompt Lab pulls them into the analysis.

1.3 Using the results: template pipeline

All of this flows into the Master Dashboard → Prompt Lab / Promising Results panel:

For each template + version you’ll see:

Usage (last 7/30/90 days).

Lab scores (structure adherence, task success).

Real-world behavior (acceptance vs heavy edits, error rate).

Then you run a formal lifecycle:

Lab → Experimental → Beta → GA → Deprecated.

You (or future team):

Promote variants whose Lab scores and real-world metrics are clearly superior.

Kill or demote templates that underperform.

Tie each template to plans (Free / Light / Pro) so higher tiers get access to more advanced or “riskier” patterns first.

1.4 Where users feel Prompt Lab, indirectly

Users never “visit the Lab”, but they feel the effects:

Refinements snap into a consistent structure because all GA templates are forced to obey the Orbitar Prompt Contract.

Prompts trend toward less editing, fewer reverts, faster time-to-send over time – because those metrics literally decide which templates survive.

New templates appear in the Template Store labeled Beta / Experimental, backed by real metrics rather than vibes.

2. Why this approach will work
   2.1 It’s aligned with your philosophy from day one

Prompt Lab is literally built to enforce the philosophy you already codified:

Every refined prompt must hit Role, Goal, Context, Constraints, Output Contract, and Quality criteria.

The 10-second bar: if the output isn’t obviously better than what the user could write in 10 seconds, it’s a fail.

Because those rules are explicit, the Lab can:

Automatically check whether a refinement satisfies them (via parsing and judge models).

Use those checks as hard constraints, not vague “does this sound nice” metrics.

That’s a huge advantage over generic “prompt collections” which rarely have a machine-checkable contract behind them.

2.2 You’re combining offline and online signals

Most prompt tools do one of these:

Tinker with prompts offline and trust vibes.

Or blindly log prompts and say “trained on millions of prompts” without structure.

You’re explicitly doing both:

Offline: synthetic corpora + automatic scoring for structure and correctness.

Online: real acceptance / edit / revert metrics tied to each template and category.

That loop tends to converge:

If a template looks great in the Lab but users keep heavily editing it, it’s demoted or revised.

If a template looks decent in the Lab but absolutely crushes in real usage (high acceptance, low edit), it gets promoted faster – even if it’s slightly “ugly” structurally.

This is very similar to how real products tune ranking algorithms / recommender systems; you’re just doing it on prompts.

2.3 It lets you iterate faster than a human can

Without Prompt Lab:

Every template change is a shot in the dark; you’d be scared to tweak core behaviors because it might quietly degrade quality.

With Prompt Lab:

You can safely spin up multiple variants for a template and have the Lab judge them across the corpus before touching GA.

Meta-agents can propose new variants based on underperforming data (e.g., “users keep editing the context section this way; let’s adjust the template instructions”).

So you get:

Faster experimentation cycles.

Lower risk of regressions.

Ability to respond to new best practices or model releases quickly.

2.4 It’s honest about data and still powerful

You’ve locked in a privacy stance where:

Content logging is opt-in, anonymized, and time-limited.

Incognito refines never feed into the Lab.

Yet you still get strong signals because:

You don’t need every prompt – a statistically meaningful sample is enough.

Synthetic corpora cover the essentials (coding/writing/planning/research) even if only a small subset of users opt in.

That makes the marketing line truthful:

“Prompt Lab is powered by a mix of synthetic corpora and prompts from users who explicitly opted in – with aggressive anonymization and clear controls.”

3. How Prompt Lab scales

You’re not designing a one-off experiment; you’re designing something that can handle millions of refinements and hundreds of templates without blowing up costs or complexity.

3.1 Technical scalability

Decoupled from the request path

The Lab runs as background jobs (cron, queue workers, GCP Cloud Run, etc.), completely separate from real user /api/refine-prompt traffic.

If Lab jobs spike, user experience stays smooth; worst case, experiments slow down, not Orbitar itself.

Stateless workers + simple storage

All lab tasks can be expressed as rows: (taskId, templateVariantId, modelConfig, status, scoresJson).

Workers pull jobs, call your existing refine engine, write back metrics – fully parallelizable.

Sampling + corpora

You never need to run every real prompt through every variant; you sample.

Synthetic corpora stay fixed size (or grow slowly); you can choose N tasks per night per template.

So scaling up is “add more workers / instances” rather than rewriting the system.

3.2 Cost scalability

Because experiments are structured, you can cap cost:

“Per night, spend up to X prompts worth of tokens in the Lab.”

Prioritize tests:

New templates in hot categories (coding, writing) get more budget.

Rare or older templates get less frequent evaluation.

And because the Lab uses small synthetic batches + smart sampling, you can keep it running even after the free GCP credits are gone – it’s tunable.

3.3 Organizational / complexity scalability

The template lifecycle + ownership rules keep things sane:

Each template has an owner who watches metrics and decides promotions/demotions.

Status flags (Lab / Experimental / Beta / GA / Deprecated) keep the library understandable even as it grows.

The Master Dashboard’s “Promising Results” tab gives you a ranked list of “what deserves attention next”, so you’re never staring at a giant unprioritized table.

As you add more categories or even team/enterprise plans, the same framework holds:

More templates, same lifecycle.

More data, same metrics.

More models, same refine API path.

TL;DR in your own language

Prompt Lab is the quiet brain in the back room:

It takes synthetic + opt-in real prompts.

Abuses compute to test template variants and measure structure, correctness, and behavior against your 10-second quality bar.

Surfaces the winners in a Master Dashboard so you can confidently ship better templates without guesswork.

And it does all of that in a way that’s transparent, privacy-respectful, and naturally scalable in both cost and complexity.

If you want, next step we can design:

A v0 implementation plan: “what we actually build first to have a minimal Prompt Lab running”, including specific tables, cron jobs, and how to use your GCP credits for the first round of experiments.
