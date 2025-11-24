Free → Builder → Pro flow

Fresh user (new email) starts as free.

Upgrade to Builder → plan becomes builder.

While on builder, click “Upgrade to Pro” → Pro checkout → plan becomes pro.

Confirm upgrade buttons behave as expected at each stage.

Session + re-login sanity

Log out and back in as the same user.

Ensure the plan (builder/pro) persists and UpgradeCard still shows the right options.

Admin dashboard

Log in as ADMIN_EMAIL.

Hit /admin:

Confirm total users / total prompts / categories / templates all look sensible.

User dashboard + stats

Do a few refinements with the extension.

Check /dashboard:

Total prompts increments.

Last 7 days chart updates.

Category + template breakdowns make sense.

Privacy toggles + PromptEvent

On /dashboard, toggle:

“Share anonymized prompts”.

“Default incognito”.

Do a few refinements in each state.

Check DB PromptEvent.incognito for that user (via Prisma Studio) to confirm it matches your expectations.

Extension e2e

Fresh browser profile:

Load extension unpacked.

Add API key.

Refine in ChatGPT → backend call → fast GPT-5-mini response → content replaced correctly.
