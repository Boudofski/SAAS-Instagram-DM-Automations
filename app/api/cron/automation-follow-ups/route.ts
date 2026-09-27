import { authorizeAutomationScheduler } from "@/lib/automation-scheduler-auth";
import { NextResponse } from "next/server";
import { processAutomationFollowUps } from "@/lib/automation-engagement";
import { processScheduledAutomationFlows } from "@/lib/automation-flow/scheduler";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request) {
  if (!await authorizeAutomationScheduler(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [followUps, flows] = await Promise.all([processAutomationFollowUps(), processScheduledAutomationFlows()]);
    return NextResponse.json({ ok: true, ...followUps, ...flows });
  }
  catch { return NextResponse.json({ error: "Follow-up queue unavailable" }, { status: 503 }); }
}
