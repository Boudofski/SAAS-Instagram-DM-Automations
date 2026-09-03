import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreateWebhookEvent = vi.fn();
const mockUpdateWebhookEvent = vi.fn();
const mockVerifyMetaSignature = vi.fn();
const mockFindAutomationById = vi.fn();
const mockFindIntegrationForWebhookAccount = vi.fn();
const mockIsDuplicate = vi.fn();
const mockHasDeliveredFollowGatePayload = vi.fn();
const mockCreateMessageLog = vi.fn();
const mockCreateAutomationEvent = vi.fn();
const mockUpsertInboundInboxMessage = vi.fn();
const mockRecordOutboundInboxMessage = vi.fn();
const mockTrackResponse = vi.fn();
const mockGetInstagramRecipientProfile = vi.fn();
const mockSendInstagramDirectResponse = vi.fn();
const mockResolveIntegrationSendToken = vi.fn();
const mockCanSendStaticReply = vi.fn();

vi.mock("@/actions/webhook/queries", () => ({
  findAutomationForCommentWithReason: vi.fn(),
  findAutomationForDM: vi.fn(),
  findAutomationForStory: vi.fn(),
  findAutomationById: (...args: unknown[]) => mockFindAutomationById(...args),
  findIntegrationForWebhookAccount: (...args: unknown[]) => mockFindIntegrationForWebhookAccount(...args),
  isDuplicate: (...args: unknown[]) => mockIsDuplicate(...args),
  hasDeliveredFollowGatePayload: (...args: unknown[]) => mockHasDeliveredFollowGatePayload(...args),
  hasProcessedCommentWebhook: vi.fn(),
  hasAp3kGeneratedCommentId: vi.fn(),
  countRecentPublicReplies: vi.fn(),
  countRecentSelfCommentSkips: vi.fn(),
  pauseAutomationForLoopGuard: vi.fn(),
  createMessageLog: (...args: unknown[]) => mockCreateMessageLog(...args),
  upsertLead: vi.fn(),
  createAutomationEvent: (...args: unknown[]) => mockCreateAutomationEvent(...args),
  createWebhookEvent: (...args: unknown[]) => mockCreateWebhookEvent(...args),
  updateWebhookEvent: (...args: unknown[]) => mockUpdateWebhookEvent(...args),
  mergeWebhookEventPayload: vi.fn(),
  createChatHistory: vi.fn(),
  getChatHistory: vi.fn(),
  trackResponse: (...args: unknown[]) => mockTrackResponse(...args),
  upsertInboundInboxMessage: (...args: unknown[]) => mockUpsertInboundInboxMessage(...args),
  recordOutboundInboxMessage: (...args: unknown[]) => mockRecordOutboundInboxMessage(...args),
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
  sendInstagramDirectResponse: (...args: unknown[]) => mockSendInstagramDirectResponse(...args),
  sendInstagramSenderAction: vi.fn(),
  getInstagramRecipientProfile: (...args: unknown[]) => mockGetInstagramRecipientProfile(...args),
  getInstagramFollowGatePromptCopy: ({ state }: { state: string }) => ({
    title: state,
    subtitle: state,
    profileUrl: "https://www.instagram.com/ap3k/",
    text: state,
  }),
  formatPrivateReplyError: () => "dm_failed",
}));

vi.mock("@/lib/send-token", () => ({
  resolveIntegrationSendToken: (...args: unknown[]) => mockResolveIntegrationSendToken(...args),
  tokenResolutionDiagnostics: () => ({}),
}));

vi.mock("@/actions/usage/queries", () => ({
  canSendStaticReply: (...args: unknown[]) => mockCanSendStaticReply(...args),
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
    mockFindAutomationById.mockResolvedValue(null);
    mockFindIntegrationForWebhookAccount.mockResolvedValue(null);
    mockIsDuplicate.mockResolvedValue(false);
    mockHasDeliveredFollowGatePayload.mockResolvedValue(false);
    mockCreateMessageLog.mockResolvedValue({});
    mockCreateAutomationEvent.mockResolvedValue({});
    mockUpsertInboundInboxMessage.mockResolvedValue({});
    mockRecordOutboundInboxMessage.mockResolvedValue({});
    mockTrackResponse.mockResolvedValue({});
    mockGetInstagramRecipientProfile.mockResolvedValue(null);
    mockSendInstagramDirectResponse.mockResolvedValue({ ok: true, messageIds: ["mid.outbound"] });
    mockResolveIntegrationSendToken.mockReturnValue({ ok: false, reason: "token_missing" });
    mockCanSendStaticReply.mockResolvedValue({ ok: true });
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

  it("rechecks a follow-button postback instead of treating the gate prompt as a duplicate", async () => {
    mockVerifyMetaSignature.mockReturnValue(signatureResult(true));
    const integration = {
      userId: "user-1",
      token: "token-1",
      instagramId: "ig-business-1",
      pageId: "ig-business-1",
      instagramUsername: "ap3k",
      status: "CONNECTED",
      reconnectRequired: false,
    };
    const automation = {
      id: "automation-1",
      userId: "user-1",
      active: true,
      followGateRequired: true,
      typingIndicator: false,
      deliveryDelaySeconds: 0,
      listener: {
        prompt: "Here is your protected payload",
        responseFormat: "TEXT",
        quickReplies: [],
        ctaButtonTitle: null,
        ctaLink: null,
        mediaUrl: null,
        mediaType: null,
      },
      User: { integrations: [integration] },
    };
    mockFindIntegrationForWebhookAccount.mockResolvedValue(integration);
    mockFindAutomationById.mockResolvedValue(automation);
    mockGetInstagramRecipientProfile.mockResolvedValue({
      username: "prospect",
      name: "Prospect",
      profilePictureUrl: undefined,
      followsBusiness: false,
    });
    mockResolveIntegrationSendToken.mockReturnValue({ ok: true, token: "token-1" });

    const body = JSON.stringify({
      object: "instagram",
      entry: [{
        id: "ig-business-1",
        messaging: [{
          sender: { id: "recipient-1" },
          recipient: { id: "ig-business-1" },
          timestamp: Date.now(),
          postback: {
            title: "I followed ✅",
            payload: "AP3K_FOLLOW_CHECK:automation-1",
          },
        }],
      }],
    });
    const response = await POST(new NextRequest("https://ap3k.test/api/webhooks/meta", {
      method: "POST",
      headers: { "x-hub-signature-256": "sha256=good" },
      body,
    }));

    expect(response.status).toBe(200);
    expect(mockIsDuplicate).not.toHaveBeenCalled();
    expect(mockHasDeliveredFollowGatePayload).toHaveBeenCalledWith("automation-1", "recipient-1");
    expect(mockSendInstagramDirectResponse).toHaveBeenCalledWith(expect.objectContaining({
      recipientId: "recipient-1",
      automationId: "automation-1",
      followGatePrompt: { username: "ap3k", state: "NOT_FOLLOWING" },
    }));
    expect(mockCreateMessageLog).toHaveBeenCalledWith(expect.objectContaining({
      status: "SENT",
      errorMessage: "follow_gate_prompt_sent",
    }));
  });

  it("releases the protected payload after Instagram verifies the follow", async () => {
    mockVerifyMetaSignature.mockReturnValue(signatureResult(true));
    const integration = {
      userId: "user-1",
      token: "token-1",
      instagramId: "ig-business-1",
      pageId: "ig-business-1",
      instagramUsername: "ap3k",
      status: "CONNECTED",
      reconnectRequired: false,
    };
    mockFindIntegrationForWebhookAccount.mockResolvedValue(integration);
    mockFindAutomationById.mockResolvedValue({
      id: "automation-1",
      userId: "user-1",
      active: true,
      followGateRequired: true,
      typingIndicator: false,
      deliveryDelaySeconds: 0,
      listener: {
        prompt: "Here is your protected payload",
        responseFormat: "TEXT",
        quickReplies: [],
        ctaButtonTitle: null,
        ctaLink: null,
        mediaUrl: null,
        mediaType: null,
      },
      User: { integrations: [integration] },
    });
    mockGetInstagramRecipientProfile.mockResolvedValue({
      username: "prospect",
      name: "Prospect",
      profilePictureUrl: undefined,
      followsBusiness: true,
    });
    mockResolveIntegrationSendToken.mockReturnValue({ ok: true, token: "token-1" });

    const body = JSON.stringify({
      object: "instagram",
      entry: [{
        id: "ig-business-1",
        messaging: [{
          sender: { id: "recipient-1" },
          recipient: { id: "ig-business-1" },
          timestamp: Date.now(),
          postback: {
            title: "I followed ✅",
            payload: "AP3K_FOLLOW_CHECK:automation-1",
          },
        }],
      }],
    });
    const response = await POST(new NextRequest("https://ap3k.test/api/webhooks/meta", {
      method: "POST",
      headers: { "x-hub-signature-256": "sha256=good" },
      body,
    }));

    expect(response.status).toBe(200);
    expect(mockHasDeliveredFollowGatePayload).toHaveBeenCalledWith("automation-1", "recipient-1");
    expect(mockSendInstagramDirectResponse).toHaveBeenCalledWith(expect.objectContaining({
      recipientId: "recipient-1",
      automationId: "automation-1",
      message: "Here is your protected payload",
      followGatePrompt: undefined,
    }));
    expect(mockCreateMessageLog).toHaveBeenCalledWith(expect.objectContaining({
      status: "SENT",
      errorMessage: "follow_gate_payload_sent",
    }));
  });

  it("does not release the protected payload twice", async () => {
    mockVerifyMetaSignature.mockReturnValue(signatureResult(true));
    mockHasDeliveredFollowGatePayload.mockResolvedValue(true);
    const integration = {
      userId: "user-1",
      token: "token-1",
      instagramId: "ig-business-1",
      pageId: "ig-business-1",
      instagramUsername: "ap3k",
      status: "CONNECTED",
      reconnectRequired: false,
    };
    mockFindIntegrationForWebhookAccount.mockResolvedValue(integration);
    mockFindAutomationById.mockResolvedValue({
      id: "automation-1",
      userId: "user-1",
      active: true,
      followGateRequired: true,
      listener: { prompt: "Here is your protected payload" },
      User: { integrations: [integration] },
    });

    const body = JSON.stringify({
      object: "instagram",
      entry: [{
        id: "ig-business-1",
        messaging: [{
          sender: { id: "recipient-1" },
          recipient: { id: "ig-business-1" },
          timestamp: Date.now(),
          postback: {
            title: "I followed ✅",
            payload: "AP3K_FOLLOW_CHECK:automation-1",
          },
        }],
      }],
    });
    const response = await POST(new NextRequest("https://ap3k.test/api/webhooks/meta", {
      method: "POST",
      headers: { "x-hub-signature-256": "sha256=good" },
      body,
    }));

    expect(response.status).toBe(200);
    expect(mockSendInstagramDirectResponse).not.toHaveBeenCalled();
    expect(mockUpdateWebhookEvent).toHaveBeenCalledWith("webhook-event-1", expect.objectContaining({
      status: "PROCESSED",
      errorMessage: "duplicate_skipped",
    }));
  });
});
