import { client } from "@/lib/prisma";
import { formatReplyRate, MATCHED_EVENT_TYPES, REAL_COMMENT_WEBHOOK_TYPES, type DateRange } from "@/lib/dashboard-metrics";

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

function createdAtRange(range: DateRange) {
  return {
    createdAt: {
      ...(range.gte ? { gte: range.gte } : {}),
      ...(range.lt ? { lt: range.lt } : {}),
    },
  };
}

function unavailable(subtitle: string): AccountStatValue {
  return { value: "Not enabled", enabled: false, subtitle };
}

export async function getInstagramAccountSettingsStats(
  userId: string,
  integrationId?: string,
  range: DateRange = monthRange()
): Promise<InstagramAccountSettingsStats> {
  const integration = integrationId
    ? await client.integrations.findFirst({
        where: { id: integrationId, userId },
        select: { pageId: true, instagramId: true, webhookAccountId: true },
      })
    : null;

  const accountIds = [
    integration?.pageId,
    integration?.instagramId,
    integration?.webhookAccountId,
  ].filter(Boolean) as string[];

  const webhookScope =
    integrationId && accountIds.length > 0
      ? {
          OR: [
            { igAccountId: { in: accountIds } },
            { automation: { userId } },
          ],
        }
      : { automation: { userId } };

  const byUserAutomation = {
    automation: { userId },
    ...createdAtRange(range),
  };

  const [comments, matched, publicReplyLogs, publicReplyEvents, dmsOut, contacts] = await Promise.all([
    client.webhookEvent.count({
      where: {
        ...webhookScope,
        eventType: { in: [...REAL_COMMENT_WEBHOOK_TYPES] },
        ...createdAtRange(range),
      },
    }),
    client.automationEvent.count({
      where: {
        ...byUserAutomation,
        eventType: { in: [...MATCHED_EVENT_TYPES] },
      },
    }),
    client.messageLog.count({
      where: {
        ...byUserAutomation,
        messageType: "COMMENT_REPLY",
        status: "SENT",
      },
    }),
    client.automationEvent.count({
      where: {
        ...byUserAutomation,
        eventType: "PUBLIC_REPLY_SENT",
      },
    }),
    client.messageLog.count({
      where: {
        ...byUserAutomation,
        messageType: "DM",
        status: "SENT",
      },
    }),
    client.lead.count({
      where: {
        automation: { userId },
        ...createdAtRange(range),
      },
    }),
  ]);

  const publicRepliesSent = publicReplyLogs + (publicReplyLogs > 0 ? 0 : publicReplyEvents);
  // Reply rate is based on successful outbound replies divided by matched comments.
  const replyRate = formatReplyRate(matched, publicRepliesSent + dmsOut);

  return {
    followers: unavailable("Follower snapshots coming soon"),
    posts: unavailable("Media sync coming soon"),
    comments: { value: comments, enabled: true, subtitle: "Real comment webhooks this month" },
    removed: unavailable("Moderation not enabled"),
    dmsIn: unavailable("DM inbox pending approval"),
    dmsOut: { value: dmsOut, enabled: true, subtitle: "Private DMs sent this month" },
    contacts: { value: contacts, enabled: true, subtitle: "Leads captured this month" },
    replyRate: { value: `${replyRate}%`, enabled: true, subtitle: "Sent replies / matched comments" },
  };
}
