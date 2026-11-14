import { processServiceEmailRetries } from "@/lib/email/delivery";
import { authorizeQStashScheduler } from "@/lib/qstash-scheduler-auth";
import { processUsageAlerts } from "@/lib/email/usage-alerts";
import { processOnboardingReminders } from "@/lib/email/onboarding";
import { NextResponse } from "next/server";
import { processMarketingQueue } from "@/lib/marketing/delivery";
import { authorizeMarketingScheduler } from "@/lib/marketing/scheduler-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request) {
  if (!(await authorizeMarketingScheduler(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return processQueues();
}
export async function POST(request: Request) {
  if (
    !(await authorizeQStashScheduler(
      request,
      "https://ap3k.com/api/cron/marketing",
    ))
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return processQueues();
}
async function processQueues() {
  try {
    const retries = await processServiceEmailRetries();
    const usage = await processUsageAlerts();
    const marketing = await processMarketingQueue();
    const onboarding = await processOnboardingReminders();
    return NextResponse.json({ ...marketing, onboarding, usage, retries });
  } catch {
    return NextResponse.json(
      { error: "Marketing queue unavailable" },
      { status: 503 },
    );
  }
}
