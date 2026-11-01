import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { DOCS_ARTICLES, getDocsArticle } from "@/lib/docs";
import { articleWithScreenshots } from "@/lib/docs/screenshots";
import { ArticleInteractions, TableOfContents } from "@/components/docs/article-interactions";
import { TutorialVideo } from "@/components/docs/tutorial-video";
import { getServerLocale } from "@/lib/i18n/server";
import { localizePublicPath } from "@/lib/i18n/config";
import { translateUi } from "@/lib/i18n/translate";
import { localizedMetadata } from "@/lib/i18n/page-metadata";
import styles from "@/components/docs/docs.module.css";

type Props = { params: Promise<{ slug: string[] }> };
export function generateStaticParams() { return DOCS_ARTICLES.map((article) => ({ slug: article.slug.split("/") })); }

function localizedArticleHtml(html: string, locale: ReturnType<typeof getServerLocale>) {
  const docsPrefix = locale === "en" ? "/docs/" : `/${locale}/docs/`;
  return html
    .replace(/href="\/docs\//g, `href="${docsPrefix}`)
    .replace(/>([^<>]+)</g, (match, text: string) => {
      const translated = translateUi(text, locale);
      return translated === text ? match : `>${translated}<`;
    });
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const article = getDocsArticle(params.slug.join("/").replace(/linktodm/gi, "ap3k"));
  if (!article) return {};
  const path = `/docs/${article.slug}`;
  return localizedMetadata({ title: `${article.title} | AP3K Docs`, description: article.description, authors: [{ name: "AP3K" }], openGraph: { title: article.title, description: article.description, url: `https://ap3k.com${path}`, type: "article" } }, path);
}

export default async function DocsArticlePage(props: Props) {
  const params = await props.params;
  const raw = params.slug.join("/");
  const slug = raw.replace(/linktodm/gi, "ap3k");
  const article = getDocsArticle(slug);
  if (!article) notFound();
  const locale = getServerLocale();
  const tr = (text: string) => translateUi(text, locale);
  const lp = (path: string) => localizePublicPath(path, locale);
  if (raw !== slug) permanentRedirect(lp(`/docs/${slug}`));
  const index = DOCS_ARTICLES.indexOf(article);
  const related = DOCS_ARTICLES.filter((item) => item.group === article.group && item.slug !== slug).slice(0, 3);
  const words = article.html.replace(/<[^>]+>/g, " ").split(/\s+/).length;
  const title = tr(article.title);
  const description = tr(article.description);
  const canonical = `https://ap3k.com${lp(`/docs/${slug}`)}`;
  const schema = { "@context": "https://schema.org", "@graph": [{ "@type": "TechArticle", headline: title, description, dateModified: article.updated, inLanguage: locale, author: { "@type": "Organization", name: "AP3K" }, mainEntityOfPage: canonical }, { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: tr("Documentation"), item: `https://ap3k.com${lp("/docs")}` }, { "@type": "ListItem", position: 2, name: title, item: canonical }] }] };
  const headings = article.headings.map((heading) => ({ ...heading, text: tr(heading.text) }));
  const formatLocale = locale === "ar" ? "ar" : locale;
  const html = localizedArticleHtml(articleWithScreenshots(slug, article.html), locale);
  return <div className={styles.articleLayout}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} /><article className={styles.article}><h1>{title}</h1><p className={styles.metadata}><span>{Math.max(1, Math.ceil(words / 220))} {tr("min read")}</span><span>·</span><span>{tr("Updated")} <time dateTime={article.updated}>{new Intl.DateTimeFormat(formatLocale, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${article.updated}T00:00:00Z`))}</time></span><span>·</span><span>AP3K</span></p><details className={styles.mobileToc}><summary>{tr("On this page")}</summary>{headings.filter((heading) => heading.level === 2).map((heading) => <a key={heading.id} href={`#${heading.id}`}>{heading.text}</a>)}</details>{article.video && <TutorialVideo />}<div id="docs-article-content" className={styles.prose} dangerouslySetInnerHTML={{ __html: html }} /><ArticleInteractions slug={slug} />{related.length > 0 && <section className={styles.related}><h2>{tr("Related articles")}</h2>{related.map((item) => <Link key={item.slug} href={lp(`/docs/${item.slug}`)}>{tr(item.title)}<ArrowRight size={16} className="rtl:rotate-180" /></Link>)}</section>}<nav className={styles.pager} aria-label={tr("Article navigation")}>{DOCS_ARTICLES[index - 1] && <Link href={lp(`/docs/${DOCS_ARTICLES[index - 1].slug}`)}><small>← {tr("Previous")}</small>{tr(DOCS_ARTICLES[index - 1].title)}</Link>}{DOCS_ARTICLES[index + 1] && <Link href={lp(`/docs/${DOCS_ARTICLES[index + 1].slug}`)}><small>{tr("Next")} →</small>{tr(DOCS_ARTICLES[index + 1].title)}</Link>}</nav></article><TableOfContents headings={headings} /></div>;
}
