import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";

// Mock axios before importing the module under test
vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

import {
  sendInstagramCommentPrivateReply,
  sendInstagramDirectResponse,
  getInstagramFollowGatePromptCopy,
  getInstagramRecipientProfile,
  formatPrivateReplyError,
} from "./instagram-dm";

const VALID_TOKEN = "EAABsbCS".padEnd(50, "x");
const IG_BIZ_ID = "17841451766608292";
const COMMENT_ID = "17858893269000001";
const COMMENTER_ID = "12345678901";

function metaCapabilityError() {
  const err = new Error("Meta API error") as any;
  err.isAxiosError = true;
  err.response = {
    status: 400,
    data: {
      error: {
        message: "(#3) Application does not have the capability to make this API call",
        type: "OAuthException",
        code: 3,
        fbtrace_id: "trace123",
      },
    },
  };
  return err;
}

function metaGenericError(code = 100) {
  const err = new Error("Meta API error") as any;
  err.isAxiosError = true;
  err.response = {
    status: 400,
    data: {
      error: {
        message: "Generic Meta error",
        type: "GraphMethodException",
        code,
        fbtrace_id: "tracexyz",
      },
    },
  };
  return err;
}

beforeEach(() => {
  vi.resetAllMocks();
  // axios.isAxiosError must return true for our fake errors
  mockedAxios.isAxiosError = vi.fn((e: unknown): e is any => Boolean((e as any)?.isAxiosError)) as any;
  mockedAxios.post = vi.fn() as any;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sendInstagramCommentPrivateReply", () => {
  it("sends private reply with recipient.comment_id on primary attempt", async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { message_id: "mid.123" } });

    const result = await sendInstagramCommentPrivateReply({
      token: VALID_TOKEN,
      igBusinessAccountId: IG_BIZ_ID,
      commentId: COMMENT_ID,
      commenterId: COMMENTER_ID,
      message: "Hello!",
    });

    expect(result.ok).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);

    const [url, body] = mockedAxios.post.mock.calls[0] as [string, any];
    expect(url).toContain(`/${IG_BIZ_ID}/messages`);
    expect(body.recipient).toEqual({ comment_id: COMMENT_ID });
    expect(body.message.text).toBe("Hello!");
  });

  it("uses commentId (not commenterId) as recipient for private reply", async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} });

    await sendInstagramCommentPrivateReply({
      token: VALID_TOKEN,
      igBusinessAccountId: IG_BIZ_ID,
      commentId: COMMENT_ID,
      commenterId: COMMENTER_ID,
      message: "Hi",
    });

    const body = mockedAxios.post.mock.calls[0][1] as any;
    expect(body.recipient.comment_id).toBe(COMMENT_ID);
    expect(body.recipient.id).toBeUndefined();
  });

  it("returns dm_capability_missing when primary returns code=3", async () => {
    mockedAxios.post.mockRejectedValueOnce(metaCapabilityError());

    const result = await sendInstagramCommentPrivateReply({
      token: VALID_TOKEN,
      igBusinessAccountId: IG_BIZ_ID,
      commentId: COMMENT_ID,
      commenterId: COMMENTER_ID,
      message: "Hi",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("dm_capability_missing");
      expect(result.endpoint).toBe("ig_messages_private_reply");
    }
    // Fallback must NOT be attempted — same capability blocks both
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
  });

  it("falls back to recipient.id (direct DM) when primary fails with non-capability error", async () => {
    mockedAxios.post
      .mockRejectedValueOnce(metaGenericError(100)) // primary fails
      .mockResolvedValueOnce({ status: 200, data: {} }); // fallback succeeds

    const result = await sendInstagramCommentPrivateReply({
      token: VALID_TOKEN,
      igBusinessAccountId: IG_BIZ_ID,
      commentId: COMMENT_ID,
      commenterId: COMMENTER_ID,
      message: "Hi",
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.endpoint).toBe("ig_messages_direct_dm");

    const fallbackBody = mockedAxios.post.mock.calls[1][1] as any;
    expect(fallbackBody.recipient).toEqual({ id: COMMENTER_ID });
  });

  it("returns dm_capability_missing when fallback also returns code=3", async () => {
    mockedAxios.post
      .mockRejectedValueOnce(metaGenericError(100)) // primary generic error
      .mockRejectedValueOnce(metaCapabilityError()); // fallback code=3

    const result = await sendInstagramCommentPrivateReply({
      token: VALID_TOKEN,
      igBusinessAccountId: IG_BIZ_ID,
      commentId: COMMENT_ID,
      commenterId: COMMENTER_ID,
      message: "Hi",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("dm_capability_missing");
  });

  it("sends a CTA URL as an Instagram button template", async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} });

    const result = await sendInstagramCommentPrivateReply({
      token: VALID_TOKEN,
      igBusinessAccountId: IG_BIZ_ID,
      commentId: COMMENT_ID,
      commenterId: COMMENTER_ID,
      message: "Check this out",
      ctaTitle: "Shop now",
      ctaUrl: "https://example.com/shop",
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.ctaMode).toBe("button_template");

    const body = mockedAxios.post.mock.calls[0][1] as any;
    expect(body.message.attachment.payload.text).toBe("Check this out");
    expect(body.message.attachment.payload.buttons).toEqual([
      { type: "web_url", title: "Shop now", url: "https://example.com/shop" },
    ]);
  });

  it("sends the clickable follower gate card as a private reply", async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { message_id: "mid.gate" } });

    const result = await sendInstagramCommentPrivateReply({
      token: VALID_TOKEN,
      igBusinessAccountId: IG_BIZ_ID,
      commentId: COMMENT_ID,
      commenterId: COMMENTER_ID,
      automationId: "automation-gate",
      message: "Protected payload",
      followGatePrompt: { username: "ap3k", state: "INITIAL" },
    });

    expect(result).toEqual({
      ok: true,
      endpoint: "ig_messages_private_reply",
      ctaMode: "follow_gate_card",
    });
    const body = mockedAxios.post.mock.calls[0][1] as any;
    expect(body.recipient).toEqual({ comment_id: COMMENT_ID });
    expect(body.message.attachment.payload.template_type).toBe("generic");
    expect(body.message.attachment.payload.elements[0].buttons).toEqual([
      { type: "web_url", title: "Follow", url: "https://www.instagram.com/ap3k/" },
      { type: "postback", title: "I followed ✅", payload: "AP3K_FOLLOW_CHECK:automation-gate" },
    ]);
  });

  it("preserves a clickable verification action if Meta rejects the private-reply card", async () => {
    mockedAxios.post
      .mockRejectedValueOnce(metaGenericError(100))
      .mockResolvedValueOnce({ status: 200, data: { message_id: "mid.gate-fallback" } });

    const result = await sendInstagramCommentPrivateReply({
      token: VALID_TOKEN,
      igBusinessAccountId: IG_BIZ_ID,
      commentId: COMMENT_ID,
      commenterId: COMMENTER_ID,
      automationId: "automation-gate",
      message: "Protected payload",
      followGatePrompt: { username: "@ap3k", state: "NOT_FOLLOWING" },
    });

    expect(result.ok).toBe(true);
    const fallbackBody = mockedAxios.post.mock.calls[1][1] as any;
    expect(fallbackBody.recipient).toEqual({ comment_id: COMMENT_ID });
    expect(fallbackBody.message.text).toContain("❌ Not Following Yet!");
    expect(fallbackBody.message.text).toContain("https://www.instagram.com/ap3k/");
    expect(fallbackBody.message.quick_replies).toEqual([
      {
        content_type: "text",
        title: "I followed ✅",
        payload: "AP3K_FOLLOW_CHECK:automation-gate",
      },
    ]);
  });

  it("keeps the CTA URL in one button when it already appears in message copy", async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: {} });

    const messageWithCta = "Check this out https://example.com/shop";
    await sendInstagramCommentPrivateReply({
      token: VALID_TOKEN,
      igBusinessAccountId: IG_BIZ_ID,
      commentId: COMMENT_ID,
      commenterId: COMMENTER_ID,
      message: messageWithCta,
      ctaUrl: "https://example.com/shop",
    });

    const body = mockedAxios.post.mock.calls[0][1] as any;
    expect(body.message.attachment.payload.text).toBe(messageWithCta);
    expect(body.message.attachment.payload.buttons[0].url).toBe("https://example.com/shop");
  });

  it("never includes token value in returned result", async () => {
    mockedAxios.post.mockRejectedValueOnce(metaCapabilityError());

    const result = await sendInstagramCommentPrivateReply({
      token: VALID_TOKEN,
      igBusinessAccountId: IG_BIZ_ID,
      commentId: COMMENT_ID,
      commenterId: COMMENTER_ID,
      message: "Hi",
    });

    expect(JSON.stringify(result)).not.toContain(VALID_TOKEN);
  });

  it("includes safe meta error fields in failure result", async () => {
    mockedAxios.post
      .mockRejectedValueOnce(metaGenericError(190))
      .mockRejectedValueOnce(metaGenericError(190));

    const result = await sendInstagramCommentPrivateReply({
      token: VALID_TOKEN,
      igBusinessAccountId: IG_BIZ_ID,
      commentId: COMMENT_ID,
      commenterId: COMMENTER_ID,
      message: "Hi",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.metaError.status).toBe(400);
      expect(result.metaError.code).toBe(190);
      expect(result.endpoint).toBeDefined();
    }
  });
});

describe("sendInstagramDirectResponse", () => {
  it("sends text with bounded quick replies and custom payloads", async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { message_id: "mid.direct" } });

    const result = await sendInstagramDirectResponse({
      token: VALID_TOKEN,
      igBusinessAccountId: IG_BIZ_ID,
      recipientId: COMMENTER_ID,
      automationId: "automation-1",
      message: "Choose an option",
      responseFormat: "TEXT",
      quickReplies: ["I followed", "Pricing", "Book", "Help", "Ignored"],
      quickReplyPayloads: ["AP3K_FOLLOW_CHECK:automation-1"],
    });

    expect(result).toEqual({ ok: true, messageIds: ["mid.direct"] });
    const body = mockedAxios.post.mock.calls[0][1] as any;
    expect(body.recipient).toEqual({ id: COMMENTER_ID });
    expect(body.message.text).toBe("Choose an option");
    expect(body.message.quick_replies).toHaveLength(4);
    expect(body.message.quick_replies[0]).toEqual({
      content_type: "text",
      title: "I followed",
      payload: "AP3K_FOLLOW_CHECK:automation-1",
    });
  });

  it("sends rich media before the accompanying text", async () => {
    mockedAxios.post
      .mockResolvedValueOnce({ status: 200, data: { message_id: "mid.media" } })
      .mockResolvedValueOnce({ status: 200, data: { message_id: "mid.text" } });

    const result = await sendInstagramDirectResponse({
      token: VALID_TOKEN,
      igBusinessAccountId: IG_BIZ_ID,
      recipientId: COMMENTER_ID,
      automationId: "automation-2",
      message: "Here is the preview",
      responseFormat: "MEDIA",
      mediaType: "IMAGE",
      mediaUrl: "https://example.com/preview.jpg",
    });

    expect(result).toEqual({ ok: true, messageIds: ["mid.media", "mid.text"] });
    const mediaBody = mockedAxios.post.mock.calls[0][1] as any;
    const textBody = mockedAxios.post.mock.calls[1][1] as any;
    expect(mediaBody.message.attachment).toEqual({
      type: "image",
      payload: { url: "https://example.com/preview.jpg", is_reusable: true },
    });
    expect(textBody.message.text).toBe("Here is the preview");
  });

  it("sends Follow and I followed as two clickable card buttons", async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { message_id: "mid.follow-gate" } });

    const result = await sendInstagramDirectResponse({
      token: VALID_TOKEN,
      igBusinessAccountId: IG_BIZ_ID,
      recipientId: COMMENTER_ID,
      automationId: "automation-3",
      message: "Protected payload",
      followGatePrompt: { username: "ap3k", state: "INITIAL" },
    });

    expect(result).toEqual({ ok: true, messageIds: ["mid.follow-gate"] });
    const body = mockedAxios.post.mock.calls[0][1] as any;
    const card = body.message.attachment.payload.elements[0];
    expect(card.title).toBe("Follow to unlock");
    expect(card.buttons).toEqual([
      { type: "web_url", title: "Follow", url: "https://www.instagram.com/ap3k/" },
      { type: "postback", title: "I followed ✅", payload: "AP3K_FOLLOW_CHECK:automation-3" },
    ]);
  });

  it("returns the retry card when a follow still cannot be verified", async () => {
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { message_id: "mid.retry" } });

    await sendInstagramDirectResponse({
      token: VALID_TOKEN,
      igBusinessAccountId: IG_BIZ_ID,
      recipientId: COMMENTER_ID,
      automationId: "automation-4",
      message: "Protected payload",
      followGatePrompt: { username: "ap3k", state: "NOT_FOLLOWING" },
    });

    const card = (mockedAxios.post.mock.calls[0][1] as any).message.attachment.payload.elements[0];
    expect(card.title).toBe("❌ Not Following Yet!");
    expect(card.subtitle).toContain("tap I followed ✅ again");
    expect(card.buttons[1].payload).toBe("AP3K_FOLLOW_CHECK:automation-4");
  });

  it("falls back to a profile link and verification quick reply when the card is rejected", async () => {
    mockedAxios.post
      .mockRejectedValueOnce(metaGenericError(100))
      .mockResolvedValueOnce({ status: 200, data: { message_id: "mid.direct-fallback" } });

    const result = await sendInstagramDirectResponse({
      token: VALID_TOKEN,
      igBusinessAccountId: IG_BIZ_ID,
      recipientId: COMMENTER_ID,
      automationId: "automation-5",
      message: "Protected payload",
      followGatePrompt: { username: "ap3k", state: "UNAVAILABLE" },
    });

    expect(result.ok).toBe(true);
    const fallback = mockedAxios.post.mock.calls[1][1] as any;
    expect(fallback.message.text).toContain("⚠️ Verification delayed");
    expect(fallback.message.text).toContain("https://www.instagram.com/ap3k/");
    expect(fallback.message.quick_replies[0].payload).toBe("AP3K_FOLLOW_CHECK:automation-5");
  });
});

describe("Instagram follow verification", () => {
  it("sanitizes the account handle used by the Follow button", () => {
    expect(getInstagramFollowGatePromptCopy({ username: "@@ap3k<script>", state: "INITIAL" }).profileUrl)
      .toBe("https://www.instagram.com/ap3kscript/");
  });

  it("retries only is_user_follow_business when the full profile request fails", async () => {
    mockedAxios.get = vi.fn()
      .mockRejectedValueOnce(metaGenericError(100))
      .mockResolvedValueOnce({ data: { is_user_follow_business: true } }) as any;

    const profile = await getInstagramRecipientProfile({ token: VALID_TOKEN, recipientId: COMMENTER_ID });

    expect(profile?.followsBusiness).toBe(true);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(mockedAxios.get.mock.calls[1][1]).toEqual(expect.objectContaining({
      params: { fields: "is_user_follow_business" },
    }));
  });
});

describe("formatPrivateReplyError", () => {
  it("returns dm_capability_missing for capability errors", () => {
    const result = {
      ok: false as const,
      reason: "dm_capability_missing" as const,
      endpoint: "ig_messages_private_reply",
      metaError: { code: 3 },
      ctaMode: "none" as const,
    };
    expect(formatPrivateReplyError(result)).toBe("dm_capability_missing");
  });

  it("formats meta_api_error with status and code", () => {
    const result = {
      ok: false as const,
      reason: "meta_api_error" as const,
      endpoint: "ig_messages_direct_dm",
      metaError: { status: 400, code: 190, message: "Invalid token" },
      ctaMode: "none" as const,
    };
    const formatted = formatPrivateReplyError(result);
    expect(formatted).toContain("status=400");
    expect(formatted).toContain("code=190");
  });
});
