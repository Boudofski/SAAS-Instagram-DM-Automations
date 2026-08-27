import { getAutomationInfo, getAutomationLogs, getAutomationStats } from "@/actions/automation";
import ActiveAutomationButton from "@/components/global/active-automation-button";
import LocalTime from "@/components/global/local-time";
import { Badge } from "@/components/ui/badge";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";
import { formatKeywordDisplay } from "@/lib/keyword-display";
import { formatAppReviewActivitySubtitle } from "@/lib/app-review-activity-copy";
import { filterAppReviewActivity, groupCampaignActivity } from "@/lib/campaign-activity-format";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

type Props = { params: { id: string; slug: string } };

export async function generateMetadata({ params }: { params: { id: string } }) {
  const info = await getAutomationInfo(params.id);
  return { title: info.data?.name ?? "Campaign" };
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
  const isAnyPost = post?.postid === "ANY";
  const isAnyComment = automation.triggerMode === "ANY_COMMENT";
  const sendPrivateDm = automation.sendPrivateDm !== false;
  const publicReplies = [
    automation.listener?.commentReply,
    automation.listener?.commentReply2,
    automation.listener?.commentReply3,
  ].filter(Boolean) as string[];
  const hasPublicReply = publicReplies.length > 0;
  const hasPrivateReply = sendPrivateDm && Boolean(automation.listener?.prompt);
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
  const triggerLabel = isAnyComment ? "Any comment" : keywords.length ? keywords.join(", ") : "No keyword configured";
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
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 text-slate-950 dark:text-white sm:p-6 lg:p-8">
      <div className="flex animate-[ap3kDashboardRise_0.38s_ease-out_both] flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link href={`/dashboard/${params.slug}/automation`} className="mb-2 inline-block text-xs text-slate-500 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
            ← Campaigns
          </Link>
          <p className="ap3k-kicker">Campaign detail</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{automation.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={statusLabel} />
            <span className="ap3k-badge ap3k-badge-slate">{connectedIntegration?.instagramUsername ? `@${connectedIntegration.instagramUsername}` : "Instagram account"}</span>
            <ReplyBadge publicReply={hasPublicReply} privateReply={hasPrivateReply} />
          </div>
        </div>
        <ActiveAutomationButton id={params.id} disabled={false} disabledReason={null} showRepair={Boolean(automation.needsReview)} />
      </div>

      <section className="ap3k-card animate-[ap3kDashboardRise_0.45s_ease-out_both] rounded-3xl p-5 transition-all duration-300 hover:shadow-[0_20px_80px_rgba(15,23,42,0.10)]">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="ap3k-kicker">Campaign overview</p>
            <h2 className="mt-1 text-xl font-black">Instagram comment workflow</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A comment enters the campaign, the trigger is checked, then AP3k runs the actions you selected.</p>
          </div>
          <Badge className={isLive ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"} variant="outline">
            {isLive ? "Listening now" : statusLabel}
          </Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InfoTile label="Instagram account" value={connectedIntegration?.instagramUsername ? `@${connectedIntegration.instagramUsername}` : "Not connected"} tone={connectedIntegration ? "green" : "amber"} />
          <InfoTile label="Post" value={selectedPostLabel} tone={post ? "green" : "amber"} />
          <InfoTile label="Trigger" value={triggerLabel} tone={isAnyComment || keywords.length ? "green" : "amber"} />
          <InfoTile label="Actions" value={replySummary(hasPublicReply, hasPrivateReply)} tone={hasPublicReply || hasPrivateReply ? "green" : "amber"} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
        <section className="ap3k-card animate-[ap3kDashboardRise_0.52s_ease-out_both] rounded-3xl p-6">
          <div className="mb-6">
            <p className="ap3k-kicker">Workflow</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Comment → trigger → actions</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The customer-facing path configured for this campaign.</p>
          </div>

          <div className="grid gap-4">
            <FlowNode label="1. Comment" title={isAnyPost ? "Any post or Reel" : "Selected post or Reel"} body={selectedPostLabel} tone="orange" />
            <FlowConnector />
            <FlowNode label="2. Trigger" title={isAnyComment ? "Any comment" : "Keyword matched"} body={triggerLabel} tone="pink" />
            <FlowConnector />
            <div className="grid gap-4 md:grid-cols-2">
              <FlowNode label="3. Comment reply" title={hasPublicReply ? "Reply to comment" : "Not configured"} body={publicReplies[0] || "No comment reply configured."} tone="purple" disabled={!hasPublicReply} />
              <FlowNode label="4. DM" title={hasPrivateReply ? "Send a DM" : "Not configured"} body={automation.listener?.prompt || "No DM configured."} tone="blue" disabled={!hasPrivateReply} />
            </div>
          </div>
        </section>

        <aside className="ap3k-card animate-[ap3kDashboardRise_0.58s_ease-out_both] rounded-3xl p-6">
          <p className="ap3k-kicker">Settings</p>
          <div className="mt-5 space-y-3">
            <SettingsRow label="Status" value={statusLabel} />
            <SettingsRow label="Post" value={isAnyPost ? "Any post" : "Specific post"} />
            <SettingsRow label="Trigger" value={isAnyComment ? "Any comment" : "Keyword"} />
            <SettingsRow label="Comment reply" value={hasPublicReply ? `${publicReplies.length} variation${publicReplies.length === 1 ? "" : "s"}` : "Off"} />
            <SettingsRow label="DM" value={hasPrivateReply ? "Enabled" : "Off"} />
          </div>
          <Link href={`/dashboard/${params.slug}/automation/new?edit=${params.id}`} className="ap3k-gradient-button mt-6 block px-4 py-3 text-center text-sm">
            Edit campaign
          </Link>
        </aside>
      </div>

      <section className="grid animate-[ap3kDashboardRise_0.64s_ease-out_both] gap-4 md:grid-cols-4">
        <MetricCard label="DMs" value={stats?.dmsSent ?? automation.listener?.dmCount ?? 0} detail="DMs sent" />
        <MetricCard label="Comments" value={stats?.commentsReceived ?? automation.listener?.commentCount ?? 0} detail="Comments received" />
        <MetricCard label="Comment replies" value={stats?.repliesSent ?? 0} detail="Replies posted under comments" />
        <MetricCard label="Leads" value={stats?.leadsCollected ?? automation._count?.leads ?? 0} detail="Leads captured" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <section className="ap3k-card animate-[ap3kDashboardRise_0.7s_ease-out_both] rounded-3xl p-6">
          <h2 className="text-sm font-black text-slate-950 dark:text-white">Campaign content</h2>
          <div className="mt-5 space-y-5">
            <ContentBlock label="Post" value={selectedPostLabel} media={post?.media} />
            {hasPrivateReply && <ContentBlock label="DM message" value={automation.listener?.prompt} />}
            {(automation.listener?.ctaButtonTitle || automation.listener?.ctaLink) && (
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Link button</p>
                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-rf-blue/25 bg-rf-blue/10 px-4 py-3">
                  <span className="shrink-0 rounded-lg bg-rf-blue/10 px-2 py-1 text-xs font-black text-rf-blue">{automation.listener?.ctaButtonTitle || "Open link"}</span>
                  {automation.listener?.ctaLink && <span className="truncate text-xs text-slate-500 dark:text-slate-300">{automation.listener.ctaLink}</span>}
                </div>
              </div>
            )}
            {publicReplies.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Comment reply variations</p>
                <div className="grid gap-2">
                  {publicReplies.map((reply, index) => (
                    <div key={`${reply}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                      <span className="mr-2 font-black text-slate-400">{index + 1}.</span>{reply}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="ap3k-card animate-[ap3kDashboardRise_0.74s_ease-out_both] rounded-3xl p-6">
          <h2 className="text-sm font-black text-slate-950 dark:text-white">Campaign actions</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Edit this campaign or jump back to the campaign list.</p>
          <div className="mt-5 grid gap-3">
            <Link href={`/dashboard/${params.slug}/automation/new?edit=${params.id}`} className="ap3k-review-row text-sm text-slate-600 transition-all hover:-translate-y-0.5 hover:border-rf-pink/30 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"><span>✏️</span><span>Edit campaign</span></Link>
            <Link href={`/dashboard/${params.slug}/automation/new`} className="ap3k-review-row text-sm text-slate-600 transition-all hover:-translate-y-0.5 hover:border-rf-pink/30 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"><span>＋</span><span>Create another campaign</span></Link>
            <Link href={`/dashboard/${params.slug}/automation`} className="ap3k-review-row text-sm text-slate-600 transition-all hover:-translate-y-0.5 hover:border-rf-pink/30 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"><span>←</span><span>All campaigns</span></Link>
          </div>
        </section>
      </div>

      <section className="ap3k-card animate-[ap3kDashboardRise_0.8s_ease-out_both] rounded-3xl p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-slate-950 dark:text-white">Recent activity</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Latest comments, trigger matches, comment replies, DMs, and lead activity.</p>
          </div>
          <span className="ap3k-badge ap3k-badge-slate">Latest 20</span>
        </div>
        {groupedActivity.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
            No activity yet. Comment from another Instagram account to test this campaign.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-white/10">
            {groupedActivity.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-2xl py-4 transition hover:bg-slate-50/70 dark:hover:bg-white/[0.03]">
                <span className={["mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full", activityDotClass(item.tone)].join(" ")} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black text-slate-950 dark:text-white">{item.title}</p>
                    <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase", badgeClass(item.tone)].join(" ")}>{item.badge}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.actorLabel ? `${item.actorLabel} · ` : ""}{formatAppReviewActivitySubtitle(item.subtitle, true)}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400"><LocalTime value={item.createdAt} /></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function replySummary(publicReply: boolean, privateReply: boolean) {
  if (publicReply && privateReply) return "Comment reply + DM";
  if (publicReply) return "Comment reply";
  if (privateReply) return "DM only";
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

function ReplyBadge({ publicReply, privateReply }: { publicReply: boolean; privateReply: boolean }) {
  if (!publicReply && !privateReply) return <span className="ap3k-badge ap3k-badge-slate">Actions not configured</span>;
  return <span className="ap3k-badge ap3k-badge-green">{replySummary(publicReply, privateReply)}</span>;
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