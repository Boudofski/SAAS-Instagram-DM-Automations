import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { client } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KEEPALIVE_SCHEDULE = "17 4 * * *";

function isAuthorizedCronRequest(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");

  // Preferred production protection. Vercel automatically sends this bearer
  // token when CRON_SECRET is configured in the project environment.
  if (cronSecret) {
    return authorization === `Bearer ${cronSecret}`;
  }

  // Safe fallback for this non-sensitive endpoint until CRON_SECRET is added.
  // The route only performs SELECT 1 and never returns database contents.
  return request.headers.get("x-vercel-cron-schedule") === KEEPALIVE_SCHEDULE;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  const startedAt = Date.now();

  try {
    await client.$queryRaw`SELECT 1`;

    const durationMs = Date.now() - startedAt;
    console.info("[cron] database keepalive succeeded", { durationMs });

    return NextResponse.json(
      {
        ok: true,
        checkedAt: new Date().toISOString(),
        durationMs,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("[cron] database keepalive failed", {
      message: error instanceof Error ? error.message : "Unknown database error",
    });

    return NextResponse.json(
      { ok: false, error: "Database keepalive failed" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
