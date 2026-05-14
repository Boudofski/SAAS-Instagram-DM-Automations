import { getAutomationInfo, getAutomationLogs, getAutomationStats } from "@/actions/automation";
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
  const logsResult = await getAutomationLogs(params.id);
  const activity = logsResult.status === 200 ? (logsResult.data as any[]) : [];

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

      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-950 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Visual automation builder
              </p>
              <h2 className="mt-1 text-xl font-black">Comment to DM flow</h2>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
              Preview mode
            </span>
          </div>

          <div className="grid gap-4">
            <FlowNode
              label="Trigger"
              title="Post Comments"
              body={
                automation.posts?.[0]
                  ? `When someone comments on media ${automation.posts[0].postid}`
                  : "Add a post or media ID before activating."
              }
              tone="orange"
            />
            <FlowConnector />
            <FlowNode
              label="Condition"
              title="Keyword Matched"
              body={
                automation.keywords?.length
                  ? automation.keywords.map((keyword: any) => keyword.word).join(", ")
                  : "No keywords configured."
              }
              tone="pink"
            />
            <FlowConnector />
            <div className="grid gap-4 md:grid-cols-2">
              <FlowNode
                label="Action"
                title="Reply to Comment"
                body={automation.listener?.commentReply || "Public reply is disabled."}
                tone="purple"
              />
              <FlowNode
                label="Action"
                title="Send Message"
                body={automation.listener?.prompt || "No private DM configured."}
                tone="blue"
              />
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-950 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
            Settings
          </p>
          <div className="mt-5 space-y-4">
            <SettingsRow label="Status" value={automation.active ? "Live" : "Paused"} />
            <SettingsRow label="Matching" value={automation.matchingMode ?? "CONTAINS"} />
            <SettingsRow label="Trigger" value={automation.trigger?.[0]?.type ?? "COMMENT"} />
            <SettingsRow label="Mode" value={automation.listener?.listener ?? "MESSAGE"} />
          </div>
          <Link
            href={`/dashboard/${params.slug}/automation/new?edit=${params.id}`}
            className="ap3k-gradient-button mt-6 block px-4 py-3 text-center text-sm"
          >
            Edit Flow
          </Link>
        </aside>
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

      <div className="mt-6 rounded-2xl border border-rf-border bg-rf-surface p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-rf-text">Live automation log</h2>
            <p className="mt-1 text-xs text-rf-muted">
              Webhook receipts, keyword matches, DM sends, and failures from Meta.
            </p>
          </div>
          <span className="rounded-full border border-rf-border bg-rf-surface2 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-rf-muted">
            Latest 30
          </span>
        </div>

        {activity.length === 0 ? (
          <div className="rounded-xl border border-dashed border-rf-border bg-rf-surface2/60 p-5 text-sm text-rf-muted">
            No webhook activity yet. Comment a campaign keyword from another Instagram account to test the live pipeline.
          </div>
        ) : (
          <div className="divide-y divide-rf-border">
            {activity.map((item) => (
              <div key={`${item.source}-${item.id}`} className="flex gap-3 py-4">
                <span
                  className={[
                    "mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full",
                    getActivityTone(item.type, item.status),
                  ].join(" ")}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-rf-text">
                      {formatActivityType(item.type)}
                    </p>
                    {item.keyword && (
                      <span className="rounded-full bg-rf-blue/10 px-2 py-0.5 text-[11px] font-semibold text-rf-blue">
                        {item.keyword}
                      </span>
                    )}
                    {item.status && (
                      <span className="rounded-full bg-rf-surface2 px-2 py-0.5 text-[11px] font-semibold uppercase text-rf-muted">
                        {item.status}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-rf-muted">
                    {new Date(item.createdAt).toLocaleString()}
                    {item.igUserId ? ` · IG user ${item.igUserId}` : ""}
                    {item.commentId ? ` · comment ${item.commentId}` : ""}
                  </p>
                  {item.errorMessage && (
                    <p className="mt-2 rounded-lg border border-red-500/15 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                      {item.errorMessage}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FlowNode({
  label,
  title,
  body,
  tone,
}: {
  label: string;
  title: string;
  body: string;
  tone: "orange" | "pink" | "purple" | "blue";
}) {
  const tones = {
    orange: "from-orange-50 border-orange-200 text-orange-600",
    pink: "from-pink-50 border-pink-200 text-pink-600",
    purple: "from-purple-50 border-purple-200 text-purple-600",
    blue: "from-blue-50 border-blue-200 text-blue-600",
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br to-white p-5 ${tones[tone]}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.18em]">{label}</p>
      <h3 className="mt-2 text-lg font-black text-slate-950">{title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}

function FlowConnector() {
  return (
    <div className="mx-auto h-8 w-px bg-gradient-to-b from-slate-200 via-rf-pink to-slate-200" />
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function formatActivityType(type: string) {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getActivityTone(type: string, status?: string) {
  if (type.includes("FAILED") || status === "FAILED") return "bg-red-400 shadow-[0_0_16px_rgba(248,113,113,0.6)]";
  if (type.includes("SENT") || type.includes("MATCHED") || status === "PROCESSED") return "bg-rf-green shadow-[0_0_16px_rgba(34,197,94,0.45)]";
  if (type.includes("WEBHOOK") || status === "PROCESSING" || status === "RECEIVED") return "bg-rf-blue shadow-[0_0_16px_rgba(96,165,250,0.45)]";
  return "bg-rf-muted";
}
