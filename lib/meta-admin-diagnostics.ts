import { client } from "@/lib/prisma";
import { INSTAGRAM_GRAPH_BASE_URL, META_GRAPH_BASE_URL } from "@/lib/fetch";
import axios from "axios";

type SafeMetaError = {
  status?: number;
  message?: string;
  type?: string;
  code?: number;
  subcode?: number;
};

function safeMetaError(error: unknown): SafeMetaError {
  if (axios.isAxiosError(error)) {
    const metaError = error.response?.data?.error;
    return {
      status: error.response?.status,
      message: metaError?.message ?? error.message,
      type: metaError?.type,
      code: metaError?.code,
      subcode: metaError?.error_subcode,
    };
  }

  return {
    message: error instanceof Error ? error.message : String(error),
  };
}

async function readJson<T>(operation: () => Promise<{ status: number; data: T }>) {
  try {
    const response = await operation();
    return { ok: true as const, status: response.status, data: response.data };
  } catch (error) {
    return { ok: false as const, error: safeMetaError(error) };
  }
}

export async function getMetaAdminDiagnostics() {
  const integration = await client.integrations.findFirst({
    where: { instagramId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: {
      instagramId: true,
      webhookAccountId: true,
      instagramUsername: true,
      expiresAt: true,
      webhookSubscriptionLastAttemptedAt: true,
      webhookSubscriptionStatusCode: true,
      webhookSubscriptionSubscribed: true,
      webhookSubscriptionError: true,
      token: true,
      User: { select: { email: true } },
    },
  });

  if (!integration?.instagramId || !integration.token) {
    return {
      connected: false,
      integration: null,
      subscribedAppsActive: false,
      commentsSubscribed: false,
      messagesSubscribed: false,
      tokenValid: false,
      tokenScopes: [] as string[],
      tokenScopesStatus: "missing_token",
      appMode: "unknown",
      lastRealWebhookAt: null as Date | null,
      lastFailureReason: null as string | null,
    };
  }

  const [account, subscriptions, permissions, lastRealWebhook, lastFailure] =
    await Promise.all([
      readJson(() =>
        axios.get(`${INSTAGRAM_GRAPH_BASE_URL}/me`, {
          params: {
            fields: "user_id,username,account_type",
            access_token: integration.token,
          },
        })
      ),
      readJson(() =>
        axios.get(`${META_GRAPH_BASE_URL}/v21.0/${integration.instagramId}/subscribed_apps`, {
          params: { access_token: integration.token },
        })
      ),
      readJson(() =>
        axios.get(`${INSTAGRAM_GRAPH_BASE_URL}/me/permissions`, {
          params: { access_token: integration.token },
        })
      ),
      client.webhookEvent.findFirst({
        where: { igAccountId: integration.instagramId, eventType: "REAL_COMMENT_EVENT" },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      client.webhookEvent.findFirst({
        where: {
          igAccountId: integration.instagramId,
          OR: [
            { status: "FAILED" },
            { errorMessage: { not: null } },
            { eventType: { in: ["SIGNATURE_FAILED", "PAYLOAD_INVALID"] } },
          ],
        },
        orderBy: { createdAt: "desc" },
        select: { errorMessage: true, eventType: true, status: true, createdAt: true },
      }),
    ]);

  const subscribedApps =
    subscriptions.ok && Array.isArray((subscriptions.data as any)?.data)
      ? (subscriptions.data as any).data
      : [];
  const fields = new Set<string>(
    subscribedApps.flatMap((item: any) =>
      Array.isArray(item.subscribed_fields) ? item.subscribed_fields : []
    )
  );

  const tokenScopes =
    permissions.ok && Array.isArray((permissions.data as any)?.data)
      ? (permissions.data as any).data
          .filter((item: any) => item.status === "granted")
          .map((item: any) => item.permission)
          .filter(Boolean)
      : [];

  return {
    connected: true,
    integration: {
      instagramId: integration.instagramId,
      webhookAccountId: integration.webhookAccountId,
      instagramUsername: integration.instagramUsername,
      expiresAt: integration.expiresAt,
      webhookSubscriptionLastAttemptedAt: integration.webhookSubscriptionLastAttemptedAt,
      webhookSubscriptionStatusCode: integration.webhookSubscriptionStatusCode,
      webhookSubscriptionSubscribed: integration.webhookSubscriptionSubscribed,
      webhookSubscriptionError: integration.webhookSubscriptionError,
      userEmail: integration.User?.email,
      account: account.ok ? account.data : null,
    },
    subscribedAppsActive: subscribedApps.length > 0,
    commentsSubscribed: fields.has("comments"),
    messagesSubscribed: fields.has("messages"),
    tokenValid: account.ok,
    tokenScopes,
    tokenScopesStatus: permissions.ok ? "available" : permissions.error.message ?? "unavailable",
    appMode: "unknown",
    appModeNote: "Meta app mode is not exposed by this Instagram token check; verify Dev/Live in Meta Developer Dashboard.",
    subscribedAppsStatus: subscriptions.ok ? "ok" : subscriptions.error.message ?? "failed",
    tokenStatus: account.ok ? "ok" : account.error.message ?? "failed",
    lastRealWebhookAt: lastRealWebhook?.createdAt ?? null,
    lastFailureReason: lastFailure
      ? `${lastFailure.eventType}/${lastFailure.status}: ${lastFailure.errorMessage ?? "no error message"}`
      : null,
  };
}
