"use client";

import { addAiKnowledgeAction, deleteAiKnowledgeAction, saveAiWorkspaceAction, testAiWorkspaceAction } from "@/actions/ai-workspace";
import { AI_PROTECTION_CATEGORIES, AI_REPLY_TONES, aiToneLabel, type AiProtectionAction, type AiProtectionRules, type AiReplyTone } from "@/lib/ai-reply-config";
import type { AiKnowledgeItem } from "@/lib/ai-workspace";
import { BookOpen, Bot, Check, Loader2, MessageCircle, MessagesSquare, Plus, Send, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Profile = {
  aiRepliesEnabled: boolean;
  aiCommentsEnabled: boolean;
  role: string;
  brandVoice: string;
  guardrails: string;
  defaultTone: AiReplyTone;
  protectionRules: AiProtectionRules;
  knowledge: AiKnowledgeItem[];
};

const tabs = ["Overview", "Knowledge", "Behavior", "Playground"] as const;
type Tab = (typeof tabs)[number];

const protectionLabels: Record<(typeof AI_PROTECTION_CATEGORIES)[number], [string, string]> = {
  INSULTS_HATE: ["Insults & hate speech", "Vulgar language, slurs, threats, or harassment"],
  CRITIQUE_NEGATIVE: ["Critique & negative feedback", "Comments criticizing your content, product, or brand"],
  UNANSWERABLE: ["Unanswerable questions", "Questions the shared knowledge cannot answer"],
  BEGGING_SOLICITATION: ["Begging & solicitation", "Requests for money, gifts, free products, or donations"],
};

export default function Ap3kAiConsole({ slug, initial, plan }: { slug: string; initial: Profile; plan: string }) {
  const router = useRouter();
  const unlocked = plan === "PRO" || plan === "BUSINESS";
  const [tab, setTab] = useState<Tab>("Overview");
  const [profile, setProfile] = useState(initial);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  const save = () => {
    setNotice(null);
    startSave(async () => {
      const form = new FormData();
      form.set("aiRepliesEnabled", String(profile.aiRepliesEnabled));
      form.set("aiCommentsEnabled", String(profile.aiCommentsEnabled));
      form.set("role", profile.role);
      form.set("brandVoice", profile.brandVoice);
      form.set("guardrails", profile.guardrails);
      form.set("defaultTone", profile.defaultTone);
      form.set("protectionRules", JSON.stringify(profile.protectionRules));
      const result = await saveAiWorkspaceAction(form);
      setNotice(result.data);
      if (result.status === 200) router.refresh();
    });
  };

  const complete = [profile.knowledge.length > 0, profile.role.trim().length > 0, profile.aiRepliesEnabled || profile.aiCommentsEnabled].filter(Boolean).length;

  return (
    <main className="mx-auto w-full max-w-[1480px] py-5 sm:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ap3k-kicker">Intelligence center</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">AP3K AI</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Teach AI your business once, then use it safely in selected comment and DM automations.</p>
        </div>
        <button type="button" onClick={save} disabled={saving || !unlocked} className="ap3k-gradient-button inline-flex min-h-11 items-center justify-center gap-2 px-5 text-sm disabled:opacity-40">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save changes</button>
      </header>

      {!unlocked ? <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-violet-400/25 bg-violet-500/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-slate-950 dark:text-white">AP3K AI is included with Pro and Business</p><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Upgrade to enable AI comments, AI DM replies, knowledge, and the playground.</p></div><Link href={`/dashboard/${slug}/billing`} className="rounded-xl bg-violet-600 px-5 py-3 text-center text-sm font-black text-white">View plans</Link></div> : null}

      <nav aria-label="AP3K AI sections" className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 dark:border-white/10 dark:bg-white/[0.04] sm:flex sm:w-fit">
        {tabs.map((item) => <button key={item} type="button" onClick={() => setTab(item)} className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${tab === item ? "bg-slate-950 text-white shadow dark:bg-white dark:text-slate-950" : "text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"}`}>{item}</button>)}
      </nav>

      <section className="mt-4 min-h-[520px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0d1220] sm:p-7">
        {tab === "Overview" ? <Overview profile={profile} setProfile={setProfile} complete={complete} unlocked={unlocked} onOpen={setTab} /> : null}
        {tab === "Knowledge" ? <Knowledge items={profile.knowledge} unlocked={unlocked} onRefresh={() => router.refresh()} /> : null}
        {tab === "Behavior" ? <Behavior profile={profile} setProfile={setProfile} unlocked={unlocked} /> : null}
        {tab === "Playground" ? <Playground unlocked={unlocked} ready={profile.knowledge.length > 0} /> : null}
      </section>
      {notice ? <p role="status" className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">{notice}</p> : null}
    </main>
  );
}

function Overview({ profile, setProfile, complete, unlocked, onOpen }: { profile: Profile; setProfile: (value: Profile) => void; complete: number; unlocked: boolean; onOpen: (tab: Tab) => void }) {
  return <div className="mx-auto max-w-4xl"><div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500/12 text-violet-500"><Sparkles className="h-5 w-5" /></span><div><h2 className="text-xl font-black">Your AI readiness</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{complete} of 3 essentials complete</p></div></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-pink-500 transition-all" style={{ width: `${(complete / 3) * 100}%` }} /></div><div className="mt-7 space-y-3"><SetupRow done={profile.knowledge.length > 0} icon={BookOpen} title="Share business knowledge" detail="Add accurate products, services, policies, and FAQs." action="Open knowledge" onClick={() => onOpen("Knowledge")} /><SetupRow done={Boolean(profile.role.trim())} icon={Bot} title="Set voice and behavior" detail="Control tone, role, guardrails, and comment protection." action="Open behavior" onClick={() => onOpen("Behavior")} /></div><div className="mt-8"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">AI skills</p><div className="mt-3 grid gap-3 md:grid-cols-2"><SkillCard enabled={profile.aiRepliesEnabled} disabled={!unlocked} icon={MessagesSquare} title="AI Replies" detail="AI replies to DMs using the knowledge you share." onToggle={() => setProfile({ ...profile, aiRepliesEnabled: !profile.aiRepliesEnabled })} /><SkillCard enabled={profile.aiCommentsEnabled} disabled={!unlocked} icon={MessageCircle} title="AI Comments" detail="AI responds to safe, positive comments in your tone." onToggle={() => setProfile({ ...profile, aiCommentsEnabled: !profile.aiCommentsEnabled })} /></div><p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">These are workspace master switches. Each automation still chooses whether to use AI, so nothing turns on unexpectedly.</p></div></div>;
}

function Knowledge({ items, unlocked, onRefresh }: { items: AiKnowledgeItem[]; unlocked: boolean; onRefresh: () => void }) {
  const [visibleItems, setVisibleItems] = useState(items); const [title, setTitle] = useState(""); const [content, setContent] = useState(""); const [notice, setNotice] = useState<string | null>(null); const [pending, start] = useTransition();
  const add = () => start(async () => { const form = new FormData(); form.set("title", title); form.set("content", content); const result = await addAiKnowledgeAction(form); setNotice(result.data); if (result.status === 200) { setTitle(""); setContent(""); setVisibleItems(result.knowledge); onRefresh(); } });
  return <div className="mx-auto max-w-5xl"><Header icon={BookOpen} title="Knowledge" detail="Share only facts you want AI to use. Short, focused notes produce clearer answers." /><div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]"><label className="text-xs font-black uppercase tracking-wider text-slate-500">Topic</label><input value={title} disabled={!unlocked} onChange={(e) => setTitle(e.target.value)} placeholder="Pricing, delivery, course details…" className="ap3k-input mt-2 w-full rounded-xl px-4 py-3 text-sm" /><label className="mt-4 block text-xs font-black uppercase tracking-wider text-slate-500">Facts AI may use</label><textarea value={content} disabled={!unlocked} onChange={(e) => setContent(e.target.value)} rows={10} maxLength={5000} dir="auto" placeholder="Add exact, current information. Include what AP3K should say when details are unknown." className="ap3k-textarea mt-2 w-full rounded-xl px-4 py-3 text-sm" /><button type="button" onClick={add} disabled={pending || !unlocked || !title.trim() || !content.trim()} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-black text-white disabled:opacity-35">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add knowledge</button>{notice ? <p className="mt-3 text-xs text-slate-500">{notice}</p> : null}</div><div><div className="mb-3 flex items-center justify-between"><p className="font-black">Saved knowledge</p><span className="text-xs text-slate-500">{visibleItems.length}/12</span></div>{visibleItems.length ? <div className="space-y-2">{visibleItems.map((item) => <article key={item.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 dark:border-white/10"><div className="min-w-0 flex-1"><h3 className="font-black">{item.title}</h3><p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-500 dark:text-slate-400">{item.content}</p></div><button type="button" aria-label={`Delete ${item.title}`} onClick={() => start(async () => { const result = await deleteAiKnowledgeAction(item.id); if (result.status === 200) setVisibleItems(result.knowledge); onRefresh(); })} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></article>)}</div> : <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-slate-200 text-center dark:border-white/10"><div><BookOpen className="mx-auto h-7 w-7 text-slate-400" /><p className="mt-3 font-black">No knowledge yet</p><p className="mt-1 text-sm text-slate-500">Add your first reliable business note.</p></div></div>}</div></div></div>;
}

function Behavior({ profile, setProfile, unlocked }: { profile: Profile; setProfile: (value: Profile) => void; unlocked: boolean }) {
  return <div className="mx-auto max-w-4xl"><Header icon={Bot} title="Behavior" detail="One voice and safety policy is shared by every AI-enabled automation." /><div className="mt-6 space-y-5"><Field label="AI role" value={profile.role} disabled={!unlocked} onChange={(role) => setProfile({ ...profile, role })} maxLength={120} /><TextField label="Brand voice & persona" value={profile.brandVoice} disabled={!unlocked} onChange={(brandVoice) => setProfile({ ...profile, brandVoice })} maxLength={1600} /><div><p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Default tone</p><div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-white/[0.05]">{AI_REPLY_TONES.map((tone) => <button key={tone} type="button" disabled={!unlocked} onClick={() => setProfile({ ...profile, defaultTone: tone })} className={`rounded-lg px-2 py-3 text-xs font-black ${profile.defaultTone === tone ? "bg-white text-violet-600 shadow dark:bg-violet-500/20 dark:text-violet-200" : "text-slate-500"}`}>{aiToneLabel(tone)}</button>)}</div></div><TextField label="Guardrails & escalation" value={profile.guardrails} disabled={!unlocked} onChange={(guardrails) => setProfile({ ...profile, guardrails })} maxLength={2400} /><div><div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /><p className="text-xs font-black uppercase tracking-wider text-slate-500">Comment protection</p></div><div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 dark:divide-white/10 dark:border-white/10">{AI_PROTECTION_CATEGORIES.map((category) => { const [title, detail] = protectionLabels[category]; const canDelete = category !== "UNANSWERABLE"; return <div key={category} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="text-sm font-black">{title}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>{canDelete ? <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-white/[0.05]">{(["SKIP", "DELETE"] as AiProtectionAction[]).map((action) => <button key={action} type="button" disabled={!unlocked} onClick={() => setProfile({ ...profile, protectionRules: { ...profile.protectionRules, [category]: action } })} className={`rounded-lg px-3 py-2 text-[10px] font-black ${profile.protectionRules[category] === action ? action === "DELETE" ? "bg-red-500 text-white" : "bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white" : "text-slate-500"}`}>{action === "SKIP" ? "Skip reply" : "Delete"}</button>)}</div> : <span className="rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-500 dark:bg-white/[0.05]">Skip reply</span>}</div>; })}</div></div></div></div>;
}

function Playground({ unlocked, ready }: { unlocked: boolean; ready: boolean }) { const [message, setMessage] = useState(""); const [reply, setReply] = useState(""); const [pending, start] = useTransition(); const send = () => start(async () => { const result = await testAiWorkspaceAction(message); setReply(result.data); }); return <div className="mx-auto flex min-h-[450px] max-w-3xl flex-col"><Header icon={MessagesSquare} title="Playground" detail="Test the saved provider, knowledge, voice, and guardrails before enabling an automation." />{!ready ? <p className="mt-5 rounded-xl border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">Add at least one knowledge note for a meaningful test.</p> : null}<div className="flex flex-1 flex-col justify-end pt-8">{reply ? <div className="mb-4 max-w-[85%] rounded-2xl rounded-bl-md bg-violet-500/10 px-4 py-3 text-sm leading-6 text-slate-800 dark:text-slate-100"><span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-violet-500">AP3K AI</span>{reply}</div> : <div className="grid flex-1 place-items-center text-center"><div><Sparkles className="mx-auto h-7 w-7 text-violet-500" /><p className="mt-3 font-black">Ask a customer-style question</p><p className="mt-1 text-sm text-slate-500">Playground generations count toward the monthly AI limit.</p></div></div>}<div className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-white/[0.03]"><input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }} disabled={!unlocked || pending} placeholder="What do you sell?" className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" /><button type="button" onClick={send} disabled={!unlocked || !message.trim() || pending} aria-label="Send test" className="grid h-11 w-11 place-items-center rounded-xl bg-violet-600 text-white disabled:opacity-35">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></div></div></div>; }

function SetupRow({ done, icon: Icon, title, detail, action, onClick }: { done: boolean; icon: typeof Bot; title: string; detail: string; action: string; onClick: () => void }) { return <button type="button" onClick={onClick} className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-violet-400/40 dark:border-white/10"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${done ? "bg-emerald-500/15 text-emerald-500" : "bg-slate-100 text-slate-400 dark:bg-white/[0.05]"}`}>{done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}</span><span className="min-w-0 flex-1"><span className="block font-black">{title}</span><span className="mt-1 block text-sm text-slate-500">{detail}</span></span><span className="hidden text-xs font-black text-violet-500 sm:block">{action}</span></button>; }
function SkillCard({ enabled, disabled, icon: Icon, title, detail, onToggle }: { enabled: boolean; disabled: boolean; icon: typeof Bot; title: string; detail: string; onToggle: () => void }) { return <button type="button" disabled={disabled} onClick={onToggle} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition disabled:opacity-50 ${enabled ? "border-violet-400/35 bg-violet-500/[0.07]" : "border-slate-200 dark:border-white/10"}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-500"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-black">{title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span></span><span className={`relative mt-1 h-7 w-12 shrink-0 rounded-full ${enabled ? "bg-violet-500" : "bg-slate-300 dark:bg-slate-700"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} /></span></button>; }
function Header({ icon: Icon, title, detail }: { icon: typeof Bot; title: string; detail: string }) { return <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-500"><Icon className="h-5 w-5" /></span><div><h2 className="text-xl font-black">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{detail}</p></div></div>; }
function Field({ label, value, onChange, disabled, maxLength }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean; maxLength: number }) { return <label className="block"><span className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} maxLength={maxLength} className="ap3k-input mt-2 w-full rounded-xl px-4 py-3 text-sm" /></label>; }
function TextField({ label, value, onChange, disabled, maxLength }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean; maxLength: number }) { return <label className="block"><span className="flex justify-between text-xs font-black uppercase tracking-wider text-slate-500"><span>{label}</span><span>{value.length}/{maxLength}</span></span><textarea value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} maxLength={maxLength} rows={5} dir="auto" className="ap3k-textarea mt-2 w-full rounded-xl px-4 py-3 text-sm" /></label>; }
