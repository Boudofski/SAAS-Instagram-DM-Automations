"use server";

import { createAdminAuditLog, requireAdminAction } from "@/actions/admin/safe-actions";
import { aiProviderEncryptionReady, decryptAiProviderSecret, encryptAiProviderSecret } from "@/lib/ai-provider-crypto";
import { testAiProvider } from "@/lib/ai-reply";
import { client } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "AI provider request failed.";
  return message
    .replace(/(?:sk|key|token)-[A-Za-z0-9_-]{8,}/gi, "[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, "Bearer [redacted]");
}

function safeProviderUrl(value: string) {
  const parsed = new URL(value);
  if (parsed.protocol !== "https:") throw new Error("Provider base URL must use HTTPS.");
  return parsed.toString().replace(/\/+$/, "");
}

export async function saveAiProviderAction(formData: FormData) {
  const admin = await requireAdminAction();
  const enabled = formData.get("enabled") === "true";
  const providerName = String(formData.get("providerName") ?? "AgentRouter").trim().slice(0, 60) || "AgentRouter";
  const rawBaseUrl = String(formData.get("baseUrl") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim().slice(0, 120);
  const apiKey = String(formData.get("apiKey") ?? "").trim();
  const before = await client.aiProviderConfig.findUnique({ where: { id: "primary" } });

  try {
    const baseUrl = safeProviderUrl(rawBaseUrl);
    if (!model) throw new Error("Add the exact model identifier from your provider.");
    if (apiKey && !aiProviderEncryptionReady()) throw new Error("AI_CONFIG_ENCRYPTION_KEY must be configured before saving an API key.");
    if (enabled && !apiKey && !before?.encryptedApiKey) throw new Error("Add an API key before enabling AI replies.");

    const after = await client.aiProviderConfig.upsert({
      where: { id: "primary" },
      create: {
        id: "primary",
        enabled,
        providerName,
        baseUrl,
        model,
        encryptedApiKey: apiKey ? encryptAiProviderSecret(apiKey) : null,
        apiKeyHint: apiKey ? apiKey.slice(-4) : null,
        updatedBy: admin.clerkId,
      },
      update: {
        enabled,
        providerName,
        baseUrl,
        model,
        ...(apiKey ? {
          encryptedApiKey: encryptAiProviderSecret(apiKey),
          apiKeyHint: apiKey.slice(-4),
        } : {}),
        updatedBy: admin.clerkId,
      },
    });

    await createAdminAuditLog({
      admin,
      action: "AI_PROVIDER_UPDATED",
      targetType: "AiProviderConfig",
      targetId: "primary",
      before: before ? { enabled: before.enabled, providerName: before.providerName, baseUrl: before.baseUrl, model: before.model, hasApiKey: Boolean(before.encryptedApiKey) } : null,
      after: { enabled: after.enabled, providerName: after.providerName, baseUrl: after.baseUrl, model: after.model, hasApiKey: Boolean(after.encryptedApiKey) },
    });
    revalidatePath("/admin/system");
    return { status: 200 as const, data: "Provider settings saved." };
  } catch (error) {
    await createAdminAuditLog({
      admin,
      action: "AI_PROVIDER_UPDATED",
      targetType: "AiProviderConfig",
      targetId: "primary",
      status: "FAILED",
      error: errorMessage(error),
    });
    return { status: 400 as const, data: errorMessage(error) };
  }
}

export async function testAiProviderAction() {
  const admin = await requireAdminAction();
  const config = await client.aiProviderConfig.findUnique({ where: { id: "primary" } });
  const testedAt = new Date();

  try {
    if (!config?.encryptedApiKey || !config.model || !config.baseUrl) throw new Error("Save a complete provider configuration first.");
    const reply = await testAiProvider({
      baseUrl: config.baseUrl,
      model: config.model,
      apiKey: decryptAiProviderSecret(config.encryptedApiKey),
    });
    await client.aiProviderConfig.update({
      where: { id: "primary" },
      data: { lastTestedAt: testedAt, lastTestStatus: "CONNECTED", lastTestError: null, updatedBy: admin.clerkId },
    });
    await createAdminAuditLog({
      admin,
      action: "AI_PROVIDER_TESTED",
      targetType: "AiProviderConfig",
      targetId: "primary",
      metadata: { providerName: config.providerName, model: config.model, replyLength: reply.length },
    });
    revalidatePath("/admin/system");
    return { status: 200 as const, data: "Connection verified. The provider returned valid structured output." };
  } catch (error) {
    const message = errorMessage(error).slice(0, 400);
    if (config) {
      await client.aiProviderConfig.update({
        where: { id: "primary" },
        data: { lastTestedAt: testedAt, lastTestStatus: "FAILED", lastTestError: message, updatedBy: admin.clerkId },
      });
    }
    await createAdminAuditLog({
      admin,
      action: "AI_PROVIDER_TESTED",
      targetType: "AiProviderConfig",
      targetId: "primary",
      status: "FAILED",
      error: message,
    });
    revalidatePath("/admin/system");
    return { status: 400 as const, data: message };
  }
}
