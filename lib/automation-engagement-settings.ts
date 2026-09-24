export const DEFAULT_EMAIL_CAPTURE_PROMPT = "What’s your email address? Reply with it and I’ll send your link here.";
export const DEFAULT_FOLLOW_UP_MESSAGE = "Still interested? Here’s the link you asked for 👇";
export const FOLLOW_UP_DELAYS = [15, 30, 60, 180, 720] as const;
export const MESSAGING_WINDOW_MS = 24 * 60 * 60 * 1000;

export type EngagementSettings = {
  emailCaptureEnabled?: boolean;
  emailCapturePrompt?: string | null;
  followUpEnabled?: boolean;
  followUpMessage?: string | null;
  followUpDelayMinutes?: number;
};

export function validateEngagementSettings(settings: EngagementSettings, sendDm: boolean, openingDm: boolean) {
  if (!sendDm) return null;
  if ((settings.emailCaptureEnabled || settings.followUpEnabled) && !openingDm) return "Enable Opening DM before collecting emails or sending a follow-up.";
  if (settings.emailCaptureEnabled && (!settings.emailCapturePrompt?.trim() || settings.emailCapturePrompt.length > 640)) return "Add an email request between 1 and 640 characters.";
  if (settings.followUpEnabled && (!settings.followUpMessage?.trim() || settings.followUpMessage.length > 640)) return "Add a follow-up message between 1 and 640 characters.";
  if (settings.followUpEnabled && !FOLLOW_UP_DELAYS.includes(settings.followUpDelayMinutes as typeof FOLLOW_UP_DELAYS[number])) return "Choose a supported follow-up delay.";
  return null;
}

export function parseEmailReply(text: string): { kind: "email"; email: string } | { kind: "skip" | "stop" | "invalid" } {
  const clean = text.trim();
  if (/^(stop|unsubscribe|cancel)$/i.test(clean)) return { kind: "stop" };
  if (/^(skip|no thanks)$/i.test(clean)) return { kind: "skip" };
  // Capture only a whole reply containing one address, never extract addresses
  // incidentally mentioned in a conversation or arbitrary display-name strings.
  if (clean.length <= 254 && /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+$/i.test(clean)) {
    const [local] = clean.split("@");
    if (local.length <= 64 && !local.startsWith(".") && !local.endsWith(".") && !local.includes("..")) return { kind: "email", email: clean.toLowerCase() };
  }
  return { kind: "invalid" };
}

export function messagingWindowOpen(inboundAt: Date, now = new Date()) {
  const age = now.getTime() - inboundAt.getTime();
  return Number.isFinite(age) && age >= 0 && age < MESSAGING_WINDOW_MS;
}

export function followUpEligible(input: { inboundAt: Date; latestInboundAt: Date | null; dueAt: Date; expiresAt: Date }, now = new Date()) {
  return input.dueAt <= now && input.expiresAt > now && messagingWindowOpen(input.inboundAt, now)
    && input.latestInboundAt !== null && input.latestInboundAt.getTime() <= input.inboundAt.getTime();
}

export function emailRequestMessage(prompt: string) {
  return `${prompt.trim()}\n\nReply SKIP to receive the link without sharing your email, or STOP to cancel.`;
}
