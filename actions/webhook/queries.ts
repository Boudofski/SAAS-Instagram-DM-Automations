import { client } from "@/lib/prisma";
import { matchKeywordWithMode, normalizeMatchText, resolveCommentTriggerMatch } from "@/lib/matching";
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
  posts?: { postid: string; media?: string | null; caption?: string | null; mediaType?: string | null }[];
  User: {
    subscription: Pick<Subscription, "plan"> | null;
    integrations: Pick<
      Integrations,
      "id" | "token" | "instagramId" | "pageId" | "webhookAccountId" | "businessId" | "instagramUsername" | "status" | "reconnectRequired"
    >[];
  } | null;
};

export function normalizeInstagramMediaId(value?: string | null) {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  if (trimmed === "ANY") return "ANY";

  try {
    const parsed = new URL(trimmed);
    const lastSegment = parsed.pathname
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean)
      .at(-1);
    return lastSegment ?? trimmed;
  } catch {
    return trimmed;
  }
}

// ---------------------------------------------------------------------------
// Automation lookup — COMMENT trigger
// ---------------------------------------------------------------------------

/**
 * Finds an active automation that:
 * - has a COMMENT trigger
 * - has a Post with postid matching the commented media
 * - belongs to a user whose connected Page ID matches the webhook entry.id
 */
export const findAutomationForComment = async (
  mediaId: string,
  pageId: string
): Promise<AutomationWithRelations | null> => {
  return await client.automation.findFirst({
    where: {
      active: true,
      archivedAt: null,
      trigger: { some: { type: "COMMENT" } },
      posts: { some: { postid: { in: [mediaId, "ANY"] } } },
      User: {
        status: { not: "SUSPENDED" },
        integrations: { some: { pageId, status: { not: "DISCONNECTED" }, reconnectRequired: false } },
      },
    },
    include: {
      posts: true,
      keywords: true,
      listener: true,
      User: {
        select: {
          subscription: { select: { plan: true } },
          integrations: {
            select: {
              id: true,
              token: true,
              instagramId: true,
              pageId: true,
              webhookAccountId: true,
              businessId: true,
              instagramUsername: true,
              status: true,
              reconnectRequired: true,
            },
          },
        },
      },
    },
  });
};

export const findAutomationForCommentWithReason = async (
  mediaId: string,
  pageId: string,
  options: {
    object?: string;
    igAccountId?: string | null;
    commentText?: string;
  } = {}
): Promise<{
  automation: AutomationWithRelations | null;
  automations: AutomationWithRelations[];
  failureReason?: "no_matching_integration" | "no_active_automation_for_media" | "keyword_mismatch" | "ambiguous";
  diagnostics: Prisma.InputJsonObject;
}> => {
  const normalizedIncomingMediaId = normalizeInstagramMediaId(mediaId);
  const incomingAccountIds = Array.from(new Set(
    [pageId, options.igAccountId]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
  ));
  const allowPageIdMatch = options.object !== "instagram";
  const candidateFieldChecks = [
    "instagramId",
    "webhookAccountId",
    "valueIgAccountId",
    ...(allowPageIdMatch ? ["pageId"] : []),
    "businessId",
  ];
  const activeIntegrations = await client.integrations.findMany({
    where: {
      User: {
        status: { not: "SUSPENDED" },
        automations: { some: { active: true, archivedAt: null } },
      },
      status: { not: "DISCONNECTED" },
      reconnectRequired: false,
    },
    select: {
      id: true,
      instagramId: true,
      webhookAccountId: true,
      pageId: true,
      businessId: true,
      instagramUsername: true,
      status: true,
      reconnectRequired: true,
    },
  });
  // Match by any known ID field — entry.id is IG Business ID for object=instagram,
  // or Page ID for object=page. Try all stored ID fields to handle both shapes.
  const matchingIntegrations = await client.integrations.findMany({
    where: {
      OR: [
        { instagramId: { in: incomingAccountIds } },
        { webhookAccountId: { in: incomingAccountIds } },
        { businessId: { in: incomingAccountIds } },
        ...(allowPageIdMatch ? [{ pageId: { in: incomingAccountIds } }] : []),
      ],
      status: { not: "DISCONNECTED" },
      reconnectRequired: false,
      User: { status: { not: "SUSPENDED" } },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      instagramId: true,
      webhookAccountId: true,
      pageId: true,
      businessId: true,
      instagramUsername: true,
      status: true,
      reconnectRequired: true,
    },
  });

  if (matchingIntegrations.length === 0 || !matchingIntegrations.some((item) => item.userId)) {
    return {
      automation: null,
      automations: [],
      failureReason: "no_matching_integration",
      diagnostics: {
        incomingMediaId: mediaId,
        normalizedIncomingMediaId,
        incomingPageId: pageId,
        incomingAccountIds,
        object: options.object,
        candidateIntegrationCount: 0,
        candidateFieldsChecked: candidateFieldChecks,
        allActiveIntegrationInstagramIds: activeIntegrations.map((item) => item.instagramId).filter(Boolean),
        allActiveIntegrationWebhookAccountIds: activeIntegrations.map((item) => item.webhookAccountId).filter(Boolean),
        allActiveIntegrationPageIds: activeIntegrations.map((item) => item.pageId).filter(Boolean),
        maskedStoredIntegrationIds: activeIntegrations.map((item) => ({
          id: maskId(item.id),
          instagramId: maskId(item.instagramId),
          webhookAccountId: maskId(item.webhookAccountId),
          pageId: maskId(item.pageId),
        })),
        reason: "no_integration_for_incoming_account_ids",
        matchingIntegrationFound: false,
        matchedAutomationIds: [],
        storedPostIds: [],
        comparisons: [],
      },
    };
  }

  await Promise.all(
    matchingIntegrations
      .filter((integration) => !integration.webhookAccountId || integration.webhookAccountId !== pageId)
      .map((integration) =>
        client.integrations.update({
          where: { id: integration.id },
          data: { webhookAccountId: pageId },
        })
      )
  );

  const ownerIntegrations = Array.from(
    matchingIntegrations
      .filter((integration) => integration.userId)
      .reduce((map, integration) => {
        if (integration.userId && !map.has(integration.userId)) map.set(integration.userId, integration);
        return map;
      }, new Map<string, (typeof matchingIntegrations)[number]>())
      .values()
  );

  const accountAutomationsByIntegration = await Promise.all(
    ownerIntegrations
      .map(async (integration) => ({
        integration,
        automations: await client.automation.findMany({
          where: {
            userId: integration.userId,
            archivedAt: null,
            trigger: { some: { type: "COMMENT" } },
          },
          orderBy: { createdAt: "desc" },
          include: {
            posts: true,
            keywords: true,
            listener: true,
            User: {
              select: {
                subscription: { select: { plan: true } },
                integrations: {
                  select: {
                    id: true,
                    token: true,
                    instagramId: true,
                    pageId: true,
                    webhookAccountId: true,
                    businessId: true,
                    instagramUsername: true,
                    status: true,
                    reconnectRequired: true,
                  },
                },
              },
            },
          },
        }),
      }))
  );

  const accountAutomations = accountAutomationsByIntegration.flatMap((item) =>
    item.automations.map((automation) => ({ automation, integration: item.integration }))
  );

  const activeAutomations = accountAutomations.filter((item) => item.automation.active);
  const comparisons = accountAutomations.flatMap(({ automation, integration }) => {
    const posts = automation.posts.length > 0 ? automation.posts : [{ postid: "" }];
    return posts.map((post) => {
      const normalizedStoredPostId = normalizeInstagramMediaId(post.postid);
      const isAnyPost = post.postid === "ANY" || normalizedStoredPostId === "ANY";
      const postMatched = isAnyPost || normalizedStoredPostId === normalizedIncomingMediaId;
      const triggerMatched = options.commentText
        ? resolveCommentTriggerMatch({
            text: options.commentText,
            keywords: automation.keywords,
            mode: automation.matchingMode,
            triggerMode: automation.triggerMode,
          })
        : "not_evaluated";
      return {
        integrationId: integration.id,
        integrationUserId: integration.userId,
        automationId: automation.id,
        automationName: automation.name,
        automationActive: automation.active,
        triggerMode: automation.triggerMode,
        matchingMode: automation.matchingMode,
        storedKeywords: automation.keywords.map((keyword) => keyword.word),
        normalizedKeywords: automation.keywords.map((keyword) => normalizeMatchText(keyword.word)),
        storedPostId: post.postid,
        normalizedStoredPostId,
        incomingMediaId: mediaId,
        normalizedIncomingMediaId,
        isAnyPost,
        postMatched,
        triggerMatched,
        normalizedMatch: postMatched,
      };
    });
  });
  const rankedMatches = activeAutomations.flatMap((item) => {
    const triggerMatched = options.commentText
      ? resolveCommentTriggerMatch({
          text: options.commentText,
          keywords: item.automation.keywords,
          mode: item.automation.matchingMode,
          triggerMode: item.automation.triggerMode,
        })
      : "not_evaluated";

    return item.automation.posts
      .map((post) => {
        const normalizedStoredPostId = normalizeInstagramMediaId(post.postid);
        const exactPost = normalizedStoredPostId === normalizedIncomingMediaId;
        const anyPost = post.postid === "ANY" || normalizedStoredPostId === "ANY";
        const postMatched = exactPost || anyPost;
        const anyComment = item.automation.triggerMode === "ANY_COMMENT";
        const triggerOk = options.commentText ? Boolean(triggerMatched) : true;
        if (!postMatched || !triggerOk) return null;
        const score =
          exactPost && !anyComment ? 40 :
          exactPost && anyComment ? 30 :
          anyPost && !anyComment ? 20 :
          10;
        return {
          ...item,
          post,
          exactPost,
          anyPost,
          triggerMatched,
          score,
        };
      })
      .filter(Boolean);
  }) as Array<{
    automation: AutomationWithRelations;
    integration: (typeof matchingIntegrations)[number];
    post: { postid: string };
    exactPost: boolean;
    anyPost: boolean;
    triggerMatched: string;
    score: number;
  }>;

  const bestScore = rankedMatches[0]
    ? Math.max(...rankedMatches.map((item) => item.score))
    : 0;
  const bestMatches = rankedMatches.filter((item) => item.score === bestScore);
  const selectedMatch = bestMatches.length === 1 ? bestMatches[0] : null;
  const matchedAutomations = selectedMatch
    ? [selectedMatch.automation]
    : rankedMatches.map((item) => item.automation);
  const matchedIntegration = selectedMatch?.integration ?? matchingIntegrations[0];

  const diagnostics = {
    incomingMediaId: mediaId,
    normalizedIncomingMediaId,
    incomingPageId: pageId,
    incomingAccountIds,
    object: options.object,
    candidateIntegrationCount: matchingIntegrations.length,
    candidateFieldsChecked: candidateFieldChecks,
    allActiveIntegrationInstagramIds: activeIntegrations.map((item) => item.instagramId).filter(Boolean),
    allActiveIntegrationWebhookAccountIds: activeIntegrations.map((item) => item.webhookAccountId).filter(Boolean),
    matchingIntegrationIds: matchingIntegrations.map((item) => item.id),
    matchingIntegrationFound: true,
    matchedIntegrationId: matchedIntegration?.id,
    matchedIntegrationInstagramId: matchedIntegration?.instagramId,
    matchedIntegrationWebhookAccountId: matchedIntegration?.webhookAccountId ?? pageId,
    matchedIntegrationUsername: matchedIntegration?.instagramUsername,
    matchedIntegrationOwnerUserId: matchedIntegration?.userId,
    matchedAutomationIds: comparisons
      .filter((item) => item.automationActive && item.postMatched && item.triggerMatched)
      .map((item) => item.automationId),
    matchedAutomationCount: matchedAutomations.length,
    selectedAutomationId: selectedMatch?.automation.id,
    selectedIntegrationId: selectedMatch?.integration.id,
    ambiguous: bestMatches.length > 1,
    activeAutomationCount: activeAutomations.length,
    postMatchDiagnostics: comparisons.map((item) => ({
      integrationId: item.integrationId,
      ownerUserId: item.integrationUserId,
      automationId: item.automationId,
      storedPostId: item.storedPostId,
      normalizedStoredPostId: item.normalizedStoredPostId,
      isAnyPost: item.isAnyPost,
      postMatched: item.postMatched,
    })),
    triggerMatchDiagnostics: comparisons.map((item) => ({
      integrationId: item.integrationId,
      ownerUserId: item.integrationUserId,
      automationId: item.automationId,
      triggerMode: item.triggerMode,
      matchingMode: item.matchingMode,
      matchedKeyword: item.triggerMatched,
    })),
    storedPostIds: comparisons.map((item) => item.storedPostId),
    comparisons,
  };

  if (activeAutomations.length === 0) {
    return {
      automation: null,
      automations: [],
      failureReason: "no_active_automation_for_media",
      diagnostics,
    };
  }

  if (bestMatches.length > 1) {
    return {
      automation: null,
      automations: [],
      failureReason: "ambiguous",
      diagnostics,
    };
  }

  if (!selectedMatch) {
    const anyPostMatched = comparisons.some((item) => item.automationActive && item.postMatched);
    const reason = anyPostMatched ? "keyword_mismatch" : "no_active_automation_for_media";
    return {
      automation: null,
      automations: [],
      failureReason: reason,
      diagnostics,
    };
  }

  return { automation: selectedMatch.automation, automations: [selectedMatch.automation], diagnostics };
};

function maskId(value?: string | null) {
  if (!value) return null;
  const text = String(value);
  if (text.length <= 8) return text;
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Automation lookup — DM trigger
// ---------------------------------------------------------------------------

/**
 * Finds the first active automation with a DM trigger that has a keyword
 * matching the DM text, for the given Instagram account.
 */
export const findAutomationForDM = async (
  dmText: string,
  pageId: string
): Promise<{ automation: AutomationWithRelations; matchedKeyword: string } | null> => {
  const automations = await client.automation.findMany({
    where: {
      active: true,
      archivedAt: null,
      trigger: { some: { type: "DM" } },
      User: {
        status: { not: "SUSPENDED" },
        integrations: { some: { pageId, status: { not: "DISCONNECTED" }, reconnectRequired: false } },
      },
    },
    include: {
      keywords: true,
      listener: true,
      User: {
        select: {
          subscription: { select: { plan: true } },
          integrations: {
            select: {
              id: true,
              token: true,
              instagramId: true,
              pageId: true,
              webhookAccountId: true,
              businessId: true,
              instagramUsername: true,
              status: true,
              reconnectRequired: true,
            },
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
  return await client.automation.findFirst({
    where: { id, archivedAt: null },
    include: {
      listener: true,
      User: {
        select: {
          subscription: { select: { plan: true } },
          integrations: {
            select: {
              id: true,
              token: true,
              instagramId: true,
              pageId: true,
              webhookAccountId: true,
              businessId: true,
              status: true,
              reconnectRequired: true,
            },
          },
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

export const hasProcessedCommentWebhook = async (
  automationId: string,
  commentId: string,
  currentWebhookEventId?: string
) => {
  const [event, messageLog, webhookEvent] = await Promise.all([
    client.automationEvent.findFirst({
      where: {
        automationId,
        commentId,
        eventType: {
          in: [
            "COMMENT_RECEIVED",
            "KEYWORD_MATCHED",
            "DM_SENT",
            "DM_SKIPPED",
            "PUBLIC_REPLY_SENT",
            "PUBLIC_REPLY_FAILED",
            "DM_FAILED",
            "DUPLICATE_SKIPPED",
          ],
        },
      },
      select: { id: true },
    }),
    client.messageLog.findFirst({
      where: { automationId, commentId },
      select: { id: true },
    }),
    client.webhookEvent.findFirst({
      where: {
        automationId,
        commentId,
        ...(currentWebhookEventId ? { id: { not: currentWebhookEventId } } : {}),
        status: { in: ["PROCESSED", "IGNORED", "FAILED"] },
      },
      select: { id: true },
    }),
  ]);

  return Boolean(event || messageLog || webhookEvent);
};

export const hasAp3kGeneratedCommentId = async (
  automationId: string,
  commentId: string
) => {
  const event = await client.automationEvent.findFirst({
    where: {
      automationId,
      commentId,
      eventType: "PUBLIC_REPLY_SENT",
    },
    select: { id: true },
  });

  return Boolean(event);
};

export const hasRecentAp3kReplyTextMatch = async (data: {
  automationId: string;
  mediaId: string;
  normalizedText: string;
  textHash: string;
  since: Date;
}) => {
  const recentEvents = await client.automationEvent.findMany({
    where: {
      automationId: data.automationId,
      mediaId: data.mediaId,
      eventType: "PUBLIC_REPLY_SENT",
      createdAt: { gte: data.since },
    },
    select: { meta: true },
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  return recentEvents.some((event) => {
    const meta = event.meta && typeof event.meta === "object" && !Array.isArray(event.meta)
      ? (event.meta as Record<string, unknown>)
      : {};
    return (
      meta.publicReplyTextHash === data.textHash ||
      meta.normalizedPublicReplyText === data.normalizedText
    );
  });
};

export const countRecentPublicReplies = async (data: {
  automationId: string;
  mediaId?: string;
  since: Date;
}) => {
  return await client.messageLog.count({
    where: {
      automationId: data.automationId,
      messageType: "COMMENT_REPLY",
      status: "SENT",
      createdAt: { gte: data.since },
      ...(data.mediaId ? { mediaId: data.mediaId } : {}),
    },
  });
};

export const hasRecentHandledCommenter = async (data: {
  automationId: string;
  commenterId: string;
  mediaId: string;
  since: Date;
}) => {
  const existing = await client.messageLog.findFirst({
    where: {
      automationId: data.automationId,
      recipientIgId: data.commenterId,
      mediaId: data.mediaId,
      status: "SENT",
      createdAt: { gte: data.since },
      messageType: { in: ["COMMENT_REPLY", "DM"] },
    },
    select: { id: true },
  });

  return Boolean(existing);
};

export const countLoopGuardEvents = async (automationId: string, since: Date) => {
  return await client.automationEvent.count({
    where: {
      automationId,
      eventType: "LOOP_GUARD_TRIGGERED",
      createdAt: { gte: since },
    },
  });
};

export const countRecentSelfCommentSkips = async (automationId: string, since: Date) => {
  return await client.automationEvent.count({
    where: {
      automationId,
      eventType: "SELF_COMMENT_SKIPPED",
      createdAt: { gte: since },
    },
  });
};

export const pauseAutomationForLoopGuard = async (automationId: string) => {
  return await client.automation.update({
    where: { id: automationId },
    data: { active: false },
  });
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
  eventSource?: "META_REAL" | "SIMULATED_INTERNAL";
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
    eventType?: string;
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

export const mergeWebhookEventPayload = async (
  id: string,
  payload: Prisma.InputJsonObject
) => {
  const existing = await client.webhookEvent.findUnique({
    where: { id },
    select: { payload: true },
  });

  const existingPayload =
    existing?.payload && typeof existing.payload === "object" && !Array.isArray(existing.payload)
      ? (existing.payload as Prisma.InputJsonObject)
      : {};

  return await client.webhookEvent.update({
    where: { id },
    data: {
      payload: {
        ...existingPayload,
        ...payload,
      },
    },
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
