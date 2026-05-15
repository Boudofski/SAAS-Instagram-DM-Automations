import { requireOwnerAdmin, maskSecret } from "@/lib/admin";
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
  ] = await Promise.all([
    client.user.count(),
    client.integrations.count(),
    client.integrations.count({ where: { instagramId: { not: null } } }),
    client.automation.count(),
    client.automation.count({ where: { active: true } }),
    client.webhookEvent.count(),
    client.webhookEvent.count({ where: { eventType: "COMMENT_WEBHOOK_RECEIVED" } }),
    client.webhookEvent.count({
      where: {
        OR: [
          { status: "FAILED" },
          { eventType: "SIGNATURE_VERIFICATION_FAILED" },
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
              <span>{maskSecret(integration.token)}</span>
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
              <span>{event.eventType}</span>
              <span>{event.status}</span>
              <span>{event.igAccountId ?? "No IG account"}</span>
              <span>{event.commentId ?? event.mediaId ?? "No object ID"}</span>
              <span>{event.errorMessage ?? new Date(event.createdAt).toLocaleString()}</span>
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
