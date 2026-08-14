"use client";

import DmEditor from "@/components/global/dm-editor";
import EmptyState from "@/components/global/empty-state";
import KeywordInput from "@/components/global/keyword-input";
import PostPicker from "@/components/global/post-picker";
import WizardStepper from "@/components/global/wizard-stepper";
import type { StepStatus } from "@/components/global/wizard-stepper";
import { useQueryAutomationPosts, useQueryAutomations, useQueryUser, useQueryWebhookHealth } from "@/hooks/user-queries";
import { useWizard } from "@/hooks/use-wizard";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";
import { formatKeywordDisplay } from "@/lib/keyword-display";
import {
  applyMessagingReviewCampaignDefaults,
  DEFAULT_MESSAGING_REVIEW_PRIVATE_REPLY,
  isMessagingReviewMode,
} from "@/lib/messaging-review-mode";
import { Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Props = {
  params: { slug: string };
  searchParams?: { edit?: string };
};

const STEP_LABELS = [
  "Choose post",
  "Trigger",
  "Public reply",
  "Private reply",
  "Review & Activate",
];

const STEP_TIPS = [
  "Choose Any post for the easiest launch, or select a specific post or Reel from this Instagram account.",
  "Use a clear keyword so commenters intentionally trigger the automation.",
  "Public replies run first and tell commenters to check their inbox.",
  "Private replies are sent after the matching comment. Add a message and optional link button fields.",
  "Review the full flow before activating and testing from another Instagram account.",
];

export default function WizardPage({ params, searchParams }: Props) {
  const { slug } = params;
  const editId = searchParams?.edit;
  const appReviewMode = isAppReviewMode();
  const messagingReviewMode = isMessagingReviewMode();
  const publicReplyOnlyReviewMode = appReviewMode && !messagingReviewMode;
  const { data: posts, isLoading: postsLoading, isFetching: postsFetching, refetch: refetchPosts } = useQueryAutomationPosts();
  const { data: user } = useQueryUser();
  const { data: webhookHealth } = useQueryWebhookHealth();
  const { data: editing } = useQueryAutomations(editId ?? "", Boolean(editId));
  const { step, data, update, next, back, goTo, canAdvance, activate, isSubmitting, error } = useWizard(slug, editId);
  const [manualMedia, setManualMedia] = useState("");
  const [loadedEdit, setLoadedEdit] = useState(false);
  const initializedMessagingReviewDraft = useRef(false);

  const instagram = getCanonicalInstagramIntegration(user?.data?.integrations);
  const postList: any[] = Array.isArray(posts?.data?.data) ? posts.data.data : [];
  const postsError = posts?.data?.error;
  const hasInstagramConnection = Boolean(instagram);
  const steps = STEP_LABELS.map((label, i) => ({
    label,
    status: (i + 1 < step ? "done" : i + 1 === step ? "active" : "todo") as StepStatus,
  }));
  const publicReplies = [data.publicReply, data.publicReply2, data.publicReply3].filter((reply) => reply.trim());
  const messagingCapabilityPending = data.sendPrivateDm && (
    webhookHealth?.data?.lastFailure?.errorMessage?.includes("dm_capability_missing") ||
    webhookHealth?.data?.lastFailure?.errorMessage?.includes("code=3")
  );
  const reviewWarnings = [
    data.post?.postid && data.post.postid !== "ANY" ? "Specific post mode only reacts to comments on that selected post or Reel." : null,
    postsError ? "Posts could not be refreshed. Use Any post or reconnect Instagram, then refresh again." : null,
    publicReplyOnlyReviewMode ? "Private replies are disabled in this public-reply review mode." : null,
    messagingCapabilityPending ? "Meta messaging may still be pending for this account. Test with a real comment before recording." : null,
  ].filter(Boolean) as string[];

  useEffect(() => {
    if (publicReplyOnlyReviewMode && data.sendPrivateDm) {
      update({ sendPrivateDm: false, publicReplyEnabled: true });
    }
  }, [publicReplyOnlyReviewMode, data.sendPrivateDm, update]);

  useEffect(() => {
    if (initializedMessagingReviewDraft.current || !messagingReviewMode || editId) return;
    initializedMessagingReviewDraft.current = true;
    const prepared = applyMessagingReviewCampaignDefaults(
      { sendPrivateDm: data.sendPrivateDm, prompt: data.dmMessage },
      true
    );
    update({ sendPrivateDm: prepared.sendPrivateDm, dmMessage: prepared.prompt });
  }, [data.dmMessage, data.sendPrivateDm, editId, messagingReviewMode, update]);

  useEffect(() => {
    if (!editId || loadedEdit || editing?.status !== 200 || !editing.data) return;
    const automation: any = editing.data;
    const post = automation.posts?.[0];
    const preparedPrivateReply = applyMessagingReviewCampaignDefaults(
      {
        sendPrivateDm: automation.sendPrivateDm !== false,
        prompt: automation.listener?.prompt ?? "",
      },
      messagingReviewMode
    );

    update({
      campaignName: automation.name ?? "",
      active: Boolean(automation.active),
      matchingMode: automation.matchingMode ?? "CONTAINS",
      keywords: Array.isArray(automation.keywords)
        ? automation.keywords.map((keyword: any) => keyword.word).filter(Boolean)
        : [],
      dmMessage: preparedPrivateReply.prompt,
      publicReply: automation.listener?.commentReply ?? "",
      publicReply2: automation.listener?.commentReply2 ?? "",
      publicReply3: automation.listener?.commentReply3 ?? "",
      ctaLink: automation.listener?.ctaLink ?? "",
      ctaButtonTitle: automation.listener?.ctaButtonTitle ?? "",
      sendPrivateDm: publicReplyOnlyReviewMode ? false : preparedPrivateReply.sendPrivateDm,
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
  }, [editId, editing, loadedEdit, messagingReviewMode, publicReplyOnlyReviewMode, update]);

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
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] sm:px-8">
        <Link href={`/dashboard/${slug}/automation`} className="text-sm text-slate-500 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">
          Back
        </Link>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-950 dark:text-white">{editId ? "Edit Campaign" : "New Campaign"}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Instagram comment automation</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-rf-green" /> Auto-saved
        </span>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-8">
        <WizardStepper steps={steps} />
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-8 lg:grid-cols-[1fr_340px]">
        <main className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          {step === 1 && (
            <StepPanel eyebrow="Step 1 of 5" title="Name it and choose a post or Reel" description="Choose where AP3k should listen for comments. Any post is the fastest option; specific post mode limits the campaign to one post or Reel.">
              {instagram?.instagramUsername && (
                <p className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200">
                  Current account: @{instagram.instagramUsername}
                </p>
              )}
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Campaign name</label>
              <input
                value={data.campaignName}
                onChange={(event) => update({ campaignName: event.target.value })}
                placeholder="Example: AI guide campaign"
                className="ap3k-input mb-6 w-full rounded-xl px-4 py-3 text-sm"
              />

              {postsLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-500 dark:text-slate-400" /></div>
              ) : !hasInstagramConnection ? (
                <EmptyState icon="🔗" title="Connect Instagram first" description="AP3k needs an official Instagram connection before it can listen for comments." ctaLabel="Connect Instagram" ctaHref={`/dashboard/${slug}/integrations`} />
              ) : (
                <div className="flex flex-col gap-5">
                  <button
                    type="button"
                    onClick={() => update({ post: { postid: "ANY", caption: "Any post - triggers on all Instagram posts", media: "", mediaType: "IMAGE" } })}
                    className={[
                      "flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all",
                      data.post?.postid === "ANY" ? "border-rf-blue bg-rf-blue/10" : "border-slate-200 bg-white hover:border-rf-blue/40 dark:border-white/10 dark:bg-white/[0.04]",
                    ].join(" ")}
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rf-blue/15 text-2xl">🌐</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-950 dark:text-white">Any post</span>
                      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">Recommended for launch. AP3k checks comments on all posts and Reels from the connected account.</span>
                    </span>
                    {data.post?.postid === "ANY" && <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-rf-blue text-xs font-bold text-white">✓</span>}
                  </button>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Choose a specific post or Reel</p>
                      <button
                        type="button"
                        onClick={() => void refetchPosts()}
                        disabled={postsFetching}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-70 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
                      >
                        <RefreshCw className={postsFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
                        Refresh posts
                      </button>
                    </div>
                    {postList.length > 0 ? (
                      <PostPicker
                        posts={postList}
                        selected={data.post?.postid !== "ANY" ? data.post?.postid ?? null : null}
                        onSelect={(p: any) => update({
                          post: {
                            postid: p.id,
                            caption: p.caption,
                            media: p.media_type === "VIDEO" ? (p.thumbnail_url ?? p.media_url ?? "") : (p.media_url ?? p.thumbnail_url ?? ""),
                            mediaType: p.media_type === "VIDEO" ? "VIDEO" : p.media_type === "CAROUSEL_ALBUM" ? "CAROUSEL_ALBUM" : "IMAGE",
                          },
                        })}
                      />
                    ) : (
                      <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                        No media loaded yet. Click Refresh posts, reconnect Instagram, or use Any post.
                      </p>
                    )}
                  </div>

                  {postsError && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">{postsError}</p>}
                  <ManualMediaFallback value={manualMedia} selected={data.post?.postid !== "ANY" ? data.post?.postid ?? null : null} onChange={setManualMedia} onSelect={selectManualMedia} compact={postList.length > 0} />
                </div>
              )}
            </StepPanel>
          )}

          {step === 2 && (
            <StepPanel eyebrow="Step 2 of 5" title="What comment triggers this campaign?" description="Choose a keyword trigger or run on every comment. For private replies, a clear keyword like guide or link is best.">
              <KeywordInput
                triggerMode={data.triggerMode}
                keywords={data.keywords}
                matchingMode={data.matchingMode}
                onTriggerModeChange={(mode) => update({ triggerMode: mode })}
                onAdd={(word) => update({ keywords: [...data.keywords, word] })}
                onRemove={(word) => update({ keywords: data.keywords.filter((keyword) => keyword !== word) })}
                onModeChange={(mode) => update({ matchingMode: mode })}
              />
            </StepPanel>
          )}

          {step === 3 && (
            <StepPanel eyebrow="Step 3 of 5" title="Public comment reply" description="Public replies run before the private reply. They tell the commenter to check their inbox and create a visible response on the post.">
              <button
                type="button"
                onClick={() => update({ publicReplyEnabled: !data.publicReplyEnabled })}
                className={[
                  "mb-5 flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors",
                  data.publicReplyEnabled ? "border-rf-blue/25 bg-rf-blue/10" : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]",
                ].join(" ")}
              >
                <span>
                  <span className="block text-sm font-bold text-slate-950 dark:text-white">Send public reply first</span>
                  <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">Recommended. The private reply still sends after the comment when enabled.</span>
                </span>
                <Toggle enabled={data.publicReplyEnabled} />
              </button>
              {data.publicReplyEnabled && (
                <div className="flex flex-col gap-3">
                  {[
                    { field: "publicReply", label: "Reply 1", placeholder: "Thanks for commenting. I sent it to your inbox." },
                    { field: "publicReply2", label: "Reply 2", placeholder: "Check your inbox — I just sent it." },
                    { field: "publicReply3", label: "Reply 3", placeholder: "Done — please check your messages." },
                  ].map((item) => (
                    <div key={item.field}>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{item.label}</label>
                      <textarea
                        value={(data as any)[item.field]}
                        onChange={(event) => update({ [item.field]: event.target.value } as any)}
                        placeholder={item.placeholder}
                        rows={3}
                        dir="auto"
                        className="ap3k-textarea w-full rounded-xl px-4 py-3 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </StepPanel>
          )}

          {step === 4 && (
            <StepPanel eyebrow="Step 4 of 5" title="Private reply after comment" description="AP3k sends this private reply after a matching comment. Add the message, button label, and destination link here.">
              {publicReplyOnlyReviewMode ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  <p className="font-black">Private replies disabled for this review mode</p>
                  <p className="mt-1">This mode only tests public replies and lead tracking.</p>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => update({ sendPrivateDm: !data.sendPrivateDm })}
                    className={[
                      "mb-5 flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors",
                      data.sendPrivateDm ? "border-rf-blue/25 bg-rf-blue/10" : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]",
                    ].join(" ")}
                  >
                    <span>
                      <span className="block text-sm font-bold text-slate-950 dark:text-white">Send private reply with AP3k</span>
                      <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">Turn off only if another approved tool handles private replies.</span>
                    </span>
                    <Toggle enabled={data.sendPrivateDm} />
                  </button>

                  {data.sendPrivateDm ? (
                    <DmEditor
                      value={data.dmMessage || (messagingReviewMode ? DEFAULT_MESSAGING_REVIEW_PRIVATE_REPLY : "")}
                      ctaLink={data.ctaLink}
                      ctaButtonTitle={data.ctaButtonTitle}
                      onChange={(value) => update({ dmMessage: value })}
                      onCtaLinkChange={(link) => update({ ctaLink: link })}
                      onCtaButtonTitleChange={(title) => update({ ctaButtonTitle: title })}
                    />
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.04]">
                      <p className="text-sm font-bold text-slate-950 dark:text-white">Private reply disabled</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">AP3k will still receive comments, match triggers, log activity, and send public replies if enabled.</p>
                    </div>
                  )}
                </>
              )}
            </StepPanel>
          )}

          {step === 5 && (
            <StepPanel eyebrow="Step 5 of 5" title="Review & Activate" description="Confirm the account, post scope, trigger, public reply, private reply, and status before saving.">
              <div className="mb-6 flex flex-col gap-2">
                {[
                  { label: "Name", value: data.campaignName || "Untitled campaign", step: 1 as const },
                  { label: "Account", value: instagram?.instagramUsername ? `@${instagram.instagramUsername}` : "No account connected", step: 1 as const },
                  { label: "Post", value: data.post?.postid === "ANY" ? "Any post" : data.post?.postid ? `Selected post ${data.post.postid}` : "Not selected", step: 1 as const },
                  { label: "Trigger", value: data.triggerMode === "ANY_COMMENT" ? "Any comment" : data.keywords.map((keyword) => formatKeywordDisplay(keyword, appReviewMode)).join(", "), step: 2 as const },
                  { label: "Public reply", value: data.publicReplyEnabled && publicReplies.length ? `${publicReplies.length} variation(s)` : "Skipped", step: 3 as const },
                  { label: "Private reply", value: data.sendPrivateDm ? "Enabled" : "Disabled", step: 4 as const },
                  ...(data.sendPrivateDm && data.dmMessage ? [{ label: "Private message", value: data.dmMessage.slice(0, 90) + (data.dmMessage.length > 90 ? "…" : ""), step: 4 as const }] : []),
                  ...(data.sendPrivateDm && (data.ctaButtonTitle || data.ctaLink) ? [{ label: "Link button", value: `${data.ctaButtonTitle || "Open link"} -> ${data.ctaLink || "No link yet"}`, step: 4 as const }] : []),
                  { label: "Status", value: data.active ? "Live after save" : "Save as draft", step: 5 as const },
                ].map((row) => (
                  <div key={row.label} className="ap3k-review-row">
                    <span className="w-28 shrink-0 text-xs font-bold text-slate-500 dark:text-slate-300">{row.label}</span>
                    <span className="flex-1 truncate text-xs font-semibold text-slate-950 dark:text-slate-50">{row.value}</span>
                    <button type="button" onClick={() => goTo(row.step)} className="shrink-0 text-xs text-rf-blue hover:underline">Edit</button>
                  </div>
                ))}
              </div>

              {error && <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">{error}</p>}
              {reviewWarnings.length > 0 && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  <p className="font-black">Health warnings</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">{reviewWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
                </div>
              )}

              <button
                type="button"
                onClick={() => update({ active: !data.active })}
                className={[
                  "mb-6 flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors",
                  data.active ? "border-rf-green/25 bg-rf-green/10" : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]",
                ].join(" ")}
              >
                <span>
                  <span className="block text-sm font-bold text-slate-950 dark:text-white">Active campaign</span>
                  <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">When enabled, AP3k listens for matching comments and runs the configured replies.</span>
                </span>
                <Toggle enabled={data.active} green />
              </button>
            </StepPanel>
          )}
        </main>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">Preview</p>
          <h2 className="mt-2 text-lg font-black text-slate-950 dark:text-white">{data.campaignName || (editId ? "Edit campaign" : "New campaign")}</h2>
          <div className="mt-4 space-y-3 text-sm">
            <PreviewRow label="Post" value={data.post?.postid === "ANY" ? "Any post" : data.post?.postid ? "Specific post" : "Not selected"} />
            <PreviewRow label="Account" value={instagram?.instagramUsername ? `@${instagram.instagramUsername}` : "No account"} />
            <PreviewRow label="Trigger" value={data.triggerMode === "ANY_COMMENT" ? "Any comment" : data.keywords.length ? data.keywords.map((keyword) => formatKeywordDisplay(keyword, appReviewMode)).join(", ") : "No keyword"} />
            <PreviewRow label="Public reply" value={data.publicReplyEnabled ? `${publicReplies.length} variation(s)` : "Off"} />
            <PreviewRow label="Private reply" value={data.sendPrivateDm ? data.dmMessage || DEFAULT_MESSAGING_REVIEW_PRIVATE_REPLY : "Off"} />
            <PreviewRow label="Link button" value={data.sendPrivateDm && (data.ctaButtonTitle || data.ctaLink) ? `${data.ctaButtonTitle || "Open link"} ${data.ctaLink ? `-> ${data.ctaLink}` : ""}` : "No link"} />
            <PreviewRow label="Status" value={data.active ? "Live after save" : "Save paused"} />
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
            <p className="font-black text-slate-950 dark:text-white">Quick test</p>
            <p className="mt-1">Use a different Instagram account to comment. Your own account replies are ignored to prevent loops.</p>
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 flex items-center justify-between border-t border-slate-200 bg-white px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] sm:px-10">
        <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">{STEP_TIPS[step - 1]}</p>
        <div className="ml-auto flex items-center gap-3">
          {step > 1 && (
            <button type="button" onClick={back} disabled={isSubmitting} className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:border-rf-subtle hover:text-slate-950 disabled:opacity-50 dark:text-slate-400 dark:hover:text-white">
              Back
            </button>
          )}
          {step < 5 ? (
            <button type="button" onClick={next} disabled={!canAdvance()} className="ap3k-gradient-button px-7 py-2.5 text-sm disabled:opacity-40">
              {step === 3 && data.sendPrivateDm ? "Next" : step === 3 ? "Next" : "Next"}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => { update({ active: false }); void activate(false); }} disabled={isSubmitting} className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:text-slate-300">
                Save as draft
              </button>
              <button type="button" onClick={() => { update({ active: true }); void activate(true); }} disabled={isSubmitting} className="ap3k-gradient-button flex items-center gap-2 rounded-xl px-8 py-2.5 text-sm disabled:opacity-50">
                {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : editId ? "Update campaign" : "Activate campaign"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StepPanel({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-rf-blue">{eyebrow}</p>
      <h2 className="mb-2 text-2xl font-extrabold tracking-tight">{title}</h2>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {children}
    </div>
  );
}

function Toggle({ enabled, green = false }: { enabled: boolean; green?: boolean }) {
  return (
    <span className={["relative h-6 w-11 shrink-0 rounded-full transition-colors", enabled ? (green ? "bg-rf-green" : "bg-rf-blue") : "bg-slate-300"].join(" ")}>
      <span className={["absolute top-1 h-4 w-4 rounded-full bg-white transition-all", enabled ? "left-6" : "left-1"].join(" ")} />
    </span>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="ap3k-preview-card">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-50">{value}</p>
    </div>
  );
}

function ManualMediaFallback({ value, selected, onChange, onSelect, compact }: { value: string; selected: string | null; onChange: (value: string) => void; onSelect: () => void; compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
      <h3 className="text-sm font-black text-slate-950 dark:text-white">{compact ? "Can't find a post? Paste media ID or URL manually." : "No posts found. Add a media ID manually."}</h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">Use media ID from the currently connected Instagram account only. A post URL can be saved as a reference, but webhook matching is most reliable with the Instagram media ID.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Instagram media ID or post URL" className="ap3k-input min-w-0 flex-1 rounded-xl px-4 py-3 text-sm" />
        <button type="button" onClick={onSelect} disabled={!value.trim()} className="ap3k-gradient-button px-5 py-3 text-sm disabled:opacity-40">Use this post</button>
      </div>
      {selected && selected === value.trim() && <p className="mt-3 text-xs font-semibold text-rf-green">Manual post selected.</p>}
    </div>
  );
}
