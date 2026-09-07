"use client";

import {
  AI_REPLY_TONES,
  aiToneLabel,
  type AiProtectionAction,
  type AiProtectionCategory,
  type AiProtectionRules,
  type AiReplyTone,
} from "@/lib/ai-reply-config";
import { Ban, LockKeyhole, MessageSquareWarning, ShieldCheck, Sparkles, Trash2 } from "lucide-react";

type Props = {
  enabled: boolean;
  available: boolean;
  planLabel: string;
  tone: AiReplyTone;
  instructions: string;
  protections: AiProtectionRules;
  onChange: (next: Partial<{
    enabled: boolean;
    tone: AiReplyTone;
    instructions: string;
    protections: AiProtectionRules;
  }>) => void;
};

const PROTECTIONS: Array<{
  category: AiProtectionCategory;
  title: string;
  detail: string;
  canDelete: boolean;
}> = [
  { category: "INSULTS_HATE", title: "Insults & hate speech", detail: "Vulgar language, slurs, threats, or harassment", canDelete: true },
  { category: "CRITIQUE_NEGATIVE", title: "Critique & negative feedback", detail: "Comments criticizing content, products, or the creator", canDelete: true },
  { category: "UNANSWERABLE", title: "Unanswerable questions", detail: "Questions not supported by your instructions or post", canDelete: false },
  { category: "BEGGING_SOLICITATION", title: "Begging & solicitation", detail: "Requests for money, gifts, free products, or donations", canDelete: true },
];

export default function AiCommentReplyEditor({ enabled, available, planLabel, tone, instructions, protections, onChange }: Props) {
  const locked = !available && !enabled;
  const setProtection = (category: AiProtectionCategory, action: AiProtectionAction) => {
    onChange({ protections: { ...protections, [category]: action } });
  };

  return (
    <section className={`overflow-hidden rounded-2xl border transition-colors ${enabled ? "border-violet-400/35 bg-violet-500/[0.06]" : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"}`}>
      <button
        type="button"
        disabled={locked}
        onClick={() => onChange({ enabled: !enabled })}
        className="flex w-full items-center justify-between gap-4 p-5 text-left disabled:cursor-not-allowed"
      >
        <span className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/12 text-violet-500 dark:text-violet-300">{locked ? <LockKeyhole className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}</span>
          <span>
            <span className="flex flex-wrap items-center gap-2 text-sm font-black text-slate-950 dark:text-white">AI reply <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-violet-600 dark:text-violet-300">Pro</span></span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">Optional. When enabled, AI writes the public reply; your saved reply variations stay preserved.</span>
          </span>
        </span>
        <Toggle enabled={enabled} locked={locked} />
      </button>

      {locked ? <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">Your {planLabel} plan keeps saved comment replies available. Upgrade to Pro to enable AI replies.</div> : null}

      {enabled ? (
        <div className="space-y-5 border-t border-violet-500/15 p-5">
          {!available ? <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">This automation uses AI, but the current plan no longer includes it. Turn AI reply off or upgrade before saving.</p> : null}

          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Tone of reply</p>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-white/[0.05]">
              {AI_REPLY_TONES.map((item) => <button key={item} type="button" onClick={() => onChange({ tone: item })} className={`min-h-10 rounded-lg px-2 text-xs font-black transition ${tone === item ? "bg-white text-violet-600 shadow-sm dark:bg-violet-500/20 dark:text-violet-200" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}>{aiToneLabel(item)}</button>)}
            </div>
          </div>

          <label className="block">
            <span className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400"><span>AI comment reply instructions</span><span className={instructions.length > 1600 ? "text-red-500" : "text-slate-400"}>{instructions.length}/1600</span></span>
            <textarea value={instructions} onChange={(event) => onChange({ instructions: event.target.value })} maxLength={1600} rows={5} dir="auto" placeholder="Example: Answer questions about this product using the post caption. Be helpful and concise. Never discuss pricing unless it appears in the post." className="ap3k-textarea mt-2 w-full resize-y rounded-xl px-4 py-3 text-sm" />
            <span className="mt-1.5 block text-[11px] leading-5 text-slate-500 dark:text-slate-400">Give the AI the facts it may use. It will skip questions it cannot answer safely.</span>
          </label>

          <div>
            <div className="mb-3 flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /><div><p className="text-xs font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300">Comment protection</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Choose whether AP3K ignores or removes problematic comments.</p></div></div>
            <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-black/10">
              {PROTECTIONS.map((item) => (
                <div key={item.category} className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-slate-300">{item.canDelete ? <MessageSquareWarning className="h-4 w-4" /> : <Ban className="h-4 w-4" />}</span>
                  <span className="min-w-0 flex-1"><span className="block text-xs font-black text-slate-900 dark:text-white">{item.title}</span><span className="mt-0.5 block text-[11px] leading-4 text-slate-500 dark:text-slate-400">{item.detail}</span></span>
                  {item.canDelete ? <div className="grid shrink-0 grid-cols-2 rounded-lg bg-slate-100 p-1 dark:bg-white/[0.05]"><ProtectionButton active={protections[item.category] === "SKIP"} onClick={() => setProtection(item.category, "SKIP")} label="Skip reply" /><ProtectionButton active={protections[item.category] === "DELETE"} onClick={() => setProtection(item.category, "DELETE")} label="Delete" danger /></div> : <span className="shrink-0 rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-500 dark:bg-white/[0.05] dark:text-slate-300">Skip AI reply</span>}
                </div>
              ))}
            </div>
          </div>

          <p className="flex items-start gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] px-3.5 py-3 text-[11px] leading-5 text-emerald-800 dark:text-emerald-200"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> If AI is unavailable or uncertain, AP3K skips the AI reply. It never falls back to an invented response.</p>
        </div>
      ) : null}
    </section>
  );
}

function ProtectionButton({ active, onClick, label, danger = false }: { active: boolean; onClick: () => void; label: string; danger?: boolean }) {
  return <button type="button" onClick={onClick} className={`inline-flex min-h-8 items-center justify-center gap-1 rounded-md px-2 text-[10px] font-black transition ${active ? danger ? "bg-red-500 text-white shadow-sm" : "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}>{danger ? <Trash2 className="h-3 w-3" /> : null}{label}</button>;
}

function Toggle({ enabled, locked }: { enabled: boolean; locked: boolean }) {
  return <span aria-hidden="true" className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? "bg-violet-500" : "bg-slate-300 dark:bg-slate-700"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />{locked ? <LockKeyhole className="absolute -right-1 -top-1 h-3 w-3 text-slate-500" /> : null}</span>;
}
