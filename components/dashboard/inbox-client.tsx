"use client";

import { getInboxConversations, getInboxMessages, sendInboxReply } from "@/actions/inbox";
import { ArrowLeft, Inbox, Loader2, RefreshCw, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function InboxClient() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => conversations.find((item) => item.id === selectedId), [conversations, selectedId]);

  const loadConversations = async () => {
    setLoading(true);
    const result = await getInboxConversations();
    const rows = result.status === 200 && Array.isArray(result.data) ? result.data : [];
    setConversations(rows);
    setSelectedId((current) => current ?? rows[0]?.id ?? null);
    setLoading(false);
  };

  useEffect(() => { void loadConversations(); }, []);
  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    setLoadingMessages(true);
    void getInboxMessages(selectedId).then((result) => {
      setMessages(result.status === 200 && Array.isArray(result.data) ? result.data : []);
      setLoadingMessages(false);
    });
  }, [selectedId]);

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
    <div className="flex min-h-[calc(100vh-72px)] flex-col bg-slate-50 p-3 text-slate-950 dark:bg-[#050816] dark:text-white sm:p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[0.2em] text-rf-purple">Conversations</p><h1 className="mt-1 text-3xl font-black tracking-tight">Inbox</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Every reply, story interaction, and automated response in one place.</p></div>
        <button type="button" onClick={() => void loadConversations()} aria-label="Refresh inbox" className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300"><RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /></button>
      </div>

      <div className="grid min-h-0 flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#111827] md:grid-cols-[320px_1fr] xl:grid-cols-[380px_1fr]">
        <aside className={["min-h-0 border-r border-slate-200 dark:border-white/10", selectedId ? "hidden md:block" : "block"].join(" ")}>
          {loading ? <div className="grid h-64 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-rf-purple" /></div> : conversations.length === 0 ? <EmptyInbox /> : <div className="max-h-[calc(100vh-210px)] overflow-y-auto">{conversations.map((conversation) => <button key={conversation.id} type="button" onClick={() => setSelectedId(conversation.id)} className={["flex w-full items-start gap-3 border-b border-slate-100 p-4 text-left transition dark:border-white/[0.07]", selectedId === conversation.id ? "bg-rf-purple/10" : "hover:bg-slate-50 dark:hover:bg-white/[0.04]"].join(" ")}><Avatar name={conversation.recipientUsername || conversation.recipientIgId} /><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-black">{conversation.recipientUsername ? `@${conversation.recipientUsername}` : "Instagram user"}</span>{conversation.unreadCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rf-purple px-1 text-[10px] font-black text-white">{conversation.unreadCount}</span>}</span><span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">{conversation.messages?.[0]?.content ?? "New conversation"}</span><span className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:bg-white/[0.07] dark:text-slate-400">{conversation.automation?.source ?? "manual"}</span></span></button>)}</div>}
        </aside>

        <main className={["min-h-0 flex-col", selectedId ? "flex" : "hidden md:flex"].join(" ")}>
          {!selected ? (
            <EmptyInbox />
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-slate-200 p-4 dark:border-white/10">
                <button type="button" onClick={() => setSelectedId(null)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 md:hidden dark:border-white/10"><ArrowLeft className="h-4 w-4" /></button>
                <Avatar name={selected.recipientUsername || selected.recipientIgId} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{selected.recipientUsername ? `@${selected.recipientUsername}` : "Instagram user"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selected.automation?.name ? `Started by ${selected.automation.name}` : "Instagram conversation"}</p>
                </div>
              </header>
              <div className="flex min-h-[420px] flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 p-4 dark:bg-[#080c18] sm:p-6">
                {loadingMessages ? <Loader2 className="m-auto h-5 w-5 animate-spin text-rf-purple" /> : messages.map((message) => (
                  <div key={message.id} className={["max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm", message.direction === "OUTBOUND" ? "ml-auto rounded-br-sm bg-rf-purple text-white" : "rounded-bl-sm border border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-[#151c2c] dark:text-slate-100"].join(" ")}>
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p className={message.direction === "OUTBOUND" ? "mt-1 text-[10px] text-white/60" : "mt-1 text-[10px] text-slate-400"}>{formatTime(message.createdAt)}</p>
                  </div>
                ))}
              </div>
              <footer className="border-t border-slate-200 p-3 dark:border-white/10 sm:p-4">
                {error && <p className="mb-2 text-xs font-bold text-red-500">{error}</p>}
                <div className="flex items-end gap-2">
                  <textarea value={draft} maxLength={1000} rows={2} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="Write a reply…" className="ap3k-textarea min-w-0 flex-1 resize-none rounded-2xl px-4 py-3 text-sm" />
                  <button type="button" onClick={() => void send()} disabled={sending || !draft.trim()} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 text-white disabled:opacity-40">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
                </div>
                <p className="mt-2 text-[10px] text-slate-400">Manual replies are available inside Instagram&apos;s messaging window.</p>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyInbox() { return <div className="grid min-h-64 place-items-center p-8 text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rf-purple/10 text-rf-purple"><Inbox className="h-6 w-6" /></span><p className="mt-4 font-black">No conversations yet</p><p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">New Instagram DMs and story interactions will appear here automatically.</p></div></div>; }
function Avatar({ name }: { name: string }) { return <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-pink-500 text-sm font-black uppercase text-white">{name.replace(/^@/, "").slice(0, 2)}</span>; }
function formatTime(value: string | Date) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
