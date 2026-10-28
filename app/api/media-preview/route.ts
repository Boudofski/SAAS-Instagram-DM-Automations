import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/prisma";
import { resolveInstagramMediaConnection } from "@/lib/instagram-media";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MEDIA_FIELDS = "id,media_type,media_url,thumbnail_url";
const MAX_PREVIEW_BYTES = 20 * 1024 * 1024;

type MetaMedia = {
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
};

export function trustedInstagramPreviewUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:") return null;
    if (!host.endsWith(".cdninstagram.com") && !host.endsWith(".fbcdn.net")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function previewUrl(media: MetaMedia | null) {
  if (!media) return null;
  const video = String(media.media_type ?? "").toUpperCase() === "VIDEO";
  return trustedInstagramPreviewUrl(
    video ? media.thumbnail_url || media.media_url : media.media_url || media.thumbnail_url,
  );
}

async function refreshPreview(input: {
  postId: string;
  integrationId: string;
  integration: {
    token: string;
    instagramId: string | null;
    igAccountSource: string | null;
    oauthResolutionDiagnostics: unknown;
  };
}) {
  const connection = resolveInstagramMediaConnection([input.integration]);
  if (!connection.ok) return null;

  const url = new URL(`${connection.apiBaseUrl}/${encodeURIComponent(input.postId)}`);
  url.searchParams.set("fields", MEDIA_FIELDS);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${connection.token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  const media = await response.json().catch(() => null) as MetaMedia | null;
  if (!response.ok) return null;

  const refreshed = previewUrl(media);
  if (!refreshed) return null;
  await client.post.updateMany({
    where: {
      postid: input.postId,
      Automation: { integrationId: input.integrationId },
    },
    data: { media: refreshed },
  }).catch(() => undefined);
  return refreshed;
}

async function fetchPreview(value: string) {
  const safe = trustedInstagramPreviewUrl(value);
  if (!safe) return null;
  const response = await fetch(safe, {
    headers: { Accept: "image/avif,image/webp,image/*,*/*;q=0.8" },
    cache: "no-store",
    redirect: "follow",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok || !trustedInstagramPreviewUrl(response.url)) return null;
  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (!contentType?.startsWith("image/")) return null;
  const length = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > MAX_PREVIEW_BYTES) return null;
  return { response, contentType };
}

export async function GET(request: NextRequest) {
  const auth = await currentUser();
  if (!auth) return new NextResponse(null, { status: 401 });

  const postId = request.nextUrl.searchParams.get("postId")?.trim() ?? "";
  if (!/^\d{5,30}$/.test(postId)) return new NextResponse(null, { status: 400 });

  const post = await client.post.findFirst({
    where: { postid: postId, Automation: { User: { clerkId: auth.id } } },
    select: {
      media: true,
      Automation: {
        select: {
          integrationId: true,
          integration: {
            select: {
              token: true,
              instagramId: true,
              igAccountSource: true,
              oauthResolutionDiagnostics: true,
              status: true,
              reconnectRequired: true,
              planLocked: true,
            },
          },
        },
      },
    },
  });

  const integration = post?.Automation?.integration;
  const integrationId = post?.Automation?.integrationId;
  if (
    !post ||
    !integration ||
    !integrationId ||
    integration.status !== "CONNECTED" ||
    integration.reconnectRequired ||
    integration.planLocked
  ) {
    return new NextResponse(null, { status: 404 });
  }

  let source = trustedInstagramPreviewUrl(post.media);
  let preview = source ? await fetchPreview(source) : null;

  // A signed CDN URL can fail before its advertised expiry on a particular
  // Meta edge. Refresh once from Graph and retry through the AP3K origin.
  if (!preview) {
    source = await refreshPreview({ postId, integrationId, integration });
    preview = source ? await fetchPreview(source) : null;
  }
  if (!preview) return new NextResponse(null, { status: 404 });

  return new NextResponse(preview.response.body, {
    status: 200,
    headers: {
      "Content-Type": preview.contentType,
      "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
