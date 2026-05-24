import AccountConnectionActions from "@/components/dashboard/account-connection-actions";
import { onUserInfo } from "@/actions/user";
import { getCurrentWebhookHealth } from "@/actions/integration";
import { getInstagramAccountSettingsStats, type AccountStatValue } from "@/lib/account-settings-stats";
import { getUserMonthlyUsage } from "@/actions/usage/queries";
import { getInstagramDisconnectState } from "@/lib/settings-safety";
import { AlertTriangle, CheckCircle2, ExternalLink, Link2, Lock, ShieldAlert } from "lucide-react";
import Link from "next/link";

type Props = { params: { slug: string } };

export default async function InstagramAccountPage({ params }: Props) {
  const userResult = await onUserInfo();
  const user = userResult.status === 200 ? userResult.data : null;
  const instagram = user?.integrations?.[0];
  const tokenExpired = Boolean(instagram?.expiresAt && new Date(instagram.expiresAt).getTime() < Date.now());

  const [stats, healthResult, usage] = user?.id
    ? await Promise.all([
        getInstagramAccountSettingsStats(user.id, instagram?.id),
        getCurrentWebhookHealth(),
        getUserMonthlyUsage(user.id),
      ])
    : [null, { status: 200, data: null }, null];

  const health = healthResult.status === 200 ? healthResult.data : null;
  const connected = Boolean(instagram?.instagramId);
  const disconnectState = getInstagramDisconnectState(false);
  const statusLabel = tokenExpired ? "Token expired" : connected ? "Connected" : "Not connected";
  const statusTone = tokenExpired ? "amber" : connected ? "green" : "slate";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-1 py-4 text-slate-950 dark:text-slate-50 sm:px-2 lg:py-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">Official Meta connection</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Instagram Account</h1>
        <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
          {instagram?.instagramUsername ? `@${instagram.instagramUsername}` : "Connect your Instagram Business or Creator account"}
        </p>
      </div>

      <section className="ap3k-card rounded-2xl p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeader label="Profile" />
          <AccountConnectionActions connected={connected} />
        </div>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {instagram?.profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={instagram.profilePictureUrl}
                alt={instagram.instagramUsername ?? "Instagram account"}
                className="h-20 w-20 rounded-2xl object-cover"
              />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-ap3k-gradient text-sm font-black text-white">
                IG
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                {instagram?.instagramUsername ? `@${instagram.instagramUsername}` : "No Instagram connected"}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                {instagram?.pageName ?? "Instagram Business or Creator profile"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge tone="pink">Official Meta connection</StatusBadge>
                <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
                <StatusBadge tone="slate">{instagram?.igAccountSource ?? "CONNECTED"}</StatusBadge>
              </div>
            </div>
          </div>
          <div className="grid gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 sm:min-w-[260px]">
            <MetaIdRow label="Instagram ID" value={instagram?.instagramId} />
            <MetaIdRow label="Page ID" value={instagram?.pageId} />
            <MetaIdRow label="Business ID" value={instagram?.businessId} />
          </div>
        </div>
      </section>

      <section className="ap3k-card rounded-2xl p-5 sm:p-6">
        <SectionHeader label="Stats" helper="Real AP3k activity for this account. Unavailable metrics are not estimated." />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats ? (
            <>
              <SettingsStatCard label="Followers" stat={stats.followers} tone="slate" />
              <SettingsStatCard label="Posts" stat={stats.posts} tone="slate" />
              <SettingsStatCard label="Comments" stat={stats.comments} tone="orange" />
              <SettingsStatCard label="Removed" stat={stats.removed} tone="red" />
              <SettingsStatCard label="DMs In" stat={stats.dmsIn} tone="blue" />
              <SettingsStatCard label="DMs Out" stat={stats.dmsOut} tone="green" />
              <SettingsStatCard label="Contacts" stat={stats.contacts} tone="orange" />
              <SettingsStatCard label="Reply Rate" stat={stats.replyRate} tone="slate" />
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm font-bold text-slate-500 dark:border-white/10 dark:text-slate-400 sm:col-span-2 xl:col-span-4">
              Connect Instagram to enable account stats.
            </p>
          )}
        </div>
      </section>

      <section className="ap3k-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <SectionHeader label="Connection" />
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Reconnect Instagram to refresh access tokens or restore a broken connection. Your campaigns, leads, and activity history are preserved.
            </p>
          </div>
          <Link
            href={`/dashboard/${params.slug}/integrations`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
          >
            Troubleshooting
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <HealthCard label="OAuth valid" value={health?.oauth?.tokenUsable ? "OK" : connected ? "Check" : "Unknown"} ok={Boolean(health?.oauth?.tokenUsable)} />
          <HealthCard
            label="Webhook subscribed"
            value={
              health?.subscription?.subscriptionMode === "META_DASHBOARD_MANAGED"
                ? "Dashboard managed"
                : health?.subscription?.subscribed
                  ? "OK"
                  : "Check"
            }
            ok={Boolean(health?.subscription?.subscribed) || health?.subscription?.subscriptionMode === "META_DASHBOARD_MANAGED"}
          />
          <HealthCard label="Last webhook" value={formatHealthDate(health?.lastWebhook?.createdAt)} ok={Boolean(health?.lastWebhook)} />
          <HealthCard label="Last comment" value={formatHealthDate(health?.lastCommentWebhook?.createdAt)} ok={Boolean(health?.lastCommentWebhook)} />
          <HealthCard label="Last failure" value={safeFailure(health)} ok={!health?.lastFailure && !health?.subscription?.error} />
          <HealthCard label="Messaging capability" value={health?.lastFailure?.errorMessage?.includes("dm_") ? "Blocked by Meta" : "Pending or approved"} ok={!health?.lastFailure?.errorMessage?.includes("dm_")} />
        </div>

        {usage && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Plan capacity</p>
            <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">
              {usage.planLabel} supports {usage.connectedAccounts.limit === "unlimited" ? "unlimited" : usage.connectedAccounts.limit} connected Instagram account{usage.connectedAccounts.limit === 1 ? "" : "s"}.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-500/30 dark:bg-red-500/10 sm:p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-300" />
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600 dark:text-red-300">Danger zone</p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-red-800 dark:text-red-100">
              Disconnecting removes this Instagram connection from AP3k and pauses related automations. Safe self-service disconnect is coming soon.
            </p>
            <button
              type="button"
              disabled
              className="mt-4 cursor-not-allowed rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-black text-red-400 opacity-70 dark:border-red-500/30 dark:bg-white/[0.04] dark:text-red-300"
            >
              {disconnectState.label}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ label, helper }: { label: string; helper?: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
      {helper && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{helper}</p>}
    </div>
  );
}

function SettingsStatCard({ label, stat, tone }: { label: string; stat: AccountStatValue; tone: "orange" | "blue" | "green" | "red" | "slate" }) {
  const valueClass = {
    orange: "text-orange-500",
    blue: "text-blue-500",
    green: "text-emerald-500",
    red: "text-red-500",
    slate: "text-slate-950 dark:text-white",
  }[stat.enabled ? tone : "slate"];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
        {!stat.enabled && <Lock className="h-4 w-4 text-slate-400" />}
      </div>
      <p className={`mt-4 text-2xl font-black tracking-tight ${valueClass}`}>{stat.value}</p>
      <p className="mt-1 text-xs font-bold leading-snug text-slate-500 dark:text-slate-400">{stat.subtitle}</p>
    </div>
  );
}

function StatusBadge({ tone, children }: { tone: "green" | "amber" | "pink" | "slate"; children: React.ReactNode }) {
  const classes = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    pink: "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-500/30 dark:bg-pink-500/10 dark:text-pink-200",
    slate: "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300",
  };
  return <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase ${classes[tone]}`}>{children}</span>;
}

function MetaIdRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
      <span>{label}</span>
      <span className="truncate text-slate-700 dark:text-slate-200">{value ?? "Not stored"}</span>
    </div>
  );
}

function HealthCard({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
        {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
      </div>
      <p className="mt-3 break-words text-sm font-black text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

function formatHealthDate(value?: Date | string | null) {
  if (!value) return "None yet";
  return new Date(value).toLocaleString();
}

function safeFailure(health: Awaited<ReturnType<typeof getCurrentWebhookHealth>>["data"]) {
  if (health?.subscription?.error) return health.subscription.error;
  if (health?.lastFailure?.errorMessage) return health.lastFailure.errorMessage;
  if (health?.lastFailure?.eventType) return health.lastFailure.eventType;
  return "No failures";
}
