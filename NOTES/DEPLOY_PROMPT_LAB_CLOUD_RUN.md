# Prompt Lab Worker — Cloud Run Deployment

This document describes how to build and deploy the Orbitar Prompt Lab worker (one-shot batch runner) to Google Cloud Run. The worker runs a small batch of Prompt Lab tasks via the internal runner and exits.

Contents:

- What the worker does
- Local run and test
- Build and push (Cloud Build + Artifact Registry)
- Deploy to Cloud Run
- Schedule via Cloud Scheduler
- Notes on secrets and env

## What the worker does

- Runs a v0 Prompt Lab batch using the existing backend Prompt Lab runner:
  - Picks a small set of tasks (`SyntheticTask`, `PromptSample`)
  - Runs a refine for each
  - Writes `LabRun` and `LabScore`
- Logs:
  - [PromptLabCron] Starting Lab batch { limit: N }
  - [PromptLabCron] Completed Lab batch { runsCreated: X, scoresCreated: Y }

The code entrypoint is:

- backend/scripts/runPromptLabBatch.ts

The container image uses:

- backend/Dockerfile.prompt-lab

The npm script used at container start:

- npm run lab:run-batch

## Environment variables required

- DATABASE_URL: Prisma DB connection string (e.g., Postgres)
- OPENROUTER_API_KEY: API key used by the refine engine
- LAB_BATCH_LIMIT (optional): defaults to 20

Note: The worker does not expose any HTTP routes; it runs one batch and exits.

## Local run (optional)

From backend/:

```bash
# Install deps and build the Next project (for type/import resolution)
npm ci
npm run build

# Set env values (for local run)
export DATABASE_URL="postgres://..."
export OPENROUTER_API_KEY="sk-or-your-key"
export LAB_BATCH_LIMIT=10

# Run the worker once
npm run lab:run-batch
```

Docker local test:

```bash
# From the repo root or backend/, build the worker image
docker build -f backend/Dockerfile.prompt-lab -t prompt-lab-worker:local backend

# Provide the required envs; you can use --env-file or -e for minimal test
docker run --rm \
  -e DATABASE_URL="postgres://..." \
  -e OPENROUTER_API_KEY="sk-or-your-key" \
  -e LAB_BATCH_LIMIT=10 \
  prompt-lab-worker:local
```

## Build & Push (Cloud Build + Artifact Registry)

Prereqs:

- gcloud CLI installed and authenticated
- Artifact Registry repository exists (or create it first)

Environment placeholders:

```bash
# From backend/
export PROJECT_ID="your-gcp-project-id"
export REGION="your-region"                 # e.g. australia-southeast1
export REPO="prompt-lab"                   # Artifact Registry repo name (must exist or be created)
export IMAGE="prompt-lab-worker"
```

Submit build (Cloud Build):

```bash
gcloud builds submit \
  --project "$PROJECT_ID" \
  --tag "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$IMAGE:latest" \
  -f Dockerfile.prompt-lab
```

If you haven't created the Artifact Registry repo yet:

```bash
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --project="$PROJECT_ID"
```

Re-run the Cloud Build command after repo creation.

## Deploy to Cloud Run

Deploy a Cloud Run service that runs the worker:

```bash
gcloud run deploy prompt-lab-worker \
  --project "$PROJECT_ID" \
  --image "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$IMAGE:latest" \
  --platform managed \
  --region "$REGION" \
  --no-allow-unauthenticated \
  --service-account "prompt-lab-worker@$PROJECT_ID.iam.gserviceaccount.com" \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "LAB_BATCH_LIMIT=20" \
  --set-secrets "DATABASE_URL=projects/$PROJECT_ID/secrets/orbitar-database-url:latest" \
  --set-secrets "OPENROUTER_API_KEY=projects/$PROJECT_ID/secrets/orbitar-openrouter-api-key:latest"
```

Notes:

- Service account `prompt-lab-worker@$PROJECT_ID.iam.gserviceaccount.com` should exist and have permission to access specified Secret Manager secrets.
- Secret names here are examples; replace with your actual secret names and latest versions.

After deploy:

- Cloud Run creates a service URL (HTTPS). Invoking this URL will start the container and run a single batch, then exit.
- Logs visible in Cloud Logging: look for `[PromptLabCron]` lines.

## Schedule runs with Cloud Scheduler

1. Decide cadence and batch size:

   - Cadence: once per hour
   - LAB_BATCH_LIMIT: ~10–20 per run
     Adjust later based on costs/performance.

2. Create a Cloud Scheduler job (Console):

   - Cloud Scheduler → Create Job
   - Name: `prompt-lab-hourly`
   - Frequency (cron): `0 * * * *` (hourly) or `0 3 * * *` (nightly)
   - Timezone: UTC or your local
   - Target: HTTP POST
   - URL: Cloud Run URL for `prompt-lab-worker`
   - Auth: Add OAuth token (OIDC)
     - Service account: the same SA used for Cloud Run or a dedicated scheduler SA
     - Ensure SA has Cloud Run Invoker role on the service

3. Alternatively, create via CLI:

```bash
export LAB_URL="https://prompt-lab-worker-xxxxxx-uc.a.run.app"
export SCHEDULER_SA="prompt-lab-worker@$PROJECT_ID.iam.gserviceaccount.com"

gcloud scheduler jobs create http prompt-lab-hourly \
  --project "$PROJECT_ID" \
  --schedule="0 * * * *" \
  --time-zone="Etc/UTC" \
  --uri="$LAB_URL" \
  --http-method=POST \
  --oidc-service-account-email="$SCHEDULER_SA" \
  --oidc-token-audience="$LAB_URL"
```

## Expected Logs

When the worker runs, Cloud Run logs will show:

```
[PromptLabCron] Starting Lab batch { limit: 20 }
[PromptLabRunner] Lab batch completed { runsCreated: X, scoresCreated: Y }
[PromptLabCron] Completed Lab batch { runsCreated: X, scoresCreated: Y }
```

## Notes and tips

- Secrets:
  - Create and populate Secret Manager secrets for `DATABASE_URL` and `OPENROUTER_API_KEY`.
  - Update the `--set-secrets` flags to match your secret names/versions.
- Limits:
  - `LAB_BATCH_LIMIT` can be tuned without redeploy via Cloud Run console (Edit → Variables & secrets).
- Costs:
  - Use small batch sizes initially; watch Cloud Run and DB usage.
- Troubleshooting:
  - Check Cloud Build logs for build errors.
  - Check Cloud Run logs for runtime errors; ensure `DATABASE_URL` and `OPENROUTER_API_KEY` are present.
  - If Next.js build requires additional envs at compile time, set minimal placeholders in Cloud Build substitutions, or bypass parts of the build that are not needed by the worker.
