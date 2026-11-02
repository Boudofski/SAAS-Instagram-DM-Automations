import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/editorial-server";
import { buildSitemap } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap(await getPublishedPosts());
}
