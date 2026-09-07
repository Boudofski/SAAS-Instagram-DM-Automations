"use server";

import { onCurrentUser } from "@/actions/user";
import { findUser } from "@/actions/user/queries";
import { generateAiSupportReply } from "@/lib/ai-reply";
import { client } from "@/lib/prisma";

async function supportProfile() {
  const clerk = await onCurrentUser();
  const profile = await findUser(clerk.id);
  if (!profile?.id) throw new Error("AP3K account not found.");
  return profile;
}

export async function getSupportHistoryAction() {
  try {
    const profile = await supportProfile();
    const messages = await client.aiChatMessage.findMany({
      where: { userId: profile.id, context: "SUPPORT" },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: { id: true, role: true, content: true, createdAt: true },
    });
    return { status: 200 as const, messages: messages.reverse() };
  } catch {
    return { status: 401 as const, messages: [] };
  }
}

export async function askSupportAssistantAction(message: string) {
  try {
    const profile = await supportProfile();
    const prompt = message.trim().slice(0, 1200);
    if (!prompt) return { status: 400 as const, data: "Write a question first." };

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const dailyMessages = await client.aiChatMessage.count({
      where: { userId: profile.id, context: "SUPPORT", role: "user", createdAt: { gte: startOfDay } },
    });
    if (dailyMessages >= 25) return { status: 429 as const, data: "You have reached today's support-assistant limit. Email support@ap3k.com for more help." };

    const history = await client.aiChatMessage.findMany({
      where: { userId: profile.id, context: "SUPPORT" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { role: true, content: true },
    });
    const userMessage = await client.aiChatMessage.create({
      data: { userId: profile.id, context: "SUPPORT", role: "user", content: prompt },
      select: { id: true, role: true, content: true, createdAt: true },
    });
    const result = await generateAiSupportReply({
      message: prompt,
      history: history.reverse().map((item) => ({ role: item.role === "assistant" ? "assistant" : "user", content: item.content })),
    });
    if (!result.ok) return { status: 503 as const, data: "The support assistant is unavailable. Please use the Knowledge base or email support@ap3k.com.", userMessage };
    const assistantMessage = await client.aiChatMessage.create({
      data: { userId: profile.id, context: "SUPPORT", role: "assistant", content: result.reply },
      select: { id: true, role: true, content: true, createdAt: true },
    });
    return { status: 200 as const, data: result.reply, userMessage, assistantMessage };
  } catch {
    return { status: 503 as const, data: "Support is unavailable right now. Email support@ap3k.com." };
  }
}

export async function clearSupportHistoryAction() {
  try {
    const profile = await supportProfile();
    await client.aiChatMessage.deleteMany({ where: { userId: profile.id, context: "SUPPORT" } });
    return { status: 200 as const };
  } catch {
    return { status: 400 as const };
  }
}
