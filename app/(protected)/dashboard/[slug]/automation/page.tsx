import CampaignCard from "@/components/global/campaign-card";
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
            <CampaignCard
              key={a.id}
              id={a.id}
              slug={params.slug}
              name={typeof a.name === "string" ? a.name : "Untitled campaign"}
              active={Boolean(a.active)}
              keywords={Array.isArray(a.keywords) ? a.keywords : []}
              dmCount={typeof a.listener?.dmCount === "number" ? a.listener.dmCount : 0}
              listenerType={a.listener?.listener ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
