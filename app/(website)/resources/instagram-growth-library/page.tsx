import type { Metadata } from "next";
import Link from "next/link";
import WebsiteNav from "@/components/global/website-nav";
import WebsiteFooter from "@/components/global/website-footer";
import { EXPANSION_CLUSTERS } from "@/lib/content/expansion";
import { EXPANSION_COMMERCIAL_PAGES } from "@/lib/content/expansion/commercial";
import { getPublishedPosts } from "@/lib/editorial-server";

const url = "https://ap3k.com/resources/instagram-growth-library";
export const metadata: Metadata = {
  title: "Instagram Growth and Automation Guide Library | AP3K",
  description: "Find practical guides to Instagram quick replies, lead generation, scheduling handoffs, ManyChat alternatives, measurement and automation operations.",
  alternates: { canonical: url, languages: { en: url, "x-default": url } },
  openGraph: { title: "Instagram Growth and Automation Guide Library", description: "Choose a specific question, follow a practical workflow and measure the outcome.", url, type: "website", images: ["https://ap3k.com/opengraph-image"] },
  twitter: { card: "summary_large_image", images: ["https://ap3k.com/opengraph-image"] },
};
export default async function GrowthLibrary() {
  const published = new Map((await getPublishedPosts()).filter(p => !p.noIndex).map(p => [p.slug, p]));
  const clusters = EXPANSION_CLUSTERS.map(c => ({ ...c, posts: c.posts.flatMap(p => published.has(p.slug) ? [published.get(p.slug)!] : []) })).filter(c => c.posts.length);
  const guides = clusters.flatMap(c => c.posts);
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Instagram Growth and Automation Guide Library", url, inLanguage: "en", mainEntity: { "@type": "ItemList", itemListElement: guides.map((p,i) => ({ "@type": "ListItem", position: i+1, name: p.title, url: `https://ap3k.com/blog/${p.slug}` })) } };
  return <div className="min-h-screen bg-background text-foreground">
    <WebsiteNav />
    <main lang="en" translate="no" className="mx-auto max-w-6xl px-4 py-14 sm:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g,"\\u003c") }} />
      <Link href="/resources" className="text-sm font-semibold text-primary">← All resources</Link>
      <p className="mt-8 text-xs font-bold uppercase tracking-widest text-primary">{guides.length} practical guides · {clusters.length} topics</p>
      <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Find the next useful step for your Instagram workflow.</h1>
      <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">Choose a specific question, work through an example and decide what to measure. Start with the workflow you need, whether you are writing replies, evaluating a tool or improving lead quality.</p>
      <nav aria-label="Guide topics" className="my-10 flex flex-wrap gap-2">{clusters.map(c => <a key={c.id} href={`#${c.id}`} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{c.title}</a>)}</nav>
      <div className="space-y-12">{clusters.map(c => <section key={c.id} id={c.id} className="scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3"><h2 className="text-2xl font-bold">{c.title}</h2><Link href={c.product} className="text-sm font-semibold text-primary">Explore the AP3K workflow →</Link></div>
        <ul className="mt-5 grid gap-3 md:grid-cols-2">{c.posts.map(p => <li key={p.slug}><Link prefetch={false} href={`/blog/${p.slug}`} className="block h-full rounded-2xl border border-border bg-card p-5 transition hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><h3 className="font-semibold leading-6">{p.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{p.description}</p><span className="mt-3 block text-xs text-muted-foreground">{p.readingTime}</span></Link></li>)}</ul>
      </section>)}</div>
      <section className="mt-16 rounded-3xl border border-border bg-card p-6 sm:p-8"><h2 className="text-2xl font-bold">Explore AP3K for your workflow</h2><p className="mt-3 text-muted-foreground">Product capabilities, practical use cases and clear limitations before you choose a plan.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{EXPANSION_COMMERCIAL_PAGES.map(p => <Link key={p.slug} href={`/${p.slug}`} className="rounded-xl border border-border p-4 font-semibold hover:border-primary">{p.eyebrow} →</Link>)}</div></section>
      <section className="mt-12"><h2 className="text-xl font-bold">Keep platform details current</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Publishing tools, advertising options and vendor plans can change. Check the official source for the feature you need. The guides distinguish those services from AP3K’s supported response workflows.</p><ul className="mt-4 space-y-2 text-sm text-primary"><li><a href="https://www.facebook.com/help/instagram/439971288310029" rel="noopener noreferrer" target="_blank">Instagram scheduled content help ↗</a></li><li><a href="https://www.facebook.com/business/ads/ad-objectives/lead-generation" rel="noopener noreferrer" target="_blank">Meta lead advertising overview ↗</a></li><li><a href="https://manychat.com/product/instagram" rel="noopener noreferrer" target="_blank">ManyChat’s current Instagram product information ↗</a></li><li><Link href="/pricing">AP3K plans and allowances →</Link></li></ul></section>
    </main><WebsiteFooter />
  </div>;
}
