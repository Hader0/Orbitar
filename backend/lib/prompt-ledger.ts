import { Storage, UploadOptions } from "@google-cloud/storage";
import { randomUUID } from "crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Prompt Ledger (GCS NDJSON) logger
 *
 * - Non-blocking best-effort logging to a GCS bucket in date-partitioned NDJSON files.
 * - Respects privacy flags (promptLabOptIn, isIncognito) before including content snapshots.
 * - Never throws; errors are logged with a clear prefix and swallowed.
 *
 * Environment (set in host or Cloud Run):
 *   - GCP_PROJECT_ID
 *   - PROMPT_LEDGER_BUCKET
 *   - GCP_PROMPT_LEDGER_KEY  (Service account credentials JSON (inline) OR file path to JSON)
 */

let _storage: Storage | null = null;
let _bucketName: string | null = null;

// ---- Types ----

export interface PromptLedgerEventInput {
  // Identity/plan (no PII like email)
  userId: string;
  plan: "free" | "light" | "pro" | "admin";

  // Template selection
  category: string;
  templateSlug: string;
  templateVersion: string;

  // Privacy & source
  promptLabOptIn: boolean;
  isIncognito: boolean;
  source?: string | null; // e.g., "extension:chatgpt", "web:dashboard"

  // Performance & usage
  inputTokens?: number | null;
  outputTokens?: number | null;
  latencyMs?: number | null;
  model?: string | null; // e.g., "openrouter:gpt-4o-mini" or "openrouter"

  // Status
  status: string; // "success" or error code

  // Raw content (sanitized as needed within the logger)
  rawText?: string | null;
  refinedText?: string | null;

  // Lengths (meta)
  rawTextLength?: number | null;
  refinedTextLength?: number | null;

  // Optional additional metadata fields for future
  extra?: Record<string, unknown>;
}

type LedgerEventWire = {
  eventId: string;
  timestamp: string; // ISO UTC

  userId: string;
  plan: string;

  source?: string | null;
  category: string;
  templateSlug: string;
  templateVersion: string;

  promptLabOptIn: boolean;
  isIncognito: boolean;

  rawTextLength?: number | null;
  refinedTextLength?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  latencyMs?: number | null;
  model?: string | null;
  status: string;

  // Conditionally included
  rawText?: string;
  refinedText?: string;

  // Extension for future-proofing
  extra?: Record<string, unknown>;
};

// ---- Public API ----

export async function logPromptLedgerEvent(
  input: PromptLedgerEventInput
): Promise<void> {
  try {
    const bucket = getBucket();
    if (!bucket) {
      // Misconfiguration or disabled; skip silently with a single debug
      return;
    }

    const eventId = safeUuid();
    const now = new Date();
    const ts = now.toISOString();

    // Prepare content inclusion decision
    const includeContent = !!(input.promptLabOptIn && !input.isIncognito);

    const wire: LedgerEventWire = {
      eventId,
      timestamp: ts,

      userId: String(input.userId || ""),
      plan: input.plan || "free",

      source: input.source ?? null,
      category: String(input.category || "general"),
      templateSlug: String(input.templateSlug || ""),
      templateVersion: String(input.templateVersion || "1.0.0"),

      promptLabOptIn: !!input.promptLabOptIn,
      isIncognito: !!input.isIncognito,

      rawTextLength: numOrNull(input.rawTextLength),
      refinedTextLength: numOrNull(input.refinedTextLength),
      inputTokens: numOrNull(input.inputTokens),
      outputTokens: numOrNull(input.outputTokens),
      latencyMs: numOrNull(input.latencyMs),
      model: input.model ?? null,
      status: String(input.status || "unknown"),

      extra:
        input.extra && typeof input.extra === "object"
          ? input.extra
          : undefined,
    };

    if (includeContent) {
      // Apply basic sanitization/redaction pass; this is not a full PII scrubber.
      const rawSan = sanitizeText(input.rawText || "");
      const refSan = sanitizeText(input.refinedText || "");
      if (rawSan) wire.rawText = rawSan;
      if (refSan) wire.refinedText = refSan;
    }

    const line = JSON.stringify(wire) + "\n";

    const objectPath = makeObjectPath(now, eventId);
    const gcsFile = bucket.file(objectPath);

    // Single-line NDJSON file (1 object per event is an acceptable baseline)
    // Content-Type is informative; not strictly required by BigQuery external tables.
    const uploadOpts: UploadOptions = {
      resumable: false,
      metadata: {
        contentType: "application/x-ndjson",
        cacheControl: "no-store",
      },
      // validation disabled to avoid CPU overhead on large volumes; fine to enable if desired
      validation: false,
    };

    await gcsFile.save(line, uploadOpts);
  } catch (err) {
    console.error("[PromptLedger] GCS write failed", toMinimalErr(err));
  }
}

// ---- Helpers ----

function getBucket() {
  try {
    if (_storage && _bucketName) {
      return _storage.bucket(_bucketName);
    }

    const projectId = readEnvStrict("GCP_PROJECT_ID", false);
    const bucket = readEnvStrict("PROMPT_LEDGER_BUCKET", false);
    const keyRaw = process.env.GCP_PROMPT_LEDGER_KEY;

    if (!projectId || !bucket || !keyRaw) {
      // Not configured; don’t spam logs, just once
      if (!process.env.__PROMPT_LEDGER_WARNED) {
        process.env.__PROMPT_LEDGER_WARNED = "1";
        console.warn(
          "[PromptLedger] Disabled (missing env GCP_PROJECT_ID | PROMPT_LEDGER_BUCKET | GCP_PROMPT_LEDGER_KEY)."
        );
      }
      return null;
    }

    let storage: Storage;

    // Support: inline JSON or file path
    const trimmed = keyRaw.trim();
    if (trimmed.startsWith("{")) {
      // Inline JSON
      let creds: any = null;
      try {
        creds = JSON.parse(trimmed);
      } catch (e) {
        console.error("[PromptLedger] Invalid JSON in GCP_PROMPT_LEDGER_KEY");
        return null;
      }
      storage = new Storage({
        projectId,
        credentials: {
          client_email: creds.client_email,
          private_key: creds.private_key,
        },
      });
    } else {
      // Treat as file path
      const keyPath = path.isAbsolute(trimmed)
        ? trimmed
        : path.join(process.cwd(), trimmed);
      if (!fs.existsSync(keyPath)) {
        console.error("[PromptLedger] Key file not found at", keyPath);
        return null;
      }
      storage = new Storage({
        projectId,
        keyFilename: keyPath,
      });
    }

    _storage = storage;
    _bucketName = bucket;
    return _storage.bucket(_bucketName);
  } catch (e) {
    console.error(
      "[PromptLedger] Failed to initialize Storage client",
      toMinimalErr(e)
    );
    return null;
  }
}

function safeUuid(): string {
  try {
    return randomUUID();
  } catch {
    // Fallback if randomUUID not available
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }
}

function makeObjectPath(d: Date, eventId: string): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  // One event per object; still follow partitioning and a stable naming scheme
  return `logs/year=${y}/month=${m}/day=${day}/hour=${hh}/part-${eventId}.ndjson`;
}

function numOrNull(n: unknown): number | null {
  if (typeof n === "number" && isFinite(n)) return n;
  if (typeof n === "string") {
    const parsed = Number(n);
    return isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Very basic text sanitization to reduce obvious PII:
 * - Redact emails
 * - Redact phone numbers
 * - Redact URLs
 * - Trim exceedingly long content
 */
function sanitizeText(text: string, max = 8000): string {
  try {
    let out = String(text || "");
    // Emails
    out = out.replace(
      /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
      "[redacted_email]"
    );
    // Phone numbers (very rough)
    out = out.replace(/\+?\d[\d\-\s().]{6,}\d/g, "[redacted_phone]");
    // URLs
    out = out.replace(/\bhttps?:\/\/[^\s)]+/gi, "[redacted_url]");
    // Collapse whitespace runs
    out = out.replace(/[ \t]{2,}/g, " ");
    // Trim to max
    if (out.length > max) out = out.slice(0, max) + "…";
    return out;
  } catch {
    return "";
  }
}

function readEnvStrict(key: string, required: boolean): string | null {
  const v = process.env[key];
  if (!v && required) {
    throw new Error(`[PromptLedger] Missing env ${key}`);
  }
  return v || null;
}

function toMinimalErr(e: any): Record<string, unknown> {
  const msg =
    e && typeof e === "object" && "message" in e
      ? (e as any).message
      : String(e);
  return { message: msg };
}
