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
 * v1 multi-dimensional heuristic scoring (deterministic, no external calls)
 *
 * Public interface is stable: scoreLabRun(input) -> LabScoringResult
 *
 * New internal sub-scores included in metricsJson:
 * - contextHandlingScore
 * - constraintClarityScore
 * - guidanceScore
 * - readabilityScore
 * - efficiencyScore
 *
 * Top-level fields (structureScore, contractScore, domainScore, overallScore)
 * remain present for compatibility with existing storage.
 */

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function containsAny(text: string, terms: string[]) {
  const t = text.toLowerCase();
  for (const term of terms) {
    if (t.includes(term.toLowerCase())) return true;
  }
  return false;
}

function countHits(text: string, terms: string[]) {
  const t = text.toLowerCase();
  let c = 0;
  for (const term of terms) {
    if (t.includes(term.toLowerCase())) c += 1;
  }
  return c;
}

function lines(text: string) {
  return text.split(/\r?\n/);
}

function isHeadingLine(line: string) {
  return /^\s*#{1,4}\s+/.test(line) || /:\s*$/.test(line);
}

/** Structure score: presence of conceptual sections */
function computeStructureScore(refined: string) {
  const checks = {
    hasRoleSection:
      /\b(you are|role:|as an? [a-z]+)/i.test(refined) ||
      refined.startsWith("You are"),
    hasGoalSection: /\b(goal:|objective:|your goal|you are tasked with)/i.test(
      refined
    ),
    hasContextSection:
      /\b(context:|background:|given (the )?following|below (is|are))/i.test(
        refined
      ),
    hasInstructionsSection:
      /\b(instructions:|steps:|step-by-step|steps to|1\.|2\.|\bthen\b|\bnext\b)/i.test(
        refined
      ),
    hasConstraintsSection:
      /\b(constraints:|rules:|do not|do n't|only|must not|must only|avoid|no more than|at most)/i.test(
        refined
      ),
    hasOutputSection:
      /\b(output:|format:|return (a|the)|respond with|json|markdown|table|columns)/i.test(
        refined
      ),
  };

  const presentCount = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const structureScore = clamp01(presentCount / total);

  return { structureScore, presentCount, total, ...checks };
}

/** Context handling: labels + attachments + summarisation hints */
function computeContextHandlingScore(raw: string, refined: string) {
  const contextTerms = [
    "context:",
    "background:",
    "given the following",
    "use the context below",
  ];
  const attachmentTerms = [
    "file:",
    "code:",
    "image:",
    "FILE:",
    "CODE:",
    "IMAGE:",
    "```",
    "stack",
  ];
  const summariseHints = [
    "summarise",
    "summarize",
    "compress",
    "bullet",
    "key points",
    "extract",
  ];

  const refinedLower = refined.toLowerCase();
  const rawLower = raw.toLowerCase();

  let score = 0;
  let reasons: string[] = [];

  const hasContextLabel =
    countHits(refinedLower, contextTerms) > 0 ||
    countHits(rawLower, contextTerms) > 0;
  if (hasContextLabel) {
    score += 0.6;
    reasons.push("context_label");
  }

  const hasAttachment =
    countHits(refinedLower, attachmentTerms) > 0 ||
    countHits(rawLower, attachmentTerms) > 0;
  if (hasAttachment) {
    score += 0.25;
    reasons.push("attachment_ref");
  }

  const hasSummarise =
    countHits(refinedLower, summariseHints) > 0 ||
    countHits(rawLower, summariseHints) > 0;
  if (hasSummarise) {
    score += 0.15;
    reasons.push("summarise_hint");
  }

  return {
    contextHandlingScore: clamp01(score),
    hasContextLabel,
    hasAttachment,
    hasSummarise,
    reasons,
  };
}

/** Constraint clarity: presence of explicit, measurable constraints */
function computeConstraintClarityScore(refined: string) {
  const constraintTerms = [
    "at most",
    "no more than",
    "between",
    "minimum",
    "maximum",
    "words",
    "characters",
    "length",
    "sentences",
    "reading level",
    "tone",
    "style",
    "voice",
    "do not",
    "avoid",
    "never",
    "only",
    "must",
  ];

  const hitCount = countHits(refined, constraintTerms);
  // heuristics: 0 hits -> 0, 1-2 hits -> 0.4, 3-5 -> 0.7, 6+ -> 1.0
  let base = 0;
  if (hitCount === 0) base = 0;
  else if (hitCount <= 2) base = 0.4;
  else if (hitCount <= 5) base = 0.7;
  else base = 1.0;

  // Penalize vague constraints like just 'be concise' or 'be good'
  const vague =
    /\b(be concise|be brief|be good|do your best|high quality|well-written)\b/i.test(
      refined
    );
  if (vague && base > 0.2) base = Math.max(0, base - 0.15);

  return { constraintClarityScore: clamp01(base), hitCount, vague };
}

/** Guidance score: procedural clarity (steps, numbered lists) */
function computeGuidanceScore(refined: string) {
  const L = lines(refined);
  let numbered = 0;
  let bullets = 0;
  for (const ln of L) {
    if (/^\s*\d+\.\s+/.test(ln)) numbered += 1;
    if (/^\s*[-•*+]\s+/.test(ln)) bullets += 1;
  }
  const stepWords = countHits(refined, [
    "step",
    "then",
    "next",
    "finally",
    "first,",
    "second,",
  ]);
  // Score from structural markers
  const structural = clamp01(
    (numbered * 1.2 + bullets * 0.8 + stepWords * 0.5) / 8
  );
  return { guidanceScore: structural, numbered, bullets, stepWords };
}

/** Readability heuristics: line breaks, headings, average line length */
function computeReadabilityScore(refined: string) {
  const L = lines(refined).map((s) => s.trim());
  const lineCount = L.length;
  const nonEmptyLines = L.filter((s) => s.length > 0);
  const avgLineLength =
    nonEmptyLines.length > 0
      ? nonEmptyLines.reduce((a, b) => a + b.length, 0) / nonEmptyLines.length
      : 0;

  const numHeadings = nonEmptyLines.filter(isHeadingLine).length;
  const numBullets = nonEmptyLines.filter((l) =>
    /^\s*[-•*+]\s+/.test(l)
  ).length;
  const numNumbered = nonEmptyLines.filter((l) =>
    /^\s*\d+\.\s+/.test(l)
  ).length;

  // penalize giant lines
  const longLinePenalty = nonEmptyLines.filter((l) => l.length > 160).length;
  const giantParagraph = nonEmptyLines.some((l) => l.length > 500);

  let score = 0;
  // reward headings/bullets/numbered
  score += clamp01(
    (numHeadings * 0.4 + numBullets * 0.3 + numNumbered * 0.3) / 5
  );
  // reward medium avg line length (20..120)
  if (avgLineLength > 20 && avgLineLength < 120) score += 0.4;
  else if (avgLineLength >= 120 && avgLineLength < 200) score += 0.2;
  // penalize long-line issues
  score -= clamp01(longLinePenalty * 0.05 + (giantParagraph ? 0.2 : 0));

  return {
    readabilityScore: clamp01(score),
    lineCount,
    avgLineLength,
    numHeadings,
    numBullets,
    numNumbered,
    longLinePenalty,
    giantParagraph,
  };
}

/** Efficiency score: how concisely the refined prompt expands on raw text */
function computeEfficiencyScore(raw: string, refined: string) {
  const rawLen = Math.max(1, raw.length);
  const refinedLen = Math.max(1, refined.length);
  const ratio = refinedLen / rawLen;

  // sweet spot between 1 and 4
  let score = 0;
  if (ratio >= 1 && ratio <= 4) {
    score = 1 - Math.abs(ratio - 2) / 2; // peak near 2
  } else if (ratio < 1) {
    // compression - okay to some degree
    score = clamp01(0.6 * (ratio / 1));
  } else {
    // too long - penalize more as ratio grows
    if (ratio <= 6) score = clamp01(1 - (ratio - 4) / 4);
    else score = 0;
  }

  return { efficiencyScore: clamp01(score), rawLen, refinedLen, ratio };
}

/** Domain score: category-specific keyword matching (enriched) */
function computeDomainScore(category: string, refined: string) {
  const c = (category || "general").toLowerCase();
  const text = refined.toLowerCase();

  const buckets: Record<string, string[]> = {
    coding: [
      "function",
      "class",
      "api",
      "typescript",
      "javascript",
      "error",
      "stack",
      "test",
      "unit test",
      "integration test",
      "refactor",
      "code fence",
      "```",
      "edge case",
      "error handling",
    ],
    writing: [
      "headline",
      "hook",
      "outline",
      "sections",
      "audience",
      "cta",
      "tone",
      "voice",
      "reading level",
    ],
    planning: [
      "timeline",
      "milestone",
      "priority",
      "task",
      "roadmap",
      "phases",
      "dependencies",
      "owner",
    ],
    research: [
      "sources",
      "citations",
      "compare",
      "pros and cons",
      "evidence",
      "summary",
      "bullet",
    ],
    general: ["audience", "tone", "context", "goal", "steps", "constraints"],
  };

  const terms = buckets[c] || buckets["general"];
  const hits = countHits(text, terms);
  // normalize: more hits -> better (cap to length of terms)
  const score = clamp01(hits / Math.max(3, Math.min(terms.length, 8)));

  return {
    domainScore: clamp01(score),
    domainHits: hits,
    domainTermsChecked: terms.length,
  };
}

/** Contract score: detect explicit output contract and contradictions */
function computeContractScore(refined: string) {
  const text = refined.toLowerCase();
  const wantsJson =
    /json|return (a )?json|schema|properties|"[^"]+"\s*:\s*/i.test(text);
  const wantsMarkdown = /markdown|# |## |fenced code|```/i.test(text);
  const wantsTable = /table|columns|rows|^\s*\|.*\|/m.test(text);
  const wantsBullets = /bullet|bulleted|list|unordered list|ordered list/i.test(
    text
  );
  const wantsNarrative =
    /essay|paragraph|write a (short )?(blog|post|article)|compose|draft|story/i.test(
      text
    );
  const wantsOnly =
    /\b(return only|respond with only|do not include explanations|do not include commentary)\b/i.test(
      text
    );

  // contradictory if multiple strong, incompatible formats present
  const formatHints = [wantsJson, wantsMarkdown, wantsTable, wantsNarrative];
  const strongFormats = formatHints.filter(Boolean).length;
  const contradiction =
    strongFormats > 1 &&
    ((wantsJson && wantsNarrative) || (wantsTable && wantsNarrative));

  // base contract clarity based on presence of one strong format hint
  let base = Math.min(1, strongFormats * 0.5);
  if (wantsOnly) base = Math.max(base, 0.6);
  if (contradiction) base = Math.max(0, base - 0.5);

  // additional boost if explicit schema words exist
  const hasSchema = /\bschema\b|\bproperties\b|\btype\b|\brequired\b/.test(
    text
  );
  if (hasSchema) base = Math.min(1, base + 0.25);

  return {
    contractScore: clamp01(base),
    wantsJson,
    wantsMarkdown,
    wantsTable,
    wantsBullets,
    wantsNarrative,
    wantsOnly,
    contradiction,
    hasSchema,
  };
}

/** Main exported function */
export function scoreLabRun(input: LabScoringInput): LabScoringResult {
  const refined = (input.refinedPrompt || "").trim();
  const raw = (input.rawText || "").trim();
  const category = (input.category || "general").toLowerCase();

  // Structure
  const structure = computeStructureScore(refined);

  // Context handling
  const contextHandling = computeContextHandlingScore(raw, refined);

  // Constraint clarity
  const constraintClarity = computeConstraintClarityScore(refined);

  // Guidance/procedural clarity
  const guidance = computeGuidanceScore(refined);

  // Readability
  const readability = computeReadabilityScore(refined);

  // Efficiency
  const efficiency = computeEfficiencyScore(raw, refined);

  // Domain
  const domain = computeDomainScore(category, refined);

  // Contract
  const contract = computeContractScore(refined);

  // Top-level exposure (keep these names stable)
  const structureScore = clamp01(structure.structureScore);
  const contractScore = clamp01(contract.contractScore);
  const domainScore = clamp01(domain.domainScore);

  // Overall weighted average (as requested)
  const overallScore = clamp01(
    0.2 * structureScore +
      0.1 * contractScore +
      0.1 * domainScore +
      0.15 * contextHandling.contextHandlingScore +
      0.15 * constraintClarity.constraintClarityScore +
      0.1 * guidance.guidanceScore +
      0.1 * readability.readabilityScore +
      0.1 * efficiency.efficiencyScore
  );

  const metricsJson: Record<string, any> = {
    category,
    templateSlug: input.templateSlug,
    templateVersion: input.templateVersion,

    // sub-scores
    contextHandlingScore: contextHandling.contextHandlingScore,
    constraintClarityScore: constraintClarity.constraintClarityScore,
    guidanceScore: guidance.guidanceScore,
    readabilityScore: readability.readabilityScore,
    efficiencyScore: efficiency.efficiencyScore,

    // structure details
    structureHitCount: structure.presentCount,
    hasRoleSection: structure.hasRoleSection,
    hasGoalSection: structure.hasGoalSection,
    hasContextSection: structure.hasContextSection,
    hasInstructionsSection: structure.hasInstructionsSection,
    hasConstraintsSection: structure.hasConstraintsSection,
    hasOutputSection: structure.hasOutputSection,

    // counts & readability
    numHeadings: readability.numHeadings,
    numBullets: readability.numBullets,
    numNumberedLines: readability.numNumbered,
    avgLineLength: readability.avgLineLength,
    lineCount: readability.lineCount,

    // domain & contract hints
    domainHits: domain.domainHits,
    domainTermsChecked: domain.domainTermsChecked,
    wantsJson: contract.wantsJson,
    wantsMarkdown: contract.wantsMarkdown,
    wantsTable: contract.wantsTable,
    wantsOnly: contract.wantsOnly,
    contractContradiction: contract.contradiction,

    // efficiency raw
    rawLength: efficiency.rawLen,
    refinedLength: efficiency.refinedLen,
    lengthRatio: efficiency.ratio,
  };

  return {
    structureScore,
    contractScore,
    domainScore,
    overallScore,
    metricsJson,
  };
}
