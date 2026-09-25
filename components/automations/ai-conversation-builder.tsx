"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, Check, ChevronRight, GitBranch, Loader2, MessageCircle, Plus, RotateCcw, Send, ShieldCheck, Sparkles, Trash2, Wifi, BatteryFull } from "lucide-react";
import { generateConversationPlan, previewAiConversation } from "@/actions/ai-conversation";
import { saveMessageAutomation } from "@/actions/automation";
import { aiConversationSchema, DEFAULT_AI_CONVERSATION, readAiConversation, conversationStopIntent, type AiConversationConfig, type AiConversationTurn } from "@/lib/ai-conversation";
import { useQueryClient } from "@tanstack/react-query";

type Props = { slug: string; integrationId: string; accountName: string; automationId?: string; automation?: { name?: string; triggerMode?: string; keywords?: Array<{ word: string }>; listener?: { aiConversation?: unknown } } };
type PreviewTurn = AiConversationTurn & { linkButton?: { label: string; url: string } };
const field = "ap3k-input w-full rounded-xl px-4 py-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-violet-500/40";
const button = "inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50";
const secondary = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10";

export default function AiConversationBuilder({ slug, integrationId, accountName, automationId, automation }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<AiConversationConfig>(() => readAiConversation(automation?.listener?.aiConversation) ?? { ...DEFAULT_AI_CONVERSATION, tasks: [...DEFAULT_AI_CONVERSATION.tasks] });
  const [name, setName] = useState(automation?.name || "Automate conversations with AI");
  const [trigger, setTrigger] = useState(automation?.triggerMode === "ANY_MESSAGE" ? "ANY_MESSAGE" : "SPECIFIC_KEYWORD");
  const [keywords, setKeywords] = useState(automation?.keywords?.map(item => item.word).join(", ") ?? "");
  const [stage, setStage] = useState<"configure" | "flow">("configure");
  const [turns, setTurns] = useState<PreviewTurn[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<"generate" | "preview" | "save" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mobilePreview, setMobilePreview] = useState(false);
  const [previewStopped, setPreviewStopped] = useState(false);
  const [dirty, setDirty] = useState(false);
  const previewEnd = useRef<HTMLDivElement>(null);
  const valid = aiConversationSchema.safeParse(config).success;
  const blocked = Boolean(busy);
  const change = (patch: Partial<AiConversationConfig>) => { setConfig(current => ({ ...current, ...patch })); setDirty(true); setNotice(turns.length ? "Settings changed. Reset the preview to test this version from the beginning." : ""); };
  useEffect(() => { if (previewEnd.current) previewEnd.current.scrollTop = previewEnd.current.scrollHeight; }, [turns.length, busy]);
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  async function generate() {
    setError("");
    const validation = aiConversationSchema.safeParse(config);
    if (!validation.success) { setError(validation.error.issues[0].message); return; }
    setBusy("generate");
    try {
      const result = await generateConversationPlan(config, integrationId);
      if (!result.ok) setError(result.error);
      else { change({ tasks: result.tasks }); setNotice("Your tasks are ready. Edit them, then try the conversation in the phone preview."); }
    } catch { setError("Could not generate tasks. Please try again."); } finally { setBusy(null); }
  }
  async function chat(text = message) {
    const prompt = text.trim();
    if (!prompt || blocked) return;
    if (previewStopped) { setError("Preview paused. Reset the preview to start a new conversation."); return; }
    if (conversationStopIntent(prompt)) { setTurns(current => [...current, { role: "user", content: prompt }]); setPreviewStopped(true); setMessage(""); setNotice("AI paused. In a live conversation your team can reply from Inbox."); return; }
    setBusy("preview"); setError("");
    try {
      const result = await previewAiConversation(config, prompt, turns.slice(-12).map(({ role, content }) => ({ role, content })), integrationId);
      if (!result.ok) setError(result.error);
      else { setTurns(current => [...current, { role: "user", content: prompt }, { role: "assistant", content: result.reply, linkButton: result.linkButton }]); setMessage(""); }
    } catch { setError("Preview unavailable. Your draft is safe."); } finally { setBusy(null); }
  }
  async function save(active: boolean) {
    setError(""); setBusy("save");
    try {
      const result = await saveMessageAutomation({ name, active, source: "DM", triggerMode: trigger, keywords: keywords.split(",").map(item => item.trim()).filter(Boolean), aiReplyEnabled: true, aiConversation: config, message: config.fallback, responseFormat: "TEXT" }, automationId, integrationId);
      if (result.status !== 200 || typeof result.data === "string") { setError(typeof result.data === "string" ? result.data : "Could not save this flow."); return; }
      setDirty(false);
      await queryClient.invalidateQueries({ queryKey: ["automation-info"] });
      await queryClient.invalidateQueries({ queryKey: ["user-automation"] });
      router.push(`/dashboard/${slug}/automation/${result.data.id}`); router.refresh();
    } catch { setError("Could not save this flow. Your draft is still here."); } finally { setBusy(null); }
  }
  return <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-950 dark:border-white/10 dark:bg-[#0c101b] dark:text-slate-50">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-white/10">
      <div className="flex min-w-0 items-center gap-3"><Link href={`/dashboard/${slug}/automation`} aria-label="Back to automations" className={secondary}><ArrowLeft size={16} /></Link><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-violet-600 dark:text-violet-300">Flow Builder</p><h1 className="break-words text-lg font-bold tracking-tight">Automate conversations with AI</h1></div></div>
      <div className="flex items-center gap-2"><button type="button" className={`${secondary} xl:hidden`} onClick={() => setMobilePreview(value => !value)}>{mobilePreview ? "Edit flow" : "Preview"}</button><button type="button" disabled={!valid || blocked} onClick={() => setStage(stage === "configure" ? "flow" : "configure")} className={button}>{stage === "configure" ? "Continue" : "Edit AI"}<ChevronRight size={16} /></button></div>
    </header>
    <div className="grid min-w-0 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <section aria-label="AI conversation settings" className={`${mobilePreview ? "hidden xl:flex" : "flex"} min-w-0 flex-col xl:h-[calc(100dvh-13rem)] xl:min-h-[620px]`}>
        <div className="flex-1 space-y-7 overflow-y-auto p-5 sm:p-7">
          <div className="flex gap-2 text-xs font-semibold"><button type="button" className={stage === "configure" ? "text-violet-600 dark:text-violet-300" : "text-slate-500"} onClick={() => setStage("configure")}>01 · Train your AI</button><span className="text-slate-400">/</span><button type="button" disabled={!valid} className={stage === "flow" ? "text-violet-600 dark:text-violet-300" : "text-slate-500"} onClick={() => setStage("flow")}>02 · Build & launch</button></div>
          {stage === "configure" ? <>
            <div><h2 className="text-2xl font-bold tracking-tight">A conversation with a purpose.</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Tell AI what to achieve and which facts it can use. Test the experience before going live.</p></div>
            <label className="block"><span className="mb-2 block text-sm font-semibold">Tell AI what to do</span><textarea rows={4} maxLength={800} value={config.goal} onChange={e => change({ goal: e.target.value })} className={field} placeholder="Help customers choose the right skincare routine, answer their questions, then share the matching product link." /><span className="mt-1 block text-end text-xs text-slate-500">{config.goal.length}/800</span></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold">Give AI context</span><textarea rows={7} maxLength={12000} value={config.context} onChange={e => change({ context: e.target.value })} className={field} placeholder="Add your products, who they are for, prices, FAQs, policies and full https:// links. AI will only recommend offers described here." /><span className="mt-2 block text-xs leading-5 text-slate-500 dark:text-slate-400">Paste the actual facts here. Adding a website link does not import its content.</span></label>
            <div><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Conversation tasks</h3><button type="button" disabled={blocked || !valid} onClick={() => void generate()} className="flex items-center gap-1 text-xs font-semibold text-violet-600 disabled:opacity-50 dark:text-violet-300">{busy === "generate" ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />} Generate tasks</button></div>
              <div className="space-y-2">{config.tasks.map((task, index) => <div key={index} className="flex items-start gap-2"><span className="mt-3 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">{index + 1}</span><textarea aria-label={`Task ${index + 1}`} rows={2} maxLength={240} value={task} onChange={e => change({ tasks: config.tasks.map((value, i) => i === index ? e.target.value : value) })} className={field} /><button type="button" disabled={config.tasks.length === 1} aria-label={`Remove task ${index + 1}`} className="mt-3 text-slate-400 hover:text-red-500 disabled:opacity-30" onClick={() => change({ tasks: config.tasks.filter((_, i) => i !== index) })}><Trash2 size={16} /></button></div>)}</div>
              <button type="button" disabled={config.tasks.length >= 8} onClick={() => change({ tasks: [...config.tasks, ""] })} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-violet-600 disabled:opacity-40 dark:text-violet-300"><Plus size={16} /> New task</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-semibold">Voice</span><select className={field} value={config.tone} onChange={e => change({ tone: e.target.value as AiConversationConfig["tone"] })}><option value="FRIENDLY">Friendly</option><option value="PROFESSIONAL">Professional</option><option value="FUN">Fun</option></select></label><label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10"><input type="checkbox" checked={config.collectEmail} onChange={e => change({ collectEmail: e.target.checked })} className="h-4 w-4 accent-violet-600" /><span className="text-sm font-semibold">Collect an optional email<span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">Saved in Contacts when shared.</span></span></label></div>
            <label className="block"><span className="mb-2 block text-sm font-semibold">If AI is unavailable</span><textarea rows={3} maxLength={500} value={config.fallback} onChange={e => change({ fallback: e.target.value })} className={field} /></label>
          </> : <>
            <div><h2 className="text-2xl font-bold tracking-tight">Your conversation flow</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">Choose what starts it. AI remembers replies throughout the conversation.</p></div>
            <label className="block"><span className="mb-2 block text-sm font-semibold">Automation name</span><input maxLength={120} value={name} onChange={e => { setName(e.target.value); setDirty(true); }} className={field} /></label>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[.025]">
              <FlowCard icon={<MessageCircle size={17} />} label="01 · When" title="A customer sends a DM"><label className="sr-only" htmlFor="ai-trigger">DM trigger</label><select id="ai-trigger" className={field} value={trigger} onChange={e => { setTrigger(e.target.value); setDirty(true); }}><option value="SPECIFIC_KEYWORD">Message contains a keyword</option><option value="ANY_MESSAGE">Any incoming DM</option></select>{trigger === "SPECIFIC_KEYWORD" ? <input aria-label="Trigger keywords" className={`${field} mt-2`} placeholder="e.g. GUIDE, SHOP, HELP" value={keywords} maxLength={1000} onChange={e => { setKeywords(e.target.value); setDirty(true); }} /> : <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Replies to incoming DMs that do not match a more specific keyword automation.</p>}</FlowCard>
              <Connector />
              <FlowCard icon={<Sparkles size={17} />} label="02 · AI conversation" title={config.goal}><ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300">{config.tasks.map((task, i) => <li key={i} className="flex gap-2"><span className="text-violet-500">{i + 1}.</span>{task}</li>)}</ol><button type="button" onClick={() => setStage("configure")} className="mt-3 text-xs font-semibold text-violet-600 dark:text-violet-300">Edit goal & tasks →</button></FlowCard>
              <Connector />
              <FlowCard icon={<GitBranch size={17} />} label="03 · Outcome" title="Guide the customer to the right next step"><p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Answer from your context and share an approved link when relevant.{config.collectEmail ? " Save an email when the customer chooses to share it." : " Keep the conversation focused on their needs."}</p></FlowCard>
              <Connector />
              <FlowCard icon={<ShieldCheck size={17} />} label="Always available" title="Stop or request a person"><p className="text-sm leading-6 text-slate-600 dark:text-slate-300">STOP or HUMAN pauses this AI conversation for 24 hours. Your team can continue in Inbox.</p></FlowCard>
            </div>
            <p className="rounded-xl bg-violet-50 p-4 text-xs leading-6 text-violet-900 dark:bg-violet-500/10 dark:text-violet-200">Live replies and preview messages use your plan’s AI allowance. Replies stay within Instagram’s messaging window. This flow has its own goal and context; it does not require the global AI Replies toggle.</p>
          </>}
          {error ? <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{error}</p> : null}
          {notice ? <p role="status" className="text-sm leading-6 text-violet-700 dark:text-violet-300">{notice}</p> : null}
        </div>
        <footer className="flex flex-wrap items-center gap-3 border-t border-slate-200 p-5 dark:border-white/10">
          {stage === "configure" ? <><button type="button" disabled={!valid || blocked} className={`${button} flex-1`} onClick={() => { setMobilePreview(true); void chat("Hi! Can you help me?"); }}>{busy === "preview" ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />} Preview chat</button><span className="w-full text-center text-[11px] text-slate-500 dark:text-slate-400">Private test · No messages sent to Instagram</span></> : <><button type="button" disabled={!valid || blocked} className={secondary} onClick={() => void save(false)}>Save draft</button><button type="button" disabled={!valid || blocked || !integrationId} className={`${button} flex-1`} onClick={() => void save(true)}>{busy === "save" ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} Go live</button></>}
        </footer>
      </section>
      <aside aria-label="Conversation preview" className={`${mobilePreview ? "flex" : "hidden xl:flex"} min-w-0 flex-col items-center justify-center border-s border-slate-200 bg-[radial-gradient(ellipse_at_top_left,_#ede9fe,_#faf5ff_45%,_#fff7ed)] p-5 dark:border-white/10 dark:bg-[radial-gradient(ellipse_at_top_left,_#271944,_#111424_55%,_#171020)] sm:p-8`}>
        <div className="mb-5 flex w-full max-w-[370px] items-center justify-between"><div><p className="text-sm font-semibold">Live preview</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Try a real conversation with your AI</p></div><button type="button" aria-label="Reset preview conversation" title="Reset preview" disabled={blocked} className={secondary} onClick={() => { setTurns([]); setPreviewStopped(false); setNotice(""); setError(""); }}><RotateCcw size={16} /></button></div>
        <div className="flex h-[640px] max-h-[78dvh] min-h-[450px] w-full max-w-[370px] flex-col overflow-hidden rounded-[44px] border-[10px] border-[#202330] bg-[#101115] text-white shadow-2xl">
          <div className="flex items-center justify-between px-6 pb-3 pt-3 text-xs font-semibold"><span>9:41</span><span className="h-5 w-20 rounded-full bg-black" /><span className="flex gap-1.5"><Wifi size={14} /><BatteryFull size={17} /></span></div>
          <div className="flex items-center gap-3 border-b border-white/10 px-4 pb-4 pt-2"><ArrowLeft size={19} /><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-xs font-bold">{accountName.slice(0, 2).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{accountName}</p><p className="text-xs text-slate-400">Business chat</p></div></div>
          <div ref={previewEnd} aria-live="polite" aria-label="Preview messages" className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {!turns.length ? <div className="flex h-full flex-col items-center justify-center px-4 text-center"><span className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-violet-500/10 text-violet-300"><Sparkles size={30} /></span><h3 className="text-base font-semibold">Meet your AI assistant</h3><p className="mt-2 text-sm leading-6 text-slate-400">Add a goal and context, then start a preview chat.</p>{valid ? <button type="button" disabled={blocked} className={`${button} mt-5`} onClick={() => void chat("Hi! Can you help me?")}>Start conversation</button> : null}</div> : turns.map((turn, index) => <div key={index} className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}><div dir="auto" className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-3 text-sm leading-6 ${turn.role === "user" ? "rounded-br-md bg-violet-600" : "rounded-bl-md bg-[#282b33]"}`}>{turn.content}{turn.linkButton ? <a href={turn.linkButton.url} target="_blank" rel="noopener noreferrer" className="mt-3 block rounded-lg bg-white/10 px-3 py-2 text-center font-semibold hover:bg-white/20">{turn.linkButton.label}</a> : null}</div></div>)}
            {busy === "preview" ? <div role="status" className="flex items-center gap-2 text-xs text-slate-400"><Loader2 size={14} className="animate-spin" /> AI is replying…</div> : null}
          </div>
          {mobilePreview && error ? <p role="alert" className="px-4 py-2 text-xs text-red-300 xl:hidden">{error}</p> : null}
          <form className="m-3 flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2" onSubmit={e => { e.preventDefault(); void chat(); }}><input aria-label="Test customer message" placeholder="Write a message…" maxLength={1000} value={message} onChange={e => setMessage(e.target.value)} disabled={!valid || blocked} className="min-w-0 flex-1 bg-transparent py-1 text-sm text-white outline-none placeholder:text-slate-500 disabled:opacity-50" /><button type="submit" aria-label="Send preview message" disabled={!valid || blocked || !message.trim()} className="text-violet-300 disabled:opacity-30"><Send size={19} /></button></form><div className="mx-auto mb-2 h-1 w-28 rounded-full bg-white/35" />
        </div>
      </aside>
    </div>
  </div>;
}
function Connector() { return <div className="flex h-9 justify-center text-violet-400"><ArrowDown className="h-full" size={17} /></div>; }
function FlowCard({ icon, label, title, children }: { icon: React.ReactNode; label: string; title: string; children: React.ReactNode }) { return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#171d2d]"><div className="mb-2 flex items-center gap-2 text-violet-600 dark:text-violet-300">{icon}<span className="text-[10px] font-bold uppercase tracking-widest">{label}</span></div><h3 className="mb-3 text-sm font-semibold leading-6">{title}</h3>{children}</div>; }
