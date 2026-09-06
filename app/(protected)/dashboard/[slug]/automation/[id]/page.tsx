import { getAutomationInfo, getAutomationLogs, getAutomationStats } from "@/actions/automation";
import ActiveAutomationButton from "@/components/global/active-automation-button";
import LocalTime from "@/components/global/local-time";
import { Badge } from "@/components/ui/badge";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";
import { formatKeywordDisplay } from "@/lib/keyword-display";
import { formatAppReviewActivitySubtitle } from "@/lib/app-review-activity-copy";
import { filterAppReviewActivity, groupCampaignActivity } from "@/lib/campaign-activity-format";
import { customerReplyCopy } from "@/lib/customer-reply-copy";
import { readLinkButtons } from "@/lib/link-buttons";
import {
  resolveFollowRequestButtonText,
  resolveFollowRequestDmText,
  resolveOpeningDmButtonText,
  resolveOpeningDmText,
} from "@/lib/comment-dm-flow";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

type Props = { params: { id: string; slug: string } };

export async function generateMetadata({ params }: { params: { id: string } }) {
  const info = await getAutomationInfo(params.id);
  return { title: info.data?.name ?? "Automation" };
}

export default async function CampaignDetailPage({ params }: Props) {
  const [automationResult, statsResult, logsResult] = await Promise.all([
    getAutomationInfo(params.id),
    getAutomationStats(params.id),
    getAutomationLogs(params.id),
  ]);

  if (automationResult.status !== 200 || !automationResult.data) notFound();

  const automation = automationResult.data as any;
  const stats = statsResult.status === 200 ? statsResult.data : null;
  const activity = logsResult.status === 200 ? (logsResult.data as any[]) : [];
  const connectedIntegration = getCanonicalInstagramIntegration<any>(automation.User?.integrations);
  const post = automation.posts?.[0];
  const source = automation.source === "STORY" || automation.source === "DM" ? automation.source : "COMMENT";
  const isMessageAutomation = source !== "COMMENT";
  const isAnyPost = post?.postid === "ANY";
  const isAnyComment = automation.triggerMode === "ANY_COMMENT";
  const sendPrivateDm = automation.sendPrivateDm !== false;
  const commentReplies = [
    automation.listener?.commentReply,
    automation.listener?.commentReply2,
    automation.listener?.commentReply3,
  ].filter(Boolean) as string[];
  const hasCommentReply = commentReplies.length > 0;
  const hasDm = sendPrivateDm && Boolean(automation.listener?.prompt);
  const linkButtons = readLinkButtons(
    automation.listener?.quickReplies,
    automation.listener?.ctaButtonTitle,
    automation.listener?.ctaLink
  );
  const openingDmText = resolveOpeningDmText(automation.listener?.openingDmText);
  const openingDmButtonText = resolveOpeningDmButtonText(automation.listener?.openingDmButtonText);
  const followRequestDmText = resolveFollowRequestDmText(automation.listener?.followRequestDmText);
  const followRequestButtonText = resolveFollowRequestButtonText(automation.listener?.followRequestButtonText);
  const isLive = Boolean(automation.active && !automation.needsReview && !automation.archivedAt);
  const groupedAll = groupCampaignActivity(activity, { privateDmEnabled: sendPrivateDm, limit: 20 });
  const groupedActivity = filterAppReviewActivity(groupedAll, 20);
  const keywords = (automation.keywords ?? []).map((keyword: any) =>
    formatKeywordDisplay(String(keyword.word ?? ""), true)
  );
  const selectedPostLabel = isAnyPost
    ? "Any post or Reel"
    : post?.caption
      ? post.caption
      : post?.postid
        ? `Specific Instagram media · ${shortId(String(post.postid))}`
        : "No post selected";
  const triggerLabel = source === "STORY"
    ? automation.storyTriggerType === "REACTION" ? "Story reaction" : automation.storyTriggerType === "REPLY" ? "Story reply" : "Story mention"
    : source === "DM" && automation.triggerMode === "ANY_MESSAGE"
      ? "Any incoming DM"
      : isAnyComment ? "Any comment" : keywords.length ? keywords.join(", ") : "No keyword configured";
  const sourceLabel = source === "STORY" ? "Instagram Stories" : source === "DM" ? "Instagram DMs" : "Posts & Reels";
  const editHref = `/dashboard/${params.slug}/automation/new?edit=${params.id}&type=${source.toLowerCase()}`;
  const statusLabel = automation.archivedAt
    ? "Archived"
    : automation.needsReview
      ? "Needs attention"
      : isLive
        ? "Live"
        : automation.listener
          ? "Paused"
          : "Draft";

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-4 p-4 text-slate-950 dark:text-white sm:p-6 xl:mt-3 xl:h-[calc(100dvh-7.5rem)] xl:min-h-0 xl:overflow-hidden">
      <header className="flex shrink-0 animate-[ap3kDashboardRise_0.38s_ease-out_both] flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href={`/dashboard/${params.slug}/automation`} className="mb-1 inline-block text-xs font-bold text-slate-500 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
            ← Automations
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">{automation.name}</h1>
            <StatusBadge status={statusLabel} />
            <span className="ap3k-badge ap3k-badge-slate">{connectedIntegration?.instagramUsername ? `@${connectedIntegration.instagramUsername}` : "Instagram account"}</span>
            <ReplyBadge commentReply={hasCommentReply} dm={hasDm} />
          </div>
        </div>
        <ActiveAutomationButton id={params.id} disabled={false} disabledReason={null} showRepair={Boolean(automation.needsReview)} />
      </header>

      <section className="ap3k-card shrink-0 animate-[ap3kDashboardRise_0.45s_ease-out_both] rounded-3xl p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoTile label="Instagram account" value={connectedIntegration?.instagramUsername ? `@${connectedIntegration.instagramUsername}` : "Not connected"} tone={connectedIntegration ? "green" : "amber"} />
          <InfoTile label="Channel" value={sourceLabel} tone="green" />
          <InfoTile label="Trigger" value={triggerLabel} tone={isMessageAutomation || isAnyComment || keywords.length ? "green" : "amber"} />
          <InfoTile label="Actions" value={replySummary(hasCommentReply, hasDm)} tone={hasCommentReply || hasDm ? "green" : "amber"} />
        </div>
      </section>

      <section className="grid shrink-0 animate-[ap3kDashboardRise_0.52s_ease-out_both] grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="DMs" value={stats?.dmsSent ?? automation.listener?.dmCount ?? 0} detail="DMs sent" />
        <MetricCard label="Comments" value={stats?.commentsReceived ?? automation.listener?.commentCount ?? 0} detail="Comments received" />
        <MetricCard label="Comment replies" value={stats?.repliesSent ?? 0} detail="Replies posted under comments" />
        <MetricCard label="Leads" value={stats?.leadsCollected ?? automation._count?.leads ?? 0} detail="Leads captured" />
      </section>

      <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:flex-1 xl:overflow-hidden">
        <section className="ap3k-card flex min-h-0 animate-[ap3kDashboardRise_0.58s_ease-out_both] flex-col overflow-hidden rounded-3xl p-5 sm:p-6">
          <div className="shrink-0 border-b border-slate-200 pb-4 dark:border-white/10">
            <p className="ap3k-kicker">Customer journey</p>
            <h2 className="mt-1 text-xl font-black tracking-tight">Interaction → response</h2>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain py-5 pr-1">
            {isMessageAutomation ? <>
              <FlowNode label="1. Interaction" title={triggerLabel} body={`Listen on ${sourceLabel}.`} tone="orange" />
              <FlowConnector />
              {automation.followGateRequired ? <><FlowNode label="2. Follow request" title={followRequestButtonText} body={followRequestDmText} tone="pink" /><FlowConnector /></> : null}
              <FlowNode label={automation.followGateRequired ? "3. Direct message" : "2. Direct message"} title={`DM with ${linkButtons.length} link${linkButtons.length === 1 ? "" : "s"}`} body={automation.listener?.prompt || "No DM configured."} tone="blue" />
            </> : <>
              <div className="grid gap-4 md:grid-cols-2">
                <FlowNode label="1. Post" title={isAnyPost ? "Any post or Reel" : "Selected post or Reel"} body={selectedPostLabel} tone="orange" />
                <FlowNode label="2. Trigger" title={isAnyComment ? "Any comment" : "Keyword matched"} body={triggerLabel} tone="pink" />
              </div>
              <FlowConnector />
              <div className="grid gap-4 md:grid-cols-2">
                <FlowNode label="3. Public reply" title={hasCommentReply ? "Reply to comment" : "Not configured"} body={commentReplies[0] || "No comment reply configured."} tone="purple" disabled={!hasCommentReply} />
                <FlowNode label="4. Opening DM" title={hasDm ? openingDmButtonText : "Not configured"} body={hasDm ? openingDmText : "No DM configured."} tone="blue" disabled={!hasDm} />
              </div>
              {hasDm ? <><FlowConnector />{automation.followGateRequired ? <><FlowNode label="5. Follow request" title={followRequestButtonText} body={followRequestDmText} tone="pink" /><FlowConnector /></> : null}<FlowNode label={automation.followGateRequired ? "6. DM with links" : "5. DM with links"} title={`${linkButtons.length} link button${linkButtons.length === 1 ? "" : "s"}`} body={automation.listener?.prompt || "No final DM configured."} tone="blue" /></> : null}
            </>}

            <div className="border-t border-slate-200 pt-5 dark:border-white/10">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Saved content</p>
              <div className="grid gap-3 md:grid-cols-2">
                {!isMessageAutomation ? <ContentBlock label="Post" value={selectedPostLabel} media={post?.media} /> : null}
                {hasDm ? <ContentBlock label="DM with links" value={[automation.listener?.prompt, ...linkButtons.map((button: { label: string; url: string }) => `${button.label}: ${button.url}`)].filter(Boolean).join("\n")} /> : null}
              </div>
            </div>
          </div>
        </section>

        <aside className="flex min-h-0 flex-col gap-4">
          <section className="ap3k-card shrink-0 animate-[ap3kDashboardRise_0.64s_ease-out_both] rounded-3xl p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="ap3k-kicker">Settings</p>
              <Badge className={isLive ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"} variant="outline">{isLive ? "Listening now" : statusLabel}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <SettingsRow label="Channel" value={sourceLabel} />
              <SettingsRow label="Trigger" value={triggerLabel} />
              <SettingsRow label="DM" value={hasDm ? "Enabled" : "Off"} />
              <SettingsRow label="Follow request" value={automation.followGateRequired ? "Enabled" : "Off"} />
            </div>
            <Link href={editHref} className="ap3k-gradient-button mt-4 block px-4 py-3 text-center text-sm">Edit automation</Link>
          </section>

          <section className="ap3k-card flex min-h-[280px] flex-1 animate-[ap3kDashboardRise_0.7s_ease-out_both] flex-col overflow-hidden rounded-3xl p-5">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-white/10">
              <div><h2 className="text-sm font-black text-slate-950 dark:text-white">Recent activity</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Latest 20 events</p></div>
              <span className="ap3k-badge ap3k-badge-slate">{groupedActivity.length}</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-3">
              {groupedActivity.length === 0 ? (
                <div className="grid h-full min-h-32 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">No activity yet. Test this automation from another Instagram account.</div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-white/10">
                  {groupedActivity.map((item) => (
                    <div key={item.id} className="flex gap-3 py-3">
                      <span className={["mt-1 h-2.5 w-2.5 shrink-0 rounded-full", activityDotClass(item.tone)].join(" ")} />
                      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black text-slate-950 dark:text-white">{customerReplyCopy(item.title)}</p><span className={["rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", badgeClass(item.tone)].join(" ")}>{item.badge}</span></div><p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{item.actorLabel ? `${item.actorLabel} · ` : ""}{formatAppReviewActivitySubtitle(item.subtitle, true)}</p><p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400"><LocalTime value={item.createdAt} /></p></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function replySummary(commentReply: boolean, dm: boolean) {
  if (commentReply && dm) return "Comment reply + DM";
  if (commentReply) return "Comment reply";
  if (dm) return "DM only";
  return "Not configured";
}

function shortId(value: string) {
  if (value.length <= 10) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function StatusBadge({ status }: { status: string }) {
  const className = status === "Live"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
    : status === "Needs attention"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
      : status === "Draft"
        ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
        : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
  return <Badge className={className} variant="outline">● {status}</Badge>;
}

function ReplyBadge({ commentReply, dm }: { commentReply: boolean; dm: boolean }) {
  if (!commentReply && !dm) return <span className="ap3k-badge ap3k-badge-slate">Actions not configured</span>;
  return <span className="ap3k-badge ap3k-badge-green">{replySummary(commentReply, dm)}</span>;
}

function InfoTile({ label, value, tone }: { label: string; value: ReactNode; tone: "green" | "amber" }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-300 hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className={["mt-1 line-clamp-2 text-sm font-black", tone === "green" ? "text-slate-950 dark:text-white" : "text-amber-700 dark:text-amber-300"].join(" ")}>{value}</p>
    </div>
  );
}

function FlowNode({ label, title, body, tone, disabled = false }: { label: string; title: string; body: string; tone: "orange" | "pink" | "purple" | "blue"; disabled?: boolean }) {
  const tones = {
    orange: "from-orange-50 border-orange-200 text-orange-600 dark:from-orange-500/10 dark:to-white/[0.03] dark:border-orange-500/25 dark:text-orange-300",
    pink: "from-pink-50 border-pink-200 text-pink-600 dark:from-pink-500/10 dark:to-white/[0.03] dark:border-pink-500/25 dark:text-pink-300",
    purple: "from-purple-50 border-purple-200 text-purple-600 dark:from-purple-500/10 dark:to-white/[0.03] dark:border-purple-500/25 dark:text-purple-300",
    blue: "from-blue-50 border-blue-200 text-blue-600 dark:from-blue-500/10 dark:to-white/[0.03] dark:border-blue-500/25 dark:text-blue-300",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br to-white p-5 transition-all duration-300 hover:-translate-y-0.5 dark:bg-[#101827] ${disabled ? "opacity-60 grayscale" : ""} ${tones[tone]}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.18em]">{label}</p>
      <h3 className="mt-2 text-lg font-black text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{body}</p>
    </div>
  );
}

function FlowConnector() {
  return <div className="mx-auto h-8 w-px bg-gradient-to-b from-slate-200 via-rf-pink to-slate-200" />;
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="ap3k-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

function ContentBlock({ label, value, media }: { label: string; value: string; media?: string }) {
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
      <div className="ap3k-preview-card flex items-center gap-3 p-3">
        {media ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media} alt={label} className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />
        ) : null}
        <p className="min-w-0 break-words text-sm leading-relaxed text-slate-700 dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}

function activityDotClass(tone: "green" | "blue" | "purple" | "amber" | "red" | "slate") {
  const tones = {
    green: "bg-rf-green shadow-[0_0_16px_rgba(34,197,94,0.45)]",
    blue: "bg-rf-blue shadow-[0_0_16px_rgba(96,165,250,0.45)]",
    purple: "bg-purple-400 shadow-[0_0_16px_rgba(192,132,252,0.45)]",
    amber: "bg-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.45)]",
    red: "bg-red-400 shadow-[0_0_16px_rgba(248,113,113,0.6)]",
    slate: "bg-slate-400",
  };
  return tones[tone];
}

function badgeClass(tone: "green" | "blue" | "purple" | "amber" | "red" | "slate") {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
    purple: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300",
    amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
    slate: "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300",
  };
  return tones[tone];
}
