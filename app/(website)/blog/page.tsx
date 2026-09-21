import { notFound, redirect } from "next/navigation";
import { blogPagePath, getBlogPage } from "@/lib/blog-pagination";
import { getServerLocale } from "@/lib/i18n/server";
import { localizePublicPath } from "@/lib/i18n/config";
import CommentDmLibrary from "@/components/website/comment-dm-library";
import { localizedMetadata } from "@/lib/i18n/page-metadata";
import LocalizedCopy from "@/components/i18n/localized-copy";
import { ReadableReveal } from "@/components/global/motion/fade-in";
import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import BlogVisual from "@/components/website/blog-visual";
import TutorialScreenshot from "@/components/website/tutorial-screenshot";
import { BLOG_POSTS, getBlogPostsForLocale } from "@/lib/blog";
import { ArrowRight, Clock3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

const pageMetadata: Metadata = {
  title: "AP3K Blog — Instagram Comment & DM Automation Guides",
  description:
    "Practical guides for Instagram comment automation, DMs, creator lead generation, triggers and campaign strategy.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "AP3K Blog — Instagram Automation Guides",
    description: "Practical guides for turning Instagram comments into conversations and leads.",
    url: "https://ap3k.com/blog",
    type: "website",
  },
};
type Props = { searchParams: { page?: string | string[] } };
export function generateMetadata({ searchParams }: Props): Metadata {
  const pagination = getBlogPage(searchParams.page, BLOG_POSTS.length);
  if (!pagination) return { robots: { index: false, follow: true } };
  return localizedMetadata({ ...pageMetadata, title: pagination.page === 1 ? pageMetadata.title : `AP3K Blog — Page ${pagination.page} | Instagram Automation Guides` }, blogPagePath(pagination.page));
}

export default function BlogPage({ searchParams }: Props) {
  const pagination = getBlogPage(searchParams.page, BLOG_POSTS.length);
  if (!pagination) notFound();
  if (searchParams.page === "1") redirect(localizePublicPath("/blog", getServerLocale()));
  const locale = getServerLocale();
  const posts = getBlogPostsForLocale(locale).slice(pagination.start, pagination.end);
  const collection = {
    "@context": "https://schema.org", "@type": "CollectionPage",
    name: "AP3K Blog", url: `https://ap3k.com${localizePublicPath(blogPagePath(pagination.page), locale)}`,
    mainEntity: { "@type": "ItemList", itemListElement: posts.map((post, index) => ({
      "@type": "ListItem", position: pagination.start + index + 1,
      url: `https://ap3k.com${localizePublicPath(`/blog/${post.slug}`, locale)}`,
    })) },
  };

  return (
    <LocalizedCopy><div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#070808] dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(249,115,22,0.12),transparent_30rem),radial-gradient(circle_at_80%_12%,rgba(236,72,153,0.10),transparent_32rem)]" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collection).replace(/</g, "\\u003c") }} />
      <WebsiteNav current="blog" />
      <main className="relative z-10">
        <section className="mx-auto max-w-5xl px-4 pb-12 pt-20 text-center sm:px-8">
          <ReadableReveal>
            <p className="ap3k-kicker">AP3K resources</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Instagram automation, explained clearly.</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
              Practical guides for Comment replies, DMs, triggers, campaigns and turning Instagram engagement into measurable follow-up.
            </p>
          </ReadableReveal>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">
          <CommentDmLibrary />
          <div className="grid gap-5 md:grid-cols-2">
            {posts.map((post, index) => (
              <ReadableReveal key={post.slug} delay={Math.min(index * 0.025, 0.1)}>
                <article lang={post.contentLocale} dir={post.contentLocale ? "ltr" : undefined} translate={post.contentLocale ? "no" : undefined} className={`group h-full overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm transition-all duration-500 motion-safe:hover:-translate-y-1 motion-safe:hover:border-orange-500/30 motion-safe:hover:shadow-xl dark:border-white/10 dark:bg-[#101112] ${index === 0 ? "md:col-span-2" : ""}`}>
                  {post.cover ? <div className="px-4"><TutorialScreenshot id={post.cover} compact /></div> : <BlogVisual variant={post.visual} alt={post.visualAlt} compact />}
                  <div className={index === 0 ? "p-6 md:p-8" : "p-6"}>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                    <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-orange-600 dark:text-orange-300">{post.category}</span>
                    <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {post.readingTime}</span>
                  </div>
                  <h2 className={`mt-4 font-black tracking-tight text-slate-950 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-300 ${index === 0 ? "text-3xl sm:text-4xl" : "text-2xl"}`}>{post.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{post.description}</p>
                  <Link href={`/blog/${post.slug}`} prefetch={false} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-orange-600 transition-all group-hover:gap-3 dark:text-orange-300">
                    Read guide <ArrowRight className="h-4 w-4" />
                  </Link>
                  </div>
                </article>
              </ReadableReveal>
            ))}
          </div>
          <nav aria-label="Pagination" className="mt-10 flex flex-wrap justify-center gap-2">
            {Array.from({ length: pagination.pages }, (_, index) => index + 1).map(page => (
              <Link key={page} href={blogPagePath(page)} prefetch={false} aria-label={`${page}`} aria-current={page === pagination.page ? "page" : undefined} className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border px-3 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-500 ${page === pagination.page ? "border-violet-600 bg-violet-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-violet-400 dark:border-white/15 dark:bg-white/5 dark:text-slate-200"}`}>{page}</Link>
            ))}
          </nav>
        </section>

        <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-8">
          <ReadableReveal>
            <div className="rounded-[32px] border border-orange-500/20 bg-gradient-to-br from-orange-50 via-pink-50 to-white p-8 text-center shadow-sm dark:from-orange-500/10 dark:via-pink-500/10 dark:to-white/[0.03] sm:p-10">
              <p className="ap3k-kicker">Put it into practice</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Build your first comment-to-DM campaign.</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">Connect an Instagram Business or Creator account, choose a trigger, then decide whether AP3K should reply to the comment, send a DM, or both.</p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/sign-up" className="ap3k-gradient-button px-6 py-3 text-sm">GET STARTED</Link>
                <Link href="/pricing" className="ap3k-outline-button px-6 py-3 text-sm">See pricing</Link>
              </div>
            </div>
          </ReadableReveal>
        </section>
      </main>
      <WebsiteFooter />
    </div></LocalizedCopy>
  );
}
