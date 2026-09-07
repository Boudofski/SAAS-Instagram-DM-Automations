"use server";

import { onCurrentUser } from "@/actions/user";
import { findUser } from "@/actions/user/queries";
import { reserveAiReplyQuota, completeAiReplyReservation, releaseAiReplyReservation } from "@/actions/usage/queries";
import { generateAiDmReply } from "@/lib/ai-reply";
import { normalizeAiProtectionRules, normalizeAiReplyTone } from "@/lib/ai-reply-config";
import { DEFAULT_AI_GUARDRAILS, DEFAULT_AI_ROLE, DEFAULT_AI_VOICE, normalizeAiWorkspace, normalizeKnowledge } from "@/lib/ai-workspace";
import { client } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function currentProfile() {
  const clerk = await onCurrentUser();
  const profile = await findUser(clerk.id);
  if (!profile?.id) throw new Error("AP3K account not found.");
  return profile;
}

function hasAiPlan(plan?: string | null) {
  return plan === "PRO" || plan === "BUSINESS";
}

export async function getAiWorkspace() {
  const profile = await currentProfile();
  const workspace = await client.aiWorkspaceConfig.findUnique({ where: { userId: profile.id } });
  return {
    profile: normalizeAiWorkspace(workspace),
    plan: profile.subscription?.plan ?? "FREE",
  };
}

export async function saveAiWorkspaceAction(formData: FormData) {
  try {
    const profile = await currentProfile();
    if (!hasAiPlan(profile.subscription?.plan)) {
      return { status: 403 as const, data: "AP3K AI is available on Pro and Business plans." };
    }

    const existing = await client.aiWorkspaceConfig.findUnique({ where: { userId: profile.id } });
    const current = normalizeAiWorkspace(existing);
    const next = {
      aiRepliesEnabled: formData.get("aiRepliesEnabled") === "true",
      aiCommentsEnabled: formData.get("aiCommentsEnabled") === "true",
      role: String(formData.get("role") ?? DEFAULT_AI_ROLE).trim().slice(0, 120) || DEFAULT_AI_ROLE,
      brandVoice: String(formData.get("brandVoice") ?? DEFAULT_AI_VOICE).trim().slice(0, 1600) || DEFAULT_AI_VOICE,
      guardrails: String(formData.get("guardrails") ?? DEFAULT_AI_GUARDRAILS).trim().slice(0, 2400) || DEFAULT_AI_GUARDRAILS,
      defaultTone: normalizeAiReplyTone(String(formData.get("defaultTone") ?? "FRIENDLY")),
      protectionRules: normalizeAiProtectionRules(JSON.parse(String(formData.get("protectionRules") ?? "{}"))),
      knowledge: current.knowledge,
    };

    await client.aiWorkspaceConfig.upsert({
      where: { userId: profile.id },
      create: { userId: profile.id, ...next },
      update: next,
    });
    revalidatePath(`/dashboard/${profile.clerkId}/ai`);
    return { status: 200 as const, data: "AP3K AI settings saved." };
  } catch (error) {
    return { status: 400 as const, data: error instanceof Error ? error.message : "Could not save AP3K AI settings." };
  }
}

export async function addAiKnowledgeAction(formData: FormData) {
  try {
    const profile = await currentProfile();
    if (!hasAiPlan(profile.subscription?.plan)) return { status: 403 as const, data: "Upgrade to Pro to add AI knowledge." };
    const title = String(formData.get("title") ?? "").trim().slice(0, 80);
    const content = String(formData.get("content") ?? "").trim().slice(0, 5000);
    if (!title || !content) return { status: 400 as const, data: "Add a title and the facts AI may use." };
    const existing = await client.aiWorkspaceConfig.findUnique({ where: { userId: profile.id } });
    const current = normalizeAiWorkspace(existing);
    if (current.knowledge.length >= 12) return { status: 400 as const, data: "You can save up to 12 focused knowledge notes." };
    const knowledge = normalizeKnowledge([...current.knowledge, { id: crypto.randomUUID(), title, content }]);
    await client.aiWorkspaceConfig.upsert({
      where: { userId: profile.id },
      create: { userId: profile.id, knowledge },
      update: { knowledge },
    });
    revalidatePath(`/dashboard/${profile.clerkId}/ai`);
    return { status: 200 as const, data: "Knowledge added.", knowledge };
  } catch (error) {
    return { status: 400 as const, data: error instanceof Error ? error.message : "Could not add knowledge." };
  }
}

export async function deleteAiKnowledgeAction(id: string) {
  try {
    const profile = await currentProfile();
    if (!hasAiPlan(profile.subscription?.plan)) {
      return { status: 403 as const, data: "AP3K AI is available on Pro and Business plans.", knowledge: [] };
    }
    const existing = await client.aiWorkspaceConfig.findUnique({ where: { userId: profile.id } });
    const knowledge = normalizeAiWorkspace(existing).knowledge.filter((item) => item.id !== id);
    await client.aiWorkspaceConfig.updateMany({ where: { userId: profile.id }, data: { knowledge } });
    revalidatePath(`/dashboard/${profile.clerkId}/ai`);
    return { status: 200 as const, data: "Knowledge removed.", knowledge };
  } catch {
    return { status: 400 as const, data: "Could not remove knowledge." };
  }
}

export async function testAiWorkspaceAction(message: string) {
  try {
    const profile = await currentProfile();
    if (!hasAiPlan(profile.subscription?.plan)) return { status: 403 as const, data: "AP3K AI is available on Pro and Business plans." };
    const prompt = message.trim().slice(0, 1000);
    if (!prompt) return { status: 400 as const, data: "Write a message to test." };
    const workspace = normalizeAiWorkspace(await client.aiWorkspaceConfig.findUnique({ where: { userId: profile.id } }));
    const quota = await reserveAiReplyQuota({ userId: profile.id, channel: "PLAYGROUND" });
    if (!quota.ok) return { status: 429 as const, data: "Your monthly AI reply limit has been reached." };
    const result = await generateAiDmReply({ message: prompt, workspace });
    if (!result.ok) {
      await releaseAiReplyReservation(quota.reservationId);
      return { status: 503 as const, data: "The AI provider is unavailable. Check the Admin provider connection." };
    }
    await completeAiReplyReservation(quota.reservationId, { channel: "PLAYGROUND", outcome: "generated" });
    return { status: 200 as const, data: result.reply };
  } catch (error) {
    return { status: 400 as const, data: error instanceof Error ? error.message : "Could not test AP3K AI." };
  }
}
