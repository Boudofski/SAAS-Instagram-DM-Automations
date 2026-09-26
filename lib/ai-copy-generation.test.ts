import { beforeEach, describe, expect, it, vi } from "vitest";

const { complete } = vi.hoisted(() => ({ complete: vi.fn() }));
vi.mock("openai", () => ({ default: class { chat = { completions: { create: complete } }; } }));
vi.mock("@/lib/prisma", () => ({ client: { aiProviderConfig: { findFirst: vi.fn().mockResolvedValue({ id: "google", enabled: true, model: "gemini-3.5-flash-lite", encryptedApiKey: "test" }) } } }));
vi.mock("@/lib/ai-provider-crypto", () => ({ decryptAiProviderSecret: () => "test-only" }));

import { generateAutomationCopy } from "./ai-reply";

describe("AI editor generation boundaries", () => {
  beforeEach(() => complete.mockReset());
  it("does not save a sample comment as a regenerated AI prompt", async () => {
    complete.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ prompt: "Thank you so much, Username! Check your DMs 😊" }) } }] });
    expect(await generateAutomationCopy({ mode: "COMMENT_PROMPT", integrationId: "test", sendDm: true })).toBeNull();
    complete.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ prompt: "Thank Username briefly and invite them to check their DMs with a happy emoji." }) } }] });
    expect(await generateAutomationCopy({ mode: "COMMENT_PROMPT", integrationId: "test", sendDm: true })).toEqual(["Thank Username briefly and invite them to check their DMs with a happy emoji."]);
  });
  it("keeps the public comment prompt out of DM generation", async () => {
    complete.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ items: ["Hi {{username}}! Visit AP3K using the button below."] }) } }] });
    const result = await generateAutomationCopy({ mode: "MESSAGE", integrationId: "test", text: "Hi {{username}}! Tap below to visit AP3K.", instructions: "Thank Username and tell them to check their DMs.", hasButtons: true });
    expect(result).toEqual(["Hi {{username}}! Visit AP3K using the button below."]);
    const source = JSON.parse(complete.mock.calls[0][0].messages[1].content);
    expect(source.prompt).toBeUndefined();
    expect(source.text).toContain("{{username}}");
  });
});
