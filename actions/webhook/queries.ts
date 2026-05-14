import { client } from "@/lib/prisma";
import { matchKeywordWithMode } from "@/lib/matching";
import type {
  Automation,
  Keyword,
  Listener,
  Integrations,
  Subscription,
  EVENT_TYPE,
  MESSAGE_TYPE,
  SEND_STATUS,
  Prisma,
} from "@prisma/client";

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

type AutomationWithRelations = Automation & {
  keywords: Keyword[];
  listener: Listener | null;
  User: {
    subscription: Pick<Subscription, "plan"> | null;
    integrations: Pick<Integrations, "token">[];
  } | null;
};

// ---------------------------------------------------------------------------
// Automation lookup — COMMENT trigger
// ---------------------------------------------------------------------------

/**
 * Finds an active automation that:
 * - has a COMMENT trigger
 * - has a Post with postid matching the commented media
 * - belongs to a user whose Instagram account ID matches the webhook entry.id
 */
export const findAutomationForComment = async (
  mediaId: string,
  igAccountId: string
): Promise<AutomationWithRelations | null> => {
  return await client.automation.findFirst({
    where: {
      active: true,
      trigger: { some: { type: "COMMENT" } },
      posts: { some: { postid: mediaId } },
      User: {
        integrations: { some: { instagramId: igAccountId } },
      },
    },
    include: {
      keywords: true,
      listener: true,
      User: {
        select: {
          subscription: { select: { plan: true } },
          integrations: {
            select: { token: true },
            where: { instagramId: igAccountId },
          },
        },
      },
    },
  });
};

// ---------------------------------------------------------------------------
// Automation lookup — DM trigger
// ---------------------------------------------------------------------------

/**
 * Finds the first active automation with a DM trigger that has a keyword
 * matching the DM text, for the given Instagram account.
 */
export const findAutomationForDM = async (
  dmText: string,
  igAccountId: string
): Promise<{ automation: AutomationWithRelations; matchedKeyword: string } | null> => {
  const automations = await client.automation.findMany({
    where: {
      active: true,
      trigger: { some: { type: "DM" } },
      User: {
        integrations: { some: { instagramId: igAccountId } },
      },
    },
    include: {
      keywords: true,
      listener: true,
      User: {
        select: {
          subscription: { select: { plan: true } },
          integrations: {
            select: { token: true },
            where: { instagramId: igAccountId },
          },
        },
      },
    },
  });

  for (const automation of automations) {
    const matched = matchKeywordWithMode(
      dmText,
      automation.keywords,
      automation.matchingMode
    );
    if (matched) return { automation, matchedKeyword: matched };
  }

  return null;
};

// ---------------------------------------------------------------------------
// Automation lookup by ID — used for SMARTAI conversation continuation
// ---------------------------------------------------------------------------

export const findAutomationById = async (id: string) => {
  return await client.automation.findUnique({
    where: { id },
    include: {
      listener: true,
      User: {
        select: {
          subscription: { select: { plan: true } },
          integrations: { select: { token: true } },
        },
      },
    },
  });
};

// ---------------------------------------------------------------------------
// Duplicate prevention
// ---------------------------------------------------------------------------

/**
 * Returns true if a DM has already been successfully sent to this recipient
 * for this automation. One DM per person per campaign, ever.
 */
export const isDuplicate = async (
  automationId: string,
  recipientIgId: string,
  mediaId?: string,
  commentId?: string
): Promise<boolean> => {
  const existing = await client.messageLog.findFirst({
    where: {
      automationId,
      recipientIgId,
      messageType: "DM",
      status: "SENT",
      ...(commentId
        ? { commentId }
        : mediaId
        ? { mediaId }
        : {}),
    },
  });
  return !!existing;
};

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

export const createMessageLog = async (data: {
  automationId: string;
  recipientIgId: string;
  mediaId?: string;
  commentId?: string;
  messageType: MESSAGE_TYPE;
  status: SEND_STATUS;
  errorMessage?: string;
}) => {
  return await client.messageLog.create({
    data: {
      ...data,
      sentAt: data.status === "SENT" ? new Date() : undefined,
    },
  });
};

export const upsertLead = async (data: {
  automationId: string;
  igUserId: string;
  igUsername?: string;
  commentText?: string;
  mediaId?: string;
}) => {
  return await client.lead.upsert({
    where: {
      automationId_igUserId: {
        automationId: data.automationId,
        igUserId: data.igUserId,
      },
    },
    create: data,
    update: {
      igUsername: data.igUsername,
      commentText: data.commentText,
      mediaId: data.mediaId,
    },
  });
};

export const createAutomationEvent = async (data: {
  automationId: string;
  eventType: EVENT_TYPE;
  igUserId?: string;
  mediaId?: string;
  commentId?: string;
  keyword?: string;
  meta?: Prisma.InputJsonObject;
}) => {
  return await client.automationEvent.create({ data });
};

export const createWebhookEvent = async (data: {
  automationId?: string;
  eventType: string;
  field?: string;
  igAccountId?: string;
  igUserId?: string;
  mediaId?: string;
  commentId?: string;
  status?: string;
  errorMessage?: string;
  payload?: Prisma.InputJsonObject;
}) => {
  return await client.webhookEvent.create({
    data: {
      provider: "meta",
      status: "RECEIVED",
      ...data,
    },
  });
};

export const updateWebhookEvent = async (
  id: string,
  data: {
    automationId?: string;
    status?: string;
    errorMessage?: string;
    processedAt?: Date;
  }
) => {
  return await client.webhookEvent.update({
    where: { id },
    data,
  });
};

// ---------------------------------------------------------------------------
// Counter tracking — fast path increments on Listener
// ---------------------------------------------------------------------------

export const trackResponse = async (
  automationId: string,
  type: "COMMENT" | "DM"
) => {
  const field = type === "COMMENT" ? "commentCount" : "dmCount";
  return await client.listener.update({
    where: { automationId },
    data: { [field]: { increment: 1 } },
  });
};

// ---------------------------------------------------------------------------
// SMARTAI chat history (fixed parameter names — original had them swapped)
// pageId        = IG Business Account ID, stored as senderId
// messageText   = the actual message string
// recipientIgId = the IG user who sent or received this message
// ---------------------------------------------------------------------------

export const createChatHistory = (
  automationId: string,
  pageId: string,
  messageText: string,
  recipientIgId: string
) => {
  return client.automation.update({
    where: { id: automationId },
    data: {
      dms: {
        create: {
          senderId: pageId,
          message: messageText,
          reciever: recipientIgId,
        },
      },
    },
  });
};

export const getChatHistory = async (pageId: string, recipientIgId: string) => {
  const history = await client.dms.findMany({
    where: {
      AND: [{ senderId: pageId }, { reciever: recipientIgId }],
    },
    orderBy: { createdAt: "asc" },
  });

  const chatSession: { role: "assistant" | "user"; content: string }[] =
    history.map((chat) => ({
      role: chat.reciever ? "assistant" : "user",
      content: chat.message!,
    }));

  return {
    history: chatSession,
    automationId: history[history.length - 1]?.automationId ?? null,
  };
};
