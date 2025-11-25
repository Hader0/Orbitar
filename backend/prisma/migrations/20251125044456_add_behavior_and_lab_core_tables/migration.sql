-- CreateTable
CREATE TABLE "SyntheticTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "inputText" TEXT NOT NULL,
    "difficulty" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PromptSample" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refineEventId" TEXT,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "refinedText" TEXT,
    "plan" TEXT NOT NULL,
    "templateSlug" TEXT,
    "templateVersion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromptSample_refineEventId_fkey" FOREIGN KEY ("refineEventId") REFERENCES "refine_events" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LabRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateSlug" TEXT NOT NULL,
    "templateVersion" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "syntheticTaskId" TEXT,
    "promptSampleId" TEXT,
    "modelName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "rawRefinedPrompt" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LabRun_syntheticTaskId_fkey" FOREIGN KEY ("syntheticTaskId") REFERENCES "SyntheticTask" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LabRun_promptSampleId_fkey" FOREIGN KEY ("promptSampleId") REFERENCES "PromptSample" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LabScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "labRunId" TEXT NOT NULL,
    "structureScore" REAL,
    "contractScore" REAL,
    "domainScore" REAL,
    "overallScore" REAL,
    "metricsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LabScore_labRunId_fkey" FOREIGN KEY ("labRunId") REFERENCES "LabRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
