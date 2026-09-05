"use client";

import { saveMessageAutomation } from "@/actions/automation";
import DeliveryRules from "@/components/automations/delivery-rules";
import MessageAutomationPreview from "@/components/automations/message-automation-preview";
import MessageResponseEditor, { type ResponseFormat } from "@/components/automations/message-response-editor";
import WizardStepper, { type StepStatus } from "@/components/global/wizard-stepper";
import {
  DEFAULT_FOLLOW_REQUEST_BUTTON_TEXT,
  DEFAULT_FOLLOW_REQUEST_DM_TEXT,
  resolveFollowRequestButtonText,
  resolveFollowRequestDmText,
} from "@/lib/comment-dm-flow";
import { AtSign, Loader2, MessageCircleReply, SmilePlus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Source = "STORY" | "DM";
type StoryTrigger = "MENTION" | "REACTION" | "REPLY";

type Draft = {
  name: string;
  storyTriggerType: StoryTrigger;
  triggerMode: "SPECIFIC_KEYWORD" | "ANY_MESSAGE";
  keywords: string[];
  responseFormat: ResponseFormat;
  message: string;
  quickReplies: string[];
  ctaLink: string;
  ctaButtonTitle: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  followGateRequired: boolean;
  followRequestDmText: string;
  followRequestButtonText: string;
};

const STORY_TRIGGERS = [
  { value: "MENTION", title: "Mentions me", description: "Tagged in a story", icon: AtSign },
  { value: "REACTION", title: "Reacts", description: "Sends an emoji reaction", icon: SmilePlus },
  { value: "REPLY", title: "Replies", description: "Sends a text reply to your story", icon: MessageCircleReply },
] as const;

const INITIAL: Draft = {
  name: "",
  storyTriggerType: "MENTION",
  triggerMode: "ANY_MESSAGE",
  keywords: [],
  responseFormat: "TEXT",
  message: "Thanks for reaching out! Here's what you asked for ✨",
  quickReplies: [],
  ctaLink: "",
  ctaButtonTitle: "Get the Link",
  mediaUrl: "",
  mediaType: "IMAGE",
  followGateRequired: false,
  followRequestDmText: DEFAULT_FOLLOW_REQUEST_DM_TEXT,
  followRequestButtonText: DEFAULT_FOLLOW_REQUEST_BUTTON_TEXT,
};

export default function MessageAutomationWizard({ slug, source, automationId, automation }: { slug: string; source: Source; automationId?: string; automation?: any }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(INITIAL);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!automation?.listener) return;
    const replies = Array.isArray(automation.listener.quickReplies)
      ? automation.listener.quickReplies.filter((item: unknown): item is string => typeof item === "string")
      : [];
    setDraft({
      name: automation.name ?? "",
      storyTriggerType: automation.storyTriggerType === "REACTION" || automation.storyTriggerType === "REPLY" ? automation.storyTriggerType : "MENTION",
      triggerMode: automation.triggerMode === "SPECIFIC_KEYWORD" ? "SPECIFIC_KEYWORD" : "ANY_MESSAGE",
      keywords: Array.isArray(automation.keywords) ? automation.keywords.map((item: any) => item.word).filter(Boolean) : [],
      responseFormat: automation.listener.responseFormat === "LINK" || automation.listener.responseFormat === "MEDIA" ? automation.listener.responseFormat : "TEXT",
      message: automation.listener.prompt ?? "",
      quickReplies: replies,
      ctaLink: automation.listener.ctaLink ?? "",
      ctaButtonTitle: automation.listener.ctaButtonTitle ?? "Get the Link",
      mediaUrl: automation.listener.mediaUrl ?? "",
      mediaType: automation.listener.mediaType === "VIDEO" ? "VIDEO" : "IMAGE",
      followGateRequired: Boolean(automation.followGateRequired),
      followRequestDmText: resolveFollowRequestDmText(automation.listener.followRequestDmText),
      followRequestButtonText: resolveFollowRequestButtonText(automation.listener.followRequestButtonText),
    });
  }, [automation]);

  const steps = ["Interaction", "Response", "Rules & name"].map((label, index) => ({
    label,
    status: (index + 1 < step ? "done" : index + 1 === step ? "active" : "todo") as StepStatus,
  }));

  const ruleSummary = useMemo(() => {
    const trigger = source === "STORY"
      ? draft.storyTriggerType === "MENTION" ? "mentions you in a story" : draft.storyTriggerType === "REACTION" ? "reacts to your story" : "replies to your story"
      : draft.triggerMode === "ANY_MESSAGE" ? "sends you a DM" : `sends a DM containing ${draft.keywords.join(", ") || "your keyword"}`;
    return <>When <strong>someone {trigger}</strong>, AP3K will <strong>send them a DM</strong>.</>;
  }, [draft.keywords, draft.storyTriggerType, draft.triggerMode, source]);

  const canContinue = step === 1
    ? source === "STORY" || draft.triggerMode === "ANY_MESSAGE" || draft.keywords.length > 0
    : step === 2
      ? Boolean(draft.message.trim()) && (draft.responseFormat !== "LINK" || Boolean(draft.ctaLink.trim())) && (draft.responseFormat !== "MEDIA" || Boolean(draft.mediaUrl.trim()))
      : Boolean(draft.name.trim());

  const addKeyword = () => {
    const word = keywordDraft.trim().toLowerCase();
    if (!word || draft.keywords.includes(word)) return;
    setDraft((current) => ({ ...current, keywords: [...current.keywords, word] }));
    setKeywordDraft("");
  };

  const save = async () => {
    if (!canContinue) return;
    setSaving(true);
    setError(null);
    const result = await saveMessageAutomation({ ...draft, source, active: true }, automationId);
    if (result.status === 200 && typeof result.data === "object" && result.data?.id) {
      router.push(`/dashboard/${slug}/automation/${result.data.id}`);
      router.refresh();
      return;
    }
    setError(typeof result.data === "string" ? result.data : "Could not save automation.");
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-950 dark:bg-[#050816] dark:text-white">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#080c18]/90 sm:px-8">
        <Link href={`/dashboard/${slug}/automation`} className="text-sm font-semibold text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white">← Automations</Link>
        <div className="text-center"><p className="text-sm font-black">{automationId ? "Edit" : "New"} {source === "STORY" ? "story" : "DM"} automation</p><p className="text-xs text-slate-500 dark:text-slate-400">Phase {step} of 3</p></div>
        <span className="text-xs font-bold text-slate-400">Official API</span>
      </header>

      <div className="mx-auto max-w-[1480px] px-4 pt-6 sm:px-8"><WizardStepper steps={steps} /></div>

      <div className="mx-auto grid max-w-[1480px] gap-6 px-4 py-6 sm:px-8 xl:grid-cols-[minmax(0,720px)_minmax(390px,1fr)] xl:gap-10">
        <AnimatePresence mode="wait">
          <motion.main key={step} initial={reduceMotion ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: 10 }} transition={{ duration: 0.22 }} className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0d1220] sm:p-8">
            {step === 1 && (
              <section>
                <PhaseHeader eyebrow="Phase 1" title={source === "STORY" ? "When someone interacts with your story" : "When someone sends you a DM"} description="Set the conditions that launch this automation." />
                {source === "STORY" ? (
                  <div className="grid gap-3 md:grid-cols-3">
                    {STORY_TRIGGERS.map((item) => {
                      const Icon = item.icon;
                      const selected = draft.storyTriggerType === item.value;
                      return <button key={item.value} type="button" onClick={() => setDraft({ ...draft, storyTriggerType: item.value })} className={["min-h-40 rounded-2xl border p-5 text-left transition", selected ? "border-rf-purple bg-rf-purple/10 ring-2 ring-rf-purple/15" : "border-slate-200 bg-slate-50 hover:border-rf-purple/30 dark:border-white/10 dark:bg-white/[0.04]"].join(" ")}><span className="grid h-11 w-11 place-items-center rounded-xl bg-rf-purple/10 text-rf-purple"><Icon className="h-5 w-5" /></span><span className="mt-5 block text-lg font-black">{item.title}</span><span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{item.description}</span></button>;
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Choice selected={draft.triggerMode === "SPECIFIC_KEYWORD"} title="Specific keyword" description="Launch when the DM contains one of your keywords." onClick={() => setDraft({ ...draft, triggerMode: "SPECIFIC_KEYWORD" })} />
                      <Choice selected={draft.triggerMode === "ANY_MESSAGE"} title="Any incoming DM" description="Launch for every new conversation message." onClick={() => setDraft({ ...draft, triggerMode: "ANY_MESSAGE", keywords: [] })} />
                    </div>
                    {draft.triggerMode === "SPECIFIC_KEYWORD" && <div><div className="flex gap-2"><input value={keywordDraft} onChange={(event) => setKeywordDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addKeyword(); } }} placeholder='Type a keyword, e.g. "guide"' className="ap3k-input min-w-0 flex-1 rounded-xl px-4 py-3 text-sm" /><button type="button" onClick={addKeyword} className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 text-sm font-black text-white">+ Add</button></div><div className="mt-3 flex flex-wrap gap-2">{draft.keywords.map((word) => <button key={word} type="button" onClick={() => setDraft({ ...draft, keywords: draft.keywords.filter((item) => item !== word) })} className="rounded-full bg-rf-purple/10 px-3 py-2 text-xs font-bold text-rf-purple">{word} ×</button>)}</div></div>}
                  </div>
                )}
              </section>
            )}

            {step === 2 && (
              <section><PhaseHeader eyebrow="Phase 2" title="Compose response message" description="Pick the format and craft the message sent to prospects." /><MessageResponseEditor format={draft.responseFormat} message={draft.message} quickReplies={draft.quickReplies} ctaLink={draft.ctaLink} ctaButtonTitle={draft.ctaButtonTitle} mediaUrl={draft.mediaUrl} mediaType={draft.mediaType} onChange={(next) => setDraft((current) => ({ ...current, ...next, responseFormat: next.format ?? current.responseFormat }))} /></section>
            )}

            {step === 3 && (
              <section><PhaseHeader eyebrow="Phase 3" title="Configure rules & name" description="Name the automation and decide whether the final message is reserved for followers." /><label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Automation name</label><input value={draft.name} maxLength={120} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder={source === "STORY" ? "Story mention welcome" : "Guide request DM"} className="ap3k-input mb-7 w-full rounded-xl px-4 py-3 text-sm" /><p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Optional follow request</p><DeliveryRules followGateRequired={draft.followGateRequired} followRequestDmText={draft.followRequestDmText} followRequestButtonText={draft.followRequestButtonText} onChange={(next) => setDraft((current) => ({ ...current, ...next }))} /><div className="mt-6 rounded-2xl border border-rf-purple/25 bg-rf-purple/[0.07] p-5"><p className="text-xs font-black uppercase tracking-[0.16em] text-rf-purple">Rule logic summary</p><p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{ruleSummary}</p></div></section>
            )}

            {error && <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{error}</p>}
            <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6 dark:border-white/10">
              <button type="button" onClick={() => step === 1 ? router.push(`/dashboard/${slug}/automation`) : setStep(step - 1)} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600 dark:border-white/10 dark:text-slate-300">Back</button>
              {step < 3 ? <button type="button" disabled={!canContinue} onClick={() => setStep(step + 1)} className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-black text-white disabled:opacity-35 dark:bg-white dark:text-slate-950">Continue</button> : <button type="button" disabled={!canContinue || saving} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-7 py-3 text-sm font-black text-white shadow-lg disabled:opacity-40">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Go live</button>}
            </div>
          </motion.main>
        </AnimatePresence>
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.025] xl:sticky xl:top-24 xl:p-6">
          <MessageAutomationPreview
            source={source}
            step={step}
            trigger={draft.storyTriggerType}
            triggerMode={draft.triggerMode}
            keywords={draft.keywords}
            message={draft.message}
            responseFormat={draft.responseFormat}
            ctaButtonTitle={draft.ctaButtonTitle}
            mediaUrl={draft.mediaUrl}
            quickReplies={draft.quickReplies}
            followGateRequired={draft.followGateRequired}
            followRequestDmText={draft.followRequestDmText}
            followRequestButtonText={draft.followRequestButtonText}
          />
        </aside>
      </div>
    </div>
  );
}

function PhaseHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="mb-7"><p className="text-xs font-black uppercase tracking-[0.2em] text-rf-purple">{eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p></div>; }
function Choice({ selected, title, description, onClick }: { selected: boolean; title: string; description: string; onClick: () => void }) { return <button type="button" onClick={onClick} className={["rounded-2xl border p-5 text-left transition", selected ? "border-rf-purple bg-rf-purple/10 ring-2 ring-rf-purple/15" : "border-slate-200 bg-slate-50 hover:border-rf-purple/30 dark:border-white/10 dark:bg-white/[0.04]"].join(" ")}><span className="block text-base font-black">{title}</span><span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{description}</span></button>; }
