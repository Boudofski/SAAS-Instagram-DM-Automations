import { describe, expect, it } from "vitest";
import {
  normalizeCampaignMediaType,
  normalizeCampaignPayload,
  validateNormalizedCampaignPayload,
} from "./campaign-save";

const basePayload = {
  name: " MA GLOBAL CAMPAIGN ",
  active: true,
  triggerMode: "SPECIFIC_KEYWORD",
  matchingMode: "CONTAINS",
  post: {
    postid: "180000",
    caption: "Launch post",
    media: "https://example.com/post.jpg",
    mediaType: "IMAGE",
  },
  keywords: [" ai ", "ai", ""],
  publicReplyEnabled: true,
  listener: {
    prompt: " Hey {{first_name}} ",
    commentReply: " Sending now ",
    commentReply2: " Check DMs ",
    commentReply3: " Done ",
    ctaButtonTitle: " Get the guide ",
    ctaLink: " https://ceptice.com/ ",
  },
};

describe("normalizeCampaignPayload", () => {
  it("normalizes a specific post and specific keyword campaign payload", () => {
    const normalized = normalizeCampaignPayload(basePayload);

    expect(normalized.name).toBe("MA GLOBAL CAMPAIGN");
    expect(normalized.post.postid).toBe("180000");
    expect(normalized.keywords).toEqual(["ai"]);
    expect(normalized.listener.prompt).toBe("Hey {{first_name}}");
    expect(normalized.listener.ctaLink).toBe("https://ceptice.com/");
    expect(validateNormalizedCampaignPayload(normalized)).toBeNull();
  });

  it("allows any post with a specific keyword", () => {
    const normalized = normalizeCampaignPayload({
      ...basePayload,
      post: { postid: "ANY", media: "", mediaType: "IMAGE" },
    });

    expect(normalized.post.postid).toBe("ANY");
    expect(normalized.keywords).toEqual(["ai"]);
    expect(validateNormalizedCampaignPayload(normalized)).toBeNull();
  });

  it("allows any-comment campaigns without keywords", () => {
    const normalized = normalizeCampaignPayload({
      ...basePayload,
      triggerMode: "ANY_COMMENT",
      post: { postid: "ANY", media: "", mediaType: "IMAGE" },
      keywords: [],
    });

    expect(normalized.triggerMode).toBe("ANY_COMMENT");
    expect(normalized.keywords).toEqual([]);
    expect(validateNormalizedCampaignPayload(normalized)).toBeNull();
  });

  it("rejects specific keyword campaigns without keywords", () => {
    const normalized = normalizeCampaignPayload({ ...basePayload, keywords: [] });

    expect(validateNormalizedCampaignPayload(normalized)).toBe(
      "Specific keyword campaigns need at least one keyword."
    );
  });

  it("strips UI-only fields before Prisma", () => {
    const normalized = normalizeCampaignPayload({
      ...basePayload,
      publicReplyEnabled: false,
      aiMode: true,
    });

    expect("publicReplyEnabled" in normalized).toBe(false);
    expect("aiMode" in normalized).toBe(false);
    expect(normalized.listener.commentReply).toBeUndefined();
  });

  it("accepts the corrected carousel enum and maps the legacy typo", () => {
    expect(normalizeCampaignMediaType("CAROUSEL_ALBUM")).toBe("CAROUSEL_ALBUM");
    expect(normalizeCampaignMediaType("CAROSEL_ALBUM")).toBe("CAROUSEL_ALBUM");
  });

  it("normalizes update payloads with triggerMode", () => {
    const normalized = normalizeCampaignPayload({
      ...basePayload,
      triggerMode: "ANY_COMMENT",
      keywords: ["ignored"],
    });

    expect(normalized.triggerMode).toBe("ANY_COMMENT");
    expect(normalized.keywords).toEqual([]);
  });
});
