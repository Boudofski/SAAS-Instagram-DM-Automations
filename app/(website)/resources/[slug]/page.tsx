import Breadcrumbs from "@/components/seo/breadcrumbs";
import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import { getSeoResource, SEO_RESOURCES } from "@/lib/seo-resources";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return SEO_RESOURCES.map(resource => ({ slug: resource.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const resource = getSeoResource(params.slug);
  if (!resource) return {};
  return {
    title: `${resource.title} | Free AP3K Resource`,
    description: resource.description,
    alternates: { canonical: `/resources/${resource.slug}` },
  };
}

export default function ResourcePage({ params }: Props) {
  const resource = getSeoResource(params.slug);
  if (!resource) notFound();
  return <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#070808] dark:text-white">
    <WebsiteNav />
    <main className="mx-auto max-w-4xl px-4 pb-24 pt-16 sm:px-8">
      <Breadcrumbs items={[{ name: "Resources", path: "/resources" }, { name: resource.title, path: `/resources/${resource.slug}` }]} />
      <p className="ap3k-kicker">{resource.eyebrow}</p>
      <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">{resource.title}</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">{resource.description}</p>
      <div className="mt-12 space-y-10">
        {resource.sections.map(section => <section key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:p-8">
          <h2 className="text-2xl font-black tracking-tight">{section.title}</h2>
          {section.intro ? <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{section.intro}</p> : null}
          <ol className="mt-5 space-y-3">
            {section.items.map((item, index) => <li key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 dark:border-white/10 dark:bg-white/[0.03]">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-600 text-xs font-black text-white">{index + 1}</span>
              <span>{item}</span>
            </li>)}
          </ol>
        </section>)}
      </div>
      <aside className="mt-12 rounded-3xl bg-gradient-to-r from-violet-700 to-fuchsia-600 p-7 text-white sm:p-9">
        <h2 className="text-2xl font-black">Put the resource into practice.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">Build one focused Instagram comment-to-DM automation, test it with a second account, and measure delivery separately from clicks and sales.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/instagram-comment-to-dm" className="rounded-full bg-white px-5 py-3 text-center text-sm font-black text-violet-700">See comment-to-DM automation</Link>
          <Link href="/blog/instagram-comment-to-dm-automation" className="rounded-full border border-white/30 px-5 py-3 text-center text-sm font-black">Read the complete guide</Link>
        </div>
      </aside>
    </main>
    <WebsiteFooter />
  </div>;
}
