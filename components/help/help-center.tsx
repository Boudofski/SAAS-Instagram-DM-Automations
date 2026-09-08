"use client";

import { AP3K_HELP_ARTICLES } from "@/lib/ap3k-help";
import { BookOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";

export default function HelpCenter() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return AP3K_HELP_ARTICLES;
    return AP3K_HELP_ARTICLES.filter((article) => [article.category, article.title, article.summary, ...article.steps].join(" ").toLowerCase().includes(value));
  }, [query]);

  return (
    <>
      <section className="mx-auto max-w-4xl text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ap3k-gradient text-white shadow-lg"><BookOpen className="h-5 w-5" /></span>
        <p className="ap3k-kicker mt-5">AP3K Knowledge Base</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">How can we help?</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">Clear answers for Instagram connections, automations, AI, Inbox, billing, and account controls.</p>
        <label className="mx-auto mt-7 flex max-w-2xl items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl shadow-slate-950/5 dark:border-white/10 dark:bg-white/[0.05]"><Search className="h-5 w-5 text-slate-400" /><span className="sr-only">Search help</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search AP3K help…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
      </section>
      <section className="mx-auto mt-12 grid max-w-6xl gap-4 md:grid-cols-2">
        {filtered.map((article) => <article key={article.slug} id={article.slug} className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-[#101827]"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-500">{article.category}</p><h2 className="mt-2 text-xl font-black">{article.title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{article.summary}</p><ol className="mt-5 space-y-3">{article.steps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6 text-slate-700 dark:text-slate-300"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-500/10 text-[10px] font-black text-violet-500">{index + 1}</span><span>{step}</span></li>)}</ol></article>)}
      </section>
      {!filtered.length ? <p className="py-20 text-center text-sm text-slate-500">No guide matches that search. Email support@ap3k.com and we’ll help.</p> : null}
    </>
  );
}
