"use client";

import { useUi } from "@/components/i18n/use-ui";
import { UiMessage } from "@/components/i18n/dashboard-values";
import { UiText } from "@/components/i18n/localized-copy";
import AutomationTypePicker from "@/components/automations/automation-type-picker";
import AutomationWizardToolbar from "@/components/automations/automation-wizard-toolbar";
import EngagementOptions from "@/components/automations/engagement-options";
import { getEngagementAvailability } from "@/actions/automation/engagement";
import { DEFAULT_EMAIL_CAPTURE_PROMPT, DEFAULT_FOLLOW_UP_MESSAGE } from "@/lib/automation-engagement-settings";
import InstagramPhonePreview from "@/components/automations/instagram-phone-preview";
import MessageAutomationWizard from "@/components/automations/message-automation-wizard";
import ProductCardEditor from "@/components/automations/product-card-editor";
import MessageResponseEditor from "@/components/automations/message-response-editor";
import AiCommentReplyEditor from "@/components/automations/ai-comment-reply-editor";
import EmptyState from "@/components/global/empty-state";
import KeywordInput from "@/components/global/keyword-input";
import PostPicker from "@/components/global/post-picker";
import { useQueryAutomationPosts, useQueryAutomations, useQueryUser, useQueryWebhookHealth } from "@/hooks/user-queries";
import { useWizard } from "@/hooks/use-wizard";
import { getAiWorkspace } from "@/actions/ai-workspace";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";
import { formatKeywordDisplay } from "@/lib/keyword-display";
import { readLinkButtons } from "@/lib/link-buttons";
import { DEFAULT_AI_PROTECTION_RULES } from "@/lib/ai-reply-config";
import {
  resolveFollowRequestButtonText,
  resolveFollowRequestDmText,
  resolveOpeningDmButtonText,
  resolveOpeningDmText,
} from "@/lib/comment-dm-flow";
import {
  applyMessagingReviewCampaignDefaults,
  DEFAULT_MESSAGING_REVIEW_PRIVATE_REPLY,
  isMessagingReviewMode,
} from "@/lib/messaging-review-mode";
import MobilePreviewDialog from "@/components/automations/mobile-preview-dialog";
import { contentTransition } from "@/lib/motion";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Loader2, MessageCircle, RefreshCw, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  params: { slug: string };
  searchParams?: { edit?: string; type?: string };
};

export default function WizardPage(props: Props) {
  if (!props.searchParams?.edit && !props.searchParams?.type) return <AutomationTypePicker slug={props.params.slug} />;
  return <AutomationSetup {...props} />;
}

function AutomationSetup({ params, searchParams }: Props) {
  const tr = useUi();
  const { slug } = params;
  const editId = searchParams?.edit;
  const needsCommentData = (searchParams?.type === "comment" || searchParams?.type === "affiliate") || Boolean(editId);
  const appReviewMode = isAppReviewMode();
  const messagingReviewMode = isMessagingReviewMode();
  const commentReplyOnlyReviewMode = appReviewMode && !messagingReviewMode;
  const { data: posts, isLoading: postsLoading, isFetching: postsFetching, refetch: refetchPosts } = useQueryAutomationPosts(needsCommentData);
  const { data: user } = useQueryUser();
  const { data: webhookHealth } = useQueryWebhookHealth(needsCommentData);
  const { data: editing, isLoading: editingLoading } = useQueryAutomations(editId ?? "", Boolean(editId));
  const { step, data, update, next, back, goTo, canAdvance, activate, isSubmitting, error } = useWizard(slug, editId, user?.data?.integrations?.[0]?.id ?? "");
  const [loadedEdit, setLoadedEdit] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [aiCommentsReady, setAiCommentsReady] = useState(false);
  const [followUpsReady, setFollowUpsReady] = useState(false);
  const [previewMode, setPreviewMode] = useState<"post" | "comments" | "dm" | undefined>();
  useEffect(() => { let cancelled = false; void getEngagementAvailability().then(result => { if (!cancelled) setFollowUpsReady(result.followUpsReady); }).catch(() => { if (!cancelled) setFollowUpsReady(false); }); return () => { cancelled = true; }; }, []);
  const initializedAffiliate = useRef(false);
  useEffect(() => {
    if (editId || searchParams?.type !== "affiliate" || initializedAffiliate.current) return;
    initializedAffiliate.current = true;
    update({ productCard: true, sendPrivateDm: true, openingDmEnabled: true, campaignName: tr("Send affiliate product links"), dmMessage: "", productSubtitle: "", productImageUrl: "" });
  }, [editId, searchParams?.type, tr, update]);
  const initializedMessagingReviewDraft = useRef(false);
  const stepsScrollRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const instagram = getCanonicalInstagramIntegration(user?.data?.integrations);
  const customerPlan = user?.data?.subscription?.plan ?? "FREE";
  const aiPlanAvailable = customerPlan === "PRO" || customerPlan === "BUSINESS";
  const aiReplyAvailable = aiPlanAvailable && aiCommentsReady;
  const postList: any[] = Array.isArray(posts?.data?.data) ? posts.data.data : [];
  const postsError = posts?.data?.error;
  const hasInstagramConnection = Boolean(instagram);
  const commentReplies = [data.publicReply, data.publicReply2, data.publicReply3].filter((reply) => reply.trim());
  const messagingCapabilityPending = data.sendPrivateDm && (
    webhookHealth?.data?.lastFailure?.errorMessage?.includes("dm_capability_missing") ||
    webhookHealth?.data?.lastFailure?.errorMessage?.includes("code=3")
  );
  const reviewWarnings = [
    data.post?.postid && data.post.postid !== "ANY" ? "Specific post mode only reacts to comments on that selected post or Reel." : null,
    postsError ? "Posts could not be refreshed. Use Any post or reconnect Instagram, then refresh again." : null,
    commentReplyOnlyReviewMode ? "DMs are disabled in this comment-reply review mode." : null,
    messagingCapabilityPending ? "Instagram DM access may still be pending for this account. Test with a real comment before recording." : null,
  ].filter(Boolean) as string[];

  useEffect(() => {
    if (!aiPlanAvailable || !needsCommentData) {
      setAiCommentsReady(false);
      return;
    }
    let cancelled = false;
    void getAiWorkspace()
      .then((result) => {
        if (!cancelled) setAiCommentsReady(Boolean(result.profile.aiCommentsEnabled));
      })
      .catch(() => {
        if (!cancelled) setAiCommentsReady(false);
      });
    return () => { cancelled = true; };
  }, [aiPlanAvailable, needsCommentData]);

  useEffect(() => {
    if (commentReplyOnlyReviewMode && data.sendPrivateDm) {
      update({ sendPrivateDm: false, publicReplyEnabled: true });
    }
  }, [commentReplyOnlyReviewMode, data.sendPrivateDm, update]);

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
    const preparedDm = applyMessagingReviewCampaignDefaults(
      {
        sendPrivateDm: automation.sendPrivateDm !== false,
        prompt: automation.listener?.prompt ?? "",
      },
      messagingReviewMode
    );
    const storedLinks = readLinkButtons(
      automation.listener?.quickReplies,
      automation.listener?.ctaButtonTitle,
      automation.listener?.ctaLink
    );

    update({
      campaignName: automation.name ?? "",
      active: Boolean(automation.active),
      matchingMode: "CONTAINS",
      keywords: Array.isArray(automation.keywords)
        ? automation.keywords.map((keyword: any) => keyword.word).filter(Boolean)
        : [],
      dmMessage: preparedDm.prompt,
      emailCaptureEnabled: Boolean(automation.listener?.emailCaptureEnabled),
      emailCapturePrompt: automation.listener?.emailCapturePrompt ?? DEFAULT_EMAIL_CAPTURE_PROMPT,
      followUpEnabled: Boolean(automation.listener?.followUpEnabled),
      followUpMessage: automation.listener?.followUpMessage ?? DEFAULT_FOLLOW_UP_MESSAGE,
      followUpDelayMinutes: automation.listener?.followUpDelayMinutes ?? 30,
      productCard: automation.listener?.responseFormat === "PRODUCT_CARD",
      productImageUrl: automation.listener?.mediaUrl ?? "",
      productSubtitle: automation.listener?.cardSubtitle ?? "",
      publicReply: automation.listener?.commentReply ?? "",
      publicReply2: automation.listener?.commentReply2 ?? "",
      publicReply3: automation.listener?.commentReply3 ?? "",
      aiReplyEnabled: Boolean(automation.listener?.aiReplyEnabled),
      aiReplyTone: automation.listener?.aiReplyTone === "FUN" || automation.listener?.aiReplyTone === "PROFESSIONAL" ? automation.listener.aiReplyTone : "FRIENDLY",
      aiReplyInstructions: automation.listener?.aiReplyInstructions ?? "",
      aiProtectionRules: automation.listener?.aiProtectionRules ?? DEFAULT_AI_PROTECTION_RULES,
      linkButtons: storedLinks.length
        ? storedLinks
        : [{ label: "Get the Link", url: "" }],
      followGateRequired: Boolean(automation.followGateRequired),
      openingDmText: resolveOpeningDmText(automation.listener?.openingDmText),
      openingDmButtonText: resolveOpeningDmButtonText(automation.listener?.openingDmButtonText),
      openingDmEnabled: automation.listener?.openingDmEnabled !== false,
      followRequestDmText: resolveFollowRequestDmText(automation.listener?.followRequestDmText),
      followRequestButtonText: resolveFollowRequestButtonText(automation.listener?.followRequestButtonText),
      sendPrivateDm: commentReplyOnlyReviewMode ? false : preparedDm.sendPrivateDm,
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
  }, [editId, editing, loadedEdit, messagingReviewMode, commentReplyOnlyReviewMode, update]);

  useEffect(() => {
    if (step <= 1) return;
    window.requestAnimationFrame(() => {
      const container = stepsScrollRef.current;
      if (container) container.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }, [reduceMotion, step]);

  const requestedType = searchParams?.type?.toLowerCase();
  const editingSource = (editing as any)?.data?.source;
  const selectedType = requestedType || (editingSource === "STORY" ? "story" : editingSource === "DM" ? "dm" : editId ? "comment" : undefined);

  if (!editId && !selectedType) {
    return <AutomationTypePicker slug={slug} />;
  }

  if (editId && !requestedType && editingLoading) {
    return <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-[#050816]"><Loader2 className="h-6 w-6 animate-spin text-rf-purple" /></div>;
  }

  if (selectedType === "story" || selectedType === "dm") {
    return (
      <MessageAutomationWizard
        integrationId={instagram?.id ?? ""}
        slug={slug}
        source={selectedType === "story" ? "STORY" : "DM"}
        automationId={editId}
        automation={(editing as any)?.data}
      />
    );
  }

  return (
    <div className="min-h-screen min-w-0 bg-[#f5f6fa] pb-24 text-slate-950 dark:bg-[#050816] dark:text-slate-50 xl:mt-3 xl:h-[calc(100dvh-7rem)] xl:min-h-[560px] xl:overflow-hidden xl:rounded-2xl xl:pb-0 xl:ring-1 xl:ring-slate-200 xl:dark:ring-white/10">
      <div className="mx-auto grid w-full min-w-0 max-w-[1700px] gap-4 p-3 sm:p-4 xl:h-full xl:grid-cols-[minmax(0,1.15fr)_minmax(310px,0.85fr)] 2xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0d1220] xl:min-h-0">
          <AutomationWizardToolbar
            backHref={`/dashboard/${slug}/automation`}
            currentStep={step}
            totalSteps={4}
            accountLabel={instagram?.instagramUsername ? `@${instagram.instagramUsername}` : null}
            onOpenPreview={() => setMobilePreviewOpen(true)}
          />
          <div ref={stepsScrollRef} data-automation-scroll-region className="min-w-0 [overflow-anchor:none] xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:overscroll-contain">
        <AnimatePresence mode="wait">
        <motion.main
          id="current-automation-step"
          key={step}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: 0 }}
          transition={contentTransition(reduceMotion)}
          className="h-fit min-w-0 p-5 sm:p-6 xl:min-h-full"
        >
          {step === 1 && (
            <StepPanel title="Choose a post or Reel" description="Select where AP3K should listen for comments.">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"><UiText>{"Automation name"}</UiText></label>
              <input
                value={data.campaignName}
                onChange={(event) => update({ campaignName: event.target.value })}
                placeholder={tr("Example: AI guide automation")}
                className="ap3k-input mb-5 w-full rounded-xl px-4 py-3 text-sm"
              />

              {postsLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-slate-500 dark:text-slate-400" /></div>
              ) : !hasInstagramConnection ? (
                <EmptyState icon="🔗" title="Connect Instagram first" description="AP3K needs an official Instagram connection before it can listen for comments." ctaLabel="Connect Instagram" ctaHref={`/dashboard/${slug}/integrations`} />
              ) : (
                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={() => update({ post: { postid: "ANY", caption: "Any post - triggers on all Instagram posts", media: "", mediaType: "IMAGE" } })}
                    className={[
                      "flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-start transition-[background-color,border-color,color] duration-fast",
                      data.post?.postid === "ANY" ? "border-rf-blue bg-rf-blue/10" : "border-slate-200 bg-white hover:border-rf-blue/40 dark:border-white/10 dark:bg-white/[0.04]",
                    ].join(" ")}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rf-blue/15 text-xl">🌐</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-950 dark:text-white"><UiText>{"Any post"}</UiText></span>
                      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400"><UiText>{"Listen on every post and Reel."}</UiText></span>
                    </span>
                    {data.post?.postid === "ANY" && <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-rf-blue text-xs font-bold text-white">✓</span>}
                  </button>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-white/10 dark:bg-white/[0.04]">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"><UiText>{"Choose a specific post or Reel"}</UiText></p>
                      <button
                        type="button"
                        onClick={() => void refetchPosts()}
                        disabled={postsFetching}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-70 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
                      >
                        <RefreshCw className={postsFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} /><UiText>{"Refresh"}</UiText></button>
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
                        <UiText>{"No media loaded yet. Click Refresh posts, reconnect Instagram, or use Any post."}</UiText></p>
                    )}
                  </div>

                  {postsError && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">{postsError}</p>}
                </div>
              )}
            </StepPanel>
          )}

          {step === 2 && (
            <StepPanel title="What comment starts this automation?" description="Trigger on a keyword or on every comment.">
              <KeywordInput
                triggerMode={data.triggerMode}
                keywords={data.keywords}
                onTriggerModeChange={(mode) => update({ triggerMode: mode, matchingMode: "CONTAINS" })}
                onAdd={(word) => update({ keywords: [...data.keywords, word] })}
                onRemove={(word) => update({ keywords: data.keywords.filter((keyword) => keyword !== word) })}
              />
            </StepPanel>
          )}

          {step === 3 && (
            <StepPanel title="What should AP3K do?" description="Reply publicly, send a DM, or do both.">
              <div className="space-y-5">
                <section className={[
                  "overflow-hidden rounded-2xl border transition-colors",
                  data.sendPrivateDm ? "border-rf-blue/30 bg-rf-blue/[0.04]" : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]",
                ].join(" ")}>
                  {commentReplyOnlyReviewMode ? (
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rf-blue/10 text-rf-blue"><Send className="h-5 w-5" /></span>
                        <div>
                          <p className="text-sm font-black text-slate-950 dark:text-white"><UiText>{"Send a DM"}</UiText></p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400"><UiText>{"DMs are disabled for this review mode. This mode tests comment replies and lead tracking."}</UiText></p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => update({ sendPrivateDm: !data.sendPrivateDm, ...(data.sendPrivateDm ? { followGateRequired: false, emailCaptureEnabled: false, followUpEnabled: false } : {}) })}
                        className="flex w-full items-center justify-between gap-4 p-5 text-start"
                      >
                        <span className="flex min-w-0 items-start gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rf-blue/10 text-rf-blue"><Send className="h-5 w-5" /></span>
                          <span>
                            <span className="block text-sm font-black text-slate-950 dark:text-white"><UiText>{"Send a DM"}</UiText></span>
                            <span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-slate-400"><UiText>{"Sent privately to the commenter's Instagram inbox."}</UiText></span>
                          </span>
                        </span>
                        <Toggle enabled={data.sendPrivateDm} />
                      </button>

                      {data.sendPrivateDm && (
                        <div className="space-y-4 border-t border-rf-blue/15 p-4 sm:p-5">
                          <div className={`overflow-hidden rounded-2xl border transition ${data.openingDmEnabled ? "border-violet-400/30 bg-violet-500/[0.05]" : "border-slate-200 dark:border-white/10"}`}>
                            <button type="button" onClick={() => update({ openingDmEnabled: !data.openingDmEnabled, ...(!data.openingDmEnabled ? {} : { followGateRequired: false, emailCaptureEnabled: false, followUpEnabled: false }) })} className="flex w-full items-start justify-between gap-4 p-4 text-start sm:p-5">
                              <span className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rf-purple text-xs font-black text-white">1</span><span><span className="block text-sm font-black text-slate-950 dark:text-white"><UiText>{"Opening DM "}</UiText><span className="ml-1 text-[10px] uppercase tracking-wider text-slate-400"><UiText>{"Optional"}</UiText></span></span><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400"><UiText>{"Ask the commenter to tap before AP3K delivers the final DM. Leave off to deliver the final DM immediately."}</UiText></span></span></span>
                              <Toggle enabled={data.openingDmEnabled} />
                            </button>
                            {data.openingDmEnabled && <div className="border-t border-violet-500/15 p-4 sm:p-5"><label className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300"><UiText>{"Opening message"}</UiText></label><textarea value={data.openingDmText} onChange={(event) => update({ openingDmText: event.target.value })} maxLength={640} rows={4} dir="auto" className="ap3k-textarea w-full rounded-xl px-4 py-3 text-sm" /><label className="mt-3 block text-xs font-bold text-slate-600 dark:text-slate-300"><UiText>{"Continue quick reply"}</UiText><input value={data.openingDmButtonText} onChange={(event) => update({ openingDmButtonText: event.target.value })} maxLength={20} className="ap3k-input mt-1.5 w-full rounded-xl px-4 py-3 text-sm" /></label><p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400"><UiText>{"Instagram uses this reply to open the conversation so AP3K can reliably deliver the next DM."}</UiText></p></div>}
                          </div>

                          <div className="rounded-2xl border border-rf-blue/20 bg-rf-blue/[0.05] p-4 dark:border-rf-blue/25 dark:bg-rf-blue/[0.08] sm:p-5">
                            <div className="mb-4 flex items-start gap-3">
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rf-blue text-xs font-black text-white">{data.openingDmEnabled ? "2" : "1"}</span>
                              <div>
                                <p className="text-sm font-black text-slate-950 dark:text-white"><UiText>{data.productCard ? "DM with a link and an image" : "DM with links"}</UiText></p>
                                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400"><UiText>{"The required delivery message. Add one to three link buttons."}</UiText></p>
                              </div>
                            </div>
                            {data.productCard ? <ProductCardEditor title={data.dmMessage} subtitle={data.productSubtitle ?? ""} imageUrl={data.productImageUrl ?? ""} linkButtons={data.linkButtons} onChange={next => update({
                              ...(next.title !== undefined ? { dmMessage: next.title } : {}),
                              ...(next.subtitle !== undefined ? { productSubtitle: next.subtitle } : {}),
                              ...(next.imageUrl !== undefined ? { productImageUrl: next.imageUrl } : {}),
                              ...(next.linkButtons !== undefined ? { linkButtons: next.linkButtons } : {}),
                            })} /> : <MessageResponseEditor
                              message={data.dmMessage || (messagingReviewMode ? DEFAULT_MESSAGING_REVIEW_PRIVATE_REPLY : "")}
                              linkButtons={data.linkButtons}
                              onChange={(next) => update({
                                dmMessage: next.message ?? data.dmMessage,
                                linkButtons: next.linkButtons ?? data.linkButtons,
                              })}
                            />}
                          </div>


                        </div>
                      )}
                    </>
                  )}
                </section>

                <EngagementOptions data={data} update={update} followUpsReady={followUpsReady} onPreview={setPreviewMode} />
                <AiCommentReplyEditor
                  enabled={data.aiReplyEnabled}
                  available={aiReplyAvailable}
                  workspaceReady={aiCommentsReady}
                  planLabel={customerPlan === "BUSINESS" ? "Business" : customerPlan === "PRO" ? "Pro" : "Free"}
                  tone={data.aiReplyTone}
                  instructions={data.aiReplyInstructions}
                  protections={data.aiProtectionRules}
                  settingsHref={`/dashboard/${slug}/ai`}
                  onChange={(next) => update({
                    ...(typeof next.enabled === "boolean" ? { aiReplyEnabled: next.enabled, ...(next.enabled ? { publicReplyEnabled: false } : {}) } : {}),
                    ...(next.tone ? { aiReplyTone: next.tone } : {}),
                    ...(typeof next.instructions === "string" ? { aiReplyInstructions: next.instructions } : {}),
                    ...(next.protections ? { aiProtectionRules: next.protections } : {}),
                  })}
                />

                {!data.publicReplyEnabled && !data.aiReplyEnabled && !data.sendPrivateDm && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                    <UiText>{"Choose at least one action: Reply to comment or Send a DM."}</UiText></p>
                )}
              </div>
            </StepPanel>
          )}

          {step === 4 && (
            <StepPanel title="Review & Activate" description="Check the flow, then save or activate.">
              <div className="mb-6 flex flex-col gap-2">
                {[
                  { label: "Name", value: data.campaignName || tr("Untitled automation"), step: 1 as const },
                  { label: "Account", value: instagram?.instagramUsername ? `@${instagram.instagramUsername}` : tr("No account connected"), step: 1 as const },
                  { label: "Post", value: data.post?.postid === "ANY" ? tr("Any post") : data.post?.postid ? tr("Selected post {id}").replace("{id}", data.post.postid) : tr("Not selected"), step: 1 as const },
                  { label: "Trigger", value: data.triggerMode === "ANY_COMMENT" ? tr("Any comment") : data.keywords.map((keyword) => formatKeywordDisplay(keyword, appReviewMode, tr)).join(", "), step: 2 as const },
                  { label: "Comment reply", value: data.publicReplyEnabled && commentReplies.length ? tr("Saved replies: {count}").replace("{count}", String(commentReplies.length)) : tr("Off"), step: 3 as const },
                  { label: "AI reply", value: data.aiReplyEnabled ? tr(data.aiReplyTone === "FUN" ? "Fun tone" : data.aiReplyTone === "PROFESSIONAL" ? "Professional tone" : "Friendly tone") : tr("Off"), step: 3 as const },
                  { label: "DM", value: data.sendPrivateDm ? tr("On") : tr("Off"), step: 3 as const },
                  ...(data.sendPrivateDm ? [{ label: "Opening DM", value: data.openingDmEnabled ? `${data.openingDmButtonText}: ${data.openingDmText.slice(0, 70)}${data.openingDmText.length > 70 ? "…" : ""}` : tr("Off · final DM sends immediately"), step: 3 as const }] : []),
                  ...(data.sendPrivateDm && data.dmMessage ? [{ label: "DM with a link", value: data.dmMessage.slice(0, 90) + (data.dmMessage.length > 90 ? "…" : ""), step: 3 as const }] : []),
                  ...(data.sendPrivateDm ? [{ label: "Email collection", value: data.emailCaptureEnabled ? tr("On · optional email before your link") : tr("Off"), step: 3 as const }, { label: "Follow-up", value: data.followUpEnabled ? `${data.followUpDelayMinutes} ${tr("minutes without a reply")}` : tr("Off"), step: 3 as const }] : []),
                  ...(data.sendPrivateDm ? [{ label: "Follow request", value: data.followGateRequired ? `${tr("On")} · ${data.followRequestButtonText}` : tr("Off"), step: 3 as const }] : []),
                  ...(data.sendPrivateDm ? [{ label: "Link buttons", value: data.linkButtons.map((button) => button.label || tr("Untitled link")).join(", "), step: 3 as const }] : []),
                  { label: "Status", value: data.active ? tr("Live after save") : tr("Save as draft"), step: 4 as const },
                ].map((row) => (
                  <div key={row.label} className="ap3k-review-row">
                    <span className="w-28 shrink-0 text-xs font-bold text-slate-500 dark:text-slate-300"><UiText>{row.label}</UiText></span>
                    <span className="flex-1 truncate text-xs font-semibold text-slate-950 dark:text-slate-50"><bdi>{row.value}</bdi></span>
                    <button type="button" onClick={() => goTo(row.step)} className="shrink-0 text-xs text-rf-blue hover:underline"><UiText>{"Edit"}</UiText></button>
                  </div>
                ))}
              </div>

              {error && <p className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400"><UiText>{error}</UiText></p>}
              {reviewWarnings.length > 0 && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  <p className="font-black"><UiText>{"Health warnings"}</UiText></p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">{reviewWarnings.map((warning) => <li key={warning}><UiText>{warning}</UiText></li>)}</ul>
                </div>
              )}

              <button
                type="button"
                onClick={() => update({ active: !data.active })}
                className={[
                  "mb-6 flex w-full items-center justify-between rounded-2xl border p-4 text-start transition-colors",
                  data.active ? "border-rf-green/25 bg-rf-green/10" : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]",
                ].join(" ")}
              >
                <span>
                  <span className="block text-sm font-bold text-slate-950 dark:text-white"><UiText>{"Active automation"}</UiText></span>
                  <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400"><UiText>{"When enabled, AP3K listens for matching comments and runs the actions you selected."}</UiText></span>
                </span>
                <Toggle enabled={data.active} green />
              </button>
            </StepPanel>
          )}
        </motion.main>
        </AnimatePresence>
          </div>
          <div className="hidden shrink-0 border-t border-slate-200 bg-white/95 px-4 py-3 dark:border-white/10 dark:bg-[#0d1220]/95 xl:block">
            <WizardActions step={step} editId={editId} isSubmitting={isSubmitting} canAdvance={canAdvance()} onBack={back} onNext={next} onSaveDraft={() => { update({ active: false }); void activate(false); }} onActivate={() => { update({ active: true }); void activate(true); }} />
          </div>
        </section>

        <aside className="hidden min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white/70 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.025] xl:flex">
          <InstagramPhonePreview
                  requestedMode={previewMode} onModeChange={setPreviewMode}
            data={data}
            step={step}
            username={instagram?.instagramUsername}
            profilePictureUrl={instagram?.profilePictureUrl}
          />
        </aside>
      </div>

      {mobilePreviewOpen && <MobilePreviewDialog onClose={() => setMobilePreviewOpen(false)}><InstagramPhonePreview requestedMode={previewMode} onModeChange={setPreviewMode} data={data} step={step} username={instagram?.instagramUsername} profilePictureUrl={instagram?.profilePictureUrl} /></MobilePreviewDialog>}

      <div className="ap3k-mobile-actions fixed inset-x-0 bottom-0 z-30 ps-[calc(var(--app-sidebar-offset,0px)+1rem)] border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-10px_40px_-28px_rgba(15,23,42,0.6)] backdrop-blur-xl dark:border-white/10 dark:bg-[#080c18]/95 xl:hidden">
        <WizardActions step={step} editId={editId} isSubmitting={isSubmitting} canAdvance={canAdvance()} onBack={back} onNext={next} onSaveDraft={() => { update({ active: false }); void activate(false); }} onActivate={() => { update({ active: true }); void activate(true); }} />
      </div>
    </div>
  );
}

function WizardActions({
  step,
  editId,
  isSubmitting,
  canAdvance,
  onBack,
  onNext,
  onSaveDraft,
  onActivate,
}: {
  step: 1 | 2 | 3 | 4;
  editId?: string;
  isSubmitting: boolean;
  canAdvance: boolean;
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onActivate: () => void;
}) {
  return (
    <div className="flex w-full items-center justify-end gap-2 sm:gap-3">
      {step > 1 ? (
        <button type="button" onClick={onBack} disabled={isSubmitting} className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:border-rf-subtle hover:text-slate-950 disabled:opacity-50 dark:border-white/10 dark:text-slate-400 dark:hover:text-white sm:px-6"><UiText>{"Back"}</UiText></button>
      ) : null}
      {step < 4 ? (
        <button type="button" onClick={onNext} disabled={!canAdvance} className="ap3k-gradient-button min-w-24 px-7 py-2.5 text-sm disabled:opacity-40"><UiText>{"Next"}</UiText></button>
      ) : (
        <>
          <button type="button" onClick={onSaveDraft} disabled={isSubmitting} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 sm:px-6">
            <span className="sm:hidden"><UiText>{"Draft"}</UiText></span><span className="hidden sm:inline"><UiText>{"Save as draft"}</UiText></span>
          </button>
          <button type="button" onClick={onActivate} disabled={isSubmitting} className="ap3k-gradient-button flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm disabled:opacity-50 sm:px-8">
            {isSubmitting ? <><Loader2 size={14} className="animate-spin" /><UiText>{" Saving..."}</UiText></> : <><span className="sm:hidden"><UiText>{editId ? "Update" : "Activate"}</UiText></span><span className="hidden sm:inline"><UiText>{editId ? "Update automation" : "Activate automation"}</UiText></span></>}
          </button>
        </>
      )}
    </div>
  );
}

function StepPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-1.5 text-2xl font-extrabold tracking-tight"><UiText>{title}</UiText></h2>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400"><UiText>{description}</UiText></p>
      {children}
    </div>
  );
}

function Toggle({ enabled, green = false }: { enabled: boolean; green?: boolean }) {
  return (
    <span className={["relative h-6 w-11 shrink-0 rounded-full transition-colors", enabled ? (green ? "bg-rf-green" : "bg-rf-blue") : "bg-slate-300"].join(" ")}>
      <span className={["absolute top-1 h-4 w-4 rounded-full bg-white transition-[background-color,border-color,color] duration-fast", enabled ? "start-6" : "start-1"].join(" ")} />
    </span>
  );
}
