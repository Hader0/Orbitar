import "dotenv/config";
import { runLabBatch } from "../lib/promptLabRunner";
import { prisma } from "../lib/prisma";

async function main() {
  const rawLimit = Number(process.env.LAB_BATCH_LIMIT || "20") || 20;
  const dryRun = (process.env.LAB_DRY_RUN || "false").toLowerCase() === "true";
  const modelName = process.env.LAB_MODEL_NAME || undefined;
  const MAX_SAFE = Number(process.env.LAB_MAX_SAFE || "200");

  console.info("[PromptLabCron] Starting Lab batch", {
    limit: rawLimit,
    dryRun,
    modelName,
  });

  if (rawLimit > MAX_SAFE) {
    console.warn(
      "[PromptLabCron] Aborting: LAB_BATCH_LIMIT exceeds safe maximum",
      { limit: rawLimit, maxSafe: MAX_SAFE }
    );
    process.exit(1);
  }

  try {
    const { runsCreated, scoresCreated } = await runLabBatch({
      limit: rawLimit,
      modelName,
      dryRun,
    });

    console.info("[PromptLabCron] Completed Lab batch", {
      runsCreated,
      scoresCreated,
    });
  } catch (err) {
    console.error("[PromptLabCron] Fatal error while running lab batch", err);
    process.exitCode = 1;
  } finally {
    try {
      await prisma.$disconnect();
      console.info("[PromptLabCron] Prisma disconnected");
    } catch (e) {
      // ignore
    }
  }
}

main().catch((err) => {
  console.error("[PromptLabCron] Fatal error", err);
  process.exit(1);
});
