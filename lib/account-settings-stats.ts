import { type DateRange } from "@/lib/dashboard-metrics";
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

function unavailable(subtitle: string): AccountStatValue {
  return { value: "Not enabled", enabled: false, subtitle };
}

export async function getInstagramAccountSettingsStats(
  userId: string,
  _integrationId?: string,
  range: DateRange = monthRange()
): Promise<InstagramAccountSettingsStats> {
  const metrics = await getUserFacingMetrics(userId, range);

  return {
    followers: unavailable("Follower snapshots coming soon"),
    posts: unavailable("Media sync coming soon"),
    comments: { value: metrics.commentsReceived, enabled: true, subtitle: "Real external comments this period" },
    removed: unavailable("Moderation not enabled"),
    dmsIn: unavailable("DM webhooks require messaging approval"),
    dmsOut: { value: metrics.dmsSent, enabled: true, subtitle: "AP3k private DMs sent" },
    contacts: { value: metrics.leadsCaptured, enabled: true, subtitle: "Leads captured this period" },
    replyRate: { value: `${metrics.replyRate}%`, enabled: true, subtitle: "Confirmed replies / matched comments" },
  };
}
