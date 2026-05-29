"use client";

import DmEditor from "@/components/global/dm-editor";
import EmptyState from "@/components/global/empty-state";
import KeywordInput from "@/components/global/keyword-input";
import PostPicker from "@/components/global/post-picker";
import WizardStepper from "@/components/global/wizard-stepper";
import type { StepStatus } from "@/components/global/wizard-stepper";
import { useQueryAutomationPosts, useQueryUser, useQueryWebhookHealth } from "@/hooks/user-queries";
import { useQueryAutomations } from "@/hooks/user-queries";
import { useWizard } from "@/hooks/use-wizard";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { isWeakPublicReply } from "@/lib/campaign-activity-format";
import { formatKeywordDisplay } from "@/lib/keyword-display";
import { Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  params: { slug: string };
  searchParams?: { edit?: string };
};

const STEP_LABELS = [
  "Choose post",
  "Trigger",
  "Write DM",
  "Public reply",
  "Review & Activate",
];

const STEP_TIPS = [
  "Pick the Reel or post you want to run this campaign on.",
  "Choose a keyword trigger or run on every comment.",
  "This is the most important step. Write a DM people actually want to receive.",
  "Optional public replies help commenters know to check their DMs.",
  "Review everything. You can pause or edit this campaign at any time.",
];

const REVIEW_STEP_LABELS = ["Choose post", "Trigger", "Public reply mode", "Public reply", "Review & Activate"];
const REVIEW_STEP_TIPS = [
  "Pick the post or Reel you want to run this campaign on.",
  "Choose a keyword trigger or run on every comment.",
  "Use public reply mode for App Review.",
  "Write a clear public reply.",
  "Review everything before going live.",
];

export default function WizardPage({ params, searchParams }: Props) {
  const appReviewMode = isAppReviewMode();
  const { slug } = params;
  const editId = searchParams?.edit;
  const { data: posts, isLoading: postsLoading, refetch: refetchPosts, isFetching: postsFetching } = useQueryAutomationPosts();
  const { data: user } = useQueryUser();
  const { data: webhookHealth } = useQueryWebhookHealth();
  const { data: editing } = useQueryAutomations(editId ?? "", Boolean(editId));
  const [manualMedia, setManualMedia] = useState("");
  const [loadedEdit, setLoadedEdit] = useState(false);

  const { step, data, update, next, back, goTo, canAdvance, activate, isSubmitting, error } =
    useWizard(slug, editId);

  const steps = (appReviewMode ? REVIEW_STEP_LABELS : STEP_LABELS).map((label, i) => ({
    label,
    status: (i + 1 < step ? "done" : i + 1 === step ? "active" : "todo") as StepStatus,
  }));

  const postList: any[] = posts?.data?.data ?? [];
  const hasInstagramConnection = (user?.data?.integrations?.length ?? 0) > 0;
  const instagram = user?.data?.integrations?.[0];
  const messagingCapabilityPending = data.sendPrivateDm && (
    webhookHealth?.data?.lastFailure?.errorMessage?.includes("dm_capability_missing") ||
    webhookHealth?.data?.lastFailure?.errorMessage?.includes("code=3")
  );
  const reviewWarnings = [
    data.post?.postid && data.post.postid !== "ANY" ? "Specific Post mode needs media from the currently connected Instagram account." : null,
    !appReviewMode && data.sendPrivateDm === false ? "External DM mode: AP3k will not send private DMs." : null,
    !appReviewMode && messagingCapabilityPending ? "Private DM is enabled, but Meta messaging capability may still be pending." : null,
  ].filter(Boolean) as string[];

  useEffect(() => {
    if (appReviewMode && data.sendPrivateDm) {
      update({ sendPrivateDm: false, publicReplyEnabled: true });
    }
  }, [appReviewMode, data.sendPrivateDm, update]);

  useEffect(() => {
    if (!editId || loadedEdit || editing?.status !== 200 || !editing.data) return;
    const automation: any = editing.data;
    const post = automation.posts?.[0];
    update({
      campaignName: automation.name ?? "",
      active: Boolean(automation.active),
      matchingMode: automation.matchingMode ?? "CONTAINS",
      keywords: Array.isArray(automation.keywords)
        ? automation.keywords.map((keyword: any) => keyword.word).filter(Boolean)
        : [],
      dmMessage: automation.listener?.prompt ?? "",
      publicReply: automation.listener?.commentReply ?? "",
      publicReply2: automation.listener?.commentReply2 ?? "",
      publicReply3: automation.listener?.commentReply3 ?? "",
      ctaLink: automation.listener?.ctaLink ?? "",
      ctaButtonTitle: automation.listener?.ctaButtonTitle ?? "",
      sendPrivateDm: automation.sendPrivateDm !== false,
      triggerMode: automation.triggerMode === "ANY_COMMENT" ? "ANY_COMMENT" : "SPECIFIC_KEYWORD",
      publicReplyEnabled: Boolean(
        automation.listener?.commentReply ||
        automation.listener?.commentReply2 ||
        automation.listener?.commentReply3
      ),
      post: post
        ? {
            postid: post.postid,
            caption: post.caption ?? undefined,
            media: post.media,
            mediaType: post.mediaType,
          }
        : null,
    });
    setLoadedEdit(true);
  }, [editId, editing, loadedEdit, update]);

  const selectManualMedia = () => {
    const value = manualMedia.trim();
    if (!value) return;

    update({
      post: {
        postid: value,
        caption: value.startsWith("http") ? "Manual Instagram post URL" : `Manual media ID ${value}`,
        media: value,
        mediaType: "IMAGE",
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-slate-50">

      {/* Wizard header */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-4
                      border-b border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04] backdrop-blur-xl sm:px-8">
        <Link href={`/dashboard/${slug}/automation`}
              className="dark:text-slate-400 text-slate-500 text-sm hover:text-slate-950 dark:hover:text-white transition-colors">
          Back
        </Link>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-950 dark:text-white">
            {editId ? "Edit Campaign" : "New Campaign"}
          </p>
          <p className="text-xs dark:text-slate-400 text-slate-500">
            {editId ? "Update your automation flow" : "Launch in 60 seconds"}
          </p>
        </div>
        <span className="text-xs dark:text-slate-400 text-slate-500 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rf-green" /> Auto-saved
        </span>
      </div>

      {/* Stepper */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-8">
        <WizardStepper steps={steps} />
      </div>

      {/* Body */}
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_340px] sm:px-8">
        <main className="rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04] p-6 shadow-sm">

        {/* Step 1 — Choose post */}
        {step === 1 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-rf-blue mb-2">
              Step 1 of 5
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight mb-2">
              Name it and choose a post or Reel
            </h2>
            <p className="dark:text-slate-400 text-slate-500 text-sm mb-6">
              Choose where AP3k should listen for comments. You can start broad with Any post,
              then switch to a specific launch post later.
            </p>
            {instagram?.instagramUsername && (
              <p className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                Current account: @{instagram.instagramUsername}. Specific posts shown here are refreshed from this account only.
              </p>
            )}
            <div className="mb-6">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider dark:text-slate-400 text-slate-500">
                Campaign name
              </label>
              <input
                value={data.campaignName}
                onChange={(event) => update({ campaignName: event.target.value })}
                placeholder="Example: May launch guide"
                className="ap3k-input w-full rounded-xl px-4 py-3 text-sm"
              />
            </div>
            {postsLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin dark:text-slate-400 text-slate-500" />
              </div>
            ) : !hasInstagramConnection ? (
              <EmptyState
                icon="🔗"
                title="Connect Instagram first"
                description="AP3k needs an official Instagram connection before it can listen for comments."
                ctaLabel="Connect Instagram"
                ctaHref={`/dashboard/${slug}/integrations`}
              />
            ) : (
              <div className="flex flex-col gap-5">
                {/* Any post option */}
                <button
                  type="button"
                  onClick={() =>
                    update({
                      post: {
                        postid: "ANY",
                        caption: "Any post - triggers on all your Instagram posts",
                        media: "",
                        mediaType: "IMAGE",
                      },
                    })
                  }
                  className={[
                    "w-full flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all",
                    data.post?.postid === "ANY"
                      ? "border-rf-blue bg-rf-blue/10 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                      : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04] hover:border-rf-blue/40",
                  ].join(" ")}
                >
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-rf-blue/15 text-2xl">
                    🌐
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-950 dark:text-white">Any post</p>
                    <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">
                      Fastest setup. AP3k checks comments on all posts and Reels from the connected account.
                    </p>
                  </div>
                  {data.post?.postid === "ANY" && (
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-rf-blue text-white text-xs font-bold">
                      ✓
                    </span>
                  )}
                </button>

                {/* Specific post grid */}
                {postList.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-wider dark:text-slate-400 text-slate-500">
                        Choose a specific post or Reel
                      </p>
                      <button
                        type="button"
                        onClick={() => void refetchPosts()}
                        disabled={postsFetching}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
                      >
                        <RefreshCw className={postsFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
                        Refresh posts
                      </button>
                    </div>
                    <PostPicker
                      posts={postList}
                      selected={data.post?.postid !== "ANY" ? (data.post?.postid ?? null) : null}
                      onSelect={(p) =>
                        update({
                          post: {
                            postid: p.id,
                            caption: p.caption,
                            media: p.media_type === "VIDEO"
                              ? (p.thumbnail_url ?? p.media_url ?? "")
                              : (p.media_url ?? p.thumbnail_url ?? ""),
                            mediaType:
                              p.media_type === "VIDEO" ? "VIDEO"
                              : p.media_type === "CAROUSEL_ALBUM" ? "CAROUSEL_ALBUM"
                              : "IMAGE",
                          },
                        })
                      }
                  />
                  </div>
                )}

                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  Specific post mode only reacts to comments on that one post or Reel. If you reconnect Instagram, refresh posts before testing.
                </p>

                <ManualMediaFallback
                  value={manualMedia}
                  selected={data.post?.postid !== "ANY" ? (data.post?.postid ?? null) : null}
                  onChange={setManualMedia}
                  onSelect={selectManualMedia}
                  compact={postList.length > 0}
                />
                {posts?.data?.error && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {posts.data.error}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Trigger */}
        {step === 2 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-rf-blue mb-2">
              Step 2 of 5
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight mb-2">
              {appReviewMode ? "What triggers the public reply?" : "What triggers your DM?"}
            </h2>
            <p className="dark:text-slate-400 text-slate-500 text-sm mb-6">
              Decide which comments count. For most campaigns, use a simple keyword like guide or link so people clearly opt in.
            </p>
            <KeywordInput
              triggerMode={data.triggerMode}
              keywords={data.keywords}
              matchingMode={data.matchingMode}
              onTriggerModeChange={(mode) => update({ triggerMode: mode })}
              onAdd={(w) => update({ keywords: [...data.keywords, w] })}
              onRemove={(w) => update({ keywords: data.keywords.filter((k) => k !== w) })}
              onModeChange={(m) => update({ matchingMode: m })}
            />
          </div>
        )}

        {/* Step 3 — Write DM */}
        {step === 3 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-rf-blue mb-2">
              Step 3 of 5
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight mb-2">
              {appReviewMode ? "Public reply mode" : "Private DM settings"}
            </h2>
            <p className="dark:text-slate-400 text-slate-500 text-sm mb-6">
              {appReviewMode
                ? "AP3k will receive comments, match your trigger, send a public reply, and track the lead."
                : "Choose whether AP3k sends the private message through Meta, or only tracks the comment while another tool sends the DM."}
            </p>
            {appReviewMode ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-relaxed text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                <p className="font-black">Public reply mode</p>
                <p className="mt-1">This campaign uses Instagram comments, keyword matching, public replies, and lead tracking.</p>
              </div>
            ) : (
            <>
            <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-relaxed text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
              <p className="font-black">Messaging approval note</p>
              <p className="mt-1">Meta controls private DM permissions. If approval is pending, comments can still arrive and public replies can still run, but private DMs may show as skipped or failed until Meta enables messaging.</p>
            </div>
            <button
              type="button"
              onClick={() => update({ sendPrivateDm: !data.sendPrivateDm })}
              className={[
                "mb-5 flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors",
                data.sendPrivateDm
                  ? "border-rf-blue/25 bg-rf-blue/10"
                  : "border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]",
              ].join(" ")}
            >
              <span>
                <span className="block text-sm font-bold text-slate-950 dark:text-white">Send private DM with AP3k</span>
                <span className="mt-1 block text-xs dark:text-slate-400 text-slate-500">
                  Keep on when AP3k should send the DM. Turn off only when another approved tool handles private messages.
                </span>
              </span>
              <span
                className={[
                  "relative h-6 w-11 rounded-full transition-colors",
                  data.sendPrivateDm ? "bg-rf-blue" : "bg-slate-300",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-1 h-4 w-4 rounded-full bg-white transition-all",
                    data.sendPrivateDm ? "left-6" : "left-1",
                  ].join(" ")}
                />
              </span>
            </button>
            {data.sendPrivateDm ? (
              <DmEditor
                value={data.dmMessage}
                ctaLink={data.ctaLink}
                ctaButtonTitle={data.ctaButtonTitle}
                onChange={(v) => update({ dmMessage: v })}
                onCtaLinkChange={(l) => update({ ctaLink: l })}
                onCtaButtonTitleChange={(t) => update({ ctaButtonTitle: t })}
              />
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] p-5">
                <p className="text-sm font-bold text-slate-950 dark:text-white">External DM mode</p>
                <p className="mt-1 text-sm dark:text-slate-400 text-slate-500">
                  AP3k will receive comments, match triggers, log activity, and send public replies if enabled.
                  It will not send a private DM, so make sure your external tool is active before launching.
                </p>
              </div>
            )}
            </>
            )}
          </div>
        )}

        {/* Step 4 — Public reply (optional) */}
        {step === 4 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest dark:text-slate-400 text-slate-500 mb-2">
              Step 4 of 5 — Optional
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight mb-2">
              Public comment reply
            </h2>
            <p className="dark:text-slate-400 text-slate-500 text-sm mb-6">
              AP3k can publicly reply to the comment. If true threaded reply is not available,
              AP3k uses a top-level @mention reply fallback.
            </p>
            <button
              type="button"
              onClick={() => update({ publicReplyEnabled: !data.publicReplyEnabled })}
              className={[
                "mb-5 flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors",
                data.publicReplyEnabled
                  ? "border-rf-blue/25 bg-rf-blue/10"
                  : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]",
              ].join(" ")}
            >
              <span>
                <span className="block text-sm font-bold text-slate-950 dark:text-white">Send public reply</span>
                <span className="mt-1 block text-xs dark:text-slate-400 text-slate-500">
                  {appReviewMode ? "Reply publicly when a comment matches your trigger." : "Reply publicly before the private DM. Turn off to skip public replies."}
                </span>
              </span>
              <span
                className={[
                  "relative h-6 w-11 rounded-full transition-colors",
                  data.publicReplyEnabled ? "bg-rf-blue" : "bg-slate-300",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-1 h-4 w-4 rounded-full bg-white transition-all",
                    data.publicReplyEnabled ? "left-6" : "left-1",
                  ].join(" ")}
                />
              </span>
            </button>
            {data.publicReplyEnabled && (
            <div className="flex flex-col gap-3">
              {(
                [
                  { field: "publicReply",  label: "Reply 1", placeholder: appReviewMode ? "e.g. Thanks for commenting. Here is the next step." : "e.g. Sending you the link now! 📩" },
                  { field: "publicReply2", label: "Reply 2", placeholder: appReviewMode ? "e.g. Thanks for commenting. Here is the next step." : "e.g. Check your DMs! I just sent it 👀" },
                  { field: "publicReply3", label: "Reply 3", placeholder: appReviewMode ? "e.g. Done. You can use the link in bio." : "e.g. Done! Look for my message 🎁" },
                ] as const
              ).map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="mb-1.5 block text-xs font-semibold dark:text-slate-400 text-slate-500">
                    {label}
                    {field === "publicReply" ? "" : " (optional)"}
                  </label>
                  <textarea
                    value={data[field]}
                    onChange={(e) => update({ [field]: e.target.value })}
                    placeholder={placeholder}
                    rows={2}
                    dir="auto"
                    className="ap3k-textarea w-full rounded-xl px-4 py-3 text-sm"
                  />
                  {data[field].trim() && isWeakPublicReply(data[field]) && (
                    <p className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                      For reliable testing, use clear text. Emoji-only replies may be hidden/collapsed by Instagram.
                    </p>
                  )}
                </div>
              ))}
            </div>
            )}
            <p className="text-xs dark:text-slate-400 text-slate-500 mt-3">
              AP3k randomly picks one enabled variation. Add up to 3 variations.
            </p>
          </div>
        )}

        {/* Step 5 — Review & Activate */}
        {step === 5 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-rf-green mb-2">
              Step 5 of 5
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight mb-2">
              Review &amp; Activate
            </h2>
            <p className="dark:text-slate-400 text-slate-500 text-sm mb-6">
              Confirm the account, post scope, trigger, and reply mode before going live. After activation,
              test from a different Instagram account by commenting your keyword.
            </p>

            <div className="flex flex-col gap-2 mb-6">
              {(
                [
                  { label: "Name",         value: data.campaignName || "Untitled campaign",                                           step: 1 as const },
                  { label: "Account",      value: instagram?.instagramUsername ? `@${instagram.instagramUsername}` : "No account connected", step: 1 as const },
                  { label: "Post",         value: data.post?.postid === "ANY" ? "Any post" : (data.post?.caption?.slice(0, 60) ?? "Selected post"), step: 1 as const },
                  { label: "Post scope",   value: data.post?.postid === "ANY" ? "Any Post" : data.post?.postid ? `Selected post ID ${data.post.postid}` : "Not selected", step: 1 as const },
                  { label: "Trigger",      value: data.triggerMode === "ANY_COMMENT" ? "Any comment" : "Specific keyword",           step: 2 as const },
                  { label: "Keywords",     value: data.triggerMode === "ANY_COMMENT" ? "Every comment" : data.keywords.map((keyword) => formatKeywordDisplay(keyword, appReviewMode)).join(", "),   step: 2 as const },
                  ...(appReviewMode
                    ? [{ label: "Reply mode", value: "Public reply mode", step: 3 as const }]
                    : [{ label: "Private DM", value: data.sendPrivateDm ? "Sent by AP3k" : "Skipped / handled externally", step: 3 as const }]),
                  ...(!appReviewMode && data.sendPrivateDm && data.dmMessage
                    ? [{ label: "DM message", value: data.dmMessage.slice(0, 80) + (data.dmMessage.length > 80 ? "…" : ""), step: 3 as const }]
                    : []),
                  ...(!appReviewMode && data.sendPrivateDm && (data.ctaButtonTitle || data.ctaLink)
                    ? [{ label: "CTA button", value: `${data.ctaButtonTitle || "Link"} -> ${data.ctaLink || "url"}`, step: 3 as const }]
                    : []),
                  { label: "Public reply", value: data.publicReplyEnabled && [data.publicReply, data.publicReply2, data.publicReply3].filter(Boolean).length > 0
                      ? `${[data.publicReply, data.publicReply2, data.publicReply3].filter(Boolean).length} variation(s)`
                      : "Skipped",                                                                                                     step: 4 as const },
                  { label: "Status",       value: data.active ? "Live after save" : "Save as draft",                                 step: 5 as const },
                ] as { label: string; value: string; step: 1 | 2 | 3 | 4 | 5 }[]
              ).map((row) => (
                <div key={row.label}
                     className="ap3k-review-row">
                  <span className="w-28 flex-shrink-0 text-xs font-bold text-slate-500 dark:text-slate-300">{row.label}</span>
                  <span className="flex-1 truncate text-xs font-semibold text-slate-950 dark:text-slate-50">{row.value}</span>
                  <button
                    type="button"
                    onClick={() => goTo(row.step)}
                    className="text-xs text-rf-blue hover:underline flex-shrink-0"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20
                            rounded-lg px-4 py-3 mb-4">
                {error}
              </p>
            )}
            {reviewWarnings.length > 0 && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                <p className="font-black">Health warnings</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {reviewWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
              </div>
            )}
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
              <p className="font-black text-slate-950 dark:text-white">After activation</p>
              <p className="mt-1">{appReviewMode ? "AP3k listens for matching comments, sends public replies, and tracks leads." : "AP3k listens through Meta webhooks. If no DM sends, check whether the campaign is active, the comment matches this trigger, webhook comments are arriving, and Meta messaging is approved."}</p>
            </div>

            <button
              type="button"
              onClick={() => update({ active: !data.active })}
              className={[
                "mb-6 flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors",
                data.active
                  ? "border-rf-green/25 bg-rf-green/10"
                  : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]",
              ].join(" ")}
            >
              <span>
                <span className="block text-sm font-bold text-slate-950 dark:text-white">Active campaign</span>
                <span className="mt-1 block text-xs dark:text-slate-400 text-slate-500">
                  {appReviewMode ? "When enabled, AP3k listens for matching comments, sends public replies, and tracks leads." : <>When enabled, AP3k listens for matching comments, sends public replies, and {data.sendPrivateDm ? "sends the configured DM." : "skips private DM sending."}</>}
                </span>
              </span>
              <span
                className={[
                  "relative h-6 w-11 rounded-full transition-colors",
                  data.active ? "bg-rf-green" : "bg-rf-subtle",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-1 h-4 w-4 rounded-full bg-white transition-all",
                    data.active ? "left-6" : "left-1",
                  ].join(" ")}
                />
              </span>
            </button>
          </div>
        )}

        </main>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04] p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">Preview</p>
          <h2 className="mt-2 text-lg font-black text-slate-950 dark:text-white">
            {data.campaignName || (editId ? "Edit automation" : "New automation")}
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <PreviewRow label="Post" value={data.post?.postid === "ANY" ? "Any post" : data.post?.postid ? "Specific post" : "Not selected"} />
            <PreviewRow label="Account" value={instagram?.instagramUsername ? `@${instagram.instagramUsername}` : "No account"} />
            <PreviewRow label="Trigger" value={data.triggerMode === "ANY_COMMENT" ? "Any comment" : "Specific keyword"} />
            <PreviewRow label="Keywords" value={data.triggerMode === "ANY_COMMENT" ? "Every comment" : data.keywords.length ? data.keywords.map((keyword) => formatKeywordDisplay(keyword, appReviewMode)).join(", ") : "None yet"} />
            {appReviewMode ? (
              <PreviewRow label="Reply mode" value="Public reply mode" />
            ) : (
              <>
                <PreviewRow label="Private DM" value={data.sendPrivateDm ? "Sent by AP3k" : "Skipped / handled externally"} />
                <PreviewRow label="DM" value={data.sendPrivateDm ? data.dmMessage || "Write your primary DM" : "Handled by external tool"} />
                <PreviewRow label="CTA" value={data.sendPrivateDm && (data.ctaButtonTitle || data.ctaLink) ? `${data.ctaButtonTitle || "Button"} ${data.ctaLink ? `-> ${data.ctaLink}` : ""}` : "No CTA"} />
              </>
            )}
            <PreviewRow label="Public reply" value={data.publicReplyEnabled ? `${[data.publicReply, data.publicReply2, data.publicReply3].filter(Boolean).length} variation(s)` : "Off"} />
            <PreviewRow label="Status" value={data.active ? "Live after save" : "Save paused"} />
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            <p className="font-black text-slate-950 dark:text-white">Quick test</p>
            <p className="mt-1">Use a different Instagram account to comment. Your own account replies are ignored to prevent loops.</p>
          </div>
        </aside>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 border-t border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04] px-4 py-4
                      flex items-center justify-between backdrop-blur-xl sm:px-10">
        <p className="text-xs dark:text-slate-400 text-slate-500 hidden sm:block">
          {(appReviewMode ? REVIEW_STEP_TIPS : STEP_TIPS)[step - 1]}
        </p>
        <div className="flex items-center gap-3 ml-auto">
          {step > 1 && (
            <button
              type="button"
              onClick={back}
              disabled={isSubmitting}
              className="border border-slate-200 dark:text-slate-400 text-slate-500 hover:text-slate-950 dark:hover:text-white hover:border-rf-subtle
                         font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors"
            >
              Back
            </button>
          )}
          {step < 5 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canAdvance()}
              className="ap3k-gradient-button disabled:opacity-40
                         text-sm px-7 py-2.5"
            >
              {step === 4 ? "Skip" : "Next"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  update({ active: false });
                  void activate(false);
                }}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold dark:text-slate-300 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Save as draft
              </button>
              <button
                type="button"
                onClick={() => {
                  update({ active: true });
                  void activate(true);
                }}
                disabled={isSubmitting}
                className="ap3k-gradient-button
                           text-sm px-8 py-2.5 rounded-xl flex items-center gap-2
                           disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><Loader2 size={14} className="animate-spin" /> Saving...</>
                ) : (
                  editId ? "Update campaign" : "Activate campaign"
                )}
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="ap3k-preview-card">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
        {label}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
        {value}
      </p>
    </div>
  );
}

function ManualMediaFallback({
  value,
  selected,
  onChange,
  onSelect,
  compact,
}: {
  value: string;
  selected: string | null;
  onChange: (value: string) => void;
  onSelect: () => void;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <h3 className="text-sm font-black text-slate-950 dark:text-white">
        {compact ? "Can't find a post? Paste media ID or URL manually." : "No posts found. Add a media ID manually."}
      </h3>
      <p className="mt-2 text-xs leading-relaxed dark:text-slate-400 text-slate-500">
        Use media ID from the currently connected Instagram account only. Paste the Instagram media ID for the post or Reel. A post URL can be saved as a reference,
        but webhook matching is most reliable with the Meta media ID returned by Instagram.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Instagram media ID or post URL"
          className="ap3k-input min-w-0 flex-1 rounded-xl px-4 py-3 text-sm"
        />
        <button
          type="button"
          onClick={onSelect}
          disabled={!value.trim()}
          className="ap3k-gradient-button px-5 py-3 text-sm disabled:opacity-40"
        >
          Use this post
        </button>
      </div>
      {selected && selected === value.trim() && (
        <p className="mt-3 text-xs font-semibold text-rf-green">Manual post selected.</p>
      )}
    </div>
  );
}
