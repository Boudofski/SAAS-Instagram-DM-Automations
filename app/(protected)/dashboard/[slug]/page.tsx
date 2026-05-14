import CampaignCard from "@/components/global/campaign-card";
import EmptyState from "@/components/global/empty-state";
import OnboardingChecklist from "@/components/global/onboarding-checklist";
import StatCard from "@/components/global/stat-card";
import { getAllAutomation, getRecentAutomationActivity } from "@/actions/automation";
import { onUserInfo } from "@/actions/user";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type Props = { params: { slug: string } };

const onboardingSkippedCookie = (clerkId: string) =>
  `ap3k_onboarding_skipped_${clerkId}`;

export default async function DashboardPage({ params }: Props) {
  const [userResult, automationsResult, activityResult] = await Promise.all([
    onUserInfo(),
    getAllAutomation(),
    getRecentAutomationActivity(),
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

  const automations = automationsResult.status === 200
    ? (automationsResult.data as any[])
    : [];

  const totalDms = automations.reduce(
    (sum: number, a: any) => sum + (a.listener?.dmCount ?? 0), 0
  );
  const totalComments = automations.reduce(
    (sum: number, a: any) => sum + (a.listener?.commentCount ?? 0), 0
  );
  const activeCount = automations.filter((a: any) => a.active).length;
  const replyRate = totalComments > 0
    ? Math.round((totalDms / totalComments) * 100)
    : 0;

  const isEmpty = automations.length === 0;
  const recentActivity =
    activityResult.status === 200 ? ((activityResult.data as any[]) ?? []) : [];
  const instagram = userResult.data?.integrations?.[0];
  const tokenExpired =
    instagram?.expiresAt && new Date(instagram.expiresAt).getTime() < Date.now();

  const checklistItems = [
    { label: "Connect Instagram account", done: (userResult.data?.integrations?.length ?? 0) > 0, href: `/dashboard/${params.slug}/integrations` },
    { label: "Launch your first campaign", done: automations.length > 0, href: `/dashboard/${params.slug}/automation/new` },
    { label: "Upgrade to Creator — unlock AI", done: userResult.data?.subscription?.plan === "PRO", href: "/payment?plan=creator" },
  ];

  return (
    <div className="relative flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-ap3k-radial opacity-80" />

      <div className="flex flex-col gap-2">
        <p className="ap3k-kicker">Creator command center</p>
        <h1 className="text-2xl font-black tracking-tight text-rf-text sm:text-3xl">
          Instagram comments into <span className="ap3k-gradient-text">DM revenue</span>
        </h1>
        <p className="max-w-2xl text-sm text-rf-muted">
          Monitor campaign momentum, capture leads, and launch new comment-to-DM flows without leaving AP3k.
        </p>
      </div>

      <div className="rounded-2xl border border-rf-blue/20 bg-rf-blue/10 p-4">
        <p className="text-xs font-black uppercase tracking-wider text-rf-blue">
          Meta review test mode
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {[
            { label: "Connect Instagram", done: Boolean(instagram), href: `/dashboard/${params.slug}/integrations` },
            { label: "Create Campaign", done: automations.length > 0, href: `/dashboard/${params.slug}/automation/new` },
            { label: "Test Comment", done: recentActivity.some((item) => item.type === "DM_SENT"), href: automations[0]?.id ? `/dashboard/${params.slug}/automation/${automations[0].id}` : `/dashboard/${params.slug}/automation/new` },
          ].map((item, index) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-xl border border-white/10 bg-rf-surface/70 p-3 text-sm transition-colors hover:border-rf-pink/30"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-rf-muted">
                Step {index + 1}
              </span>
              <span className="mt-1 flex items-center justify-between font-bold text-rf-text">
                {item.label}
                <span className={item.done ? "text-rf-green" : "text-rf-muted"}>
                  {item.done ? "Done" : "Open"}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      {instagram && (
        <div className={[
          "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between",
          tokenExpired ? "border-red-500/20 bg-red-500/10" : "border-rf-green/15 bg-rf-green/10",
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
              <p className="text-sm font-black text-rf-text">
                {instagram.instagramUsername ? `@${instagram.instagramUsername}` : "Instagram connected"}
              </p>
              <p className="text-xs text-rf-muted">
                {tokenExpired
                  ? "Token expired. Reconnect Instagram before testing comments."
                  : "Ready for official comment-to-DM testing."}
              </p>
            </div>
          </div>
          <Link
            href={`/dashboard/${params.slug}/integrations`}
            className="text-xs font-bold text-rf-pink hover:text-rf-purple"
          >
            {tokenExpired ? "Reconnect Instagram" : "Manage connection"}
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="DMs sent"         icon="✉️" value={totalDms}        empty={isEmpty} />
        <StatCard label="Comments matched" icon="💬" value={totalComments}   empty={isEmpty} />
        <StatCard label="Active campaigns" icon="📣" value={activeCount}     empty={isEmpty} />
        <StatCard label="Reply rate"       icon="📈" value={`${replyRate}%`} empty={isEmpty} />
      </div>

      {/* Quick create */}
      <div className="ap3k-card relative overflow-hidden rounded-3xl p-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-rf-pink/18 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rf-orange/60 to-transparent" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-ap3k-gradient
                          flex items-center justify-center text-2xl flex-shrink-0 shadow-ap3k-glow">
            🚀
          </div>
          <div>
            <h3 className="font-black text-rf-text">Launch a new campaign</h3>
            <p className="text-xs text-rf-muted">
              Pick a post, add keywords, write your DM — live in 60 seconds.
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/${params.slug}/automation/new`}
          className="ap3k-gradient-button flex-shrink-0 px-5 py-2.5 text-sm"
        >
          + New Campaign
        </Link>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Campaigns */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-rf-text">Active campaigns</h2>
            <Link
              href={`/dashboard/${params.slug}/automation`}
              className="text-xs font-bold text-rf-pink hover:text-rf-purple"
            >
              View all →
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
            <div className="flex flex-col gap-3">
              {automations.slice(0, 5).map((a: any) => (
                <CampaignCard
                  key={a.id}
                  id={a.id}
                  slug={params.slug}
                  name={a.name}
                  active={a.active}
                  keywords={a.keywords ?? []}
                  dmCount={a.listener?.dmCount ?? 0}
                  listenerType={a.listener?.listener}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">
          <OnboardingChecklist items={checklistItems} />
          <div className="ap3k-card rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black text-rf-text">Activity feed</h2>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rf-muted">
                Live
              </span>
            </div>
            {recentActivity.length === 0 ? (
              <p className="rounded-xl border border-dashed border-rf-border bg-rf-surface2/60 p-4 text-xs leading-relaxed text-rf-muted">
                No webhook activity yet. Create a campaign, then comment a keyword from another Instagram account.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentActivity.map((item) => (
                  <div key={`${item.source}-${item.id}`} className="rounded-xl border border-rf-border bg-rf-surface2/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-bold text-rf-text">
                        {formatActivity(item.type)}
                      </p>
                      <span className={[
                        "h-2 w-2 rounded-full",
                        item.type.includes("FAILED") || item.status === "FAILED"
                          ? "bg-red-400"
                          : item.type.includes("SENT") || item.type.includes("MATCHED")
                          ? "bg-rf-green"
                          : "bg-rf-blue",
                      ].join(" ")} />
                    </div>
                    <p className="mt-1 truncate text-[11px] text-rf-muted">
                      {item.campaign} · {new Date(item.createdAt).toLocaleTimeString()}
                    </p>
                    {item.errorMessage && (
                      <p className="mt-2 text-[11px] text-red-200">{item.errorMessage}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function formatActivity(type: string) {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
