import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateWebhookEvent = vi.fn();
const mockUpdateWebhookEvent = vi.fn();
const mockVerifyMetaSignature = vi.fn();

vi.mock("@/actions/webhook/queries", () => ({
  findAutomationForCommentWithReason: vi.fn(),
  findAutomationForDM: vi.fn(),
  findAutomationById: vi.fn(),
  isDuplicate: vi.fn(),
  hasProcessedCommentWebhook: vi.fn(),
  hasAp3kGeneratedCommentId: vi.fn(),
  countRecentPublicReplies: vi.fn(),
  countRecentSelfCommentSkips: vi.fn(),
  pauseAutomationForLoopGuard: vi.fn(),
  createMessageLog: vi.fn(),
  upsertLead: vi.fn(),
  createAutomationEvent: vi.fn(),
  createWebhookEvent: (...args: unknown[]) => mockCreateWebhookEvent(...args),
  updateWebhookEvent: (...args: unknown[]) => mockUpdateWebhookEvent(...args),
  mergeWebhookEventPayload: vi.fn(),
  createChatHistory: vi.fn(),
  getChatHistory: vi.fn(),
  trackResponse: vi.fn(),
}));

vi.mock("@/lib/webhook-signature", () => ({
  verifyMetaSignature: (...args: unknown[]) => mockVerifyMetaSignature(...args),
}));

vi.mock("@/lib/fetch", () => ({
  formatSafeMetaError: () => "safe_error",
  getSafeMetaError: () => ({ status: 400 }),
  sendDm: vi.fn(),
  sendCommentReply: vi.fn(),
  sendMediaComment: vi.fn(),
}));

vi.mock("@/lib/instagram-dm", () => ({
  sendInstagramCommentPrivateReply: vi.fn(),
  formatPrivateReplyError: () => "dm_failed",
}));

vi.mock("@/lib/send-token", () => ({
  resolveIntegrationSendToken: () => ({ ok: false, reason: "token_missing" }),
  tokenResolutionDiagnostics: () => ({}),
}));

vi.mock("@/actions/usage/queries", () => ({
  canSendStaticReply: vi.fn(),
}));

vi.mock("@/lib/app-review-mode", () => ({
  isAppReviewMode: () => false,
}));

vi.mock("@/lib/openai", () => ({
  openai: { chat: { completions: { create: vi.fn() } } },
}));

import { GET, POST } from "./route";

function signatureResult(verified: boolean) {
  return {
    verified,
    reason: verified ? "verified" : "signature_mismatch",
    triedSecretCount: 1,
    candidateSecretsConfigured: {
      META_APP_SECRET: true,
      INSTAGRAM_APP_SECRET: false,
      INSTAGRAM_CLIENT_SECRET: false,
    },
    rawBodySha256Short: "abcdef123456",
  };
}

describe("Meta webhook route security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.META_VERIFY_TOKEN = "verify-token";
    mockCreateWebhookEvent.mockResolvedValue({ id: "webhook-event-1" });
    mockUpdateWebhookEvent.mockResolvedValue({});
    mockVerifyMetaSignature.mockReturnValue(signatureResult(false));
  });

  it("does not persist failed GET verification attempts", async () => {
    const response = await GET(
      new NextRequest(
        "https://ap3k.test/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc"
      )
    );

    expect(response.status).toBe(403);
    expect(mockCreateWebhookEvent).not.toHaveBeenCalled();
  });

  it("still acknowledges valid GET verification challenges", async () => {
    const response = await GET(
      new NextRequest(
        "https://ap3k.test/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=verify-token&hub.challenge=challenge-value"
      )
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("challenge-value");
    expect(mockCreateWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "WEBHOOK_VERIFY_GET",
        status: "PROCESSED",
      })
    );
  });

  it("verifies the raw body before parsing or writing webhook diagnostics", async () => {
    const rawBody = "{\"object\":\"instagram\",\"entry\":[]}";
    const response = await POST(
      new NextRequest("https://ap3k.test/api/webhooks/meta", {
        method: "POST",
        headers: { "x-hub-signature-256": "sha256=bad" },
        body: rawBody,
      })
    );

    expect(response.status).toBe(200);
    expect(mockVerifyMetaSignature).toHaveBeenCalledWith(rawBody, "sha256=bad");
    expect(mockCreateWebhookEvent).not.toHaveBeenCalled();
  });

  it("persists invalid JSON only after a valid Meta signature", async () => {
    mockVerifyMetaSignature.mockReturnValue(signatureResult(true));

    const response = await POST(
      new NextRequest("https://ap3k.test/api/webhooks/meta", {
        method: "POST",
        headers: { "x-hub-signature-256": "sha256=good" },
        body: "{not-json",
      })
    );

    expect(response.status).toBe(200);
    expect(mockCreateWebhookEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "PAYLOAD_INVALID",
        status: "FAILED",
        errorMessage: "invalid_json_payload",
      })
    );
  });

  it("rejects oversized webhook bodies before signature verification", async () => {
    const response = await POST(
      new NextRequest("https://ap3k.test/api/webhooks/meta", {
        method: "POST",
        headers: {
          "content-length": String(1024 * 1024 + 1),
          "x-hub-signature-256": "sha256=bad",
        },
        body: "{}",
      })
    );

    expect(response.status).toBe(413);
    expect(mockVerifyMetaSignature).not.toHaveBeenCalled();
    expect(mockCreateWebhookEvent).not.toHaveBeenCalled();
  });
});
