import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindAutomationForCommentWithReason = vi.fn();
const mockCreateMessageLog = vi.fn();
const mockCreateAutomationEvent = vi.fn();
const mockCreateWebhookEvent = vi.fn();
const mockUpdateWebhookEvent = vi.fn();
const mockMergeWebhookEventPayload = vi.fn();
const mockIsDuplicate = vi.fn();
const mockHasProcessedCommentWebhook = vi.fn();
const mockHasAp3kGeneratedCommentId = vi.fn();
const mockHasRecentAp3kReplyTextMatch = vi.fn();
const mockCountRecentPublicReplies = vi.fn();
const mockHasRecentHandledCommenter = vi.fn();
const mockCountLoopGuardEvents = vi.fn();
const mockPauseAutomationForLoopGuard = vi.fn();
const mockCanSendStaticReply = vi.fn();
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
  hasProcessedCommentWebhook: (...args: any[]) => mockHasProcessedCommentWebhook(...args),
  hasAp3kGeneratedCommentId: (...args: any[]) => mockHasAp3kGeneratedCommentId(...args),
  hasRecentAp3kReplyTextMatch: (...args: any[]) => mockHasRecentAp3kReplyTextMatch(...args),
  countRecentPublicReplies: (...args: any[]) => mockCountRecentPublicReplies(...args),
  hasRecentHandledCommenter: (...args: any[]) => mockHasRecentHandledCommenter(...args),
  countLoopGuardEvents: (...args: any[]) => mockCountLoopGuardEvents(...args),
  pauseAutomationForLoopGuard: (...args: any[]) => mockPauseAutomationForLoopGuard(...args),
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

vi.mock("@/actions/usage/queries", () => ({
  canSendStaticReply: (...args: any[]) => mockCanSendStaticReply(...args),
}));

import { POST } from "@/app/api/webhooks/meta/route";

function automation(sendPrivateDm: boolean, overrides: Record<string, any> = {}) {
  const commentReply = Object.prototype.hasOwnProperty.call(overrides, "commentReply")
    ? overrides.commentReply
    : "Check your DMs";
  return {
    id: overrides.id ?? `automation-${sendPrivateDm ? "dm-on" : "dm-off"}`,
    userId: "user-1",
    name: "Campaign",
    active: true,
    matchingMode: "CONTAINS",
    triggerMode: overrides.triggerMode ?? "SPECIFIC_KEYWORD",
    sendPrivateDm,
    keywords: overrides.keywords ?? [{ word: "ai" }],
    posts: [{ postid: "ANY" }],
    listener: {
      listener: "MESSAGE",
      prompt: "Here is the link",
      commentReply,
      commentReply2: overrides.commentReply2 ?? null,
      commentReply3: overrides.commentReply3 ?? null,
      ctaLink: null,
      ctaButtonTitle: null,
    },
    User: {
      subscription: { plan: "FREE" },
      integrations: [
        {
          id: "integration-1",
          token: "token",
          instagramId: "ig-1",
          webhookAccountId: "ig-1",
          pageId: "page-1",
          instagramUsername: "maglobalmarketing",
        },
      ],
    },
  };
}

function commentRequest(overrides: Record<string, any> = {}) {
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
                id: overrides.commentId ?? "comment-1",
                media: { id: "media-1" },
                from: {
                  id: overrides.commenterId ?? "commenter-1",
                  username: overrides.commenterUsername ?? "tester",
                },
                text: overrides.text ?? "ai",
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
  mockHasProcessedCommentWebhook.mockResolvedValue(false);
  mockHasAp3kGeneratedCommentId.mockResolvedValue(false);
  mockHasRecentAp3kReplyTextMatch.mockResolvedValue(false);
  mockCountRecentPublicReplies.mockResolvedValue(0);
  mockHasRecentHandledCommenter.mockResolvedValue(false);
  mockCountLoopGuardEvents.mockResolvedValue(0);
  mockPauseAutomationForLoopGuard.mockResolvedValue({});
  mockCanSendStaticReply.mockResolvedValue({
    ok: true,
    usage: {
      plan: "FREE",
      planLabel: "Free",
      periodLabel: "May 2026",
      enforcementStart: new Date("2026-05-01T00:00:00Z"),
      staticReplies: { used: 0, limit: 50, blocked: false },
    },
  });
  mockSendCommentReply.mockResolvedValue({ status: 200, data: { id: "reply-comment-1" } });
  mockSendMediaComment.mockResolvedValue({ status: 200, data: { id: "reply-comment-1" } });
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
    expect(mockCreateAutomationEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "DM_FAILED" })
    );
    expect(mockCreateMessageLog).not.toHaveBeenCalledWith(
      expect.objectContaining({ messageType: "DM", status: "FAILED" })
    );
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

  it("allows a normal Any Comment campaign comment to send one public reply", async () => {
    const campaign = automation(false, { triggerMode: "ANY_COMMENT", keywords: [] });
    mockFindAutomationForCommentWithReason.mockResolvedValue({
      automation: campaign,
      automations: [campaign],
      diagnostics: { matchingIntegrationFound: true, matchedAutomationIds: [campaign.id] },
    });

    await POST(commentRequest({ text: "hello" }));

    expect(mockSendCommentReply).toHaveBeenCalledOnce();
    expect(mockUpsertLead).toHaveBeenCalledOnce();
    expect(mockCreateAutomationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        automationId: campaign.id,
        eventType: "PUBLIC_REPLY_SENT",
        commentId: "reply-comment-1",
        meta: expect.objectContaining({
          sourceCommentId: "comment-1",
          publicReplyTextHash: expect.any(String),
        }),
      })
    );
  });

  it("does not call public reply endpoints when public reply is disabled", async () => {
    const campaign = automation(true, { commentReply: null });
    mockFindAutomationForCommentWithReason.mockResolvedValue({
      automation: campaign,
      automations: [campaign],
      diagnostics: { matchingIntegrationFound: true, matchedAutomationIds: [campaign.id] },
    });

    await POST(commentRequest());

    expect(mockSendCommentReply).not.toHaveBeenCalled();
    expect(mockSendMediaComment).not.toHaveBeenCalled();
    expect(mockSendInstagramCommentPrivateReply).toHaveBeenCalledOnce();
    expect(mockCreateAutomationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        automationId: campaign.id,
        eventType: "COMMENT_SKIPPED",
        meta: expect.objectContaining({ reason: "public_reply_disabled" }),
      })
    );
  });

  it("with both outbound actions off sends nothing and logs clear skips", async () => {
    const campaign = automation(false, { commentReply: null });
    mockFindAutomationForCommentWithReason.mockResolvedValue({
      automation: campaign,
      automations: [campaign],
      diagnostics: { matchingIntegrationFound: true, matchedAutomationIds: [campaign.id] },
    });

    await POST(commentRequest());

    expect(mockSendCommentReply).not.toHaveBeenCalled();
    expect(mockSendMediaComment).not.toHaveBeenCalled();
    expect(mockSendInstagramCommentPrivateReply).not.toHaveBeenCalled();
    expect(mockCreateAutomationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "COMMENT_SKIPPED",
        meta: expect.objectContaining({ reason: "public_reply_disabled" }),
      })
    );
    expect(mockCreateAutomationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "DM_SKIPPED",
        meta: expect.objectContaining({ reason: "external_dm_tool_enabled" }),
      })
    );
  });

  it("with public reply on and DM off sends exactly one public reply and logs DM skipped", async () => {
    const campaign = automation(false);
    mockFindAutomationForCommentWithReason.mockResolvedValue({
      automation: campaign,
      automations: [campaign],
      diagnostics: { matchingIntegrationFound: true, matchedAutomationIds: [campaign.id] },
    });

    await POST(commentRequest());

    expect(mockSendCommentReply).toHaveBeenCalledOnce();
    expect(mockSendInstagramCommentPrivateReply).not.toHaveBeenCalled();
    expect(mockCreateAutomationEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "DM_FAILED" })
    );
    expect(mockCreateAutomationEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "PUBLIC_REPLY_SENT" })
    );
    expect(mockCreateAutomationEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "DM_SKIPPED" })
    );
  });

  it("logs public reply failed when Meta returns success without an id", async () => {
    const campaign = automation(false);
    mockSendCommentReply.mockResolvedValue({ status: 200, data: {} });
    mockFindAutomationForCommentWithReason.mockResolvedValue({
      automation: campaign,
      automations: [campaign],
      diagnostics: { matchingIntegrationFound: true, matchedAutomationIds: [campaign.id] },
    });

    await POST(commentRequest());

    expect(mockCreateAutomationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "PUBLIC_REPLY_FAILED",
        meta: expect.objectContaining({ error: "meta_public_reply_missing_id" }),
      })
    );
    expect(mockCreateMessageLog).toHaveBeenCalledWith(
      expect.objectContaining({
        messageType: "COMMENT_REPLY",
        status: "FAILED",
        errorMessage: "meta_public_reply_missing_id",
      })
    );
  });

  it("skips comments from the connected IG business account id before lead or sends", async () => {
    const campaign = automation(true);
    mockFindAutomationForCommentWithReason.mockResolvedValue({
      automation: campaign,
      automations: [campaign],
      diagnostics: { matchingIntegrationFound: true, matchedAutomationIds: [campaign.id] },
    });

    await POST(commentRequest({ commenterId: "ig-1" }));

    expect(mockUpsertLead).not.toHaveBeenCalled();
    expect(mockSendCommentReply).not.toHaveBeenCalled();
    expect(mockSendInstagramCommentPrivateReply).not.toHaveBeenCalled();
    expect(mockCreateAutomationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        automationId: campaign.id,
        eventType: "SELF_COMMENT_SKIPPED",
        meta: expect.objectContaining({ reason: "self_comment_author" }),
      })
    );
  });

  it("skips comments from the connected IG username before lead or sends", async () => {
    const campaign = automation(true);
    mockFindAutomationForCommentWithReason.mockResolvedValue({
      automation: campaign,
      automations: [campaign],
      diagnostics: { matchingIntegrationFound: true, matchedAutomationIds: [campaign.id] },
    });

    await POST(commentRequest({ commenterUsername: "maglobalmarketing" }));

    expect(mockUpsertLead).not.toHaveBeenCalled();
    expect(mockSendCommentReply).not.toHaveBeenCalled();
    expect(mockSendInstagramCommentPrivateReply).not.toHaveBeenCalled();
    expect(mockCreateAutomationEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "SELF_COMMENT_SKIPPED" })
    );
  });

  it("skips AP3k-generated public reply comment ids", async () => {
    const campaign = automation(true);
    mockHasAp3kGeneratedCommentId.mockResolvedValue(true);
    mockFindAutomationForCommentWithReason.mockResolvedValue({
      automation: campaign,
      automations: [campaign],
      diagnostics: { matchingIntegrationFound: true, matchedAutomationIds: [campaign.id] },
    });

    await POST(commentRequest({ commentId: "reply-comment-1" }));

    expect(mockUpsertLead).not.toHaveBeenCalled();
    expect(mockSendCommentReply).not.toHaveBeenCalled();
    expect(mockSendInstagramCommentPrivateReply).not.toHaveBeenCalled();
    expect(mockCreateAutomationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "COMMENT_SKIPPED",
        meta: expect.objectContaining({ reason: "ap3k_generated_comment" }),
      })
    );
  });

  it("skips recent AP3k reply text matches on the same media", async () => {
    const campaign = automation(true);
    mockHasRecentAp3kReplyTextMatch.mockResolvedValue(true);
    mockFindAutomationForCommentWithReason.mockResolvedValue({
      automation: campaign,
      automations: [campaign],
      diagnostics: { matchingIntegrationFound: true, matchedAutomationIds: [campaign.id] },
    });

    await POST(commentRequest({ text: "Check your DMs" }));

    expect(mockUpsertLead).not.toHaveBeenCalled();
    expect(mockSendCommentReply).not.toHaveBeenCalled();
    expect(mockSendInstagramCommentPrivateReply).not.toHaveBeenCalled();
    expect(mockCreateAutomationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "COMMENT_SKIPPED",
        meta: expect.objectContaining({ reason: "recent_ap3k_reply_text_match" }),
      })
    );
  });

  it("ignores duplicate comment ids before lead, public reply, or private DM", async () => {
    const campaign = automation(true);
    mockHasProcessedCommentWebhook.mockResolvedValue(true);
    mockFindAutomationForCommentWithReason.mockResolvedValue({
      automation: campaign,
      automations: [campaign],
      diagnostics: { matchingIntegrationFound: true, matchedAutomationIds: [campaign.id] },
    });

    await POST(commentRequest());

    expect(mockUpsertLead).not.toHaveBeenCalled();
    expect(mockSendCommentReply).not.toHaveBeenCalled();
    expect(mockSendInstagramCommentPrivateReply).not.toHaveBeenCalled();
    expect(mockCreateAutomationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "DUPLICATE_SKIPPED",
        meta: expect.objectContaining({ reason: "duplicate_comment_webhook" }),
      })
    );
  });

  it("skips a recently handled commenter on the same media", async () => {
    const campaign = automation(true);
    mockHasRecentHandledCommenter.mockResolvedValue(true);
    mockFindAutomationForCommentWithReason.mockResolvedValue({
      automation: campaign,
      automations: [campaign],
      diagnostics: { matchingIntegrationFound: true, matchedAutomationIds: [campaign.id] },
    });

    await POST(commentRequest());

    expect(mockUpsertLead).not.toHaveBeenCalled();
    expect(mockSendCommentReply).not.toHaveBeenCalled();
    expect(mockSendInstagramCommentPrivateReply).not.toHaveBeenCalled();
    expect(mockCreateAutomationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "COMMENT_SKIPPED",
        meta: expect.objectContaining({ reason: "commenter_recently_handled" }),
      })
    );
  });

  it("triggers loop guard and auto-pauses after repeated loop guard events", async () => {
    const campaign = automation(true, { triggerMode: "ANY_COMMENT", keywords: [] });
    mockCountRecentPublicReplies.mockImplementation((input: any) =>
      input.mediaId ? Promise.resolve(5) : Promise.resolve(50)
    );
    mockCountLoopGuardEvents.mockResolvedValue(3);
    mockFindAutomationForCommentWithReason.mockResolvedValue({
      automation: campaign,
      automations: [campaign],
      diagnostics: { matchingIntegrationFound: true, matchedAutomationIds: [campaign.id] },
    });

    await POST(commentRequest({ text: "new comment" }));

    expect(mockSendCommentReply).not.toHaveBeenCalled();
    expect(mockSendInstagramCommentPrivateReply).not.toHaveBeenCalled();
    expect(mockPauseAutomationForLoopGuard).toHaveBeenCalledWith(campaign.id);
    expect(mockCreateAutomationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "LOOP_GUARD_TRIGGERED",
        meta: expect.objectContaining({ reason: "automation_rate_limit_loop_guard" }),
      })
    );
    expect(mockCreateAutomationEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "LOOP_GUARD_PAUSED_CAMPAIGN" })
    );
  });

  it("skips public reply and private DM when the static reply limit is reached", async () => {
    const campaign = automation(true);
    mockCanSendStaticReply.mockResolvedValue({
      ok: false,
      reason: "static_reply_limit_reached",
      usage: {
        plan: "FREE",
        planLabel: "Free",
        periodLabel: "May 2026",
        enforcementStart: new Date("2026-05-23T00:00:00Z"),
        staticReplies: { used: 50, limit: 50, blocked: true },
      },
    });
    mockFindAutomationForCommentWithReason.mockResolvedValue({
      automation: campaign,
      automations: [campaign],
      diagnostics: { matchingIntegrationFound: true, matchedAutomationIds: [campaign.id] },
    });

    await POST(commentRequest());

    expect(mockUpsertLead).not.toHaveBeenCalled();
    expect(mockSendCommentReply).not.toHaveBeenCalled();
    expect(mockSendInstagramCommentPrivateReply).not.toHaveBeenCalled();
    expect(mockCreateAutomationEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "COMMENT_SKIPPED",
        meta: expect.objectContaining({ reason: "static_reply_limit_reached" }),
      })
    );
    expect(mockCreateMessageLog).toHaveBeenCalledWith(
      expect.objectContaining({
        messageType: "COMMENT_REPLY",
        status: "SKIPPED",
        errorMessage: "static_reply_limit_reached",
      })
    );
    expect(mockCreateMessageLog).toHaveBeenCalledWith(
      expect.objectContaining({
        messageType: "DM",
        status: "SKIPPED",
        errorMessage: "static_reply_limit_reached",
      })
    );
  });
});
