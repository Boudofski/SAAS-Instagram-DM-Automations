"use server";

import { replaySavedWebhookEvent, simulateCommentWebhook } from "@/actions/admin/webhook-simulation";
import {
  adminEnvironmentLabel,
  classifyDeliveryError,
  formatAdminDate,
  getTopAdminIssue,
  sanitizeAdminPayload,
  stripeCustomerDashboardUrl,
} from "@/lib/admin-control-center";
import { maskSecret, requireOwnerAdmin } from "@/lib/admin";
import { getMetaAdminDiagnostics } from "@/lib/meta-admin-diagnostics";
import { client } from "@/lib/prisma";
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
] as const;

export default async function AdminPage({ searchParams }: { searchParams?: SearchParams }) {
  const admin = await requireOwnerAdmin();
  const tab = TABS.some((item) => item.id === searchParams?.tab) ? searchParams!.tab! : "overview";
  const q = searchParams?.q?.trim();
  const eventType = searchParams?.eventType?.trim();
  const qUuid = q && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q)
    ? q
    : null;
  const testSince = searchParams?.testSince ? new Date(searchParams.testSince) : null;
  const testSinceValid = Boolean(testSince && !Number.isNaN(testSince.getTime()));
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

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
  });

  const tabHref = (id: string, extra?: Record<string, string>) => {
    const params = new URLSearchParams({
      tab: id,
      ...(q ? { q } : {}),
      ...(eventType && id === "webhooks" ? { eventType } : {}),
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
          integrations: { select: { instagramUsername: true, instagramId: true, pageId: true } },
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
        include: { User: { select: { email: true, clerkId: true } } },
      })
    : [];

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
          token: true,
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
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[1500px] px-5 py-4 lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">AP3k Admin</h1>
                <Badge tone={adminEnvironmentLabel() === "Production" ? "green" : "amber"}>{adminEnvironmentLabel()}</Badge>
                <Badge tone="slate">Read-only control center</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Signed in as <span className="font-bold text-slate-800">{admin.email ?? admin.clerkId}</span> · Last refreshed {formatAdminDate(new Date())}
              </p>
            </div>
            <form className="flex w-full flex-col gap-2 sm:flex-row xl:max-w-2xl">
              <input type="hidden" name="tab" value={tab} />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search current section by email, IG username, campaign, event, comment, media ID"
                className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-pink-300"
              />
              {tab === "webhooks" && (
                <input
                  name="eventType"
                  defaultValue={eventType}
                  placeholder="Event type"
                  className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-pink-300"
                />
              )}
              <button className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white">Search</button>
              <Link href={tabHref(tab)} className="rounded-xl border border-slate-200 px-5 py-2 text-center text-sm font-bold text-slate-700">
                Refresh
              </Link>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-6 px-5 py-6 lg:grid-cols-[250px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {TABS.map((item) => (
              <Link
                key={item.id}
                href={tabHref(item.id)}
                className={[
                  "mb-1 block rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
                  tab === item.id ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
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
            <Panel title="Users" description="Read-only user inventory. Dangerous account actions are disabled until audit logging and typed confirmations exist.">
              <DataTable
                headers={["User", "Clerk ID", "Plan", "Instagram", "Campaigns", "Leads", "Last activity", "Actions"]}
                rows={users.map((user: any) => {
                  const leads = user.automations.reduce((sum: number, automation: any) => sum + automation._count.leads, 0);
                  const lastActivity = user.automations
                    .flatMap((automation: any) => automation.events.map((event: any) => event.createdAt))
                    .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0];
                  return [
                    <Identity key="user" title={user.email} subtitle={`${user.firstname ?? ""} ${user.lastname ?? ""}`.trim() || "No profile name"} />,
                    <Mono key="clerk">{user.clerkId}</Mono>,
                    <Badge key="plan" tone={user.subscription?.plan === "PRO" ? "purple" : "slate"}>{user.subscription?.plan ?? "FREE"}</Badge>,
                    user.integrations[0]?.instagramUsername ? `@${user.integrations[0].instagramUsername}` : "Not connected",
                    String(user._count.automations),
                    String(leads),
                    formatAdminDate(lastActivity),
                    <DisabledActions key="actions" labels={["View details later", "Suspend", "Delete data"]} />,
                  ];
                })}
                empty="No users found."
              />
            </Panel>
          )}

          {tab === "subscriptions" && (
            <Panel title="Subscriptions" description="Read-only subscription view. Stripe write actions are intentionally disabled in this version.">
              <DataTable
                headers={["User", "Plan", "Stripe customer", "Status", "Updated", "Stripe", "Actions"]}
                rows={subscriptions.map((sub: any) => [
                  <Identity key="user" title={sub.User?.email ?? "Unknown user"} subtitle={sub.User?.clerkId ?? "No Clerk ID"} />,
                  <Badge key="plan" tone={sub.plan === "PRO" ? "purple" : "slate"}>{sub.plan}</Badge>,
                  <Mono key="customer">{sub.customerId ?? "No customer"}</Mono>,
                  sub.plan === "PRO" ? <Badge key="active" tone="green">Active/internal PRO</Badge> : <Badge key="free" tone="slate">Free</Badge>,
                  formatAdminDate(sub.updatedAt),
                  sub.customerId && stripeCustomerDashboardUrl(sub.customerId) ? (
                    <a key="stripe" className="font-bold text-rf-blue hover:underline" href={stripeCustomerDashboardUrl(sub.customerId)!} target="_blank" rel="noreferrer">Open Stripe</a>
                  ) : "No link",
                  <DisabledActions key="actions" labels={["Cancel", "Sync", "Override plan"]} />,
                ])}
                empty="No subscription records found."
              />
            </Panel>
          )}

          {tab === "integrations" && (
            <Panel title="Instagram Integrations" description="Tokens are never displayed. Health badges use stored safe metadata and recent event signals.">
              <DataTable
                headers={["Owner", "IG account", "Page", "IG Business ID", "Webhook ID", "Token", "Subscription", "Last error", "Actions"]}
                rows={integrations.map((integration: any) => [
                  <Identity key="owner" title={integration.User?.email ?? "Unknown user"} subtitle={integration.User?.clerkId ?? ""} />,
                  <Identity key="ig" title={integration.instagramUsername ? `@${integration.instagramUsername}` : "No username"} subtitle={integration.igAccountSource ?? "Unknown source"} />,
                  <Identity key="page" title={integration.pageName ?? "No page"} subtitle={integration.pageId ?? "No Page ID"} />,
                  <Mono key="ig-id">{integration.instagramId ?? "Missing"}</Mono>,
                  <Mono key="webhook-id">{integration.webhookAccountId ?? "Missing"}</Mono>,
                  <Badge key="token" tone={integration.token ? "green" : "red"}>{integration.token ? maskSecret(integration.token) : "Missing"}</Badge>,
                  <Badge key="sub" tone={integration.webhookSubscriptionMode === "API_SUBSCRIBED" ? "green" : "amber"}>{integration.webhookSubscriptionMode ?? "Unknown"}</Badge>,
                  integration.oauthLastError ?? integration.webhookSubscriptionError ?? "None",
                  <DisabledActions key="actions" labels={["Disconnect", "Reconnect required", "Resubscribe"]} />,
                ])}
                empty="No integrations found."
              />
            </Panel>
          )}

          {tab === "campaigns" && (
            <Panel title="Campaigns" description="Admin campaign inventory and delivery counters. Editing is linked/read-only here to avoid tenant confusion.">
              <DataTable
                headers={["Owner", "Campaign", "Status", "Trigger", "Post scope", "Replies", "Messages", "Created", "Actions"]}
                rows={campaigns.map((campaign: any) => {
                  const keywords = campaign.triggerMode === "ANY_COMMENT" ? "Any comment" : campaign.keywords.map((kw: any) => kw.word).join(", ") || "No keywords";
                  const postScope = campaign.posts[0]?.postid === "ANY" ? "Any post" : campaign.posts[0]?.postid ?? "No post";
                  const publicReplyEnabled = Boolean(campaign.listener?.commentReply || campaign.listener?.commentReply2 || campaign.listener?.commentReply3);
                  return [
                    campaign.User?.email ?? "Unknown user",
                    <Identity key="campaign" title={campaign.name} subtitle={campaign.id} />,
                    <Badge key="status" tone={campaign.active ? "green" : "slate"}>{campaign.active ? "Active" : "Paused"}</Badge>,
                    <Identity key="trigger" title={campaign.triggerMode === "ANY_COMMENT" ? "Any comment" : "Specific keyword"} subtitle={`${campaign.matchingMode} · ${keywords}`} />,
                    <Mono key="post">{postScope}</Mono>,
                    publicReplyEnabled ? <Badge key="reply" tone="green">Enabled</Badge> : <Badge key="reply" tone="slate">Off</Badge>,
                    `${campaign._count.messageLogs} logs · ${campaign._count.leads} leads`,
                    formatAdminDate(campaign.createdAt),
                    <DisabledActions key="actions" labels={["Activate/pause", "Delete", "Duplicate"]} />,
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
                      <select name="automationId" required className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm">
                        <option value="">Select campaign</option>
                        {campaigns.map((campaign: any) => (
                          <option key={campaign.id} value={campaign.id}>{campaign.name} · {campaign.active ? "active" : "paused"} · {campaign.User?.email ?? "unknown"}</option>
                        ))}
                      </select>
                      <input name="mediaId" defaultValue={(campaigns[0] as any)?.posts?.[0]?.postid === "ANY" ? "ANY_TEST_MEDIA" : (campaigns[0] as any)?.posts?.[0]?.postid ?? "ANY_TEST_MEDIA"} className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Media ID" />
                      <input name="commenterId" defaultValue="simulated_commenter" className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Commenter ID" />
                      <input name="commentText" defaultValue={(campaigns[0] as any)?.keywords?.[0]?.word ?? "ai"} className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Comment text" />
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
            <Panel title="Messages & Replies" description="Delivery logs for public replies and private DM attempts.">
              <DataTable
                headers={["Time", "Owner/Campaign", "Type", "Status", "Endpoint", "Object IDs", "Error", "Action"]}
                rows={messageLogs.map((log: any) => {
                  const classified = classifyDeliveryError(log.errorMessage);
                  return [
                    formatAdminDate(log.createdAt),
                    <Identity key="campaign" title={log.automation?.name ?? "Unknown campaign"} subtitle={log.automation?.User?.email ?? ""} />,
                    <Badge key="type" tone={log.messageType === "DM" ? "purple" : "blue"}>{log.messageType === "DM" ? "PRIVATE_DM" : "PUBLIC_REPLY"}</Badge>,
                    <StatusBadge key="status" status={log.status} />,
                    log.messageType === "DM" ? "ig_business/messages" : "comment/media reply",
                    <Identity key="ids" title={`comment ${log.commentId ?? "n/a"}`} subtitle={`media ${log.mediaId ?? "n/a"}`} />,
                    log.errorMessage ? <Badge key="error" tone={classified.tone}>{classified.label}</Badge> : "None",
                    <DisabledActions key="actions" labels={["View details", "Copy safe error"]} />,
                  ];
                })}
                empty="No message logs found."
              />
            </Panel>
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
            <Panel title="Danger Zone / Audit Logs" description="This first version is read-only. Destructive controls are disabled until AdminAuditLog, typed confirmations, rollback/error handling, and tests are added.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DangerCard title="Delete user data" />
                <DangerCard title="Disconnect Instagram integration" />
                <DangerCard title="Delete campaign" />
                <DangerCard title="Cancel subscription" />
              </div>
              <Callout tone="amber" title="No audit-log migration added">
                No destructive write actions were implemented, so no AdminAuditLog migration was added in this pass.
              </Callout>
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
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-black text-slate-950">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function StatCard({ label, value, detail, tone = "slate" }: { label: string; value: ReactNode; detail: string; tone?: Tone }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tonePanel(tone)}`}>
      <p className="text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </div>
  );
}

function HealthCard({ label, value, tone = "slate" }: { label: string; value: ReactNode; tone?: Tone }) {
  return (
    <div className={`rounded-xl border p-3 ${tonePanel(tone)}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <div className="mt-1 break-words text-sm font-bold text-slate-950">{value}</div>
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
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {headers.map((header) => (
              <th key={header} className="whitespace-nowrap px-3 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <Fragment key={`rowgroup-${index}`}>
              <tr className="border-b border-slate-100 align-top">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="max-w-[320px] px-3 py-3 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
              {details && (
                <tr className="border-b border-slate-100 bg-slate-50/60">
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
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
      <p className="font-black uppercase tracking-[0.12em] text-slate-500">Diagnostic summary</p>
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
    <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.14em] text-slate-500">{title}</summary>
      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-700">
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
      <p className="truncate font-bold text-slate-950">{title}</p>
      {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

function Mono({ children }: { children: ReactNode }) {
  return <span className="break-all font-mono text-xs text-slate-600">{children}</span>;
}

function DisabledActions({ labels }: { labels: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((label) => (
        <button key={label} disabled className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-400" title="Disabled until audited admin write flow exists">
          {label}
        </button>
      ))}
    </div>
  );
}

function DangerCard({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="font-black text-red-900">{title}</p>
      <p className="mt-1 text-sm text-red-700">Disabled. Requires AdminAuditLog, typed confirmation, server admin check, rollback/error handling, and tests.</p>
      <button disabled className="mt-4 cursor-not-allowed rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-300">Disabled</button>
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
        <Link key={label} href={href} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-white">
          {label}
        </Link>
      ))}
    </div>
  );
}

function LinkBox({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-rf-blue hover:bg-white">
      {label}
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">{message}</div>;
}

type Tone = "slate" | "green" | "red" | "amber" | "blue" | "purple";

function tonePanel(tone: Tone) {
  const map: Record<Tone, string> = {
    slate: "border-slate-200 bg-slate-50 text-slate-800",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    red: "border-red-200 bg-red-50 text-red-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    blue: "border-blue-200 bg-blue-50 text-blue-900",
    purple: "border-purple-200 bg-purple-50 text-purple-900",
  };
  return map[tone];
}

function toneBadge(tone: Tone) {
  const map: Record<Tone, string> = {
    slate: "border-slate-200 bg-slate-50 text-slate-600",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
  };
  return map[tone];
}
