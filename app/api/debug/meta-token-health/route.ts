import { requireOwnerAdmin } from "@/lib/admin";
import { getMetaTokenHealth } from "@/lib/meta-auth-diagnostics";
import { client } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  await requireOwnerAdmin();

  const integration = await client.integrations.findFirst({
    where: { instagramId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      instagramId: true,
      instagramUsername: true,
      webhookAccountId: true,
      token: true,
      webhookSubscriptionSubscribed: true,
      webhookSubscriptionStatusCode: true,
      webhookSubscriptionError: true,
      webhookSubscriptionLastAttemptedAt: true,
      User: { select: { email: true } },
    },
  });

  const health = await getMetaTokenHealth({
    accessToken: integration?.token,
    instagramId: integration?.instagramId,
  });

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    integration: integration
      ? {
          id: integration.id,
          instagramId: integration.instagramId,
          webhookAccountId: integration.webhookAccountId,
          instagramUsername: integration.instagramUsername,
          userEmail: integration.User?.email,
          webhookSubscriptionSubscribed: integration.webhookSubscriptionSubscribed,
          webhookSubscriptionStatusCode: integration.webhookSubscriptionStatusCode,
          webhookSubscriptionError: integration.webhookSubscriptionError,
          webhookSubscriptionLastAttemptedAt: integration.webhookSubscriptionLastAttemptedAt,
        }
      : null,
    health,
  });
}
