"use client";

import { getInboxConversations, getInboxMessages, sendInboxReply } from "@/actions/inbox";
import {
  ArrowDownUp,
  ArrowLeft,
  CheckCheck,
  ChevronDown,
  Clock3,
  ImageIcon,
  Inbox,
  Instagram,
  Loader2,
  MoreHorizontal,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  Settings2,
  Smile,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type ConversationFilter = "all" | "unread";

export default function InboxClient() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const messageEndRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => conversations.find((item) => item.id === selectedId), [conversations, selectedId]);
  const unreadTotal = useMemo(() => conversations.reduce((total, item) => total + Number(item.unreadCount || 0), 0), [conversations]);
  const filteredConversations = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return conversations.filter((conversation) => {
      if (filter === "unread" && !conversation.unreadCount) return false;
      if (!needle) return true;
      return `${conversation.recipientUsername ?? ""} ${conversation.recipientIgId ?? ""} ${conversation.messages?.[0]?.content ?? ""}`.toLowerCase().includes(needle);
    });
  }, [conversations, filter, query]);

  const loadConversations = async () => {
    setLoading(true);
    const result = await getInboxConversations();
    const rows = result.status === 200 && Array.isArray(result.data) ? result.data : [];
    setConversations(rows);
    setSelectedId((current) => current && rows.some((row) => row.id === current) ? current : rows[0]?.id ?? null);
    setLoading(false);
  };

  useEffect(() => { void loadConversations(); }, []);
  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    setLoadingMessages(true);
    setError(null);
    void getInboxMessages(selectedId).then((result) => {
      setMessages(result.status === 200 && Array.isArray(result.data) ? result.data : []);
      setConversations((current) => current.map((conversation) => conversation.id === selectedId ? { ...conversation, unreadCount: 0 } : conversation));
      setLoadingMessages(false);
    });
  }, [selectedId]);
  useEffect(() => { messageEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [loadingMessages, messages]);

  const send = async () => {
    if (!selectedId || !draft.trim()) return;
    setSending(true);
    setError(null);
    const message = draft.trim();
    const result = await sendInboxReply(selectedId, message);
    if (result.status === 200) {
      setDraft("");
      const refreshed = await getInboxMessages(selectedId);
      setMessages(refreshed.status === 200 && Array.isArray(refreshed.data) ? refreshed.data : []);
      await loadConversations();
    } else {
      setError(typeof result.data === "string" ? result.data : "Message could not be sent.");
    }
    setSending(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-72px)] flex-col bg-[#f5f6fa] text-slate-950 dark:bg-[#050816] dark:text-white">
      <header className="flex flex-col gap-4 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-white/10 dark:bg-[#080c18]/95 lg:flex-row lg:items-center">
        <div className="min-w-44"><p className="text-xs font-black uppercase tracking-[0.2em] text-rf-purple">Instagram</p><h1 className="mt-1 text-2xl font-black tracking-tight">Inbox</h1></div>
        <label className="relative mx-auto w-full max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" className="ap3k-input w-full rounded-xl py-3 pl-11 pr-4 text-sm" />
        </label>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={() => void loadConversations()} aria-label="Refresh inbox" className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/10"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /></button>
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"><Settings2 className="h-4 w-4" /></span>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 overflow-hidden bg-white dark:bg-[#0d1220] md:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[190px_330px_minmax(0,1fr)]">
        <nav aria-label="Inbox folders" className="hidden border-r border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.02] xl:block">
          <button type="button" onClick={() => setFilter("all")} className={folderClass(filter === "all")}><Inbox className="h-4 w-4" /><span className="flex-1 text-left">All chats</span><span>{conversations.length}</span></button>
          <button type="button" onClick={() => setFilter("unread")} className={folderClass(filter === "unread")}><Instagram className="h-4 w-4" /><span className="flex-1 text-left">Unread</span><span>{unreadTotal}</span></button>
          <div className="my-5 h-px bg-slate-200 dark:bg-white/10" />
          <p className="px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Quick access</p>
          <div className="mt-2 space-y-1 text-sm text-slate-500 dark:text-slate-400"><p className="flex items-center gap-2 rounded-xl px-3 py-2"><Clock3 className="h-4 w-4" /> Recent</p><p className="flex items-center gap-2 rounded-xl px-3 py-2"><UserRound className="h-4 w-4" /> Contacts</p></div>
          <div className="mt-8 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-xs leading-5 text-violet-900 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200"><strong className="block">Official Instagram inbox</strong><span className="mt-1 block opacity-75">Messages sync from AP3K automations and inbound replies.</span></div>
        </nav>

        <aside className={["min-h-0 border-r border-slate-200 dark:border-white/10", selectedId ? "hidden md:block" : "block"].join(" ")}>
          <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-3 dark:border-white/10">
            <button type="button" onClick={() => setFilter(filter === "all" ? "unread" : "all")} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-slate-300">{filter === "all" ? "All chats" : "Unread"}<ChevronDown className="h-3.5 w-3.5" /></button>
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-slate-400"><ArrowDownUp className="h-3.5 w-3.5" /> Newest</span>
          </div>
          {loading ? <div className="grid h-64 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-rf-purple" /></div> : filteredConversations.length === 0 ? <EmptyInbox filtered={Boolean(query || filter === "unread")} /> : <div className="max-h-[calc(100vh-142px)] overflow-y-auto">{filteredConversations.map((conversation) => <ConversationRow key={conversation.id} conversation={conversation} selected={selectedId === conversation.id} onClick={() => setSelectedId(conversation.id)} />)}</div>}
        </aside>

        <main className={["min-h-0 flex-col bg-white dark:bg-[#0d1220]", selectedId ? "flex" : "hidden md:flex"].join(" ")}>
          {!selected ? <EmptyInbox /> : (
            <>
              <header className="flex h-[72px] items-center gap-3 border-b border-slate-200 px-4 dark:border-white/10">
                <button type="button" onClick={() => setSelectedId(null)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 md:hidden dark:border-white/10"><ArrowLeft className="h-4 w-4" /></button>
                <Avatar src={selected.profilePictureUrl} name={selected.recipientUsername || selected.recipientIgId} size="lg" />
                <div className="min-w-0"><p className="truncate text-sm font-black">{displayName(selected)}</p><p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><Instagram className="h-3.5 w-3.5 text-pink-500" /> Instagram · {isReplyWindowOpen(selected.lastInboundAt) ? "Active now" : "Reply window closed"}</p></div>
                <div className="ml-auto flex items-center gap-2"><span className="hidden rounded-full bg-rf-purple/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-rf-purple sm:inline-flex">{selected.automation?.source ?? "manual"}</span><button type="button" aria-label="Conversation options" className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10"><MoreHorizontal className="h-5 w-5" /></button></div>
              </header>

              <div className="flex min-h-[420px] flex-1 flex-col overflow-y-auto bg-[radial-gradient(circle_at_top,#faf5ff_0,transparent_42%)] px-4 py-6 dark:bg-[radial-gradient(circle_at_top,rgba(109,40,217,0.12)_0,transparent_42%)] sm:px-7">
                <div className="mx-auto mb-7 flex max-w-sm flex-col items-center text-center"><Avatar src={selected.profilePictureUrl} name={selected.recipientUsername || selected.recipientIgId} size="xl" /><p className="mt-3 text-sm font-black">{displayName(selected)}</p><p className="text-xs text-slate-400">Instagram conversation</p>{selected.automation?.name ? <span className="mt-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">Started by {selected.automation.name}</span> : null}</div>
                {loadingMessages ? <Loader2 className="m-auto h-5 w-5 animate-spin text-rf-purple" /> : <MessageTimeline messages={messages} avatarUrl={selected.profilePictureUrl} name={selected.recipientUsername || selected.recipientIgId} />}
                <div ref={messageEndRef} />
              </div>

              <footer className="border-t border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-[#0d1220] sm:p-4">
                {error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-rf-purple/40 focus-within:ring-2 focus-within:ring-rf-purple/10 dark:border-white/10 dark:bg-white/[0.035]">
                  <textarea value={draft} maxLength={1000} rows={2} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder={isReplyWindowOpen(selected.lastInboundAt) ? "Reply to this Instagram conversation…" : "Instagram's 24-hour reply window is closed"} disabled={!isReplyWindowOpen(selected.lastInboundAt)} className="w-full resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60" />
                  <div className="flex items-center gap-1 border-t border-slate-200 pt-2 dark:border-white/10"><button type="button" aria-label="Add emoji" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"><Smile className="h-4 w-4" /></button><button type="button" aria-label="Attach image" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"><ImageIcon className="h-4 w-4" /></button><button type="button" aria-label="Attach file" className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"><Paperclip className="h-4 w-4" /></button><span className="ml-auto hidden text-[10px] text-slate-400 sm:inline">Enter to send · Shift + Enter for a new line</span><button type="button" onClick={() => void send()} disabled={sending || !draft.trim() || !isReplyWindowOpen(selected.lastInboundAt)} className="ml-2 inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 text-xs font-black text-white shadow-sm disabled:opacity-35">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}<span className="hidden sm:inline">Send</span></button></div>
                </div>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function ConversationRow({ conversation, selected, onClick }: { conversation: any; selected: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={["flex w-full items-start gap-3 border-b border-slate-100 p-4 text-left transition dark:border-white/[0.07]", selected ? "bg-violet-50 dark:bg-violet-500/10" : "hover:bg-slate-50 dark:hover:bg-white/[0.04]"].join(" ")}><Avatar src={conversation.profilePictureUrl} name={conversation.recipientUsername || conversation.recipientIgId} size="lg" /><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate text-sm font-black">{displayName(conversation)}</span><span className="ml-auto shrink-0 text-[10px] text-slate-400">{relativeTime(conversation.lastMessageAt)}</span></span><span className={conversation.unreadCount ? "mt-1 block truncate text-xs font-bold text-slate-800 dark:text-white" : "mt-1 block truncate text-xs text-slate-500 dark:text-slate-400"}>{conversation.messages?.[0]?.content ?? "New conversation"}</span><span className="mt-2 flex items-center gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500 dark:bg-white/[0.07] dark:text-slate-400">{conversation.automation?.source ?? "manual"}</span>{conversation.unreadCount > 0 ? <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-rf-purple px-1 text-[10px] font-black text-white">{conversation.unreadCount}</span> : <CheckCheck className="ml-auto h-3.5 w-3.5 text-rf-purple/70" />}</span></span></button>;
}

function MessageTimeline({ messages, avatarUrl, name }: { messages: any[]; avatarUrl?: string | null; name: string }) {
  if (!messages.length) return <p className="m-auto text-sm text-slate-400">No messages in this conversation yet.</p>;
  let previousDay = "";
  return <div className="space-y-3">{messages.map((message) => {
    const day = formatDay(message.createdAt);
    const showDay = day !== previousDay;
    previousDay = day;
    const outbound = message.direction === "OUTBOUND";
    return <div key={message.id}>{showDay ? <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-slate-200 dark:bg-white/10" /><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{day}</span><span className="h-px flex-1 bg-slate-200 dark:bg-white/10" /></div> : null}<div className={outbound ? "flex justify-end" : "flex items-end gap-2"}>{!outbound ? <Avatar src={avatarUrl} name={name} size="sm" /> : null}<div className={["max-w-[82%] px-4 py-2.5 text-sm leading-6 shadow-sm", outbound ? "rounded-[1.25rem] rounded-br-sm bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white" : "rounded-[1.25rem] rounded-bl-sm bg-slate-100 text-slate-900 dark:bg-[#222836] dark:text-slate-100"].join(" ")}><p className="whitespace-pre-wrap break-words" dir="auto">{message.content}</p><p className={outbound ? "mt-1 text-right text-[9px] text-white/60" : "mt-1 text-[9px] text-slate-400"}>{formatClock(message.createdAt)}{outbound ? " · Sent" : ""}</p></div></div></div>;
  })}</div>;
}

function Avatar({ src, name, size }: { src?: string | null; name: string; size: "sm" | "lg" | "xl" }) {
  const dimensions = size === "sm" ? "h-7 w-7 text-[10px]" : size === "xl" ? "h-16 w-16 text-lg" : "h-11 w-11 text-sm";
  return <span className={`relative grid ${dimensions} shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 font-black uppercase text-white ring-2 ring-white shadow-sm dark:ring-[#0d1220]`}>{src ? <Image src={src} alt={`${name} profile picture`} fill sizes={size === "sm" ? "28px" : size === "xl" ? "64px" : "44px"} className="object-cover" unoptimized /> : name.replace(/^@/, "").slice(0, 1)}</span>;
}

function EmptyInbox({ filtered = false }: { filtered?: boolean }) { return <div className="grid min-h-64 place-items-center p-8 text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rf-purple/10 text-rf-purple"><Inbox className="h-6 w-6" /></span><p className="mt-4 font-black">{filtered ? "No matching chats" : "No conversations yet"}</p><p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{filtered ? "Try a different search or show all chats." : "New Instagram DMs and story interactions will appear here automatically."}</p></div></div>; }
function folderClass(active: boolean) { return ["mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black transition", active ? "bg-slate-200 text-slate-950 dark:bg-white/10 dark:text-white" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"].join(" "); }
function displayName(conversation: any) { return conversation.recipientUsername ? `@${conversation.recipientUsername.replace(/^@/, "")}` : "Instagram user"; }
function isReplyWindowOpen(value?: string | Date | null) { if (!value) return false; const date = new Date(value); return !Number.isNaN(date.getTime()) && Date.now() - date.getTime() <= 24 * 60 * 60 * 1000; }
function relativeTime(value: string | Date) { const date = new Date(value); if (Number.isNaN(date.getTime())) return ""; const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000)); if (minutes < 1) return "now"; if (minutes < 60) return `${minutes}m`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h`; return `${Math.floor(hours / 24)}d`; }
function formatDay(value: string | Date) { const date = new Date(value); if (Number.isNaN(date.getTime())) return ""; const today = new Date(); if (date.toDateString() === today.toDateString()) return "Today"; return date.toLocaleDateString([], { month: "short", day: "numeric", year: date.getFullYear() === today.getFullYear() ? undefined : "numeric" }); }
function formatClock(value: string | Date) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
