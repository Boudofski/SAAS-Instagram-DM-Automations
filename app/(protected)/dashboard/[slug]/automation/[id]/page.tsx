import { getAutomationInfo, getAutomationLogs, getAutomationStats } from "@/actions/automation";
import ActiveAutomationButton from "@/components/global/active-automation-button";
import StatCard from "@/components/global/stat-card";
import { Badge } from "@/components/ui/badge";
import { buildCampaignBindingDiagnostics } from "@/lib/account-webhook-diagnostics";
import { getAccountWebhookDiagnosticsForIntegration } from "@/lib/account-webhook-diagnostics-db";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { assessCampaignSetupHealth } from "@/lib/campaign-health";
import { filterAppReviewActivity, groupCampaignActivity, getCampaignModeLabels, getReviewerTestCopy } from "@/lib/campaign-activity-format";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: { id: string; slug: string } };

export async function generateMetadata({ params }: { params: { id: string } }) {
  const info = await getAutomationInfo(params.id);
  return { title: info.data?.name ?? "Campaign" };
}

export default async function CampaignDetailPage({ params }: Props) {
  const appReviewMode = isAppReviewMode();
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
  const sendPrivateDm = automation.sendPrivateDm !== false;
  const hasPublicReply = Boolean(
    automation.listener?.commentReply ||
      automation.listener?.commentReply2 ||
      automation.listener?.commentReply3
  );
  const modeLabels = getCampaignModeLabels({
    sendPrivateDm,
    publicReplyCount: [
      automation.listener?.commentReply,
      automation.listener?.commentReply2,
      automation.listener?.commentReply3,
    ].filter(Boolean).length,
  });
  const allGroupedActivity = groupCampaignActivity(activity, { privateDmEnabled: sendPrivateDm, limit: 20 });
  const groupedActivity = appReviewMode ? filterAppReviewActivity(allGroupedActivity, 20) : allGroupedActivity;
  const connectedIntegration = automation.User?.integrations?.find((item: any) => item.status !== "DISCONNECTED") ?? automation.User?.integrations?.[0];
  const bindingDiagnostic = buildCampaignBindingDiagnostics({
    integration: connectedIntegration,
    campaigns: [automation],
  })[0];
  const isIncomplete = !automation.listener || !automation.posts?.length || (!isAnyComment && !automation.keywords?.length) || (!appReviewMode && sendPrivateDm && !automation.listener?.prompt) || (!sendPrivateDm && !hasPublicReply);
  const accountDiagnostics = connectedIntegration?.id
    ? await getAccountWebhookDiagnosticsForIntegration(connectedIntegration.id)
    : null;
  const health = assessCampaignSetupHealth({
    connectedAccount: connectedIntegration ? {
      id: connectedIntegration.id,
      username: connectedIntegration.instagramUsername,
      instagramId: connectedIntegration.instagramId,
      status: connectedIntegration.status,
      tokenPresent: Boolean(connectedIntegration.token),
      reconnectRequired: connectedIntegration.reconnectRequired,
    } : null,
    campaign: automation,
    webhookStatus: accountDiagnostics?.delivery.status,
    messagingCapabilityPending: accountDiagnostics?.delivery.status === "only_messaging_active",
  });
  const lastRealComment = activity.find((item: any) => item.type === "REAL_COMMENT_EVENT" || item.type === "COMMENT_WEBHOOK_RECEIVED");
  const lastAction = activity.find((item: any) => String(item.type).includes("SENT") || String(item.type).includes("FAILED") || item.status === "SENT" || item.status === "FAILED");

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
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 text-slate-950 dark:text-white sm:p-6 lg:p-8">

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link
            href={`/dashboard/${params.slug}/automation`}
            className="text-xs dark:text-slate-400 text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors mb-2 inline-block"
          >
            Campaigns
          </Link>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">Automation detail</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            {automation.name}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              className={
                health.status === "Live"
                  ? "bg-rf-green/10 text-rf-green border-rf-green/25"
                  : health.status === "Needs review"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : health.status === "Draft"
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "bg-rf-amber/10 text-rf-amber border-rf-amber/25"
              }
              variant="outline"
            >
              ● {health.status}
            </Badge>
          </div>
        </div>
        <ActiveAutomationButton
          id={params.id}
          disabled={!health.okToActivate && !automation.active}
          disabledReason={!health.okToActivate && !automation.active ? health.blockers[0] : null}
          showRepair={Boolean(automation.needsReview)}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">Campaign health</p>
            <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{health.status}</h2>
          </div>
          {health.okToActivate ? <Badge className="w-fit border-emerald-200 bg-emerald-50 text-emerald-700">Activation ready</Badge> : <Badge className="w-fit border-amber-200 bg-amber-50 text-amber-800">Review required</Badge>}
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <HealthRow label="Connected account" value={connectedIntegration?.instagramUsername ? `@${connectedIntegration.instagramUsername}` : "Not connected"} ok={Boolean(connectedIntegration?.instagramId)} />
          <HealthRow label="Selected post/media" value={automation.posts?.[0]?.postid === "ANY" ? "Any Post" : `${automation.posts?.[0]?.postid ?? "Missing"} · ${health.selectedPostStatus}`} ok={health.selectedPostStatus !== "stale" && health.selectedPostStatus !== "missing"} />
          <HealthRow label="Trigger" value={isAnyComment ? "Any comment" : automation.keywords?.length ? "Keyword configured" : "Missing keyword"} ok={isAnyComment || Boolean(automation.keywords?.length)} />
          <HealthRow label="Public reply" value={hasPublicReply ? "On" : "Off"} ok={hasPublicReply || sendPrivateDm} />
          {!appReviewMode && <HealthRow label="Private DM" value={sendPrivateDm ? "AP3k DM" : "External DM mode"} ok={!sendPrivateDm || Boolean(automation.listener?.prompt)} />}
          <HealthRow label="Last real comment" value={lastRealComment ? new Date(lastRealComment.createdAt).toLocaleString() : "None yet"} ok={Boolean(lastRealComment)} />
          {!appReviewMode && <HealthRow label="Last action result" value={lastAction ? `${lastAction.type}${lastAction.status ? ` · ${lastAction.status}` : ""}` : "None yet"} ok={!lastAction || lastAction.status !== "FAILED"} />}
        </div>
        {(health.blockers.length > 0 || health.warnings.length > 0) && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {health.blockers.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100">
                <p className="font-black">Blocked</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">{health.blockers.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            )}
            {health.warnings.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                <p className="font-black">Warnings</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">{health.warnings.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            )}
          </div>
        )}
      </div>

      {isIncomplete && (
        <div className="mb-6 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black uppercase tracking-wider text-amber-400">
              Campaign setup incomplete
            </p>
            <p className="mt-1 text-sm dark:text-slate-400 text-slate-500">
              This campaign is missing{" "}
              {[
                !automation.posts?.length && "a post",
                !isAnyComment && !automation.keywords?.length && "keywords",
                !appReviewMode && sendPrivateDm && !automation.listener?.prompt && "a DM message",
                !sendPrivateDm && !hasPublicReply && "a public reply",
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

      {bindingDiagnostic?.warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          <p className="text-xs font-black uppercase tracking-wider">Campaign media binding warning</p>
          <p className="mt-2">
            Connected IG account: {connectedIntegration?.instagramUsername ? `@${connectedIntegration.instagramUsername}` : "Unknown"} / {connectedIntegration?.instagramId ?? "no IG ID"}.
            Selected media ID: {bindingDiagnostic.postId ?? "none"}.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {bindingDiagnostic.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="ap3k-card rounded-3xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">
                {appReviewMode ? "Comment automation flow" : "AutoDM flow"}
              </p>
              <h2 className="mt-1 text-xl font-black">
                {appReviewMode ? "When comments match, AP3k sends a public reply and tracks the lead" : <>When comments match, AP3k {sendPrivateDm ? "sends the configured replies" : "handles public replies only"}</>}
              </h2>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] px-3 py-1 text-xs font-bold dark:text-slate-400 text-slate-500">
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
                title={hasPublicReply ? "Reply to Comment" : "Public Reply Off"}
                body={automation.listener?.commentReply || "Disabled for this campaign."}
                tone="purple"
                disabled={!hasPublicReply}
              />
              {!appReviewMode && <FlowNode
                label="Action"
                title={sendPrivateDm ? "Send Message" : "Private DM Off"}
                body={sendPrivateDm ? (automation.listener?.prompt || "No private DM configured.") : "Off — external tool handles private messages."}
                tone="blue"
                disabled={!sendPrivateDm}
              />}
            </div>
          </div>
        </div>

        <aside className="ap3k-card rounded-3xl p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] dark:text-slate-400 text-slate-500">
            Settings
          </p>
          <div className="mt-5 space-y-4">
            <SettingsRow label="Status" value={health.status} />
            <SettingsRow label="Trigger mode" value={isAnyComment ? "Any comment" : "Specific keyword"} />
            <SettingsRow label="Matching" value={isAnyComment ? "Every comment" : automation.matchingMode ?? "CONTAINS"} />
            <SettingsRow label="Public reply" value={modeLabels.publicReply} />
            {!appReviewMode && <SettingsRow label="Private DM" value={modeLabels.privateDm} />}
            <SettingsRow label="Trigger" value={automation.trigger?.[0]?.type ?? "COMMENT"} />
            <SettingsRow label="Mode" value={automation.listener?.listener ?? "MESSAGE"} />
            <SettingsRow label="Settings source" value="Saved database state" />
          </div>
          <Link
            href={`/dashboard/${params.slug}/automation/new?edit=${params.id}`}
            className="ap3k-gradient-button mt-6 block px-4 py-3 text-center text-sm"
          >
            Edit Automation
          </Link>
        </aside>
      </div>

      {!appReviewMode && <div className="ap3k-card mb-8 rounded-2xl p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-rf-blue">
          Reviewer test script
        </p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{getReviewerTestCopy(sendPrivateDm)}</p>
      </div>}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label={appReviewMode ? "Public replies" : "DMs sent"}
          icon={appReviewMode ? "↩" : "✉️"}
          value={appReviewMode ? (stats?.repliesSent ?? 0) : (stats?.dmsSent ?? automation.listener?.dmCount ?? 0)}
        />
        <StatCard
          label="Leads captured"
          icon="🎯"
          value={stats?.leadsCollected ?? 0}
        />
        <StatCard
          label="Comments"
          icon="💬"
          value={stats?.commentsReceived ?? automation.listener?.commentCount ?? 0}
        />
        <StatCard
          label="Public replies"
          icon="↩"
          value={stats?.repliesSent ?? 0}
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
        <div className="ap3k-card rounded-2xl p-6 flex flex-col gap-5">
          <h2 className="text-sm font-bold text-slate-950 dark:text-white">Campaign details</h2>

          {/* Post */}
          {automation.posts?.[0] && (
            <div>
              <p className="text-xs dark:text-slate-400 text-slate-500 mb-2 uppercase tracking-wider font-semibold">Post</p>
              {automation.posts[0].postid === "ANY" ? (
                <div className="ap3k-preview-card flex items-center gap-3 p-3">
                  <span className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center bg-rf-blue/10 text-2xl">🌐</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Any post - triggers on all Instagram posts</p>
                </div>
              ) : (
                <div className="ap3k-preview-card flex items-center gap-3 p-3">
                  {automation.posts[0].media ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={automation.posts[0].media}
                      alt={automation.posts[0].caption ?? "post"}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <span className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center bg-slate-100 text-xl dark:bg-white/[0.06]">📷</span>
                  )}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {automation.posts[0].caption ?? "Reel / Post"}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Keywords */}
          <div>
            <p className="text-xs dark:text-slate-400 text-slate-500 mb-2 uppercase tracking-wider font-semibold">Trigger</p>
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
                <span className="text-xs dark:text-slate-400 text-slate-500">No keywords set</span>
              )}
            </div>
          </div>

          {/* DM preview */}
          {!appReviewMode && automation.listener && sendPrivateDm && (
            <div>
              <p className="text-xs dark:text-slate-400 text-slate-500 mb-2 uppercase tracking-wider font-semibold">
                DM message
              </p>
              <div className="rounded-xl border border-rf-blue/20 bg-rf-blue/5 p-4 dark:bg-rf-blue/10">
                <p className="text-xs text-slate-950 dark:text-white leading-relaxed whitespace-pre-wrap">
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
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 truncate">
                      {automation.listener.ctaLink}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          {!appReviewMode && automation.listener && !sendPrivateDm && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] p-4">
              <p className="text-xs font-bold uppercase tracking-wider dark:text-slate-400 text-slate-500">
                Private DM
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">
                Private DM skipped: handled by external tool
              </p>
            </div>
          )}

          {/* Public reply variations */}
          {automation.listener && (
            automation.listener.commentReply ||
            automation.listener.commentReply2 ||
            automation.listener.commentReply3
          ) && (
            <div>
              <p className="text-xs dark:text-slate-400 text-slate-500 mb-2 uppercase tracking-wider font-semibold">
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
                      className="rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] px-3 py-2 text-xs text-slate-950 dark:text-white"
                    >
                      <span className="mr-2 dark:text-slate-400 text-slate-500 font-semibold">{i + 1}.</span>
                      {reply}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="ap3k-card rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-950 dark:text-white">Quick actions</h2>
          <Link
            href={`/dashboard/${params.slug}/automation/new`}
            className="ap3k-review-row text-sm text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:border-rf-blue/30
                       transition-all"
          >
            <span>➕</span> Create a new campaign
          </Link>
          <Link
            href={`/dashboard/${params.slug}/automation`}
            className="ap3k-review-row text-sm text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:border-rf-blue/30
                       transition-all"
          >
            <span>📣</span> View all campaigns
          </Link>
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400">
            <span>📤</span> Export leads (coming soon)
          </div>
        </div>

      </div>

      <div className="ap3k-card mt-6 rounded-2xl p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-950 dark:text-white">Recent activity</h2>
            <p className="mt-1 text-xs dark:text-slate-400 text-slate-500">
              {appReviewMode ? "Comments received, triggers matched, public replies sent, and leads captured." : "Latest 20 comment interactions. Technical diagnostics are available in Admin."}
            </p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] px-3 py-1 text-[11px] font-bold uppercase tracking-wider dark:text-slate-400 text-slate-500">
            Latest 20
          </span>
        </div>

        {groupedActivity.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] p-5 text-sm dark:text-slate-400 text-slate-500">
            No events yet. Comment on a connected Instagram post to test this campaign.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-white/10">
            {groupedActivity.map((item) => (
                <div key={item.id} className="flex gap-3 py-4">
                  <span
                    className={[
                      "mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full",
                      activityDotClass(item.tone),
                    ].join(" ")}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">
                        {item.title}
                      </p>
                      <span className={["rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase", badgeClass(item.tone)].join(" ")}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {item.actorLabel ? `${item.actorLabel} · ` : ""}{item.subtitle}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <StepPill label="Comment" active={item.steps.commentReceived} />
                      <StepPill label="Trigger" active={item.steps.triggerMatched} />
                      <StepPill label="Public reply" state={item.steps.publicReply} />
                      {!appReviewMode && <StepPill label="DM" state={item.steps.privateDm} />}
                    </div>
                    <p className="mt-2 text-xs dark:text-slate-400 text-slate-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                    {!appReviewMode && <details className="mt-2 group">
                      <summary className="cursor-pointer text-xs font-bold text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
                        Details
                      </summary>
                      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                        {item.details.visibilityHelper ? <p className="font-semibold text-slate-800 dark:text-slate-100">{item.details.visibilityHelper}</p> : null}
                        {item.details.error ? <p>{item.details.error}</p> : null}
                        {item.details.commenterUsername ? <p>Username @{item.details.commenterUsername}</p> : null}
                        {item.details.commentId ? <p>Source comment ID <code className="select-all rounded bg-white px-1 dark:bg-black/20">{item.details.commentId}</code></p> : null}
                        {item.details.mediaId ? <p>Media ID <code className="select-all rounded bg-white px-1 dark:bg-black/20">{item.details.mediaId}</code></p> : null}
                        {item.details.igUserId ? <p>Instagram user ID <code className="select-all rounded bg-white px-1 dark:bg-black/20">{item.details.igUserId}</code></p> : null}
                        {item.details.keyword ? <p>Matched keyword {item.details.keyword}</p> : null}
                        {item.details.endpoint ? <p>Endpoint {item.details.endpoint}</p> : null}
                        {item.details.publicReplyCommentId ? <p>Meta reply ID <code className="select-all rounded bg-white px-1 dark:bg-black/20">{item.details.publicReplyCommentId}</code></p> : null}
                        {item.details.replyTextPreview ? <p>Reply preview {item.details.replyTextPreview}</p> : null}
                      </div>
                    </details>}
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
  disabled = false,
}: {
  label: string;
  title: string;
  body: string;
  tone: "orange" | "pink" | "purple" | "blue";
  disabled?: boolean;
}) {
  const tones = {
    orange: "from-orange-50 border-orange-200 text-orange-600 dark:from-orange-500/10 dark:to-white/[0.03] dark:border-orange-500/25 dark:text-orange-300",
    pink: "from-pink-50 border-pink-200 text-pink-600 dark:from-pink-500/10 dark:to-white/[0.03] dark:border-pink-500/25 dark:text-pink-300",
    purple: "from-purple-50 border-purple-200 text-purple-600 dark:from-purple-500/10 dark:to-white/[0.03] dark:border-purple-500/25 dark:text-purple-300",
    blue: "from-blue-50 border-blue-200 text-blue-600 dark:from-blue-500/10 dark:to-white/[0.03] dark:border-blue-500/25 dark:text-blue-300",
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br to-white p-5 dark:bg-[#101827] ${disabled ? "opacity-60 grayscale" : ""} ${tones[tone]}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.18em]">{label}</p>
      <h3 className="mt-2 text-lg font-black text-slate-950 dark:text-white">{title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed dark:text-slate-300 text-slate-600">{body}</p>
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] dark:text-slate-400 text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function HealthRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className={["mt-1 text-sm font-black", ok ? "text-slate-950 dark:text-white" : "text-amber-700 dark:text-amber-300"].join(" ")}>{value}</p>
    </div>
  );
}

function StepPill({
  label,
  active,
  state,
}: {
  label: string;
  active?: boolean;
  state?: "sent" | "skipped" | "failed" | "off" | "blocked" | null;
}) {
  const on = active || state === "sent";
  const warning = state === "skipped" || state === "off" || state === "blocked";
  const failed = state === "failed";
  return (
    <span
      className={[
        "rounded-full border px-2 py-0.5 text-[10px] font-black uppercase",
        failed
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          : warning
          ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
          : on
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function activityDotClass(tone: "green" | "blue" | "amber" | "red" | "slate") {
  const tones = {
    green: "bg-rf-green shadow-[0_0_16px_rgba(34,197,94,0.45)]",
    blue: "bg-rf-blue shadow-[0_0_16px_rgba(96,165,250,0.45)]",
    amber: "bg-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.45)]",
    red: "bg-red-400 shadow-[0_0_16px_rgba(248,113,113,0.6)]",
    slate: "bg-slate-400",
  };
  return tones[tone];
}

function badgeClass(tone: "green" | "blue" | "amber" | "red" | "slate") {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
    amber: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    red: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
    slate: "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300",
  };
  return tones[tone];
}
