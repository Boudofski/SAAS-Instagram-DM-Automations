import CampaignCard from "@/components/global/campaign-card";
import EmptyState from "@/components/global/empty-state";
import { getAllAutomation } from "@/actions/automation";
import Link from "next/link";

type Props = { params: { slug: string } };

export default async function AutomationsPage({ params }: Props) {
  const result = await getAllAutomation();
  const automations = result.status === 200 ? (result.data as any[]) : [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-rf-text">Campaigns</h1>
          <p className="text-sm text-rf-muted mt-1">
            {automations.length} campaign{automations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href={`/dashboard/${params.slug}/automation/new`}
          className="bg-rf-blue hover:bg-rf-blue/90 text-white font-bold text-sm
                     px-5 py-2.5 rounded-xl transition-colors"
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
  );
}
