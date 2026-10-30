import { blogArchiveAlternates } from "@/lib/localized-blog-archive";
import { getEditorialArchive } from "@/lib/blog-archive";
import { COMPARISONS, comparisonPath } from "@/lib/comparisons";
import { SOLUTIONS } from "@/lib/solutions";
import { COMPANY } from "@/lib/company";
import { AP3K_HELP_ARTICLES } from "@/lib/ap3k-help";
import { DOCS_ARTICLES } from "@/lib/docs";
import { BLOG_POSTS } from "@/lib/blog";
import type { BlogPost } from "@/lib/blog";
import { COMMERCIAL_PAGES } from "@/lib/commercial-pages";
import { SEO_RESOURCES } from "@/lib/seo-resources";
import { BLOG_PAGE_SIZE, blogPagePath } from "@/lib/blog-pagination";
import type { MetadataRoute } from "next";
import {
  isEnglishOnlyArticle,
  localizedLocalesForPath,
  localizePublicPath,
  localeAlternates,
} from "@/lib/i18n/config";

const baseUrl = "https://ap3k.com";

export function buildSitemap(
  posts: BlogPost[] = BLOG_POSTS,
): MetadataRoute.Sitemap {
  const updated = new Date("2026-09-27T00:00:00Z");
  // Significant public-copy and navigation updates shipped on this date.
  // Keep this fixed to the release date; never stamp every crawl with today.
  const publicContentUpdated = new Date("2026-10-05T00:00:00Z");
  const localizedDiscoveryUpdated = new Date("2026-10-24T00:00:00Z");
  const archiveUpdated = new Date(Math.max(
    localizedDiscoveryUpdated.getTime(),
    ...getEditorialArchive(posts).posts.filter(post => !post.noIndex)
      .map(post => new Date(`${post.updatedAt}T00:00:00Z`).getTime())
      .filter(Number.isFinite),
  ));
  const companyUpdated = new Date(`${COMPANY.detailsUpdated}T00:00:00Z`);
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/instagram-automation-guide`, lastModified: new Date('2026-10-23T00:00:00Z'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: publicContentUpdated, changeFrequency: "monthly", priority: 0.6 },
    {
      url: baseUrl,
      lastModified: localizedDiscoveryUpdated,
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
      lastModified: archiveUpdated,
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
      url: `${baseUrl}/docs`,
      lastModified: new Date("2026-10-02T00:00:00Z"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date("2026-09-29T00:00:00Z"),
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
    { length: Math.max(0, Math.ceil(getEditorialArchive(posts).posts.length / BLOG_PAGE_SIZE) - 1) },
    (_, index) => ({
      url: `${baseUrl}${blogPagePath(index + 2)}`,
      lastModified: archiveUpdated,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }),
  );

  const commercialPages: MetadataRoute.Sitemap = [
    ...COMMERCIAL_PAGES.map((page) => ({
      url: `${baseUrl}/${page.slug}`,
      lastModified: page.updatedAt
        ? new Date(`${page.updatedAt}T00:00:00Z`)
        : publicContentUpdated,
      changeFrequency: "monthly" as const,
      priority: page.slug === "manychat-alternative" ? 0.9 : 0.85,
    })),
  ];

  const helpPages: MetadataRoute.Sitemap = AP3K_HELP_ARTICLES.map(
    (article) => ({
      url: `${baseUrl}/help/${article.slug}`,
      lastModified: new Date("2026-10-02T00:00:00Z"),
      changeFrequency: "monthly",
      priority: 0.7,
    }),
  );

  const resourcePages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/resources`,
      lastModified: new Date("2026-09-29T00:00:00Z"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...SEO_RESOURCES.filter(resource => resource.slug !== "instagram-comment-to-dm-templates").map((resource) => ({
      url: `${baseUrl}/resources/${resource.slug}`,
      lastModified: new Date(`${resource.updatedAt || "2026-09-22"}T00:00:00Z`),
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

  const localizedPages: MetadataRoute.Sitemap = [
    ...staticPages,
    {url: `${baseUrl}/tutorials/instagram-comment-to-dm`, lastModified: new Date("2026-10-02T00:00:00Z"), changeFrequency: "monthly" as const, priority: 0.8},
    ...[
      "/compare",
      "/solutions",
      ...COMPARISONS.filter((page) => page.slug !== "manychat").map(
        comparisonPath,
      ),
      ...SOLUTIONS.map((page) => `/solutions/${page.slug}`),
    ].map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: path === "/solutions" ? publicContentUpdated : new Date(path === "/compare" || path.startsWith("/compare/") ? "2026-10-06T00:00:00Z" : "2026-09-27T00:00:00Z"),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...commercialPages,
    ...blogArchivePages,
    ...blogPages,
    ...helpPages,
    ...DOCS_ARTICLES.map(article => ({ url: `${baseUrl}/docs/${article.slug}`, lastModified: new Date(`${article.updated}T00:00:00Z`), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...resourcePages,
  ].flatMap((page) => {
    const parsed = new URL(page.url);
    const path = `${parsed.pathname}${parsed.search}`;
    const archiveMatch = parsed.pathname.match(/^\/blog\/page\/(\d+)$/);
    const archivePage = parsed.pathname === "/blog"
      ? 1
      : archiveMatch
        ? Number(archiveMatch[1])
        : null;
    const archiveLanguages = archivePage ? blogArchiveAlternates(posts, archivePage) : null;
    const englishOnly =
      isEnglishOnlyArticle(path) ||
      posts.some(
        (post) => post.contentLocale === "en" && path === `/blog/${post.slug}`,
      );
    const languages = archiveLanguages ?? (englishOnly
      ? { en: `${baseUrl}${path}`, "x-default": `${baseUrl}${path}` }
      : Object.fromEntries(
          Object.entries(localeAlternates(path)).map(([language, value]) => [
            language,
            `${baseUrl}${value}`,
          ]),
        ));
    return (englishOnly ? (["en"] as const) : localizedLocalesForPath(path)).filter(locale => !archiveLanguages || locale in archiveLanguages).map(
      (locale) => ({
        ...page,
        url: `${baseUrl}${localizePublicPath(path, locale)}`,
        alternates: { languages },
      }),
    );
  });

  const commentDmLanguages = {
    ar: `${baseUrl}/ar/instagram-comment-to-dm`,
    en: `${baseUrl}/instagram-comment-to-dm`,
    fr: `${baseUrl}/fr/instagram-comment-to-dm`,
    es: `${baseUrl}/es/instagram-comment-to-dm`,
    de: `${baseUrl}/de/instagram-comment-to-dm`,
    pt: `${baseUrl}/pt/instagram-comment-to-dm`,
    "x-default": `${baseUrl}/instagram-comment-to-dm`,
  };
  const withArabicAlternate = localizedPages.map((page) =>
    new URL(page.url).pathname.replace(/^\/(?:fr|es|de|pt)(?=\/)/, "") ===
    "/instagram-comment-to-dm"
      ? {
          ...page,
          alternates: {
            languages: commentDmLanguages,
          },
        }
      : page,
  );

  return [
    ...withArabicAlternate,
    {
      url: `${baseUrl}/ar/instagram-comment-to-dm`,
      lastModified: new Date("2026-10-30T00:00:00Z"),
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages: commentDmLanguages },
    },
  ];
}
