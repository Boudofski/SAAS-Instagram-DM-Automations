import { describe, expect, it } from "vitest";
import { getAuthenticatedLandingRedirect } from "@/lib/landing-redirect";

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
