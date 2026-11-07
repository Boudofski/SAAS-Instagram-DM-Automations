import { processOnboardingReminders } from "@/lib/email/onboarding";
import { NextResponse } from "next/server";
import { processMarketingQueue } from "@/lib/marketing/delivery";
import { authorizeMarketingScheduler } from "@/lib/marketing/scheduler-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request) {
  if (!await authorizeMarketingScheduler(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const marketing = await processMarketingQueue();
    const onboarding = await processOnboardingReminders();
    return NextResponse.json({ ...marketing, onboarding });
  }
  catch { return NextResponse.json({ error: "Marketing queue unavailable" }, { status: 503 }); }
}
