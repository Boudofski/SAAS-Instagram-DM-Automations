import AP3KLogo from "@/components/global/ap3k-logo";
import BlogCover from "@/components/website/blog-cover";
import s from "@/components/website/public-pages.module.css";
import { notFound, redirect } from "next/navigation";
import { filterBlogPosts } from "@/lib/blog-search";
import { blogPagePath, getBlogPage } from "@/lib/blog-pagination";
import { getServerLocale } from "@/lib/i18n/server";
import { localizePublicPath } from "@/lib/i18n/config";
import { localizedMetadata } from "@/lib/i18n/page-metadata";
import LocalizedCopy from "@/components/i18n/localized-copy";
import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import { getPublishedPosts } from "@/lib/editorial-server";

export const dynamic = "force-dynamic";
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
type Props = { searchParams: { page?: string | string[]; q?: string | string[] } };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = typeof searchParams.q === "string" ? searchParams.q.trim().slice(0, 120) : "";
  if (query) return { ...localizedMetadata(pageMetadata, "/blog"), robots: { index: false, follow: true } };
  const pagination = getBlogPage(searchParams.page, (await getPublishedPosts()).length);
  if (!pagination) return { robots: { index: false, follow: true } };
  return localizedMetadata({ ...pageMetadata, title: pagination.page === 1 ? pageMetadata.title : `AP3K Blog — Page ${pagination.page} | Instagram Automation Guides` }, blogPagePath(pagination.page));
}

export default async function BlogPage({ searchParams }: Props) {
  const query = typeof searchParams.q === "string" ? searchParams.q.trim().slice(0, 120) : "";
  const allPosts = filterBlogPosts(await getPublishedPosts(), query);
  const pagination = getBlogPage(searchParams.page, allPosts.length);
  if (!pagination) notFound();
  if (searchParams.page === "1") redirect(localizePublicPath(query ? `/blog?q=${encodeURIComponent(query)}` : "/blog", getServerLocale()));
  const locale = getServerLocale();
  const posts = (locale === "en" ? allPosts : [...allPosts.filter(p=>!p.contentLocale),...allPosts.filter(p=>p.contentLocale)]).slice(pagination.start, pagination.end);
  const collection = {
    "@context": "https://schema.org", "@type": "CollectionPage",
    name: "AP3K Blog", url: `https://ap3k.com${localizePublicPath(blogPagePath(pagination.page), locale)}`,
    mainEntity: { "@type": "ItemList", itemListElement: posts.map((post, index) => ({
      "@type": "ListItem", position: pagination.start + index + 1,
      url: `https://ap3k.com${localizePublicPath(`/blog/${post.slug}`, locale)}`,
    })) },
  };

  const card = (post: typeof posts[number], index: number) => <article key={post.slug} lang={post.contentLocale} translate={post.contentLocale ? "no" : undefined} className={s.blogCard}>
    <Link href={localizePublicPath(`/blog/${post.slug}`, post.contentLocale ?? locale)} prefetch={false}><BlogCover post={post} priority={index < 2}/><h3>{post.title}</h3></Link>
    <div className={s.byline}><AP3KLogo showText={false} markClassName="h-6 w-6 rounded-full shadow-none"/><span>AP3K · <time dateTime={post.publishedAt}>{new Intl.DateTimeFormat(locale,{month:"long",day:"numeric",year:"numeric",timeZone:"UTC"}).format(new Date(`${post.publishedAt}T00:00:00Z`))}</time></span></div>
    <p>{post.description}</p>
  </article>;
  return <LocalizedCopy><div className={s.page}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collection).replace(/</g, "\\u003c") }}/>
    <WebsiteNav current="blog"/>
    <main className={s.blog}>
      <header className={s.blogHero}><div className="flex justify-center"><AP3KLogo showText={false} markClassName="h-16 w-16 rounded-2xl shadow-none"/></div><h1>Welcome to AP3K Blog</h1><p>Insights, practical guides and ideas for Instagram automation, DM marketing and growing your audience with AP3K.</p></header>
      {!query && pagination.page === 1 && <section><h2>Featured posts</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Start with our practical guides.</p><div className={s.blogGrid}>{posts.slice(0,4).map(card)}</div></section>}
      <form action={localizePublicPath("/blog",locale)} method="get" className="mb-8 flex gap-2"><label htmlFor="blog-search" className="sr-only">Search articles</label><input id="blog-search" type="search" name="q" defaultValue={query} maxLength={120} placeholder="Search articles" className="min-w-0 flex-1 rounded-full border border-slate-200 bg-transparent px-5 py-3 text-sm dark:border-white/15"/><button type="submit" className={s.button}>Search</button></form>
      <section><h2>{query ? `Results for “${query}”` : pagination.page === 1 ? "Latest articles" : `Articles · Page ${pagination.page}`}</h2>{posts.length===0&&<p className="my-6 text-sm">No articles matched. Try a broader search or <Link href="/blog" className="underline">browse all articles</Link>.</p>}<div className={s.blogGrid}>{(!query&&pagination.page===1?posts.slice(4):posts).map(card)}</div></section>
      <nav className={s.pagination} aria-label="Pagination">{Array.from({length:pagination.pages},(_,i)=>i+1).map(page=><Link href={localizePublicPath(`${blogPagePath(page)}${query?`${page===1?"?":"&"}q=${encodeURIComponent(query)}`:""}`,locale)} prefetch={false} key={page} aria-label={`Page ${page}`} aria-current={page===pagination.page?"page":undefined}>{page}</Link>)}</nav>
      <section className={s.cta}><h2>Put your next idea into practice.</h2><p className="my-4 text-sm text-slate-500 dark:text-slate-400">Build a useful Instagram conversation with AP3K.</p><Link href="/sign-up" className={s.button}>Join for free</Link></section>
      <div className={s.related}><Link href="/resources/instagram-growth-library">Growth and automation library →</Link><Link href="/resources/instagram-comment-to-dm-templates">Comment-to-DM templates →</Link></div>
    </main><WebsiteFooter/>
  </div></LocalizedCopy>;
}
