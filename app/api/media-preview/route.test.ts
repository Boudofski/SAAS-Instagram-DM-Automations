import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  findPost: vi.fn(),
  updatePosts: vi.fn(),
  resolveConnection: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: (...args: any[]) => mocks.currentUser(...args),
}));

vi.mock("@/lib/prisma", () => ({
  client: {
    post: {
      findFirst: (...args: any[]) => mocks.findPost(...args),
      updateMany: (...args: any[]) => mocks.updatePosts(...args),
    },
  },
}));

vi.mock("@/lib/instagram-media", () => ({
  resolveInstagramMediaConnection: (...args: any[]) => mocks.resolveConnection(...args),
}));

import { GET } from "./route";

function upstream(input: { ok: boolean; url: string; contentType?: string; json?: unknown; body?: string }) {
  return {
    ok: input.ok,
    status: input.ok ? 200 : 403,
    url: input.url,
    headers: new Headers(input.contentType ? { "content-type": input.contentType } : {}),
    body: new Response(input.body ?? "").body,
    json: vi.fn(async () => input.json ?? null),
  };
}

describe("authenticated Instagram media preview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentUser.mockResolvedValue({ id: "clerk-user" });
    mocks.updatePosts.mockResolvedValue({ count: 1 });
    mocks.findPost.mockResolvedValue({
      media: "https://old.cdninstagram.com/image.jpg",
      Automation: {
        integrationId: "integration-a",
        integration: {
          token: "secret-token",
          instagramId: "ig-a",
          igAccountSource: "instagram_login",
          oauthResolutionDiagnostics: null,
          status: "CONNECTED",
          reconnectRequired: false,
          planLocked: false,
        },
      },
    });
    mocks.resolveConnection.mockReturnValue({
      ok: true,
      token: "secret-token",
      instagramBusinessAccountId: "ig-a",
      apiBaseUrl: "https://graph.instagram.com/v25.0",
      apiFamily: "instagram_graph",
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("refreshes a failed CDN URL and serves the image through AP3K", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(upstream({ ok: false, url: "https://old.cdninstagram.com/image.jpg" }))
      .mockResolvedValueOnce(upstream({
        ok: true,
        url: "https://graph.instagram.com/v25.0/123456789",
        json: { media_type: "IMAGE", media_url: "https://fresh.cdninstagram.com/image.jpg" },
      }))
      .mockResolvedValueOnce(upstream({
        ok: true,
        url: "https://fresh.cdninstagram.com/image.jpg",
        contentType: "image/jpeg",
        body: "image-bytes",
      }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(new NextRequest("https://ap3k.com/api/media-preview?postId=123456789"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(mocks.updatePosts).toHaveBeenCalledWith({
      where: { postid: "123456789", Automation: { integrationId: "integration-a" } },
      data: { media: "https://fresh.cdninstagram.com/image.jpg" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("requires authentication and validates the post id", async () => {
    mocks.currentUser.mockResolvedValueOnce(null);
    expect((await GET(new NextRequest("https://ap3k.com/api/media-preview?postId=123456789"))).status).toBe(401);

    mocks.currentUser.mockResolvedValueOnce({ id: "clerk-user" });
    expect((await GET(new NextRequest("https://ap3k.com/api/media-preview?postId=not-a-post"))).status).toBe(400);
  });
});
