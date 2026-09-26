"use client";

import CommentEditor from "@/components/automations/comment-editor";
import { getAiWorkspace } from "@/actions/ai-workspace";
import { Loader2 } from "lucide-react";
import { useUi } from "@/components/i18n/use-ui";
import AutomationTypePicker from "@/components/automations/automation-type-picker";
import { getEngagementAvailability } from "@/actions/automation/engagement";
import { DEFAULT_EMAIL_CAPTURE_PROMPT, DEFAULT_FOLLOW_UP_MESSAGE } from "@/lib/automation-engagement-settings";
import MessageAutomationWizard from "@/components/automations/message-automation-wizard";
import dynamic from "next/dynamic";
const FlowBuilder = dynamic(() => import("@/components/automations/flow-builder"));
import { templateById } from "@/lib/automation-flow/templates";
const AiConversationBuilder = dynamic(() => import("@/components/automations/ai-conversation-builder"));
import { useQueryAutomationPosts, useQueryAutomations, useQueryUser } from "@/hooks/user-queries";
import { useWizard } from "@/hooks/use-wizard";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";
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
  isMessagingReviewMode,
} from "@/lib/messaging-review-mode";
import { useEffect, useRef, useState } from "react";

type Props = {
  params: { slug: string };
  searchParams?: { edit?: string; type?: string; template?: string };
};

export default function WizardPage(props: Props) {
  const params = props.searchParams;
  const requiresTemplate = params?.type === "flow" && templateById(params.template)?.type !== "flow";
  if (!params?.edit && (!params?.type || requiresTemplate)) return <AutomationTypePicker slug={props.params.slug} />;
  return <AutomationSetup {...props} />;
}

function AutomationSetup({ params, searchParams }: Props) {
  const tr = useUi();
  const { slug } = params;
  const editId = searchParams?.edit;
  const needsCommentData = (searchParams?.type === "comment" || searchParams?.type === "affiliate" || searchParams?.type === "flow") || Boolean(editId);
  const appReviewMode = isAppReviewMode();
  const messagingReviewMode = isMessagingReviewMode();
  const commentReplyOnlyReviewMode = appReviewMode && !messagingReviewMode;
  const { data: posts, isLoading: postsLoading, isFetching: postsFetching, refetch: refetchPosts } = useQueryAutomationPosts(needsCommentData);
  const { data: user, isPending: userPending, isError: userError, refetch: refetchUser } = useQueryUser();
  const { data: editing, isLoading: editingLoading } = useQueryAutomations(editId ?? "", Boolean(editId));
  const { data, update, activate, isSubmitting, error } = useWizard(slug, editId, user?.data?.integrations?.[0]?.id ?? "");
  const [loadedEdit, setLoadedEdit] = useState(false);
  const [followUpsReady, setFollowUpsReady] = useState(false);
  const [aiState,setAiState] = useState({available:false,ready:false,paid:false});
  useEffect(()=>{let cancelled=false;void getAiWorkspace().then(result=>{if(cancelled)return;const paid=result.plan === "PRO" || result.plan === "BUSINESS";setAiState({paid,ready:result.profile.aiCommentsEnabled,available:paid && result.profile.aiCommentsEnabled});}).catch(()=>{});return()=>{cancelled=true;};},[]);
  useEffect(() => { let cancelled = false; void getEngagementAvailability().then(result => { if (!cancelled) setFollowUpsReady(result.followUpsReady); }).catch(() => { if (!cancelled) setFollowUpsReady(false); }); return () => { cancelled = true; }; }, []);
  const initializedAffiliate = useRef(false);
  useEffect(() => {
    if (editId || searchParams?.type !== "affiliate" || initializedAffiliate.current) return;
    initializedAffiliate.current = true;
    update({ productCard: true, sendPrivateDm: true, openingDmEnabled: true, campaignName: tr("Send affiliate product links"), dmMessage: "", productSubtitle: "", productImageUrl: "" });
  }, [editId, searchParams?.type, tr, update]);
  const initializedTemplate = useRef(false);
  useEffect(() => {
    const template = templateById(searchParams?.template);
    if (editId || !template || initializedTemplate.current || !["comment", "affiliate"].includes(template.type)) return;
    initializedTemplate.current = true;
    update({ campaignName: template.name, keywords: template.keyword ? [template.keyword] : [], sendPrivateDm: true, openingDmEnabled: true,
      followGateRequired: ["followers", "follow-freebie"].includes(template.id),
      ...(template.id === "youtube" ? { dmMessage: "Here is the video you asked for!", linkButtons: [{ label: "Watch the video", url: "" }] } : {}),
    });
  }, [editId, searchParams?.template, update]);
  const initializedMessagingReviewDraft = useRef(false);

  const instagram = getCanonicalInstagramIntegration(user?.data?.integrations);
  const postList: any[] = Array.isArray(posts?.data?.data) ? posts.data.data : [];
  const postsError = posts?.data?.error;
  const hasInstagramConnection = Boolean(instagram);

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
      messageFormat: automation.listener?.responseFormat === "TEXT" ? "TEXT" : "LINK",
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

  const requestedType = searchParams?.type?.toLowerCase();
  const editingSource = (editing as any)?.data?.source;
  const selectedType = requestedType || (editingSource === "STORY" ? "story" : editingSource === "DM" ? "dm" : editId ? "comment" : undefined);

  if (!editId && !selectedType) {
    return <AutomationTypePicker slug={slug} />;
  }

  if (editId && editingLoading) {
    return <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-[#050816]"><Loader2 className="h-6 w-6 animate-spin text-rf-purple" /></div>;
  }

  if (editId && (editing?.status !== 200 || !editing.data)) return <div role="alert" className="p-6">{tr("Could not load automation. Please refresh and try again.")}</div>;

  if (selectedType === "flow" || (editing as any)?.data?.listener?.flowDefinition) {
    if (userPending) return <div className="grid min-h-96 place-items-center"><Loader2 className="h-6 w-6 animate-spin" aria-label="Loading account" /></div>;
    return <FlowBuilder key={`${editId ?? "new"}:${instagram?.id ?? "none"}`} slug={slug} integrationId={instagram?.id ?? ""} templateId={searchParams?.template} automation={(editing as any)?.data} posts={postList} postsLoading={postsLoading} postsError={postsError} refreshPosts={() => void refetchPosts()} plan={(user as any)?.data?.subscription?.plan ?? "FREE"} />;
  }

  if (selectedType === "ai" || (editing as any)?.data?.listener?.aiConversation) {
    return <AiConversationBuilder key={`${editId ?? "new"}:${instagram?.id ?? "none"}`} slug={slug} integrationId={instagram?.id ?? ""} accountName={instagram?.instagramUsername ?? "Instagram account"} automation={(editing as any)?.data} automationId={editId} />;
  }

  if (selectedType === "story" || selectedType === "dm") {
    return (
      <MessageAutomationWizard
        username={instagram?.instagramUsername}
        integrationId={instagram?.id ?? ""}
        slug={slug}
        templateId={searchParams?.template}
        source={selectedType === "story" ? "STORY" : "DM"}
        automationId={editId}
        automation={(editing as any)?.data}
      />
    );
  }

  return <CommentEditor slug={slug} data={data} update={update} onSave={active=>void activate(active)} saving={isSubmitting} error={error}
    editingActive={Boolean(editId && data.active)} posts={postList} postsLoading={postsLoading} postsFetching={postsFetching} refreshPosts={()=>void refetchPosts()}
    username={instagram?.instagramUsername} avatar={instagram?.profilePictureUrl} connected={hasInstagramConnection} accountLoading={userPending}
    accountError={!hasInstagramConnection && (userError || user?.status !== 200)} retryAccount={()=>{void refetchUser();void refetchPosts();}}
    postsError={postsError} followUpsReady={followUpsReady} aiAvailable={aiState.available} paid={aiState.paid} commentOnly={commentReplyOnlyReviewMode}/>;
}
