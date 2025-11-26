import "dotenv/config";
import http from "http";
import { runLabBatch } from "../lib/promptLabRunner";
import { prisma } from "../lib/prisma";

const DEFAULT_PORT = Number(process.env.PORT || process.env.PORT_OS || 8080);

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
}

function boolEnv(name: string, fallback = false): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  return String(raw).toLowerCase() === "true";
}

async function handleRunRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  const rawLimit = parseIntEnv("LAB_BATCH_LIMIT", 20);
  const maxSafe = parseIntEnv("LAB_MAX_SAFE", 200);
  const modelName = process.env.LAB_MODEL_NAME || undefined;

  console.info("[PromptLabCron] HTTP trigger received, running batch", {
    limit: rawLimit,
    modelName,
  });

  if (rawLimit > maxSafe) {
    const msg = `[PromptLabCron] Aborting: requested LAB_BATCH_LIMIT (${rawLimit}) exceeds LAB_MAX_SAFE (${maxSafe})`;
    console.warn(msg);
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: msg }));
    return;
  }

  try {
    const { runsCreated, scoresCreated } = await runLabBatch({
      limit: rawLimit,
      modelName,
      dryRun: false,
    });

    console.info("[PromptLabCron] Completed Lab batch", {
      runsCreated,
      scoresCreated,
    });

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ runsCreated, scoresCreated }));
  } catch (err: any) {
    console.error(
      "[PromptLabCron] ERROR running Lab batch",
      err && err.stack ? err.stack : err
    );
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: (err && err.message) || String(err) }));
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = req.url || "/";
    const method = req.method || "GET";

    if (method === "GET" && (url === "/" || url === "/health")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    if (method === "POST" && (url === "/run" || url === "/")) {
      // run a batch
      await handleRunRequest(req, res);
      return;
    }

    // Unknown route
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not_found" }));
  } catch (err: any) {
    console.error("[PromptLabCron] Unexpected error in request handler", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "internal" }));
  }
});

async function shutdown(signal?: string) {
  try {
    console.info(
      `[PromptLabCron] shutting down${signal ? ` (signal=${signal})` : ""}`
    );
    server.close(() => {
      // no-op
    });
    // disconnect prisma so Cloud Run container can exit cleanly if needed
    try {
      await prisma.$disconnect();
      console.info("[PromptLabCron] prisma disconnected");
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // ignore
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("uncaughtException", (err) => {
  console.error("[PromptLabCron] uncaughtException", err);
  shutdown("uncaughtException").finally(() => process.exit(1));
});
process.on("unhandledRejection", (reason) => {
  console.error("[PromptLabCron] unhandledRejection", reason);
});

server.listen(DEFAULT_PORT, () => {
  console.info(`[PromptLabCron] Listening on port ${DEFAULT_PORT}`);
});
