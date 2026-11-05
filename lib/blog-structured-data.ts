import type { BlogPost } from "./blog";
const SITE_URL = "https://ap3k.com";
import { localizePublicPath, type Locale } from "./i18n/config";
import { translateUi } from "./i18n/translate";

/** One article entity tied to its canonical, with the existing editorial fields preserved. */
export function buildBlogStructuredData(post: BlogPost, requestedLocale: Locale, image: {url: string; width: number; height: number}) {
  const locale = post.contentLocale ?? requestedLocale;
  const url = `${SITE_URL}${localizePublicPath(`/blog/${post.slug}`, locale)}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: translateUi(post.title, locale),
    description: translateUi(post.description, locale),
    inLanguage: post.contentLocale ?? locale,
    "@id": `${url}#article`,
    url,
    isAccessibleForFree: true,
    articleSection: translateUi(post.category, locale),
    ...(post.wordCount ? { wordCount: post.wordCount } : {}),
    isPartOf: { "@type": "Blog", "@id": `${SITE_URL}${localizePublicPath("/blog", locale)}`, name: "AP3K Blog" },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "AP3K",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "AP3K",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon.png`,
        width: 512,
        height: 512,
      },
    },
    image: {
      "@type": "ImageObject",
      url: image.url,
      width: image.width,
      height: image.height,
    },
    keywords: post.keywords.map((key) => translateUi(key, locale)).join(", "),
  };
}
