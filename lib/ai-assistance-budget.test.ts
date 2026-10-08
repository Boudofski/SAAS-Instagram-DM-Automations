import { beforeEach, describe, expect, it, vi } from "vitest";
const { complete } = vi.hoisted(() => ({ complete: vi.fn() }));
vi.mock("openai", () => ({ default: class { chat = { completions: { create: complete } }; } }));
vi.mock("@/lib/prisma", () => ({ client: { aiProviderConfig: { findFirst: vi.fn().mockResolvedValue({ id: "google", enabled: true, model: "gemini-3.5-flash-lite", encryptedApiKey: "test" }) } } }));
vi.mock("@/lib/ai-provider-crypto", () => ({ decryptAiProviderSecret: () => "test-only" }));
import { generateAdminAssistance, generateAiEmailPersonalization, generateAiSupportReply } from "./ai-reply";

describe("assistant completion budgets", () => {
  beforeEach(() => complete.mockReset());
  it("reserves reasoning and answer tokens for support and admin responses", async () => {
    complete.mockResolvedValue({ choices: [{ message: { content: "Open Automations to create a draft." } }] });
    expect((await generateAiSupportReply({ message: "How do I create an automation?" })).ok).toBe(true);
    expect(await generateAdminAssistance("editorial", "A public AP3K draft.")).toContain("Automations");
    for (const [request] of complete.mock.calls) {
      expect(request.max_tokens).toBeGreaterThanOrEqual(2048);
      expect(request.reasoning_effort).toBe("low");
    }
  });
  it("leaves enough completion space for email JSON while enforcing output length limits", async () => {
    const fallback = { subject: "Welcome", preview: "Get started", headline: "Welcome to AP3K", introduction: "Create your first automation." };
    complete.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(fallback) } }] });
    expect(await generateAiEmailPersonalization({ templateLabel: "Welcome", fallback })).toEqual({ ok: true, ...fallback });
    expect(complete.mock.calls[0][0]).toMatchObject({ max_tokens: 2048, reasoning_effort: "low", response_format: { type: "json_object" } });
  });
});
