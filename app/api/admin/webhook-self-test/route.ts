import { requireOwnerAdmin } from "@/lib/admin";
import { createHmac } from "crypto";
import { NextResponse } from "next/server";

export async function POST() {
  await requireOwnerAdmin();

  const appSecret = process.env.META_APP_SECRET;
  const hostUrl =
    process.env.NEXT_PUBLIC_HOST_URL ?? "https://ap3k.com";
  const webhookUrl = `${hostUrl}/api/webhooks/meta`;

  if (!appSecret) {
    return NextResponse.json(
      { ok: false, error: "META_APP_SECRET not configured — cannot sign self-test payload" },
      { status: 500 }
    );
  }

  const payload = JSON.stringify({
    source: "INTERNAL_SELF_TEST",
    object: "page",
    entry: [
      {
        id: "self_test_page",
        changes: [
          {
            field: "comments",
            value: {
              id: "self_test_comment",
              media: { id: "self_test_media" },
              from: { id: "self_test_sender" },
              text: "self_test",
            },
          },
        ],
      },
    ],
  });

  const signature = `sha256=${createHmac("sha256", appSecret)
    .update(payload, "utf8")
    .digest("hex")}`;

  let responseStatus: number;
  let responseBody: unknown;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": signature,
        "User-Agent": "AP3k-webhook-self-test/1.0",
      },
      body: payload,
    });
    responseStatus = res.status;
    responseBody = await res.json().catch(() => null);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        webhookUrl,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: responseStatus === 200,
    webhookUrl,
    responseStatus,
    responseBody,
    sentAt: new Date().toISOString(),
  });
}
