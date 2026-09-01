import AccountConnectionActions from "@/components/dashboard/account-connection-actions";
import InstagramAvatar from "@/components/dashboard/instagram-avatar";
import RemoveInstagramAccountButton from "@/components/dashboard/remove-instagram-account-button";
import LocalTime from "@/components/global/local-time";
import { onUserInfo } from "@/actions/user";
import { getInstagramAccountSettingsStats, type AccountStatValue } from "@/lib/account-settings-stats";
import { getPeriodRange, parseDashboardPeriod } from "@/lib/dashboard-metrics";
import { getInstagramSnapshotComparisonWithRefresh, getProfileSnapshotDisplay } from "@/lib/instagram-profile-snapshot";
import { getCanonicalInstagramIntegration, isCanonicalInstagramConnected } from "@/lib/instagram-integration-status";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

type Props = { params: { slug: string }; searchParams?: { period?: string } };

export default async function InstagramAccountPage({ params, searchParams }: Props) {
  const userResult = await onUserInfo();
  const user = userResult.status === 200 ? userResult.data : null;
  const instagram = getCanonicalInstagramIntegration(user?.integrations);
  const connected = isCanonicalInstagramConnected(instagram);
  const tokenExpired = Boolean(instagram?.expiresAt && new Date(instagram.expiresAt).getTime() < Date.now());
  const period = parseDashboardPeriod(searchParams?.period);
  const periodRange = getPeriodRange(period);

  const [snapshotState, stats] = user?.id
    ? await Promise.all([
        getInstagramSnapshotComparisonWithRefresh(user.clerkId, user.id, instagram?.id, period),
        getInstagramAccountSettingsStats(user.id, instagram?.id, { gte: periodRange.currentStart, lt: periodRange.currentEnd }, period),
      ])
    : [{ comparison: null, refresh: null }, null];

  const snapshot = snapshotState.comparison?.current ?? null;
  const profileSnapshotDisplay = getProfileSnapshotDisplay(snapshot, snapshotState.refresh);
  const displayUsername = connected ? snapshot?.username ?? instagram?.instagramUsername : null;
  const displayProfilePictureUrl = connected ? snapshot?.profilePictureUrl ?? instagram?.profilePictureUrl : null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-1 py-4 text-slate-950 dark:text-slate-50 sm:px-2 lg:py-8">
      <div className="animate-[ap3kDashboardRise_0.45s_ease-out_both]">
        <p className="ap3k-kicker">Instagram connection</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Instagram Account</h1>
        <p className="mt-2 max-w-2xl text-sm font-bold text-slate-500 dark:text-slate-400">
          Connect one Instagram Business or Creator account, then run unlimited comment automation campaigns from one clean workspace.
        </p>
      </div>

      <section className="ap3k-card animate-[ap3kDashboardRise_0.55s_ease-out_both] overflow-hidden rounded-3xl p-0">
        <div className="bg-[radial-gradient(circle_at_12%_18%,rgba(16,185,129,0.18),transparent_34%),radial-gradient(circle_at_90%_12%,rgba(236,72,153,0.20),transparent_38%),linear-gradient(135deg,#0f172a_0%,#111827_55%,#21152a_100%)] p-5 text-white sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <InstagramAvatar src={displayProfilePictureUrl} username={displayUsername} label={instagram?.pageName} size="xl" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {connected && displayUsername ? `@${displayUsername}` : "No Instagram account connected"}
                  </h2>
                  <span className={connected && !tokenExpired ? "ap3k-badge ap3k-badge-green" : "ap3k-badge ap3k-badge-amber"}>
                    {tokenExpired ? "Reconnect" : connected ? "Connected" : "Not connected"}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-300">
                  {connected ? (
                    snapshot?.fetchedAt ? <LocalTime value={snapshot.fetchedAt} prefix="Profile refreshed" /> : "Connected. Profile sync pending."
                  ) : "Connect Instagram to start receiving comments."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="ap3k-badge ap3k-badge-green">Comment automation ready</span>
                  {profileSnapshotDisplay.label !== "Missing" && <span className="ap3k-badge border-white/15 bg-white/[0.08] text-slate-200">{profileSnapshotDisplay.label}</span>}
                </div>
              </div>
            </div>
            <AccountConnectionActions connected={connected} integrationId={instagram?.id} />
          </div>
        </div>
      </section>

      <section className="grid animate-[ap3kDashboardRise_0.6s_ease-out_both] gap-3 md:grid-cols-3">
        <StatusCard label="Instagram connected" value={connected && !tokenExpired ? "Ready" : "Reconnect required"} ok={connected && !tokenExpired} />
        <StatusCard label="Comments" value={connected ? "Ready to receive" : "Connect account first"} ok={connected} />
        <StatusCard label="Actions" value={connected ? "Comment replies + DMs ready" : "Paused"} ok={connected} />
      </section>

      <section className="ap3k-card animate-[ap3kDashboardRise_0.7s_ease-out_both] rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="ap3k-kicker">Account analytics</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Performance</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Real AP3K activity for this Instagram account · {periodRange.label}</p>
          </div>
          <PeriodSelector slug={params.slug} active={period} />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {stats ? (
            <>
              <SettingsStatCard label="Followers" stat={stats.followers} />
              <SettingsStatCard label="Posts" stat={stats.posts} />
              <SettingsStatCard label="Comments" stat={stats.comments} />
              <SettingsStatCard label="Leads" stat={stats.contacts} />
              <SettingsStatCard label="DMs" stat={stats.dmsOut} />
              <SettingsStatCard label="Reply rate" stat={stats.replyRate} />
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm font-bold text-slate-500 dark:border-white/10 dark:text-slate-400 sm:col-span-2 xl:col-span-3">
              Connect Instagram to enable account stats.
            </p>
          )}
        </div>
      </section>

      <section className="ap3k-card animate-[ap3kDashboardRise_0.8s_ease-out_both] rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="ap3k-kicker">Connection management</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-white">One Instagram account per workspace</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Reconnect when you want to replace the current Instagram account. Remove it only when you want to permanently clear this workspace&apos;s Instagram automation data and history.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row lg:justify-end">
            <Link href={`/dashboard/${params.slug}/integrations`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]">
              Manage connection
              <ExternalLink className="h-4 w-4" />
            </Link>
            {connected && <RemoveInstagramAccountButton />}
          </div>
        </div>
      </section>
    </div>
  );
}

function PeriodSelector({ slug, active }: { slug: string; active: string }) {
  const items = [
    ["24h", "Last 24h"],
    ["7d", "Last 7d"],
    ["month", "This month"],
    ["30d", "Last 30d"],
  ];
  return (
    <div className="inline-flex w-fit max-w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      {items.map(([key, label]) => (
        <Link key={key} href={`/dashboard/${slug}/account?period=${key}`} className={["whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-black transition", active === key ? "bg-rf-pink/10 text-rf-pink" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.08]"].join(" ")}>{label}</Link>
      ))}
    </div>
  );
}

function StatusCard({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className={["flex items-start gap-3 rounded-2xl border p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5", ok ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/[0.09]" : "border-amber-200 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/[0.09]"].join(" ")}>
      <span className={["grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-black", ok ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-500/25 dark:text-amber-200"].join(" ")}>{ok ? "✓" : "!"}</span>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">{label}</p>
        <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function SettingsStatCard({ label, stat }: { label: string; stat: AccountStatValue }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-rf-pink/30 dark:border-white/10 dark:bg-[#101827]">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className={["mt-2 text-2xl font-black tracking-tight", stat.enabled ? "text-slate-950 dark:text-white" : "text-slate-500 dark:text-slate-400"].join(" ")}>{typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}</p>
      <p className="mt-1 text-xs leading-snug text-slate-500 dark:text-slate-400">{stat.subtitle}</p>
    </div>
  );
}
