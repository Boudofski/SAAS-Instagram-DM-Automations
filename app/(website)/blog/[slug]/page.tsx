import BlogCover from "@/components/website/blog-cover";
import LaunchKitForm from "@/components/website/launch-kit-form";
import { getArticleImage, articleImageUrl } from "@/lib/blog-images";
import s from "@/components/website/public-pages.module.css";
import CommentDmLibrary from "@/components/website/comment-dm-library";
import { COMMENT_DM_HUB } from "@/lib/content/comment-dm";
import Breadcrumbs from "@/components/seo/breadcrumbs";
import { COMMERCIAL_PAGES } from "@/lib/commercial-pages";
import { localizedMetadata } from "@/lib/i18n/page-metadata";
import { getServerLocale } from "@/lib/i18n/server";
import { translateUi } from "@/lib/i18n/translate";
import { localizePublicPath } from "@/lib/i18n/config";
import LocalizedCopy from "@/components/i18n/localized-copy";
import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import TutorialScreenshot from "@/components/website/tutorial-screenshot";
import TutorialGuides from "@/components/website/tutorial-guides";
import GrowthGuideExtras, {
  GrowthSectionSources,
} from "@/components/website/growth-guide-extras";
import { BLOG_POSTS } from "@/lib/blog";
import { getPublishedPost, getPublishedPosts } from "@/lib/editorial-server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

const SITE_URL = "https://ap3k.com";

const ENGLISH_SEO_TITLES: Record<string, string> = {
  "instagram-comment-to-dm-automation":
    "Instagram Comment-to-DM Automation Guide | AP3K",
  "compare-instagram-dm-automation-tools":
    "Instagram DM Automation Tools Compared | AP3K",
  "troubleshoot-instagram-comment-dm-automation":
    "Fix Instagram Comment-to-DM Automation | AP3K",
};

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedPost(params.slug);
  if (!post) return {};
  const cover = getArticleImage(post);
  const socialImage = articleImageUrl(cover);
  const locale = post.contentLocale ?? getServerLocale();
  const seoTitle =
    post.seoTitle ||
    (locale === "en" && ENGLISH_SEO_TITLES[post.slug]
      ? ENGLISH_SEO_TITLES[post.slug]
      : `${post.title} | AP3K`);

  const metadata = localizedMetadata(
    {
      title: seoTitle,
      description: post.description,
      keywords: post.keywords,
      alternates: { canonical: `/blog/${post.slug}` },
      openGraph: {
        type: "article",
        title: seoTitle,
        description: post.description,
        url: `${SITE_URL}/blog/${post.slug}`,
        publishedTime: post.publishedAt,
        modifiedTime: post.updatedAt,
        siteName: "AP3K",
        images: [
          {
            url: socialImage,
            width: cover.width,
            height: cover.height,
            alt: translateUi(cover.alt, locale),
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: seoTitle,
        description: post.description,
        images: [socialImage],
      },
    },
    `/blog/${post.slug}`,
    post.contentLocale,
  );
  if (post.noIndex) metadata.robots = { index: false, follow: true };
  if (post.contentLocale === "en")
    metadata.alternates = {
      canonical: `${SITE_URL}/blog/${post.slug}`,
      languages: {
        en: `${SITE_URL}/blog/${post.slug}`,
        "x-default": `${SITE_URL}/blog/${post.slug}`,
      },
    };
  return metadata;
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPublishedPost(params.slug);
  if (!post) notFound();
  // A saved language preference does not make the canonical English URL a
  // localized route. Redirect only actual prefixes to avoid a redirect loop.
  if (
    post.contentLocale === "en" &&
    /^\/(fr|es|de|pt)\//.test(headers().get("x-ap3k-request-path") || "")
  )
    permanentRedirect(`/blog/${post.slug}`);
  const publicPosts = await getPublishedPosts();

  const related = post.related
    ? publicPosts.filter((item) => post.related?.includes(item.slug))
    : publicPosts
        .filter((item) => item.slug !== post.slug)
        .map((item) => ({
          item,
          score:
            Number(item.category === post.category) * 3 +
            item.keywords.filter((keyword) => post.keywords.includes(keyword))
              .length,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({ item }) => item);
  const products = COMMERCIAL_PAGES.filter((page) =>
    page.tutorials.some((guide) => guide.slug === post.slug),
  );
  const locale = post.contentLocale ?? getServerLocale();
  const cover = getArticleImage(post);
  const articleImage = articleImageUrl(cover);
  const articleImageWidth = cover.width;
  const articleImageHeight = cover.height;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: translateUi(post.title, locale),
    description: translateUi(post.description, locale),
    inLanguage: post.contentLocale ?? locale,
    articleSection: post.category,
    ...(post.wordCount ? { wordCount: post.wordCount } : {}),
    isPartOf: { "@type": "Blog", "@id": `${SITE_URL}/blog`, name: "AP3K Blog" },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: `${SITE_URL}${localizePublicPath(`/blog/${post.slug}`, locale)}`,
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
      url: articleImage,
      width: articleImageWidth,
      height: articleImageHeight,
    },
    keywords: post.keywords.map((key) => translateUi(key, locale)).join(", "),
  };

  return (
    <LocalizedCopy>
      <div className={s.page}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <WebsiteNav current="blog" />
        <main>
          <article
            className={`${s.article} ${s.blogArticle}`}
            lang={post.contentLocale}
            dir={post.contentLocale ? "ltr" : undefined}
            translate={post.contentLocale ? "no" : undefined}
          >
            <header className={s.articleHeader}>
              <Breadcrumbs
                items={[
                  { name: "Blog", path: "/blog" },
                  { name: post.title, path: `/blog/${post.slug}` },
                ]}
              />
              <span className={s.badge}>{post.category}</span>
              <h1>{post.title}</h1>
              <p>{post.intro}</p>
              <div className={s.byline}>
                <span>
                  By <Link href="/contact">AP3K</Link>
                </span>
                <time dateTime={post.publishedAt}>
                  {formatDate(post.publishedAt)}
                </time>
                <span>{post.readingTime}</span>
              </div>
            </header>
            <div className="mt-7">
              <BlogCover post={post} priority credit />
            </div>
            <nav className={s.contents} aria-label="Article contents">
              <strong>In this guide</strong>
              <ol>
                {post.sections.map((section, index) => (
                  <li key={section.heading}>
                    <a href={`#section-${index + 1}`}>
                      {section.heading.replace(/^\d+\.\s*/, "")}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            {post.sections.map((section, index) => (
              <section
                id={`section-${index + 1}`}
                key={section.heading}
                className="scroll-mt-24"
              >
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.steps && (
                  <ol>
                    {section.steps.map((item) => (
                      <li key={item.title}>
                        <strong>{item.title}.</strong> {item.body}
                      </li>
                    ))}
                  </ol>
                )}
                {section.bullets && (
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
                {section.links && (
                  <ul>
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} prefetch={false}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <GrowthSectionSources slug={post.slug} index={index} />
                {section.screenshot && (
                  <TutorialScreenshot id={section.screenshot} />
                )}
              </section>
            ))}
            {post.contentLocale && (
              <CommentDmLibrary
                expanded={`/blog/${post.slug}` === COMMENT_DM_HUB}
              />
            )}
            <GrowthGuideExtras slug={post.slug} />
            {post.cover && <TutorialGuides />}
            <div className="mt-10 border-t border-slate-200 pt-5 dark:border-white/10">
              <span className={s.credit}>
                Updated{" "}
                <time dateTime={post.updatedAt}>
                  {formatDate(post.updatedAt)}
                </time>
              </span>
              <div className="mt-3 flex flex-wrap gap-2">
                {post.keywords.map((keyword) => (
                  <span key={keyword} className={s.badge}>
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            <section className={s.cta}>
              <h2>Turn the next comment into a conversation.</h2>
              <p>
                Choose a clear trigger, write a useful response and try your
                first AP3K campaign.
              </p>
              {products.length > 0 && (
                <p>
                  {products.map((page) => (
                    <Link
                      key={page.slug}
                      href={`/${page.slug}`}
                      className="mr-4"
                    >
                      {page.eyebrow} →
                    </Link>
                  ))}
                </p>
              )}
              <Link href="/sign-up" className={s.button}>
                Join for free
              </Link>
            </section>
          </article>
          {post.slug === "instagram-comment-to-dm-automation" && getServerLocale() === "en" ? <LaunchKitForm source="guide" /> : null}
          <section className={`${s.blog} pb-16`}>
            <h2>Related articles</h2>
            <div className={s.blogGrid}>
              {related.slice(0, 4).map((item) => (
                <article
                  className={s.blogCard}
                  key={item.slug}
                  lang={item.contentLocale}
                  translate={item.contentLocale ? "no" : undefined}
                >
                  <Link
                    href={localizePublicPath(
                      `/blog/${item.slug}`,
                      item.contentLocale ?? locale,
                    )}
                    prefetch={false}
                  >
                    <BlogCover post={item} />
                    <h3>{item.title}</h3>
                  </Link>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </section>
        </main>
        <WebsiteFooter />
      </div>
    </LocalizedCopy>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(getServerLocale(), {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
