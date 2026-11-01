import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: (handler: unknown) => handler,
  createRouteMatcher: (patterns: string[]) => (request: NextRequest) => patterns.some((pattern) => {
    const prefix = pattern.replace("(.*)", "");
    return request.nextUrl.pathname.startsWith(prefix);
  }),
}));
import middleware from "../middleware";
const run = middleware as unknown as (auth: unknown, req: NextRequest) => Promise<Response>;
function request(path: string, method = "GET") {
  return new NextRequest(`https://ap3k.com${path}`, {method, headers:{cookie:"ap3k_locale=en"}});
}
function localizedRequest(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`https://ap3k.com${path}`, {
    headers: { "user-agent": "Mozilla/5.0 Safari/605.1", ...headers },
  });
}
function session(userId: string | null = "user_123") {
  return Object.assign(vi.fn(async () => ({userId})), {protect:vi.fn(async () => {})});
}
describe("dashboard entry routing", () => {
  it("lets the dashboard entry page provision an authenticated workspace", async () => {
    const auth = session(); const response = await run(auth,request("/dashboard"));
    expect(auth).toHaveBeenCalledOnce();
    expect(auth.protect).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBeNull();
  });
  it("sends signed-out browser pages to AP3K's branded sign-in", async () => {
    const auth = session(null);
    const response = await run(auth, request("/dashboard?next=%2Fbilling"));
    expect(response.headers.get("location")).toBe("https://ap3k.com/sign-in?next=%2Fdashboard%3Fnext%3D%252Fbilling");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(auth.protect).not.toHaveBeenCalled();
  });
  it("retains Clerk's protection semantics for payment APIs", async () => {
    const auth = session(null);
    auth.protect.mockRejectedValue(new Error("unauthenticated"));
    await expect(run(auth, request("/api/payment/checkout"))).rejects.toThrow("unauthenticated");
    expect(auth.protect).toHaveBeenCalledOnce();
  });
  it("leaves authenticated canonical pages and server-action POST requests to their handlers", async () => {
    for (const req of [request("/dashboard/user_123"), request("/dashboard", "POST")]) {
      expect((await run(session(),req)).headers.get("location")).toBeNull();
    }
  });
  it("sends a first-time Arabic browser to the Arabic homepage and remembers it", async () => {
    const response = await run(session(null), localizedRequest("/", { "accept-language": "ar-MA,ar;q=0.9,fr;q=0.7" }));
    expect(response.headers.get("location")).toBe("https://ap3k.com/ar");
    expect(response.headers.get("set-cookie")).toContain("ap3k_locale=ar");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("respects a visitor's saved language instead of overriding it", async () => {
    const response = await run(session(null), localizedRequest("/", { cookie: "ap3k_locale=fr", "accept-language": "ar-MA,ar;q=0.9" }));
    expect(response.headers.get("location")).toBeNull();
  });
  it("serves Arabic paths with RTL locale context and no redirect loop", async () => {
    const response = await run(session(null), localizedRequest("/ar"));
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBe("https://ap3k.com/");
  });
  it("keeps the bespoke Arabic comment-to-DM campaign at its physical route", async () => {
    const response = await run(session(null), localizedRequest("/ar/instagram-comment-to-dm"));
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
  });
});
