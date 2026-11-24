"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, BookOpen, ChevronDown, Menu, Search, X } from "lucide-react";
import AP3KLogo from "@/components/global/ap3k-logo";
import ThemeToggle from "@/components/global/theme-toggle";
import LanguageSwitcher from "@/components/global/language-switcher";
import { useUi } from "@/components/i18n/use-ui";
import { useI18n } from "@/providers/i18n-provider";
import { localizePublicPath, stripLocaleFromPath } from "@/lib/i18n/config";
import { DOCS_GROUPS } from "@/lib/docs/groups";
import labels from "@/lib/docs/navigation-labels.json";
import type { DocsHeading } from "@/lib/docs/types";
import styles from "./docs.module.css";
import { docsFont } from "./font";

export type DocsSearchEntry = { slug: string; group: string; title: string; description: string; text: string; headings: DocsHeading[] };

export default function DocsShell({ entries, children }: { entries: DocsSearchEntry[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const cleanPath = stripLocaleFromPath(pathname);
  const { locale } = useI18n();
  const tr = useUi();
  const lp = (path: string) => localizePublicPath(path, locale);
  const current = entries.find((article) => cleanPath === `/docs/${article.slug}`);
  const [search, setSearch] = useState(false);
  const [menu, setMenu] = useState(false);
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMenu(false);
    setSearch(false);
    if (!window.location.hash) window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearch((value) => !value);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  const results = useMemo(() => {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return entries
      .map((article) => ({ ...article, score: terms.reduce((sum, term) => sum + (article.title.toLowerCase().includes(term) ? 10 : 0), 0) }))
      .filter((article) => terms.every((term) => `${article.title} ${article.description} ${article.text}`.toLowerCase().includes(term)))
      .sort((a, b) => b.score - a.score);
  }, [entries, query]);

  const searchButton = (wide = false) => <button type="button" className={wide ? styles.searchWide : styles.searchButton} onClick={() => setSearch(true)}><Search size={18} /><span>{tr("Search documentation")}</span><kbd>⌘ K</kbd></button>;
  const navigation = <nav aria-label={tr("Documentation topics")}>{DOCS_GROUPS.map((group) => <details key={`${group.id}-${current?.group}`} open={current?.group === group.id || undefined}><summary>{tr(group.title)}<ChevronDown size={15} /></summary><div>{entries.filter((article) => article.group === group.id).map((article) => <Link key={article.slug} href={lp(`/docs/${article.slug}`)} aria-current={article.slug === current?.slug ? "page" : undefined} onClick={() => setMenu(false)}><BookOpen size={14} />{tr((labels as Record<string, string>)[article.slug] || article.title)}</Link>)}</div></details>)}</nav>;

  return <>
    <a className={styles.skip} href="#docs-content">{tr("Skip to content")}</a>
    <header className={styles.header}>
      <Link className={styles.brand} href={lp("/docs")} aria-label={tr("AP3K Documentation")}><AP3KLogo className="gap-2 text-lg" markClassName="h-7 w-7 rounded-lg shadow-none ring-0 [&>svg]:p-1" /><span>{tr("Documentation")}</span></Link>
      <button className={styles.headerSearch} aria-label={tr("Search documentation")} onClick={() => setSearch(true)}><Search size={17} /></button>
      <div className={styles.trail}>{current ? <><Link href={lp("/docs")}>{tr(DOCS_GROUPS.find((group) => group.id === current.group)?.title || "Documentation")}</Link><span>/</span><strong>{current.title}</strong></> : <span>{tr("Documentation")}</span>}</div>
      <div className={styles.headerActions}><Link href={lp("/pricing")}>{tr("Pricing")}</Link><Link href={lp("/contact")}>{tr("Contact support")}</Link><Link className={styles.signIn} href={lp("/sign-in")}>{tr("Sign in")}</Link><LanguageSwitcher compact /><ThemeToggle compact /><button className={styles.mobileSearch} aria-label={tr("Search documentation")} onClick={() => setSearch(true)}><Search size={20} /></button><button className={styles.menuButton} aria-label={tr("Open documentation menu")} onClick={() => setMenu(true)}><Menu size={21} /></button></div>
    </header>
    <aside className={styles.sidebar}>{navigation}<div className={styles.sidebarBottom}><Link href={lp("/contact")}>{tr("Need a hand? Contact support")} <ArrowRight size={15} className="rtl:rotate-180" /></Link></div></aside>
    <main id="docs-content" className={`${styles.main} ${current ? styles.articleMain : ""}`} tabIndex={-1}>{!current && <div className={styles.homeIntro}><h1>{tr("AP3K Documentation")}</h1><p>{tr("Everything you need to turn Instagram interactions into conversations.")}<br />{tr("Learn the basics, build automations, and find answers.")}</p>{searchButton(true)}</div>}{children}</main>
    <Dialog.Root open={menu} onOpenChange={setMenu}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.mobileDrawer} dir={locale === "ar" ? "rtl" : "ltr"} style={{ fontFamily: docsFont.style.fontFamily }} aria-describedby={undefined}><div className={styles.dialogTop}><Dialog.Title>{tr("Documentation")}</Dialog.Title><Dialog.Close aria-label={tr("Close documentation menu")}><X size={20} /></Dialog.Close></div>{searchButton(true)}{navigation}<Link href={lp("/pricing")}>{tr("Pricing")}</Link><Link href={lp("/contact")}>{tr("Contact support")}</Link></Dialog.Content></Dialog.Portal></Dialog.Root>
    <Dialog.Root open={search} onOpenChange={setSearch}><Dialog.Portal><Dialog.Overlay className={styles.overlay} /><Dialog.Content className={styles.searchDialog} dir={locale === "ar" ? "rtl" : "ltr"} style={{ fontFamily: docsFont.style.fontFamily }} aria-describedby={undefined} onOpenAutoFocus={(event) => { event.preventDefault(); input.current?.focus(); }}><Dialog.Title className="sr-only">{tr("Search documentation")}</Dialog.Title><div className={styles.searchInput}><Search size={21} /><input ref={input} aria-label={tr("Search documentation articles")} placeholder={tr("Search documentation…")} value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button onClick={() => setQuery("")}>{tr("Clear")}</button>}<Dialog.Close aria-label={tr("Close search")}><X size={20} /></Dialog.Close></div><div className={styles.results} aria-live="polite">{query.trim() ? <><p>{results.length} {tr(results.length === 1 ? "result" : "results")} “{query}”</p>{results.map((article) => <Link key={article.slug} href={lp(`/docs/${article.slug}`)} onClick={() => setSearch(false)}><BookOpen size={18} /><div><strong>{article.title}</strong><p>{article.description}</p><small>{tr(DOCS_GROUPS.find((group) => group.id === article.group)?.title || "Documentation")}</small></div><ArrowRight size={17} className="rtl:rotate-180" /></Link>)}{!results.length && <div className={styles.noResults}>{tr("No articles found. Try “keywords”, “connect Instagram”, or “delay”.")}</div>}</> : <div className={styles.noResults}>{tr("Search guides, features, and troubleshooting.")}<div className={styles.suggestions}>{["Connect Instagram", "Keywords", "Delay", "AI replies"].map((suggestion) => <button key={suggestion} onClick={() => setQuery(tr(suggestion))}>{tr(suggestion)}</button>)}</div></div>}</div><div className={styles.searchFooter}>{tr("Press")} <kbd>Esc</kbd> {tr("to close")} · <kbd>Tab</kbd> {tr("to navigate")}</div></Dialog.Content></Dialog.Portal></Dialog.Root>
  </>;
}
