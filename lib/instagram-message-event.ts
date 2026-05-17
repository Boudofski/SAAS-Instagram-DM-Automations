// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ParsedMessagingData = {
  senderId: string;
  recipientId?: string;
  messageText?: string;
  messageMid?: string;
  messageTimestamp?: number;
  postback?: { payload?: string; title?: string };
  isEcho: boolean;
};

export type MessagingDiagnostics = {
  hasSenderId: boolean;
  hasRecipientId: boolean;
  hasMessageText: boolean;
  hasMessageMid: boolean;
  hasTimestamp: boolean;
  hasPostback: boolean;
  isEcho: boolean;
};

export type MessagingParseResult =
  | { ok: true; data: ParsedMessagingData; diagnostics: MessagingDiagnostics }
  | { ok: false; reason: string; diagnostics: MessagingDiagnostics };

const EMPTY_DIAGNOSTICS: MessagingDiagnostics = {
  hasSenderId: false,
  hasRecipientId: false,
  hasMessageText: false,
  hasMessageMid: false,
  hasTimestamp: false,
  hasPostback: false,
  isEcho: false,
};

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parses a single entry from entry.messaging[] into structured, typed data.
 *
 * Instagram inbound DM webhooks arrive in entry.messaging (not entry.changes).
 * The shape is:
 *   { sender: { id }, recipient: { id }, message: { mid, text, is_echo }, timestamp }
 *   or for postbacks:
 *   { sender: { id }, recipient: { id }, postback: { payload, title }, timestamp }
 *
 * Returns ok:false with a reason string when the item cannot be used.
 * Never throws — all field access is defensive.
 */
export function parseMessagingItem(item: unknown): MessagingParseResult {
  if (!item || typeof item !== "object") {
    return { ok: false, reason: "messaging_item_not_object", diagnostics: EMPTY_DIAGNOSTICS };
  }

  const m = item as Record<string, any>;

  const senderId = m.sender?.id ? String(m.sender.id) : undefined;
  const recipientId = m.recipient?.id ? String(m.recipient.id) : undefined;
  const messageText = typeof m.message?.text === "string" ? m.message.text : undefined;
  const messageMid = typeof m.message?.mid === "string" ? m.message.mid : undefined;
  const messageTimestamp = typeof m.timestamp === "number" ? m.timestamp : undefined;
  const isEcho = Boolean(m.message?.is_echo);
  const postback =
    m.postback && typeof m.postback === "object"
      ? {
          payload: typeof m.postback.payload === "string" ? m.postback.payload : undefined,
          title: typeof m.postback.title === "string" ? m.postback.title : undefined,
        }
      : undefined;

  const diagnostics: MessagingDiagnostics = {
    hasSenderId: Boolean(senderId),
    hasRecipientId: Boolean(recipientId),
    hasMessageText: Boolean(messageText),
    hasMessageMid: Boolean(messageMid),
    hasTimestamp: messageTimestamp !== undefined,
    hasPostback: Boolean(postback),
    isEcho,
  };

  if (!senderId) {
    return { ok: false, reason: "missing_sender_id", diagnostics };
  }

  return {
    ok: true,
    data: { senderId, recipientId, messageText, messageMid, messageTimestamp, postback, isEcho },
    diagnostics,
  };
}

// ---------------------------------------------------------------------------
// Error reason constants — used in webhook route and admin queries
// ---------------------------------------------------------------------------

export const INBOUND_MESSAGE_NO_AUTOMATION = "inbound_message_received_no_dm_automation" as const;
export const INBOUND_MESSAGE_ECHO_SKIPPED = "echo_message_skipped" as const;
