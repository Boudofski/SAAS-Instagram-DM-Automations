import AutomationTable from "@/components/dashboard/automation-table";
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

  const automations =
    automationsResult.status === 200 && Array.isArray(automationsResult.data)
      ? (automationsResult.data as any[])
      : [];

  const totalDms = automations.reduce(
    (sum: number, a: any) => sum + (a.listener?.dmCount ?? 0), 0
  );
  const totalComments = automations.reduce(
    (sum: number, a: any) => sum + (a.listener?.commentCount ?? 0), 0
  );
  const replyRate = totalComments > 0
    ? Math.round((totalDms / totalComments) * 100)
    : 0;

  const isEmpty = automations.length === 0;
  const instagram = userResult.data?.integrations?.[0];
  const tokenExpired =
    instagram?.expiresAt && new Date(instagram.expiresAt).getTime() < Date.now();

  const checklistItems = [
    { label: "Connect Instagram account", done: (userResult.data?.integrations?.length ?? 0) > 0, href: `/dashboard/${params.slug}/integrations` },
    { label: "Launch your first campaign", done: automations.length > 0, href: `/dashboard/${params.slug}/automation/new` },
    { label: "Review delivery logs", done: automations.length > 0, href: `/dashboard/${params.slug}/automation` },
  ];

  return (
    <div className="relative flex flex-col gap-6 p-4 text-slate-950 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">AP3k</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Instagram AutoDM</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Monitor comments, matched keywords, leads, and DM delivery for AP3k automations.
          </p>
        </div>
        <Link href={`/dashboard/${params.slug}/automation/new`} className="ap3k-gradient-button inline-flex px-5 py-2.5 text-sm">
          + Create campaign
        </Link>
      </div>

      {isEmpty && (
        <div className="overflow-hidden rounded-2xl border border-pink-100 bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">AP3k onboarding</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Turn comments into DMs automatically</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
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
          "flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between",
          tokenExpired ? "border-red-200" : "border-emerald-100",
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
              <p className="text-sm font-black text-slate-950">
                {instagram.instagramUsername ? `@${instagram.instagramUsername}` : "Instagram connected"}
              </p>
              <p className="text-xs text-slate-500">
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

      <div className="grid gap-3 md:grid-cols-4">
        <HealthPill label="Instagram connected" state={instagram && !tokenExpired ? "ok" : "warn"} />
        <HealthPill label="Comments webhook active" state="ok" />
        <HealthPill label="Public reply fallback ready" state="ok" />
        <HealthPill label="DM capability pending" state="warn" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="DMs sent"         icon="✉️" value={totalDms}        empty={isEmpty} />
        <StatCard label="Comments matched" icon="💬" value={totalComments}   empty={isEmpty} />
        <StatCard label="Leads captured" icon="🎯" value={automations.reduce((sum: number, a: any) => sum + (a._count?.leads ?? 0), 0)} empty={isEmpty} />
        <StatCard label="Reply rate"       icon="📈" value={`${replyRate}%`} empty={isEmpty} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

        {/* Campaigns */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-slate-950">Active campaigns</h2>
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
            <AutomationTable slug={params.slug} automations={automations.slice(0, 8)} />
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

function HealthPill({ label, state }: { label: string; state: "ok" | "warn" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={state === "ok" ? "h-2.5 w-2.5 rounded-full bg-emerald-500" : "h-2.5 w-2.5 rounded-full bg-amber-500"} />
        <p className="text-xs font-black text-slate-950">{label}</p>
      </div>
    </div>
  );
}
