import { replaySavedWebhookEvent, simulateCommentWebhook } from "@/actions/admin/webhook-simulation";
import { requireOwnerAdmin, maskSecret } from "@/lib/admin";
import { getMetaAdminDiagnostics } from "@/lib/meta-admin-diagnostics";
import { client } from "@/lib/prisma";
import Link from "next/link";
import type { ReactNode } from "react";

type SearchParams = {
  q?: string;
  eventType?: string;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const admin = await requireOwnerAdmin();
  const q = searchParams?.q?.trim();
  const eventType = searchParams?.eventType?.trim();

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
    users,
    integrations,
    automations,
    webhookEvents,
    automationEvents,
    messageLogs,
    leads,
    metaDiagnostics,
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
    client.user.findMany({
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
    }),
    client.integrations.findMany({
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
    }),
    client.automation.findMany({
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
    }),
    client.webhookEvent.findMany({
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
    }),
    client.automationEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { automation: { select: { name: true } } },
    }),
    client.messageLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { automation: { select: { name: true } } },
    }),
    client.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { automation: { select: { name: true } } },
    }),
    getMetaAdminDiagnostics(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
            Owner Admin — sensitive production data
          </p>
          <h1 className="mt-2 text-2xl font-black">AP3k admin</h1>
          <p className="mt-1 text-sm text-red-700">
            Signed in as {admin.email ?? admin.clerkId}. Tokens and secrets are masked.
          </p>
        </div>

        <form className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search user, Instagram account, campaign, event, media, comment"
            className="min-h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-pink-300"
          />
          <input
            name="eventType"
            defaultValue={eventType}
            placeholder="Event type filter"
            className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-pink-300"
          />
          <button className="rounded-xl bg-slate-950 px-5 py-2 text-sm font-bold text-white">
            Filter
          </button>
        </form>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Users", totalUsers],
            ["Integrations", `${activeIntegrations}/${totalIntegrations} active`],
            ["Campaigns", `${activeCampaigns}/${totalCampaigns} active`],
            ["Webhook events", totalWebhookEvents],
            ["Comment webhooks", commentWebhooks],
            ["Failed webhooks", failedWebhooks],
            ["Leads", totalLeads],
            ["DM sent/failed", `${dmSent}/${dmFailed}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-black">{value}</p>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            </div>
          ))}
        </section>

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
              Owner-only. Uses the same matching path after signature/classification and records a simulated DM failure without sending to Meta.
            </p>
          </form>
        </AdminSection>

        <AdminSection title="Users">
          {users.map((user) => (
            <AdminRow key={user.id}>
              <span>{user.email}</span>
              <span>{user.firstname} {user.lastname}</span>
              <span>{user.subscription?.plan ?? "FREE"}</span>
              <span>{user._count.automations} campaigns</span>
              <span>{user.integrations[0]?.instagramUsername ? `@${user.integrations[0].instagramUsername}` : "No IG"}</span>
            </AdminRow>
          ))}
        </AdminSection>

        <AdminSection title="Integrations">
          {integrations.map((integration) => (
            <AdminRow key={integration.id}>
              <span>{integration.User?.email ?? "Unknown user"}</span>
              <span>{integration.instagramUsername ? `@${integration.instagramUsername}` : "No username"}</span>
              <span>{integration.instagramId ?? "No IG ID"}</span>
              <span>
                {maskSecret(integration.token)} · page token
              </span>
              <span>{integration.expiresAt ? new Date(integration.expiresAt).toLocaleDateString() : "No expiry"}</span>
            </AdminRow>
          ))}
        </AdminSection>

        <AdminSection title="Automations">
          {automations.map((automation) => (
            <AdminRow key={automation.id}>
              <span>{automation.name}</span>
              <span>{automation.User?.email ?? "Unknown user"}</span>
              <span>{automation.active ? "Active" : "Paused"}</span>
              <span>{automation.matchingMode}</span>
              <span>{automation._count.keywords} keywords · {automation._count.leads} leads · {automation._count.messageLogs} logs</span>
            </AdminRow>
          ))}
        </AdminSection>

        <AdminSection title="WebhookEvents">
          {webhookEvents.map((event) => (
            <AdminRow key={event.id}>
              <span><EventBadge eventType={event.eventType} /></span>
              <span><StatusBadge status={event.status} /></span>
              <span>{event.eventSource} · {event.igAccountId ?? "No Page"}</span>
              <span>{event.commentId ?? event.mediaId ?? "No object ID"}</span>
              <span>
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
        </AdminSection>

        <AdminSection title="AutomationEvents">
          {automationEvents.map((event) => (
            <AdminRow key={event.id}>
              <span>{event.eventType}</span>
              <span>{event.automation.name}</span>
              <span>{event.keyword ?? "No keyword"}</span>
              <span>{event.commentId ?? event.mediaId ?? "No object ID"}</span>
              <span>{new Date(event.createdAt).toLocaleString()}</span>
            </AdminRow>
          ))}
        </AdminSection>

        <AdminSection title="MessageLogs">
          {messageLogs.map((log) => (
            <AdminRow key={log.id}>
              <span>{log.messageType}</span>
              <span>{log.status}</span>
              <span>{log.automation.name}</span>
              <span>{log.commentId ?? log.recipientIgId}</span>
              <span>{log.errorMessage ?? new Date(log.createdAt).toLocaleString()}</span>
            </AdminRow>
          ))}
        </AdminSection>

        <AdminSection title="Leads">
          {leads.map((lead) => (
            <AdminRow key={lead.id}>
              <span>{lead.igUsername ? `@${lead.igUsername}` : lead.igUserId}</span>
              <span>{lead.automation.name}</span>
              <span>{lead.mediaId ?? "No media"}</span>
              <span>{lead.commentText?.slice(0, 80) ?? "No text"}</span>
              <span>{new Date(lead.createdAt).toLocaleString()}</span>
            </AdminRow>
          ))}
        </AdminSection>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-black">Database health</h2>
          <p className="mt-2 text-sm text-slate-600">
            Model counts above are live. Migration status is intentionally not exposed in this UI.
          </p>
          <Link href="/dashboard" className="mt-4 inline-flex text-sm font-bold text-pink-600">
            Back to dashboard
          </Link>
        </div>
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
