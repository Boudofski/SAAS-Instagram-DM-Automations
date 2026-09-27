import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ config: vi.fn(), completion: vi.fn(), options: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ client: { aiProviderConfig: { findFirst: mocks.config } } }));
vi.mock("@/lib/ai-provider-crypto", () => ({ decryptAiProviderSecret: () => "test-secret" }));
vi.mock("openai", () => {
  class APIError extends Error { status = 429; }
  class Timeout extends Error {}
  class MockOpenAI {
    static APIError = APIError;
    static APIConnectionTimeoutError = Timeout;
    chat = { completions: { create: mocks.completion } };
    constructor(options: unknown) { mocks.options(options); }
  }
  return { default: MockOpenAI };
});
import { FLOW_LINK_PLACEHOLDER, generateFlowAssistantDraft, normalizeFlowAssistantInput, parseFlowAssistantDraft } from "./ai";
const input = { integrationId: "c6c9b7d5-6a95-4e3a-aeee-268147c1e8ab", prompt: "Send my https://shop.example/guide link after 10 seconds." };
const message = { id: "message", label: "Send the guide", x: 440, y: 100, kind: "message", text: "Here is your guide!", links: [{ label: "Get guide", url: "https://shop.example/guide" }], next: null as string | null };
const response = () => ({ name: "Deliver guide", summary: "Wait ten seconds, then send your guide.", trigger: { source: "COMMENT", keyword: "LINK", anyMessage: false }, flow: { version: 1, entry: "delay", oncePerContact: false, nodes: [{ id: "delay", label: "Wait", x: 20, y: 100, kind: "delay", seconds: 10, next: "message" }, structuredClone(message)] } });
describe("flow assistant proposals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.config.mockResolvedValue({ id: "google", enabled: true, model: "configured-model", encryptedApiKey: "encrypted" });
    mocks.completion.mockResolvedValue({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(response()) } }] });
  });
  it("accepts a real validated delayed graph and the user's destination", () => {
    const parsed = parseFlowAssistantDraft(JSON.stringify(response()), input);
    expect(parsed.needsInput).toBe(false);
    expect(parsed.flow.nodes[0]).toMatchObject({ kind: "delay", seconds: 10 });
  });
  it("supports free-text capture in a generated graph without allowing reserved profile writes", () => {
    const draft = { ...response(), flow: { version: 1, oncePerContact: false, entry: "capture", nodes: [{ id: "capture", label: "Ask name", x: 0, y: 0, kind: "capture", text: "What is your name?", field: "first_name", next: "send", skip: "send" }, { ...message, id: "send", text: "Hello {{first_name}}" }] } };
    expect(parseFlowAssistantDraft(JSON.stringify(draft), input).flow.nodes[0].kind).toBe("capture");
    draft.flow.nodes[0].field = "_followsBusiness";
    expect(() => parseFlowAssistantDraft(JSON.stringify(draft), input)).toThrow("cannot be overwritten");
  });
  it("replaces invented URLs in buttons, cards and message text and requires user input", () => {
    const draft = response();
    draft.flow.nodes[1] = { ...message, text: "Go to https://invented.example/offer", links: [{ label: "Open", url: "https://invented.example/offer" }] };
    const parsed = parseFlowAssistantDraft(JSON.stringify(draft), input);
    expect(parsed.needsInput).toBe(true);
    expect(JSON.stringify(parsed.flow)).not.toContain("invented.example");
    expect(JSON.stringify(parsed.flow)).toContain(FLOW_LINK_PLACEHOLDER);
    expect(parsed.warnings[0]).toContain("before publishing");
  });
  it("does not trust assistant-history URLs, but accepts user-history URLs", () => {
    const draft = response();
    draft.flow.nodes[1] = { ...message, links: [{ label: "Open", url: "https://history.example/guide" }] };
    for (const role of ["assistant", "user"] as const) {
      const result = parseFlowAssistantDraft(JSON.stringify(draft), { ...input, history: [{ role, content: "https://history.example/guide" }] });
      expect(result.needsInput).toBe(role === "assistant");
    }
  });
  it("rejects invalid JSON, unsupported actions, oversized and autonomous cyclic graphs", () => {
    expect(() => parseFlowAssistantDraft("not JSON", input)).toThrow("valid flow JSON");
    expect(() => parseFlowAssistantDraft("x".repeat(120001), input)).toThrow("oversized");
    const unsupported = { ...response(), publish: true };
    expect(() => parseFlowAssistantDraft(JSON.stringify(unsupported), input)).toThrow("unsupported");
    const cyclic = response();
    cyclic.flow.nodes[1] = { ...message, next: "delay" };
    expect(() => parseFlowAssistantDraft(JSON.stringify(cyclic), input)).toThrow("loop");
    const invalidNode = response();
    invalidNode.flow.nodes[1] = { ...message, kind: "http-request" };
    expect(() => parseFlowAssistantDraft(JSON.stringify(invalidNode), input)).toThrow("invalid");
  });
  it("rejects stale schema and oversized inputs before a provider request", () => {
    expect(() => normalizeFlowAssistantInput({ ...input, currentFlow: { garbage: true } })).toThrow();
    expect(() => normalizeFlowAssistantInput({ ...input, prompt: "a".repeat(4001) })).toThrow();
    expect(() => normalizeFlowAssistantInput({ ...input, history: Array(9).fill({ role: "user", content: "x" }) })).toThrow();
    expect(() => normalizeFlowAssistantInput({ ...input, currentFlow: "x".repeat(120001) })).toThrow("too large");
    expect(mocks.completion).not.toHaveBeenCalled();
  });
  it("rejects oversized graphs, insecure buttons and credentials in generated URLs", () => {
    const draft = response();
    draft.flow.nodes = Array.from({ length: 51 }, (_, i) => ({ ...message, id: `message_${i}`, next: i < 50 ? `message_${i + 1}` : null }));
    draft.flow.entry = "message_0";
    expect(() => parseFlowAssistantDraft(JSON.stringify(draft), input)).toThrow("invalid");
    const insecure = response();
    insecure.flow.nodes[1] = { ...message, links: [{ label: "Open", url: "http://shop.example/guide" }] };
    expect(() => parseFlowAssistantDraft(JSON.stringify(insecure), input)).toThrow("HTTPS");
    const credential = response();
    credential.flow.nodes[1] = { ...message, links: [{ label: "Open", url: "https://user:secret@shop.example/guide" }] };
    const clean = parseFlowAssistantDraft(JSON.stringify(credential), { ...input, prompt: "https://user:secret@shop.example/guide" });
    expect(clean.needsInput).toBe(true);
    expect(JSON.stringify(clean.flow)).not.toContain("secret");
  });
  it("uses the configured provider model with timeout and no retry, not a fixed invented model", async () => {
    const result = await generateFlowAssistantDraft(input);
    expect(result.flow.nodes).toHaveLength(2);
    expect(mocks.options).toHaveBeenCalledWith(expect.objectContaining({ timeout: 35000, maxRetries: 0, apiKey: "test-secret" }));
    expect(mocks.completion).toHaveBeenCalledWith(expect.objectContaining({ model: "configured-model", max_tokens: 8192 }));
  });
  it("surfaces unavailable providers and truncation without manufacturing a draft", async () => {
    mocks.config.mockResolvedValueOnce(null);
    await expect(generateFlowAssistantDraft(input)).rejects.toThrow("disabled");
    expect(mocks.completion).not.toHaveBeenCalled();
    mocks.completion.mockResolvedValueOnce({ choices: [{ finish_reason: "length", message: { content: JSON.stringify(response()) } }] });
    await expect(generateFlowAssistantDraft(input)).rejects.toThrow("response limit");
  });
});
