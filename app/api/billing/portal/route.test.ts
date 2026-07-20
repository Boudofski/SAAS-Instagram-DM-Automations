import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockCurrentUser = vi.fn();
const mockUserFindUnique = vi.fn();
const mockPortalCreate = vi.fn();

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: (...args: unknown[]) => mockCurrentUser(...args),
}));

vi.mock("@/lib/prisma", () => ({
  client: {
    user: { findUnique: (...args: unknown[]) => mockUserFindUnique(...args) },
  },
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    billingPortal: {
      sessions: { create: (...args: unknown[]) => mockPortalCreate(...args) },
    },
  },
}));

import { POST } from "@/app/api/billing/portal/route";

function portalRequest(body?: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/billing/portal", {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("Stripe Customer Portal route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_configured");
    vi.stubEnv("STRIPE_CLIENT_SECRET", "");
    vi.stubEnv("NEXT_PUBLIC_HOST_URL", "https://preview.ap3k.test/");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("VERCEL_URL", "");
    mockCurrentUser.mockResolvedValue({ id: "clerk-user-a" });
    mockUserFindUnique.mockResolvedValue({
      clerkId: "clerk-user-a",
      subscription: { customerId: "cus_owned_by_a" },
    });
    mockPortalCreate.mockResolvedValue({ url: "https://billing.stripe.test/session-a" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects unauthenticated requests", async () => {
    mockCurrentUser.mockResolvedValue(null);

    const response = await POST(portalRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "not_authenticated" } });
    expect(mockUserFindUnique).not.toHaveBeenCalled();
    expect(mockPortalCreate).not.toHaveBeenCalled();
  });

  it("returns a safe error when the authenticated AP3K user is missing", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const response = await POST(portalRequest());

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "user_not_found" } });
    expect(mockPortalCreate).not.toHaveBeenCalled();
  });

  it("does not create a session without a linked Stripe customer", async () => {
    mockUserFindUnique.mockResolvedValue({ clerkId: "clerk-user-a", subscription: { customerId: null } });

    const response = await POST(portalRequest());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "customer_not_linked" } });
    expect(mockPortalCreate).not.toHaveBeenCalled();
  });

  it("uses only the authenticated user's stored Stripe customer", async () => {
    const response = await POST(portalRequest());

    expect(response.status).toBe(200);
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { clerkId: "clerk-user-a" },
      select: { clerkId: true, subscription: { select: { customerId: true } } },
    });
    expect(mockPortalCreate).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_owned_by_a" }));
  });

  it("returns to the authenticated user's AP3K Billing page", async () => {
    await POST(portalRequest());

    expect(mockPortalCreate).toHaveBeenCalledWith({
      customer: "cus_owned_by_a",
      return_url: "https://preview.ap3k.test/dashboard/clerk-user-a/billing",
    });
  });

  it("ignores browser-supplied customer and user identifiers", async () => {
    await POST(portalRequest({
      customerId: "cus_attacker_selected",
      userId: "user-b",
      clerkId: "clerk-user-b",
      email: "other@example.com",
      returnUrl: "https://evil.example",
    }));

    expect(mockPortalCreate).toHaveBeenCalledWith(expect.objectContaining({
      customer: "cus_owned_by_a",
      return_url: "https://preview.ap3k.test/dashboard/clerk-user-a/billing",
    }));
    expect(JSON.stringify(mockPortalCreate.mock.calls)).not.toContain("cus_attacker_selected");
    expect(JSON.stringify(mockPortalCreate.mock.calls)).not.toContain("evil.example");
  });

  it("cannot cross into another user's customer portal", async () => {
    await POST(portalRequest({ customerId: "cus_owned_by_b" }));

    expect(mockUserFindUnique.mock.calls[0][0].where).toEqual({ clerkId: "clerk-user-a" });
    expect(mockPortalCreate).toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_owned_by_a" }));
    expect(mockPortalCreate).not.toHaveBeenCalledWith(expect.objectContaining({ customer: "cus_owned_by_b" }));
  });

  it("returns a safe failure when Stripe rejects portal creation", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockPortalCreate.mockRejectedValue({ type: "StripeInvalidRequestError", code: "resource_missing" });

    const response = await POST(portalRequest());

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "portal_session_failed" } });
  });

  it("reports Stripe as unavailable when server configuration is missing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("STRIPE_CLIENT_SECRET", "");

    const response = await POST(portalRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ error: { code: "stripe_unavailable" } });
    expect(mockPortalCreate).not.toHaveBeenCalled();
  });
});
