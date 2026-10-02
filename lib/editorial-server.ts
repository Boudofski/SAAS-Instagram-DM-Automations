import "server-only";
import { unstable_cache } from "next/cache";
import { BLOG_POSTS } from "@/lib/blog";
import { client } from "@/lib/prisma";
import { mergeEditorialPosts } from "@/lib/editorial";

export const getPublishedPosts = unstable_cache(
  async () => {
    const rows = await client.editorialPost.findMany({
      select: { slug: true, published: true, hidden: true },
    });
    return mergeEditorialPosts(BLOG_POSTS, rows).map(post => ({ ...post, author: "AP3K" }));
  },
  ["editorial-published-v2"],
  { revalidate: 60, tags: ["editorial"] },
);

export async function getPublishedPost(slug: string) {
  return (await getPublishedPosts()).find((p) => p.slug === slug) || null;
}
