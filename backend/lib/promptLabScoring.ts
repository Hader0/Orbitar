export type LabScoringInput = {
  category: string;
  templateSlug: string;
  templateVersion: string;
  rawText: string;
  refinedPrompt: string;
};

export type LabScoringResult = {
  structureScore?: number;
  contractScore?: number;
  domainScore?: number;
  overallScore?: number;
  metricsJson?: Record<string, any>;
};

/**
 * v0 heuristic scoring (pure string analysis, deterministic, no external calls)
 */
export function scoreLabRun(input: LabScoringInput): LabScoringResult {
  const refined = (input.refinedPrompt || "").toLowerCase();
  const raw = (input.rawText || "").toLowerCase();
  const category = (input.category || "").toLowerCase();

  // Structure markers
  const structureTerms = [
    "role",
    "goal",
    "context",
    "constraints",
    "output",
    "steps",
    "audience",
    "tone",
    "length",
    "quality",
  ];
  const structureHit = countHits(refined, structureTerms);
  const structureScore = bounded01(structureHit / 6); // normalize by 6 markers

  // Contract markers
  const contractTerms = [
    "json",
    "markdown",
    "bullet",
    "bulleted",
    "code block",
    "schema",
    "sections",
    "table",
  ];
  const contractHitRefined = countHits(refined, contractTerms);
  const contractHitRaw = countHits(raw, ["json", "markdown", "schema"]);
  let contractScore = bounded01(contractHitRefined / 3);
  // Penalize if raw requires JSON but refined doesn't mention it at all
  if (contractHitRaw > 0 && !refined.includes("json")) {
    contractScore = Math.max(0, contractScore - 0.3);
  }

  // Domain markers
  let domainScore = 0;
  if (category === "coding") {
    const codingTerms = [
      "step-by-step",
      "edge cases",
      "tests",
      "testing",
      "error handling",
      "constraints",
      "diff",
    ];
    domainScore = bounded01(countHits(refined, codingTerms) / 3);
  } else if (category === "writing") {
    const writingTerms = [
      "tone",
      "audience",
      "length",
      "style",
      "voice",
      "reading level",
    ];
    domainScore = bounded01(countHits(refined, writingTerms) / 3);
  } else if (category === "planning") {
    const planningTerms = [
      "timeline",
      "milestones",
      "phases",
      "dependencies",
      "risks",
    ];
    domainScore = bounded01(countHits(refined, planningTerms) / 3);
  } else if (category === "research") {
    const researchTerms = [
      "compare",
      "pros and cons",
      "sources",
      "citations",
      "evidence",
    ];
    domainScore = bounded01(countHits(refined, researchTerms) / 3);
  } else {
    // General: modest weight for structure hints
    domainScore = bounded01(structureHit / 8);
  }

  // Overall simple average
  const scores = [structureScore, contractScore, domainScore].filter(
    (n) => typeof n === "number"
  );
  const overallScore = scores.length
    ? clamp01(scores.reduce((a, b) => a + b, 0) / scores.length)
    : undefined;

  const metricsJson = {
    structureHit,
    contractHitRefined,
    contractHitRaw,
    category,
    templateSlug: input.templateSlug,
    templateVersion: input.templateVersion,
  };

  return {
    structureScore,
    contractScore,
    domainScore,
    overallScore,
    metricsJson,
  };
}

function countHits(text: string, terms: string[]): number {
  let c = 0;
  for (const t of terms) {
    if (text.includes(t.toLowerCase())) c += 1;
  }
  return c;
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
function bounded01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return clamp01(n);
}
