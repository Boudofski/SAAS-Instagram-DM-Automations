"use server";

import { replaySavedWebhookEvent, simulateCommentWebhook } from "@/actions/admin/webhook-simulation";
import {
  archiveCampaignAction,
  disconnectIntegrationAction,
  duplicateCampaignAction,
  markIntegrationReconnectRequiredAction,
  resubscribeIntegrationAction,
  setCampaignActiveAction,
  suspendUserAction,
  unsuspendUserAction,
} from "@/actions/admin/operations";
import ThemeToggle from "@/components/global/theme-toggle";
import {
  adminEnvironmentLabel,
  classifyDeliveryError,
  disabledAdminActionReason,
  formatAdminDate,
  getTopAdminIssue,
  sanitizeAdminPayload,
  shortenAdminId,
  summarizeAdminError,
  stripeCustomerDashboardUrl,
} from "@/lib/admin-control-center";
import { requireOwnerAdmin } from "@/lib/admin";
import { getMetaAdminDiagnostics } from "@/lib/meta-admin-diagnostics";
import { client } from "@/lib/prisma";
import { getUserMonthlyUsage } from "@/actions/usage/queries";
import { isUnlimited } from "@/lib/plan-limits";
import {
  buildWebhookPipelineDiagnostics,
  developmentModeDeliveryMessage,
  shouldShowDevelopmentModeDeliveryBanner,
} from "@/lib/webhook-pipeline-diagnostics";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";

type SearchParams = {
  q?: string;
  eventType?: string;
  tab?: string;
  testSince?: string;
  usageFilter?: string;
  userId?: string;
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "users", label: "Users" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "integrations", label: "Integrations" },
  { id: "campaigns", label: "Campaigns" },
  { id: "webhooks", label: "Webhooks" },
  { id: "messages", label: "Messages & Replies" },
  { id: "meta", label: "Meta Health" },
  { id: "compliance", label: "App Review" },
  { id: "system", label: "System" },
  { id: "danger", label: "Danger Zone" },
  { id: "audit", label: "Audit Logs" },
] as const;

export default async function AdminPage({ searchParams }: { searchParams?: SearchParams }) {
  const admin = await requireOwnerAdmin();
  const tab = TABS.some((item) => item.id === searchParams?.tab) ? searchParams!.tab! : "overview";
  const q = searchParams?.q?.trim();
  const eventType = searchParams?.eventType?.trim();
  const usageFilter = searchParams?.usageFilter?.trim();
  const qUuid = q && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q)
    ? q
    : null;
  const testSince = searchParams?.testSince ? new Date(searchParams.testSince) : null;
  const testSinceValid = Boolean(testSince && !Number.isNaN(testSince.getTime()));
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));

  const [
    totalUsers,
    activeUsers,
    totalIntegrations,
    connectedInstagramAccounts,
    totalCampaigns,
    activeCampaigns,
    totalLeads,
    totalWebhookEvents,
    totalMessageLogs,
    comments24h,
    matches24h,
    publicRepliesSent24h,
    dmsSent24h,
    dmsFailed24h,
    signatureFailures24h,
    tokenMissingFailures24h,
    revenueSubscriptions,
    metaDiagnostics,
    lastVerifyGet,
    lastPostRaw,
    lastSignatureFailed,
    lastRealComment,
    lastInboundDm,
    lastMetaTest,
    lastSimulated,
    lastKeywordMatched,
    lastPublicReplySent,
    lastPublicReplyFailed,
    lastDmSent,
    lastDmFailed,
  ] = await Promise.all([
    client.user.count(),
    client.user.count({ where: { automations: { some: { events: { some: { createdAt: { gte: since24h } } } } } } }),
    client.integrations.count(),
    client.integrations.count({ where: { instagramId: { not: null } } }),
    client.automation.count(),
    client.automation.count({ where: { active: true } }),
    client.lead.count(),
    client.webhookEvent.count(),
    client.messageLog.count(),
    client.automationEvent.count({ where: { eventType: "COMMENT_RECEIVED", createdAt: { gte: since24h } } }),
    client.automationEvent.count({ where: { eventType: "KEYWORD_MATCHED", createdAt: { gte: since24h } } }),
    client.messageLog.count({ where: { messageType: "COMMENT_REPLY", status: "SENT", createdAt: { gte: since24h } } }),
    client.messageLog.count({ where: { messageType: "DM", status: "SENT", createdAt: { gte: since24h } } }),
    client.messageLog.count({ where: { messageType: "DM", status: "FAILED", createdAt: { gte: since24h } } }),
    client.webhookEvent.count({ where: { eventType: "SIGNATURE_FAILED", createdAt: { gte: since24h } } }),
    client.messageLog.count({ where: { errorMessage: { contains: "token_missing" }, createdAt: { gte: since24h } } }),
    client.subscription.count({ where: { plan: "PRO" } }),
    getMetaAdminDiagnostics(),
    client.webhookEvent.findFirst({
      where: { eventType: "WEBHOOK_VERIFY_GET" },
      orderBy: { createdAt: "desc" },
      select: { status: true, errorMessage: true, payload: true, createdAt: true },
    }),
    client.webhookEvent.findFirst({
      where: { eventType: "WEBHOOK_POST_RECEIVED_RAW" },
      orderBy: { createdAt: "desc" },
      select: { status: true, payload: true, createdAt: true },
    }),
    client.webhookEvent.findFirst({
      where: { eventType: "SIGNATURE_FAILED" },
      orderBy: { createdAt: "desc" },
      select: { status: true, errorMessage: true, payload: true, createdAt: true },
    }),
    client.webhookEvent.findFirst({
      where: { eventType: "REAL_COMMENT_EVENT", eventSource: "META_REAL" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        automationId: true,
        eventType: true,
        status: true,
        igAccountId: true,
        igUserId: true,
        mediaId: true,
        commentId: true,
        errorMessage: true,
        payload: true,
        createdAt: true,
      },
    }),
    client.webhookEvent.findFirst({
      where: { eventType: "REAL_MESSAGE_EVENT", eventSource: "META_REAL" },
      orderBy: { createdAt: "desc" },
      select: { status: true, errorMessage: true, igAccountId: true, createdAt: true },
    }),
    client.webhookEvent.findFirst({
      where: { eventType: "META_TEST_EVENT" },
      orderBy: { createdAt: "desc" },
      select: { status: true, payload: true, createdAt: true },
    }),
    client.webhookEvent.findFirst({
      where: { eventSource: "SIMULATED_INTERNAL" },
      orderBy: { createdAt: "desc" },
      select: { status: true, eventType: true, payload: true, createdAt: true },
    }),
    client.automationEvent.findFirst({
      where: { eventType: "KEYWORD_MATCHED" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, keyword: true, automationId: true },
    }),
    client.messageLog.findFirst({
      where: { messageType: "COMMENT_REPLY", status: "SENT" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, automationId: true },
    }),
    client.messageLog.findFirst({
      where: { messageType: "COMMENT_REPLY", status: "FAILED" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, errorMessage: true, automationId: true },
    }),
    client.messageLog.findFirst({
      where: { messageType: "DM", status: "SENT" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, automationId: true },
    }),
    client.messageLog.findFirst({
      where: { messageType: "DM", status: "FAILED" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, errorMessage: true, automationId: true },
    }),
  ]);

  const [lastPipelineAutomationEvents, lastPipelineMessageLogs] = lastRealComment?.automationId
    ? await Promise.all([
        client.automationEvent.findMany({
          where: {
            automationId: lastRealComment.automationId,
            ...(lastRealComment.commentId ? { commentId: lastRealComment.commentId } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        client.messageLog.findMany({
          where: {
            automationId: lastRealComment.automationId,
            ...(lastRealComment.commentId ? { commentId: lastRealComment.commentId } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
      ])
    : [[], []];

  const [
    selfCommentsSkipped24h,
    duplicateCommentsSkipped24h,
    loopGuardTriggered24h,
    lastLoopGuardEvent,
    topOffendingCampaign,
    safetyEvents,
    totalStaticRepliesThisMonth,
  ] = await Promise.all([
    client.automationEvent.count({
      where: { eventType: "SELF_COMMENT_SKIPPED", createdAt: { gte: since24h } },
    }),
    client.automationEvent.count({
      where: { eventType: "DUPLICATE_SKIPPED", createdAt: { gte: since24h } },
    }),
    client.automationEvent.count({
      where: { eventType: { in: ["LOOP_GUARD_TRIGGERED", "LOOP_GUARD_PAUSED_CAMPAIGN"] }, createdAt: { gte: since24h } },
    }),
    client.automationEvent.findFirst({
      where: { eventType: { in: ["LOOP_GUARD_TRIGGERED", "LOOP_GUARD_PAUSED_CAMPAIGN"] } },
      orderBy: { createdAt: "desc" },
      include: { automation: { select: { name: true, active: true, User: { select: { email: true } } } } },
    }),
    client.messageLog.groupBy({
      by: ["automationId"],
      where: { messageType: "COMMENT_REPLY", status: "SENT", createdAt: { gte: since24h } },
      _count: { _all: true },
      orderBy: { _count: { automationId: "desc" } },
      take: 1,
    }),
    tab === "messages"
      ? client.automationEvent.findMany({
          where: {
            eventType: {
              in: [
                "SELF_COMMENT_SKIPPED",
                "COMMENT_SKIPPED",
                "DUPLICATE_SKIPPED",
                "LOOP_GUARD_TRIGGERED",
                "LOOP_GUARD_PAUSED_CAMPAIGN",
              ],
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { automation: { select: { name: true, User: { select: { email: true } } } } },
        })
      : Promise.resolve([]),
    client.messageLog.count({
      where: {
        status: "SENT",
        messageType: { in: ["COMMENT_REPLY", "DM"] },
        createdAt: { gte: monthStart },
      },
    }),
  ]);
  const topOffendingAutomationId = topOffendingCampaign[0]?.automationId;
  const topOffendingAutomation = topOffendingAutomationId
    ? await client.automation.findUnique({
        where: { id: topOffendingAutomationId },
        select: { name: true, User: { select: { email: true } } },
      })
    : null;

  const lastPipeline = buildWebhookPipelineDiagnostics({
    lastPostRaw,
    lastSignatureFailed,
    lastRealComment,
    automationEvents: lastPipelineAutomationEvents,
    messageLogs: lastPipelineMessageLogs,
  });
  const showDevelopmentDeliveryBanner = shouldShowDevelopmentModeDeliveryBanner(lastPostRaw);
  const dmCapabilityMissing = lastDmFailed?.errorMessage === "dm_capability_missing";
  const topIssue = getTopAdminIssue({
    lastPostRaw,
    signatureFailures24h,
    dmCapabilityMissing,
    tokenMissingFailures24h,
    dmFailed24h: dmsFailed24h,
    activeCampaigns,
    loopGuardTriggered24h,
    selfCommentsSkipped24h,
    duplicateCommentsSkipped24h,
  });

  const usageUsers = await client.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true },
  });
  const adminUsageSummaries = await Promise.all(
    usageUsers.map((item) => getUserMonthlyUsage(item.id))
  );
  const usersOverReplyLimit = adminUsageSummaries.filter((usage) => usage.staticReplies.blocked).length;
  const usersNearReplyLimit = adminUsageSummaries.filter((usage) => !usage.staticReplies.blocked && usage.staticReplies.percent >= 70).length;

  const tabHref = (id: string, extra?: Record<string, string>) => {
    const params = new URLSearchParams({
      tab: id,
      ...(q ? { q } : {}),
      ...(eventType && id === "webhooks" ? { eventType } : {}),
      ...(usageFilter && id === "subscriptions" ? { usageFilter } : {}),
      ...(testSinceValid && searchParams?.testSince ? { testSince: searchParams.testSince } : {}),
      ...extra,
    });
    return `/admin?${params.toString()}`;
  };

  const users = tab === "users"
    ? await client.user.findMany({
        where: q ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { firstname: { contains: q, mode: "insensitive" } },
            { lastname: { contains: q, mode: "insensitive" } },
            { clerkId: { contains: q } },
            { integrations: { some: { instagramUsername: { contains: q, mode: "insensitive" } } } },
            { integrations: { some: { instagramId: { contains: q } } } },
          ],
        } : undefined,
        orderBy: { createdAt: "desc" },
        take: 25,
        include: {
          subscription: true,
          integrations: { select: { instagramUsername: true, instagramId: true, pageId: true, status: true, reconnectRequired: true } },
          automations: {
            select: {
              id: true,
              active: true,
              events: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
              _count: { select: { leads: true } },
            },
          },
          _count: { select: { automations: true, integrations: true } },
        },
      })
    : [];

  const selectedUser = tab === "users" && searchParams?.userId
    ? await client.user.findUnique({
        where: { id: searchParams.userId },
        include: {
          subscription: true,
          integrations: {
            select: {
              id: true,
              instagramUsername: true,
              instagramId: true,
              pageId: true,
              status: true,
              reconnectRequired: true,
              createdAt: true,
            },
          },
          automations: {
            where: { archivedAt: null },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: { id: true, name: true, active: true, createdAt: true, _count: { select: { leads: true, messageLogs: true } } },
          },
          _count: { select: { automations: true, integrations: true } },
        },
      })
    : null;

  const subscriptions = tab === "subscriptions"
    ? await client.subscription.findMany({
        where: q ? {
          OR: [
            { customerId: { contains: q } },
            { User: { email: { contains: q, mode: "insensitive" } } },
            { User: { clerkId: { contains: q } } },
          ],
        } : undefined,
        orderBy: { updatedAt: "desc" },
        take: 50,
          include: { User: { select: { id: true, email: true, clerkId: true } } },
      })
    : [];
  const subscriptionUsage = tab === "subscriptions"
    ? new Map(
        await Promise.all(
          subscriptions
            .filter((sub: any) => sub.User?.id)
            .map(async (sub: any) => [sub.User.id, await getUserMonthlyUsage(sub.User.id)] as const)
        )
      )
    : new Map();

  const integrations = tab === "integrations"
    ? await client.integrations.findMany({
        where: q ? {
          OR: [
            { instagramUsername: { contains: q, mode: "insensitive" } },
            { instagramId: { contains: q } },
            { pageId: { contains: q } },
            { webhookAccountId: { contains: q } },
            { businessId: { contains: q } },
            { User: { email: { contains: q, mode: "insensitive" } } },
          ],
        } : undefined,
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          instagramId: true,
          webhookAccountId: true,
          pageId: true,
          pageName: true,
          businessId: true,
          instagramUsername: true,
          igAccountSource: true,
          webhookSubscriptionMode: true,
          webhookSubscriptionError: true,
          oauthLastError: true,
          oauthLastErrorAt: true,
          status: true,
          disconnectedAt: true,
          disconnectedReason: true,
          reconnectRequired: true,
          lastAdminNote: true,
          lastAdminActionAt: true,
          User: { select: { email: true, clerkId: true } },
        },
      })
    : [];

  const campaigns = tab === "campaigns" || tab === "webhooks" || tab === "meta"
    ? await client.automation.findMany({
        where: q && tab === "campaigns" ? {
          OR: [
            ...(qUuid ? [{ id: qUuid }] : []),
            { name: { contains: q, mode: "insensitive" } },
            { User: { email: { contains: q, mode: "insensitive" } } },
            { posts: { some: { postid: { contains: q } } } },
          ],
        } : undefined,
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          User: { select: { email: true, clerkId: true } },
          keywords: { select: { word: true } },
          posts: { select: { postid: true, mediaType: true, caption: true } },
          listener: true,
          _count: { select: { leads: true, messageLogs: true, events: true } },
        },
      })
    : [];

  const auditLogs = tab === "danger" || tab === "audit"
    ? await client.adminAuditLog.findMany({
        where: {
          ...(q ? {
            OR: [
              { action: { contains: q, mode: "insensitive" } },
              { adminEmail: { contains: q, mode: "insensitive" } },
              { targetType: { contains: q, mode: "insensitive" } },
              { targetId: { contains: q } },
              { reason: { contains: q, mode: "insensitive" } },
              { status: { contains: q, mode: "insensitive" } },
            ],
          } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: tab === "audit" ? 100 : 10,
      })
    : [];

  const webhookEvents = tab === "webhooks"
    ? await client.webhookEvent.findMany({
        where: {
          ...(eventType ? { eventType } : {}),
          ...(testSinceValid ? { createdAt: { gte: testSince! } } : {}),
          ...(q ? {
            OR: [
              ...(qUuid ? [{ id: qUuid }] : []),
              { eventType: { contains: q, mode: "insensitive" } },
              { igAccountId: { contains: q } },
              { igUserId: { contains: q } },
              { mediaId: { contains: q } },
              { commentId: { contains: q } },
              { errorMessage: { contains: q, mode: "insensitive" } },
              { automation: { name: { contains: q, mode: "insensitive" } } },
            ],
          } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { automation: { select: { name: true, User: { select: { email: true } } } } },
      })
    : [];

  const messageLogs = tab === "messages"
    ? await client.messageLog.findMany({
        where: q ? {
          OR: [
            { recipientIgId: { contains: q } },
            { mediaId: { contains: q } },
            { commentId: { contains: q } },
            { errorMessage: { contains: q, mode: "insensitive" } },
            { automation: { name: { contains: q, mode: "insensitive" } } },
            { automation: { User: { email: { contains: q, mode: "insensitive" } } } },
          ],
        } : undefined,
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { automation: { select: { name: true, User: { select: { email: true } } } } },
      })
    : [];

  return (
    <main className="ap3k-page">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/88 backdrop-blur-2xl dark:border-white/10 dark:bg-[#050816]/88">
        <div className="mx-auto max-w-[1500px] px-5 py-4 lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">AP3k Admin</h1>
                <Badge tone={adminEnvironmentLabel() === "Production" ? "green" : "amber"}>{adminEnvironmentLabel()}</Badge>
                <Badge tone="green">Operational control center</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Signed in as <span className="font-bold text-slate-800 dark:text-slate-100">{admin.email ?? admin.clerkId}</span> · Last refreshed {formatAdminDate(new Date())}
              </p>
            </div>
            <form className="flex w-full flex-col gap-2 sm:flex-row xl:max-w-3xl">
              <input type="hidden" name="tab" value={tab} />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search current section by email, IG username, campaign, event, comment, media ID"
                className="ap3k-input min-h-11 flex-1 rounded-xl px-3 text-sm outline-none focus:border-pink-300"
              />
              {tab === "webhooks" && (
                <input
                  name="eventType"
                  defaultValue={eventType}
                  placeholder="Event type"
                  className="ap3k-input min-h-11 rounded-xl px-3 text-sm outline-none focus:border-pink-300"
                />
              )}
              <button className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white">Search</button>
              <Link href={tabHref(tab)} className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-center text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                Refresh
              </Link>
              <ThemeToggle compact />
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-6 px-5 py-6 lg:grid-cols-[250px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-white/[0.04] lg:block">
            {TABS.map((item) => (
              <Link
                key={item.id}
                href={tabHref(item.id)}
                className={[
                  "mb-0 block shrink-0 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors lg:mb-1",
                  tab === item.id ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white",
                ].join(" ")}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 space-y-6">
          {tab === "overview" && (
            <>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total users" value={totalUsers} detail={`${activeUsers} active in 24h`} />
                <StatCard label="Connected IG accounts" value={connectedInstagramAccounts} detail={`${totalIntegrations} integrations total`} />
                <StatCard label="Active campaigns" value={activeCampaigns} detail={`${totalCampaigns} campaigns total`} />
                <StatCard label="Leads captured" value={totalLeads} detail={`${comments24h} comments in 24h`} />
                <StatCard label="Trigger matches 24h" value={matches24h} detail="Keyword and Any Comment matches" />
                <StatCard label="Public replies 24h" value={publicRepliesSent24h} detail="Sent public comment replies" />
                <StatCard label="DMs sent 24h" value={dmsSent24h} detail={`${dmsFailed24h} failed in 24h`} tone={dmsFailed24h ? "amber" : "green"} />
                <StatCard label="Active subscriptions" value={revenueSubscriptions} detail="Read-only Stripe visibility" />
                <StatCard label="Static replies month" value={totalStaticRepliesThisMonth} detail="Successful public replies and DMs this month" />
                <StatCard label="Users near limit" value={usersNearReplyLimit} detail="At least 70% of monthly replies" tone={usersNearReplyLimit ? "amber" : "green"} />
                <StatCard label="Users over limit" value={usersOverReplyLimit} detail="Monthly replies blocked" tone={usersOverReplyLimit ? "red" : "green"} />
                <StatCard label="Self comments skipped" value={selfCommentsSkipped24h} detail="Connected-account comments ignored in 24h" tone={selfCommentsSkipped24h ? "amber" : "green"} />
                <StatCard label="Duplicates skipped" value={duplicateCommentsSkipped24h} detail="Repeated comment webhooks ignored in 24h" tone={duplicateCommentsSkipped24h ? "amber" : "green"} />
                <StatCard label="Loop guard triggered" value={loopGuardTriggered24h} detail="Emergency loop protection events in 24h" tone={loopGuardTriggered24h ? "red" : "green"} />
                <StatCard
                  label="Top reply campaign"
                  value={topOffendingCampaign[0]?._count?._all ?? 0}
                  detail={topOffendingAutomation ? `${topOffendingAutomation.name} · ${topOffendingAutomation.User?.email ?? "unknown"}` : "No public replies in 24h"}
                  tone={topOffendingCampaign[0] ? "amber" : "green"}
                />
              </section>

              <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                <Panel title="Top Issue Right Now">
                  <div className={`rounded-xl border p-4 ${tonePanel(topIssue.tone)}`}>
                    <p className="text-lg font-black">{topIssue.label}</p>
                    <p className="mt-1 text-sm">{topIssue.detail}</p>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <HealthCard label="Meta webhook delivery" value={lastPostRaw ? "Receiving POSTs" : "No raw POST yet"} tone={lastPostRaw ? "green" : "red"} />
                    <HealthCard label="Last real comment" value={lastRealComment ? `${lastRealComment.status} · ${formatAdminDate(lastRealComment.createdAt)}` : "None"} tone={lastRealComment ? "green" : "amber"} />
                    <HealthCard label="Public reply status" value={lastPublicReplySent ? `Working · ${formatAdminDate(lastPublicReplySent.createdAt)}` : "No sent reply yet"} tone={lastPublicReplySent ? "green" : "slate"} />
                    <HealthCard label="DM capability" value={dmCapabilityMissing ? "Meta capability missing" : lastDmSent ? "DM sent" : "No success yet"} tone={dmCapabilityMissing ? "red" : lastDmSent ? "green" : "amber"} />
                    <HealthCard label="Last loop guard" value={lastLoopGuardEvent ? `${lastLoopGuardEvent.eventType} · ${formatAdminDate(lastLoopGuardEvent.createdAt)}` : "None"} tone={lastLoopGuardEvent ? "red" : "green"} />
                    <HealthCard label="Recommendation" value="Pause Any Comment campaigns until review if loop guard or self-comment skips appear." tone={loopGuardTriggered24h ? "red" : "amber"} />
                  </div>
                </Panel>

                <Panel title="Last Pipeline Stage">
                  {showDevelopmentDeliveryBanner && (
                    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-900">
                      {developmentModeDeliveryMessage()}
                    </div>
                  )}
                  <PipelineGrid pipeline={lastPipeline} />
                </Panel>
              </section>
            </>
          )}

          {tab === "users" && (
            <Panel title="Users" description="Operational user controls. Suspension is soft, audited, and pauses active campaigns. Data deletion remains disabled until export/retention workflow exists.">
              {selectedUser && (
                <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <Identity title={selectedUser.email} subtitle={`${selectedUser.firstname ?? ""} ${selectedUser.lastname ?? ""}`.trim() || selectedUser.clerkId} />
                    <Badge tone={selectedUser.status === "SUSPENDED" ? "red" : "green"}>{selectedUser.status}</Badge>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-4">
                    <HealthCard label="Plan" value={selectedUser.subscription?.plan ?? "FREE"} />
                    <HealthCard label="IG accounts" value={selectedUser._count.integrations} />
                    <HealthCard label="Campaigns" value={selectedUser._count.automations} />
                    <HealthCard label="Created" value={formatAdminDate(selectedUser.createdAt)} />
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {selectedUser.integrations.map((integration) => (
                      <HealthCard key={integration.id} label={integration.instagramUsername ? `@${integration.instagramUsername}` : "Instagram"} value={`${integration.status}${integration.reconnectRequired ? " · reconnect required" : ""}`} tone={integration.status === "CONNECTED" && !integration.reconnectRequired ? "green" : "amber"} />
                    ))}
                  </div>
                </div>
              )}
              <DataTable
                headers={["User", "Clerk ID", "Status", "Plan", "Instagram", "Campaigns", "Leads", "Last activity", "Actions"]}
                rows={users.map((user: any) => {
                  const leads = user.automations.reduce((sum: number, automation: any) => sum + automation._count.leads, 0);
                  const lastActivity = user.automations
                    .flatMap((automation: any) => automation.events.map((event: any) => event.createdAt))
                    .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0];
                  return [
                    <Identity key="user" title={user.email} subtitle={`${user.firstname ?? ""} ${user.lastname ?? ""}`.trim() || "No profile name"} />,
                    <Mono key="clerk">{user.clerkId}</Mono>,
                    <Badge key="status" tone={user.status === "SUSPENDED" ? "red" : "green"}>{user.status}</Badge>,
                    <Badge key="plan" tone={user.subscription?.plan === "PRO" ? "purple" : "slate"}>{user.subscription?.plan ?? "FREE"}</Badge>,
                    user.integrations[0]?.instagramUsername ? `@${user.integrations[0].instagramUsername}` : "Not connected",
                    String(user._count.automations),
                    String(leads),
                    formatAdminDate(lastActivity),
                    <div key="actions" className="space-y-2">
                      <Link href={tabHref("users", { userId: user.id })} className="inline-flex rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50">View details</Link>
                      {user.status === "SUSPENDED" ? (
                        <AdminActionForm action={unsuspendUserAction} hidden={{ userId: user.id }} reasonPlaceholder="Unsuspend reason" submitLabel="Unsuspend" />
                      ) : (
                        <AdminActionForm action={suspendUserAction} hidden={{ userId: user.id }} reasonPlaceholder="Suspend reason" confirmation="SUSPEND" submitLabel="Suspend" danger />
                      )}
                      <DisabledReason label="Delete data" reason={disabledAdminActionReason("deleteUserData")} />
                    </div>,
                  ];
                })}
                empty="No users found."
              />
            </Panel>
          )}

          {tab === "subscriptions" && (
            <Panel title="Subscriptions" description="Read-only subscription view. Stripe write actions are intentionally disabled in this version.">
              <FilterPills
                items={[
                  ["All", tabHref("subscriptions", { usageFilter: "" })],
                  ["Over limit", tabHref("subscriptions", { usageFilter: "over" })],
                  ["Near limit", tabHref("subscriptions", { usageFilter: "near" })],
                  ["Free users", tabHref("subscriptions", { usageFilter: "free" })],
                  ["Creator users", tabHref("subscriptions", { usageFilter: "creator" })],
                ]}
              />
              <DataTable
                headers={["User", "Plan", "Static replies", "Campaigns", "Accounts", "Stripe customer", "Status", "Updated", "Stripe", "Actions"]}
                rows={subscriptions.filter((sub: any) => {
                  const usage = sub.User?.id ? subscriptionUsage.get(sub.User.id) : null;
                  if (usageFilter === "over") return Boolean(usage?.staticReplies.blocked);
                  if (usageFilter === "near") return Boolean(usage && !usage.staticReplies.blocked && usage.staticReplies.percent >= 70);
                  if (usageFilter === "free") return sub.plan === "FREE";
                  if (usageFilter === "creator") return sub.plan === "PRO";
                  return true;
                }).map((sub: any) => {
                  const usage = sub.User?.id ? subscriptionUsage.get(sub.User.id) : null;
                  return [
                  <Identity key="user" title={sub.User?.email ?? "Unknown user"} subtitle={sub.User?.clerkId ?? "No Clerk ID"} />,
                  <Badge key="plan" tone={sub.plan === "PRO" ? "purple" : "slate"}>{sub.plan === "PRO" ? "Creator" : "Free"}</Badge>,
                  usage ? <UsageCell key="static" used={usage.staticReplies.used} limit={usage.staticReplies.limit} blocked={usage.staticReplies.blocked} /> : "Unknown",
                  usage ? <UsageCell key="campaigns" used={usage.activeCampaigns.used} limit={usage.activeCampaigns.limit} blocked={usage.activeCampaigns.blocked} /> : "Unknown",
                  usage ? <UsageCell key="accounts" used={usage.connectedAccounts.used} limit={usage.connectedAccounts.limit} blocked={usage.connectedAccounts.blocked} /> : "Unknown",
                  <Mono key="customer">{sub.customerId ?? "No customer"}</Mono>,
                  sub.plan === "PRO" ? <Badge key="active" tone="green">Active/internal PRO</Badge> : <Badge key="free" tone="slate">Free</Badge>,
                  formatAdminDate(sub.updatedAt),
                  sub.customerId && stripeCustomerDashboardUrl(sub.customerId) ? (
                    <a key="stripe" className="font-bold text-rf-blue hover:underline" href={stripeCustomerDashboardUrl(sub.customerId)!} target="_blank" rel="noreferrer">Open Stripe</a>
                  ) : "No link",
                  <DisabledActions key="actions" labels={["Cancel", "Sync", "Override plan"]} />,
                ];
                })}
                empty="No subscription records found."
              />
            </Panel>
          )}

          {tab === "integrations" && (
            <Panel title="Instagram Integrations" description="Tokens are never displayed. Health badges use stored safe metadata and recent event signals.">
              <DataTable
                headers={["Owner", "IG account", "Page", "IG Business ID", "Webhook ID", "Status", "Subscription", "Last error", "Actions"]}
                rows={integrations.map((integration: any) => [
                  <Identity key="owner" title={integration.User?.email ?? "Unknown user"} subtitle={integration.User?.clerkId ?? ""} />,
                  <Identity key="ig" title={integration.instagramUsername ? `@${integration.instagramUsername}` : "No username"} subtitle={integration.igAccountSource ?? "Unknown source"} />,
                  <Identity key="page" title={integration.pageName ?? "No page"} subtitle={integration.pageId ?? "No Page ID"} />,
                  <Mono key="ig-id">{integration.instagramId ?? "Missing"}</Mono>,
                  <Mono key="webhook-id">{integration.webhookAccountId ?? "Missing"}</Mono>,
                  <Badge key="status" tone={integration.status === "CONNECTED" && !integration.reconnectRequired ? "green" : integration.status === "DISCONNECTED" ? "red" : "amber"}>
                    {integration.reconnectRequired ? "RECONNECT_REQUIRED" : integration.status}
                  </Badge>,
                  <Badge key="sub" tone={integration.webhookSubscriptionMode === "API_SUBSCRIBED" ? "green" : "amber"}>{integration.webhookSubscriptionMode ?? "Unknown"}</Badge>,
                  <ErrorSummary key="error" error={integration.oauthLastError ?? integration.webhookSubscriptionError} />,
                  <div key="actions" className="space-y-2">
                    {integration.status !== "DISCONNECTED" && (
                      <AdminActionForm action={disconnectIntegrationAction} hidden={{ integrationId: integration.id }} reasonPlaceholder="Disconnect reason" confirmation="DISCONNECT" submitLabel="Disconnect" danger />
                    )}
                    <AdminActionForm action={markIntegrationReconnectRequiredAction} hidden={{ integrationId: integration.id }} reasonPlaceholder="Reconnect note" submitLabel="Reconnect required" />
                    <AdminActionForm action={resubscribeIntegrationAction} hidden={{ integrationId: integration.id }} reasonPlaceholder="Resubscribe reason" submitLabel="Resubscribe" />
                  </div>,
                ])}
                empty="No integrations found."
              />
            </Panel>
          )}

          {tab === "campaigns" && (
            <Panel title="Campaigns" description="Admin campaign inventory and delivery counters. Editing is linked/read-only here to avoid tenant confusion.">
              <DataTable
                headers={["Owner", "Campaign", "Status", "Trigger", "Post scope", "Replies", "Private DM", "Messages", "Created", "Actions"]}
                rows={campaigns.map((campaign: any) => {
                  const keywords = campaign.triggerMode === "ANY_COMMENT" ? "Any comment" : campaign.keywords.map((kw: any) => kw.word).join(", ") || "No keywords";
                  const postScope = campaign.posts[0]?.postid === "ANY" ? "Any post" : campaign.posts[0]?.postid ?? "No post";
                  const publicReplyEnabled = Boolean(campaign.listener?.commentReply || campaign.listener?.commentReply2 || campaign.listener?.commentReply3);
                  return [
                    campaign.User?.email ?? "Unknown user",
                    <Identity key="campaign" title={campaign.name} subtitle={campaign.id} />,
                    campaign.archivedAt ? <Badge key="status" tone="amber">Archived</Badge> : <Badge key="status" tone={campaign.active ? "green" : "slate"}>{campaign.active ? "Active" : "Paused"}</Badge>,
                    <Identity key="trigger" title={campaign.triggerMode === "ANY_COMMENT" ? "Any comment" : "Specific keyword"} subtitle={`${campaign.matchingMode} · ${keywords}`} />,
                    <Mono key="post">{postScope}</Mono>,
                    publicReplyEnabled ? <Badge key="reply" tone="green">Enabled</Badge> : <Badge key="reply" tone="slate">Off</Badge>,
                    campaign.sendPrivateDm === false ? <Badge key="private-dm" tone="amber">Skipped externally</Badge> : <Badge key="private-dm" tone="green">Sent by AP3k</Badge>,
                    `${campaign._count.messageLogs} logs · ${campaign._count.leads} leads`,
                    formatAdminDate(campaign.createdAt),
                    <div key="actions" className="space-y-2">
                      {!campaign.archivedAt && (
                        <AdminActionForm
                          action={setCampaignActiveAction}
                          hidden={{ automationId: campaign.id, active: campaign.active ? "false" : "true" }}
                          reasonPlaceholder={campaign.active ? "Pause reason" : "Activate reason"}
                          confirmation={campaign.active ? "PAUSE" : "ACTIVATE"}
                          submitLabel={campaign.active ? "Pause" : "Activate"}
                          danger={campaign.active}
                        />
                      )}
                      {!campaign.archivedAt && <AdminActionForm action={duplicateCampaignAction} hidden={{ automationId: campaign.id }} reasonPlaceholder="Duplicate reason" submitLabel="Duplicate" />}
                      {!campaign.archivedAt ? (
                        <AdminActionForm action={archiveCampaignAction} hidden={{ automationId: campaign.id }} reasonPlaceholder="Archive reason" confirmation="ARCHIVE" submitLabel="Archive" danger />
                      ) : (
                        <DisabledReason label="Archived" reason="Campaign is already archived." />
                      )}
                    </div>,
                  ];
                })}
                empty="No campaigns found."
              />
            </Panel>
          )}

          {tab === "webhooks" && (
            <>
              <Panel title="Webhook Diagnostics">
                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                  <HealthCard label="Last raw POST" value={formatAdminDate(lastPostRaw?.createdAt)} tone={lastPostRaw ? "green" : "red"} />
                  <HealthCard label="GET verify" value={lastVerifyGet ? `${lastVerifyGet.status} · ${formatAdminDate(lastVerifyGet.createdAt)}` : "Never"} tone={lastVerifyGet?.status === "PROCESSED" ? "green" : "amber"} />
                  <HealthCard label="Signature failures 24h" value={String(signatureFailures24h)} tone={signatureFailures24h ? "red" : "green"} />
                  <HealthCard label="Real comment" value={formatAdminDate(lastRealComment?.createdAt)} tone={lastRealComment ? "green" : "amber"} />
                  <HealthCard label="Inbound DM" value={formatAdminDate(lastInboundDm?.createdAt)} tone={lastInboundDm ? "green" : "slate"} />
                  <HealthCard label="Internal self-test" value={formatAdminDate(lastSimulated?.createdAt)} tone={lastSimulated ? "green" : "slate"} />
                  <HealthCard label="Self skipped 24h" value={String(selfCommentsSkipped24h)} tone={selfCommentsSkipped24h ? "amber" : "green"} />
                  <HealthCard label="Duplicate skipped 24h" value={String(duplicateCommentsSkipped24h)} tone={duplicateCommentsSkipped24h ? "amber" : "green"} />
                  <HealthCard label="Loop guard 24h" value={String(loopGuardTriggered24h)} tone={loopGuardTriggered24h ? "red" : "green"} />
                </div>
                <div className="mt-4">
                  <PipelineGrid pipeline={lastPipeline} />
                </div>
                {(lastPipeline.mediaMatching || lastPipeline.triggerMatching) && (
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <AdminJsonViewer title="mediaMatching" value={lastPipeline.mediaMatching} />
                    <AdminJsonViewer title="triggerMatching" value={lastPipeline.triggerMatching} />
                  </div>
                )}
              </Panel>

              <Panel title="Testing Tools">
                <div className="grid gap-4 xl:grid-cols-2">
                  <form method="POST" action="/api/admin/webhook-self-test" className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="font-black">Signed internal self-test</h3>
                    <p className="mt-1 text-sm text-slate-600">Sends a signed INTERNAL_SELF_TEST payload to the webhook route. Does not send DMs.</p>
                    <button className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Run webhook self-test</button>
                  </form>
                  <form action={simulateCommentWebhook} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="font-black">Run simulated comment against campaign</h3>
                    <p className="mt-1 text-sm text-slate-600">Decision-only safe mode. It never sends a real DM.</p>
                    <div className="mt-4 grid gap-2">
                      <select name="automationId" required className="ap3k-select min-h-10 rounded-xl px-3 text-sm">
                        <option value="">Select campaign</option>
                        {campaigns.map((campaign: any) => (
                          <option key={campaign.id} value={campaign.id}>{campaign.name} · {campaign.active ? "active" : "paused"} · {campaign.User?.email ?? "unknown"}</option>
                        ))}
                      </select>
                      <input name="mediaId" defaultValue={(campaigns[0] as any)?.posts?.[0]?.postid === "ANY" ? "ANY_TEST_MEDIA" : (campaigns[0] as any)?.posts?.[0]?.postid ?? "ANY_TEST_MEDIA"} className="ap3k-input min-h-10 rounded-xl px-3 text-sm" placeholder="Media ID" />
                      <input name="commenterId" defaultValue="simulated_commenter" className="ap3k-input min-h-10 rounded-xl px-3 text-sm" placeholder="Commenter ID" />
                      <input name="commentText" defaultValue={(campaigns[0] as any)?.keywords?.[0]?.word ?? "ai"} className="ap3k-input min-h-10 rounded-xl px-3 text-sm" placeholder="Comment text" />
                    </div>
                    <button className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Run matching simulation</button>
                  </form>
                </div>
              </Panel>

              <Panel title="Webhook Events">
                <FilterPills
                  items={[
                    ["All", tabHref("webhooks", { eventType: "" })],
                    ["Real comments", tabHref("webhooks", { eventType: "REAL_COMMENT_EVENT" })],
                    ["Messages", tabHref("webhooks", { eventType: "REAL_MESSAGE_EVENT" })],
                    ["Self skipped", tabHref("webhooks", { eventType: "REAL_COMMENT_EVENT" })],
                    ["Signature failed", tabHref("webhooks", { eventType: "SIGNATURE_FAILED" })],
                    ["Meta test", tabHref("webhooks", { eventType: "META_TEST_EVENT" })],
                  ]}
                />
                <DataTable
                  headers={["Time", "Source", "Event", "Object", "IDs", "Status", "Reason", "User/Campaign", "Action"]}
                  rows={webhookEvents.map((event: any) => {
                    const payload = event.payload && typeof event.payload === "object" ? event.payload as Record<string, unknown> : {};
                    return [
                      formatAdminDate(event.createdAt),
                      <Badge key="source" tone={event.eventSource === "META_REAL" ? "green" : "blue"}>{event.eventSource}</Badge>,
                      <EventBadge key="event" eventType={event.eventType} />,
                      `${String(payload.object ?? "unknown")} · ${event.field ?? String(payload.field ?? "none")}`,
                      <Identity key="ids" title={event.commentId ?? event.mediaId ?? event.igAccountId ?? event.id} subtitle={`media ${event.mediaId ?? "n/a"}`} />,
                      <StatusBadge key="status" status={event.status} />,
                      event.errorMessage ?? String((payload as any).simulationResult ?? "None"),
                      <Identity key="campaign" title={event.automation?.name ?? "No campaign"} subtitle={event.automation?.User?.email ?? ""} />,
                      event.eventSource === "META_REAL" && event.automationId ? (
                        <form key="replay" action={replaySavedWebhookEvent}>
                          <input type="hidden" name="eventId" value={event.id} />
                          <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-700">Replay safe simulation</button>
                        </form>
                      ) : <span key="no-action" className="text-xs text-slate-400">No action</span>,
                    ];
                  })}
                  details={(eventIndex) => {
                    const event = webhookEvents[eventIndex] as any;
                    return event ? (
                      <div className="grid gap-3 p-4 lg:grid-cols-2">
                        <PayloadSummary payload={event.payload} />
                        <AdminJsonViewer title="Sanitized payload" value={sanitizeAdminPayload(event.payload)} />
                      </div>
                    ) : null;
                  }}
                  empty="No webhook events found."
                />
              </Panel>
            </>
          )}

          {tab === "messages" && (
            <>
              <Panel title="Safety Skips & Loop Guard" description="Ignored self-comments, duplicate webhooks, cooldown skips, and emergency loop protection are shown separately from delivery failures.">
                <DataTable
                  headers={["Time", "Owner/Campaign", "Status", "Reason", "Object IDs", "Recommendation"]}
                  rows={safetyEvents.map((event: any) => {
                    const meta = event.meta && typeof event.meta === "object" ? event.meta as Record<string, unknown> : {};
                    const reason = String(meta.reason ?? event.eventType);
                    return [
                      formatAdminDate(event.createdAt),
                      <Identity key="campaign" title={event.automation?.name ?? "Unknown campaign"} subtitle={event.automation?.User?.email ?? ""} />,
                      <EventBadge key="event" eventType={event.eventType} />,
                      reason === "self_comment_author"
                        ? "Ignored self-comment from connected account"
                        : reason === "duplicate_comment_webhook"
                          ? "Ignored duplicate webhook"
                          : reason === "automation_rate_limit_loop_guard"
                            ? "Loop guard skipped public reply"
                            : reason === "commenter_recently_handled"
                              ? "Commenter recently handled"
                              : reason === "recent_ap3k_reply_text_match"
                                ? "Ignored AP3k-generated reply text"
                                : reason,
                      <Identity key="ids" title={`comment ${event.commentId ?? "n/a"}`} subtitle={`media ${event.mediaId ?? "n/a"}`} />,
                      event.eventType === "LOOP_GUARD_PAUSED_CAMPAIGN"
                        ? "Campaign auto-paused by loop guard"
                        : "Pause Any Comment campaigns until review if counts rise.",
                    ];
                  })}
                  empty="No safety skip events found."
                />
              </Panel>

              <Panel title="Messages & Replies" description="Delivery logs for public replies and private DM attempts.">
                <DataTable
                  headers={["Time", "Owner/Campaign", "Type", "Status", "Endpoint", "Object IDs", "Error", "Action"]}
                  rows={messageLogs.map((log: any) => {
                    const classified = classifyDeliveryError(log.errorMessage);
                    return [
                      formatAdminDate(log.createdAt),
                      <Identity key="campaign" title={log.automation?.name ?? "Unknown campaign"} subtitle={log.automation?.User?.email ?? ""} />,
                      <Badge key="type" tone={log.messageType === "DM" ? "purple" : "blue"}>{log.messageType === "DM" ? "PRIVATE_DM" : "PUBLIC_REPLY"}</Badge>,
                      log.status === "SKIPPED" ? <Badge key="status" tone="amber">Skipped</Badge> : <StatusBadge key="status" status={log.status} />,
                      log.messageType === "DM" ? "ig_business/messages" : "comment/media reply",
                      <Identity key="ids" title={`comment ${log.commentId ?? "n/a"}`} subtitle={`media ${log.mediaId ?? "n/a"}`} />,
                      log.status === "SKIPPED" && log.errorMessage === "external_dm_tool_enabled"
                        ? <Badge key="error" tone="amber">Skipped — external DM tool enabled</Badge>
                        : log.errorMessage ? <Badge key="error" tone={classified.tone}>{classified.label}</Badge> : "None",
                      <DisabledActions key="actions" labels={["View details", "Copy safe error"]} />,
                    ];
                  })}
                  empty="No message logs found."
                />
              </Panel>
            </>
          )}

          {tab === "meta" && (
            <>
              <Panel title="Meta App Configuration">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <HealthCard label="App ID" value={process.env.META_APP_ID ? "Present" : "Missing"} tone={process.env.META_APP_ID ? "green" : "red"} />
                  <HealthCard label="App secret" value={process.env.META_APP_SECRET ? "Present" : "Missing"} tone={process.env.META_APP_SECRET ? "green" : "red"} />
                  <HealthCard label="Verify token" value={process.env.META_VERIFY_TOKEN ? "Present" : "Missing"} tone={process.env.META_VERIFY_TOKEN ? "green" : "red"} />
                  <HealthCard label="Product flow" value="Facebook Login + Page token" tone="green" />
                  <HealthCard label="Webhook URL" value={`${process.env.NEXT_PUBLIC_HOST_URL ?? "https://ap3k.com"}/api/webhooks/meta`} />
                  <HealthCard label="Page token valid" value={metaDiagnostics.tokenValid ? "Yes" : "No"} tone={metaDiagnostics.tokenValid ? "green" : "red"} />
                  <HealthCard label="Comments field" value={metaDiagnostics.commentsSubscribed ? "Subscribed" : "Not confirmed"} tone={metaDiagnostics.commentsSubscribed ? "green" : "amber"} />
                  <HealthCard label="Messages field" value={metaDiagnostics.messagesSubscribed ? "Subscribed" : "Not confirmed"} tone={metaDiagnostics.messagesSubscribed ? "green" : "amber"} />
                </div>
                <Callout tone="amber" title="Permission family">
                  AP3k uses Facebook Login for Business + Page tokens: instagram_basic, instagram_manage_comments, instagram_manage_messages, pages_show_list, pages_read_engagement, business_management. Do not mix instagram_business_* unless migrating to Instagram Login.
                </Callout>
              </Panel>

              <Panel title="Meta Delivery Center">
                <div className="grid gap-3 md:grid-cols-3">
                  <HealthCard label="GET verify" value={lastVerifyGet ? `${lastVerifyGet.status} · ${formatAdminDate(lastVerifyGet.createdAt)}` : "Never"} tone={lastVerifyGet?.status === "PROCESSED" ? "green" : "amber"} />
                  <HealthCard label="POST receive" value={lastPostRaw ? formatAdminDate(lastPostRaw.createdAt) : "No POST"} tone={lastPostRaw ? "green" : "red"} />
                  <HealthCard label="Last real comment" value={formatAdminDate(lastRealComment?.createdAt)} tone={lastRealComment ? "green" : "amber"} />
                  <HealthCard label="Last inbound DM" value={formatAdminDate(lastInboundDm?.createdAt)} tone={lastInboundDm ? "green" : "slate"} />
                  <HealthCard label="Public reply" value={lastPublicReplySent ? "Working" : "No success yet"} tone={lastPublicReplySent ? "green" : "amber"} />
                  <HealthCard label="Last DM result" value={lastDmFailed?.errorMessage ?? (lastDmSent ? "Sent" : "No result")} tone={lastDmFailed ? "red" : lastDmSent ? "green" : "amber"} />
                </div>
                <Callout tone="red" title="Code 3 explanation">
                  If Meta returns code=3, private DM is blocked until instagram_manage_messages capability is approved or the app/tester setup allows the recipient. Public replies should still be attempted.
                </Callout>
              </Panel>
            </>
          )}

          {tab === "compliance" && (
            <Panel title="App Review / Compliance">
              <div className="grid gap-4 xl:grid-cols-2">
                {[
                  ["instagram_basic", "Identify the connected Instagram business account and profile metadata."],
                  ["instagram_manage_comments", "Read comment events and send public replies to comments."],
                  ["instagram_manage_messages", "Send private replies linked to Instagram comments."],
                  ["pages_show_list", "Let the user select the Facebook Page connected to Instagram."],
                  ["pages_read_engagement", "Read Page linkage and webhook-related account information."],
                  ["business_management", "Resolve business assets during Facebook Login for Business."],
                ].map(([permission, purpose]) => (
                  <div key={permission} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-mono text-sm font-black text-slate-950">{permission}</p>
                    <p className="mt-2 text-sm text-slate-600">{purpose}</p>
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Review evidence</p>
                    <p className="mt-1 text-xs text-slate-600">Show account connection, comment webhook receipt, public reply attempt, and private DM result or Meta code=3.</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <LinkBox label="Privacy Policy" href="/privacy" />
                <LinkBox label="Terms" href="/terms" />
                <LinkBox label="Data Deletion" href="/data-deletion" />
              </div>
              <AdminJsonViewer title="Reviewer instructions block" value={{
                short: "AP3k uses Facebook Login for Business + Page tokens to automate Instagram comment replies and private replies for connected business accounts.",
                warning: "Do not mix instagram_business_* permissions unless migrating to Instagram Login.",
                test: "Connect Instagram, create Any post + keyword campaign, comment from accepted tester, verify public reply and DM status in admin logs.",
              }} />
            </Panel>
          )}

          {tab === "system" && (
            <Panel title="System">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <HealthCard label="App URL" value={process.env.NEXT_PUBLIC_HOST_URL ?? "Not set"} tone={process.env.NEXT_PUBLIC_HOST_URL ? "green" : "amber"} />
                  <HealthCard label="Environment" value={adminEnvironmentLabel()} tone={adminEnvironmentLabel() === "Production" ? "green" : "amber"} />
                  <HealthCard label="Node" value={process.version} />
                  <HealthCard label="Latest commit" value={process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "Unavailable"} />
                  <HealthCard label="Usage enforcement from" value={process.env.USAGE_LIMITS_ENFORCED_FROM ?? "Current calendar month"} tone="slate" />
                {["DATABASE_URL", "NEXT_PUBLIC_HOST_URL", "META_APP_ID", "META_APP_SECRET", "META_VERIFY_TOKEN", "CLERK_SECRET_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"].map((key) => (
                  <HealthCard key={key} label={key} value={process.env[key] ? "Set" : "Missing"} tone={process.env[key] ? "green" : "red"} />
                ))}
              </div>
              <Callout tone="amber" title="Migration note">
                Migration execution is intentionally not available from admin. Use deployment migration docs and CI/CD for schema changes.
              </Callout>
            </Panel>
          )}

          {tab === "danger" && (
            <Panel title="Danger Zone / Audit Logs" description="Destructive controls are soft-first, POST-only, admin-only, typed-confirmed, and audited.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DangerCard title="Suspend user" status="Enabled" detail="Soft suspension pauses campaigns and blocks activation." />
                <DangerCard title="Disconnect Instagram integration" status="Enabled" detail="Soft disconnect marks reconnect-required and pauses campaigns." />
                <DangerCard title="Archive campaign" status="Enabled" detail="Soft archive pauses and hides from normal campaign lists." />
                <DangerCard title="Delete user data" status="Disabled" detail="Requires export, retention, and deletion workflow." />
              </div>
              <Callout tone="green" title="Audit framework enabled">
                AdminAuditLog exists and all admin write actions use the shared audit helper for SUCCESS, FAILED, and BLOCKED outcomes.
              </Callout>
              <div className="mt-4">
                <AuditLogTable logs={auditLogs} />
              </div>
            </Panel>
          )}

          {tab === "audit" && (
            <Panel title="Audit Logs" description="Latest 100 admin action records. Payloads are sanitized before storage and display.">
              <AuditLogTable logs={auditLogs} />
            </Panel>
          )}
        </section>
      </div>
    </main>
  );
}

function PipelineGrid({ pipeline }: { pipeline: ReturnType<typeof buildWebhookPipelineDiagnostics> }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <HealthCard label="WEBHOOK_POST_RECEIVED_RAW" value={pipeline.rawArrived ? "Arrived" : "Not received"} tone={pipeline.rawArrived ? "green" : "red"} />
      <HealthCard label="Signature" value={pipeline.signaturePassed === undefined ? "Not verified" : pipeline.signaturePassed ? "Passed" : "Failed"} tone={pipeline.signaturePassed === false ? "red" : pipeline.signaturePassed ? "green" : "amber"} />
      <HealthCard label="REAL_COMMENT_EVENT" value={pipeline.realCommentClassified ? "Classified" : "Not classified"} tone={pipeline.realCommentClassified ? "green" : "amber"} />
      <HealthCard label="Integration matched" value={pipeline.integrationMatched ? "Yes" : "No"} tone={pipeline.integrationMatched ? "green" : "amber"} />
      <HealthCard label="Media/post matched" value={pipeline.mediaMatched ? "Yes" : "No"} tone={pipeline.mediaMatched ? "green" : "amber"} />
      <HealthCard label="Trigger matched" value={pipeline.triggerMatched ? (pipeline.matchedKeyword || "Yes") : "No"} tone={pipeline.triggerMatched ? "green" : "amber"} />
      <HealthCard label="Public reply attempted" value={pipeline.publicReplyAttempted ? "Yes" : "No"} tone={pipeline.publicReplyAttempted ? "green" : "slate"} />
      <HealthCard label="DM attempted" value={pipeline.dmAttempted ? "Yes" : "No"} tone={pipeline.dmAttempted ? "green" : "slate"} />
      <HealthCard label="Final reason" value={pipeline.finalReason ?? "Unknown"} tone={pipeline.finalReason?.includes("failed") || pipeline.finalReason?.includes("missing") || pipeline.finalReason?.includes("not_deliver") ? "red" : "slate"} />
    </div>
  );
}

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/92 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#101827]/90">
      <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
        <h2 className="text-base font-black text-slate-950 dark:text-white">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function StatCard({ label, value, detail, tone = "slate" }: { label: string; value: ReactNode; detail: string; tone?: Tone }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tonePanel(tone)}`}>
      <p className="text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{detail}</p>
    </div>
  );
}

function HealthCard({ label, value, tone = "slate" }: { label: string; value: ReactNode; tone?: Tone }) {
  return (
    <div className={`rounded-xl border p-3 ${tonePanel(tone)}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
      <div className="mt-1 break-words text-sm font-bold text-slate-950 dark:text-white">{value}</div>
    </div>
  );
}

function UsageCell({ used, limit, blocked }: { used: number; limit: number | "unlimited"; blocked: boolean }) {
  return (
    <div className="space-y-1">
      <Badge tone={blocked ? "red" : "green"}>
        {used.toLocaleString()} / {isUnlimited(limit) ? "Unlimited" : limit.toLocaleString()}
      </Badge>
      {blocked && <p className="text-xs font-bold text-red-600 dark:text-red-300">Limit reached</p>}
    </div>
  );
}

function DataTable({
  headers,
  rows,
  details,
  empty,
}: {
  headers: string[];
  rows: ReactNode[][];
  details?: (index: number) => ReactNode;
  empty: string;
}) {
  if (rows.length === 0) return <EmptyState message={empty} />;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]">
            {headers.map((header) => (
              <th key={header} className="whitespace-nowrap px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <Fragment key={`rowgroup-${index}`}>
              <tr className="border-b border-slate-100 align-top dark:border-white/10">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="max-w-[320px] px-3 py-3 text-slate-700 dark:text-slate-300">
                    {cell}
                  </td>
                ))}
              </tr>
              {details && (
                <tr className="border-b border-slate-100 bg-slate-50/60 dark:border-white/10 dark:bg-white/[0.03]">
                  <td colSpan={headers.length}>{details(index)}</td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PayloadSummary({ payload }: { payload: unknown }) {
  if (!payload || typeof payload !== "object") return <EmptyState message="No diagnostic payload." />;
  const item = payload as Record<string, unknown>;
  const mediaMatching = item.mediaMatching && typeof item.mediaMatching === "object" ? item.mediaMatching as Record<string, unknown> : null;
  const triggerMatching = item.triggerMatching && typeof item.triggerMatching === "object" ? item.triggerMatching as Record<string, unknown> : null;
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
      <p className="font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Diagnostic summary</p>
      <p>object={String(item.object ?? "unknown")} · field={String(item.field ?? "unknown")} · simulation={String(item.simulation ?? false)}</p>
      {mediaMatching && (
        <p>mediaMatch: incoming={String(mediaMatching.incomingMediaId ?? "none")} · matched={Array.isArray(mediaMatching.matchedAutomationIds) ? mediaMatching.matchedAutomationIds.join(",") || "none" : "none"}</p>
      )}
      {triggerMatching && (
        <p>triggerMatch: mode={String(triggerMatching.triggerMode ?? "none")} · keyword={String(triggerMatching.matchedKeyword ?? "none")} · reason={String(triggerMatching.noMatchReason ?? item.simulationResult ?? "matched")}</p>
      )}
    </div>
  );
}

function AdminJsonViewer({ title, value }: { title: string; value: unknown }) {
  return (
    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{title}</summary>
      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-700 dark:text-slate-300">
        {JSON.stringify(sanitizeAdminPayload(value), null, 2)}
      </pre>
    </details>
  );
}

function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-black ${toneBadge(tone)}`}>{children}</span>;
}

function EventBadge({ eventType }: { eventType: string }) {
  const tone: Tone =
    eventType === "REAL_COMMENT_EVENT" || eventType === "REAL_MESSAGE_EVENT" ? "green" :
    eventType === "LOOP_GUARD_TRIGGERED" || eventType === "LOOP_GUARD_PAUSED_CAMPAIGN" ? "red" :
    eventType === "SELF_COMMENT_SKIPPED" || eventType === "COMMENT_SKIPPED" || eventType === "DUPLICATE_SKIPPED" ? "amber" :
    eventType === "SIGNATURE_FAILED" || eventType === "PAYLOAD_INVALID" ? "red" :
    eventType === "META_TEST_EVENT" ? "blue" : "slate";
  return <Badge tone={tone}>{eventType}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const tone: Tone = status === "PROCESSED" || status === "SENT" ? "green" : status === "FAILED" ? "red" : status === "IGNORED" ? "amber" : "slate";
  return <Badge tone={tone}>{status}</Badge>;
}

function Identity({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-bold text-slate-950 dark:text-white">{title}</p>
      {subtitle && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
  );
}

function Mono({ children }: { children: ReactNode }) {
  return <span className="break-all font-mono text-xs text-slate-600 dark:text-slate-300">{children}</span>;
}

function DisabledActions({ labels }: { labels: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((label) => (
        <button key={label} disabled className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-400 dark:border-white/10 dark:bg-white/[0.04]" title="Disabled until audited admin write flow exists">
          {label}
        </button>
      ))}
    </div>
  );
}

function DisabledReason({ label, reason }: { label: string; reason: string }) {
  return (
    <button disabled className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-400 dark:border-white/10 dark:bg-white/[0.04]" title={reason}>
      {label}
    </button>
  );
}

function AdminActionForm({
  action,
  hidden,
  reasonPlaceholder,
  confirmation,
  submitLabel,
  danger = false,
}: {
  action: (formData: FormData) => Promise<unknown>;
  hidden: Record<string, string>;
  reasonPlaceholder: string;
  confirmation?: string;
  submitLabel: string;
  danger?: boolean;
}) {
  return (
    <form action={action as any} className="grid min-w-[180px] gap-1">
      {Object.entries(hidden).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <input name="reason" required placeholder={reasonPlaceholder} className="ap3k-input min-h-8 rounded-lg px-2 text-xs" />
      {confirmation && (
        <input name="confirmation" required placeholder={`Type ${confirmation}`} className="ap3k-input min-h-8 rounded-lg px-2 text-xs" />
      )}
      <button className={`rounded-lg px-2 py-1 text-xs font-bold text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-slate-950 hover:bg-slate-800"}`}>
        {submitLabel}
      </button>
    </form>
  );
}

function ErrorSummary({ error }: { error?: string | null }) {
  if (!error) return <span>None</span>;
  const classified = classifyDeliveryError(error);
  const label = summarizeAdminError(error);
  return (
    <details>
      <summary className="cursor-pointer">
        <Badge tone={classified.tone}>{label}</Badge>
      </summary>
      <p className="mt-2 max-w-[520px] whitespace-pre-wrap break-words text-xs text-slate-500">{error}</p>
    </details>
  );
}

function AuditLogTable({ logs }: { logs: any[] }) {
  return (
    <DataTable
      headers={["Time", "Admin", "Action", "Target", "Status", "Reason", "Details"]}
      rows={logs.map((log) => [
        formatAdminDate(log.createdAt),
        <Identity key="admin" title={log.adminEmail ?? log.adminUserId ?? "Unknown"} />,
        <Badge key="action" tone="blue">{log.action}</Badge>,
        <Identity key="target" title={`${log.targetType}${log.targetLabel ? ` · ${log.targetLabel}` : ""}`} subtitle={log.targetId ? shortenAdminId(log.targetId) : ""} />,
        <Badge key="status" tone={log.status === "SUCCESS" ? "green" : log.status === "BLOCKED" ? "amber" : "red"}>{log.status}</Badge>,
        log.reason ?? "None",
        <AdminJsonViewer key="details" title="Details" value={{ before: log.before, after: log.after, metadata: log.metadata, error: log.error }} />,
      ])}
      empty="No audit logs found."
    />
  );
}

function DangerCard({ title, status, detail }: { title: string; status: "Enabled" | "Disabled"; detail: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
      <div className="flex items-center justify-between gap-2">
        <p className="font-black text-red-900 dark:text-red-200">{title}</p>
        <Badge tone={status === "Enabled" ? "green" : "slate"}>{status}</Badge>
      </div>
      <p className="mt-1 text-sm text-red-700 dark:text-red-300">{detail}</p>
    </div>
  );
}

function Callout({ title, children, tone = "slate" }: { title: string; children: ReactNode; tone?: Tone }) {
  return (
    <div className={`mt-4 rounded-xl border p-4 ${tonePanel(tone)}`}>
      <p className="font-black">{title}</p>
      <p className="mt-1 text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function FilterPills({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {items.map(([label, href]) => (
        <Link key={label} href={href} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]">
          {label}
        </Link>
      ))}
    </div>
  );
}

function LinkBox({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-rf-blue hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]">
      {label}
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">{message}</div>;
}

type Tone = "slate" | "green" | "red" | "amber" | "blue" | "purple";

function tonePanel(tone: Tone) {
  const map: Record<Tone, string> = {
    slate: "border-slate-200 bg-slate-50 text-slate-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
    red: "border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
    amber: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
    blue: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200",
    purple: "border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-200",
  };
  return map[tone];
}

function toneBadge(tone: Tone) {
  const map: Record<Tone, string> = {
    slate: "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
    purple: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300",
  };
  return map[tone];
}
