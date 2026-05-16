import { NextResponse } from "next/server";

export async function GET() {
  const hostUrl = process.env.NEXT_PUBLIC_HOST_URL ?? "https://ap3k.com";
  return NextResponse.json({
    ok: true,
    route: "/api/webhooks/meta",
    webhookUrl: `${hostUrl}/api/webhooks/meta`,
    hasMetaVerifyToken: Boolean(process.env.META_VERIFY_TOKEN),
    hasMetaAppSecret: Boolean(process.env.META_APP_SECRET),
    timestamp: new Date().toISOString(),
  });
}
