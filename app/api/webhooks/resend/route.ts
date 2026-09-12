import { NextResponse } from "next/server";
import { Resend } from "resend";
import { client } from "@/lib/prisma";
import { getEmailConfiguration } from "@/lib/email/delivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const statusForEvent = {
  "email.sent": "SENT",
  "email.delivered": "DELIVERED",
  "email.opened": "OPENED",
  "email.clicked": "CLICKED",
  "email.bounced": "BOUNCED",
  "email.complained": "COMPLAINED",
  "email.suppressed": "SUPPRESSED",
  "email.failed": "FAILED",
} as const;

export async function POST(request: Request) {
  const configuration = getEmailConfiguration();
  if (!configuration.apiKey || !configuration.webhookSecret) {
    return NextResponse.json({ error: "email_webhook_not_configured" }, { status: 503 });
  }

  const payload = await request.text();
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  if (!id || !timestamp || !signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  try {
    const event = new Resend(configuration.apiKey).webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret: configuration.webhookSecret,
    });
    const status = statusForEvent[event.type as keyof typeof statusForEvent];
    if (!status || !("email_id" in event.data)) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const occurredAt = new Date(event.created_at);
    await client.emailDelivery.updateMany({
      where: { providerMessageId: event.data.email_id },
      data: {
        status,
        ...(status === "DELIVERED" ? { deliveredAt: occurredAt } : {}),
        ...(status === "OPENED" ? { openedAt: occurredAt } : {}),
        ...(status === "CLICKED" ? { clickedAt: occurredAt } : {}),
        ...(["BOUNCED", "COMPLAINED", "SUPPRESSED", "FAILED"].includes(status)
          ? { errorCode: event.type, errorMessage: `Resend reported ${event.type}.` }
          : {}),
      },
    });
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }
}
