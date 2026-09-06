import {
  resolveFollowRequestButtonText,
  resolveFollowRequestDmText,
  resolveOpeningDmButtonText,
  resolveOpeningDmText,
} from "@/lib/comment-dm-flow";
import {
  linkButtonsAreComplete,
  normalizeLinkButtons,
  readLegacyQuickReplies,
  type LinkButton,
} from "@/lib/link-buttons";

export type CampaignTriggerMode = "SPECIFIC_KEYWORD" | "ANY_COMMENT";
export type CampaignMatchingMode = "EXACT" | "CONTAINS" | "SMART_AI";
export type CampaignMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

export type RawCampaignPayload = {
  name?: string;
  active?: boolean;
  matchingMode?: string;
  triggerMode?: string;
  post?: {
    postid?: string | null;
    caption?: string | null;
    media?: string | null;
    mediaType?: string | null;
  } | null;
  keywords?: string[];
  publicReplyEnabled?: boolean;
  sendPrivateDm?: boolean;
  followGateRequired?: boolean;
  typingIndicator?: boolean;
  deliveryDelaySeconds?: number;
  aiMode?: boolean;
  listener?: {
    listener?: string;
    prompt?: string | null;
    commentReply?: string | null;
    commentReply2?: string | null;
    commentReply3?: string | null;
    ctaLink?: string | null;
    ctaButtonTitle?: string | null;
    responseFormat?: string | null;
    quickReplies?: unknown;
    linkButtons?: unknown;
    mediaUrl?: string | null;
    mediaType?: string | null;
    openingDmText?: string | null;
    openingDmButtonText?: string | null;
    followRequestDmText?: string | null;
    followRequestButtonText?: string | null;
  } | null;
};

export type NormalizedCampaignPayload = {
  name: string;
  active: boolean;
  matchingMode: "EXACT" | "CONTAINS";
  triggerMode: CampaignTriggerMode;
  sendPrivateDm: boolean;
  followGateRequired?: boolean;
  typingIndicator?: boolean;
  deliveryDelaySeconds?: 0 | 3 | 5 | 10 | 30;
  post: {
    postid: string;
    caption?: string;
    media: string;
    mediaType: CampaignMediaType;
  };
  keywords: string[];
  listener: {
    listener: "MESSAGE";
    prompt: string;
    commentReply?: string;
    commentReply2?: string;
    commentReply3?: string;
    ctaLink?: string;
    ctaButtonTitle?: string;
    responseFormat?: "TEXT" | "LINK" | "MEDIA";
    quickReplies?: Array<string | LinkButton>;
    mediaUrl?: string;
    mediaType?: "IMAGE" | "VIDEO";
    openingDmText?: string;
    openingDmButtonText?: string;
    followRequestDmText?: string;
    followRequestButtonText?: string;
  };
};

export type CampaignPayloadSummary = {
  name: string;
  active: boolean;
  triggerMode: CampaignTriggerMode;
  matchingMode: "EXACT" | "CONTAINS";
  postid: string;
  keywordsCount: number;
  listenerPromptPresent: boolean;
  publicReplyEnabled: boolean;
  sendPrivateDm: boolean;
  publicReplyCount: number;
  ctaTitlePresent: boolean;
  ctaUrlPresent: boolean;
  mediaType: CampaignMediaType;
};

export function normalizeCampaignPayload(
  payload: RawCampaignPayload
): NormalizedCampaignPayload {
  const triggerMode: CampaignTriggerMode =
    payload.triggerMode === "ANY_COMMENT" ? "ANY_COMMENT" : "SPECIFIC_KEYWORD";

  const matchingMode =
    payload.matchingMode === "EXACT" || payload.matchingMode === "EQUAL"
      ? "EXACT"
      : "CONTAINS";

  const postid = payload.post?.postid?.trim() ?? "";
  const publicReplyEnabled = payload.publicReplyEnabled !== false;
  const sendPrivateDm = payload.sendPrivateDm !== false;
  const responseFormat = payload.listener?.responseFormat === "MEDIA"
    ? "MEDIA"
    : payload.listener?.responseFormat === "LINK" || payload.listener?.ctaLink
      ? "LINK"
      : "TEXT";
  const linkButtons = normalizeLinkButtons(
    payload.listener?.linkButtons ?? payload.listener?.quickReplies,
    payload.listener?.ctaButtonTitle,
    payload.listener?.ctaLink
  );
  const firstLink = linkButtons[0];
  const replies = publicReplyEnabled
    ? [
        payload.listener?.commentReply?.trim(),
        payload.listener?.commentReply2?.trim(),
        payload.listener?.commentReply3?.trim(),
      ].filter(Boolean)
    : [];

  return {
    name: payload.name?.trim() || "Untitled automation",
    active: Boolean(payload.active),
    matchingMode,
    triggerMode,
    sendPrivateDm,
    followGateRequired: Boolean(payload.followGateRequired),
    typingIndicator: false,
    deliveryDelaySeconds: 0,
    post: {
      postid,
      caption: cleanOptional(payload.post?.caption),
      media: cleanOptional(payload.post?.media) ?? "",
      mediaType: normalizeCampaignMediaType(payload.post?.mediaType),
    },
    keywords: cleanKeywords(triggerMode, payload.keywords ?? []),
    listener: {
      listener: "MESSAGE",
      prompt: payload.listener?.prompt?.trim() ?? "",
      commentReply: replies[0],
      commentReply2: replies[1],
      commentReply3: replies[2],
      ctaLink: sendPrivateDm && responseFormat === "LINK" ? firstLink?.url : undefined,
      ctaButtonTitle: sendPrivateDm && responseFormat === "LINK" ? firstLink?.label : undefined,
      responseFormat,
      quickReplies: sendPrivateDm
        ? responseFormat === "LINK"
          ? linkButtons
          : readLegacyQuickReplies(payload.listener?.quickReplies)
        : [],
      mediaUrl: sendPrivateDm && responseFormat === "MEDIA" ? normalizeUrl(payload.listener?.mediaUrl) : undefined,
      mediaType: sendPrivateDm && responseFormat === "MEDIA" && payload.listener?.mediaType === "VIDEO" ? "VIDEO" : responseFormat === "MEDIA" ? "IMAGE" : undefined,
      openingDmText: sendPrivateDm ? resolveOpeningDmText(payload.listener?.openingDmText) : undefined,
      openingDmButtonText: sendPrivateDm ? resolveOpeningDmButtonText(payload.listener?.openingDmButtonText) : undefined,
      followRequestDmText: sendPrivateDm ? resolveFollowRequestDmText(payload.listener?.followRequestDmText) : undefined,
      followRequestButtonText: sendPrivateDm ? resolveFollowRequestButtonText(payload.listener?.followRequestButtonText) : undefined,
    },
  };
}

export function validateNormalizedCampaignPayload(
  payload: NormalizedCampaignPayload
): string | null {
  if (!payload.post.postid) {
    return "This automation needs a post.";
  }

  if (payload.triggerMode === "SPECIFIC_KEYWORD" && payload.keywords.length === 0) {
    return "Specific keyword automations need at least one keyword.";
  }

  if (payload.sendPrivateDm && !payload.listener.prompt) {
    return "This automation needs a DM message.";
  }

  if (
    payload.sendPrivateDm &&
    payload.listener.responseFormat === "LINK" &&
    !linkButtonsAreComplete(normalizeLinkButtons(payload.listener.quickReplies, payload.listener.ctaButtonTitle, payload.listener.ctaLink))
  ) {
    return "Complete every link label and add a valid destination URL.";
  }

  if (payload.sendPrivateDm && payload.listener.responseFormat === "MEDIA" && !payload.listener.mediaUrl) {
    return "Add a valid public image or video URL.";
  }

  const publicReplyCount = [
    payload.listener.commentReply,
    payload.listener.commentReply2,
    payload.listener.commentReply3,
  ].filter(Boolean).length;
  if (!payload.sendPrivateDm && publicReplyCount === 0) {
    return "Choose a comment reply or DM before activating this automation.";
  }

  return null;
}

export function summarizeCampaignPayload(
  payload: NormalizedCampaignPayload,
  publicReplyEnabled = Boolean(
    payload.listener.commentReply ||
      payload.listener.commentReply2 ||
      payload.listener.commentReply3
  )
): CampaignPayloadSummary {
  return {
    name: payload.name,
    active: payload.active,
    triggerMode: payload.triggerMode,
    matchingMode: payload.matchingMode,
    sendPrivateDm: payload.sendPrivateDm,
    postid: payload.post.postid,
    keywordsCount: payload.keywords.length,
    listenerPromptPresent: Boolean(payload.listener.prompt),
    publicReplyEnabled,
    publicReplyCount: [
      payload.listener.commentReply,
      payload.listener.commentReply2,
      payload.listener.commentReply3,
    ].filter(Boolean).length,
    ctaTitlePresent: Boolean(payload.listener.ctaButtonTitle),
    ctaUrlPresent: Boolean(payload.listener.ctaLink),
    mediaType: payload.post.mediaType,
  };
}

export function normalizeCampaignMediaType(value?: string | null): CampaignMediaType {
  if (value === "VIDEO") return "VIDEO";
  if (value === "CAROUSEL_ALBUM" || value === "CAROSEL_ALBUM") return "CAROUSEL_ALBUM";
  return "IMAGE";
}

function cleanKeywords(triggerMode: CampaignTriggerMode, keywords: string[]) {
  if (triggerMode === "ANY_COMMENT") return [];
  return Array.from(
    new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean))
  );
}

function cleanOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function normalizeUrl(value?: string | null) {
  const raw = cleanOptional(value);
  if (!raw) return undefined;
  try {
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}
