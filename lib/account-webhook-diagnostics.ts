export const REAL_ACCOUNT_COMMENT_TYPES = [
  "REAL_COMMENT_EVENT",
  "COMMENT_WEBHOOK_RECEIVED",
] as const;

export const REAL_ACCOUNT_MESSAGING_TYPES = [
  "REAL_MESSAGE_EVENT",
  "MESSAGE_WEBHOOK_RECEIVED",
] as const;

export const RAW_ACCOUNT_WEBHOOK_TYPES = [
  "WEBHOOK_POST_RECEIVED_RAW",
] as const;

export type AccountWebhookStatus =
  | "comments_active"
  | "only_messaging_active"
  | "no_delivery"
  | "test_only"
  | "parser_failed";

export type AccountWebhookEventLike = {
  eventType: string;
  eventSource?: string | null;
  field?: string | null;
  igAccountId?: string | null;
  mediaId?: string | null;
  commentId?: string | null;
  errorMessage?: string | null;
  payload?: unknown;
  createdAt?: Date | string | null;
};

export type IntegrationLike = {
  id: string;
  userId?: string | null;
  instagramId?: string | null;
  instagramUsername?: string | null;
  webhookAccountId?: string | null;
  pageId?: string | null;
  businessId?: string | null;
  createdAt?: Date | string | null;
  webhookSubscriptionLastAttemptedAt?: Date | string | null;
  lastAdminActionAt?: Date | string | null;
  status?: string | null;
};

export type CampaignLike = {
  id: string;
  name?: string | null;
  userId?: string | null;
  createdAt?: Date | string | null;
  active?: boolean | null;
  posts?: { postid?: string | null }[];
  User?: { integrations?: IntegrationLike[] | null } | null;
};

export function accountIdsForIntegration(integration?: IntegrationLike | null) {
  return Array.from(new Set([
    integration?.instagramId,
    integration?.webhookAccountId,
    integration?.pageId,
    integration?.businessId,
  ].filter((value): value is string => Boolean(value))));
}

export function isMetaSampleEntryZero(event: AccountWebhookEventLike) {
  const payload = asRecord(event.payload);
  const entryId = String(payload?.entryId ?? payload?.firstEntryId ?? event.igAccountId ?? "");
  return entryId === "0";
}

export function isRealCommentEvent(event: AccountWebhookEventLike) {
  if (event.eventSource && event.eventSource !== "META_REAL") return false;
  if (isMetaSampleEntryZero(event)) return false;
  return REAL_ACCOUNT_COMMENT_TYPES.includes(event.eventType as any);
}

export function isMessagingEvent(event: AccountWebhookEventLike) {
  if (event.eventSource && event.eventSource !== "META_REAL") return false;
  if (event.field === "messaging") return true;
  return REAL_ACCOUNT_MESSAGING_TYPES.includes(event.eventType as any);
}

export function classifyAccountWebhookDelivery(input: {
  events: AccountWebhookEventLike[];
  integration?: IntegrationLike | null;
  now?: Date;
  windowHours?: number;
}): {
  status: AccountWebhookStatus;
  label: string;
  detail: string;
  lastRawWebhook?: AccountWebhookEventLike | null;
  lastMessagingWebhook?: AccountWebhookEventLike | null;
  lastCommentWebhook?: AccountWebhookEventLike | null;
  lastParserFailure?: AccountWebhookEventLike | null;
} {
  const now = input.now ?? new Date();
  const since = now.getTime() - (input.windowHours ?? 24) * 60 * 60 * 1000;
  const accountIds = accountIdsForIntegration(input.integration);
  const relevant = input.events
    .filter((event) => isEventForAccount(event, accountIds))
    .filter((event) => {
      const time = toTime(event.createdAt);
      return !time || time >= since;
    })
    .sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt));

  const lastCommentWebhook = relevant.find(isRealCommentEvent) ?? null;
  const lastMessagingWebhook = relevant.find(isMessagingEvent) ?? null;
  const lastRawWebhook = relevant.find((event) =>
    RAW_ACCOUNT_WEBHOOK_TYPES.includes(event.eventType as any) && !isMetaSampleEntryZero(event)
  ) ?? null;
  const testOnly = relevant.some(isMetaSampleEntryZero) && !lastRawWebhook && !lastMessagingWebhook && !lastCommentWebhook;
  const lastParserFailure = relevant.find((event) =>
    event.eventType === "COMMENT_PARSE_FAILED" ||
    (event.field === "comments" && event.errorMessage?.includes("missing_required_comment_fields"))
  ) ?? null;

  if (lastCommentWebhook) {
    return {
      status: "comments_active",
      label: "Comments active",
      detail: "Real comment webhook received for this Instagram account in the last 24h.",
      lastRawWebhook,
      lastMessagingWebhook,
      lastCommentWebhook,
      lastParserFailure,
    };
  }

  if (lastParserFailure) {
    return {
      status: "parser_failed",
      label: "Parser failed",
      detail: "A comment-like payload arrived but AP3k could not extract required comment fields.",
      lastRawWebhook,
      lastMessagingWebhook,
      lastCommentWebhook,
      lastParserFailure,
    };
  }

  if (lastMessagingWebhook) {
    return {
      status: "only_messaging_active",
      label: "Only messaging active",
      detail: "Messaging webhooks are arriving, but no real comment webhook has arrived for this Instagram account in the last 24h.",
      lastRawWebhook,
      lastMessagingWebhook,
      lastCommentWebhook,
      lastParserFailure,
    };
  }

  if (testOnly) {
    return {
      status: "test_only",
      label: "Test-only",
      detail: "Only Meta sample payloads with entryId=0 were seen; those do not prove real comment delivery.",
      lastRawWebhook,
      lastMessagingWebhook,
      lastCommentWebhook,
      lastParserFailure,
    };
  }

  return {
    status: "no_delivery",
    label: "No delivery",
    detail: accountIds.length
      ? "No raw, messaging, or comment webhooks were received for this Instagram ID in the last 24h."
      : "No connected Instagram account IDs are available for account-specific webhook matching.",
    lastRawWebhook,
    lastMessagingWebhook,
    lastCommentWebhook,
    lastParserFailure,
  };
}

export function buildCampaignBindingDiagnostics(input: {
  integration?: IntegrationLike | null;
  campaigns: CampaignLike[];
  knownMediaOwners?: Record<string, { integrationId?: string | null; userId?: string | null; instagramId?: string | null }>;
}) {
  const reconnectTime = latestDate([
    input.integration?.lastAdminActionAt,
    input.integration?.webhookSubscriptionLastAttemptedAt,
    input.integration?.createdAt,
  ]);

  return input.campaigns.map((campaign) => {
    const postId = campaign.posts?.[0]?.postid ?? null;
    const owner = postId ? input.knownMediaOwners?.[postId] : undefined;
    const warnings: string[] = [];

    if (postId && postId !== "ANY" && owner) {
      if (owner.integrationId && owner.integrationId !== input.integration?.id) {
        warnings.push("Campaign post belongs to a different integration.");
      }
      if (owner.userId && owner.userId !== input.integration?.userId) {
        warnings.push("Campaign post belongs to a different user.");
      }
      if (owner.instagramId && owner.instagramId !== input.integration?.instagramId) {
        warnings.push("Campaign post belongs to a different Instagram account.");
      }
    }

    const campaignCreatedAt = toTime(campaign.createdAt);
    if (postId && postId !== "ANY" && reconnectTime && campaignCreatedAt && campaignCreatedAt < reconnectTime.getTime()) {
      warnings.push("Campaign was created before the current reconnect/subscription refresh.");
    }

    if (postId && postId !== "ANY" && !owner) {
      warnings.push("Post ownership unknown — recreate campaign after reconnect.");
    }

    return {
      campaignId: campaign.id,
      campaignName: campaign.name ?? "Untitled campaign",
      active: Boolean(campaign.active),
      postId,
      reconnectTime,
      owner: owner ?? null,
      warnings,
      stale: warnings.length > 0,
    };
  });
}

export function planReconnectCleanup(input: {
  current: IntegrationLike;
  integrations: IntegrationLike[];
  campaigns: CampaignLike[];
}) {
  const staleIntegrations = input.integrations.filter((integration) =>
    integration.id !== input.current.id &&
    integration.status !== "DISCONNECTED" &&
    (
      integration.instagramId !== input.current.instagramId ||
      integration.instagramUsername !== input.current.instagramUsername
    )
  );
  const staleIntegrationIds = new Set(staleIntegrations.map((integration) => integration.id));
  const campaignsNeedingRecreation = input.campaigns.filter((campaign) =>
    campaign.User?.integrations?.some((integration) => staleIntegrationIds.has(integration.id))
  );

  return {
    staleIntegrations,
    staleIntegrationIds: Array.from(staleIntegrationIds),
    campaignsNeedingRecreation,
    shouldPauseCampaignIds: campaignsNeedingRecreation
      .filter((campaign) => campaign.active)
      .map((campaign) => campaign.id),
  };
}

export function dashboardNoCommentDiagnosis(input: {
  username?: string | null;
  status: AccountWebhookStatus;
}) {
  if (input.status !== "only_messaging_active") return null;
  const username = input.username ? `@${input.username}` : "this Instagram account";
  return {
    title: `No comment webhooks received for ${username} yet.`,
    detail: "Messaging webhooks are arriving, so AP3k is connected, but comment delivery is not active.",
  };
}

export function compareIntegrationDelivery(input: {
  working: { integration: IntegrationLike; events: AccountWebhookEventLike[]; campaigns: CampaignLike[] };
  failing: { integration: IntegrationLike; events: AccountWebhookEventLike[]; campaigns: CampaignLike[] };
  now?: Date;
}) {
  const workingStatus = classifyAccountWebhookDelivery({
    integration: input.working.integration,
    events: input.working.events,
    now: input.now,
  });
  const failingStatus = classifyAccountWebhookDelivery({
    integration: input.failing.integration,
    events: input.failing.events,
    now: input.now,
  });

  return {
    working: {
      integration: input.working.integration,
      status: workingStatus.status,
      label: workingStatus.label,
      activeCampaigns: input.working.campaigns.filter((campaign) => campaign.active).length,
      selectedMediaIds: selectedMediaIds(input.working.campaigns),
    },
    failing: {
      integration: input.failing.integration,
      status: failingStatus.status,
      label: failingStatus.label,
      activeCampaigns: input.failing.campaigns.filter((campaign) => campaign.active).length,
      selectedMediaIds: selectedMediaIds(input.failing.campaigns),
    },
  };
}

function selectedMediaIds(campaigns: CampaignLike[]) {
  return campaigns
    .flatMap((campaign) => campaign.posts ?? [])
    .map((post) => post.postid)
    .filter((value): value is string => Boolean(value));
}

function isEventForAccount(event: AccountWebhookEventLike, accountIds: string[]) {
  if (!accountIds.length) return true;
  const payload = asRecord(event.payload);
  const payloadIds = [
    payload?.entryId,
    payload?.firstEntryId,
    payload?.igAccountId,
    payload?.valueIgAccountId,
  ].filter(Boolean).map(String);
  return [event.igAccountId, ...payloadIds].some((value) => value && accountIds.includes(value));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toTime(value?: Date | string | null) {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function latestDate(values: Array<Date | string | null | undefined>) {
  const times = values.map(toTime).filter(Boolean);
  if (!times.length) return null;
  return new Date(Math.max(...times));
}
