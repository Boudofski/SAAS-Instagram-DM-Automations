import type { AiProviderId } from "@/lib/ai-providers";

/** Reasoning models count internal tokens against the completion budget. */
export function aiCompletionBudget(provider: { providerId: AiProviderId; model: string }) {
  return {
    max_tokens: 2048,
    ...(provider.providerId === "google" && /^gemini-3/.test(provider.model)
      ? { reasoning_effort: "low" as const }
      : {}),
  };
}
