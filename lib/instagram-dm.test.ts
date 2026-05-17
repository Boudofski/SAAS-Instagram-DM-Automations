import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";

// Mock axios before importing the module under test
vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

import {
  sendInstagramCommentPrivateReply,
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
  mockedAxios.isAxiosError = (e: unknown): e is any => Boolean((e as any)?.isAxiosError);
  mockedAxios.post = vi.fn();
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

    const [url, body] = mockedAxios.post.mock.calls[0];
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

  it("appends CTA URL as text fallback when ctaUrl is provided", async () => {
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
    if (result.ok) expect(result.ctaMode).toBe("text_link_fallback");

    const body = mockedAxios.post.mock.calls[0][1] as any;
    expect(body.message.text).toContain("https://example.com/shop");
    expect(body.message.text).toContain("Shop now");
  });

  it("does not double-append CTA if already in the message", async () => {
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
    const occurrences = (body.message.text.match(/example\.com\/shop/g) ?? []).length;
    expect(occurrences).toBe(1);
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
