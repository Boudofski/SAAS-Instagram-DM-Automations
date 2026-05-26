import { describe, expect, it } from "vitest";
import { getAuthenticatedLandingRedirect, getDashboardSlugRedirect } from "@/lib/landing-redirect";

describe("authenticated landing redirect", () => {
  it("redirects an authenticated user with a dashboard slug to dashboard", () => {
    expect(
      getAuthenticatedLandingRedirect(
        { id: "clerk-a" },
        { clerkId: "workspace-a" }
      )
    ).toBe("/dashboard/workspace-a");
  });

  it("leaves logged-out users on the public landing page", () => {
    expect(getAuthenticatedLandingRedirect(null, null)).toBeNull();
  });

  it("sends authenticated users without a workspace to onboarding connect", () => {
    expect(getAuthenticatedLandingRedirect({ id: "clerk-a" }, null)).toBe("/onboarding/connect");
  });
});

describe("dashboard slug redirect", () => {
  it("sends logged-out dashboard visitors to sign-in once", () => {
    expect(getDashboardSlugRedirect({ requestedSlug: "user-a" })).toBe("/sign-in");
  });

  it("sends authenticated users without a local profile to the dashboard bootstrap", () => {
    expect(getDashboardSlugRedirect({ clerkUserId: "user-a", requestedSlug: "user-a" })).toBe("/dashboard");
  });

  it("keeps authenticated users on their own dashboard slug", () => {
    expect(
      getDashboardSlugRedirect({
        clerkUserId: "user-a",
        profileClerkId: "user-a",
        requestedSlug: "user-a",
      })
    ).toBeNull();
  });

  it("redirects slug mismatches to the authenticated user's dashboard", () => {
    expect(
      getDashboardSlugRedirect({
        clerkUserId: "user-a",
        profileClerkId: "user-a",
        requestedSlug: "other",
      })
    ).toBe("/dashboard/user-a");
  });
});
