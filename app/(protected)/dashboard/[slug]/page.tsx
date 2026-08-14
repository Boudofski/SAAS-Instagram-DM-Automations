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
import { buildCampaignBindingDiagnostics, dashboardNoCommentDiagnosis } from "@/lib/account-webhook-diagnostics";
import { getAccountWebhookDiagnosticsForIntegration } from "@/lib/account-webhook-diagnostics-db";
import { filterAppReviewActivity, groupCampaignActivity } from "@/lib/campaign-activity-format";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { getCanonicalInstagramIntegration, isCanonicalInstagramConnected } from "@/lib/instagram-integration-status";
import { formatAppReviewActivitySubtitle } from "@/lib/app-review-activity-copy";
import { getActivityEmptyState, getLeadEmptyState, isActivityInPeriod } from "@/lib/dashboard-consistency";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type Props = { params: { slug: string }; searchParams?: { period?: string } };

const onboardingSkippedCookie = (clerkId: string) =>
  `ap3k_onboarding_skipped_${clerkId}`;

export default async function DashboardPage({ params, searchParams }: Props) {
  const [userResult, automationsResult] = await Promise.all([
    onUserInfo(),
    getAllAutomation(),
  ]);

  const onboardingSkipped =
    userResult.status === 200 &&
    userResult.data?.clerkId &&
    cookies().get(onboardingSkippedCookie(userResult.data.clerkId))?.value ===
      "true";

  const initialInstagram = getCanonicalInstagramIntegration(userResult.status === 200 ? userResult.data?.integrations : null);

  // Redirect to onboarding if no Instagram connected and the user has not skipped it.
  if (
    userResult.status === 200 &&
    !initialInstagram &&
    !onboardingSkipped
  ) {
    redirect("/onboarding");
  }

  const automations =
    automationsResult.status === 200 && Array.isArray(automationsResult.data)
      ? (automationsResult.data as any[])
      : [];

  const isEmpty = automations.length === 0;
  const appReviewMode = isAppReviewMode();
  const instagram = initialInstagram;
  const instagramConnected = isCanonicalInstagramConnected(instagram);
  const tokenExpired =
    instagram?.expiresAt && new Date(instagram.expiresAt).getTime() < Date.now();
  const displayName = getDashboardGreeting(userResult.data ?? {});
  const hasExternalDmCampaign = automations.some((automation: any) => automation.sendPrivateDm === false);
  const period = parseDashboardPeriod(searchParams?.period);
  const [usage, dashboardStats, campaignMetrics, recentResult, snapshotState, accountDiagnostics] = userResult.data?.id
    ? await Promise.all([
        getUserMonthlyUsage(userResult.data.id),
        getUserFacingStats(userResult.data.id, period),
        getCampaignTableMetrics(userResult.data.id),
        getRecentAutomationActivity(),
        getInstagramSnapshotComparisonWithRefresh(userResult.data.clerkId, userResult.data.id, instagram?.id, period),
        getAccountWebhookDiagnosticsForIntegration(instagram?.id),
      ])
    : [null, null, {} as Record<string, any>, { status: 200, data: [] as any[] }, { comparison: null, refresh: null }, null];
  const snapshotComparison = snapshotState.comparison;
  const profileSnapshot = snapshotComparison?.current;
  const profileSnapshotStatus = getProfileSnapshotStatus(profileSnapshot);
  const displayInstagramUsername = profileSnapshot?.username ?? instagram?.instagramUsername;
  const displayProfilePictureUrl = profileSnapshot?.profilePictureUrl ?? instagram?.profilePictureUrl;
  const bindingDiagnostics = buildCampaignBindingDiagnostics({
    integration: instagram,
    campaigns: automations as any[],
  });
  const automationsWithMetrics = automations.map((automation) => ({
    ...automation,
    metrics: campaignMetrics[automation.id] ?? { runs: 0, leads: automation._count?.leads ?? 0 },
    currentAccountLabel: displayInstagramUsername ? `@${displayInstagramUsername}` : "Current account",
    stalePost: bindingDiagnostics.find((item) => item.campaignId === automation.id)?.stale ?? false,
  }));
  const groupedActivity = recentResult.status === 200 ? groupCampaignActivity(recentResult.data as any[], { limit: 20 }) : [];
  const periodActivity = dashboardStats
    ? groupedActivity.filter((item) => isActivityInPeriod(item.createdAt, dashboardStats.period.currentStart, dashboardStats.period.currentEnd))
    : groupedActivity;
  const recentActivity = appReviewMode ? filterAppReviewActivity(periodActivity, 20) : periodActivity;
  const planLabel = usage?.planLabel ?? (userResult.data?.subscription?.plan === "PRO" ? "Creator" : "Free");
  const metrics = dashboardStats?.current ?? null;
  const changes = dashboardStats?.changes ?? null;
  const lifetimeCampaignTotals = Object.values(campaignMetrics).reduce(
    (totals, metric) => ({ runs: totals.runs + metric.runs, leads: totals.leads + metric.leads }),
    { runs: 0, leads: 0 }
  );
  const leadEmptyState = getLeadEmptyState(metrics?.leadsCaptured ?? 0, lifetimeCampaignTotals.leads);
  const activityEmptyState = getActivityEmptyState(
    recentActivity.length,
    lifetimeCampaignTotals.runs + lifetimeCampaignTotals.leads + groupedActivity.length
  );
  const dashboardProfileStats = getDashboardProfileStats({ snapshotComparison, metrics, usage });
  const noCommentDiagnosis = dashboardNoCommentDiagnosis({
    username: displayInstagramUsername,
    status: accountDiagnostics?.delivery.status ?? "no_delivery",
  });
  const needsReviewCampaigns = automations.filter((automation: any) => automation.needsReview);
  const activeCampaigns = automations.filter((automation: any) => automation.active && !automation.needsReview && !automation.archivedAt);
  const hasActiveCampaign = activeCampaigns.length > 0;
  const hasNeedsReviewCampaign = needsReviewCampaigns.length > 0;
  const instagramDisconnected = !instagramConnected;
  const nextAction = instagramDisconnected || tokenExpired
    ? {
        title: tokenExpired ? "Reconnect Instagram before testing" : "Connect Instagram to start",
        detail: tokenExpired
          ? appReviewMode
            ? "Your saved connection needs a fresh Instagram login before comments and public replies can run."
            : "Your saved connection needs a fresh Instagram login before comments or DMs can run."
          : "AP3k needs an official Instagram connection before it can listen for comments.",
        cta: tokenExpired ? "Reconnect Instagram" : "Connect Instagram",
        href: `/dashboard/${params.slug}/integrations`,
      }
    : isEmpty
      ? {
          title: "Create your first campaign",
          detail: "Nothing is listening yet. Start with Any post and one keyword so you can test in under two minutes.",
          cta: "Create campaign",
          href: `/dashboard/${params.slug}/automation/new`,
        }
      : !hasActiveCampaign
        ? {
            title: "Activate a campaign",
            detail: hasNeedsReviewCampaign
              ? "Campaigns need review before comments and public replies can run."
              : "Campaigns exist, but none are live. Activate one before testing comments.",
            cta: "Review campaigns",
            href: `/dashboard/${params.slug}/automation`,
          }
        : !metrics?.lastRealCommentAt
          ? {
              title: "No comments received yet",
              detail: appReviewMode
                ? "Comment the campaign keyword from a different Instagram account, then come back here to confirm the activity log."
                : "Comment the campaign keyword from a different Instagram account, then come back here to confirm the webhook log.",
              cta: appReviewMode ? "View account" : "Check connection",
              href: `/dashboard/${params.slug}/account`,
            }
          : leadEmptyState
            ? {
                title: leadEmptyState.title,
                detail: appReviewMode
                  ? "Comments are arriving. Add a lead link so matched commenters can take the next step."
                  : "Comments are arriving. Add a clear DM CTA or lead link so matched commenters have an obvious next step.",
                cta: "Tune campaign",
                href: `/dashboard/${params.slug}/automation`,
              }
            : null;

  return (
    <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-1 py-4 text-slate-950 dark:text-slate-50 sm:px-2 lg:py-8">
      <div className="animate-[ap3kDashboardRise_0.45s_ease-out_both]">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">AP3k</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Welcome back, {displayName}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          {appReviewMode
            ? "Check your Instagram connection, active campaigns, real comments, public replies, and captured leads."
            : "Monitor your Instagram account, live campaigns, comment activity, private replies, and leads from one clean dashboard."}
        </p>
      </div>

      {isEmpty && (
        <div className="animate-[ap3kDashboardRise_0.5s_ease-out_both] overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 p-6 shadow-sm dark:border-rf-pink/25 dark:bg-ap3k-gradient-soft">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">AP3k onboarding</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                {appReviewMode ? "Turn comments into leads with public replies" : "Turn comments into DMs automatically"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Connect Instagram, create a campaign, comment the keyword from a separate tester account, then review activity here.
              </p>
            </div>
            <Link href={`/dashboard/${params.slug}/automation/new`} className="ap3k-gradient-button shrink-0 px-5 py-2.5 text-sm">
              Create first campaign
            </Link>
          </div>
        </div>
      )}

      {instagramConnected && instagram && (
        <div className={[
          "group animate-[ap3kDashboardRise_0.55s_ease-out_both] overflow-hidden rounded-3xl border p-5 shadow-[0_18px_80px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_90px_rgba(236,72,153,0.14)] dark:bg-white/[0.04]",
          tokenExpired
            ? "border-red-200 bg-red-50/80 dark:border-red-500/35 dark:bg-red-500/10"
            : "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-pink-50 dark:border-emerald-500/25 dark:from-emerald-500/[0.12] dark:via-white/[0.04] dark:to-rf-pink/[0.08]",
        ].join(" ")}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <InstagramAvatar
                src={displayProfilePictureUrl}
                username={displayInstagramUsername}
                label={instagram.pageName}
                size="lg"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                    {displayInstagramUsername ? `@${displayInstagramUsername}` : "Instagram connected"}
                  </p>
                  <span className={tokenExpired ? "ap3k-badge ap3k-badge-amber" : "ap3k-badge ap3k-badge-green"}>
                    {tokenExpired ? "Reconnect" : "Connected"}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {tokenExpired
                    ? "Token expired. Reconnect Instagram before testing comments."
                    : profileSnapshot?.fetchedAt
                      ? <LocalTime value={profileSnapshot.fetchedAt} prefix="Profile refreshed" />
                      : appReviewMode ? "Ready to receive Instagram comments." : "Ready for official Instagram Graph automation."}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <span className="ap3k-badge ap3k-badge-slate">{planLabel}</span>
              {profileSnapshotStatus.label === "Fresh" && (
                <span className="ap3k-badge ap3k-badge-green">Fresh sync</span>
              )}
              {typeof profileSnapshot?.followersCount === "number" && (
                <span className="ap3k-badge ap3k-badge-slate">
                  {profileSnapshot.followersCount.toLocaleString()} followers
                </span>
              )}
              <Link
                href={`/dashboard/${params.slug}/account`}
                className="rounded-xl border border-rf-pink/20 bg-rf-pink/10 px-3 py-1.5 text-xs font-black text-rf-pink transition hover:-translate-y-0.5 hover:bg-rf-pink/15"
              >
                {tokenExpired ? "Reconnect Instagram" : appReviewMode ? "Account connected" : "Manage account"}
              </Link>
              {profileSnapshotStatus.label === "Partial" && (
                <span className="ap3k-badge ap3k-badge-slate">Partial profile sync</span>
              )}
              {typeof profileSnapshot?.followersCount !== "number" && profileSnapshotStatus.label !== "Partial" && (
                <span className="ap3k-badge ap3k-badge-slate">Profile sync pending</span>
              )}
            </div>
          </div>
        </div>
      )}

      {needsReviewCampaigns.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          {instagramDisconnected ? (
            <>
              <p>Instagram account disconnected</p>
              <p className="mt-1 font-semibold">Connect Instagram before reactivating campaigns.</p>
            </>
          ) : (
            <p>Instagram account changed. Review campaigns before reactivating.</p>
          )}
        </div>
      )}

      <div className="flex animate-[ap3kDashboardRise_0.6s_ease-out_both] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
              "whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-black transition",
              period === key
                ? "bg-rf-pink/10 text-rf-pink shadow-sm"
                : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/[0.08]",
            ].join(" ")}
          >
            {label}
          </Link>
        ))}
        </div>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {dashboardStats?.period.label ?? "This month"}
        </p>
      </div>

      <div className="grid animate-[ap3kDashboardRise_0.65s_ease-out_both] gap-3 md:grid-cols-4">
        <HealthPill
          label="Instagram connected"
          detail={instagramConnected && !tokenExpired ? "Ready to listen" : "Connect or reconnect first"}
          state={instagramConnected && !tokenExpired ? "ok" : "warn"}
        />
        <HealthPill
          label={appReviewMode ? "Comments active" : "Webhook comments"}
          detail={metrics?.lastRealCommentAt ? "Comments are arriving" : "Test with a real comment"}
          state={metrics?.lastRealCommentAt ? "ok" : "warn"}
        />
        <HealthPill
          label="Campaign status"
          detail={hasActiveCampaign ? `${activeCampaigns.length} live campaign${activeCampaigns.length === 1 ? "" : "s"}` : hasNeedsReviewCampaign ? "Review required" : "Activate a campaign"}
          state={hasActiveCampaign ? "ok" : "warn"}
        />
        <HealthPill
          label={appReviewMode ? "Public replies" : hasExternalDmCampaign ? "External DM mode" : "Private replies"}
          detail={hasActiveCampaign ? (appReviewMode ? "Public replies active" : hasExternalDmCampaign ? "AP3k logs, external tool sends" : "Instagram Graph active") : "Paused until campaign is activated/reviewed"}
          state={hasActiveCampaign ? "ok" : "warn"}
        />
      </div>

      {nextAction && (
        <div className="flex animate-[ap3kDashboardRise_0.7s_ease-out_both] flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 dark:border-white/[0.12] dark:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Next step</p>
            <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{nextAction.title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">{nextAction.detail}</p>
          </div>
          <Link href={nextAction.href} className="ap3k-gradient-button inline-flex shrink-0 justify-center px-5 py-2.5 text-sm">
            {nextAction.cta}
          </Link>
        </div>
      )}

      <section className="animate-[ap3kDashboardRise_0.75s_ease-out_both]">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rf-pink">Account analytics</p>
            <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">Instagram performance</h2>
          </div>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{dashboardStats?.period.label ?? "This month"}</p>
        </div>
        <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_70px_rgba(15,23,42,0.07)] dark:border-white/[0.12] dark:bg-[#111827] md:grid-cols-2 xl:grid-cols-6">
          {dashboardProfileStats.map((stat) => (
            <AccountStatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              change={
                stat.label === "Comments" ? changes?.commentsReceived :
                stat.label === "Leads" ? changes?.leadsCaptured :
                stat.label === "Public Replies" ? changes?.staticRepliesUsed :
                stat.change
              }
              subtitle={stat.subtitle}
            />
          ))}
        </div>
      </section>

      <div className="ap3k-card animate-[ap3kDashboardRise_0.8s_ease-out_both] rounded-3xl p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_80px_rgba(15,23,42,0.12)]">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-950 dark:text-white">Recent Activity</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {appReviewMode
                ? "Review-friendly activity: comments received, triggers matched, public replies sent, and leads captured."
                : "Latest grouped interactions in the selected period — comments, public replies, skipped actions, and private replies."}
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Grouped by comment</span>
        </div>
        {recentActivity.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500 dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-slate-400">
            {activityEmptyState?.hasHistoricalData ? (
              <>
                <p>{activityEmptyState.title}</p>
                <p className="mt-1 font-semibold">Choose another date range to review earlier campaign activity.</p>
              </>
            ) : (
              <>
                <p>{activityEmptyState?.title ?? "No activity yet"}</p>
                <p className="mt-1 font-semibold">
                  {noCommentDiagnosis
                    ? `${noCommentDiagnosis.title}. ${noCommentDiagnosis.detail}`
                    : "Create or activate a campaign, then comment from a separate Instagram account to generate the first log."}
                </p>
              </>
            )}
            {!activityEmptyState?.hasHistoricalData && (
              <Link href={isEmpty ? `/dashboard/${params.slug}/automation/new` : `/dashboard/${params.slug}/account`} className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950">
                {isEmpty ? "Create campaign" : appReviewMode ? "View account" : "Check connection"}
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.07]">
            {recentActivity.map((item, index) => (
              <div key={`${item.id}-${index}`} className="grid gap-3 rounded-2xl px-2 py-4 transition duration-200 hover:bg-slate-50/80 dark:hover:bg-white/[0.035] sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="flex min-w-0 gap-3">
                  <span className={["mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full", recentToneClass(item.tone)].join(" ")} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                      {item.title}{item.actorLabel ? ` ${item.actorLabel}` : ""}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{formatAppReviewActivitySubtitle(item.subtitle, appReviewMode)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-5 sm:pl-0">
                  <span className="ap3k-badge ap3k-badge-slate">{item.badge}</span>
                  <span className="shrink-0 text-xs font-bold text-slate-400">
                    <LocalTime value={item.createdAt} mode="time" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <section className="animate-[ap3kDashboardRise_0.85s_ease-out_both]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-rf-pink">Campaigns</p>
            <h2 className="font-black text-slate-950 dark:text-white">Active campaigns</h2>
          </div>
          <Link
            href={`/dashboard/${params.slug}/automation`}
            className="rounded-xl border border-rf-pink/20 bg-rf-pink/10 px-3 py-1.5 text-xs font-black text-rf-pink transition hover:-translate-y-0.5 hover:bg-rf-pink/15"
          >
            View all
          </Link>
        </div>

        {isEmpty ? (
          <EmptyState
            icon="📣"
            title="No campaigns yet"
            description="Your account is ready, but nothing is listening for comments yet. Create one campaign, choose Any post, add a keyword, and activate."
            ctaLabel="Launch first campaign →"
            ctaHref={`/dashboard/${params.slug}/automation/new`}
          />
        ) : (
          <AutomationTable slug={params.slug} automations={automationsWithMetrics.slice(0, 8)} />
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

function AccountStatCard({
  label,
  value,
  change,
  subtitle,
}: {
  label: string;
  value: string | number;
  change?: ChangeSummary;
  subtitle: string;
}) {
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
