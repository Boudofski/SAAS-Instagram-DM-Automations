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
  aiMode?: boolean;
  listener?: {
    listener?: string;
    prompt?: string | null;
    commentReply?: string | null;
    commentReply2?: string | null;
    commentReply3?: string | null;
    ctaLink?: string | null;
    ctaButtonTitle?: string | null;
  } | null;
};

export type NormalizedCampaignPayload = {
  name: string;
  active: boolean;
  matchingMode: "EXACT" | "CONTAINS";
  triggerMode: CampaignTriggerMode;
  sendPrivateDm: boolean;
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
  const replies = publicReplyEnabled
    ? [
        payload.listener?.commentReply?.trim(),
        payload.listener?.commentReply2?.trim(),
        payload.listener?.commentReply3?.trim(),
      ].filter(Boolean)
    : [];

  return {
    name: payload.name?.trim() || "Untitled campaign",
    active: Boolean(payload.active),
    matchingMode,
    triggerMode,
    sendPrivateDm,
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
      ctaLink: sendPrivateDm ? cleanOptional(payload.listener?.ctaLink) : undefined,
      ctaButtonTitle: sendPrivateDm ? cleanOptional(payload.listener?.ctaButtonTitle) : undefined,
    },
  };
}

export function validateNormalizedCampaignPayload(
  payload: NormalizedCampaignPayload
): string | null {
  if (!payload.post.postid) {
    return "Campaign needs a post.";
  }

  if (payload.triggerMode === "SPECIFIC_KEYWORD" && payload.keywords.length === 0) {
    return "Specific keyword campaigns need at least one keyword.";
  }

  if (payload.sendPrivateDm && !payload.listener.prompt) {
    return "Campaign needs a DM message.";
  }

  const publicReplyCount = [
    payload.listener.commentReply,
    payload.listener.commentReply2,
    payload.listener.commentReply3,
  ].filter(Boolean).length;
  if (!payload.sendPrivateDm && publicReplyCount === 0) {
    return "Enable public reply or private DM before activating this campaign.";
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
