import { FadeIn, StaggerContainer, StaggerItem } from "@/components/global/motion/fade-in";
import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import BlogVisual from "@/components/website/blog-visual";
import { BLOG_POSTS } from "@/lib/blog";
import { ArrowRight, Clock3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
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

export default function BlogPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#070808] dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(249,115,22,0.12),transparent_30rem),radial-gradient(circle_at_80%_12%,rgba(236,72,153,0.10),transparent_32rem)]" />
      <WebsiteNav current="blog" />
      <main className="relative z-10">
        <section className="mx-auto max-w-5xl px-4 pb-12 pt-20 text-center sm:px-8">
          <FadeIn>
            <p className="ap3k-kicker">AP3K resources</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Instagram automation, explained clearly.</h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
              Practical guides for Comment replies, DMs, triggers, campaigns and turning Instagram engagement into measurable follow-up.
            </p>
          </FadeIn>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">
          <StaggerContainer className="grid gap-5 md:grid-cols-2">
            {BLOG_POSTS.map((post, index) => (
              <StaggerItem key={post.slug}>
                <article className={`group h-full overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm transition-all duration-500 motion-safe:hover:-translate-y-1 motion-safe:hover:border-orange-500/30 motion-safe:hover:shadow-xl dark:border-white/10 dark:bg-[#101112] ${index === 0 ? "md:col-span-2" : ""}`}>
                  <BlogVisual variant={post.visual} alt={post.visualAlt} compact />
                  <div className={index === 0 ? "p-6 md:p-8" : "p-6"}>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                    <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-orange-600 dark:text-orange-300">{post.category}</span>
                    <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {post.readingTime}</span>
                  </div>
                  <h2 className={`mt-4 font-black tracking-tight text-slate-950 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-300 ${index === 0 ? "text-3xl sm:text-4xl" : "text-2xl"}`}>{post.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{post.description}</p>
                  <Link href={`/blog/${post.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-orange-600 transition-all group-hover:gap-3 dark:text-orange-300">
                    Read guide <ArrowRight className="h-4 w-4" />
                  </Link>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>

        <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-8">
          <FadeIn>
            <div className="rounded-[32px] border border-orange-500/20 bg-gradient-to-br from-orange-50 via-pink-50 to-white p-8 text-center shadow-sm dark:from-orange-500/10 dark:via-pink-500/10 dark:to-white/[0.03] sm:p-10">
              <p className="ap3k-kicker">Put it into practice</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Build your first comment-to-DM campaign.</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">Connect an Instagram Business or Creator account, choose a trigger, then decide whether AP3K should reply to the comment, send a DM, or both.</p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/sign-up" className="ap3k-gradient-button px-6 py-3 text-sm">Start free</Link>
                <Link href="/pricing" className="ap3k-outline-button px-6 py-3 text-sm">See pricing</Link>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>
      <WebsiteFooter />
    </div>
  );
}
