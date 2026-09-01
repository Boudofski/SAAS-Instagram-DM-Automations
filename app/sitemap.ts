import { BLOG_POSTS } from "@/lib/blog";
import type { MetadataRoute } from "next";

const baseUrl = "https://ap3k.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date("2026-09-01T00:00:00Z");
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: updated, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: updated, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: updated, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/contact`, lastModified: updated, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/privacy`, lastModified: updated, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: updated, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/data-deletion`, lastModified: updated, changeFrequency: "yearly", priority: 0.2 },
  ];

  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(`${post.updatedAt}T00:00:00Z`),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticPages, ...blogPages];
}
