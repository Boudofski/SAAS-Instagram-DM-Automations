import { FadeIn } from "@/components/global/motion/fade-in";
import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import BlogVisual, { getBlogVisualSrc } from "@/components/website/blog-visual";
import { BLOG_POSTS, getBlogPost } from "@/lib/blog";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const SITE_URL = "https://ap3k.com";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const post = getBlogPost(params.slug);
  if (!post) return {};
  const socialImage = `${SITE_URL}${getBlogVisualSrc(post.visual)}`;

  return {
    title: `${post.title} | AP3K`,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `${SITE_URL}/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      siteName: "AP3K",
      images: [{ url: socialImage, width: 1440, height: 810, alt: post.visualAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [socialImage],
    },
  };
}

export default function BlogPostPage({ params }: Props) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  const related = BLOG_POSTS
    .filter((item) => item.slug !== post.slug)
    .map((item) => ({
      item,
      score: Number(item.category === post.category) * 3 + item.keywords.filter((keyword) => post.keywords.includes(keyword)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ item }) => item);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    author: { "@type": "Organization", name: "AP3K", url: SITE_URL },
    publisher: { "@type": "Organization", name: "AP3K", url: SITE_URL },
    image: `${SITE_URL}${getBlogVisualSrc(post.visual)}`,
    keywords: post.keywords.join(", "),
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#070808] dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(249,115,22,0.10),transparent_30rem),radial-gradient(circle_at_82%_10%,rgba(236,72,153,0.08),transparent_30rem)]" />
      <WebsiteNav current="blog" />
      <main className="relative z-10">
        <article className="mx-auto max-w-4xl px-4 pb-20 pt-14 sm:px-8 sm:pt-20">
          <FadeIn>
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-300">
              <ArrowLeft className="h-4 w-4" /> All guides
            </Link>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400">
              <span className="rounded-full bg-orange-500/10 px-3 py-1.5 text-orange-600 dark:text-orange-300">{post.category}</span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {formatDate(post.publishedAt)}</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> {post.readingTime}</span>
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-6xl">{post.title}</h1>
            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">{post.intro}</p>
          </FadeIn>

          <FadeIn delay={0.06}>
            <div className="mt-10">
              <BlogVisual variant={post.visual} alt={post.visualAlt} caption={post.visualCaption} />
            </div>
          </FadeIn>

          <FadeIn delay={0.09}>
            <nav aria-label="Article contents" className="mt-10 rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">In this guide</p>
              <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                {post.sections.map((section, index) => (
                  <li key={section.heading}>
                    <a href={`#section-${index + 1}`} className="text-sm font-bold leading-6 text-slate-600 transition hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-300">
                      {index + 1}. {section.heading.replace(/^\d+\.\s*/, "")}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </FadeIn>

          <div className="mt-12 space-y-12">
            {post.sections.map((section, index) => (
              <FadeIn key={section.heading} delay={Math.min(index * 0.03, 0.15)}>
                <section id={`section-${index + 1}`} className="scroll-mt-24">
                  <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{section.heading}</h2>
                  <div className="mt-4 space-y-4 text-base leading-8 text-slate-600 dark:text-slate-300">
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    {section.steps && (
                      <ol className="grid gap-3">
                        {section.steps.map((item, stepIndex) => (
                          <li key={item.title} className="group flex gap-4 rounded-2xl border border-violet-500/15 bg-violet-50/70 p-5 transition duration-300 motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-violet-500/30 dark:bg-violet-500/[0.06]">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-600 text-sm font-black text-white shadow-lg shadow-violet-600/20">{stepIndex + 1}</span>
                            <span>
                              <strong className="block text-slate-950 dark:text-white">{item.title}</strong>
                              <span className="mt-1 block text-sm leading-6">{item.body}</span>
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                    {section.bullets && (
                      <ul className="space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/[0.04]">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3">
                            <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              </FadeIn>
            ))}
          </div>

          <FadeIn>
            <div className="mt-12 border-t border-slate-200 pt-6 dark:border-white/10">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Topics</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {post.keywords.map((keyword) => (
                  <span key={keyword} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">{keyword}</span>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn>
            <aside className="mt-14 rounded-[30px] border border-orange-500/20 bg-gradient-to-br from-orange-50 via-pink-50 to-white p-7 dark:from-orange-500/10 dark:via-pink-500/10 dark:to-white/[0.03] sm:p-8">
              <p className="ap3k-kicker">Try the workflow</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Turn your next Instagram comment into an action.</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">Start with one campaign, one clear trigger, and a useful Comment reply or DM. You can expand after you see the full flow working.</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up" className="ap3k-gradient-button px-5 py-2.5 text-center text-sm">Start free</Link>
                <Link href="/pricing" className="ap3k-outline-button px-5 py-2.5 text-center text-sm">Compare plans</Link>
              </div>
            </aside>
          </FadeIn>
        </article>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="ap3k-kicker">Keep learning</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">Related guides</h2>
            </div>
            <Link href="/blog" className="hidden items-center gap-1 text-sm font-black text-orange-600 sm:inline-flex dark:text-orange-300">All guides <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} href={`/blog/${item.slug}`} className="group rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm transition-all duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:border-orange-500/30 motion-safe:hover:shadow-lg dark:border-white/10 dark:bg-[#101112]">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-500">{item.category}</p>
                <h3 className="mt-2 text-lg font-black leading-snug group-hover:text-orange-600 dark:group-hover:text-orange-300">{item.title}</h3>
                <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">{item.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <WebsiteFooter />
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}
