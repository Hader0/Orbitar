import { prisma } from "@/lib/prisma";
import { createRefineEngine } from "./refine-engine";
import { scoreLabRun, type LabScoringResult } from "./promptLabScoring";
import {
  getTemplateVersion,
  getTemplateSlug,
  getCategoryDefaultTemplate,
  isTemplateId,
  templateRegistry,
  type TemplateId,
  type TemplateCategory,
} from "./templates";

type LabTaskBase = {
  id: string;
  type: "synthetic" | "sample";
  category: string;
  inputText: string;
  templateSlug: string;
  templateVersion: string;
};

export type LabTask = LabTaskBase;

function slugToTemplateId(slug: string): TemplateId {
  const s = (slug || "").trim();
  if (!s) return "general_general";
  // Try remove suffix "_default"
  const cleaned = s.endsWith("_default") ? s.slice(0, -"_default".length) : s;
  // If cleaned matches a known TemplateId, use it
  if (isTemplateId(cleaned as any)) return cleaned as TemplateId;
  // If slug contains two segments like "coding_feature", accept
  if (isTemplateId(s as any)) return s as TemplateId;
  // Fallback: general
  return "general_general";
}

function categoryToTemplateId(category: string | null | undefined): TemplateId {
  const c = (category || "general").toLowerCase() as TemplateCategory;
  try {
    return getCategoryDefaultTemplate(c);
  } catch {
    return "general_general";
  }
}

export async function pickLabTasks(limit: number): Promise<LabTask[]> {
  const L = Math.max(1, Math.min(limit || 10, 50));
  const half = Math.max(1, Math.floor(L / 2));

  // Use "any" for broad compatibility with current Prisma typegen
  let synthetic: any[] = [];
  let samples: any[] = [];

  try {
    synthetic = await (prisma as any).syntheticTask.findMany({
      orderBy: { createdAt: "desc" },
      take: half,
    });
  } catch (error) {
    console.error("[PromptLabRunner] Failed to fetch SyntheticTask", error);
    synthetic = [];
  }

  try {
    samples = await (prisma as any).promptSample.findMany({
      orderBy: { createdAt: "desc" },
      take: L - synthetic.length,
    });
  } catch (error) {
    console.error("[PromptLabRunner] Failed to fetch PromptSample", error);
    samples = [];
  }

  const tasks: LabTask[] = [];

  for (const s of synthetic) {
    const category = (s.category || "general") as string;
    const tId = categoryToTemplateId(category);
    const slug = getTemplateSlug(tId);
    const version = getTemplateVersion(tId) || "1.0.0";
    tasks.push({
      id: s.id as string,
      type: "synthetic",
      category,
      inputText: s.inputText as string,
      templateSlug: slug,
      templateVersion: version,
    });
  }

  for (const p of samples) {
    const category = (p.category || "general") as string;
    let slug: string = (p.templateSlug as string) || "";
    if (!slug) {
      console.warn(
        "[PromptLabRunner] PromptSample missing templateSlug, using category default",
        {
          id: p.id,
          category,
        }
      );
      const tId = categoryToTemplateId(category);
      slug = getTemplateSlug(tId);
    }
    const tIdFromSlug = slugToTemplateId(slug);
    const version =
      (p.templateVersion as string) ||
      getTemplateVersion(tIdFromSlug) ||
      "1.0.0";

    tasks.push({
      id: p.id as string,
      type: "sample",
      category,
      inputText: (p.rawText as string) || "",
      templateSlug: slug,
      templateVersion: version,
    });
  }

  return tasks.slice(0, L);
}

export async function runLabBatch(options: {
  limit: number;
  modelName?: string;
  dryRun?: boolean;
}): Promise<{ runsCreated: number; scoresCreated: number }> {
  const limit = Math.max(1, Math.min(options.limit || 10, 50));
  const dryRun = !!options.dryRun;
  const engine = createRefineEngine();

  const tasks = await pickLabTasks(limit);

  let runsCreated = 0;
  let scoresCreated = 0;

  for (const task of tasks) {
    const templateId: TemplateId = slugToTemplateId(task.templateSlug);
    // Ensure template exists (safety)
    if (!templateRegistry[templateId]) {
      console.warn("[PromptLabRunner] Unknown templateId for slug", {
        slug: task.templateSlug,
        templateId,
      });
    }

    // Create LabRun (pending)
    let labRunId: string | null = null;
    try {
      if (dryRun) {
        // Generate a synthetic id and do not persist
        labRunId = `dryrun-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        console.info("[PromptLabRunner] DRY RUN - would create LabRun", {
          taskId: task.id,
          type: task.type,
          templateSlug: task.templateSlug,
          templateVersion: task.templateVersion,
          labRunId,
        });
        runsCreated++;
      } else {
        const created = await (prisma as any).labRun.create({
          data: {
            templateSlug: task.templateSlug,
            templateVersion: task.templateVersion,
            taskType: task.type,
            syntheticTaskId: task.type === "synthetic" ? task.id : null,
            promptSampleId: task.type === "sample" ? task.id : null,
            modelName: options.modelName || "openrouter",
            status: "pending",
          },
          select: { id: true },
        });
        labRunId = created?.id as string;
        runsCreated++;
      }
    } catch (error) {
      console.error(
        "[PromptLabRunner] Failed to create LabRun",
        {
          taskId: task.id,
          type: task.type,
          templateSlug: task.templateSlug,
          templateVersion: task.templateVersion,
        },
        error
      );
      continue;
    }

    // Execute refine
    let refinedText: string | null = null;
    try {
      const result = await engine.refine({
        text: task.inputText,
        templateId: templateId,
        category: (templateRegistry[templateId]?.category ||
          task.category ||
          "general") as TemplateCategory,
        userPlan: "pro",
        abTestVariant: "control",
      });

      refinedText = result?.refinedText || null;

      try {
        if (!dryRun) {
          await (prisma as any).labRun.update({
            where: { id: labRunId },
            data: {
              status: "done",
              rawRefinedPrompt: refinedText,
              errorMessage: null,
            },
          });
        } else {
          console.info("[PromptLabRunner] DRY RUN - would mark LabRun done", {
            labRunId,
          });
        }
      } catch (e) {
        console.error(
          "[PromptLabRunner] Failed to update LabRun to done",
          { labRunId },
          e
        );
      }
    } catch (error) {
      console.error(
        "[PromptLabRunner] Lab run failed",
        {
          taskId: task.id,
          type: task.type,
          templateSlug: task.templateSlug,
          templateVersion: task.templateVersion,
        },
        error
      );
      try {
        if (!dryRun) {
          await (prisma as any).labRun.update({
            where: { id: labRunId },
            data: { status: "error", errorMessage: "refine_failed" },
          });
        } else {
          console.info("[PromptLabRunner] DRY RUN - would mark LabRun error", {
            labRunId,
          });
        }
      } catch (e) {
        console.error(
          "[PromptLabRunner] Failed to mark LabRun as error",
          { labRunId },
          e
        );
      }
      continue;
    }

    // Score
    try {
      const scoring = scoreLabRun({
        category: (templateRegistry[templateId]?.category ||
          task.category ||
          "general") as string,
        templateSlug: task.templateSlug,
        templateVersion: task.templateVersion,
        rawText: task.inputText,
        refinedPrompt: refinedText || "",
      });

      if (dryRun) {
        console.info("[PromptLabRunner] DRY RUN - would create LabScore", {
          labRunId,
          scoring,
        });
        scoresCreated++;
      } else {
        await (prisma as any).labScore.create({
          data: {
            labRunId: labRunId,
            structureScore:
              (scoring.structureScore as number | undefined) ?? null,
            contractScore:
              (scoring.contractScore as number | undefined) ?? null,
            domainScore: (scoring.domainScore as number | undefined) ?? null,
            overallScore: (scoring.overallScore as number | undefined) ?? null,
            metricsJson: JSON.stringify(scoring.metricsJson || {}),
          },
        });
        scoresCreated++;
      }
    } catch (error) {
      console.error(
        "[PromptLabRunner] Failed to create LabScore",
        { labRunId },
        error
      );
      try {
        if (!dryRun) {
          await (prisma as any).labRun.update({
            where: { id: labRunId },
            data: { errorMessage: "score_failed" },
          });
        } else {
          console.info(
            "[PromptLabRunner] DRY RUN - would annotate LabRun score failure",
            { labRunId }
          );
        }
      } catch (e) {
        console.error(
          "[PromptLabRunner] Failed to annotate LabRun score failure",
          { labRunId },
          e
        );
      }
    }
  }

  return { runsCreated, scoresCreated };
}
