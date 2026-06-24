"use server";

import { currentUser } from "@clerk/nextjs/server";
import { client } from "@/lib/prisma";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";

type PagePost = {
  id: string;
  message: string | null;
  createdTime: string | null;
  permalinkUrl: string | null;
};

type MetaPost = {
  id?: string;
  message?: string;
  created_time?: string;
  permalink_url?: string;
};

export async function getCurrentPageEngagementPreview() {
  const user = await currentUser();
  if (!user) return { status: 401 as const, data: null };

  const record = await client.user.findUnique({
    where: { clerkId: user.id },
    select: {
      integrations: {
        where: { name: "INSTAGRAM" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          token: true,
          pageId: true,
          pageName: true,
          instagramId: true,
          instagramUsername: true,
          status: true,
          disconnectedAt: true,
          reconnectRequired: true,
        },
      },
    },
  });

  const integration = getCanonicalInstagramIntegration(record?.integrations);
  if (!integration?.pageId || !integration.token) {
    return { status: 404 as const, data: null };
  }

  const url = new URL(`https://graph.facebook.com/v25.0/${integration.pageId}/posts`);
  url.searchParams.set("fields", "id,message,created_time,permalink_url");
  url.searchParams.set("limit", "3");
  url.searchParams.set("access_token", integration.token);

  try {
    const response = await fetch(url, { cache: "no-store" });
    const payload = (await response.json()) as {
      data?: MetaPost[];
      error?: { message?: string; code?: number };
    };

    if (!response.ok) {
      console.warn("[app-review] Page content retrieval failed", {
        pageIdPresent: true,
        status: response.status,
        metaCode: payload.error?.code ?? null,
      });
      return {
        status: 502 as const,
        data: {
          pageId: integration.pageId,
          pageName: integration.pageName ?? "Facebook Page",
          posts: [] as PagePost[],
          retrievalStatus: "failed" as const,
        },
      };
    }

    const posts: PagePost[] = (payload.data ?? []).map((post) => ({
      id: post.id ?? "unknown",
      message: post.message ?? null,
      createdTime: post.created_time ?? null,
      permalinkUrl: post.permalink_url ?? null,
    }));

    return {
      status: 200 as const,
      data: {
        pageId: integration.pageId,
        pageName: integration.pageName ?? "Facebook Page",
        posts,
        retrievalStatus: "success" as const,
      },
    };
  } catch (error) {
    console.warn("[app-review] Page content retrieval request failed", {
      pageIdPresent: true,
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return {
      status: 502 as const,
      data: {
        pageId: integration.pageId,
        pageName: integration.pageName ?? "Facebook Page",
        posts: [] as PagePost[],
        retrievalStatus: "failed" as const,
      },
    };
  }
}
