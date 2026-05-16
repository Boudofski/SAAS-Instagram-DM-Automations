import AutomationTable from "@/components/dashboard/automation-table";
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
    <div className="relative flex flex-col gap-6 p-4 text-slate-950 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">AutoDM</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Campaigns</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Monitor comments, matched keywords, leads, and DM delivery for AP3k automations.
          </p>
        </div>
        <Link href={`/dashboard/${params.slug}/automation/new`} className="ap3k-gradient-button inline-flex px-5 py-2.5 text-sm">
          + Create Automation
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="DMs sent"         icon="✉️" value={totalDms}        empty={isEmpty} />
        <StatCard label="Comments matched" icon="💬" value={totalComments}   empty={isEmpty} />
        <StatCard label="Leads captured" icon="🎯" value={automations.reduce((sum: number, a: any) => sum + (a._count?.leads ?? 0), 0)} empty={isEmpty} />
        <StatCard label="Reply rate"       icon="📈" value={`${replyRate}%`} empty={isEmpty} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Campaigns */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-slate-950">Active campaigns</h2>
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
            <AutomationTable slug={params.slug} automations={automations.slice(0, 8)} />
          )}
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">
          <OnboardingChecklist items={checklistItems} />
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-950">Activity feed</h2>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Live
              </span>
            </div>
            {recentActivity.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
                No webhook activity yet. Create a campaign, then comment a keyword from another Instagram account.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentActivity.map((item) => (
                  <div key={`${item.source}-${item.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-bold text-slate-950">
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
                    <p className="mt-1 truncate text-[11px] text-slate-500">
                      {item.campaign} · {formatActivityTime(item.createdAt)}
                    </p>
                    {item.errorMessage && (
                      <p className="mt-2 text-[11px] text-red-600">{item.errorMessage}</p>
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

function formatActivityTime(value: unknown) {
  const date = value ? new Date(value as string | number | Date) : null;
  if (!date || Number.isNaN(date.getTime())) return "time unavailable";
  return date.toLocaleTimeString();
}
