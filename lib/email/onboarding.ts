import type { Prisma } from "@prisma/client";
import { client } from "@/lib/prisma";
import { getApplicationUrl } from "@/lib/app-url";
import { dashboardPath } from "@/lib/dashboard";
import { getEmailConfiguration, sendAp3kEmail } from "./delivery";
import { takeMarketingSlot } from "@/lib/marketing/delivery";

export const ONBOARDING_DAILY_LIMIT = 40;
export const ONBOARDING_BATCH_SIZE = 6;
const terminal = ["BOUNCED", "COMPLAINED", "SUPPRESSED"] as const;

export function onboardingReady() {
  return process.env.VERCEL_ENV === "production" && process.env.AP3K_ONBOARDING_ENABLED !== "false"
    && getEmailConfiguration().configured && getEmailConfiguration().webhookConfigured;
}

/** Never-connected accounts only. Expired connections have their own urgent email. */
export function onboardingEligibility(now = new Date()): Prisma.UserWhereInput {
  return {
    status: "ACTIVE",
    createdAt: { lte: new Date(now.getTime() - 24 * 3600000) },
    integrations: { none: { name: "INSTAGRAM" } },
    OR: [{ emailPreference: { is: null } }, { emailPreference: { is: { productTips: true } } }],
    emailDeliveries: { none: { OR: [
      { templateId: "connect_instagram" },
      { status: { in: [...terminal] } },
    ] } },
  };
}

export async function getOnboardingOverview() {
  const [eligible, history] = await Promise.all([
    client.user.count({ where: onboardingEligibility() }),
    client.emailDelivery.groupBy({ where: { templateId: "connect_instagram", metadata: { path: ["source"], equals: "onboarding" } }, by: ["status"], _count: { _all: true } }),
  ]);
  const counts = Object.fromEntries(history.map(row => [row.status, row._count._all]));
  return { enabled: onboardingReady(), eligible,
    accepted: ["SENT", "DELIVERED", "OPENED", "CLICKED"].reduce((n, status) => n + (counts[status] || 0), 0),
    attention: ["FAILED", "BOUNCED", "COMPLAINED", "SUPPRESSED", "PENDING"].reduce((n, status) => n + (counts[status] || 0), 0) };
}

export async function processOnboardingReminders() {
  const result = { enabled: onboardingReady(), sent: 0, skipped: 0, failed: 0, deferred: 0 };
  if (!result.enabled) return result;
  // Shared lock covers scheduler and owner button; no overlapping batches.
  if (!await takeMarketingSlot("onboarding-worker", "all", 1, 5 * 60_000)) return result;
  const candidates = await client.user.findMany({ where: onboardingEligibility(), orderBy: { createdAt: "asc" }, take: ONBOARDING_BATCH_SIZE, select: { id: true } });
  for (const candidate of candidates) {
    // Re-evaluate account, preference and history just before each delivery.
    const user = await client.user.findFirst({ where: { AND: [{ id: candidate.id }, onboardingEligibility()] }, select: { id: true, clerkId: true, email: true, firstname: true } });
    if (!user) { result.skipped++; continue; }
    const suppressed = await client.emailDelivery.findFirst({ where: { recipient: { equals: user.email, mode: "insensitive" }, status: { in: [...terminal] } }, select: { id: true } });
    if (suppressed) { result.skipped++; continue; }
    // 40 onboarding + existing 30 marketing leaves room on the 100/day plan.
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const attemptsToday = await client.emailDelivery.count({ where: { createdAt: { gte: today }, status: { not: "SKIPPED" } } });
    if (attemptsToday >= 80 || !await takeMarketingSlot("onboarding-send", "all", ONBOARDING_DAILY_LIMIT)) { result.deferred++; break; }
    try {
      const sent = await sendAp3kEmail({ templateId: "connect_instagram", to: user.email, userId: user.id,
        idempotencyKey: `connect-instagram:v1:${user.id}`,
        context: { firstName: user.firstname, actionUrl: `${getApplicationUrl()}${dashboardPath(user.clerkId)}` },
        metadata: { source: "onboarding", campaign: "connect-instagram-v1" },
      });
      if (sent.ok && sent.status === "sent") result.sent++;
      else if (!sent.ok && sent.status === "failed") { result.failed++; break; }
      else result.skipped++;
    } catch {
      // Do not blindly retry uncertain sends. The saved key prevents duplicates.
      result.failed++; break;
    }
    await new Promise(resolve => setTimeout(resolve, 650));
  }
  return result;
}
