// lib/admin-v2/queries.ts
// ALL queries in this file are read-only. NEVER select the `token` field from Integrations.
import { client } from "@/lib/prisma";

const LIST_LIMIT = 50;
const ACTIVITY_LIMIT = 100;

export type AdminV2Stats = {
  totalUsers: number;
  connectedAccounts: number;
  activeCampaigns: number;
  repliesToday: number;
  leadsToday: number;
  failedToday: number;
};

export type AdminV2User = {
  id: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  status: string;
  createdAt: Date;
  plan: string;
  instagramUsername: string | null;
  integrationStatus: string | null;
  automationCount: number;
  repliesToday: number;
  leadsToday: number;
  lastActivity: Date | null;
};

export type AdminV2Account = {
  id: string;
  instagramUsername: string | null;
  pageName: string | null;
  status: string;
  reconnectRequired: boolean;
  expiresAt: Date | null;
  webhookSubscriptionMode: string | null;
  oauthLastError: string | null;
  ownerEmail: string | null;
  createdAt: Date;
  // Raw Meta IDs — included for Advanced panel only, never shown by default
  instagramId: string | null;
  pageId: string | null;
  businessId: string | null;
};

export type AdminV2Campaign = {
  id: string;
  name: string;
  active: boolean;
  needsReview: boolean;
  reviewReason: string | null;
  archivedAt: Date | null;
  triggerMode: string;
  matchingMode: string;
  createdAt: Date;
  ownerEmail: string | null;
  keywords: string[];
  postScope: string;
  hasPublicReply: boolean;
  replyCount: number;
  leadCount: number;
  lastActivity: Date | null;
};

export type AdminV2SystemHealth = {
  attentionAccounts: number;
  campaignsNeedingReview: number;
};

export type AdminV2ReplyTemplate = {
  campaignId: string;
  campaignName: string;
  ownerEmail: string | null;
  reply1: string | null;
  reply2: string | null;
  reply3: string | null;
  active: boolean;
};

export type AdminV2ActivityEvent = {
  id: string;
  eventType: string;
  keyword: string | null;
  createdAt: Date;
  campaignName: string | null;
  ownerEmail: string | null;
};

export type AdminV2WebhookEvent = {
  id: string;
  eventType: string;
  eventSource: string;
  status: string;
  errorMessage: string | null;
  field: string | null;
  createdAt: Date;
  campaignName: string | null;
};

export async function getAdminV2Stats(): Promise<AdminV2Stats> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    connectedAccounts,
    activeCampaigns,
    repliesToday,
    leadsToday,
    failedToday,
  ] = await Promise.all([
    client.user.count(),
    client.integrations.count({ where: { status: "CONNECTED" } }),
    client.automation.count({ where: { active: true, archivedAt: null } }),
    client.messageLog.count({
      where: { messageType: "COMMENT_REPLY", status: "SENT", createdAt: { gte: startOfDay } },
    }),
    client.lead.count({ where: { createdAt: { gte: startOfDay } } }),
    client.messageLog.count({ where: { status: "FAILED", createdAt: { gte: startOfDay } } }),
  ]);

  return { totalUsers, connectedAccounts, activeCampaigns, repliesToday, leadsToday, failedToday };
}

// 2 parallelized count queries — runs in parallel with getAdminV2Stats on the overview page.
export async function getAdminV2SystemHealth(): Promise<AdminV2SystemHealth> {
  const now = new Date();
  const [attentionAccounts, campaignsNeedingReview] = await Promise.all([
    client.integrations.count({
      where: {
        OR: [
          { status: "DISCONNECTED" },
          { reconnectRequired: true },
          { expiresAt: { lt: now } },
        ],
      },
    }),
    client.automation.count({
      where: { needsReview: true, archivedAt: null },
    }),
  ]);
  return { attentionAccounts, campaignsNeedingReview };
}

// 1 query with nested selects — replies/leads/lastActivity computed in JS, no N+1.
export async function getAdminV2Users(page = 0): Promise<AdminV2User[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const rows = await client.user.findMany({
    take: LIST_LIMIT,
    skip: page * LIST_LIMIT,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      firstname: true,
      lastname: true,
      status: true,
      createdAt: true,
      subscription: { select: { plan: true } },
      integrations: {
        select: { instagramUsername: true, status: true },
        where: { status: "CONNECTED" },
        take: 1,
      },
      _count: { select: { automations: true } },
      automations: {
        select: {
          messageLogs: {
            where: { messageType: "COMMENT_REPLY", status: "SENT", createdAt: { gte: startOfDay } },
            select: { id: true },
          },
          leads: {
            where: { createdAt: { gte: startOfDay } },
            select: { id: true },
          },
          events: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
        },
      },
    },
  });

  return rows.map((u) => {
    const repliesToday = u.automations.reduce((sum, a) => sum + a.messageLogs.length, 0);
    const leadsToday = u.automations.reduce((sum, a) => sum + a.leads.length, 0);
    const lastActivity =
      u.automations
        .flatMap((a) => a.events.map((e) => e.createdAt))
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    return {
      id: u.id,
      email: u.email,
      firstname: u.firstname,
      lastname: u.lastname,
      status: u.status,
      createdAt: u.createdAt,
      plan: u.subscription?.plan ?? "FREE",
      instagramUsername: u.integrations[0]?.instagramUsername ?? null,
      integrationStatus: u.integrations[0]?.status ?? null,
      automationCount: u._count.automations,
      repliesToday,
      leadsToday,
      lastActivity,
    };
  });
}

export async function getAdminV2UserCount(): Promise<number> {
  return client.user.count();
}

// SECURITY: token field is intentionally NOT selected here or anywhere in admin-v2.
export async function getAdminV2Accounts(page = 0): Promise<AdminV2Account[]> {
  const rows = await client.integrations.findMany({
    take: LIST_LIMIT,
    skip: page * LIST_LIMIT,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      instagramUsername: true,
      pageName: true,
      status: true,
      reconnectRequired: true,
      expiresAt: true,
      webhookSubscriptionMode: true,
      oauthLastError: true,
      createdAt: true,
      instagramId: true,
      pageId: true,
      businessId: true,
      User: { select: { email: true } },
      // token is NEVER selected
    },
  });

  return rows.map((a) => ({
    id: a.id,
    instagramUsername: a.instagramUsername,
    pageName: a.pageName,
    status: a.status,
    reconnectRequired: a.reconnectRequired,
    expiresAt: a.expiresAt,
    webhookSubscriptionMode: a.webhookSubscriptionMode,
    oauthLastError: a.oauthLastError,
    ownerEmail: a.User?.email ?? null,
    createdAt: a.createdAt,
    instagramId: a.instagramId,
    pageId: a.pageId,
    businessId: a.businessId,
  }));
}

export async function getAdminV2AccountCount(): Promise<number> {
  return client.integrations.count();
}

// 1 query with nested events for lastActivity — no N+1.
export async function getAdminV2Campaigns(page = 0): Promise<AdminV2Campaign[]> {
  const rows = await client.automation.findMany({
    take: LIST_LIMIT,
    skip: page * LIST_LIMIT,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      active: true,
      needsReview: true,
      reviewReason: true,
      archivedAt: true,
      triggerMode: true,
      matchingMode: true,
      createdAt: true,
      User: { select: { email: true } },
      keywords: { select: { word: true }, take: 3 },
      posts: { select: { postid: true }, take: 1 },
      listener: { select: { commentReply: true } },
      _count: { select: { messageLogs: true, leads: true } },
      events: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    active: c.active,
    needsReview: c.needsReview,
    reviewReason: c.reviewReason,
    archivedAt: c.archivedAt,
    triggerMode: c.triggerMode,
    matchingMode: c.matchingMode,
    createdAt: c.createdAt,
    ownerEmail: c.User?.email ?? null,
    keywords: c.keywords.map((k) => k.word),
    postScope: c.posts[0]?.postid === "ANY" ? "Any post" : c.posts[0]?.postid ? "Specific post" : "No post",
    hasPublicReply: Boolean(c.listener?.commentReply),
    replyCount: c._count.messageLogs,
    leadCount: c._count.leads,
    lastActivity: c.events[0]?.createdAt ?? null,
  }));
}

export async function getAdminV2CampaignCount(): Promise<number> {
  return client.automation.count();
}

export async function getAdminV2ReplyTemplates(page = 0): Promise<AdminV2ReplyTemplate[]> {
  const rows = await client.automation.findMany({
    take: LIST_LIMIT,
    skip: page * LIST_LIMIT,
    orderBy: { createdAt: "desc" },
    where: {
      listener: {
        commentReply: { not: null },
      },
    },
    select: {
      id: true,
      name: true,
      active: true,
      User: { select: { email: true } },
      listener: { select: { commentReply: true, commentReply2: true, commentReply3: true } },
    },
  });

  return rows.map((r) => ({
    campaignId: r.id,
    campaignName: r.name,
    ownerEmail: r.User?.email ?? null,
    reply1: r.listener?.commentReply ?? null,
    reply2: r.listener?.commentReply2 ?? null,
    reply3: r.listener?.commentReply3 ?? null,
    active: r.active,
  }));
}

export async function getAdminV2Activity(page = 0): Promise<AdminV2ActivityEvent[]> {
  const rows = await client.automationEvent.findMany({
    take: ACTIVITY_LIMIT,
    skip: page * ACTIVITY_LIMIT,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      eventType: true,
      keyword: true,
      createdAt: true,
      automation: {
        select: {
          name: true,
          User: { select: { email: true } },
        },
      },
      // meta is intentionally excluded from default feed — too noisy
    },
  });

  return rows.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    keyword: e.keyword,
    createdAt: e.createdAt,
    campaignName: e.automation?.name ?? null,
    ownerEmail: e.automation?.User?.email ?? null,
  }));
}

export async function getAdminV2ActivityCount(): Promise<number> {
  return client.automationEvent.count();
}

export async function getAdminV2WebhookEvents(page = 0): Promise<AdminV2WebhookEvent[]> {
  const rows = await client.webhookEvent.findMany({
    take: LIST_LIMIT,
    skip: page * LIST_LIMIT,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      eventType: true,
      eventSource: true,
      status: true,
      errorMessage: true,
      field: true,
      createdAt: true,
      automation: { select: { name: true } },
      // payload excluded from default — behind Advanced panel
    },
  });

  return rows.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    eventSource: e.eventSource,
    status: e.status,
    errorMessage: e.errorMessage,
    field: e.field,
    createdAt: e.createdAt,
    campaignName: e.automation?.name ?? null,
  }));
}

export async function getAdminV2LoopGuardEvents(): Promise<AdminV2ActivityEvent[]> {
  const rows = await client.automationEvent.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    where: {
      eventType: { in: ["LOOP_GUARD_TRIGGERED", "LOOP_GUARD_PAUSED_CAMPAIGN"] },
    },
    select: {
      id: true,
      eventType: true,
      keyword: true,
      createdAt: true,
      automation: { select: { name: true, User: { select: { email: true } } } },
    },
  });

  return rows.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    keyword: e.keyword,
    createdAt: e.createdAt,
    campaignName: e.automation?.name ?? null,
    ownerEmail: e.automation?.User?.email ?? null,
  }));
}

export async function getAdminV2RecentActivity(): Promise<AdminV2ActivityEvent[]> {
  return getAdminV2Activity(0);
}
