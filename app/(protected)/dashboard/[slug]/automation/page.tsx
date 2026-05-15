import AutomationTable from "@/components/dashboard/automation-table";
import EmptyState from "@/components/global/empty-state";
import { getAllAutomation } from "@/actions/automation";
import Link from "next/link";

type Props = { params: { slug: string } };

export default async function AutomationsPage({ params }: Props) {
  const result = await getAllAutomation();
  const automations =
    result.status === 200 && Array.isArray(result.data)
      ? result.data
      : [];

  return (
    <div className="relative flex flex-col gap-6 p-4 text-slate-950 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">AutoDM</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Campaigns</h1>
          <p className="mt-1 text-sm text-slate-500">
            {automations.length} campaign{automations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href={`/dashboard/${params.slug}/automation/new`}
          className="ap3k-gradient-button px-5 py-2.5 text-sm"
        >
          + Create Automation
        </Link>
      </div>

      <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">AP3k AutoDM</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">Turn comments into DMs automatically</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Build official Instagram comment-to-DM automations, test keywords, and inspect delivery logs from one clean workspace.
        </p>
        <Link href={`/dashboard/${params.slug}/automation/new`} className="ap3k-gradient-button mt-5 inline-flex px-5 py-2.5 text-sm">
          Create Automation
        </Link>
      </div>

      {automations.length === 0 ? (
        <EmptyState
          icon="📣"
          title="No campaigns yet"
          description="Launch your first comment-to-DM funnel in 60 seconds. Pick a post, add keywords, write your DM."
          ctaLabel="Launch first campaign →"
          ctaHref={`/dashboard/${params.slug}/automation/new`}
        />
      ) : (
        <AutomationTable slug={params.slug} automations={automations as any[]} />
      )}
    </div>
  );
}
