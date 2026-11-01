import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Clapperboard, MessagesSquare, Workflow, LifeBuoy, Rocket, PlayCircle } from "lucide-react";
import { DOCS_ARTICLES, DOCS_GROUPS } from "@/lib/docs";
import ProductVideo from "@/components/website/product-video";
import { TutorialVideo } from "@/components/docs/tutorial-video";
import { getServerLocale } from "@/lib/i18n/server";
import { translateUi } from "@/lib/i18n/translate";
import { localizePublicPath } from "@/lib/i18n/config";
import { localizedMetadata } from "@/lib/i18n/page-metadata";
import styles from "@/components/docs/docs.module.css";

export function generateMetadata(): Metadata {
  return localizedMetadata({ title: "AP3K Documentation for Instagram Automation", description: "Step-by-step AP3K guides for connecting Instagram, creating comment-to-DM automations, sending messages and troubleshooting delivery.", openGraph: { title: "AP3K Documentation for Instagram Automation", url: "https://ap3k.com/docs" } }, "/docs");
}

const icons = [Rocket, Clapperboard, PlayCircle, MessagesSquare, Workflow, LifeBuoy];
const featured = ["getting-started", "post-automation", "story-automation", "chat-automation", "flow-builder", "troubleshoot"];

export default function DocsPage() {
  const locale = getServerLocale();
  const tr = (text: string) => translateUi(text, locale);
  const lp = (path: string) => localizePublicPath(path, locale);
  return <>
    <section className={styles.startHere} aria-labelledby="start-here"><h2 id="start-here">{tr("What would you like to do?")}</h2><div className={styles.questions}>{[
      ["getting-started/connect-instagram-account", "Connect your Instagram account"],
      ["post-automation/create-instagram-comment-to-dm-automation", "Send a DM from a comment"],
      ["post-automation/ai-public-comment-replies", "Set up AI comment replies"],
      ["troubleshoot/fix-instagram-automation-not-working", "Fix an automation that is not replying"],
    ].map(([slug, title]) => <Link key={slug} href={lp(`/docs/${slug}`)}>{tr(title)}<ArrowRight size={16} className="rtl:rotate-180" /></Link>)}</div></section>
    <section className={styles.homeSection}><h2>{tr("Browse by topic")}</h2><div className={styles.topics}>{featured.map((id, index) => { const group = DOCS_GROUPS.find((item) => item.id === id)!; const articles = DOCS_ARTICLES.filter((article) => article.group === id); const Icon = icons[index] || BookOpen; return <Link key={id} className={styles.topic} href={lp(`/docs/${articles[0].slug}`)}><div className={styles.topicArt}><Icon size={27} strokeWidth={1.5} /></div><div className={styles.topicCopy}><h3>{tr(group.title)}</h3><p>{tr(group.description)}</p><small>{articles.length} {tr("articles")}</small></div></Link>; })}</div></section>
    <section className={styles.homeSection}><h2>{tr("Create your first automation")}</h2><p>{tr("Follow the complete walkthrough using the AP3K Instagram account.")}</p><TutorialVideo /><Link href={lp("/docs/post-automation/create-instagram-comment-to-dm-automation")}>{tr("Read the step-by-step guide")} <span aria-hidden="true">→</span></Link></section>
    <section className={styles.homeSection}><h2>{tr("AP3K in 36 seconds")}</h2><ProductVideo /></section>
    <section className={styles.homeSection}><h2>{tr("Advanced integrations")}</h2><p>{tr("Already comfortable with AP3K? Connect an AI client to supported workspace tools.")}</p><div className={styles.questions}>{DOCS_ARTICLES.filter((article) => article.group === "ai-connectors-mcp").map((article) => <Link key={article.slug} href={lp(`/docs/${article.slug}`)}>{tr(article.title)}<ArrowRight size={16} className="rtl:rotate-180" /></Link>)}</div></section>
    <section className={styles.homeSection}><h2>{tr("Common questions")}</h2><div className={styles.questions}>{["getting-started/connect-instagram-account", "post-automation/instagram-automation-triggers", "troubleshoot/fix-instagram-automation-not-working", "getting-started/ap3k-plans-and-pricing", "post-automation/ai-public-comment-replies", "queue/how-the-dm-queue-works"].map((slug) => { const article = DOCS_ARTICLES.find((item) => item.slug === slug); return article && <Link key={slug} href={lp(`/docs/${slug}`)}>{tr(article.title)}<ArrowRight size={16} className="rtl:rotate-180" /></Link>; })}</div></section>
  </>;
}
