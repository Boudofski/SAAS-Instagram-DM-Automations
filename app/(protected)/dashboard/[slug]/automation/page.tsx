import CampaignCard from "@/components/global/campaign-card";
import EmptyState from "@/components/global/empty-state";
import {
  activateAutomation,
  deleteAutomation,
  duplicateAutomation,
  getAllAutomation,
} from "@/actions/automation";
import Link from "next/link";
import { revalidatePath } from "next/cache";

type Props = { params: { slug: string } };

export default async function AutomationsPage({ params }: Props) {
  const result = await getAllAutomation();
  const automations =
    result.status === 200 && Array.isArray(result.data)
      ? result.data
      : [];

  return (
    <div className="relative p-4 sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-ap3k-radial opacity-70" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="ap3k-kicker mb-2">Automations</p>
          <h1 className="text-2xl font-black tracking-tight text-rf-text">Campaigns</h1>
          <p className="text-sm text-rf-muted mt-1">
            {automations.length} campaign{automations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href={`/dashboard/${params.slug}/automation/new`}
          className="ap3k-gradient-button px-5 py-2.5 text-sm"
        >
          + New Campaign
        </Link>
      </div>

      <div className="mb-6 rounded-2xl border border-blue-100 bg-white p-4 text-slate-950 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-rf-blue">
          Meta review flow
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Create a campaign, comment a keyword from another Instagram account,
          then open the campaign to show webhook activity, keyword match, and DM send logs.
        </p>
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
        <div className="flex flex-col gap-3">
          {automations.map((a: any) => (
            <div key={a.id} className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-2 lg:grid-cols-[1fr_auto]">
              <CampaignCard
                id={a.id}
                slug={params.slug}
                name={typeof a.name === "string" ? a.name : "Untitled campaign"}
                active={Boolean(a.active)}
                keywords={Array.isArray(a.keywords) ? a.keywords : []}
                dmCount={typeof a.listener?.dmCount === "number" ? a.listener.dmCount : 0}
                listenerType={a.listener?.listener ?? null}
              />
              <div className="flex flex-wrap items-center gap-2 px-2 pb-2 lg:flex-col lg:items-stretch lg:justify-center lg:p-2">
                <Link
                  href={`/dashboard/${params.slug}/automation/new?edit=${a.id}`}
                  className="rounded-lg border border-rf-border px-3 py-2 text-xs font-bold text-rf-muted transition-colors hover:border-rf-pink/40 hover:text-rf-text"
                >
                  Edit
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await activateAutomation(a.id, !Boolean(a.active));
                    revalidatePath(`/dashboard/${params.slug}/automation`);
                  }}
                >
                  <button className="w-full rounded-lg border border-rf-border px-3 py-2 text-xs font-bold text-rf-muted transition-colors hover:border-rf-green/40 hover:text-rf-text">
                    {a.active ? "Pause" : "Activate"}
                  </button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await duplicateAutomation(a.id);
                    revalidatePath(`/dashboard/${params.slug}/automation`);
                  }}
                >
                  <button className="w-full rounded-lg border border-rf-border px-3 py-2 text-xs font-bold text-rf-muted transition-colors hover:border-rf-blue/40 hover:text-rf-text">
                    Duplicate
                  </button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await deleteAutomation(a.id);
                    revalidatePath(`/dashboard/${params.slug}/automation`);
                  }}
                >
                  <button className="w-full rounded-lg border border-red-500/20 px-3 py-2 text-xs font-bold text-red-200 transition-colors hover:bg-red-500/10">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
