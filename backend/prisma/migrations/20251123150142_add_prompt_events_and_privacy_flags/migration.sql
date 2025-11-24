-- CreateTable
CREATE TABLE "PromptEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    CONSTRAINT "PromptEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "dailyUsageCount" INTEGER NOT NULL DEFAULT 0,
    "dailyUsageResetAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripeSubscriptionStatus" TEXT,
    "allowDataUse" BOOLEAN NOT NULL DEFAULT false,
    "defaultIncognito" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "dailyUsageCount", "dailyUsageResetAt", "email", "emailVerified", "id", "image", "name", "plan", "stripeCustomerId", "stripeSubscriptionId", "stripeSubscriptionStatus", "updatedAt") SELECT "createdAt", "dailyUsageCount", "dailyUsageResetAt", "email", "emailVerified", "id", "image", "name", "plan", "stripeCustomerId", "stripeSubscriptionId", "stripeSubscriptionStatus", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
