"use server";

import { client } from "@/lib/prisma";
import type { MATCHING_MODE } from "@prisma/client";

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
