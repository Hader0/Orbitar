import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import React from "react";
import { redirect } from "next/navigation";
import { runLabBatch } from "@/lib/promptLabRunner";

export const dynamic = "force-dynamic";

type TemplateKey = { templateId: string; templateVersion: string };

function isAdminEmail(email?: string | null) {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  return !!email && !!ADMIN_EMAIL && email === ADMIN_EMAIL;
}

// -----------------------------
// Server Actions (DEV SEED ONLY)
// -----------------------------

async function requireAdminAndDev() {
  const session = await getServerSession(authOptions);
  const email = (session as any)?.user?.email as string | undefined;
  if (!isAdminEmail(email)) {
    console.warn("[/admin/prompt-lab] Seed attempted by non-admin", {
      email,
    });
    return { ok: false, reason: "not_admin" as const };
  }
  if (process.env.NODE_ENV === "production") {
    console.warn("[PromptLab Seed] Attempt to seed in production");
    return { ok: false, reason: "prod" as const };
  }
  return { ok: true as const };
}

async function seedSyntheticTasksAction() {
  "use server";
  const guard = await requireAdminAndDev();
  if (!guard.ok) {
    redirect(
      `/admin/prompt-lab?seed=${
        guard.reason === "not_admin" ? "synthetic_denied" : "synthetic_prod"
      }`
    );
  }

  try {
    const rows: Array<{
      category: string;
      inputText: string;
      difficulty?: string;
      tags?: string | null;
    }> = [
      {
        category: "coding",
        inputText:
          "DEV: Fix a bug where login fails when password contains spaces.",
        difficulty: "medium",
        tags: JSON.stringify(["DEV_SEED", "bugfix"]),
      },
      {
        category: "coding",
        inputText: "DEV: Implement a feature to export user data as CSV.",
        difficulty: "medium",
        tags: JSON.stringify(["DEV_SEED", "feature"]),
      },
      {
        category: "coding",
        inputText: "DEV: Refactor legacy utils into a typed module.",
        difficulty: "hard",
        tags: JSON.stringify(["DEV_SEED", "refactor"]),
      },
      {
        category: "writing",
        inputText: "DEV: Draft a blog post introducing Orbitar Prompt Lab.",
        tags: JSON.stringify(["DEV_SEED", "blog"]),
      },
      {
        category: "writing",
        inputText: "DEV: Write a concise product launch email to beta users.",
        tags: JSON.stringify(["DEV_SEED", "email"]),
      },
      {
        category: "writing",
        inputText:
          "DEV: Create landing page copy focused on privacy and speed.",
        tags: JSON.stringify(["DEV_SEED", "landing"]),
      },
      {
        category: "planning",
        inputText:
          "DEV: Outline a 2-week roadmap for improving refine latency.",
        tags: JSON.stringify(["DEV_SEED", "roadmap"]),
      },
      {
        category: "planning",
        inputText:
          "DEV: Build a study plan for learning Prisma + Next.js App Router.",
        tags: JSON.stringify(["DEV_SEED", "study"]),
      },
      {
        category: "research",
        inputText: "DEV: Compare two LLM providers for cost and latency.",
        tags: JSON.stringify(["DEV_SEED", "compare"]),
      },
      {
        category: "research",
        inputText:
          "DEV: Summarize a technical article about prompt engineering.",
        tags: JSON.stringify(["DEV_SEED", "summary"]),
      },
    ];

    let created = 0;
    let existed = 0;
    for (const r of rows) {
      const exists = await (prisma as any).syntheticTask.findFirst({
        where: { category: r.category, inputText: r.inputText },
        select: { id: true },
      });
      if (!exists) {
        await (prisma as any).syntheticTask.create({
          data: {
            category: r.category,
            inputText: r.inputText,
            difficulty: r.difficulty,
            tags: r.tags ?? JSON.stringify(["DEV_SEED"]),
          },
        });
        created++;
      } else {
        existed++;
      }
    }
    redirect(`/admin/prompt-lab?seed=synthetic_ok_${created}_${existed}`);
  } catch (error: any) {
    // If this is a Next redirect, rethrow so Next handles it properly
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as any).digest === "string" &&
      String((error as any).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    console.error("[PromptLab Seed] Failed to seed SyntheticTask", error);
    redirect("/admin/prompt-lab?seed=synthetic_err");
  }
}

async function seedPromptSamplesAction() {
  "use server";
  const guard = await requireAdminAndDev();
  if (!guard.ok) {
    redirect(
      `/admin/prompt-lab?seed=${
        guard.reason === "not_admin" ? "samples_denied" : "samples_prod"
      }`
    );
  }

  try {
    const rows: Array<{
      source: string;
      category: string;
      rawText: string;
      refinedText?: string | null;
      plan: string;
      templateSlug?: string | null;
      templateVersion?: string | null;
    }> = [
      {
        source: "internal",
        category: "coding",
        rawText: "DEV SAMPLE: Implement feature to add tags to notes.",
        refinedText:
          "Senior full‑stack engineer; implement note tag feature with migration, REST endpoints, and UI.",
        plan: "free",
        templateSlug: "coding_feature_default",
        templateVersion: "1.0.0",
      },
      {
        source: "internal",
        category: "coding",
        rawText:
          "DEV SAMPLE: Debug error when saving settings: TypeError: cannot read properties of undefined.",
        refinedText:
          "Debugging assistant; isolate null path in settings save flow, capture versions, reproduce steps.",
        plan: "pro",
        templateSlug: "coding_debug_default",
        templateVersion: "1.0.0",
      },
      {
        source: "internal",
        category: "writing",
        rawText:
          "DEV SAMPLE: Help me write a landing page headline and subheader focused on privacy.",
        refinedText: null,
        plan: "light",
        templateSlug: "writing_landing_page_default",
        templateVersion: "1.0.0",
      },
      {
        source: "internal",
        category: "writing",
        rawText:
          "DEV SAMPLE: Draft a concise release note for v0.5 with Prompt Lab admin and seed tools.",
        refinedText:
          "Ruthless editor; concise release note with highlights, impact, and how to access admin.",
        plan: "pro",
        templateSlug: "writing_blog_default",
        templateVersion: "1.0.0",
      },
    ];

    let created = 0;
    let existed = 0;
    for (const r of rows) {
      const exists = await (prisma as any).promptSample.findFirst({
        where: { source: r.source, rawText: r.rawText },
        select: { id: true },
      });
      if (!exists) {
        await (prisma as any).promptSample.create({
          data: {
            source: r.source,
            category: r.category,
            rawText: r.rawText,
            refinedText: r.refinedText ?? null,
            plan: r.plan,
            templateSlug: r.templateSlug ?? null,
            templateVersion: r.templateVersion ?? null,
          },
        });
        created++;
      } else {
        existed++;
      }
    }
    redirect(`/admin/prompt-lab?seed=samples_ok_${created}_${existed}`);
  } catch (error: any) {
    // If this is a Next redirect, rethrow so Next handles it properly
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as any).digest === "string" &&
      String((error as any).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    console.error("[PromptLab Seed] Failed to seed PromptSample", error);
    redirect("/admin/prompt-lab?seed=samples_err");
  }
}

async function runLabBatchAction(_formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  const email = (session as any)?.user?.email as string | undefined;

  if (!isAdminEmail(email)) {
    console.warn("[/admin/prompt-lab/runLab] Non-admin attempted Lab run", {
      email,
      userId: (session as any)?.user?.id,
    });
    redirect("/admin/prompt-lab?labRun=denied");
  }
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[/admin/prompt-lab/runLab] Attempt to run dev Lab in production"
    );
    redirect("/admin/prompt-lab?labRun=prod");
  }

  try {
    const { runsCreated, scoresCreated } = await runLabBatch({ limit: 10 });
    console.info("[PromptLabRunner] Lab batch completed", {
      runsCreated,
      scoresCreated,
    });
    redirect(`/admin/prompt-lab?labRun=ok_${runsCreated}_${scoresCreated}`);
  } catch (error: any) {
    // If this is a Next redirect, rethrow so Next handles it properly
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as any).digest === "string" &&
      String((error as any).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    console.error("[/admin/prompt-lab/runLab] Failed to run Lab batch", error);
    redirect("/admin/prompt-lab?labRun=err");
  }
}

// -----------------------------
// Page Data Load
// -----------------------------

async function loadStats() {
  // Aggregate LabRun + LabScore (v0 leaderboard)
  // Keep this server-side and defensive for dev usage.

  // Totals
  const totalLabRuns = await prisma.labRun.count();
  const totalLabScores = await prisma.labScore.count();

  // Fetch recent LabScores with their LabRun; safe default ordering
  const labScores = await prisma.labScore.findMany({
    include: { labRun: true },
    orderBy: { createdAt: "desc" },
  });

  // Map by templateSlug + templateVersion
  type RowAgg = {
    templateSlug: string;
    templateVersion: string;
    usageCount: number; // number of LabScore rows associated
    runCount: number; // number of LabRun rows seen
    sampleCount: number;
    syntheticCount: number;
    sumStructure: number;
    sumContract: number;
    sumDomain: number;
    sumOverall: number;
    countStructure: number;
    countContract: number;
    countDomain: number;
    countOverall: number;
    lastRunAt: Date | null;
  };

  const map = new Map<string, RowAgg>();

  // helper to ensure we count runs once per labRun id
  const seenRunIds = new Set<string>();

  for (const s of labScores) {
    const run = (s as any).labRun as any | null;
    if (!run) continue;
    const slug = run.templateSlug || "unknown";
    const version = run.templateVersion || "unknown";
    const key = `${slug}__${version}`;

    let agg = map.get(key);
    if (!agg) {
      agg = {
        templateSlug: slug,
        templateVersion: version,
        usageCount: 0,
        runCount: 0,
        sampleCount: 0,
        syntheticCount: 0,
        sumStructure: 0,
        sumContract: 0,
        sumDomain: 0,
        sumOverall: 0,
        countStructure: 0,
        countContract: 0,
        countDomain: 0,
        countOverall: 0,
        lastRunAt: run.createdAt ?? null,
      };
      map.set(key, agg);
    }

    // Count this labScore usage
    agg.usageCount += 1;

    // Sum scores if present
    if (
      typeof s.structureScore === "number" &&
      !Number.isNaN(s.structureScore)
    ) {
      agg.sumStructure += s.structureScore;
      agg.countStructure += 1;
    }
    if (typeof s.contractScore === "number" && !Number.isNaN(s.contractScore)) {
      agg.sumContract += s.contractScore;
      agg.countContract += 1;
    }
    if (typeof s.domainScore === "number" && !Number.isNaN(s.domainScore)) {
      agg.sumDomain += s.domainScore;
      agg.countDomain += 1;
    }
    if (typeof s.overallScore === "number" && !Number.isNaN(s.overallScore)) {
      agg.sumOverall += s.overallScore;
      agg.countOverall += 1;
    }

    // Count run-level metrics once per labRun
    if (run.id && !seenRunIds.has(run.id)) {
      seenRunIds.add(run.id);
      agg.runCount += 1;
      if (run.taskType === "sample") agg.sampleCount += 1;
      else if (run.taskType === "synthetic") agg.syntheticCount += 1;

      // lastRunAt = most recent createdAt
      const createdAt = run.createdAt ? new Date(run.createdAt) : null;
      if (createdAt) {
        if (!agg.lastRunAt || createdAt > agg.lastRunAt)
          agg.lastRunAt = createdAt;
      }
    }
  }

  // Convert map -> rows with averages
  const templateRows = Array.from(map.values()).map((r) => {
    const avgStructure = r.countStructure
      ? r.sumStructure / r.countStructure
      : null;
    const avgContract = r.countContract
      ? r.sumContract / r.countContract
      : null;
    const avgDomain = r.countDomain ? r.sumDomain / r.countDomain : null;
    const avgOverall = r.countOverall ? r.sumOverall / r.countOverall : null;
    return {
      templateSlug: r.templateSlug,
      templateVersion: r.templateVersion,
      usageCount: r.usageCount,
      runCount: r.runCount,
      sampleCount: r.sampleCount,
      syntheticCount: r.syntheticCount,
      avgStructure,
      avgContract,
      avgDomain,
      avgOverall,
      lastRunAt: r.lastRunAt ? new Date(r.lastRunAt) : null,
    };
  });

  // Sort by avgOverall desc (nulls last), then usageCount desc
  templateRows.sort((a, b) => {
    const aScore = typeof a.avgOverall === "number" ? a.avgOverall : -1;
    const bScore = typeof b.avgOverall === "number" ? b.avgOverall : -1;
    if (bScore !== aScore) return bScore - aScore;
    return b.usageCount - a.usageCount;
  });

  // Global average overall (across all scores)
  const overallValues: number[] = [];
  for (const r of templateRows) {
    if (typeof r.avgOverall === "number") overallValues.push(r.avgOverall);
  }
  const avgOverallScore =
    overallValues.length > 0
      ? overallValues.reduce((a, b) => a + b, 0) / overallValues.length
      : null;

  return {
    top: {
      totalLabRuns,
      totalLabScores,
      templatesEvaluated: templateRows.length,
      avgOverallScore,
    },
    templateRows,
  };
}

// -----------------------------
// Page Component
// -----------------------------

export default async function PromptLabAdminPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerSession(authOptions);
  const email = (session as any)?.user?.email as string | undefined;

  if (!isAdminEmail(email)) {
    console.warn("[/admin/prompt-lab] Non-admin attempted access", {
      email,
      userId: (session as any)?.user?.id,
    });
    return (
      <div className="px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-white">
          You do not have access to Prompt Lab Admin.
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          This area is restricted to administrators.
        </p>
      </div>
    );
  }

  let data: any = null;
  let loadError = false;

  try {
    data = await loadStats();
  } catch (error) {
    console.error("[/admin/prompt-lab] Failed to load Prompt Lab stats", error);
    loadError = true;
  }

  const seedParam = (
    typeof searchParams?.seed === "string"
      ? (searchParams!.seed as string)
      : Array.isArray(searchParams?.seed)
      ? (searchParams!.seed![0] as string)
      : ""
  ) as string;

  const labRunParam = (
    typeof searchParams?.labRun === "string"
      ? (searchParams!.labRun as string)
      : Array.isArray(searchParams?.labRun)
      ? (searchParams!.labRun![0] as string)
      : ""
  ) as string;

  let labRunOk = false;
  let labRunMsg = "";
  if (labRunParam) {
    if (labRunParam.startsWith("ok_")) {
      const parts = labRunParam.split("_");
      const runs = parts[1] ? Number(parts[1]) : 0;
      const scores = parts[2] ? Number(parts[2]) : 0;
      labRunOk = true;
      labRunMsg = `Lab batch run successfully (${
        isFinite(runs) ? runs : 0
      } runs, ${isFinite(scores) ? scores : 0} scores).`;
    } else if (labRunParam === "denied") {
      labRunMsg = "Admin only: Lab run denied.";
    } else if (labRunParam === "prod") {
      labRunMsg = "Lab batch is disabled in production.";
    } else {
      labRunMsg = "Lab batch failed. Check server logs.";
    }
  }

  function SeedNotice() {
    if (!seedParam) return null;
    let msg = "";
    let ok = false;
    if (seedParam.startsWith("synthetic_ok")) {
      ok = true;
      // supports synthetic_ok_<created>_<existed> pattern as well as legacy synthetic_ok_<created>
      const parts = seedParam.split("_");
      const created = Number(parts[2] || "0");
      const existedCount = Number(parts[3] || "NaN");
      if (created > 0) {
        msg = `Seeded synthetic tasks (${created} new${
          Number.isFinite(existedCount) ? `, already had ${existedCount}` : ""
        }).`;
      } else {
        msg = "Synthetic task seeds already present (0 new).";
      }
    } else if (seedParam.startsWith("samples_ok")) {
      ok = true;
      // supports samples_ok_<created>_<existed> pattern as well as legacy samples_ok_<created>
      const parts = seedParam.split("_");
      const created = Number(parts[2] || "0");
      const existedCount = Number(parts[3] || "NaN");
      if (created > 0) {
        msg = `Seeded prompt samples (${created} new${
          Number.isFinite(existedCount) ? `, already had ${existedCount}` : ""
        }).`;
      } else {
        msg = "Prompt sample seeds already present (0 new).";
      }
    } else if (
      seedParam === "synthetic_denied" ||
      seedParam === "samples_denied"
    ) {
      msg = "Admin only: seeding denied.";
    } else if (seedParam === "synthetic_prod" || seedParam === "samples_prod") {
      msg = "Seeding disabled in production.";
    } else {
      msg = "Seeding failed. Check server logs.";
    }
    return (
      <div
        className={`mt-4 rounded-md border p-3 text-sm ${
          ok
            ? "border-emerald-700/50 bg-emerald-950/40 text-emerald-300"
            : "border-rose-700/50 bg-rose-950/40 text-rose-300"
        }`}
      >
        {msg}
      </div>
    );
  }

  return (
    <div className="px-6 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <header>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
            Prompt Lab
          </h1>
          <p className="mt-2 text-zinc-400">
            Read-only v0 – early metrics preview
          </p>
          <SeedNotice />
          {labRunParam ? (
            <div
              className={`mt-4 rounded-md border p-3 text-sm ${
                labRunOk
                  ? "border-emerald-700/50 bg-emerald-950/40 text-emerald-300"
                  : "border-rose-700/50 bg-rose-950/40 text-rose-300"
              }`}
            >
              {labRunMsg}
            </div>
          ) : null}
        </header>

        {/* Top-level stats */}
        <section className="mt-8">
          {loadError ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-6 text-zinc-300">
              We couldn’t load Prompt Lab data right now.
            </div>
          ) : !data ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-6 text-zinc-300">
              Loading...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-zinc-800 bg-black/40 p-5">
                <div className="text-xs uppercase tracking-wide text-zinc-400">
                  Total RefineEvents
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {data.top.totalRefines}
                </div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-black/40 p-5">
                <div className="text-xs uppercase tracking-wide text-zinc-400">
                  Template slugs
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {data.top.distinctTemplateSlugs}
                </div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-black/40 p-5">
                <div className="text-xs uppercase tracking-wide text-zinc-400">
                  Opt-in events
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {data.top.optInCount}
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  {data.top.totalRefines > 0
                    ? Math.round(
                        (data.top.optInCount / data.top.totalRefines) * 100
                      )
                    : 0}
                  % of total
                </div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-black/40 p-5">
                <div className="text-xs uppercase tracking-wide text-zinc-400">
                  Incognito events
                </div>
                <div className="mt-2 text-2xl font-semibold text-white">
                  {data.top.incognitoCount}
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  {data.top.totalRefines > 0
                    ? Math.round(
                        (data.top.incognitoCount / data.top.totalRefines) * 100
                      )
                    : 0}
                  % of total
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Template leaderboard */}
        <section className="mt-10">
          <div className="rounded-lg border border-zinc-800 bg-black/40 p-5">
            <div className="mb-4 text-sm font-medium text-white">
              Template leaderboard
            </div>
            {!data || data.templateRows.length === 0 ? (
              <div className="text-sm text-zinc-400">
                No data yet. Seed some samples or refine prompts to populate
                stats.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-zinc-400">
                    <tr>
                      <th className="px-3 py-2 font-normal">Template</th>
                      <th className="px-3 py-2 font-normal">Version</th>
                      <th className="px-3 py-2 font-normal">Usage</th>
                      <th className="px-3 py-2 font-normal">Avg Structure</th>
                      <th className="px-3 py-2 font-normal">Avg Contract</th>
                      <th className="px-3 py-2 font-normal">Avg Domain</th>
                      <th className="px-3 py-2 font-normal">Avg Overall</th>
                      <th className="px-3 py-2 font-normal">Sample %</th>
                      <th className="px-3 py-2 font-normal">Last run</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 text-zinc-200">
                    {data.templateRows.map((row: any) => {
                      const usage = row.usageCount || 1;
                      const samplePct = Math.round(
                        (row.sampleCount / Math.max(1, row.runCount)) * 100
                      );
                      const formatScore = (v: number | null) =>
                        typeof v === "number"
                          ? (v * 100).toFixed(0) + "%"
                          : "—";
                      return (
                        <tr key={`${row.templateSlug}__${row.templateVersion}`}>
                          <td className="px-3 py-2 font-mono text-xs">
                            {row.templateSlug}
                          </td>
                          <td className="px-3 py-2">{row.templateVersion}</td>
                          <td className="px-3 py-2">{row.usageCount}</td>
                          <td className="px-3 py-2">
                            {formatScore(row.avgStructure)}
                          </td>
                          <td className="px-3 py-2">
                            {formatScore(row.avgContract)}
                          </td>
                          <td className="px-3 py-2">
                            {formatScore(row.avgDomain)}
                          </td>
                          <td className="px-3 py-2 font-semibold">
                            {formatScore(row.avgOverall)}
                          </td>
                          <td className="px-3 py-2">{samplePct}%</td>
                          <td className="px-3 py-2">
                            {row.lastRunAt
                              ? new Date(row.lastRunAt)
                                  .toISOString()
                                  .slice(0, 19)
                                  .replace("T", " ")
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Dev seed tools */}
        <section className="mt-10">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-5">
            <div className="text-sm font-medium text-white">
              Dev Seed Tools (local/dev only)
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              These tools are intended for local development and testing only.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <form action={seedSyntheticTasksAction}>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                >
                  Seed Synthetic Tasks (DEV)
                </button>
              </form>
              <form action={runLabBatchAction}>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                >
                  Run Lab Batch (DEV)
                </button>
              </form>
              <form action={seedPromptSamplesAction}>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
                >
                  Seed Prompt Samples (DEV)
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
