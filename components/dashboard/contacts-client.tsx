"use client";

import { ChevronLeft, ChevronRight, Instagram, MessageCircle, Search, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const CONTACTS_PER_PAGE = 12;

export default function ContactsClient({ slug, contacts }: { slug: string; contacts: any[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return contacts;
    return contacts.filter((contact) => `${contact.recipientUsername ?? ""}`.toLowerCase().includes(needle));
  }, [contacts, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / CONTACTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedContacts = filtered.slice((currentPage - 1) * CONTACTS_PER_PAGE, currentPage * CONTACTS_PER_PAGE);

  useEffect(() => setPage(1), [query]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  return (
    <div className="mx-auto w-full max-w-7xl py-5 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ap3k-kicker">Instagram audience</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">Contacts</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">People who have interacted with your AP3K automations or inbox.</p>
        </div>
        <span className="w-fit rounded-full bg-rf-purple/10 px-3 py-1.5 text-xs font-black text-rf-purple">{contacts.length} contact{contacts.length === 1 ? "" : "s"}</span>
      </div>

      <label className="relative mb-4 block max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <span className="sr-only">Search contacts</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by Instagram username" className="ap3k-input w-full rounded-2xl py-3 pl-11 pr-4 text-sm" />
      </label>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0d1220]">
        <div className="hidden grid-cols-[minmax(220px,1fr)_140px_140px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:border-white/10 dark:bg-white/[0.04] md:grid">
          <span>Contact</span><span>Source</span><span className="text-right">Conversation</span>
        </div>
        {filtered.length === 0 ? (
          <div className="grid min-h-72 place-items-center p-8 text-center">
            <div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rf-purple/10 text-rf-purple"><UsersRound className="h-6 w-6" /></span><p className="mt-4 font-black text-slate-950 dark:text-white">{query ? "No matching contacts" : "No contacts yet"}</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Contacts appear after an Instagram interaction reaches AP3K.</p></div>
          </div>
        ) : pagedContacts.map((contact) => (
          <article key={contact.id} className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0 dark:border-white/[0.07] md:grid-cols-[minmax(220px,1fr)_140px_140px] md:items-center md:gap-4 md:px-5">
            <div className="flex min-w-0 items-center gap-3"><ContactAvatar src={contact.profilePictureUrl} name={contact.recipientUsername || contact.recipientIgId} /><div className="min-w-0"><p className="truncate text-sm font-black text-slate-950 dark:text-white">{contact.recipientUsername ? `@${contact.recipientUsername.replace(/^@/, "")}` : "Instagram user"}</p><p className="text-xs text-slate-400">Instagram contact</p></div></div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-pink-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-pink-600 dark:text-pink-300"><Instagram className="h-3 w-3" /> {contact.automation?.source ?? "Manual"}</span>
            {contact.conversationId ? <Link href={`/dashboard/${slug}/inbox?conversation=${contact.conversationId}`} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-700 transition hover:border-rf-purple/30 hover:bg-rf-purple/5 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/[0.05]"><MessageCircle className="h-3.5 w-3.5" /> Open chat</Link> : <span className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-400 dark:bg-white/[0.05]">Lead captured</span>}
          </article>
        ))}
      </div>

      {filtered.length > CONTACTS_PER_PAGE && (
        <nav aria-label="Contacts pagination" className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-[#0d1220]">
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-xs font-black text-slate-600 transition hover:bg-slate-100 disabled:opacity-35 dark:text-slate-300 dark:hover:bg-white/10"><ChevronLeft className="h-4 w-4" /> Previous</button>
          <span className="text-center text-xs font-bold text-slate-500 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
          <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages} className="inline-flex min-h-10 items-center gap-1 rounded-xl px-3 text-xs font-black text-slate-600 transition hover:bg-slate-100 disabled:opacity-35 dark:text-slate-300 dark:hover:bg-white/10">Next <ChevronRight className="h-4 w-4" /></button>
        </nav>
      )}
    </div>
  );
}

function ContactAvatar({ src, name }: { src?: string | null; name: string }) {
  return <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-ap3k-gradient text-sm font-black uppercase text-white">{src ? <Image src={src} alt={`${name} profile picture`} fill sizes="44px" className="object-cover" unoptimized /> : name.replace(/^@/, "").slice(0, 1)}</span>;
}
