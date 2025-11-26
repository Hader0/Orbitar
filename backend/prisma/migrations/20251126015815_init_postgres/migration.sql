-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "dailyUsageCount" INTEGER NOT NULL DEFAULT 0,
    "dailyUsageResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripeSubscriptionStatus" TEXT,
    "allowDataUse" BOOLEAN NOT NULL DEFAULT false,
    "defaultIncognito" BOOLEAN NOT NULL DEFAULT false,
    "promptLabOptIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "PromptEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "plan" TEXT,
    "source" TEXT,
    "category" TEXT,
    "templateId" TEXT,
    "model" TEXT,
    "modelStyle" TEXT,
    "latencyMs" INTEGER,
    "status" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "incognito" BOOLEAN,

    CONSTRAINT "PromptEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTemplatePreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserTemplatePreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refine_events" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "plan" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateVersion" TEXT NOT NULL,
    "rawTextLength" INTEGER NOT NULL,
    "refinedTextLength" INTEGER NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "reverted" BOOLEAN NOT NULL DEFAULT false,
    "editDistanceBucket" TEXT,
    "promptLabOptIn" BOOLEAN NOT NULL DEFAULT false,
    "isIncognito" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "refine_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyntheticTask" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "inputText" TEXT NOT NULL,
    "difficulty" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyntheticTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptSample" (
    "id" TEXT NOT NULL,
    "refineEventId" TEXT,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "refinedText" TEXT,
    "plan" TEXT NOT NULL,
    "templateSlug" TEXT,
    "templateVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptSample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabRun" (
    "id" TEXT NOT NULL,
    "templateSlug" TEXT NOT NULL,
    "templateVersion" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "syntheticTaskId" TEXT,
    "promptSampleId" TEXT,
    "modelName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "rawRefinedPrompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabScore" (
    "id" TEXT NOT NULL,
    "labRunId" TEXT NOT NULL,
    "structureScore" DOUBLE PRECISION,
    "contractScore" DOUBLE PRECISION,
    "domainScore" DOUBLE PRECISION,
    "overallScore" DOUBLE PRECISION,
    "metricsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LabScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "UserTemplatePreference_userId_templateId_key" ON "UserTemplatePreference"("userId", "templateId");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptEvent" ADD CONSTRAINT "PromptEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTemplatePreference" ADD CONSTRAINT "UserTemplatePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refine_events" ADD CONSTRAINT "refine_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptSample" ADD CONSTRAINT "PromptSample_refineEventId_fkey" FOREIGN KEY ("refineEventId") REFERENCES "refine_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabRun" ADD CONSTRAINT "LabRun_syntheticTaskId_fkey" FOREIGN KEY ("syntheticTaskId") REFERENCES "SyntheticTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabRun" ADD CONSTRAINT "LabRun_promptSampleId_fkey" FOREIGN KEY ("promptSampleId") REFERENCES "PromptSample"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabScore" ADD CONSTRAINT "LabScore_labRunId_fkey" FOREIGN KEY ("labRunId") REFERENCES "LabRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
