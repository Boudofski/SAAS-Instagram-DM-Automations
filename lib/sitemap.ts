import { COMPANY } from "@/lib/company";
import { AP3K_HELP_ARTICLES } from "@/lib/ap3k-help";
import { BLOG_POSTS } from "@/lib/blog";
import type { BlogPost } from "@/lib/blog";
import { COMMERCIAL_PAGES } from "@/lib/commercial-pages";
import { SEO_RESOURCES } from "@/lib/seo-resources";
import { BLOG_PAGE_SIZE, blogPagePath } from "@/lib/blog-pagination";
import type { MetadataRoute } from "next";
import {
  SUPPORTED_LOCALES,
  isEnglishOnlyArticle,
  localizePublicPath,
  localeAlternates,
} from "@/lib/i18n/config";

const baseUrl = "https://ap3k.com";

export function buildSitemap(
  posts: BlogPost[] = BLOG_POSTS,
): MetadataRoute.Sitemap {
  const updated = new Date("2026-09-12T00:00:00Z");
  // Significant public-copy and navigation updates shipped on this date.
  // Keep this fixed to the release date; never stamp every crawl with today.
  const publicContentUpdated = new Date("2026-09-23T00:00:00Z");
  const companyUpdated = new Date(`${COMPANY.detailsUpdated}T00:00:00Z`);
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: publicContentUpdated,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: updated,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date("2026-09-24T00:00:00Z"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: companyUpdated,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date("2026-09-20T00:00:00Z"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: companyUpdated,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: companyUpdated,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: companyUpdated,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: companyUpdated,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/data-deletion`,
      lastModified: companyUpdated,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const blogPages: MetadataRoute.Sitemap = posts
    .filter((post) => !post.noIndex)
    .map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      // Only report the article's real editorial update. Site-wide releases are
      // not meaningful article changes and must not refresh every lastmod value.
      lastModified: new Date(`${post.updatedAt}T00:00:00Z`),
      changeFrequency: "monthly",
      priority: 0.8,
    }));

  // Paginated archives are canonical discovery pages in their own right.
  // Listing pages 2+ closes the crawl gap reported by Ahrefs and gives every
  // article a sitemap-backed route without pretending query variants are duplicates.
  const blogArchivePages: MetadataRoute.Sitemap = Array.from(
    { length: Math.max(0, Math.ceil(posts.length / BLOG_PAGE_SIZE) - 1) },
    (_, index) => ({
      url: `${baseUrl}${blogPagePath(index + 2)}`,
      lastModified: new Date("2026-09-24T00:00:00Z"),
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }),
  );

  const commercialPages: MetadataRoute.Sitemap = [
    ...COMMERCIAL_PAGES.map((page) => ({
      url: `${baseUrl}/${page.slug}`,
      lastModified: page.updatedAt ? new Date(`${page.updatedAt}T00:00:00Z`) : publicContentUpdated,
      changeFrequency: "monthly" as const,
      priority: page.slug === "manychat-alternative" ? 0.9 : 0.85,
    })),
  ];

  const helpPages: MetadataRoute.Sitemap = AP3K_HELP_ARTICLES.map(
    (article) => ({
      url: `${baseUrl}/help/${article.slug}`,
      lastModified: new Date("2026-09-20T00:00:00Z"),
      changeFrequency: "monthly",
      priority: 0.7,
    }),
  );

  const resourcePages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/resources/instagram-growth-library`, lastModified: new Date("2026-09-24T00:00:00Z"), changeFrequency: "weekly", priority: 0.85 },
    {
      url: `${baseUrl}/resources`,
      lastModified: new Date("2026-09-22T00:00:00Z"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...SEO_RESOURCES.map((resource) => ({
      url: `${baseUrl}/resources/${resource.slug}`,
      lastModified: new Date("2026-09-22T00:00:00Z"),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${baseUrl}/tools/instagram-comment-to-dm-calculator`,
      lastModified: new Date("2026-09-22T00:00:00Z"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  return [
    ...staticPages,
    ...commercialPages,
    ...blogArchivePages,
    ...blogPages,
    ...helpPages,
    ...resourcePages,
  ].flatMap((page) => {
    const parsed = new URL(page.url);
    const path = `${parsed.pathname}${parsed.search}`;
    const englishOnly =
      isEnglishOnlyArticle(path) ||
      posts.some(
        (post) => post.contentLocale === "en" && path === `/blog/${post.slug}`,
      );
    const languages = englishOnly
      ? { en: `${baseUrl}${path}`, "x-default": `${baseUrl}${path}` }
      : Object.fromEntries(
          Object.entries(localeAlternates(path)).map(([language, value]) => [
            language,
            `${baseUrl}${value}`,
          ]),
        );
    return (englishOnly ? (["en"] as const) : SUPPORTED_LOCALES).map(
      (locale) => ({
        ...page,
        url: `${baseUrl}${localizePublicPath(path, locale)}`,
        alternates: { languages },
      }),
    );
  });
}
