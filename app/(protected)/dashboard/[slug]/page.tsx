import AutomationTable from "@/components/dashboard/automation-table";
import EmptyState from "@/components/global/empty-state";
import InstagramAvatar from "@/components/dashboard/instagram-avatar";
import LocalTime from "@/components/global/local-time";
import { getAllAutomation, getRecentAutomationActivity } from "@/actions/automation";
import { onUserInfo } from "@/actions/user";
import { getUserMonthlyUsage } from "@/actions/usage/queries";
import {
  type ChangeSummary,
  getCampaignTableMetrics,
  getDashboardGreeting,
  parseDashboardPeriod,
} from "@/lib/dashboard-metrics";
import { getInstagramSnapshotComparisonWithRefresh, getProfileSnapshotStatus } from "@/lib/instagram-profile-snapshot";
import { getDashboardProfileStats } from "@/lib/instagram-account-ux";
import { getUserFacingStats } from "@/lib/user-facing-metrics";
import { filterAppReviewActivity, groupCampaignActivity } from "@/lib/campaign-activity-format";
import { getCanonicalInstagramIntegration, isCanonicalInstagramConnected } from "@/lib/instagram-integration-status";
import { formatAppReviewActivitySubtitle } from "@/lib/app-review-activity-copy";
import { getActivityEmptyState, isActivityInPeriod } from "@/lib/dashboard-consistency";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type Props = { params: { slug: string }; searchParams?: { period?: string } };

const onboardingSkippedCookie = (clerkId: string) => `ap3k_onboarding_skipped_${clerkId}`;

export default async function DashboardPage({ params, searchParams }: Props) {
  const [userResult, automationsResult] = await Promise.all([onUserInfo(), getAllAutomation()]);

  const onboardingSkipped =
    userResult.status === 200 &&
    userResult.data?.clerkId &&
    cookies().get(onboardingSkippedCookie(userResult.data.clerkId))?.value === "true";

  const instagram = getCanonicalInstagramIntegration(userResult.status === 200 ? userResult.data?.integrations : null);
  if (userResult.status === 200 && !instagram && !onboardingSkipped) redirect("/onboarding");

  const automations =
    automationsResult.status === 200 && Array.isArray(automationsResult.data)
      ? (automationsResult.data as any[])
      : [];

  const isEmpty = automations.length === 0;
  const instagramConnected = isCanonicalInstagramConnected(instagram);
  const tokenExpired = Boolean(instagram?.expiresAt && new Date(instagram.expiresAt).getTime() < Date.now());
  const displayName = getDashboardGreeting(userResult.data ?? {});
  const period = parseDashboardPeriod(searchParams?.period);

  const [usage, dashboardStats, campaignMetrics, recentResult, snapshotState] = userResult.data?.id
    ? await Promise.all([
        getUserMonthlyUsage(userResult.data.id),
        getUserFacingStats(userResult.data.id, period),
        getCampaignTableMetrics(userResult.data.id),
        getRecentAutomationActivity(),
        getInstagramSnapshotComparisonWithRefresh(userResult.data.clerkId, userResult.data.id, instagram?.id, period),
      ])
    : [null, null, {} as Record<string, any>, { status: 200, data: [] as any[] }, { comparison: null, refresh: null }];

  const snapshotComparison = snapshotState.comparison;
  const profileSnapshot = snapshotComparison?.current;
  const profileSnapshotStatus = getProfileSnapshotStatus(profileSnapshot);
  const displayInstagramUsername = profileSnapshot?.username ?? instagram?.instagramUsername;
  const displayProfilePictureUrl = profileSnapshot?.profilePictureUrl ?? instagram?.profilePictureUrl;
  const planLabel = usage?.planLabel ?? (userResult.data?.subscription?.plan === "PRO" ? "Creator" : "Free");
  const metrics = dashboardStats?.current ?? null;
  const changes = dashboardStats?.changes ?? null;

  const automationsWithMetrics = automations.map((automation) => ({
    ...automation,
    metrics: campaignMetrics[automation.id] ?? { runs: 0, leads: automation._count?.leads ?? 0 },
    currentAccountLabel: displayInstagramUsername ? `@${displayInstagramUsername}` : "Current account",
  }));

  const groupedActivity = recentResult.status === 200
    ? groupCampaignActivity(recentResult.data as any[], { limit: 20 })
    : [];
  const periodActivity = dashboardStats
    ? groupedActivity.filter((item) => isActivityInPeriod(item.createdAt, dashboardStats.period.currentStart, dashboardStats.period.currentEnd))
    : groupedActivity;
  const recentActivity = filterAppReviewActivity(periodActivity, 20);
  const lifetimeCampaignTotals = Object.values(campaignMetrics).reduce(
    (totals, metric) => ({ runs: totals.runs + metric.runs, leads: totals.leads + metric.leads }),
    { runs: 0, leads: 0 }
  );
  const activityEmptyState = getActivityEmptyState(
    recentActivity.length,
    lifetimeCampaignTotals.runs + lifetimeCampaignTotals.leads + groupedActivity.length
  );
  const dashboardProfileStats = getDashboardProfileStats({ snapshotComparison, metrics, usage });
  const activeCampaigns = automations.filter((automation: any) => automation.active && !automation.needsReview && !automation.archivedAt);
  const hasActiveCampaign = activeCampaigns.length > 0;
  const hasPrivateCampaign = activeCampaigns.some((automation: any) => automation.sendPrivateDm !== false);

  return (
    <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-1 py-4 text-slate-950 dark:text-slate-50 sm:px-2 lg:py-8">
      <div className="animate-[ap3kDashboardRise_0.4s_ease-out_both]">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-rf-pink">AP3k</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Welcome back, {displayName}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Your Instagram connection, campaign activity, replies, and captured leads in one place.
        </p>
      </div>

      {isEmpty && (
        <div className="animate-[ap3kDashboardRise_0.48s_ease-out_both] overflow-hidden rounded-3xl border border-pink-100 bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 p-6 shadow-sm dark:border-rf-pink/25 dark:bg-ap3k-gradient-soft">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="ap3k-kicker">Ready to launch</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Create your first Instagram campaign</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Choose a post, set a comment trigger, configure public and private replies, and activate the campaign.
              </p>
            </div>
            <Link href={`/dashboard/${params.slug}/automation/new`} className="ap3k-gradient-button shrink-0 px-5 py-2.5 text-sm">Create campaign</Link>
          </div>
        </div>
      )}

      {instagramConnected && instagram && (
        <div className={[
          "group animate-[ap3kDashboardRise_0.52s_ease-out_both] overflow-hidden rounded-3xl border p-5 shadow-[0_18px_80px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_90px_rgba(236,72,153,0.14)] dark:bg-white/[0.04]",
          tokenExpired
            ? "border-amber-200 bg-amber-50/80 dark:border-amber-500/35 dark:bg-amber-500/10"
            : "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-pink-50 dark:border-emerald-500/25 dark:from-emerald-500/[0.12] dark:via-white/[0.04] dark:to-rf-pink/[0.08]",
        ].join(" ")}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <InstagramAvatar src={displayProfilePictureUrl} username={displayInstagramUsername} label={instagram.pageName} size="lg" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                    {displayInstagramUsername ? `@${displayInstagramUsername}` : "Instagram connected"}
                  </p>
                  <span className={tokenExpired ? "ap3k-badge ap3k-badge-amber" : "ap3k-badge ap3k-badge-green"}>{tokenExpired ? "Reconnect" : "Connected"}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {tokenExpired
                    ? "Reconnect Instagram to resume campaign activity."
                    : profileSnapshot?.fetchedAt
                      ? <LocalTime value={profileSnapshot.fetchedAt} prefix="Profile refreshed" />
                      : "Instagram is ready for campaign activity."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <span className="ap3k-badge ap3k-badge-slate">{planLabel}</span>
              {profileSnapshotStatus.label === "Fresh" && <span className="ap3k-badge ap3k-badge-green">Fresh</span>}
              {typeof profileSnapshot?.followersCount === "number" && <span className="ap3k-badge ap3k-badge-slate">{profileSnapshot.followersCount.toLocaleString()} followers</span>}
              <Link href={`/dashboard/${params.slug}/account`} className="rounded-xl border border-rf-pink/20 bg-rf-pink/10 px-3 py-1.5 text-xs font-black text-rf-pink transition hover:-translate-y-0.5 hover:bg-rf-pink/15">
                {tokenExpired ? "Reconnect Instagram" : "Manage account"}
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="flex animate-[ap3kDashboardRise_0.58s_ease-out_both] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit max-w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          {[
            ["24h", "Last 24h"],
            ["7d", "Last 7d"],
            ["month", "This month"],
            ["30d", "Last 30d"],
          ].map(([key, label]) => (
            <Link
              key={key}
              href={`/dashboard/${params.slug}?period=${key}`}
              className={[
                "whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-black transition-all duration-200",
                period === key
                  ? "bg-rf-pink/10 text-rf-pink shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.08]",
              ].join(" ")}
            >
              {label}
            </Link>
          ))}
        </div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{dashboardStats?.period.label ?? "This month"}</p>
      </div>

      <div className="grid animate-[ap3kDashboardRise_0.64s_ease-out_both] gap-3 md:grid-cols-4">
        <HealthPill label="Instagram connected" detail={instagramConnected && !tokenExpired ? "Ready" : "Reconnect required"} state={instagramConnected && !tokenExpired ? "ok" : "warn"} />
        <HealthPill label="Comments" detail={metrics?.commentsReceived ? "Comments are arriving" : "Ready to receive"} state={instagramConnected && !tokenExpired ? "ok" : "warn"} />
        <HealthPill label="Campaigns" detail={hasActiveCampaign ? `${activeCampaigns.length} live campaign${activeCampaigns.length === 1 ? "" : "s"}` : "Activate a campaign"} state={hasActiveCampaign ? "ok" : "warn"} />
        <HealthPill label="Replies" detail={hasActiveCampaign ? (hasPrivateCampaign ? "Public + private replies active" : "Public replies active") : "Ready when a campaign is live"} state={hasActiveCampaign ? "ok" : "warn"} />
      </div>

      <section className="animate-[ap3kDashboardRise_0.7s_ease-out_both]">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="ap3k-kicker">Account analytics</p>
            <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">Instagram performance</h2>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{dashboardStats?.period.label ?? "This month"}</p>
        </div>
        <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_70px_rgba(15,23,42,0.07)] dark:border-white/[0.12] dark:bg-[#111827] md:grid-cols-2 xl:grid-cols-5">
          {dashboardProfileStats.map((stat) => (
            <AccountStatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              change={
                stat.label === "Comments" ? changes?.commentsReceived :
                stat.label === "Leads" ? changes?.leadsCaptured :
                stat.label === "Replies" ? changes?.staticRepliesUsed :
                stat.change
              }
              subtitle={stat.subtitle}
            />
          ))}
        </div>
      </section>

      <section className="ap3k-card animate-[ap3kDashboardRise_0.76s_ease-out_both] rounded-3xl p-5 transition duration-300 hover:shadow-[0_20px_80px_rgba(15,23,42,0.10)]">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-950 dark:text-white">Recent activity</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Latest comments, trigger matches, replies, and leads in the selected period.</p>
          </div>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Grouped by comment</span>
        </div>

        {recentActivity.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-slate-400">
            <p>{activityEmptyState?.title ?? "No activity yet"}</p>
            <p className="mt-1">Comment from another Instagram account on a post covered by a live campaign to create the first activity.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.07]">
            {recentActivity.map((item, index) => (
              <div key={`${item.id}-${index}`} className="grid gap-3 rounded-2xl px-2 py-4 transition duration-200 hover:bg-slate-50/80 dark:hover:bg-white/[0.035] sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="flex min-w-0 gap-3">
                  <span className={["mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full", recentToneClass(item.tone)].join(" ")} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950 dark:text-white">{item.title}{item.actorLabel ? ` ${item.actorLabel}` : ""}</p>
                    <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{formatAppReviewActivitySubtitle(item.subtitle, true)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-5 sm:pl-0">
                  <span className="ap3k-badge ap3k-badge-slate">{item.badge}</span>
                  <span className="shrink-0 text-xs font-bold text-slate-400"><LocalTime value={item.createdAt} mode="time" /></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="animate-[ap3kDashboardRise_0.82s_ease-out_both]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="ap3k-kicker">Campaigns</p>
            <h2 className="font-black text-slate-950 dark:text-white">Active campaigns</h2>
          </div>
          <Link href={`/dashboard/${params.slug}/automation`} className="rounded-xl border border-rf-pink/20 bg-rf-pink/10 px-3 py-1.5 text-xs font-black text-rf-pink transition hover:-translate-y-0.5 hover:bg-rf-pink/15">View all</Link>
        </div>

        {isEmpty ? (
          <EmptyState
            icon="📣"
            title="No campaigns yet"
            description="Create a campaign, choose a post, add a trigger, configure replies, and activate it."
            ctaLabel="Create campaign →"
            ctaHref={`/dashboard/${params.slug}/automation/new`}
          />
        ) : (
          <AutomationTable slug={params.slug} automations={automationsWithMetrics.slice(0, 8)} showControls={false} />
        )}
      </section>
    </div>
  );
}

function recentToneClass(tone: "green" | "blue" | "purple" | "amber" | "red" | "slate") {
  const tones = {
    green: "bg-emerald-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    slate: "bg-slate-400",
  };
  return tones[tone];
}

function AccountStatCard({ label, value, change, subtitle }: { label: string; value: string | number; change?: ChangeSummary; subtitle: string }) {
  const changeClass =
    change?.tone === "positive"
      ? "text-emerald-600 dark:text-emerald-300"
      : change?.tone === "negative"
        ? "text-red-500 dark:text-red-300"
        : "text-slate-500 dark:text-slate-500";

  return (
    <div className="min-w-0 border-b border-slate-200 px-5 py-6 transition duration-200 last:border-b-0 hover:bg-slate-50/80 dark:border-white/10 dark:hover:bg-white/[0.035] md:border-b-0 md:border-r md:last:border-r-0">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-2xl font-black leading-none tracking-tight text-slate-950 dark:text-white">{value}</p>
        <span className={`mb-0.5 shrink-0 text-[11px] font-black ${changeClass}`}>{change?.label ?? "—"}</span>
      </div>
      <p className="mt-2 text-[11px] leading-tight text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}

function HealthPill({ label, detail, state }: { label: string; detail: string; state: "ok" | "warn" }) {
  return (
    <div className={[
      "flex items-start gap-2.5 rounded-2xl border p-3.5 shadow-sm transition duration-300 hover:-translate-y-0.5",
      state === "ok"
        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/[0.09]"
        : "border-amber-200 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/[0.09]",
    ].join(" ")}>
      <span className={[
        "grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[11px] font-black",
        state === "ok"
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-300"
          : "bg-amber-100 text-amber-800 dark:bg-amber-500/25 dark:text-amber-200",
      ].join(" ")}>
        {state === "ok" ? "✓" : "!"}
      </span>
      <div className="min-w-0">
        <p className={[
          "text-xs font-black",
          state === "ok" ? "text-emerald-800 dark:text-emerald-200" : "text-amber-900 dark:text-amber-100",
        ].join(" ")}>
          {label}
        </p>
        <p className={[
          "mt-0.5 text-[11px] font-semibold leading-snug",
          state === "ok" ? "text-emerald-700 dark:text-emerald-300" : "text-amber-800 dark:text-amber-200",
        ].join(" ")}>
          {detail}
        </p>
      </div>
    </div>
  );
}
