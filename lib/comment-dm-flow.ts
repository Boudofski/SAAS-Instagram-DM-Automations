export const DEFAULT_OPENING_DM_TEXT =
  "Hey there! I’m so happy you’re here, thanks so much for your interest 😊\n\nClick below and I’ll send you the link in just a sec ✨";

export const DEFAULT_OPENING_DM_BUTTON_TEXT = "Send me the link";

export const DEFAULT_FOLLOW_REQUEST_DM_TEXT =
  "Nearly there! The link is especially for my followers ✨\n\nRight after you follow me, I’ll send you the link so you can dive straight in! 🎉";

export const DEFAULT_FOLLOW_REQUEST_BUTTON_TEXT = "Following";

export const OPENING_DM_ACTION_PREFIX = "AP3K_OPENING_CONTINUE:";
export const FOLLOW_REQUEST_ACTION_PREFIX = "AP3K_FOLLOW_CHECK:";

export type CommentDmAction = {
  type: "OPENING_CONTINUE" | "FOLLOW_CHECK";
  automationId: string;
};

export function openingDmActionPayload(automationId: string) {
  return `${OPENING_DM_ACTION_PREFIX}${automationId}`;
}

export function followRequestActionPayload(automationId: string) {
  return `${FOLLOW_REQUEST_ACTION_PREFIX}${automationId}`;
}

export function parseCommentDmActionPayload(payload?: string | null): CommentDmAction | null {
  if (!payload) return null;

  if (payload.startsWith(OPENING_DM_ACTION_PREFIX)) {
    const automationId = payload.slice(OPENING_DM_ACTION_PREFIX.length).trim();
    return automationId ? { type: "OPENING_CONTINUE", automationId } : null;
  }

  if (payload.startsWith(FOLLOW_REQUEST_ACTION_PREFIX)) {
    const automationId = payload.slice(FOLLOW_REQUEST_ACTION_PREFIX.length).trim();
    return automationId ? { type: "FOLLOW_CHECK", automationId } : null;
  }

  return null;
}

export function resolveOpeningDmText(value?: string | null) {
  return cleanText(value, DEFAULT_OPENING_DM_TEXT, 640);
}

export function resolveOpeningDmButtonText(value?: string | null) {
  return cleanButton(value, DEFAULT_OPENING_DM_BUTTON_TEXT);
}

export function resolveFollowRequestDmText(value?: string | null) {
  return cleanText(value, DEFAULT_FOLLOW_REQUEST_DM_TEXT, 640);
}

export function resolveFollowRequestButtonText(value?: string | null) {
  return cleanButton(value, DEFAULT_FOLLOW_REQUEST_BUTTON_TEXT);
}

function cleanText(value: string | null | undefined, fallback: string, maxLength: number) {
  const text = value?.trim() || fallback;
  return Array.from(text).slice(0, maxLength).join("");
}

function cleanButton(value: string | null | undefined, fallback: string) {
  return Array.from(value?.trim() || fallback).slice(0, 20).join("");
}
