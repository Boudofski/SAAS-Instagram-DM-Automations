"use server";

import { client } from "@/lib/prisma";
import type { LISTENERS, MATCHING_MODE, MEDIATYPE } from "@prisma/client";

export type CampaignPayload = {
  name: string;
  active: boolean;
  matchingMode: MATCHING_MODE;
  post: {
    postid: string;
    caption?: string;
    media: string;
    mediaType: MEDIATYPE;
  };
  keywords: string[];
  listener: {
    listener: LISTENERS;
    prompt: string;
    commentReply?: string;
    commentReply2?: string;
    commentReply3?: string;
    ctaLink?: string;
    ctaButtonTitle?: string;
  };
};

export const createAutomation = async (clerkId: string, id?: string) => {
  return await client.user.update({
    where: {
      clerkId,
    },
    data: {
      automations: {
        create: {
          ...(id && { id }),
        },
      },
    },
  });
};

export const createCompleteAutomation = async (
  clerkId: string,
  payload: CampaignPayload
) => {
  return await client.user.update({
    where: { clerkId },
    data: {
      automations: {
        create: {
          name: payload.name,
          active: payload.active,
          matchingMode: payload.matchingMode,
          posts: {
            create: payload.post,
          },
          keywords: {
            createMany: {
              data: payload.keywords.map((word) => ({ word })),
              skipDuplicates: true,
            },
          },
          trigger: {
            create: { type: "COMMENT" },
          },
          listener: {
            create: payload.listener,
          },
        },
      },
    },
    select: {
      automations: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true },
      },
    },
  });
};

export const getAutomation = async (clerkId: string) => {
  return await client.user.findUnique({
    where: {
      clerkId,
    },
    select: {
      automations: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          keywords: true,
          listener: true,
        },
      },
    },
  });
};

export const findAutomation = async (id: string) => {
  return await client.automation.findUnique({
    where: {
      id,
    },
    include: {
      keywords: true,
      trigger: true,
      posts: true,
      listener: true,
      User: {
        select: {
          subscription: true,
          integrations: true,
        },
      },
    },
  });
};

export const findAutomationForUser = async (id: string, clerkId: string) => {
  return await client.automation.findFirst({
    where: {
      id,
      User: { clerkId },
    },
    include: {
      keywords: true,
      trigger: true,
      posts: true,
      listener: true,
      User: {
        select: {
          subscription: true,
          integrations: true,
        },
      },
    },
  });
};

export const updateAutomation = async (
  automationId: string,
  update: { name?: string; active?: boolean; matchingMode?: MATCHING_MODE }
) => {
  return await client.automation.update({
    where: { id: automationId },
    data: {
      name: update.name,
      active: update.active,
      matchingMode: update.matchingMode,
    },
  });
};

export const updateCompleteAutomation = async (
  automationId: string,
  clerkId: string,
  payload: CampaignPayload
) => {
  const automation = await client.automation.findFirst({
    where: { id: automationId, User: { clerkId } },
    select: { id: true },
  });

  if (!automation) return null;

  return await client.$transaction(async (tx) => {
    await tx.keyword.deleteMany({ where: { automationId } });
    await tx.post.deleteMany({ where: { automationId } });
    await tx.trigger.deleteMany({ where: { automationId } });
    await tx.listener.deleteMany({ where: { automationId } });

    return tx.automation.update({
      where: { id: automationId },
      data: {
        name: payload.name,
        active: payload.active,
        matchingMode: payload.matchingMode,
        posts: { create: payload.post },
        keywords: {
          createMany: {
            data: payload.keywords.map((word) => ({ word })),
            skipDuplicates: true,
          },
        },
        trigger: { create: { type: "COMMENT" } },
        listener: { create: payload.listener },
      },
      select: { id: true },
    });
  });
};

export const duplicateAutomationQuery = async (
  automationId: string,
  clerkId: string
) => {
  const automation = await findAutomationForUser(automationId, clerkId);
  if (!automation?.listener || !automation.posts[0]) return null;

  const payload: CampaignPayload = {
    name: `${automation.name || "Untitled campaign"} copy`,
    active: false,
    matchingMode: automation.matchingMode,
    post: {
      postid: automation.posts[0].postid,
      caption: automation.posts[0].caption ?? undefined,
      media: automation.posts[0].media,
      mediaType: automation.posts[0].mediaType,
    },
    keywords: automation.keywords.map((keyword) => keyword.word),
    listener: {
      listener: automation.listener.listener,
      prompt: automation.listener.prompt,
      commentReply: automation.listener.commentReply ?? undefined,
      commentReply2: automation.listener.commentReply2 ?? undefined,
      commentReply3: automation.listener.commentReply3 ?? undefined,
      ctaLink: automation.listener.ctaLink ?? undefined,
      ctaButtonTitle: automation.listener.ctaButtonTitle ?? undefined,
    },
  };

  return createCompleteAutomation(clerkId, payload);
};

export const deleteAutomationQuery = async (
  automationId: string,
  clerkId: string
) => {
  return await client.automation.deleteMany({
    where: {
      id: automationId,
      User: { clerkId },
    },
  });
};

export const addListener = async (
  automationId: string,
  listener: "SMARTAI" | "MESSAGE",
  prompt: string,
  reply?: string,
  ctaLink?: string
) => {
  return await client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      listener: {
        create: {
          listener,
          prompt,
          commentReply: reply,
          ctaLink,
        },
      },
    },
  });
};

export const addTrigger = async (automationId: string, trigger: string[]) => {
  if (trigger.length === 2) {
    return await client.automation.update({
      where: {
        id: automationId,
      },
      data: {
        trigger: {
          createMany: {
            data: [{ type: trigger[0] }, { type: trigger[1] }],
          },
        },
      },
    });
  }

  return await client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      trigger: {
        create: {
          type: trigger[0],
        },
      },
    },
  });
};

export const addKeyWords = async (automationId: string, keywords: string) => {
  return await client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      keywords: {
        create: {
          word: keywords,
        },
      },
    },
  });
};

export const deleteKeywordsQuery = async (automationId: string) => {
  return await client.keyword.deleteMany({
    where: { automationId },
  });
};

export const addPosts = async (
  automationId: string,
  posts: {
    postid: string;
    caption?: string;
    media: string;
    mediaType: "IMAGE" | "VIDEO" | "CAROSEL_ALBUM";
  }[]
) => {
  return await client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      posts: {
        createMany: {
          data: posts,
        },
      },
    },
  });
};

export const getAutomationAnalytics = async (automationId: string) => {
  const [
    dmsSent,
    dmsFailed,
    repliesSent,
    repliesFailed,
    leadsCount,
    commentsReceived,
  ] = await Promise.all([
    client.messageLog.count({
      where: { automationId, messageType: "DM", status: "SENT" },
    }),
    client.messageLog.count({
      where: { automationId, messageType: "DM", status: "FAILED" },
    }),
    client.messageLog.count({
      where: { automationId, messageType: "COMMENT_REPLY", status: "SENT" },
    }),
    client.messageLog.count({
      where: { automationId, messageType: "COMMENT_REPLY", status: "FAILED" },
    }),
    client.lead.count({ where: { automationId } }),
    client.automationEvent.count({
      where: { automationId, eventType: "COMMENT_RECEIVED" },
    }),
  ]);

  return {
    commentsReceived,
    dmsSent,
    dmsFailed,
    repliesSent,
    repliesFailed,
    leadsCollected: leadsCount,
  };
};

export const getAutomationActivity = async (automationId: string) => {
  const [events, messageLogs, webhookEvents] = await Promise.all([
    client.automationEvent.findMany({
      where: { automationId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    client.messageLog.findMany({
      where: { automationId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    client.webhookEvent.findMany({
      where: { automationId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return [...events, ...messageLogs, ...webhookEvents]
    .map((item: any) => ({
      id: item.id,
      createdAt: item.createdAt,
      type: item.eventType ?? `${item.messageType}_${item.status}`,
      status: item.status ?? undefined,
      igUserId: item.igUserId ?? item.recipientIgId ?? undefined,
      mediaId: item.mediaId ?? undefined,
      commentId: item.commentId ?? undefined,
      keyword: item.keyword ?? undefined,
      errorMessage: item.errorMessage ?? undefined,
      source: item.messageType ? "message" : item.provider ? "webhook" : "event",
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 30);
};

export const getDashboardActivity = async (clerkId: string) => {
  const user = await client.user.findUnique({
    where: { clerkId },
    select: {
      automations: {
        select: { id: true },
      },
    },
  });

  const automationIds = user?.automations.map((automation) => automation.id) ?? [];
  if (automationIds.length === 0) return [];

  const [events, messageLogs, webhookEvents] = await Promise.all([
    client.automationEvent.findMany({
      where: { automationId: { in: automationIds } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { automation: { select: { name: true } } },
    }),
    client.messageLog.findMany({
      where: { automationId: { in: automationIds } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { automation: { select: { name: true } } },
    }),
    client.webhookEvent.findMany({
      where: { automationId: { in: automationIds } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { automation: { select: { name: true } } },
    }),
  ]);

  return [...events, ...messageLogs, ...webhookEvents]
    .map((item: any) => ({
      id: item.id,
      campaign: item.automation?.name ?? "Campaign",
      createdAt: item.createdAt,
      type: item.eventType ?? `${item.messageType}_${item.status}`,
      status: item.status ?? undefined,
      keyword: item.keyword ?? undefined,
      errorMessage: item.errorMessage ?? undefined,
      source: item.messageType ? "message" : item.provider ? "webhook" : "event",
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 12);
};
