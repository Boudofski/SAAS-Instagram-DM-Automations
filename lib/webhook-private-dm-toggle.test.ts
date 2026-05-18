import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindAutomationForCommentWithReason = vi.fn();
const mockCreateMessageLog = vi.fn();
const mockCreateAutomationEvent = vi.fn();
const mockCreateWebhookEvent = vi.fn();
const mockUpdateWebhookEvent = vi.fn();
const mockMergeWebhookEventPayload = vi.fn();
const mockIsDuplicate = vi.fn();
const mockUpsertLead = vi.fn();
const mockTrackResponse = vi.fn();
const mockSendInstagramCommentPrivateReply = vi.fn();
const mockSendCommentReply = vi.fn();
const mockSendMediaComment = vi.fn();

vi.mock("@/actions/webhook/queries", () => ({
  findAutomationForCommentWithReason: (...args: any[]) => mockFindAutomationForCommentWithReason(...args),
  findAutomationForDM: vi.fn(),
  findAutomationById: vi.fn(),
  isDuplicate: (...args: any[]) => mockIsDuplicate(...args),
  createMessageLog: (...args: any[]) => mockCreateMessageLog(...args),
  upsertLead: (...args: any[]) => mockUpsertLead(...args),
  createAutomationEvent: (...args: any[]) => mockCreateAutomationEvent(...args),
  createWebhookEvent: (...args: any[]) => mockCreateWebhookEvent(...args),
  updateWebhookEvent: (...args: any[]) => mockUpdateWebhookEvent(...args),
  mergeWebhookEventPayload: (...args: any[]) => mockMergeWebhookEventPayload(...args),
  createChatHistory: vi.fn(),
  getChatHistory: vi.fn(),
  trackResponse: (...args: any[]) => mockTrackResponse(...args),
}));

vi.mock("@/lib/webhook-signature", () => ({
  verifyMetaSignature: () => ({
    verified: true,
    reason: "ok",
    candidateSecretsConfigured: true,
    triedSecretCount: 1,
    rawBodySha256Short: "hash",
  }),
}));

vi.mock("@/lib/fetch", () => ({
  META_GRAPH_API_BASE_URL: "https://graph.facebook.test/v1",
  formatSafeMetaError: () => "safe_error",
  getSafeMetaError: () => ({ status: 400, code: 3, message: "capability" }),
  sendDm: vi.fn(),
  sendCommentReply: (...args: any[]) => mockSendCommentReply(...args),
  sendMediaComment: (...args: any[]) => mockSendMediaComment(...args),
}));

vi.mock("@/lib/instagram-dm", () => ({
  sendInstagramCommentPrivateReply: (...args: any[]) => mockSendInstagramCommentPrivateReply(...args),
  formatPrivateReplyError: () => "dm_failed",
}));

vi.mock("@/lib/send-token", () => ({
  resolveIntegrationSendToken: () => ({ ok: true, token: "safe-token" }),
  tokenResolutionDiagnostics: () => ({}),
}));

vi.mock("@/lib/openai", () => ({
  openai: { chat: { completions: { create: vi.fn() } } },
}));

import { POST } from "@/app/api/webhooks/meta/route";

function automation(sendPrivateDm: boolean) {
  return {
    id: `automation-${sendPrivateDm ? "dm-on" : "dm-off"}`,
    name: "Campaign",
    active: true,
    matchingMode: "CONTAINS",
    triggerMode: "SPECIFIC_KEYWORD",
    sendPrivateDm,
    keywords: [{ word: "ai" }],
    posts: [{ postid: "ANY" }],
    listener: {
      listener: "MESSAGE",
      prompt: "Here is the link",
      commentReply: "Check your DMs",
      commentReply2: null,
      commentReply3: null,
      ctaLink: null,
      ctaButtonTitle: null,
    },
    User: {
      subscription: { plan: "FREE" },
      integrations: [{ id: "integration-1", token: "token", instagramId: "ig-1", pageId: "page-1" }],
    },
  };
}

function commentRequest() {
  return new Request("https://ap3k.test/api/webhooks/meta", {
    method: "POST",
    headers: { "x-hub-signature-256": "sha256=test" },
    body: JSON.stringify({
      object: "instagram",
      entry: [
        {
          id: "ig-1",
          changes: [
            {
              field: "comments",
              value: {
                id: "comment-1",
                media: { id: "media-1" },
                from: { id: "commenter-1", username: "tester" },
                text: "ai",
              },
            },
          ],
        },
      ],
    }),
  }) as any;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateWebhookEvent.mockResolvedValue({ id: "webhook-event-1" });
  mockUpdateWebhookEvent.mockResolvedValue({});
  mockMergeWebhookEventPayload.mockResolvedValue({});
  mockCreateAutomationEvent.mockResolvedValue({});
  mockCreateMessageLog.mockResolvedValue({});
  mockIsDuplicate.mockResolvedValue(false);
  mockUpsertLead.mockResolvedValue({});
  mockTrackResponse.mockResolvedValue({});
  mockSendCommentReply.mockResolvedValue({ status: 200 });
  mockSendMediaComment.mockResolvedValue({ status: 200 });
  mockSendInstagramCommentPrivateReply.mockResolvedValue({
    ok: true,
    endpoint: "ig_messages_private_reply",
    ctaMode: "none",
  });
});

describe("comment webhook private DM toggle", () => {
  it("does not call the private DM endpoint when sendPrivateDm is false and logs DM_SKIPPED", async () => {
    const campaign = automation(false);
    mockFindAutomationForCommentWithReason.mockResolvedValue({
      automation: campaign,
      automations: [campaign],
      diagnostics: { matchingIntegrationFound: true, matchedAutomationIds: [campaign.id] },
    });

    await POST(commentRequest());

    expect(mockSendInstagramCommentPrivateReply).not.toHaveBeenCalled();
    expect(mockCreateAutomationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        automationId: campaign.id,
        eventType: "DM_SKIPPED",
        keyword: "ai",
        meta: expect.objectContaining({ reason: "external_dm_tool_enabled" }),
      })
    );
    expect(mockCreateMessageLog).toHaveBeenCalledWith(
      expect.objectContaining({
        automationId: campaign.id,
        messageType: "DM",
        status: "SKIPPED",
        errorMessage: "external_dm_tool_enabled",
      })
    );
  });

  it("keeps the existing private DM attempt when sendPrivateDm is true", async () => {
    const campaign = automation(true);
    mockFindAutomationForCommentWithReason.mockResolvedValue({
      automation: campaign,
      automations: [campaign],
      diagnostics: { matchingIntegrationFound: true, matchedAutomationIds: [campaign.id] },
    });

    await POST(commentRequest());

    expect(mockSendInstagramCommentPrivateReply).toHaveBeenCalledOnce();
    expect(mockCreateAutomationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        automationId: campaign.id,
        eventType: "DM_SENT",
        keyword: "ai",
      })
    );
  });
});
