import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCurrentUser = vi.fn();
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
  getIntegrations: vi.fn(),
  getWebhookHealthForUser: vi.fn(),
  recordIntegrationOAuthError: vi.fn(),
  softDisconnectIntegrationForUser: (...args: any[]) => mockSoftDisconnectIntegrationForUser(...args),
  updateIntegration: vi.fn(),
}));

import { disconnectCurrentInstagramIntegration } from "./index";

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
