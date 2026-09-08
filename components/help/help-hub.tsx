"use client";

import { askSupportAssistantAction, clearSupportHistoryAction, getSupportHistoryAction } from "@/actions/support";
import { cn } from "@/lib/utils";
import { BookOpen, CircleHelp, ExternalLink, Loader2, Mail, RefreshCw, RotateCcw, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

type ChatMessage = { id: string; role: string; content: string; createdAt: Date | string };

export default function HelpHub({ slug, expanded = true, mobile = false }: { slug: string; expanded?: boolean; mobile?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          className={cn("flex min-h-11 w-full items-center rounded-xl text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white", expanded ? "gap-2.5 px-3" : "justify-center")}
          aria-expanded={menuOpen}
          aria-label="Help"
        >
          <CircleHelp className="h-[18px] w-[18px] shrink-0" />
          {expanded ? <span>Help</span> : null}
        </button>
        {menuOpen ? (
          <div className={cn("z-[70] w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-slate-900 shadow-2xl dark:border-white/10 dark:bg-[#121827] dark:text-white", mobile ? "mt-2" : "fixed bottom-20", !mobile && (expanded ? "left-[244px]" : "left-[88px]"))}>
            <p className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Support</p>
            <button type="button" onClick={() => { setAssistantOpen(true); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-violet-50 dark:hover:bg-violet-500/10">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-500"><Sparkles className="h-4 w-4" /></span>
              <span><span className="block text-sm font-black">Get help</span><span className="block text-xs text-slate-500">Ask AP3K Support Assistant</span></span>
            </button>
            <HelpLink href="/help" icon={BookOpen} title="Knowledge base" detail="Guides for every AP3K feature" />
            <HelpLink href={`/dashboard/${slug}/account`} icon={RefreshCw} title="Fix Instagram permissions" detail="Reconnect your professional account" />
            <HelpLink href="/contact" icon={Mail} title="Email support" detail="Contact support@ap3k.com" />
            <div className="my-2 border-t border-slate-200 dark:border-white/10" />
            <div className="grid grid-cols-2 gap-1 px-1 pb-1 text-xs font-bold text-slate-500">
              <Link href="/terms" className="rounded-lg px-2 py-2 hover:bg-slate-100 dark:hover:bg-white/[0.06]">Terms</Link>
              <Link href="/privacy" className="rounded-lg px-2 py-2 hover:bg-slate-100 dark:hover:bg-white/[0.06]">Privacy</Link>
            </div>
          </div>
        ) : null}
      </div>
      {assistantOpen ? <SupportAssistant onClose={() => setAssistantOpen(false)} /> : null}
    </>
  );
}

function HelpLink({ href, icon: Icon, title, detail }: { href: string; icon: typeof BookOpen; title: string; detail: string }) {
  return <Link href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-100 dark:hover:bg-white/[0.06]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/[0.06]"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-black">{title}</span><span className="block truncate text-xs text-slate-500">{detail}</span></span><ExternalLink className="h-3.5 w-3.5 text-slate-400" /></Link>;
}

function SupportAssistant({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void getSupportHistoryAction().then((result) => { if (active) { setMessages(result.messages); setLoading(false); } });
    return () => { active = false; };
  }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, pending]);

  const send = () => {
    const value = draft.trim();
    if (!value || pending) return;
    setDraft("");
    setNotice(null);
    const optimistic: ChatMessage = { id: `pending-${Date.now()}`, role: "user", content: value, createdAt: new Date() };
    setMessages((current) => [...current, optimistic]);
    startTransition(async () => {
      const result = await askSupportAssistantAction(value);
      if (result.status === 200 && result.userMessage && result.assistantMessage) {
        setMessages((current) => [...current.filter((item) => item.id !== optimistic.id), result.userMessage!, result.assistantMessage!]);
      } else {
        if ("userMessage" in result && result.userMessage) {
          setMessages((current) => [...current.filter((item) => item.id !== optimistic.id), result.userMessage!]);
        }
        setNotice(result.data);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/55 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="AP3K Support Assistant">
      <section className="ml-auto flex h-full w-full max-w-[430px] flex-col border-l border-white/10 bg-white text-slate-950 shadow-2xl dark:bg-[#0b1020] dark:text-white">
        <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 dark:border-white/10">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-ap3k-gradient text-white"><Sparkles className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><h2 className="font-black">AP3K Support Assistant</h2><p className="text-xs text-slate-500">Product guidance, available anytime</p></div>
          <button type="button" onClick={onClose} aria-label="Close support" className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06]"><X className="h-5 w-5" /></button>
        </header>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5">
          <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm leading-6 dark:bg-white/[0.07]">Hi! Ask me how to connect Instagram, build an automation, use AP3K AI, manage billing, or troubleshoot your workspace.</div>
          {loading ? <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-violet-500" /></div> : null}
          {messages.map((message) => <div key={message.id} className={cn("whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6", message.role === "user" ? "ml-auto max-w-[85%] rounded-br-md bg-violet-600 text-white" : "max-w-[92%] rounded-bl-md bg-slate-100 dark:bg-white/[0.07]")}>{message.content}</div>)}
          {pending ? <div className="flex w-fit items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-xs text-slate-500 dark:bg-white/[0.07]"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…</div> : null}
          {notice ? <p className="rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-200">{notice}</p> : null}
          <div ref={bottomRef} />
        </div>
        <footer className="border-t border-slate-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-white/10">
          <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/[0.04]">
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} rows={2} maxLength={1200} placeholder="Ask about AP3K…" className="min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none" />
            <button type="button" onClick={send} disabled={!draft.trim() || pending} aria-label="Send" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-600 text-white disabled:opacity-35"><Send className="h-4 w-4" /></button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-500"><span>AI can make mistakes. Never share secrets.</span><button type="button" onClick={() => startTransition(async () => { await clearSupportHistoryAction(); setMessages([]); })} className="inline-flex items-center gap-1 font-bold hover:text-slate-900 dark:hover:text-white"><RotateCcw className="h-3 w-3" /> Start over</button></div>
        </footer>
      </section>
    </div>
  );
}
