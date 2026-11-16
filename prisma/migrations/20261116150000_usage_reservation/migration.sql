-- Additive: older code ignores this table, so code and migration order is safe either way.
CREATE TABLE "UsageReservation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "units" INTEGER NOT NULL,
  "source" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UsageReservation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UsageReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "UsageReservation_userId_createdAt_idx" ON "UsageReservation"("userId", "createdAt");
