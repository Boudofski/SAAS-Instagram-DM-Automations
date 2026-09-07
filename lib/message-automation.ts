import {
  resolveFollowRequestButtonText,
  resolveFollowRequestDmText,
} from "@/lib/comment-dm-flow";
import {
  linkButtonsAreComplete,
  normalizeLinkButtons,
  readLegacyQuickReplies,
  type LinkButton,
} from "@/lib/link-buttons";

export type MessageAutomationSource = "STORY" | "DM";
export type StoryTriggerType = "MENTION" | "REACTION" | "REPLY";
export type MessageResponseFormat = "TEXT" | "LINK" | "MEDIA";
export type MessageTriggerMode = "SPECIFIC_KEYWORD" | "ANY_MESSAGE";
export type DeliveryDelaySeconds = 0 | 3 | 5 | 10 | 30;

export type RawMessageAutomationPayload = {
  name?: string;
  active?: boolean;
  source?: string;
  storyTriggerType?: string | null;
  triggerMode?: string;
  keywords?: string[];
  responseFormat?: string;
  message?: string | null;
  quickReplies?: unknown;
  linkButtons?: unknown;
  ctaLink?: string | null;
  ctaButtonTitle?: string | null;
  mediaUrl?: string | null;
  mediaType?: string | null;
  followGateRequired?: boolean;
  typingIndicator?: boolean;
  deliveryDelaySeconds?: number;
  followRequestDmText?: string | null;
  followRequestButtonText?: string | null;
  aiReplyEnabled?: boolean;
};

export type NormalizedMessageAutomationPayload = {
  name: string;
  active: boolean;
  source: MessageAutomationSource;
  storyTriggerType: StoryTriggerType | null;
  triggerMode: MessageTriggerMode;
  keywords: string[];
  responseFormat: MessageResponseFormat;
  message: string;
  quickReplies: Array<string | LinkButton>;
  ctaLink?: string;
  ctaButtonTitle?: string;
  mediaUrl?: string;
  mediaType?: "IMAGE" | "VIDEO";
  followGateRequired: boolean;
  typingIndicator: boolean;
  deliveryDelaySeconds: DeliveryDelaySeconds;
  followRequestDmText: string;
  followRequestButtonText: string;
  aiReplyEnabled: boolean;
};

export function normalizeMessageAutomationPayload(
  payload: RawMessageAutomationPayload
): NormalizedMessageAutomationPayload {
  const source: MessageAutomationSource = payload.source === "DM" ? "DM" : "STORY";
  const responseFormat: MessageResponseFormat =
    !payload.aiReplyEnabled && (payload.linkButtons || payload.responseFormat === "LINK")
      ? "LINK"
      : payload.responseFormat === "MEDIA"
        ? "MEDIA"
        : "TEXT";
  const triggerMode: MessageTriggerMode =
    source === "DM" && payload.triggerMode === "SPECIFIC_KEYWORD"
      ? "SPECIFIC_KEYWORD"
      : "ANY_MESSAGE";
  const linkButtons = normalizeLinkButtons(
    payload.linkButtons ?? payload.quickReplies,
    payload.ctaButtonTitle,
    payload.ctaLink
  );
  const firstLink = linkButtons[0];

  return {
    name: cleanOptional(payload.name)?.slice(0, 120) || `Untitled ${source === "STORY" ? "story" : "DM"} automation`,
    active: Boolean(payload.active),
    source,
    storyTriggerType: source === "STORY" ? normalizeStoryTrigger(payload.storyTriggerType) : null,
    triggerMode,
    keywords:
      triggerMode === "SPECIFIC_KEYWORD"
        ? Array.from(new Set((payload.keywords ?? []).map((word) => word.trim().toLowerCase()).filter(Boolean))).slice(0, 20)
        : [],
    responseFormat,
    message: (payload.message ?? "").trim().slice(0, 1000),
    quickReplies: payload.aiReplyEnabled ? [] : responseFormat === "LINK" ? linkButtons : readLegacyQuickReplies(payload.quickReplies),
    ctaLink: !payload.aiReplyEnabled && responseFormat === "LINK" ? firstLink?.url : undefined,
    ctaButtonTitle:
      !payload.aiReplyEnabled && responseFormat === "LINK"
        ? firstLink?.label
        : undefined,
    mediaUrl: responseFormat === "MEDIA" ? normalizeUrl(payload.mediaUrl) : undefined,
    mediaType: responseFormat === "MEDIA" && payload.mediaType === "VIDEO" ? "VIDEO" : responseFormat === "MEDIA" ? "IMAGE" : undefined,
    // AI answers the inbound message immediately. A follow gate would consume
    // quota before hiding that generated answer and later send the fallback,
    // so it is intentionally unavailable for AI responses.
    followGateRequired: payload.aiReplyEnabled ? false : Boolean(payload.followGateRequired),
    typingIndicator: false,
    deliveryDelaySeconds: 0,
    followRequestDmText: resolveFollowRequestDmText(payload.followRequestDmText),
    followRequestButtonText: resolveFollowRequestButtonText(payload.followRequestButtonText),
    aiReplyEnabled: payload.aiReplyEnabled === true,
  };
}

export function validateMessageAutomationPayload(
  payload: NormalizedMessageAutomationPayload
): string | null {
  if (!payload.name) return "Give this automation a name.";
  if (payload.source === "STORY" && !payload.storyTriggerType) {
    return "Choose a story interaction.";
  }
  if (payload.source === "DM" && payload.triggerMode === "SPECIFIC_KEYWORD" && payload.keywords.length === 0) {
    return "Add at least one DM keyword or choose any incoming message.";
  }
  if (!payload.message) return "Write the DM that AP3K should send.";
  if (
    payload.responseFormat === "LINK" &&
    !linkButtonsAreComplete(normalizeLinkButtons(payload.quickReplies, payload.ctaButtonTitle, payload.ctaLink))
  ) {
    return "Complete every link label and add a valid destination URL.";
  }
  if (payload.responseFormat === "MEDIA" && !payload.mediaUrl) {
    return "Add a valid public image or video URL.";
  }
  return null;
}

function normalizeStoryTrigger(value?: string | null): StoryTriggerType {
  if (value === "REACTION") return "REACTION";
  if (value === "REPLY") return "REPLY";
  return "MENTION";
}

function cleanOptional(value?: string | null) {
  const clean = value?.trim();
  return clean || undefined;
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
