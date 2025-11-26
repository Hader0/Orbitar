# Prompt Ledger (GCS NDJSON) — GCP Setup Guide

This document creates a portable “Prompt Ledger” in Google Cloud so Orbitar can log every refinement event to a Cloud Storage bucket as NDJSON, and optionally query them in BigQuery.

Project-specific values (provided):

- PROJECT_ID: orbitar-dev-478814
- REGION: australia-southeast1
- BUCKET_NAME: orbitar-prompt-ledger-main
- Service Account: orbitar-prompt-ledger-writer@orbitar-dev-478814.iam.gserviceaccount.com
- Local key path you provided: backend/Orbitar Prompt Ledger Writer.json

What this sets up:

- A GCS bucket for append-only NDJSON logs
- A writer service account with least-privilege to create objects
- Local + production env wiring for the backend
- Optional: BigQuery dataset + external table for analytics

Prerequisites:

- gcloud CLI installed and authenticated (gcloud auth login)
- You have Project Owner/Editor permissions for the project

---

1. Set active project

```bash
gcloud config set project orbitar-dev-478814
```

2. Create the ledger bucket

```bash
gcloud storage buckets create gs://orbitar-prompt-ledger-main \
  --location=australia-southeast1 \
  --uniform-bucket-level-access
```

Notes:

- This bucket will contain NDJSON files at paths like:
  logs/year=YYYY/month=MM/day=DD/hour=HH/part-<uuid>.ndjson

3. Create a writer service account (if not already created)

```bash
gcloud iam service-accounts create orbitar-prompt-ledger-writer \
  --display-name="Orbitar Prompt Ledger Writer"
```

4. Grant least-privilege permissions to write objects

```bash
gcloud storage buckets add-iam-policy-binding gs://orbitar-prompt-ledger-main \
  --member="serviceAccount:orbitar-prompt-ledger-writer@orbitar-dev-478814.iam.gserviceaccount.com" \
  --role="roles/storage.objectCreator"
```

Why objectCreator?

- The app only needs to create new log objects, not list/delete.
- If you need object listing/reading later for ops, consider adding storage.objectViewer to a separate ops account, not to this writer SA.

5. Service account key for local/dev (you provided this JSON path)
   You’ve placed a JSON key at:

- backend/Orbitar Prompt Ledger Writer.json

Caution:

- Do NOT commit this key to a public repo.
- It’s fine for local dev (private repo), but for production, prefer secret managers or platform env.

Backend env wiring (local dev):

- Add to backend/.env (or export in shell):

```bash
GCP_PROJECT_ID="orbitar-dev-478814"
PROMPT_LEDGER_BUCKET="orbitar-prompt-ledger-main"
# Point to the local key file you provided
GCP_PROMPT_LEDGER_KEY="backend/Orbitar Prompt Ledger Writer.json"
```

Backend env wiring (production):

- Prefer storing the full JSON content in your platform’s secret store, then set:
  - GCP_PROJECT_ID=orbitar-dev-478814
  - PROMPT_LEDGER_BUCKET=orbitar-prompt-ledger-main
  - GCP_PROMPT_LEDGER_KEY="<inline JSON content>"
- The backend logger supports both inline JSON and file path.

---

Optional: BigQuery analytics view

We’ll create:

- Dataset: prompt_lab
- External table: prompt_events (over the GCS bucket, using hive-style partitions parsed from the object path)

Enable BigQuery APIs (only if needed):

```bash
gcloud services enable bigquery.googleapis.com
```

Create dataset:

```bash
bq --location=australia-southeast1 mk --dataset \
  orbitar-dev-478814:prompt_lab
```

Create external table with hive partition parsing
This table reads NDJSON from:

- gs://orbitar-prompt-ledger-main/logs/...

We’ll define partition columns to match the folder layout:

- year, month, day, hour (all STRING). BigQuery will infer them from the path segments.

Run this DDL:

```sql
-- Create an external table over the GCS bucket
CREATE OR REPLACE EXTERNAL TABLE `orbitar-dev-478814.prompt_lab.prompt_events`
WITH PARTITION COLUMNS (
  year STRING,
  month STRING,
  day STRING,
  hour STRING
)
OPTIONS (
  uris = ['gs://orbitar-prompt-ledger-main/logs/*'],
  format = 'NEWLINE_DELIMITED_JSON',
  hive_partitioning_mode = 'AUTO'
);
```

Notes:

- hive_partitioning_mode='AUTO' directs BigQuery to parse partition keys from folder names like year=YYYY/month=MM/day=DD/hour=HH.
- You can add WHERE filters such as:
  WHERE month = '11' AND day = '25'
  for scoped queries.

Test query:

```sql
SELECT
  year, month, day, hour,
  COUNT(*) AS events,
  ANY_VALUE(plan) AS sample_plan
FROM `orbitar-dev-478814.prompt_lab.prompt_events`
GROUP BY year, month, day, hour
ORDER BY year DESC, month DESC, day DESC, hour DESC
LIMIT 100;
```

---

Backend integration status

- Code: backend/lib/prompt-ledger.ts
  - Non-blocking write to GCS: one NDJSON line per event.
  - Always logs metadata (userId, plan, category, templateSlug, templateVersion, latency, tokens, status).
  - Conditionally logs sanitized rawText/refinedText only if:
    promptLabOptIn === true AND isIncognito === false.
- Wired in: backend/app/api/refine-prompt/route.ts
  - On success: writes PromptEvent (DB), RefineEvent (DB), and fires Prompt Ledger write (GCS).
  - On error: writes a minimal error record to Prompt Ledger (no content).

---

Operational tips

- Rotate keys: If using file-based keys for dev, consider regenerating or rotating them periodically.
- Production: Prefer secret managers (e.g., Vercel/Cloud Run secrets) to inject inline JSON for GCP_PROMPT_LEDGER_KEY.
- Least privilege: Keep storage.objectCreator scoped only to the ledger bucket for this SA.
- Cost: BigQuery external tables read from GCS on query; consider loading to native tables later for cheaper/repeat queries.

---

Troubleshooting

- Backend log: "[PromptLedger] Disabled (missing env ...)"

  - Set GCP_PROJECT_ID, PROMPT_LEDGER_BUCKET, and GCP_PROMPT_LEDGER_KEY.

- "[PromptLedger] Key file not found"

  - Ensure the path is correct relative to the backend working directory.

- Access denied on GCS write:

  - Confirm IAM binding on the bucket includes roles/storage.objectCreator for the SA.
  - Confirm you are writing to the correct bucket (PROMPT_LEDGER_BUCKET).

- BigQuery table returns 0 rows:
  - Ensure NDJSON files exist in gs://orbitar-prompt-ledger-main/logs/...
  - Validate the file paths match year=/month=/day=/hour= structure.
  - Check that the NDJSON lines are valid JSON; malformed lines may be ignored.
