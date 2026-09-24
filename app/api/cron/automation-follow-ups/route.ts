import { authorizeAutomationScheduler } from "@/lib/automation-scheduler-auth";
import { NextResponse } from "next/server";
import { processAutomationFollowUps } from "@/lib/automation-engagement";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request) {
  if (!await authorizeAutomationScheduler(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { return NextResponse.json({ ok: true, ...await processAutomationFollowUps() }); }
  catch { return NextResponse.json({ error: "Follow-up queue unavailable" }, { status: 503 }); }
}
