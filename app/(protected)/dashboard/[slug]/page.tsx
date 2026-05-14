import CampaignCard from "@/components/global/campaign-card";
import EmptyState from "@/components/global/empty-state";
import OnboardingChecklist from "@/components/global/onboarding-checklist";
import StatCard from "@/components/global/stat-card";
import { getAllAutomation } from "@/actions/automation";
import { onUserInfo } from "@/actions/user";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type Props = { params: { slug: string } };

const onboardingSkippedCookie = (clerkId: string) =>
  `ap3k_onboarding_skipped_${clerkId}`;

export default async function DashboardPage({ params }: Props) {
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
        </div>

      </div>
    </div>
  );
}
