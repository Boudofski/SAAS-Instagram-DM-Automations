import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/webhooks/meta",
    hasMetaVerifyToken: Boolean(process.env.META_VERIFY_TOKEN),
    hasMetaAppSecret: Boolean(process.env.META_APP_SECRET),
    timestamp: new Date().toISOString(),
  });
}
