import { type DateRange } from "@/lib/dashboard-metrics";
import { type DashboardPeriod } from "@/lib/dashboard-metrics";
import { getInstagramSnapshotComparisonForUser } from "@/lib/instagram-profile-snapshot";
import { getUserFacingMetrics } from "@/lib/user-facing-metrics";

export type AccountStatValue = {
  value: number | string;
  enabled: boolean;
  subtitle: string;
};

export type InstagramAccountSettingsStats = {
  followers: AccountStatValue;
  posts: AccountStatValue;
  comments: AccountStatValue;
  removed: AccountStatValue;
  dmsIn: AccountStatValue;
  dmsOut: AccountStatValue;
  contacts: AccountStatValue;
  replyRate: AccountStatValue;
};

function monthRange(now = new Date()): Required<DateRange> {
  return {
    gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    lt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  };
}

function missingSnapshot(): AccountStatValue {
  return { value: "Refresh needed", enabled: false, subtitle: "Refresh profile to load from Meta" };
}

function unavailableSnapshotField(subtitle: string): AccountStatValue {
  return { value: "Unavailable", enabled: false, subtitle };
}

export async function getInstagramAccountSettingsStats(
  userId: string,
  integrationId?: string,
  range: DateRange = monthRange(),
  period: DashboardPeriod = "month"
): Promise<InstagramAccountSettingsStats> {
  const [metrics, snapshotComparison] = await Promise.all([
    getUserFacingMetrics(userId, range),
    getInstagramSnapshotComparisonForUser(userId, integrationId, period),
  ]);
  const snapshot = snapshotComparison?.current;
  const followerSubtitle =
    snapshotComparison?.followerChange !== null && snapshotComparison?.followerChange !== undefined
      ? `${snapshotComparison.followerChange >= 0 ? "+" : ""}${snapshotComparison.followerChange.toLocaleString()} followers${
          typeof snapshotComparison.followerChangePercent === "number"
            ? ` · ${snapshotComparison.followerChangePercent >= 0 ? "+" : ""}${snapshotComparison.followerChangePercent}%`
            : ""
        } since last snapshot`
      : "Baseline established. Growth tracking starts after next sync.";

  return {
    followers:
      typeof snapshot?.followersCount === "number"
        ? { value: snapshot.followersCount, enabled: true, subtitle: followerSubtitle }
        : snapshot
          ? unavailableSnapshotField("Meta does not expose follower count for this connection.")
          : missingSnapshot(),
    posts:
      typeof snapshot?.mediaCount === "number"
        ? { value: snapshot.mediaCount, enabled: true, subtitle: "Instagram posts" }
        : snapshot
          ? unavailableSnapshotField("Meta did not return media count")
          : missingSnapshot(),
    comments: { value: metrics.commentsReceived, enabled: true, subtitle: "Real external comments this period" },
    removed: { value: "Not tracked", enabled: false, subtitle: "Removed comments are not tracked in account stats" },
    dmsIn: { value: "Messaging approval required", enabled: false, subtitle: "Inbound DMs require Meta messaging approval" },
    dmsOut: { value: metrics.dmsSent, enabled: true, subtitle: "AP3k private DMs sent" },
    contacts: { value: metrics.leadsCaptured, enabled: true, subtitle: "Leads captured this period" },
    replyRate: { value: `${metrics.replyRate}%`, enabled: true, subtitle: "Confirmed replies / matched comments" },
  };
}
