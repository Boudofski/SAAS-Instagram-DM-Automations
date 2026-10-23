import type { Metadata } from 'next';
import Link from 'next/link';
import WebsiteNav from '@/components/global/website-nav';
import WebsiteFooter from '@/components/global/website-footer';
import { AUTOMATION_GUIDE } from '@/lib/i18n/automation-guide';
import { getServerLocale } from '@/lib/i18n/server';
import { localeAlternates, localizePublicPath } from '@/lib/i18n/config';

const path = '/instagram-automation-guide';
export function generateMetadata(): Metadata {
  const locale = getServerLocale();
  const copy = AUTOMATION_GUIDE[locale];
  const url = `https://ap3k.com${localizePublicPath(path, locale)}`;
  return {
    title: `${copy.title} | AP3K`, description: copy.description,
    alternates: { canonical: url, languages: Object.fromEntries(Object.entries(localeAlternates(path)).map(([lang, value]) => [lang, `https://ap3k.com${value}`])) },
    openGraph: { title: copy.title, description: copy.description, url, type: 'article', images: ['/opengraph-image'] },
    twitter: { card: 'summary_large_image', title: copy.title, description: copy.description, images: ['/opengraph-image'] },
  };
}

export default function AutomationGuide() {
  const locale = getServerLocale();
  const copy = AUTOMATION_GUIDE[locale];
  const url = `https://ap3k.com${localizePublicPath(path, locale)}`;
  const schema = { '@context': 'https://schema.org', '@type': 'TechArticle', '@id': `${url}#article`, headline: copy.title, description: copy.description, inLanguage: locale, datePublished: '2026-10-23', dateModified: '2026-10-23', mainEntityOfPage: url, author: { '@type': 'Organization', '@id': 'https://ap3k.com/#organization', name: 'AP3K', url: 'https://ap3k.com/about' } };
  return <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#070808] dark:text-white">
    <WebsiteNav />
    <main className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(schema).replace(/</g, '\\u003c')}} />
      <article>
        <p className="text-sm font-semibold text-violet-600 dark:text-violet-300">AP3K · <time dateTime="2026-10-23">{new Intl.DateTimeFormat(locale, {year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date('2026-10-23T00:00:00Z'))}</time></p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{copy.title}</h1>
        <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">{copy.intro}</p>
        <div className="mt-10 space-y-6">{copy.sections.map((section, index) => <section key={section.title} id={`step-${index+1}`} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03] sm:p-8">
          <h2 className="text-2xl font-bold">{section.title}</h2>
          <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">{section.text}</p>
          <Link className="mt-5 inline-block font-semibold text-violet-700 underline underline-offset-4 dark:text-violet-300" href={localizePublicPath(section.path, locale)}>{section.link} →</Link>
        </section>)}</div>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href={localizePublicPath('/sign-up',locale)} className="rounded-xl bg-violet-600 px-6 py-4 font-semibold text-white">{copy.start}</Link>
          <Link href={localizePublicPath('/pricing',locale)} className="rounded-xl border border-slate-300 px-6 py-4 font-semibold dark:border-white/20">{copy.pricing}</Link>
        </div>
      </article>
    </main>
    <WebsiteFooter />
  </div>;
}
