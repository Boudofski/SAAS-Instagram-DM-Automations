import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCurrentUser = vi.fn();
const mockGetIntegrations = vi.fn();
const mockGetRecentFacebookPagePosts = vi.fn();
const mockSoftDisconnectIntegrationForUser = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: (...args: any[]) => mockCurrentUser(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: any[]) => mockRevalidatePath(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/fetch", () => ({
  formatSafeMetaError: vi.fn(),
  generateToken: vi.fn(),
  debugPageToken: vi.fn(),
  getEligibleFacebookInstagramAccounts: vi.fn(),
  getRecentFacebookPagePosts: (...args: any[]) => mockGetRecentFacebookPagePosts(...args),
  getSafeMetaError: vi.fn(() => ({})),
  subscribeInstagramWebhooks: vi.fn(),
}));

vi.mock("@/lib/instagram-profile-snapshot", () => ({
  refreshInstagramProfileSnapshotForUser: vi.fn(),
}));

vi.mock("@/lib/account-webhook-diagnostics", () => ({
  planReconnectCleanup: vi.fn(),
}));

vi.mock("@/lib/campaign-health", () => ({
  planReconnectCampaignImpact: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  client: {},
}));

vi.mock("./queries", () => ({
  createIntegration: vi.fn(),
  createMetaOAuthSelection: vi.fn(),
  deleteMetaOAuthSelection: vi.fn(),
  getLatestMetaOAuthSelection: vi.fn(),
  getIntegrations: (...args: any[]) => mockGetIntegrations(...args),
  getWebhookHealthForUser: vi.fn(),
  recordIntegrationOAuthError: vi.fn(),
  softDisconnectIntegrationForUser: (...args: any[]) => mockSoftDisconnectIntegrationForUser(...args),
  updateIntegration: vi.fn(),
}));

import {
  disconnectCurrentInstagramIntegration,
  getRecentSelectedFacebookPageContent,
} from "./index";

describe("disconnectCurrentInstagramIntegration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: "clerk-user-1" });
    mockSoftDisconnectIntegrationForUser.mockResolvedValue({ id: "integration-1", pausedCampaigns: 1 });
  });

  it("returns success and revalidates dashboard, account, integrations, automation, and onboarding paths", async () => {
    await expect(disconnectCurrentInstagramIntegration()).resolves.toEqual({
      status: 200,
      data: "Instagram account disconnected",
    });

    expect(mockSoftDisconnectIntegrationForUser).toHaveBeenCalledWith("clerk-user-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard", "layout");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/clerk-user-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/clerk-user-1/account");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/clerk-user-1/integrations");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/clerk-user-1/automation");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard/clerk-user-1/automation", "layout");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/onboarding/connect");
  });

  it("does not revalidate when no usable Instagram integration is connected", async () => {
    mockSoftDisconnectIntegrationForUser.mockResolvedValue(null);

    await expect(disconnectCurrentInstagramIntegration()).resolves.toEqual({
      status: 404,
      data: "No Instagram account connected",
    });

    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});

describe("getRecentSelectedFacebookPageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: "clerk-user-1" });
    mockGetIntegrations.mockResolvedValue({
      integrations: [
        {
          id: "integration-1",
          name: "INSTAGRAM",
          status: "CONNECTED",
          reconnectRequired: false,
          token: "page-access-token-that-is-long-enough",
          pageId: "page-123",
          pageName: "AP3k Test Page",
          instagramId: "ig-456",
          instagramUsername: "ap3k_test",
          createdAt: new Date("2026-06-25T10:00:00Z"),
        },
      ],
    });
    mockGetRecentFacebookPagePosts.mockResolvedValue([
      {
        id: "page-123_post-1",
        message: "A real Page post",
        createdTime: "2026-06-25T10:00:00+0000",
      },
    ]);
  });

  it("uses the stored Page token server-side and returns only Page identity and post fields", async () => {
    const result = await getRecentSelectedFacebookPageContent();

    expect(mockGetRecentFacebookPagePosts).toHaveBeenCalledWith(
      "page-123",
      "page-access-token-that-is-long-enough"
    );
    expect(result).toEqual({
      status: 200,
      data: {
        pageId: "page-123",
        pageName: "AP3k Test Page",
        posts: [
          {
            id: "page-123_post-1",
            message: "A real Page post",
            createdTime: "2026-06-25T10:00:00+0000",
          },
        ],
      },
      error: null,
    });
    expect(JSON.stringify(result)).not.toContain("page-access-token");
  });
});
