import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
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
    expect(normalized.sendPrivateDm).toBe(true);
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

  it("defaults undefined sendPrivateDm to true for existing campaign behavior", () => {
    const normalized = normalizeCampaignPayload({
      ...basePayload,
      sendPrivateDm: undefined,
    });

    expect(normalized.sendPrivateDm).toBe(true);
    expect(validateNormalizedCampaignPayload(normalized)).toBeNull();
  });

  it("requires a DM message when sendPrivateDm is true", () => {
    const normalized = normalizeCampaignPayload({
      ...basePayload,
      sendPrivateDm: true,
      listener: { ...basePayload.listener, prompt: " " },
    });

    expect(validateNormalizedCampaignPayload(normalized)).toBe("Campaign needs a DM message.");
  });

  it("allows an empty DM message when sendPrivateDm is false and public reply is enabled", () => {
    const normalized = normalizeCampaignPayload({
      ...basePayload,
      sendPrivateDm: false,
      listener: { ...basePayload.listener, prompt: " ", ctaLink: "https://ignored.test" },
    });

    expect(normalized.sendPrivateDm).toBe(false);
    expect(normalized.listener.prompt).toBe("");
    expect(normalized.listener.ctaLink).toBeUndefined();
    expect(validateNormalizedCampaignPayload(normalized)).toBeNull();
  });

  it("rejects campaigns that would do nothing when private DM and public reply are both disabled", () => {
    const normalized = normalizeCampaignPayload({
      ...basePayload,
      sendPrivateDm: false,
      publicReplyEnabled: false,
      listener: { ...basePayload.listener, prompt: "" },
    });

    expect(validateNormalizedCampaignPayload(normalized)).toBe(
      "Enable public reply or private DM before activating this campaign."
    );
  });
});

describe("sendPrivateDm migration contract", () => {
  it("adds sendPrivateDm with default true and DM_SKIPPED event type", () => {
    const migration = readFileSync(
      "prisma/migrations/20260518024500_add_send_private_dm_to_automation/migration.sql",
      "utf8"
    );

    expect(migration).toContain('"sendPrivateDm" BOOLEAN NOT NULL DEFAULT true');
    expect(migration).toContain("'DM_SKIPPED'");
  });
});
