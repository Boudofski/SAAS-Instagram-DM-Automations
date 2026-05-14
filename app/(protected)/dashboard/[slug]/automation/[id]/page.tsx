import { getAutomationInfo, getAutomationStats } from "@/actions/automation";
import ActiveAutomationButton from "@/components/global/active-automation-button";
import StatCard from "@/components/global/stat-card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: { id: string; slug: string } };

export async function generateMetadata({ params }: { params: { id: string } }) {
  const info = await getAutomationInfo(params.id);
  return { title: info.data?.name ?? "Campaign" };
}

export default async function CampaignDetailPage({ params }: Props) {
  const [automationResult, statsResult] = await Promise.all([
    getAutomationInfo(params.id),
    getAutomationStats(params.id),
  ]);

  if (automationResult.status !== 200 || !automationResult.data) notFound();

  const automation = automationResult.data as any;
  const stats = statsResult.status === 200 ? statsResult.data : null;

  const replyRate =
    stats && stats.commentsReceived > 0
      ? Math.round((stats.dmsSent / stats.commentsReceived) * 100)
      : automation.listener
      ? Math.round(
          (automation.listener.dmCount /
            Math.max(automation.listener.commentCount, 1)) *
            100
        )
      : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <Link
            href={`/dashboard/${params.slug}/automation`}
            className="text-xs text-rf-muted hover:text-rf-text transition-colors mb-2 inline-block"
          >
            ← Campaigns
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-rf-text">
            {automation.name}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              className={
                automation.active
                  ? "bg-rf-green/10 text-rf-green border-rf-green/25"
                  : "bg-rf-amber/10 text-rf-amber border-rf-amber/25"
              }
              variant="outline"
            >
              {automation.active ? "● Live" : "● Paused"}
            </Badge>
            {automation.listener?.listener === "SMARTAI" && (
              <Badge className="bg-rf-purple/10 text-rf-purple border-rf-purple/25" variant="outline">
                Smart AI
              </Badge>
            )}
          </div>
        </div>
        <ActiveAutomationButton id={params.id} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="DMs sent"
          icon="✉️"
          value={stats?.dmsSent ?? automation.listener?.dmCount ?? 0}
        />
        <StatCard
          label="Leads captured"
          icon="🎯"
          value={stats?.leadsCollected ?? 0}
        />
        <StatCard
          label="Comments matched"
          icon="💬"
          value={stats?.commentsReceived ?? automation.listener?.commentCount ?? 0}
        />
        <StatCard
          label="Reply rate"
          icon="📈"
          value={`${replyRate}%`}
        />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Campaign info */}
        <div className="bg-rf-surface border border-rf-border rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="text-sm font-bold text-rf-text">Campaign details</h2>

          {/* Post */}
          {automation.posts?.[0] && (
            <div>
              <p className="text-xs text-rf-muted mb-2 uppercase tracking-wider font-semibold">Post</p>
              <div className="flex items-center gap-3 bg-rf-surface2 rounded-xl p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={automation.posts[0].media}
                  alt={automation.posts[0].caption ?? "post"}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                />
                <p className="text-xs text-rf-muted line-clamp-2">
                  {automation.posts[0].caption ?? "Reel / Post"}
                </p>
              </div>
            </div>
          )}

          {/* Keywords */}
          <div>
            <p className="text-xs text-rf-muted mb-2 uppercase tracking-wider font-semibold">Keywords</p>
            <div className="flex flex-wrap gap-2">
              {automation.keywords?.length > 0 ? (
                automation.keywords.map((kw: any, i: number) => (
                  <span
                    key={kw.id}
                    className={[
                      "text-xs font-semibold px-3 py-1 rounded-full border",
                      ["bg-rf-blue/10 text-rf-blue border-rf-blue/20",
                       "bg-rf-purple/10 text-rf-purple border-rf-purple/20",
                       "bg-rf-green/10 text-rf-green border-rf-green/20",
                       "bg-rf-amber/10 text-rf-amber border-rf-amber/20"][i % 4],
                    ].join(" ")}
                  >
                    {kw.word}
                  </span>
                ))
              ) : (
                <span className="text-xs text-rf-muted">No keywords set</span>
              )}
            </div>
          </div>

          {/* DM preview */}
          {automation.listener && (
            <div>
              <p className="text-xs text-rf-muted mb-2 uppercase tracking-wider font-semibold">
                DM message
              </p>
              <div className="bg-rf-blue/5 border border-rf-blue/15 rounded-xl p-4">
                <p className="text-xs text-rf-text leading-relaxed whitespace-pre-wrap">
                  {automation.listener.prompt}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-rf-surface border border-rf-border rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-rf-text">Quick actions</h2>
          <Link
            href={`/dashboard/${params.slug}/automation/new`}
            className="flex items-center gap-3 px-4 py-3 bg-rf-surface2 border border-rf-border
                       rounded-xl text-sm text-rf-muted hover:text-rf-text hover:border-rf-blue/30
                       transition-all"
          >
            <span>➕</span> Create a new campaign
          </Link>
          <Link
            href={`/dashboard/${params.slug}/automation`}
            className="flex items-center gap-3 px-4 py-3 bg-rf-surface2 border border-rf-border
                       rounded-xl text-sm text-rf-muted hover:text-rf-text hover:border-rf-blue/30
                       transition-all"
          >
            <span>📣</span> View all campaigns
          </Link>
          <div className="flex items-center gap-3 px-4 py-3 bg-rf-surface2 border border-dashed
                          border-rf-border rounded-xl text-sm text-rf-subtle">
            <span>📤</span> Export leads (coming soon)
          </div>
        </div>

      </div>
    </div>
  );
}
