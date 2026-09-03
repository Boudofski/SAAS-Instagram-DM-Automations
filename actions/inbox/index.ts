"use server";

import { onCurrentUser } from "@/actions/user";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";
import { sendInstagramDirectResponse } from "@/lib/instagram-dm";
import { client } from "@/lib/prisma";
import { resolveIntegrationSendToken } from "@/lib/send-token";

async function currentProfile() {
  const clerk = await onCurrentUser();
  return client.user.findUnique({
    where: { clerkId: clerk.id },
    select: {
      id: true,
      integrations: true,
    },
  });
}

export async function getInboxConversations() {
  const profile = await currentProfile();
  if (!profile) return { status: 404, data: [] };
  const conversations = await client.conversation.findMany({
    where: { userId: profile.id },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: {
      automation: { select: { id: true, name: true, source: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  return { status: 200, data: conversations };
}

export async function getInboxMessages(conversationId: string) {
  const profile = await currentProfile();
  if (!profile) return { status: 404, data: [] };
  const conversation = await client.conversation.findFirst({
    where: { id: conversationId, userId: profile.id },
    select: { id: true },
  });
  if (!conversation) return { status: 404, data: [] };
  const messages = await client.inboxMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 300,
  });
  await client.conversation.update({ where: { id: conversation.id }, data: { unreadCount: 0 } });
  return { status: 200, data: messages };
}

export async function markConversationRead(conversationId: string) {
  const profile = await currentProfile();
  if (!profile) return { status: 404 };
  const updated = await client.conversation.updateMany({
    where: { id: conversationId, userId: profile.id },
    data: { unreadCount: 0 },
  });
  return { status: updated.count ? 200 : 404 };
}

export async function sendInboxReply(conversationId: string, rawMessage: string) {
  const message = rawMessage.trim().slice(0, 1000);
  if (!message) return { status: 400, data: "Write a message first." };
  const profile = await currentProfile();
  if (!profile) return { status: 404, data: "Account not found." };
  const conversation = await client.conversation.findFirst({
    where: { id: conversationId, userId: profile.id },
  });
  if (!conversation) return { status: 404, data: "Conversation not found." };
  if (!conversation.lastInboundAt || Date.now() - conversation.lastInboundAt.getTime() > 24 * 60 * 60 * 1000) {
    return { status: 403, data: "This conversation is outside Instagram's 24-hour reply window." };
  }

  const integration = getCanonicalInstagramIntegration(profile.integrations);
  const token = resolveIntegrationSendToken(integration);
  if (!integration?.instagramId || !token.ok) {
    return { status: 403, data: "Reconnect Instagram before replying." };
  }
  const sent = await sendInstagramDirectResponse({
    token: token.token,
    igBusinessAccountId: integration.instagramId,
    recipientId: conversation.recipientIgId,
    automationId: conversation.automationId ?? conversation.id,
    message,
    responseFormat: "TEXT",
  });
  if (!sent.ok) return { status: 502, data: sent.metaError.message ?? "Instagram could not send the message." };

  await client.$transaction([
    client.inboxMessage.create({
      data: {
        conversationId: conversation.id,
        metaMessageId: sent.messageIds[0] || undefined,
        senderIgId: integration.instagramId,
        direction: "OUTBOUND",
        content: message,
        status: "SENT",
      },
    }),
    client.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    }),
  ]);
  return { status: 200, data: "Message sent." };
}
