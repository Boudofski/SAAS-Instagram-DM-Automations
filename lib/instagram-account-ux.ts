import { isOwnerAdminIdentity } from "@/lib/admin";
import { formatUserFacingMetaError } from "@/lib/user-facing-errors";
import { formatUsageMetricValue, type UsageSummary } from "@/lib/plan-limits";
import type { ChangeSummary } from "@/lib/dashboard-metrics";

type SnapshotLike = {
  followersCount?: number | null;
  mediaCount?: number | null;
};

type SnapshotComparisonLike = {
  current?: SnapshotLike | null;
  previous?: SnapshotLike | null;
  followerChange?: number | null;
  followerChangePercent?: number | null;
  change?: ChangeSummary;
} | null;

type DashboardMetricsLike = {
  commentsReceived?: number;
  replyRate?: number;
  leadsCaptured?: number;
};

type WebhookHealthLike = {
  lastCommentWebhook?: { createdAt?: Date | string | null } | null;
  subscription?: { error?: string | null } | null;
  lastFailure?: { errorMessage?: string | null; eventType?: string | null } | null;
} | null;

export function canShowProfileSyncDebug(input: {
  clerkId?: string | null;
  email?: string | null;
  connected: boolean;
}) {
  return input.connected && isOwnerAdminIdentity(input);
}

export function formatFollowerGrowthSubtitle(snapshotComparison: SnapshotComparisonLike) {
  const current = snapshotComparison?.current;
  const previous = snapshotComparison?.previous;
  if (typeof current?.followersCount !== "number") return "Sync Instagram profile";
  if (typeof previous?.followersCount !== "number") {
    return "Baseline established. Growth tracking starts after next sync.";
  }

  const change = snapshotComparison?.followerChange ?? current.followersCount - previous.followersCount;
  const percent = snapshotComparison?.followerChangePercent;
  const signedChange = `${change >= 0 ? "+" : ""}${change.toLocaleString()} followers`;
  const signedPercent = typeof percent === "number" ? ` · ${percent >= 0 ? "+" : ""}${percent}%` : "";
  return `${signedChange}${signedPercent} since last snapshot`;
}

export function getWebhookHealthPresentation(health: WebhookHealthLike, now = new Date()) {
  const lastCommentAt = health?.lastCommentWebhook?.createdAt
    ? new Date(health.lastCommentWebhook.createdAt)
    : null;
  const hasRecentComments =
    Boolean(lastCommentAt) &&
    now.getTime() - lastCommentAt!.getTime() <= 24 * 60 * 60 * 1000;
  const safeFailure = formatUserFacingMetaError(
    health?.subscription?.error ?? health?.lastFailure?.errorMessage,
    health?.lastFailure?.eventType
  );
  const hasFailure = safeFailure.severity !== "ok";

  if (hasRecentComments) {
    return {
      webhook: {
        label: "Webhook status",
        value: "Operational",
        detail: "Receiving Instagram comment events",
        ok: true,
      },
      failure: hasFailure
        ? {
            label: "Last failure",
            value: "Previous subscription warning",
            detail: safeFailure.detail,
            ok: true,
          }
        : {
            label: "Last failure",
            value: "No failures",
            detail: undefined,
            ok: true,
          },
    };
  }

  return {
    webhook: {
      label: "Webhook status",
      value: hasFailure ? "Needs review" : "Waiting for comments",
      detail: hasFailure ? safeFailure.detail : "No recent Instagram comment events",
      ok: !hasFailure,
    },
    failure: {
      label: "Last failure",
      value: safeFailure.title,
      detail: safeFailure.detail,
      ok: safeFailure.severity === "ok",
    },
  };
}

export function getDashboardProfileStats(input: {
  snapshotComparison: SnapshotComparisonLike;
  metrics: DashboardMetricsLike | null;
  usage: UsageSummary | null;
}) {
  const snapshot = input.snapshotComparison?.current;
  const neutralChange: ChangeSummary = { label: "—", tone: "neutral", value: null };

  return [
    {
      label: "Followers",
      value: typeof snapshot?.followersCount === "number" ? snapshot.followersCount.toLocaleString() : "Refresh profile",
      change: input.snapshotComparison?.change ?? neutralChange,
      subtitle: formatFollowerGrowthSubtitle(input.snapshotComparison),
    },
    {
      label: "Posts",
      value: typeof snapshot?.mediaCount === "number" ? snapshot.mediaCount.toLocaleString() : "Refresh profile",
      change: neutralChange,
      subtitle: typeof snapshot?.mediaCount === "number" ? "Instagram posts" : "Sync Instagram profile",
    },
    {
      label: "Comments",
      value: input.metrics?.commentsReceived ?? 0,
      change: undefined,
      subtitle: "Received comments",
    },
    {
      label: "Reply Rate",
      value: `${input.metrics?.replyRate ?? 0}%`,
      change: undefined,
      subtitle: "Confirmed replies / matched comments",
    },
    {
      label: "Contacts",
      value: input.metrics?.leadsCaptured ?? 0,
      change: undefined,
      subtitle: "Leads captured",
    },
    {
      label: "Static Replies",
      value: input.usage ? formatUsageMetricValue(input.usage.staticReplies) : "0",
      change: undefined,
      subtitle: "Public replies + AP3k DMs",
    },
  ];
}
