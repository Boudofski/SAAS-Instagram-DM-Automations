import { beforeEach, describe, expect, it, vi } from "vitest";

const mockIntegrationFindMany = vi.fn();
const mockIntegrationFindFirst = vi.fn();
const mockIntegrationUpdate = vi.fn();
const mockAutomationFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  client: {
    integrations: {
      findMany: (...args: any[]) => mockIntegrationFindMany(...args),
      findFirst: (...args: any[]) => mockIntegrationFindFirst(...args),
      update: (...args: any[]) => mockIntegrationUpdate(...args),
    },
    automation: {
      findMany: (...args: any[]) => mockAutomationFindMany(...args),
    },
  },
}));

import {
  findAutomationForCommentWithReason,
  normalizeInstagramMediaId,
} from "@/actions/webhook/queries";

function automation(overrides: Record<string, any> = {}) {
  return {
    id: overrides.id ?? "automation-1",
    name: overrides.name ?? "Campaign",
    active: overrides.active ?? true,
    matchingMode: overrides.matchingMode ?? "CONTAINS",
    triggerMode: overrides.triggerMode ?? "SPECIFIC_KEYWORD",
    posts: overrides.posts ?? [{ postid: "ANY" }],
    keywords: overrides.keywords ?? [{ word: "ai" }],
    listener: overrides.listener ?? { prompt: "Hello" },
    User: {
      subscription: null,
      integrations: [{ id: "integration-1", token: "token", instagramId: "ig-1", pageId: "page-1" }],
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIntegrationFindMany.mockResolvedValue([
    { id: "integration-1", userId: "user-1", instagramId: "ig-1", webhookAccountId: "ig-1", pageId: "page-1", businessId: null },
  ]);
  mockIntegrationFindFirst.mockResolvedValue({
    id: "integration-1",
    userId: "user-1",
    instagramId: "ig-1",
    webhookAccountId: "ig-1",
    pageId: "page-1",
    businessId: null,
  });
});

describe("normalizeInstagramMediaId", () => {
  it("keeps ANY as the wildcard and normalizes URL media ids", () => {
    expect(normalizeInstagramMediaId("ANY")).toBe("ANY");
    expect(normalizeInstagramMediaId(" https://instagram.com/p/180123/ ")).toBe("180123");
  });
});

describe("findAutomationForCommentWithReason", () => {
  it("returns ANY_COMMENT candidates with no keywords for ANY post", async () => {
    mockAutomationFindMany.mockResolvedValue([
      automation({ id: "any-comment", triggerMode: "ANY_COMMENT", keywords: [], posts: [{ postid: "ANY" }] }),
    ]);

    const result = await findAutomationForCommentWithReason("media-1", "ig-1");

    expect(result.automations.map((item) => item.id)).toEqual(["any-comment"]);
    expect(result.failureReason).toBeUndefined();
    expect((result.diagnostics as any).matchedAutomationIds).toEqual(["any-comment"]);
  });

  it("matches a specific post only when the incoming media id is the selected post", async () => {
    mockAutomationFindMany.mockResolvedValue([
      automation({ id: "specific", posts: [{ postid: "media-2" }] }),
    ]);

    const matched = await findAutomationForCommentWithReason("media-2", "ig-1");
    const missed = await findAutomationForCommentWithReason("media-1", "ig-1");

    expect(matched.automations.map((item) => item.id)).toEqual(["specific"]);
    expect(missed.automations).toEqual([]);
    expect(missed.failureReason).toBe("no_active_automation_for_media");
  });

  it("returns all active media-scoped candidates so triggerMode can be selected after DB lookup", async () => {
    mockAutomationFindMany.mockResolvedValue([
      automation({ id: "keyword", triggerMode: "SPECIFIC_KEYWORD", keywords: [{ word: "ai" }] }),
      automation({ id: "any-comment", triggerMode: "ANY_COMMENT", keywords: [] }),
      automation({ id: "paused", active: false, triggerMode: "ANY_COMMENT", keywords: [] }),
    ]);

    const result = await findAutomationForCommentWithReason("media-1", "ig-1");

    expect(result.automations.map((item) => item.id)).toEqual(["keyword", "any-comment"]);
    expect((result.diagnostics as any).matchedAutomationIds).toEqual(["keyword", "any-comment"]);
  });

  it("checks every matching integration owner and prefers the newest matching account automation", async () => {
    mockIntegrationFindMany
      .mockResolvedValueOnce([
        { id: "old-integration", userId: "old-user", instagramId: "ig-1", webhookAccountId: "ig-1", pageId: "page-1", businessId: null },
        { id: "new-integration", userId: "new-user", instagramId: "ig-1", webhookAccountId: "ig-1", pageId: "page-1", businessId: null },
      ])
      .mockResolvedValueOnce([
        { id: "new-integration", userId: "new-user", instagramId: "ig-1", webhookAccountId: "ig-1", pageId: "page-1", businessId: null },
        { id: "old-integration", userId: "old-user", instagramId: "ig-1", webhookAccountId: "ig-1", pageId: "page-1", businessId: null },
      ]);
    mockAutomationFindMany
      .mockResolvedValueOnce([
        automation({ id: "new-user-campaign", posts: [{ postid: "media-1" }] }),
      ])
      .mockResolvedValueOnce([
        automation({ id: "old-user-campaign", posts: [{ postid: "media-1" }] }),
      ]);

    const result = await findAutomationForCommentWithReason("media-1", "ig-1");

    expect(mockAutomationFindMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: expect.objectContaining({ userId: "new-user" }) })
    );
    expect(result.automation?.id).toBe("new-user-campaign");
    expect(result.automations.map((item) => item.id)).toEqual(["new-user-campaign", "old-user-campaign"]);
    expect((result.diagnostics as any).matchingIntegrationIds).toEqual(["new-integration", "old-integration"]);
    expect((result.diagnostics as any).matchedIntegrationId).toBe("new-integration");
  });
});
