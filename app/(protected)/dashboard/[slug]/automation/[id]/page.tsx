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

  const isAnyComment = automation.triggerMode === "ANY_COMMENT";
  const isIncomplete = !automation.listener || !automation.posts?.length || (!isAnyComment && !automation.keywords?.length);

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
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 text-slate-950 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link
            href={`/dashboard/${params.slug}/automation`}
            className="text-xs text-slate-500 hover:text-slate-950 transition-colors mb-2 inline-block"
          >
            Campaigns
          </Link>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">Automation detail</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
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
          </div>
        </div>
        <ActiveAutomationButton id={params.id} />
      </div>

      {isIncomplete && (
        <div className="mb-6 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black uppercase tracking-wider text-amber-400">
              Campaign setup incomplete
            </p>
            <p className="mt-1 text-sm text-slate-500">
              This campaign is missing{" "}
              {[
                !automation.posts?.length && "a post",
                !isAnyComment && !automation.keywords?.length && "keywords",
                !automation.listener && "a DM message",
              ]
                .filter(Boolean)
                .join(", ")}
              . It won&apos;t trigger until setup is finished.
            </p>
          </div>
          <Link
            href={`/dashboard/${params.slug}/automation/new?edit=${params.id}`}
            className="ap3k-gradient-button shrink-0 px-5 py-2.5 text-sm"
          >
            Resume setup
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-950 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">
                AutoDM flow
              </p>
              <h2 className="mt-1 text-xl font-black">When comments match, AP3k sends the DM</h2>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
              Live preview
            </span>
          </div>

          <div className="grid gap-4">
            <FlowNode
              label="Trigger"
              title="Post Comments"
              body={
                automation.posts?.[0]
                  ? automation.posts[0].postid === "ANY"
                    ? "When someone comments on any of your posts or Reels."
                    : `When someone comments on media ${automation.posts[0].postid}`
                  : "Add a post or media ID before activating."
              }
              tone="orange"
            />
            <FlowConnector />
            <FlowNode
              label="Condition"
              title="Keyword Matched"
              body={
                isAnyComment
                  ? "Every comment triggers this campaign."
                  : automation.keywords?.length
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
            <SettingsRow label="Trigger mode" value={isAnyComment ? "Any comment" : "Specific keyword"} />
            <SettingsRow label="Matching" value={isAnyComment ? "Every comment" : automation.matchingMode ?? "CONTAINS"} />
            <SettingsRow label="Trigger" value={automation.trigger?.[0]?.type ?? "COMMENT"} />
            <SettingsRow label="Mode" value={automation.listener?.listener ?? "MESSAGE"} />
          </div>
          <Link
            href={`/dashboard/${params.slug}/automation/new?edit=${params.id}`}
            className="ap3k-gradient-button mt-6 block px-4 py-3 text-center text-sm"
          >
            Edit Automation
          </Link>
        </aside>
      </div>

      <div className="mb-8 rounded-2xl border border-blue-100 bg-white p-4 text-slate-950 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-rf-blue">
          Reviewer test script
        </p>
        <p className="mt-2 text-sm text-slate-600">
          This campaign listens for comments on the selected Instagram media,
          matches the configured keyword, replies publicly if enabled, then sends
          the private DM through Meta&apos;s official API. The log below shows
          each step when a real test comment is received.
        </p>
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
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="text-sm font-bold text-slate-950">Campaign details</h2>

          {/* Post */}
          {automation.posts?.[0] && (
            <div>
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Post</p>
              {automation.posts[0].postid === "ANY" ? (
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                  <span className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center bg-rf-blue/10 text-2xl">🌐</span>
                  <p className="text-xs text-slate-500">Any post - triggers on all Instagram posts</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                  {automation.posts[0].media ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={automation.posts[0].media}
                      alt={automation.posts[0].caption ?? "post"}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <span className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center bg-slate-50 text-xl">📷</span>
                  )}
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {automation.posts[0].caption ?? "Reel / Post"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Keywords */}
          <div>
            <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Trigger</p>
            <div className="flex flex-wrap gap-2">
              {isAnyComment ? (
                <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-rf-blue/10 text-rf-blue border-rf-blue/20">
                  Every comment
                </span>
              ) : automation.keywords?.length > 0 ? (
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
                <span className="text-xs text-slate-500">No keywords set</span>
              )}
            </div>
          </div>

          {/* DM preview */}
          {automation.listener && (
            <div>
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">
                DM message
              </p>
              <div className="bg-rf-blue/5 border border-rf-blue/15 rounded-xl p-4">
                <p className="text-xs text-slate-950 leading-relaxed whitespace-pre-wrap">
                  {automation.listener.prompt}
                </p>
              </div>
              {/* CTA button */}
              {(automation.listener.ctaButtonTitle || automation.listener.ctaLink) && (
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-rf-blue/25 bg-rf-blue/10 px-4 py-2.5">
                  <span className="text-xs font-bold text-rf-blue">
                    {automation.listener.ctaButtonTitle || "Open link"}
                  </span>
                  {automation.listener.ctaLink && (
                    <span className="text-[10px] text-slate-500 truncate">
                      {automation.listener.ctaLink}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Public reply variations */}
          {automation.listener && (
            automation.listener.commentReply ||
            automation.listener.commentReply2 ||
            automation.listener.commentReply3
          ) && (
            <div>
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">
                Public reply variations
              </p>
              <div className="flex flex-col gap-2">
                {[
                  automation.listener.commentReply,
                  automation.listener.commentReply2,
                  automation.listener.commentReply3,
                ]
                  .filter(Boolean)
                  .map((reply: string, i: number) => (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-950"
                    >
                      <span className="mr-2 text-slate-500 font-semibold">{i + 1}.</span>
                      {reply}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-950">Quick actions</h2>
          <Link
            href={`/dashboard/${params.slug}/automation/new`}
            className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200
                       rounded-xl text-sm text-slate-500 hover:text-slate-950 hover:border-rf-blue/30
                       transition-all"
          >
            <span>➕</span> Create a new campaign
          </Link>
          <Link
            href={`/dashboard/${params.slug}/automation`}
            className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200
                       rounded-xl text-sm text-slate-500 hover:text-slate-950 hover:border-rf-blue/30
                       transition-all"
          >
            <span>📣</span> View all campaigns
          </Link>
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-dashed
                          border-slate-200 rounded-xl text-sm text-slate-400">
            <span>📤</span> Export leads (coming soon)
          </div>
        </div>

      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-950">Live automation log</h2>
            <p className="mt-1 text-xs text-slate-500">
              Webhook receipts, keyword matches, DM sends, and failures from Meta.
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Latest 30
          </span>
        </div>

        {activity.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
            No webhook activity yet. Comment a campaign keyword from another Instagram account to test the live pipeline.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
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
                    <p className="text-sm font-semibold text-slate-950">
                      {formatActivityType(item.type)}
                    </p>
                    {item.keyword && (
                      <span className="rounded-full bg-rf-blue/10 px-2 py-0.5 text-[11px] font-semibold text-rf-blue">
                        {item.keyword}
                      </span>
                    )}
                    {item.status && (
                      <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-semibold uppercase text-slate-500">
                        {item.status}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleString()}
                    {item.igUserId ? ` · IG user ${item.igUserId}` : ""}
                    {item.commentId ? ` · comment ${item.commentId}` : ""}
                  </p>
                  {item.errorMessage && (
                    <p className="mt-2 rounded-lg border border-red-500/15 bg-red-500/10 px-3 py-2 text-xs text-red-700">
                      {formatLogError(item.errorMessage)}
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
  const friendly: Record<string, string> = {
    WEBHOOK_RECEIVED: "Comment webhook received",
    COMMENT_RECEIVED: "Comment received",
    KEYWORD_MATCHED: "Trigger matched",
    PUBLIC_REPLY_SENT: "Public reply sent",
    PUBLIC_REPLY_FAILED: "Public reply failed",
    DM_SENT: "Private DM sent",
    DM_FAILED: "Private DM failed",
    DUPLICATE_SKIPPED: "Duplicate skipped",
    NO_MATCH: "No trigger match",
    DM_FAILED_FAILED: "Private DM failed",
    COMMENT_REPLY_SENT: "Public reply sent",
    COMMENT_REPLY_FAILED: "Public reply failed",
  };
  if (friendly[type]) return friendly[type];
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatLogError(message: string) {
  if (message.includes("code=3") || message.includes("capability") || message.includes("permission")) {
    return "Meta blocked private DM until instagram_manage_messages capability is approved.";
  }
  return message;
}

function getActivityTone(type: string, status?: string) {
  if (type.includes("FAILED") || status === "FAILED") return "bg-red-400 shadow-[0_0_16px_rgba(248,113,113,0.6)]";
  if (type.includes("SENT") || type.includes("MATCHED") || status === "PROCESSED") return "bg-rf-green shadow-[0_0_16px_rgba(34,197,94,0.45)]";
  if (type.includes("WEBHOOK") || status === "PROCESSING" || status === "RECEIVED") return "bg-rf-blue shadow-[0_0_16px_rgba(96,165,250,0.45)]";
  return "bg-slate-400";
}
