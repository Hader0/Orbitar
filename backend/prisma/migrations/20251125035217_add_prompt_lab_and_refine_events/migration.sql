-- CreateTable
CREATE TABLE "refine_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "plan" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateVersion" TEXT NOT NULL,
    "rawTextLength" INTEGER NOT NULL,
    "refinedTextLength" INTEGER NOT NULL,
    "acceptedAt" DATETIME,
    "reverted" BOOLEAN NOT NULL DEFAULT false,
    "editDistanceBucket" TEXT,
    "promptLabOptIn" BOOLEAN NOT NULL DEFAULT false,
    "isIncognito" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "refine_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "promptLabOptIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("allowDataUse", "createdAt", "dailyUsageCount", "dailyUsageResetAt", "defaultIncognito", "email", "emailVerified", "id", "image", "name", "plan", "stripeCustomerId", "stripeSubscriptionId", "stripeSubscriptionStatus", "updatedAt") SELECT "allowDataUse", "createdAt", "dailyUsageCount", "dailyUsageResetAt", "defaultIncognito", "email", "emailVerified", "id", "image", "name", "plan", "stripeCustomerId", "stripeSubscriptionId", "stripeSubscriptionStatus", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
