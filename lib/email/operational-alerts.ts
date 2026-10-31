import { client } from "@/lib/prisma";
import { enqueueOwnerAlert, notifyOwnerAlert } from "@/lib/email/owner-alerts";

type DeliveryFailure = {
  automationId: string;
  status: string;
  messageType: string;
  errorMessage?: string | null;
  occurredAt?: Date;
};

type OperationalFailureKind = "authorization" | "quota" | "rate_limit" | "delivery";

const EXPECTED_NON_INCIDENTS = [
  "messaging_window_closed",
  "outside of allowed window",
  "2534022",
  "one_dm_per_user",
  "duplicate",
  "keyword_mismatch",
  "private_dm_disabled",
  "external_dm_tool",
  "backtrack_comment_expired",
];
const recentIncidentChecks = new Map<string, number>();
const LOCAL_DEBOUNCE_MS = 10 * 60 * 1000;

function claimLocalIncident(key: string, now: number) {
  const previous = recentIncidentChecks.get(key);
  if (previous && now - previous < LOCAL_DEBOUNCE_MS) return false;
  recentIncidentChecks.set(key, now);
  if (recentIncidentChecks.size > 5_000) {
    for (const [item, seenAt] of recentIncidentChecks) {
      if (now - seenAt >= LOCAL_DEBOUNCE_MS) recentIncidentChecks.delete(item);
    }
  }
  return true;
}

export function classifyOperationalFailure(input: Pick<DeliveryFailure, "status" | "errorMessage">): OperationalFailureKind | null {
  const error = (input.errorMessage || "").trim().toLowerCase();
  if (!error || input.status === "SENT" || EXPECTED_NON_INCIDENTS.some((value) => error.includes(value))) return null;
  if (error.includes("static_reply_limit_reached") || error.includes("quota") || error.includes("usage_limit")) return "quota";
  if (
    error.includes("dm_access_disabled") ||
    error.includes("token_missing") ||
    error.includes("token_invalid") ||
    error.includes("authorization") ||
    error.includes("oauth") ||
    error.includes("instagram_business_account_missing") ||
    /(^|\D)(190|401)(\D|$)/.test(error)
  ) return "authorization";
  if (error.includes("rate limit") || error.includes("rate_limit") || error.includes("too many requests") || /(^|\D)(429|613)(\D|$)/.test(error)) return "rate_limit";
  return input.status === "FAILED" ? "delivery" : null;
}

function utcBucket(date: Date, hours: number) {
  const size = hours * 60 * 60 * 1000;
  return new Date(Math.floor(date.getTime() / size) * size).toISOString();
}

/**
 * Persist one owner alert per account and incident window. This is deliberately
 * non-throwing: recording a failed Instagram send must never make the webhook fail.
 */
export async function enqueueOperationalDeliveryAlert(input: DeliveryFailure) {
  try {
    const kind = classifyOperationalFailure(input);
    if (!kind) return null;
    const occurredAt = input.occurredAt ?? new Date();
    const localKey = `${input.automationId}:${kind}:${kind === "quota" ? `${occurredAt.getUTCFullYear()}-${occurredAt.getUTCMonth()}` : utcBucket(occurredAt, 6)}`;
    if (!claimLocalIncident(localKey, Date.now())) return null;
    const automation = await client.automation.findUnique({
      where: { id: input.automationId },
      select: {
        id: true,
        name: true,
        userId: true,
        integrationId: true,
        integration: { select: { instagramUsername: true } },
        User: { select: { email: true, firstname: true, lastname: true } },
      },
    });
    if (!automation) return null;

    // Quota incidents are useful once per month. Provider incidents can recur
    // after recovery, but a six-hour bucket prevents a viral post flooding email.
    const incident = kind === "quota"
      ? `${occurredAt.getUTCFullYear()}-${String(occurredAt.getUTCMonth() + 1).padStart(2, "0")}`
      : utcBucket(occurredAt, 6);
    const account = automation.integration?.instagramUsername ? `@${automation.integration.instagramUsername}` : "Instagram account";
    const reason = (input.errorMessage || "unknown delivery error").replace(/\s+/g, " ").slice(0, 240);
    const guidance: Record<OperationalFailureKind, string> = {
      authorization: "The Instagram authorization or message permission needs attention. Reconnect the account and verify Meta permissions.",
      quota: "The account reached its AP3K monthly usage allowance. New matching comments or DMs can be skipped until the allowance resets or changes.",
      rate_limit: "Meta is rate-limiting delivery. AP3K will keep pacing queued work, but the account should be monitored.",
      delivery: "An Instagram automation delivery failed unexpectedly. Review the account and recent delivery logs.",
    };

    return enqueueOwnerAlert({
      kind: "system",
      key: `instagram:${kind}:${automation.integrationId}:${incident}`,
      userId: automation.userId ?? undefined,
      email: automation.User?.email,
      name: automation.User ? [automation.User.firstname, automation.User.lastname].filter(Boolean).join(" ") : undefined,
      occurredAt: occurredAt.toISOString(),
      reference: `${account} · ${automation.name || automation.id}`,
      detail: `${guidance[kind]} Account: ${account}. Automation: ${automation.name || "Untitled automation"}. Channel: ${input.messageType}. Recorded reason: ${reason}`,
    });
  } catch (error) {
    console.warn("[operational-alert] delivery alert could not be queued", {
      automationId: input.automationId,
      errorType: error instanceof Error ? error.constructor.name : "UnknownError",
    });
    return null;
  }
}

export async function notifySchedulerFailure(input: { worker: string; error?: unknown }) {
  const message = input.error instanceof Error ? input.error.message : String(input.error || "Unknown worker error");
  return notifyOwnerAlert({
    kind: "system",
    key: `scheduler:${input.worker}:${utcBucket(new Date(), 1)}`,
    occurredAt: new Date().toISOString(),
    reference: input.worker,
    detail: `The ${input.worker} scheduler failed and returned a retryable error. Review the production queue and deployment logs. Error: ${message.replace(/\s+/g, " ").slice(0, 240)}`,
  }).catch(() => undefined);
}

/** Finds connection incidents that can happen outside a message send, including
 * token health checks and webhook subscription failures. Persistent owner-alert
 * keys make this safe to run from every scheduler cycle. */
export async function scanOperationalIntegrationAlerts() {
  try {
    const integrations = await client.integrations.findMany({
      where: {
        name: "INSTAGRAM",
        OR: [
          { reconnectRequired: true },
          { oauthLastError: { not: null } },
          { webhookSubscriptionError: { not: null } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        userId: true,
        instagramUsername: true,
        reconnectRequired: true,
        oauthLastError: true,
        oauthLastErrorAt: true,
        webhookSubscriptionError: true,
        webhookSubscriptionLastAttemptedAt: true,
        User: { select: { email: true, firstname: true, lastname: true } },
        _count: { select: { automations: { where: { active: true, archivedAt: null } } } },
      },
    });
    let queued = 0;
    for (const integration of integrations) {
      const incidentAt = integration.oauthLastErrorAt ?? integration.webhookSubscriptionLastAttemptedAt;
      const incident = incidentAt?.toISOString() ?? "current-state";
      const account = integration.instagramUsername ? `@${integration.instagramUsername}` : "Instagram account";
      const reason = integration.oauthLastError || integration.webhookSubscriptionError || (integration.reconnectRequired ? "reconnect_required" : "integration_unhealthy");
      const row = await enqueueOwnerAlert({
        kind: "system",
        key: `integration-health:${integration.id}:${incident}`,
        userId: integration.userId ?? undefined,
        email: integration.User?.email,
        name: integration.User ? [integration.User.firstname, integration.User.lastname].filter(Boolean).join(" ") : undefined,
        occurredAt: (incidentAt ?? new Date()).toISOString(),
        reference: account,
        detail: `${account} has an Instagram connection issue. ${integration._count.automations} active automation${integration._count.automations === 1 ? " is" : "s are"} affected. Recorded reason: ${reason.replace(/\s+/g, " ").slice(0, 240)}. Reconnect the account or review its Meta webhook permissions.`,
      });
      if (row) queued++;
    }
    return { scanned: integrations.length, queued };
  } catch (error) {
    console.warn("[operational-alert] integration scan unavailable", {
      errorType: error instanceof Error ? error.constructor.name : "UnknownError",
    });
    return { scanned: 0, queued: 0 };
  }
}
