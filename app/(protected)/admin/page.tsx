"use server";

import { replaySavedWebhookEvent, simulateCommentWebhook } from "@/actions/admin/webhook-simulation";
import { requireOwnerAdmin, maskSecret } from "@/lib/admin";
import { getMetaAdminDiagnostics } from "@/lib/meta-admin-diagnostics";
import { client } from "@/lib/prisma";
import Link from "next/link";
import type { ReactNode } from "react";

type SearchParams = {
  q?: string;
  eventType?: string;
  tab?: string;
};

const TABS = [
  { id: "overview",     label: "Overview" },
  { id: "meta",         label: "Meta Health" },
  { id: "webhooks",     label: "Webhooks" },
  { id: "integrations", label: "Integrations" },
  { id: "campaigns",    label: "Campaigns" },
  { id: "leads",        label: "Leads & Messages" },
  { id: "users",        label: "Users" },
  { id: "system",       label: "System" },
] as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const admin = await requireOwnerAdmin();
  const q = searchParams?.q?.trim();
  const eventType = searchParams?.eventType?.trim();
  const tab = searchParams?.tab ?? "overview";

  const [
    totalUsers,
    totalIntegrations,
    activeIntegrations,
    totalCampaigns,
    activeCampaigns,
    totalWebhookEvents,
    commentWebhooks,
    failedWebhooks,
    totalLeads,
    totalMessageLogs,
    dmSent,
    dmFailed,
    metaDiagnostics,
    lastVerifyGet,
    lastPostRaw,
    lastSignatureFailed,
    lastRealComment,
    lastSimulated,
  ] = await Promise.all([
    client.user.count(),
    client.integrations.count(),
    client.integrations.count({ where: { instagramId: { not: null } } }),
    client.automation.count(),
    client.automation.count({ where: { active: true } }),
    client.webhookEvent.count(),
    client.webhookEvent.count({
      where: { eventType: { in: ["REAL_COMMENT_EVENT", "COMMENT_WEBHOOK_RECEIVED"] } },
    }),
    client.webhookEvent.count({
      where: {
        OR: [
          { status: "FAILED" },
          { eventType: { in: ["SIGNATURE_FAILED", "SIGNATURE_VERIFICATION_FAILED"] } },
          { errorMessage: { not: null } },
        ],
      },
    }),
    client.lead.count(),
    client.messageLog.count(),
    client.messageLog.count({ where: { messageType: "DM", status: "SENT" } }),
    client.messageLog.count({ where: { messageType: "DM", status: "FAILED" } }),
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
      select: { status: true, igAccountId: true, mediaId: true, createdAt: true },
    }),
    client.webhookEvent.findFirst({
      where: { eventSource: "SIMULATED_INTERNAL" },
      orderBy: { createdAt: "desc" },
      select: { status: true, eventType: true, createdAt: true },
    }),
  ]);

  // Tab-specific data — only fetch what the active tab needs
  const [users, integrations, automations, webhookEvents, automationEvents, messageLogs, leads] =
    await Promise.all([
      tab === "users"
        ? client.user.findMany({
            where: q
              ? {
                  OR: [
                    { email: { contains: q, mode: "insensitive" } },
                    { firstname: { contains: q, mode: "insensitive" } },
                    { lastname: { contains: q, mode: "insensitive" } },
                  ],
                }
              : undefined,
            orderBy: { createdAt: "desc" },
            take: 25,
            include: {
              subscription: true,
              integrations: {
                select: {
                  id: true,
                  instagramId: true,
                  instagramUsername: true,
                  token: true,
                  expiresAt: true,
                },
              },
              _count: { select: { automations: true } },
            },
          })
        : Promise.resolve([]),
      tab === "integrations"
        ? client.integrations.findMany({
            where: q
              ? {
                  OR: [
                    { instagramUsername: { contains: q, mode: "insensitive" } },
                    { instagramId: { contains: q } },
                    { User: { email: { contains: q, mode: "insensitive" } } },
                  ],
                }
              : undefined,
            orderBy: { createdAt: "desc" },
            take: 25,
            include: { User: { select: { email: true, clerkId: true } } },
          })
        : Promise.resolve([]),
      tab === "campaigns"
        ? client.automation.findMany({
            where: q
              ? {
                  OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { User: { email: { contains: q, mode: "insensitive" } } },
                  ],
                }
              : undefined,
            orderBy: { createdAt: "desc" },
            take: 25,
            include: {
              User: { select: { email: true, clerkId: true } },
              _count: { select: { keywords: true, leads: true, messageLogs: true } },
            },
          })
        : Promise.resolve([]),
      tab === "webhooks"
        ? client.webhookEvent.findMany({
            where: {
              ...(eventType ? { eventType } : {}),
              ...(q
                ? {
                    OR: [
                      { eventType: { contains: q, mode: "insensitive" } },
                      { igAccountId: { contains: q } },
                      { mediaId: { contains: q } },
                      { commentId: { contains: q } },
                      { errorMessage: { contains: q, mode: "insensitive" } },
                    ],
                  }
                : {}),
            },
            orderBy: { createdAt: "desc" },
            take: 50,
          })
        : Promise.resolve([]),
      tab === "leads"
        ? client.automationEvent.findMany({
            orderBy: { createdAt: "desc" },
            take: 25,
            include: { automation: { select: { name: true } } },
          })
        : Promise.resolve([]),
      tab === "leads"
        ? client.messageLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 25,
            include: { automation: { select: { name: true } } },
          })
        : Promise.resolve([]),
      tab === "leads"
        ? client.lead.findMany({
            orderBy: { createdAt: "desc" },
            take: 25,
            include: { automation: { select: { name: true } } },
          })
        : Promise.resolve([]),
    ]);

  const tabHref = (id: string, extra?: Record<string, string>) => {
    const params = new URLSearchParams({ tab: id, ...(q ? { q } : {}), ...extra });
    return `/admin?${params.toString()}`;
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {/* Header */}
      <div className="border-b border-red-200 bg-red-50 px-6 py-4 lg:px-10">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
              Owner Admin — sensitive production data
            </p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">AP3k admin</h1>
            <p className="mt-0.5 text-xs text-red-700">
              Signed in as {admin.email ?? admin.clerkId}. Tokens and secrets are masked.
            </p>
          </div>
          <Link href="/dashboard" className="text-xs font-bold text-slate-600 hover:text-slate-950">
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* Tab nav */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(({ id, label }) => (
              <Link
                key={id}
                href={tabHref(id)}
                className={[
                  "shrink-0 border-b-2 px-4 py-3 text-sm font-bold transition-colors",
                  tab === id
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-slate-500 hover:text-slate-950",
                ].join(" ")}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-10">

        {/* Global search bar (visible on tabs that support it) */}
        {(tab === "users" || tab === "integrations" || tab === "campaigns" || tab === "webhooks") && (
          <form className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
            <input type="hidden" name="tab" value={tab} />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search users, accounts, campaigns, events…"
              className="min-h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-pink-300"
            />
            {tab === "webhooks" && (
              <input
                name="eventType"
                defaultValue={eventType}
                placeholder="Event type filter"
                className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-pink-300"
              />
            )}
            <button className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white">
              Filter
            </button>
          </form>
        )}

        {/* ─── OVERVIEW TAB ─── */}
        {tab === "overview" && (
          <>
            {/* Stats grid */}
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Users", value: totalUsers, href: tabHref("users") },
                { label: "Integrations", value: `${activeIntegrations}/${totalIntegrations} active`, href: tabHref("integrations") },
                { label: "Campaigns", value: `${activeCampaigns}/${totalCampaigns} active`, href: tabHref("campaigns") },
                { label: "Webhook events", value: totalWebhookEvents, href: tabHref("webhooks") },
                { label: "Comment webhooks", value: commentWebhooks, href: tabHref("webhooks", { eventType: "REAL_COMMENT_EVENT" }) },
                { label: "Failed webhooks", value: failedWebhooks, href: tabHref("webhooks") },
                { label: "Leads", value: totalLeads, href: tabHref("leads") },
                { label: "DM sent/failed", value: `${dmSent}/${dmFailed}`, href: tabHref("leads") },
              ].map(({ label, value, href }) => (
                <Link key={label} href={href} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                  <p className="text-2xl font-black">{value}</p>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
                </Link>
              ))}
            </section>

            {/* Delivery gap warning */}
            {lastPostRaw && lastSimulated && !lastRealComment && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-600">
                  Delivery Gap Detected
                </p>
                <h2 className="mt-2 text-xl font-black text-amber-900">
                  AP3k is reachable — but no real Instagram comment has arrived
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-amber-800">
                  The webhook route received data and the internal self-test passed, but no{" "}
                  <strong>real</strong> comment event from Meta has been recorded. This is almost
                  always a Meta-side configuration issue, not an AP3k code issue.
                </p>
                <p className="mt-3 text-sm font-bold text-amber-900">Most likely causes:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
                  <li>App is in Development mode and the commenter is not an accepted App Tester or Instagram Tester.</li>
                  <li>Wrong webhook product selected — do <strong>not</strong> use the &quot;User&quot; object; use Instagram or Page.</li>
                  <li>comments and messages fields not subscribed in Meta Developers.</li>
                  <li>Comment was made on media not owned by @{metaDiagnostics.integration?.instagramUsername ?? "ceptice"}.</li>
                  <li>Commenter is the connected account owner (owner comments do not trigger webhooks).</li>
                </ul>
              </div>
            )}

            {/* Real comment delivery checklist */}
            <AdminSection title="Real Comment Delivery Checklist">
              <div className="p-4 text-sm">
                <p className="mb-4 text-xs text-slate-500">
                  Every item below must be true for real Instagram comments to reach AP3k.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <ChecklistItem
                    label="App mode — Live or tester accepted"
                    status={lastRealComment ? "ok" : "warn"}
                    detail="App must be Live, OR the commenter must be added as an App Tester in Meta Developers → App Roles → Testers."
                  />
                  <ChecklistItem
                    label="Correct webhook object selected"
                    status={lastRealComment ? "ok" : "warn"}
                    detail="Do NOT use the 'User' object for Instagram comment automation. Use the Instagram or Page object."
                  />
                  <ChecklistItem
                    label="'comments' field subscribed"
                    status={metaDiagnostics.commentsSubscribed ? "ok" : lastRealComment ? "ok" : "error"}
                    detail="In Meta Developers → Instagram API → Webhooks, the 'comments' field must be subscribed."
                  />
                  <ChecklistItem
                    label="'messages' field subscribed"
                    status={metaDiagnostics.messagesSubscribed ? "ok" : lastRealComment ? "ok" : "warn"}
                    detail="The 'messages' field must be subscribed for DM-related webhooks."
                  />
                  <ChecklistItem
                    label="Commenter is not the account owner"
                    status="info"
                    detail="The IG account owner commenting on their own post does not trigger webhooks. Use a separate tester account."
                  />
                  <ChecklistItem
                    label={`Comment on media owned by @${metaDiagnostics.integration?.instagramUsername ?? "connected account"}`}
                    status="info"
                    detail={`Comment must be on a real post or Reel owned by @${metaDiagnostics.integration?.instagramUsername ?? "the connected Instagram account"}.`}
                  />
                  <ChecklistItem
                    label="Connected account is Business or Creator"
                    status={metaDiagnostics.integration?.igAccountSource === "instagram_business_account" ? "ok" : "warn"}
                    detail={`IG account source: ${metaDiagnostics.integration?.igAccountSource ?? "unknown"}. Must be instagram_business_account.`}
                  />
                  <ChecklistItem
                    label="Webhook GET verify confirmed"
                    status={lastVerifyGet?.status === "PROCESSED" ? "ok" : "warn"}
                    detail={lastVerifyGet ? `Last verify: ${lastVerifyGet.status} at ${new Date(lastVerifyGet.createdAt).toLocaleString()}` : "No GET verify recorded yet."}
                  />
                  <ChecklistItem
                    label="Route receives POSTs"
                    status={lastPostRaw ? "ok" : "error"}
                    detail={lastPostRaw ? `Last POST raw at ${new Date(lastPostRaw.createdAt).toLocaleString()}` : "No POST received yet. Route may not be reachable from Meta."}
                  />
                  <ChecklistItem
                    label="Signature verification passing"
                    status={lastSignatureFailed && !lastRealComment ? "error" : "ok"}
                    detail={lastSignatureFailed ? `Last failure at ${new Date(lastSignatureFailed.createdAt).toLocaleString()}: ${lastSignatureFailed.errorMessage ?? "unknown reason"}` : "No recent signature failures."}
                  />
                  <ChecklistItem
                    label="Subscription mode"
                    status={metaDiagnostics.subscriptionMode === "API_SUBSCRIBED" ? "ok" : metaDiagnostics.subscriptionMode === "META_DASHBOARD_MANAGED" ? "warn" : "error"}
                    detail={metaDiagnostics.subscriptionMode === "META_DASHBOARD_MANAGED"
                      ? "API subscription blocked (pages_manage_metadata not available). Confirm webhook subscription toggle is manually ON in Meta Developers."
                      : metaDiagnostics.subscriptionMode === "API_SUBSCRIBED"
                      ? "API subscription active."
                      : `Subscription mode: ${metaDiagnostics.subscriptionMode ?? "unknown"}`}
                  />
                  <ChecklistItem
                    label="At least one active campaign"
                    status={activeCampaigns > 0 ? "ok" : "warn"}
                    detail={activeCampaigns > 0 ? `${activeCampaigns} active campaign(s) found.` : "No active campaigns. Create and activate a campaign before testing."}
                  />
                </div>
                <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs leading-relaxed text-blue-800">
                  <p className="font-bold">Quick test path for @{metaDiagnostics.integration?.instagramUsername ?? "ceptice"}:</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-4">
                    <li>Create an active campaign — trigger: Any post, keyword: <code className="rounded bg-blue-100 px-1 font-mono">ai</code>, matching: CONTAINS.</li>
                    <li>From a separate tester account, comment <code className="rounded bg-blue-100 px-1 font-mono">ai</code> on any post owned by @{metaDiagnostics.integration?.instagramUsername ?? "ceptice"}.</li>
                    <li>Wait 30–60 seconds for Meta to deliver the webhook.</li>
                    <li>Refresh this page and check the checklist items above.</li>
                  </ol>
                </div>
              </div>
            </AdminSection>
          </>
        )}

        {/* ─── META HEALTH TAB ─── */}
        {tab === "meta" && (
          <AdminSection title="Meta Delivery Diagnostics">
            <div className="grid gap-3 p-4 text-sm md:grid-cols-3">
              <HealthCell label="Connected account" value={
                metaDiagnostics.integration?.instagramUsername
                  ? `@${metaDiagnostics.integration.instagramUsername}`
                  : "Not connected"
              } />
              <HealthCell label="Selected Page name" value={metaDiagnostics.integration?.pageName ?? "none"} />
              <HealthCell label="Facebook Page ID" value={metaDiagnostics.integration?.pageId ?? "none"} />
              <HealthCell label="IG business account ID" value={metaDiagnostics.integration?.instagramId ?? "none"} />
              <HealthCell label="IG account source" value={metaDiagnostics.integration?.igAccountSource ?? "none"} />
              <HealthCell label="Page resolution" value={
                metaDiagnostics.integration?.oauthResolutionDiagnostics
                  ? JSON.stringify(metaDiagnostics.integration.oauthResolutionDiagnostics)
                  : "none"
              } />
              <HealthCell label="OAuth state" value={metaDiagnostics.oauthState} tone={metaDiagnostics.oauthState === "oauth_success" ? "green" : "red"} />
              <HealthCell label="Page token valid" value={metaDiagnostics.tokenValid ? "yes" : "no"} tone={metaDiagnostics.tokenValid ? "green" : "red"} />
              <HealthCell label="Page subscribed" value={metaDiagnostics.subscribedAppsActive ? "yes" : "no"} tone={metaDiagnostics.subscribedAppsActive ? "green" : "red"} />
              <HealthCell label="comments subscribed" value={metaDiagnostics.commentsSubscribed ? "yes" : "no"} tone={metaDiagnostics.commentsSubscribed ? "green" : "red"} />
              <HealthCell label="messages subscribed" value={metaDiagnostics.messagesSubscribed ? "yes" : "no"} tone={metaDiagnostics.messagesSubscribed ? "green" : "red"} />
              <HealthCell label="Token expires at" value={metaDiagnostics.integration?.expiresAt ? new Date(metaDiagnostics.integration.expiresAt).toLocaleString() : "unknown"} />
              <HealthCell label="Webhook subscription last attempted" value={metaDiagnostics.integration?.webhookSubscriptionLastAttemptedAt ? new Date(metaDiagnostics.integration.webhookSubscriptionLastAttemptedAt).toLocaleString() : "never"} />
              <HealthCell label="Webhook subscription stored result" value={
                metaDiagnostics.integration?.webhookSubscriptionSubscribed === null ||
                metaDiagnostics.integration?.webhookSubscriptionSubscribed === undefined
                  ? "unknown"
                  : `${metaDiagnostics.integration.webhookSubscriptionSubscribed ? "success" : "failure"}${
                      metaDiagnostics.integration.webhookSubscriptionStatusCode
                        ? ` · ${metaDiagnostics.integration.webhookSubscriptionStatusCode}`
                        : ""
                    }${metaDiagnostics.integration.webhookSubscriptionError ? ` · ${metaDiagnostics.integration.webhookSubscriptionError}` : ""}`
              } />
              <HealthCell label="OAuth last error" value={
                metaDiagnostics.integration?.oauthLastError
                  ? `${metaDiagnostics.integration.oauthLastError} · ${
                      metaDiagnostics.integration.oauthLastErrorSource ?? "unknown_source"
                    }${
                      metaDiagnostics.integration.oauthLastErrorAt
                        ? ` · ${new Date(metaDiagnostics.integration.oauthLastErrorAt).toLocaleString()}`
                        : ""
                    }`
                  : "none"
              } tone={metaDiagnostics.integration?.oauthLastError ? "red" : "green"} />
              <HealthCell label="Token scopes" value={metaDiagnostics.tokenScopes.length ? metaDiagnostics.tokenScopes.join(", ") : metaDiagnostics.tokenScopesStatus} />
              <HealthCell label="Canonical OAuth product" value={metaDiagnostics.tokenHealth.config.product} />
              <HealthCell label="Requested OAuth scopes" value={metaDiagnostics.tokenHealth.config.requestedScopes.join(", ")} />
              <HealthCell label="Rejected legacy scopes" value={metaDiagnostics.tokenHealth.config.rejectedScopes.join(", ")} />
              <HealthCell label="Canonical app ID source" value={metaDiagnostics.tokenHealth.config.appIdSource} tone={metaDiagnostics.tokenHealth.config.appIdSource === "META_APP_ID" ? "green" : "red"} />
              <HealthCell label="Canonical secret source" value={metaDiagnostics.tokenHealth.config.appSecretSource} tone={metaDiagnostics.tokenHealth.config.appSecretSource === "META_APP_SECRET" ? "green" : "red"} />
              <HealthCell label="API endpoint family" value={metaDiagnostics.tokenHealth.config.apiEndpointFamily} tone={metaDiagnostics.tokenHealth.config.apiEndpointFamily === "facebook_graph_instagram_business" ? "green" : "red"} />
              <HealthCell label="debug_token status" value={metaDiagnostics.tokenHealth.debugTokenStatus ?? "unknown"} tone={metaDiagnostics.tokenHealth.debugTokenStatus === "ok" ? "green" : "amber"} />
              <HealthCell label="Token app ID" value={metaDiagnostics.tokenHealth.tokenAppId ?? "unavailable"} tone={metaDiagnostics.tokenHealth.tokenBelongsToCurrentApp ? "green" : "amber"} />
              <HealthCell label="Token type" value={metaDiagnostics.tokenHealth.tokenType} />
              <HealthCell label="Issued by app" value={metaDiagnostics.tokenHealth.issuedByApp ?? "unavailable"} />
              <HealthCell label="Required scopes" value={metaDiagnostics.tokenHealth.requiredScopesPresent ? "present" : `missing ${metaDiagnostics.tokenHealth.missingScopes.join(", ")}`} tone={metaDiagnostics.tokenHealth.requiredScopesPresent ? "green" : "red"} />
              <HealthCell label="IG account linkage" value={metaDiagnostics.tokenHealth.igAccountLinked ? "matches integration" : "not confirmed"} tone={metaDiagnostics.tokenHealth.igAccountLinked ? "green" : "red"} />
              <HealthCell label="Auth diagnostics" value={metaDiagnostics.tokenHealth.diagnostics.length ? metaDiagnostics.tokenHealth.diagnostics.join(", ") : "none"} tone={metaDiagnostics.tokenHealth.diagnostics.length ? "amber" : "green"} />
              <HealthCell label="Last 24h simulated" value={String(metaDiagnostics.last24h.simulatedEvents)} />
              <HealthCell label="Last 24h real Meta" value={String(metaDiagnostics.last24h.realMetaEvents)} />
              <HealthCell label="Last 24h failed signatures" value={String(metaDiagnostics.last24h.failedSignatures)} tone={metaDiagnostics.last24h.failedSignatures ? "red" : "green"} />
              <HealthCell label="Last 24h ignored" value={String(metaDiagnostics.last24h.ignoredPayloads)} />
              <HealthCell label="Last 24h keyword matched" value={String(metaDiagnostics.last24h.keywordMatched)} />
              <HealthCell label="Last 24h DM sent/failed" value={`${metaDiagnostics.last24h.dmSent}/${metaDiagnostics.last24h.dmFailed}`} tone={metaDiagnostics.last24h.dmFailed ? "amber" : "green"} />
              <HealthCell label="App mode" value={`${metaDiagnostics.appMode}${metaDiagnostics.appModeNote ? " - verify in Meta dashboard" : ""}`} />
              <HealthCell label="Last real webhook" value={metaDiagnostics.lastRealWebhookAt ? new Date(metaDiagnostics.lastRealWebhookAt).toLocaleString() : "none yet"} tone={metaDiagnostics.lastRealWebhookAt ? "green" : "amber"} />
              <HealthCell label="Last failure" value={metaDiagnostics.lastFailureReason ?? "none"} />
              <HealthCell label="Subscription status" value={metaDiagnostics.subscribedAppsStatus ?? "unknown"} />
              <HealthCell
                label="Subscription mode"
                value={metaDiagnostics.subscriptionMode ?? "UNKNOWN"}
                tone={
                  metaDiagnostics.subscriptionMode === "API_SUBSCRIBED" ? "green" :
                  metaDiagnostics.subscriptionMode === "META_DASHBOARD_MANAGED" ? "amber" :
                  metaDiagnostics.subscriptionMode === "FAILED" ? "red" : "slate"
                }
              />
              <HealthCell
                label="business_management requested"
                value={metaDiagnostics.tokenHealth.config.requestedScopes.includes("business_management") ? "yes" : "no"}
                tone={metaDiagnostics.tokenHealth.config.requestedScopes.includes("business_management") ? "green" : "red"}
              />
              <HealthCell
                label="business_management granted"
                value={
                  metaDiagnostics.tokenHealth.tokenScopes.length > 0
                    ? metaDiagnostics.tokenHealth.tokenScopes.includes("business_management") ? "yes" : "no"
                    : "scopes unavailable"
                }
                tone={
                  metaDiagnostics.tokenHealth.tokenScopes.includes("business_management") ? "green" : "amber"
                }
              />
              <HealthCell
                label="Last subscription error"
                value={metaDiagnostics.integration?.webhookSubscriptionError ?? "none"}
                tone={metaDiagnostics.integration?.webhookSubscriptionError ? "amber" : "green"}
              />
            </div>
          </AdminSection>
        )}

        {/* ─── WEBHOOKS TAB ─── */}
        {tab === "webhooks" && (
          <>
            <AdminSection title="Webhook Delivery Status">
              <div className="grid gap-3 p-4 text-sm md:grid-cols-3">
                <HealthCell
                  label="Callback URL"
                  value="https://ap3k.com/api/webhooks/meta"
                  tone="slate"
                />
                <HealthCell
                  label="Last GET verify"
                  value={
                    lastVerifyGet
                      ? `${lastVerifyGet.status} · token_match=${(lastVerifyGet.payload as any)?.tokenMatch ?? "unknown"} · ${new Date(lastVerifyGet.createdAt).toLocaleString()}`
                      : "never received"
                  }
                  tone={lastVerifyGet?.status === "PROCESSED" ? "green" : lastVerifyGet ? "red" : "amber"}
                />
                <HealthCell
                  label="Last POST raw received"
                  value={
                    lastPostRaw
                      ? `hasSignature=${(lastPostRaw.payload as any)?.hasSignature ?? "?"} · object=${(lastPostRaw.payload as any)?.object ?? "none"} · ${new Date(lastPostRaw.createdAt).toLocaleString()}`
                      : "never received"
                  }
                  tone={lastPostRaw ? "green" : "red"}
                />
                <HealthCell
                  label="Last signature failed"
                  value={
                    lastSignatureFailed
                      ? `${lastSignatureFailed.errorMessage ?? "unknown"} · ${new Date(lastSignatureFailed.createdAt).toLocaleString()}`
                      : "none"
                  }
                  tone={lastSignatureFailed ? "red" : "green"}
                />
                <HealthCell
                  label="Last real comment"
                  value={
                    lastRealComment
                      ? `${lastRealComment.status} · pageId=${lastRealComment.igAccountId ?? "none"} · ${new Date(lastRealComment.createdAt).toLocaleString()}`
                      : "none yet"
                  }
                  tone={lastRealComment ? "green" : "amber"}
                />
                <HealthCell
                  label="Last simulated"
                  value={
                    lastSimulated
                      ? `${lastSimulated.eventType} · ${new Date(lastSimulated.createdAt).toLocaleString()}`
                      : "none"
                  }
                  tone={lastSimulated ? "green" : "slate"}
                />
              </div>

              <div className="border-t border-slate-100 p-4 text-sm">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Manual Meta dashboard steps
                </p>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-700">
                  <li>Meta Developers → AP3k app → Instagram API → API setup with Facebook login</li>
                  <li>Open <strong>Configure webhooks</strong></li>
                  <li>Set Callback URL to <code className="rounded bg-slate-100 px-1 font-mono text-xs">https://ap3k.com/api/webhooks/meta</code></li>
                  <li>Set Verify Token to the value of <code className="rounded bg-slate-100 px-1 font-mono text-xs">META_VERIFY_TOKEN</code> in Vercel env</li>
                  <li>Click <strong>Verify and Save</strong> — triggers a GET that should appear above as PROCESSED</li>
                  <li>Subscribe <strong>comments</strong> and <strong>messages</strong> fields</li>
                  <li>Test from a separate accepted tester account commenting on a post owned by @{metaDiagnostics.integration?.instagramUsername ?? "ceptice"}</li>
                </ol>
              </div>

              <div className="border-t border-slate-100 p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  Signed self-test
                </p>
                <form
                  method="POST"
                  action="/api/admin/webhook-self-test"
                  className="mt-3 flex items-center gap-3"
                >
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white"
                  >
                    Run webhook self-test
                  </button>
                  <p className="text-xs text-slate-500">
                    Sends a signed INTERNAL_SELF_TEST payload to the webhook route. Does not send DMs.
                  </p>
                </form>
              </div>
            </AdminSection>

            <AdminSection title="Simulate Comment Webhook">
              <form action={simulateCommentWebhook} className="grid gap-3 p-4 text-sm md:grid-cols-5">
                <input
                  name="igAccountId"
                  defaultValue={metaDiagnostics.integration?.pageId ?? metaDiagnostics.integration?.webhookAccountId ?? ""}
                  placeholder="Facebook Page ID"
                  className="min-h-10 rounded-xl border border-slate-200 px-3 outline-none focus:border-pink-300"
                />
                <input
                  name="mediaId"
                  defaultValue="ANY_TEST_MEDIA"
                  placeholder="Media ID"
                  className="min-h-10 rounded-xl border border-slate-200 px-3 outline-none focus:border-pink-300"
                />
                <input
                  name="commenterId"
                  defaultValue="simulated_commenter"
                  placeholder="Commenter ID"
                  className="min-h-10 rounded-xl border border-slate-200 px-3 outline-none focus:border-pink-300"
                />
                <input
                  name="text"
                  defaultValue="ai"
                  placeholder="Comment text"
                  className="min-h-10 rounded-xl border border-slate-200 px-3 outline-none focus:border-pink-300"
                />
                <button className="rounded-xl bg-slate-950 px-4 py-2 font-bold text-white">
                  Simulate
                </button>
                <p className="md:col-span-5 text-xs text-slate-500">
                  Uses the same matching path after signature/classification. Records a simulated DM failure — never sends to Meta.
                </p>
              </form>
            </AdminSection>

            <AdminSection title="Webhook Events">
              {(webhookEvents as any[]).map((event) => (
                <AdminRow key={event.id}>
                  <span><EventBadge eventType={event.eventType} /></span>
                  <span><StatusBadge status={event.status} /></span>
                  <span className="text-xs text-slate-500">{event.eventSource} · {event.igAccountId ?? "No Page"}</span>
                  <span className="text-xs text-slate-500">{event.commentId ?? event.mediaId ?? "No object ID"}</span>
                  <span className="text-xs">
                    {event.errorMessage ?? new Date(event.createdAt).toLocaleString()}
                    <PayloadSummary payload={event.payload} />
                    <PayloadRaw payload={event.payload} />
                    {event.eventSource === "META_REAL" && (
                      <form action={replaySavedWebhookEvent} className="mt-2">
                        <input type="hidden" name="eventId" value={event.id} />
                        <button className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50">
                          Replay as simulation
                        </button>
                      </form>
                    )}
                  </span>
                </AdminRow>
              ))}
              {(webhookEvents as any[]).length === 0 && (
                <p className="p-4 text-sm text-slate-500">No webhook events found.</p>
              )}
            </AdminSection>
          </>
        )}

        {/* ─── INTEGRATIONS TAB ─── */}
        {tab === "integrations" && (
          <AdminSection title="Integrations">
            {(integrations as any[]).map((integration) => (
              <AdminRow key={integration.id}>
                <span>{integration.User?.email ?? "Unknown user"}</span>
                <span>{integration.instagramUsername ? `@${integration.instagramUsername}` : "No username"}</span>
                <span>{integration.instagramId ?? "No IG ID"}</span>
                <span>{maskSecret(integration.token)} · page token</span>
                <span>{integration.expiresAt ? new Date(integration.expiresAt).toLocaleDateString() : "No expiry"}</span>
              </AdminRow>
            ))}
            {(integrations as any[]).length === 0 && (
              <p className="p-4 text-sm text-slate-500">No integrations found.</p>
            )}
          </AdminSection>
        )}

        {/* ─── CAMPAIGNS TAB ─── */}
        {tab === "campaigns" && (
          <AdminSection title="Campaigns">
            {(automations as any[]).map((automation) => (
              <AdminRow key={automation.id}>
                <span>{automation.name}</span>
                <span>{automation.User?.email ?? "Unknown user"}</span>
                <span>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${automation.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                    {automation.active ? "Active" : "Paused"}
                  </span>
                </span>
                <span>{automation.matchingMode}</span>
                <span>{automation._count.keywords} keywords · {automation._count.leads} leads · {automation._count.messageLogs} logs</span>
              </AdminRow>
            ))}
            {(automations as any[]).length === 0 && (
              <p className="p-4 text-sm text-slate-500">No campaigns found.</p>
            )}
          </AdminSection>
        )}

        {/* ─── LEADS & MESSAGES TAB ─── */}
        {tab === "leads" && (
          <>
            <AdminSection title="Leads">
              {(leads as any[]).map((lead) => (
                <AdminRow key={lead.id}>
                  <span>{lead.igUsername ? `@${lead.igUsername}` : lead.igUserId}</span>
                  <span>{lead.automation.name}</span>
                  <span>{lead.mediaId ?? "No media"}</span>
                  <span>{lead.commentText?.slice(0, 80) ?? "No text"}</span>
                  <span>{new Date(lead.createdAt).toLocaleString()}</span>
                </AdminRow>
              ))}
              {(leads as any[]).length === 0 && (
                <p className="p-4 text-sm text-slate-500">No leads yet.</p>
              )}
            </AdminSection>

            <AdminSection title="Message Logs">
              {(messageLogs as any[]).map((log) => (
                <AdminRow key={log.id}>
                  <span>{log.messageType}</span>
                  <span><StatusBadge status={log.status} /></span>
                  <span>{log.automation.name}</span>
                  <span>{log.commentId ?? log.recipientIgId}</span>
                  <span>{log.errorMessage ?? new Date(log.createdAt).toLocaleString()}</span>
                </AdminRow>
              ))}
              {(messageLogs as any[]).length === 0 && (
                <p className="p-4 text-sm text-slate-500">No message logs yet.</p>
              )}
            </AdminSection>

            <AdminSection title="Automation Events">
              {(automationEvents as any[]).map((event) => (
                <AdminRow key={event.id}>
                  <span>{event.eventType}</span>
                  <span>{event.automation.name}</span>
                  <span>{event.keyword ?? "No keyword"}</span>
                  <span>{event.commentId ?? event.mediaId ?? "No object ID"}</span>
                  <span>{new Date(event.createdAt).toLocaleString()}</span>
                </AdminRow>
              ))}
              {(automationEvents as any[]).length === 0 && (
                <p className="p-4 text-sm text-slate-500">No automation events yet.</p>
              )}
            </AdminSection>
          </>
        )}

        {/* ─── USERS TAB ─── */}
        {tab === "users" && (
          <AdminSection title="Users">
            {(users as any[]).map((user) => (
              <AdminRow key={user.id}>
                <span>{user.email}</span>
                <span>{user.firstname} {user.lastname}</span>
                <span>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-bold ${user.subscription?.plan === "PRO" ? "border-purple-200 bg-purple-50 text-purple-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                    {user.subscription?.plan ?? "FREE"}
                  </span>
                </span>
                <span>{user._count.automations} campaigns</span>
                <span>{user.integrations[0]?.instagramUsername ? `@${user.integrations[0].instagramUsername}` : "No IG"}</span>
              </AdminRow>
            ))}
            {(users as any[]).length === 0 && (
              <p className="p-4 text-sm text-slate-500">No users found.</p>
            )}
          </AdminSection>
        )}

        {/* ─── SYSTEM TAB ─── */}
        {tab === "system" && (
          <div className="space-y-6">
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Total users", totalUsers],
                ["Total integrations", totalIntegrations],
                ["Total campaigns", totalCampaigns],
                ["Total webhook events", totalWebhookEvents],
                ["Total leads", totalLeads],
                ["Total message logs", totalMessageLogs],
                ["DM sent", dmSent],
                ["DM failed", dmFailed],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-2xl font-black">{value}</p>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
                </div>
              ))}
            </section>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-black">Database health</h2>
              <p className="mt-2 text-sm text-slate-600">
                Model counts above are live. Migration status is intentionally not exposed in this UI.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-black">Required Vercel environment variables</h2>
              <div className="mt-3 grid gap-2 text-xs font-mono">
                {[
                  ["META_VERIFY_TOKEN", Boolean(process.env.META_VERIFY_TOKEN)],
                  ["META_APP_ID", Boolean(process.env.META_APP_ID)],
                  ["META_APP_SECRET", Boolean(process.env.META_APP_SECRET)],
                  ["DATABASE_URL", Boolean(process.env.DATABASE_URL)],
                  ["NEXT_PUBLIC_HOST_URL", Boolean(process.env.NEXT_PUBLIC_HOST_URL)],
                  ["CLERK_SECRET_KEY", Boolean(process.env.CLERK_SECRET_KEY)],
                ].map(([name, present]) => (
                  <div key={name as string} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <span className="font-mono text-slate-700">{name as string}</span>
                    <span className={`font-black ${present ? "text-emerald-600" : "text-red-600"}`}>
                      {present ? "set" : "MISSING"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

function AdminSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-600">
        {title}
      </h2>
      <div className="divide-y divide-slate-100">{children}</div>
    </section>
  );
}

function AdminRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-2 px-4 py-3 text-sm md:grid-cols-5">
      {children}
    </div>
  );
}

function EventBadge({ eventType }: { eventType: string }) {
  const className =
    eventType === "REAL_COMMENT_EVENT" || eventType === "REAL_MESSAGE_EVENT"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : eventType === "META_TEST_EVENT"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : eventType === "SIGNATURE_FAILED" || eventType === "PAYLOAD_INVALID"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-black ${className}`}>
      {eventType}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "PROCESSED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "FAILED"
      ? "border-red-200 bg-red-50 text-red-700"
      : status === "IGNORED"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-black ${className}`}>
      {status}
    </span>
  );
}

function PayloadSummary({ payload }: { payload: unknown }) {
  if (!payload || typeof payload !== "object") return null;
  const item = payload as Record<string, unknown>;
  const bits = [
    item.object ? `object=${item.object}` : null,
    item.field ? `field=${item.field}` : null,
    item.entryCount !== undefined ? `entries=${item.entryCount}` : null,
    item.changesCount !== undefined ? `changes=${item.changesCount}` : null,
    item.appearsSynthetic !== undefined ? `synthetic=${item.appearsSynthetic}` : null,
    item.hasCommentText !== undefined ? `text=${item.hasCommentText}` : null,
  ].filter(Boolean);
  const mediaMatching =
    item.mediaMatching && typeof item.mediaMatching === "object"
      ? (item.mediaMatching as Record<string, unknown>)
      : null;

  if (bits.length === 0 && !mediaMatching) return null;

  return (
    <div className="mt-1 space-y-1 break-words font-mono text-[11px] text-slate-500">
      {bits.length > 0 && <p>{bits.join(" · ")}</p>}
      {mediaMatching && (
        <p>
          mediaMatch: incoming={String(mediaMatching.incomingMediaId ?? "none")} ·
          normalized={String(mediaMatching.normalizedIncomingMediaId ?? "none")} ·
          matched={Array.isArray(mediaMatching.matchedAutomationIds)
            ? mediaMatching.matchedAutomationIds.join(",") || "none"
            : "none"} ·
          stored={Array.isArray(mediaMatching.storedPostIds)
            ? mediaMatching.storedPostIds.join(",") || "none"
            : "none"}
        </p>
      )}
    </div>
  );
}

function PayloadRaw({ payload }: { payload: unknown }) {
  if (!payload || typeof payload !== "object") return null;
  return (
    <details className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
      <summary className="cursor-pointer text-[11px] font-bold text-slate-600">
        Sanitized payload
      </summary>
      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-[11px] text-slate-700">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </details>
  );
}

function HealthCell({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "green" | "red" | "amber";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "red"
      ? "border-red-200 bg-red-50"
      : tone === "amber"
      ? "border-amber-200 bg-amber-50"
      : "border-slate-200 bg-slate-50";

  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ChecklistItem({
  label,
  detail,
  status,
}: {
  label: string;
  detail: string;
  status: "ok" | "warn" | "error" | "info";
}) {
  const dot =
    status === "ok"
      ? "bg-emerald-500"
      : status === "error"
      ? "bg-red-500"
      : status === "warn"
      ? "bg-amber-400"
      : "bg-blue-400";
  const border =
    status === "ok"
      ? "border-emerald-100"
      : status === "error"
      ? "border-red-200"
      : status === "warn"
      ? "border-amber-200"
      : "border-blue-100";

  return (
    <div className={`rounded-xl border p-3 ${border}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${dot}`} />
        <p className="text-xs font-black text-slate-950">{label}</p>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{detail}</p>
    </div>
  );
}
