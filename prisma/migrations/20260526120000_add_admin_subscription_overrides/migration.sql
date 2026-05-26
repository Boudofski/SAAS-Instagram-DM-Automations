ALTER TABLE "Subscription"
ADD COLUMN "staticReplyLimitOverride" INTEGER,
ADD COLUMN "staticReplyCreditsCurrentMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "usageEnforcedFrom" TIMESTAMP(3);
