import { client } from "@/lib/prisma";
import { getMetaTokenHealth } from "@/lib/meta-auth-diagnostics";

export async function getMetaAdminDiagnostics() {
  const integration = await client.integrations.findFirst({
    where: { pageId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: {
      instagramId: true,
      webhookAccountId: true,
      pageId: true,
      businessId: true,
      instagramUsername: true,
      expiresAt: true,
      webhookSubscriptionLastAttemptedAt: true,
      webhookSubscriptionStatusCode: true,
      webhookSubscriptionSubscribed: true,
      webhookSubscriptionError: true,
      oauthLastError: true,
      oauthLastErrorAt: true,
      oauthLastErrorSource: true,
      token: true,
      User: { select: { email: true } },
    },
  });

  const tokenHealth = await getMetaTokenHealth({
    pageAccessToken: integration?.token,
    pageId: integration?.pageId,
    instagramBusinessAccountId: integration?.instagramId,
  });

  if (!integration?.pageId || !integration.token) {
    return {
      connected: false,
      integration: null,
      subscribedAppsActive: false,
      commentsSubscribed: false,
      messagesSubscribed: false,
      tokenValid: false,
      tokenScopes: [] as string[],
      tokenScopesStatus: "missing_page_token",
      tokenHealth,
      appMode: "unknown",
      appModeNote: "App mode and tester roles must be verified in Meta Developer Dashboard; Meta does not expose them through this page token health check.",
      subscribedAppsStatus: tokenHealth.subscribedAppsStatus ?? "unknown",
      tokenStatus: tokenHealth.graphValidationResult,
      lastRealWebhookAt: null as Date | null,
      lastFailureReason: null as string | null,
      last24h: {
        simulatedEvents: 0,
        realMetaEvents: 0,
        failedSignatures: 0,
        ignoredPayloads: 0,
        keywordMatched: 0,
        dmSent: 0,
        dmFailed: 0,
      },
    };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [
    lastRealWebhook,
    lastFailure,
    simulatedEvents,
    realMetaEvents,
    failedSignatures,
    ignoredPayloads,
    keywordMatched,
    dmSent,
    dmFailed,
  ] = await Promise.all([
    client.webhookEvent.findFirst({
      where: { igAccountId: integration.pageId, eventSource: "META_REAL" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    client.webhookEvent.findFirst({
      where: {
        igAccountId: integration.pageId,
        OR: [
          { status: "FAILED" },
          { errorMessage: { not: null } },
          { eventType: { in: ["SIGNATURE_FAILED", "PAYLOAD_INVALID"] } },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: { errorMessage: true, eventType: true, status: true, createdAt: true },
    }),
    client.webhookEvent.count({
      where: { eventSource: "SIMULATED_INTERNAL", createdAt: { gte: since } },
    }),
    client.webhookEvent.count({
      where: { eventSource: "META_REAL", createdAt: { gte: since } },
    }),
    client.webhookEvent.count({
      where: { eventType: "SIGNATURE_FAILED", createdAt: { gte: since } },
    }),
    client.webhookEvent.count({
      where: { status: "IGNORED", createdAt: { gte: since } },
    }),
    client.automationEvent.count({
      where: { eventType: "KEYWORD_MATCHED", createdAt: { gte: since } },
    }),
    client.messageLog.count({
      where: { messageType: "DM", status: "SENT", createdAt: { gte: since } },
    }),
    client.messageLog.count({
      where: { messageType: "DM", status: "FAILED", createdAt: { gte: since } },
    }),
  ]);

  return {
    connected: true,
    integration: {
      instagramId: integration.instagramId,
      webhookAccountId: integration.webhookAccountId,
      pageId: integration.pageId,
      businessId: integration.businessId,
      instagramUsername: integration.instagramUsername,
      expiresAt: integration.expiresAt,
      webhookSubscriptionLastAttemptedAt: integration.webhookSubscriptionLastAttemptedAt,
      webhookSubscriptionStatusCode: integration.webhookSubscriptionStatusCode,
      webhookSubscriptionSubscribed: integration.webhookSubscriptionSubscribed,
      webhookSubscriptionError: integration.webhookSubscriptionError,
      oauthLastError: integration.oauthLastError,
      oauthLastErrorAt: integration.oauthLastErrorAt,
      oauthLastErrorSource: integration.oauthLastErrorSource,
      userEmail: integration.User?.email,
      account: tokenHealth.linkedInstagramBusinessAccount,
    },
    subscribedAppsActive: tokenHealth.subscribedAppsActive,
    commentsSubscribed: tokenHealth.commentsSubscribed,
    messagesSubscribed: tokenHealth.messagesSubscribed,
    tokenValid: tokenHealth.tokenValid,
    tokenScopes: tokenHealth.tokenScopes,
    tokenScopesStatus: tokenHealth.requiredScopesPresent
      ? "available"
      : `missing ${tokenHealth.missingScopes.join(", ")}`,
    tokenHealth,
    appMode: "unknown",
    appModeNote: "App mode and tester roles must be verified in Meta Developer Dashboard; Meta does not expose them through this page token health check.",
    subscribedAppsStatus: tokenHealth.subscribedAppsStatus ?? "unknown",
    tokenStatus: tokenHealth.graphValidationResult,
    lastRealWebhookAt: lastRealWebhook?.createdAt ?? null,
    lastFailureReason: lastFailure
      ? `${lastFailure.eventType}/${lastFailure.status}: ${lastFailure.errorMessage ?? "no error message"}`
      : null,
    last24h: {
      simulatedEvents,
      realMetaEvents,
      failedSignatures,
      ignoredPayloads,
      keywordMatched,
      dmSent,
      dmFailed,
    },
  };
}
