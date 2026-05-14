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
    <div className="flex flex-col gap-6 p-8">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="DMs sent"         icon="✉️" value={totalDms}        empty={isEmpty} />
        <StatCard label="Comments matched" icon="💬" value={totalComments}   empty={isEmpty} />
        <StatCard label="Active campaigns" icon="📣" value={activeCount}     empty={isEmpty} />
        <StatCard label="Reply rate"       icon="📈" value={`${replyRate}%`} empty={isEmpty} />
      </div>

      {/* Quick create */}
      <div className="bg-gradient-to-r from-rf-blue/8 to-rf-purple/8 border border-rf-blue/20
                      rounded-2xl p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rf-blue to-rf-purple
                          flex items-center justify-center text-2xl flex-shrink-0">
            🚀
          </div>
          <div>
            <h3 className="font-bold text-rf-text">Launch a new campaign</h3>
            <p className="text-xs text-rf-muted">
              Pick a post, add keywords, write your DM — live in 60 seconds.
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/${params.slug}/automation/new`}
          className="flex-shrink-0 bg-rf-blue hover:bg-rf-blue/90 text-white font-bold
                     text-sm px-5 py-2.5 rounded-xl transition-colors
                     shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
        >
          + New Campaign
        </Link>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Campaigns */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-rf-text">Active campaigns</h2>
            <Link
              href={`/dashboard/${params.slug}/automation`}
              className="text-xs text-rf-blue hover:underline"
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
