import AutomationTable from "@/components/dashboard/automation-table";
import EmptyState from "@/components/global/empty-state";
import OnboardingChecklist from "@/components/global/onboarding-checklist";
import StatCard from "@/components/global/stat-card";
import { getAllAutomation, getRecentAutomationActivity } from "@/actions/automation";
import { onUserInfo } from "@/actions/user";
import { getUserMonthlyUsage } from "@/actions/usage/queries";
import { getCampaignTableMetrics, getDashboardGreeting, getUserDashboardMetrics } from "@/lib/dashboard-metrics";
import { groupCampaignActivity } from "@/lib/campaign-activity-format";
import { isUnlimited, usageTone } from "@/lib/plan-limits";
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
  const range = getDashboardPeriodRange(period);
  const [usage, metrics, campaignMetrics, recentResult] = userResult.data?.id
    ? await Promise.all([
        getUserMonthlyUsage(userResult.data.id),
        getUserDashboardMetrics(userResult.data.id, range),
        getCampaignTableMetrics(userResult.data.id),
        getRecentAutomationActivity(),
      ])
    : [null, null, {} as Record<string, any>, { status: 200, data: [] as any[] }];
  const automationsWithMetrics = automations.map((automation) => ({
    ...automation,
    metrics: campaignMetrics[automation.id] ?? { runs: 0, leads: automation._count?.leads ?? 0 },
  }));
  const recentActivity = recentResult.status === 200 ? groupCampaignActivity(recentResult.data as any[], { limit: 20 }) : [];
  const planLabel = usage?.planLabel ?? (userResult.data?.subscription?.plan === "PRO" ? "Creator" : "Free");
  const dmsSent = metrics?.dmsSent ?? 0;

  const checklistItems = [
    { label: "Connect Instagram account", done: (userResult.data?.integrations?.length ?? 0) > 0, href: `/dashboard/${params.slug}/integrations` },
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
          "flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm dark:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between",
          tokenExpired ? "border-red-200 dark:border-red-500/35" : "border-emerald-100 dark:border-emerald-500/25",
        ].join(" ")}>
          <div className="flex items-center gap-3">
            {instagram.profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={instagram.profilePictureUrl}
                alt={instagram.instagramUsername ?? "Connected Instagram account"}
                className="h-11 w-11 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ap3k-gradient text-sm font-black text-white">
                IG
              </div>
            )}
            <div>
              <p className="text-sm font-black text-slate-950 dark:text-white">
                {instagram.instagramUsername ? `@${instagram.instagramUsername}` : "Instagram connected"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tokenExpired
                  ? "Token expired. Reconnect Instagram before testing comments."
                  : "Ready for official comment-to-DM testing."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-black uppercase text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              {tokenExpired ? "Reconnect" : "Connected"}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black uppercase text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
              {planLabel}
            </span>
            <Link
              href={`/dashboard/${params.slug}/integrations`}
              className="text-xs font-bold text-rf-pink hover:text-rf-purple"
            >
              {tokenExpired ? "Reconnect Instagram" : "Manage connection"}
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          ["24h", "Last 24h"],
          ["7d", "Last 7d"],
          ["month", "This month"],
        ].map(([key, label]) => (
          <Link
            key={key}
            href={`/dashboard/${params.slug}?period=${key}`}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-black",
              period === key
                ? "border-rf-pink/40 bg-rf-pink/10 text-rf-pink"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]",
            ].join(" ")}
          >
            {label}
          </Link>
        ))}
      </div>

      {usage && (
        <div className={[
          "rounded-2xl border p-4 shadow-sm",
          usage.staticReplies.blocked
            ? "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10"
            : usage.staticReplies.percent >= 70
              ? "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
              : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]",
        ].join(" ")}>
          <div className="grid gap-3 md:grid-cols-3">
            <UsageMini label="Plan" value={usage.planLabel} />
            <UsageMini
              label="Static replies this month"
              value={`${usage.staticReplies.used.toLocaleString()} / ${isUnlimited(usage.staticReplies.limit) ? "Unlimited" : usage.staticReplies.limit.toLocaleString()}`}
              percent={usage.staticReplies.percent}
              blocked={usage.staticReplies.blocked}
            />
            <UsageMini
              label="Active campaigns"
              value={`${usage.activeCampaigns.used.toLocaleString()} / ${isUnlimited(usage.activeCampaigns.limit) ? "Unlimited" : usage.activeCampaigns.limit.toLocaleString()}`}
              percent={usage.activeCampaigns.percent}
              blocked={usage.activeCampaigns.blocked}
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

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Comments" icon="CM" value={metrics?.commentsReceived ?? 0} empty={isEmpty} />
        <StatCard label="Messages" icon="DM" value={usage ? `${dmsSent} / ${isUnlimited(usage.staticReplies.limit) ? "Unlimited" : usage.staticReplies.limit}` : dmsSent} empty={isEmpty} />
        <StatCard label="Contacts / Leads" icon="LD" value={metrics?.leadsCaptured ?? 0} empty={isEmpty} />
        <StatCard label="Triggers" icon="TR" value={metrics?.commentsMatched ?? 0} empty={isEmpty} />
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
          <div className="ap3k-card rounded-2xl p-5">
            <div className="mb-4">
              <h2 className="text-sm font-black text-slate-950 dark:text-white">Recent Activity</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Latest interactions on this account — comments, public replies, skipped actions, and DMs.
              </p>
            </div>
            {recentActivity.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
                No recent interactions yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex gap-3">
                    <span className={["mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full", recentToneClass(item.tone)].join(" ")} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                          {item.title}{item.actorLabel ? ` ${item.actorLabel}` : ""}
                        </p>
                        <span className="shrink-0 text-[11px] font-bold text-slate-400">{new Date(item.createdAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <OnboardingChecklist items={checklistItems} />
        </div>

      </div>
    </div>
  );
}

function parseDashboardPeriod(value?: string) {
  return value === "24h" || value === "7d" || value === "month" ? value : "month";
}

function getDashboardPeriodRange(period: "24h" | "7d" | "month") {
  const now = new Date();
  if (period === "24h") return { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), lt: now };
  if (period === "7d") return { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), lt: now };
  return {
    gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    lt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  };
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
    <div>
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
