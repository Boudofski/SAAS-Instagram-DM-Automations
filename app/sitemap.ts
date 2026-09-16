import { COMPANY } from "@/lib/company";
import { BLOG_POSTS } from "@/lib/blog";
import { COMMERCIAL_PAGES } from "@/lib/commercial-pages";
import type { MetadataRoute } from "next";
import { SUPPORTED_LOCALES, localizePublicPath, localeAlternates } from "@/lib/i18n/config";

const baseUrl = "https://ap3k.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date("2026-09-12T00:00:00Z");
  const companyUpdated = new Date(`${COMPANY.detailsUpdated}T00:00:00Z`);
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date("2026-09-16T00:00:00Z"), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: updated, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/blog`, lastModified: new Date("2026-09-16T00:00:00Z"), changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/contact`, lastModified: companyUpdated, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/help`, lastModified: updated, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified: companyUpdated, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: companyUpdated, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/cookies`, lastModified: companyUpdated, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/refund-policy`, lastModified: companyUpdated, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/data-deletion`, lastModified: companyUpdated, changeFrequency: "yearly", priority: 0.2 },
  ];

  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(`${post.updatedAt}T00:00:00Z`),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const commercialPages: MetadataRoute.Sitemap = [
    ...COMMERCIAL_PAGES.map((page) => ({
      url: `${baseUrl}/${page.slug}`,
      lastModified: updated,
      changeFrequency: "monthly" as const,
      priority: page.slug === "manychat-alternative" ? 0.9 : 0.85,
    })),
  ];

  return [...staticPages, ...commercialPages, ...blogPages].flatMap((page) => {
    const path = new URL(page.url).pathname;
    const languages = Object.fromEntries(Object.entries(localeAlternates(path)).map(([language, value]) => [language, `${baseUrl}${value}`]));
    return SUPPORTED_LOCALES.map((locale) => ({
      ...page,
      url: `${baseUrl}${localizePublicPath(path, locale)}`,
      alternates: { languages },
    }));
  });
}
