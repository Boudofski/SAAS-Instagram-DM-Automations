import { NextResponse } from "next/server";
import { processOwnerAlertQueue } from "@/lib/email/owner-alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try { return NextResponse.json({ ok: true, ...await processOwnerAlertQueue() }); }
  catch { return NextResponse.json({ error: "Owner alert queue unavailable" }, { status: 503 }); }
}
