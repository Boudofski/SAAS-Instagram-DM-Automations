import AutomationTable from "@/components/dashboard/automation-table";
import EmptyState from "@/components/global/empty-state";
import OnboardingChecklist from "@/components/global/onboarding-checklist";
import { getAllAutomation, getRecentAutomationActivity } from "@/actions/automation";
import { onUserInfo } from "@/actions/user";
import { getUserMonthlyUsage } from "@/actions/usage/queries";
import {
  type ChangeSummary,
  getCampaignTableMetrics,
  getDashboardGreeting,
  parseDashboardPeriod,
} from "@/lib/dashboard-metrics";
import { formatSnapshotRefreshTime, getInstagramSnapshotComparisonForUser, getProfileSnapshotStatus } from "@/lib/instagram-profile-snapshot";
import { getDashboardProfileStats } from "@/lib/instagram-account-ux";
import { getUserFacingStats } from "@/lib/user-facing-metrics";
import { dashboardNoCommentDiagnosis } from "@/lib/account-webhook-diagnostics";
import { getAccountWebhookDiagnosticsForIntegration } from "@/lib/account-webhook-diagnostics-db";
import { groupCampaignActivity } from "@/lib/campaign-activity-format";
import { formatUsageMetricValue, isUnlimited, usageTone } from "@/lib/plan-limits";
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

  // Redirect to onboarding if no Instagram connected and the user has not skipped it.
  if (
    userResult.status === 200 &&
    userResult.data?.integrations?.length === 0 &&
    !onboardingSkipped
  ) {
    redirect("/onboarding");
  }

  const automations =
    automationsResult.status === 200 && Array.isArray(automationsResult.data)
      ? (automationsResult.data as any[])
      : [];

  const isEmpty = automations.length === 0;
  const instagram = userResult.data?.integrations?.[0];
  const tokenExpired =
    instagram?.expiresAt && new Date(instagram.expiresAt).getTime() < Date.now();
  const displayName = getDashboardGreeting(userResult.data ?? {});
  const hasExternalDmCampaign = automations.some((automation: any) => automation.sendPrivateDm === false);
  const period = parseDashboardPeriod(searchParams?.period);
  const [usage, dashboardStats, campaignMetrics, recentResult, snapshotComparison, accountDiagnostics] = userResult.data?.id
    ? await Promise.all([
        getUserMonthlyUsage(userResult.data.id),
        getUserFacingStats(userResult.data.id, period),
        getCampaignTableMetrics(userResult.data.id),
        getRecentAutomationActivity(),
        getInstagramSnapshotComparisonForUser(userResult.data.id, instagram?.id, period),
        getAccountWebhookDiagnosticsForIntegration(instagram?.id),
      ])
    : [null, null, {} as Record<string, any>, { status: 200, data: [] as any[] }, null, null];
  const profileSnapshot = snapshotComparison?.current;
  const profileSnapshotStatus = getProfileSnapshotStatus(profileSnapshot);
  const displayInstagramUsername = profileSnapshot?.username ?? instagram?.instagramUsername;
  const displayProfilePictureUrl = profileSnapshot?.profilePictureUrl ?? instagram?.profilePictureUrl;
  const automationsWithMetrics = automations.map((automation) => ({
    ...automation,
    metrics: campaignMetrics[automation.id] ?? { runs: 0, leads: automation._count?.leads ?? 0 },
  }));
  const recentActivity = recentResult.status === 200 ? groupCampaignActivity(recentResult.data as any[], { limit: 20 }) : [];
  const planLabel = usage?.planLabel ?? (userResult.data?.subscription?.plan === "PRO" ? "Creator" : "Free");
  const metrics = dashboardStats?.current ?? null;
  const changes = dashboardStats?.changes ?? null;
  const dashboardProfileStats = getDashboardProfileStats({ snapshotComparison, metrics, usage });
  const noCommentDiagnosis = dashboardNoCommentDiagnosis({
    username: displayInstagramUsername,
    status: accountDiagnostics?.delivery.status ?? "no_delivery",
  });

  const checklistItems = [
    { label: "Connect Instagram account", done: (userResult.data?.integrations?.length ?? 0) > 0, href: `/dashboard/${params.slug}/account` },
    { label: "Launch your first campaign", done: automations.length > 0, href: `/dashboard/${params.slug}/automation/new` },
    { label: "Review delivery logs", done: automations.length > 0, href: `/dashboard/${params.slug}/automation` },
  ];

  return (
    <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-1 py-4 text-slate-950 dark:text-slate-50 sm:px-2 lg:py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">AP3k</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Welcome back, {displayName}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Monitor comments, matched keywords, leads, and DM delivery for AP3k automations.
          </p>
        </div>
        <Link href={`/dashboard/${params.slug}/automation/new`} className="ap3k-gradient-button inline-flex w-full justify-center px-5 py-2.5 text-sm sm:w-auto">
          + Create campaign
        </Link>
      </div>

      {isEmpty && (
        <div className="overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 p-6 shadow-sm dark:border-rf-pink/25 dark:bg-ap3k-gradient-soft">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">AP3k onboarding</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Turn comments into DMs automatically</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Connect Instagram, create an automation, comment a keyword from a tester account, then review logs in AP3k.
              </p>
            </div>
            <Link href={`/dashboard/${params.slug}/automation/new`} className="ap3k-gradient-button shrink-0 px-5 py-2.5 text-sm">
              Create Automation
            </Link>
          </div>
        </div>
      )}

      {instagram && (
        <div className={[
          "flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm dark:bg-white/[0.04] lg:flex-row lg:items-center lg:justify-between",
          tokenExpired ? "border-red-200 dark:border-red-500/35" : "border-emerald-100 dark:border-emerald-500/25",
        ].join(" ")}>
          <div className="flex min-w-0 items-center gap-3">
            {displayProfilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayProfilePictureUrl}
                alt={displayInstagramUsername ?? "Connected Instagram account"}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ap3k-gradient text-sm font-black text-white">
                IG
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                {displayInstagramUsername ? `@${displayInstagramUsername}` : "Instagram connected"}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {tokenExpired
                  ? "Token expired. Reconnect Instagram before testing comments."
                  : profileSnapshot?.fetchedAt
                    ? `Profile refreshed ${formatSnapshotRefreshTime(profileSnapshot.fetchedAt)}`
                    : "Ready for official comment-to-DM testing."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black uppercase text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              {tokenExpired ? "Reconnect" : "Connected"}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black uppercase text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
              {planLabel}
            </span>
            {profileSnapshotStatus.label === "Fresh" && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black uppercase text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                Fresh sync
              </span>
            )}
            <Link
              href={`/dashboard/${params.slug}/account`}
              className="text-xs font-bold text-rf-pink hover:text-rf-purple"
            >
              {tokenExpired ? "Reconnect Instagram" : "Manage connection"}
            </Link>
            {typeof profileSnapshot?.followersCount === "number" ? (
              <span className="w-full text-xs font-bold text-slate-500 dark:text-slate-400 lg:text-right">
                {profileSnapshot.followersCount.toLocaleString()} followers
              </span>
            ) : profileSnapshotStatus.label === "Partial" ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black uppercase text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                Partial profile sync
              </span>
            ) : (
              <span className="w-full text-xs font-bold text-slate-500 dark:text-slate-400 lg:text-right">
                Profile sync pending
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
              "whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-black",
              period === key
                ? "bg-rf-pink/10 text-rf-pink"
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

      {usage && (
        <div className={[
          "rounded-3xl border p-5 shadow-sm",
          usage.staticReplies.blocked
            ? "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"
            : usage.staticReplies.percent >= 70
              ? "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
              : "border-rf-pink/20 bg-gradient-to-br from-white via-pink-50/60 to-indigo-50 dark:border-rf-pink/25 dark:from-white/[0.06] dark:via-white/[0.035] dark:to-rf-pink/[0.08]",
        ].join(" ")}>
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-rf-pink">Current plan</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-white">Plan: {usage.planLabel}</h2>
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-300">{usage.periodLabel}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <UsageMini label="Plan" value={usage.planLabel} />
            <UsageMini
              label="Static replies"
              value={formatUsageMetricValue(usage.staticReplies)}
              percent={usage.staticReplies.percent}
              blocked={usage.staticReplies.blocked}
            />
            <UsageMini
              label="Active campaigns"
              value={formatUsageMetricValue(usage.activeCampaigns)}
              percent={usage.activeCampaigns.percent}
              blocked={usage.activeCampaigns.blocked}
            />
            <UsageMini
              label="Connected Instagram accounts"
              value={formatUsageMetricValue(usage.connectedAccounts)}
              percent={usage.connectedAccounts.percent}
              blocked={usage.connectedAccounts.blocked}
            />
          </div>
          {usage.staticReplies.blocked && (
            <p className="mt-3 text-sm font-bold text-red-700 dark:text-red-200">
              Monthly reply limit reached. Campaign replies are paused until upgrade or next month.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <HealthPill label="Instagram connected" state={instagram && !tokenExpired ? "ok" : "warn"} />
        <HealthPill label="Comments webhook active" state={metrics?.lastRealCommentAt ? "ok" : "warn"} />
        <HealthPill label="Public reply fallback ready" state="ok" />
        <HealthPill label={hasExternalDmCampaign ? "External DM mode active" : "DM capability pending"} state="warn" />
      </div>

      <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:grid-cols-2 xl:grid-cols-6">
        {dashboardProfileStats.map((stat) => (
          <AccountStatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            change={
              stat.label === "Comments" ? changes?.commentsReceived :
              stat.label === "Contacts" ? changes?.leadsCaptured :
              stat.label === "Static Replies" ? changes?.staticRepliesUsed :
              stat.change
            }
            subtitle={stat.subtitle}
          />
        ))}
      </div>

      <div className="ap3k-card rounded-2xl p-5">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-950 dark:text-white">Recent Activity</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Latest 20 grouped interactions on this account — comments, public replies, skipped actions, and DMs.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Grouped by comment</span>
        </div>
        {recentActivity.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
            {noCommentDiagnosis ? (
              <>
                <p>{noCommentDiagnosis.title}</p>
                <p className="mt-1 font-semibold">{noCommentDiagnosis.detail}</p>
              </>
            ) : (
              <p>No recent interactions yet.</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {recentActivity.map((item, index) => (
              <div key={`${item.id}-${index}`} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="flex min-w-0 gap-3">
                  <span className={["mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full", recentToneClass(item.tone)].join(" ")} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                      {item.title}{item.actorLabel ? ` ${item.actorLabel}` : ""}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-5 sm:pl-0">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black uppercase text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                    {item.badge}
                  </span>
                  <span className="shrink-0 text-xs font-bold text-slate-400">
                    {new Date(item.createdAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main grid */}
      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">

        {/* Campaigns */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-slate-950 dark:text-white">Active campaigns</h2>
            <Link
              href={`/dashboard/${params.slug}/automation`}
              className="text-xs font-bold text-rf-pink hover:text-rf-purple"
            >
              View all
            </Link>
          </div>

          {isEmpty ? (
            <EmptyState
              icon="📣"
              title="No campaigns yet"
              description="Launch your first comment-to-DM funnel in 60 seconds. Pick a post, add keywords, write your DM."
              ctaLabel="Launch first campaign →"
              ctaHref={`/dashboard/${params.slug}/automation/new`}
            />
          ) : (
            <AutomationTable slug={params.slug} automations={automationsWithMetrics.slice(0, 8)} />
          )}
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">
          <OnboardingChecklist items={checklistItems} />
        </div>

      </div>
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
        : "text-slate-400 dark:text-slate-500";

  return (
    <div className="min-w-0 border-b border-slate-200 p-4 dark:border-white/10 md:border-r xl:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black leading-tight text-slate-500 dark:text-slate-400">{label}</p>
        <span className={`shrink-0 text-xs font-black ${changeClass}`}>{change?.label ?? "—"}</span>
      </div>
      <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-bold leading-tight text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}

function UsageMini({
  label,
  value,
  percent = 0,
  blocked = false,
}: {
  label: string;
  value: string;
  percent?: number;
  blocked?: boolean;
}) {
  const tone = usageTone(percent, blocked);
  const bar = tone === "red" ? "bg-red-500" : tone === "amber" ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">{value}</p>
      {percent > 0 || blocked ? (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.08]">
          <div className={`h-full ${bar}`} style={{ width: `${percent}%` }} />
        </div>
      ) : null}
    </div>
  );
}

function HealthPill({ label, state }: { label: string; state: "ok" | "warn" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center gap-2">
        <span className={state === "ok" ? "h-2.5 w-2.5 rounded-full bg-emerald-500" : "h-2.5 w-2.5 rounded-full bg-amber-500"} />
        <p className="text-xs font-black text-slate-950 dark:text-white">{label}</p>
      </div>
    </div>
  );
}
