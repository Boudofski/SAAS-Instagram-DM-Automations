import { describe, expect, it } from "vitest";
import {
  classifyDeliveryError,
  getTopAdminIssue,
  sanitizeAdminPayload,
  stripeCustomerDashboardUrl,
} from "./admin-control-center";

describe("admin control center helpers", () => {
  it("redacts sensitive payload fields recursively", () => {
    const sanitized = sanitizeAdminPayload({
      access_token: "EAAB-secret",
      nested: {
        pageAccessToken: "page-secret",
        safeId: "1784",
      },
      events: [{ authorization: "Bearer abc", commentId: "c1" }],
    });

    expect(JSON.stringify(sanitized)).not.toContain("EAAB-secret");
    expect(JSON.stringify(sanitized)).not.toContain("Bearer abc");
    expect(sanitized).toMatchObject({
      access_token: "[redacted]",
      nested: { pageAccessToken: "[redacted]", safeId: "1784" },
      events: [{ authorization: "[redacted]", commentId: "c1" }],
    });
  });

  it("classifies dm_capability_missing as a Meta capability issue", () => {
    expect(classifyDeliveryError("dm_capability_missing")).toMatchObject({
      label: "Meta capability missing",
      tone: "red",
    });
    expect(classifyDeliveryError("token_missing")).toMatchObject({
      label: "Reconnect account",
      tone: "amber",
    });
    expect(classifyDeliveryError("external_dm_tool_enabled")).toMatchObject({
      label: "Skipped — external DM tool enabled",
      tone: "amber",
    });
    expect(classifyDeliveryError("static_reply_limit_reached")).toMatchObject({
      label: "Skipped — monthly reply limit reached",
      tone: "amber",
    });
  });

  it("keeps subscription management read-only with Stripe customer links", () => {
    expect(stripeCustomerDashboardUrl("cus_123")).toBe(
      "https://dashboard.stripe.com/customers/cus_123"
    );
    expect(stripeCustomerDashboardUrl(null)).toBeNull();
  });

  it("ranks the most urgent top admin issue", () => {
    expect(
      getTopAdminIssue({
        lastPostRaw: null,
        signatureFailures24h: 0,
        dmCapabilityMissing: false,
        tokenMissingFailures24h: 0,
        dmFailed24h: 0,
        activeCampaigns: 1,
      })
    ).toMatchObject({ label: "No real webhook delivered yet", tone: "red" });

    expect(
      getTopAdminIssue({
        lastPostRaw: {},
        signatureFailures24h: 0,
        dmCapabilityMissing: false,
        tokenMissingFailures24h: 0,
        dmFailed24h: 0,
        activeCampaigns: 1,
      })
    ).toMatchObject({ label: "No active issue", tone: "green" });
  });
});
