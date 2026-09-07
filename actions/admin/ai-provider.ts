"use server";

import { createAdminAuditLog, requireAdminAction } from "@/actions/admin/safe-actions";
import { aiProviderEncryptionReady, decryptAiProviderSecret, encryptAiProviderSecret } from "@/lib/ai-provider-crypto";
import { getAiProviderDefinition, validateAiModelId } from "@/lib/ai-providers";
import { testAiProvider } from "@/lib/ai-reply";
import { client } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function errorMessage(error: unknown, secrets: string[] = []) {
  let message = error instanceof Error ? error.message : "AI provider request failed.";
  for (const secret of secrets) {
    if (secret) message = message.split(secret).join("[redacted]");
  }
  return message
    .replace(/(?:sk|key|token)-[A-Za-z0-9_-]{8,}/gi, "[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, "Bearer [redacted]")
    .slice(0, 400);
}

function requireProvider(providerId: string) {
  const provider = getAiProviderDefinition(providerId);
  if (!provider) throw new Error("Choose a supported AI provider.");
  return provider;
}

function revalidateAiProviderPages() {
  revalidatePath("/admin/system");
}

export async function saveAiProviderAction(formData: FormData) {
  const admin = await requireAdminAction();
  const providerId = String(formData.get("providerId") ?? "").trim();
  const apiKey = String(formData.get("apiKey") ?? "").trim();

  try {
    const provider = requireProvider(providerId);
    const model = validateAiModelId(String(formData.get("model") ?? provider.defaultModel));
    const before = await client.aiProviderConfig.findUnique({ where: { id: provider.id } });

    if (apiKey && !aiProviderEncryptionReady()) {
      throw new Error("AI_CONFIG_ENCRYPTION_KEY must be configured before saving an API key.");
    }

    const connectionChanged = !before || Boolean(apiKey) || before.model !== model || before.baseUrl !== provider.baseUrl;
    const after = await client.aiProviderConfig.upsert({
      where: { id: provider.id },
      create: {
        id: provider.id,
        enabled: false,
        providerName: provider.name,
        baseUrl: provider.baseUrl,
        model,
        encryptedApiKey: apiKey ? encryptAiProviderSecret(apiKey) : null,
        apiKeyHint: apiKey ? apiKey.slice(-4) : null,
        updatedBy: admin.clerkId,
      },
      update: {
        providerName: provider.name,
        baseUrl: provider.baseUrl,
        model,
        ...(apiKey ? {
          encryptedApiKey: encryptAiProviderSecret(apiKey),
          apiKeyHint: apiKey.slice(-4),
        } : {}),
        ...(connectionChanged ? {
          enabled: false,
          lastTestedAt: null,
          lastTestStatus: null,
          lastTestError: null,
        } : {}),
        updatedBy: admin.clerkId,
      },
    });

    await createAdminAuditLog({
      admin,
      action: "AI_PROVIDER_UPDATED",
      targetType: "AiProviderConfig",
      targetId: provider.id,
      before: before ? {
        enabled: before.enabled,
        providerName: before.providerName,
        model: before.model,
        hasApiKey: Boolean(before.encryptedApiKey),
      } : null,
      after: {
        enabled: after.enabled,
        providerName: after.providerName,
        model: after.model,
        hasApiKey: Boolean(after.encryptedApiKey),
      },
    });
    revalidateAiProviderPages();
    return {
      status: 200 as const,
      data: connectionChanged
        ? `${provider.name} saved. Test it, then make it active.`
        : `${provider.name} is already up to date.`,
      apiKeyHint: after.apiKeyHint,
      testRequired: connectionChanged,
    };
  } catch (error) {
    const message = errorMessage(error, [apiKey]);
    await createAdminAuditLog({
      admin,
      action: "AI_PROVIDER_UPDATED",
      targetType: "AiProviderConfig",
      targetId: providerId || "unknown",
      status: "FAILED",
      error: message,
    });
    return { status: 400 as const, data: message };
  }
}

export async function testAiProviderAction(providerId: string) {
  const admin = await requireAdminAction();
  const testedAt = new Date();
  const provider = requireProvider(providerId);
  const config = await client.aiProviderConfig.findUnique({ where: { id: provider.id } });
  let apiKey = "";

  try {
    if (!config?.encryptedApiKey || !config.model) {
      throw new Error(`Save a ${provider.name} API key and model first.`);
    }
    apiKey = decryptAiProviderSecret(config.encryptedApiKey);
    const reply = await testAiProvider({
      providerId: provider.id,
      baseUrl: provider.baseUrl,
      model: config.model,
      apiKey,
    });
    await client.aiProviderConfig.update({
      where: { id: provider.id },
      data: { lastTestedAt: testedAt, lastTestStatus: "CONNECTED", lastTestError: null, updatedBy: admin.clerkId },
    });
    await createAdminAuditLog({
      admin,
      action: "AI_PROVIDER_TESTED",
      targetType: "AiProviderConfig",
      targetId: provider.id,
      metadata: { providerName: provider.name, model: config.model, replyLength: reply.length },
    });
    revalidateAiProviderPages();
    return { status: 200 as const, data: `${provider.name} is connected and returned a valid AP3K reply.` };
  } catch (error) {
    const message = errorMessage(error, [apiKey]);
    if (config) {
      await client.aiProviderConfig.update({
        where: { id: provider.id },
        data: { enabled: false, lastTestedAt: testedAt, lastTestStatus: "FAILED", lastTestError: message, updatedBy: admin.clerkId },
      });
    }
    await createAdminAuditLog({
      admin,
      action: "AI_PROVIDER_TESTED",
      targetType: "AiProviderConfig",
      targetId: provider.id,
      status: "FAILED",
      error: message,
      metadata: { providerName: provider.name },
    });
    revalidateAiProviderPages();
    return { status: 400 as const, data: message };
  }
}

export async function activateAiProviderAction(providerId: string) {
  const admin = await requireAdminAction();
  const provider = requireProvider(providerId);

  try {
    const config = await client.aiProviderConfig.findUnique({ where: { id: provider.id } });
    if (!config?.encryptedApiKey || !config.model) throw new Error(`Configure ${provider.name} first.`);
    if (config.lastTestStatus !== "CONNECTED") throw new Error(`Test ${provider.name} successfully before making it active.`);

    await client.$transaction([
      client.aiProviderConfig.updateMany({ where: { enabled: true }, data: { enabled: false } }),
      client.aiProviderConfig.update({ where: { id: provider.id }, data: { enabled: true, updatedBy: admin.clerkId } }),
    ]);
    await createAdminAuditLog({
      admin,
      action: "AI_PROVIDER_ACTIVATED",
      targetType: "AiProviderConfig",
      targetId: provider.id,
      after: { providerName: provider.name, model: config.model },
    });
    revalidateAiProviderPages();
    return { status: 200 as const, data: `${provider.name} now powers every AP3K AI reply.` };
  } catch (error) {
    const message = errorMessage(error);
    await createAdminAuditLog({
      admin,
      action: "AI_PROVIDER_ACTIVATED",
      targetType: "AiProviderConfig",
      targetId: provider.id,
      status: "FAILED",
      error: message,
    });
    return { status: 400 as const, data: message };
  }
}

export async function disableAiProviderAction(providerId: string) {
  const admin = await requireAdminAction();
  const provider = requireProvider(providerId);
  await client.aiProviderConfig.updateMany({
    where: { id: provider.id, enabled: true },
    data: { enabled: false, updatedBy: admin.clerkId },
  });
  await createAdminAuditLog({
    admin,
    action: "AI_PROVIDER_DISABLED",
    targetType: "AiProviderConfig",
    targetId: provider.id,
    after: { providerName: provider.name },
  });
  revalidateAiProviderPages();
  return { status: 200 as const, data: "AP3K AI generation is paused. Saved provider keys were kept." };
}
