"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useI18n } from "@/providers/i18n-provider";
import { translateUi } from "@/lib/i18n/translate";
import { localizePublicPath } from "@/lib/i18n/config";
import { useUi } from "@/components/i18n/use-ui";
import { UiText } from "@/components/i18n/localized-copy";
import { askSupportAssistantAction, clearSupportHistoryAction, getSupportHistoryAction } from "@/actions/support";
import { cn } from "@/lib/utils";
import { BookOpen, CircleHelp, ExternalLink, Loader2, Mail, RefreshCw, RotateCcw, Send, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ChatMessage = { id: string; role: string; content: string; createdAt: Date | string };

export default function HelpHub({ slug, expanded = true, mobile = false }: { slug: string; expanded?: boolean; mobile?: boolean }) {
  const { locale } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
        <button
          type="button"
          className={cn("flex min-h-11 w-full items-center rounded-xl text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white", expanded ? "gap-2.5 px-3" : "justify-center")}
          aria-expanded={menuOpen}
          aria-label={translateUi("Help", locale)}
        >
          <CircleHelp className="h-[18px] w-[18px] shrink-0" />
          {expanded ? <span><UiText>{"Help"}</UiText></span> : null}
        </button>
        </PopoverTrigger>
          <PopoverContent side={mobile ? "top" : locale === "ar" ? "left" : "right"} align="end" sideOffset={12} collisionPadding={12} dir={locale === "ar" ? "rtl" : "ltr"} className="z-[70] w-[min(20rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 text-slate-900 shadow-2xl dark:border-white/10 dark:bg-[#121827] dark:text-white">
            <p className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400"><UiText>{"Support"}</UiText></p>
            <button type="button" onClick={() => { setAssistantOpen(true); setMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start transition hover:bg-violet-50 dark:hover:bg-violet-500/10">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-500"><Sparkles className="h-4 w-4" /></span>
              <span><span className="block text-sm font-black"><UiText>{"Get help"}</UiText></span><span className="block text-xs text-slate-500"><UiText>{"Ask AP3K Support Assistant"}</UiText></span></span>
            </button>
            <HelpLink href="/help" icon={BookOpen} title="Knowledge base" detail="Guides for every AP3K feature" />
            <HelpLink href={`/dashboard/${slug}/account`} icon={RefreshCw} title="Fix Instagram permissions" detail="Reconnect your professional account" />
            <HelpLink href="/contact" icon={Mail} title="Email support" detail="Contact support@ap3k.com" />
            <div className="my-2 border-t border-slate-200 dark:border-white/10" />
            <div className="grid grid-cols-2 gap-1 px-1 pb-1 text-xs font-bold text-slate-500">
              <Link href={localizePublicPath("/terms", locale)} className="rounded-lg px-2 py-2 hover:bg-slate-100 dark:hover:bg-white/[0.06]"><UiText>{"Terms"}</UiText></Link>
              <Link href={localizePublicPath("/privacy", locale)} className="rounded-lg px-2 py-2 hover:bg-slate-100 dark:hover:bg-white/[0.06]"><UiText>{"Privacy"}</UiText></Link>
            </div>
          </PopoverContent>
      </Popover>
      {assistantOpen ? <SupportAssistant onClose={() => setAssistantOpen(false)} /> : null}
    </>
  );
}

function HelpLink({ href, icon: Icon, title, detail }: { href: string; icon: typeof BookOpen; title: string; detail: string }) {
  const { locale } = useI18n();
  return <Link href={localizePublicPath(href, locale)} className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-100 dark:hover:bg-white/[0.06]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/[0.06]"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-black"><UiText>{title}</UiText></span><span className="block truncate text-xs text-slate-500"><UiText>{detail}</UiText></span></span><ExternalLink className="h-3.5 w-3.5 text-slate-400" /></Link>;
}

function SupportAssistant({ onClose }: { onClose: () => void }) {
  const tr = useUi();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const requestInFlight = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void getSupportHistoryAction().then((result) => { if (active) setMessages(result.messages); }).catch(() => { if (active) setNotice("Could not load support history. Please try again."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, pending]);

  const send = async () => {
    const value = draft.trim();
    if (!value || requestInFlight.current) return;
    requestInFlight.current = true;
    setPending(true);
    setDraft("");
    setNotice(null);
    const optimistic: ChatMessage = { id: `pending-${Date.now()}`, role: "user", content: value, createdAt: new Date() };
    setMessages((current) => [...current, optimistic]);
    try {
      const result = await askSupportAssistantAction(value);
      if (result.status === 200 && result.userMessage && result.assistantMessage) {
        setMessages((current) => [...current.filter((item) => item.id !== optimistic.id), result.userMessage!, result.assistantMessage!]);
      } else {
        if ("userMessage" in result && result.userMessage) {
          setMessages((current) => [...current.filter((item) => item.id !== optimistic.id), result.userMessage!]);
        }
        setNotice(result.data);
      }
    } catch {
      setNotice("Could not send your question. Please try again.");
      setDraft(value);
      setMessages((current) => current.filter((item) => item.id !== optimistic.id));
    } finally {
      requestInFlight.current = false;
      setPending(false);
    }
  };

  const clearHistory = async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setPending(true);
    try { await clearSupportHistoryAction(); setMessages([]); setNotice(null); }
    catch { setNotice("Could not clear support history. Please try again."); }
    finally { requestInFlight.current = false; setPending(false); }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[100]" role="presentation">
      <button
        type="button"
        aria-label={tr("Close support assistant")}
        onClick={onClose}
        className="pointer-events-auto absolute inset-0 bg-slate-950/55 backdrop-blur-sm sm:hidden"
      />
      <section
        className="pointer-events-auto fixed inset-0 flex h-[100dvh] w-full flex-col overflow-hidden bg-white text-slate-950 shadow-[0_28px_100px_rgba(15,23,42,0.34)] animate-in fade-in-0 slide-in-from-bottom-4 duration-300 dark:bg-[#0b1020] dark:text-white sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[min(720px,calc(100dvh-2rem))] sm:w-[min(430px,calc(100vw-2rem))] sm:rounded-[28px] sm:border sm:border-slate-200 sm:slide-in-from-right-4 dark:sm:border-white/10"
        role="dialog"
        aria-modal="false"
        aria-label={tr("AP3K Support Assistant")}
      >
        <header className="flex min-h-[72px] shrink-0 items-center gap-3 border-b border-slate-200 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] dark:border-white/10 sm:py-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ap3k-gradient text-white shadow-lg shadow-violet-500/20"><Sparkles className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1"><h2 className="truncate font-black"><UiText>{"AP3K Support Assistant"}</UiText></h2><p className="truncate text-xs text-slate-500 dark:text-slate-400"><UiText>{"Answers based on AP3K"}</UiText></p></div>
          <button type="button" onClick={onClose} aria-label={tr("Close support")} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"><X className="h-5 w-5" /></button>
        </header>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-5">
          <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-sm leading-6 dark:bg-white/[0.07]"><UiText>{"Hi! Ask me how to connect Instagram, build an automation, use AP3K AI, manage billing, or troubleshoot your workspace."}</UiText></div>
          <p className="px-1 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400"><UiText>{"Support Assistant · AI agent"}</UiText></p>
          {loading ? <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-violet-500" /></div> : null}
          {messages.map((message) => <div dir="auto" key={message.id} className={cn("whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6", message.role === "user" ? "ms-auto max-w-[85%] rounded-br-md bg-violet-600 text-white" : "max-w-[92%] rounded-bl-md bg-slate-100 dark:bg-white/[0.07]")}>{message.content}</div>)}
          {pending ? <div className="flex w-fit items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-xs text-slate-500 dark:bg-white/[0.07]"><Loader2 className="h-3.5 w-3.5 animate-spin" /><UiText>{" Thinking…"}</UiText></div> : null}
          {notice ? <p className="rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-200"><UiText>{notice}</UiText></p> : null}
          <div ref={bottomRef} />
        </div>
        <footer className="shrink-0 border-t border-slate-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-white/10 sm:p-4">
          <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-500/10 dark:border-white/10 dark:bg-white/[0.04]">
            <textarea dir="auto" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} rows={1} maxLength={1200} placeholder={tr("Ask a question…")} className="max-h-32 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm outline-none" />
            <button type="button" onClick={send} disabled={!draft.trim() || pending} aria-label={tr("Send")} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-60 dark:disabled:bg-white/10"><Send className="h-4 w-4" /></button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-500"><span><UiText>{"AI can make mistakes. Never share secrets."}</UiText></span><button type="button" disabled={pending} onClick={() => void clearHistory()} className="inline-flex shrink-0 items-center gap-1 font-bold hover:text-slate-900 dark:hover:text-white"><RotateCcw className="h-3 w-3" /> <UiText>{"Start over"}</UiText></button></div>
        </footer>
      </section>
    </div>,
    document.body
  );
}
