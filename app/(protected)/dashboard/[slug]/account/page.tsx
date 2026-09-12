import AccountConnectionActions from "@/components/dashboard/account-connection-actions";
import InstagramAvatar from "@/components/dashboard/instagram-avatar";
import RemoveInstagramAccountButton from "@/components/dashboard/remove-instagram-account-button";
import LocalTime from "@/components/global/local-time";
import { onUserInfo } from "@/actions/user";
import {
  getInstagramAccountSettingsStats,
  type AccountStatValue,
} from "@/lib/account-settings-stats";
import { getPeriodRange, parseDashboardPeriod } from "@/lib/dashboard-metrics";
import {
  getInstagramSnapshotComparisonWithRefresh,
  getProfileSnapshotDisplay,
} from "@/lib/instagram-profile-snapshot";
import {
  getCanonicalInstagramIntegration,
  isCanonicalInstagramConnected,
} from "@/lib/instagram-integration-status";
import { ExternalLink, Settings2 } from "lucide-react";
import Link from "next/link";

type Props = { params: { slug: string }; searchParams?: { period?: string } };

export default async function InstagramAccountPage({
  params,
  searchParams,
}: Props) {
  const userResult = await onUserInfo();
  const user = userResult.status === 200 ? userResult.data : null;
  const instagram = getCanonicalInstagramIntegration(user?.integrations);
  const connected = isCanonicalInstagramConnected(instagram);
  const tokenExpired = Boolean(
    instagram?.expiresAt &&
    new Date(instagram.expiresAt).getTime() < Date.now(),
  );
  const connectionReady = connected && !tokenExpired;
  const period = parseDashboardPeriod(searchParams?.period);
  const periodRange = getPeriodRange(period);

  const [snapshotState, stats] = user?.id
    ? await Promise.all([
        getInstagramSnapshotComparisonWithRefresh(
          user.clerkId,
          user.id,
          instagram?.id,
          period,
        ),
        getInstagramAccountSettingsStats(
          user.id,
          instagram?.id,
          { gte: periodRange.currentStart, lt: periodRange.currentEnd },
          period,
        ),
      ])
    : [{ comparison: null, refresh: null }, null];

  const snapshot = snapshotState.comparison?.current ?? null;
  const profileSnapshotDisplay = getProfileSnapshotDisplay(
    snapshot,
    snapshotState.refresh,
  );
  const displayUsername = connected
    ? (snapshot?.username ?? instagram?.instagramUsername)
    : null;
  const displayProfilePictureUrl = connected
    ? (snapshot?.profilePictureUrl ?? instagram?.profilePictureUrl)
    : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-1 py-3 text-slate-950 dark:text-slate-50 sm:gap-4 sm:px-2 sm:py-4 lg:py-6">
      <div className="animate-[ap3kDashboardRise_0.45s_ease-out_both]">
        <p className="ap3k-kicker">Instagram connection</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
          Your Instagram
        </h1>
      </div>

      <section className="ap3k-card animate-[ap3kDashboardRise_0.55s_ease-out_both] overflow-hidden rounded-3xl p-0">
        <div className="bg-[radial-gradient(circle_at_8%_12%,rgba(16,185,129,0.16),transparent_32%),radial-gradient(circle_at_92%_8%,rgba(236,72,153,0.18),transparent_36%),linear-gradient(135deg,#0f172a_0%,#111827_58%,#21152a_100%)] p-3.5 text-white sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="scale-90 sm:scale-100">
                <InstagramAvatar
                  src={displayProfilePictureUrl}
                  username={displayUsername}
                  label={instagram?.pageName}
                  size="xl"
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-black tracking-tight text-white sm:text-2xl">
                    {connected && displayUsername
                      ? `@${displayUsername}`
                      : "No Instagram account connected"}
                  </h2>
                  <span
                    className={
                      connected && !tokenExpired
                        ? "ap3k-badge ap3k-badge-green"
                        : "ap3k-badge ap3k-badge-amber"
                    }
                  >
                    {tokenExpired
                      ? "Reconnect"
                      : connected
                        ? "Connected"
                        : "Not connected"}
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-300 sm:text-sm">
                  {connected ? (
                    snapshot?.fetchedAt ? (
                      <LocalTime
                        value={snapshot.fetchedAt}
                        prefix="Profile refreshed"
                      />
                    ) : (
                      "Connected. Profile sync pending."
                    )
                  ) : (
                    "Connect Instagram to start receiving comments."
                  )}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span
                    className={
                      connectionReady
                        ? "ap3k-badge ap3k-badge-green"
                        : "ap3k-badge ap3k-badge-amber"
                    }
                  >
                    {connectionReady ? "Comments ready" : "Connection required"}
                  </span>
                  <span
                    className={
                      connectionReady
                        ? "ap3k-badge ap3k-badge-green"
                        : "ap3k-badge ap3k-badge-slate"
                    }
                  >
                    {connectionReady ? "DMs ready" : "Actions paused"}
                  </span>
                  {profileSnapshotDisplay.label !== "Missing" ? (
                    <span className="ap3k-badge border-white/15 bg-white/[0.08] text-slate-200">
                      {profileSnapshotDisplay.label}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <AccountConnectionActions
              connected={connected}
              integrationId={instagram?.id}
            />
          </div>
        </div>
      </section>

      <section className="ap3k-card animate-[ap3kDashboardRise_0.64s_ease-out_both] rounded-3xl p-3.5 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="ap3k-kicker">Account analytics</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-white">
              Performance
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {periodRange.label}
            </p>
          </div>
          <PeriodSelector slug={params.slug} active={period} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-3">
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
            <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm font-bold text-slate-500 dark:border-white/10 dark:text-slate-400 sm:col-span-2 lg:col-span-3">
              Connect Instagram to enable account stats.
            </p>
          )}
        </div>
      </section>

      <details className="group ap3k-card animate-[ap3kDashboardRise_0.74s_ease-out_both] rounded-2xl">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
              <Settings2 className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-black text-slate-950 dark:text-white">
                Connection settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage or remove this account
              </p>
            </div>
          </div>
          <span className="text-sm text-slate-400 transition-transform group-open:rotate-180">
            ⌄
          </span>
        </summary>
        <div className="border-t border-slate-200 p-4 dark:border-white/10">
          <p className="mb-3 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">
            One Instagram account per workspace. Removing it permanently clears
            its automations and history.
          </p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link
              href={`/dashboard/${params.slug}/integrations`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
            >
              Manage connection
              <ExternalLink className="h-4 w-4" />
            </Link>
            {connected && <RemoveInstagramAccountButton />}
          </div>
        </div>
      </details>
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
        <Link
          key={key}
          href={`/dashboard/${slug}/account?period=${key}`}
          className={[
            "whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-black transition",
            active === key
              ? "bg-rf-pink/10 text-rf-pink"
              : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.08]",
          ].join(" ")}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

function SettingsStatCard({
  label,
  stat,
}: {
  label: string;
  stat: AccountStatValue;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-rf-pink/30 hover:bg-white dark:border-white/10 dark:bg-white/[0.025] dark:hover:bg-white/[0.04] sm:p-3.5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p
          className={[
            "text-xl font-black tracking-tight",
            stat.enabled
              ? "text-slate-950 dark:text-white"
              : "text-slate-500 dark:text-slate-400",
          ].join(" ")}
        >
          {typeof stat.value === "number"
            ? stat.value.toLocaleString()
            : stat.value}
        </p>
      </div>
      <p className="mt-1 hidden truncate text-[11px] text-slate-500 dark:text-slate-400 sm:block">
        {stat.subtitle}
      </p>
    </div>
  );
}
