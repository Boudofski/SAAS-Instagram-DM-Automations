"use client";

import { saveMessageAutomation } from "@/actions/automation";
import AutomationWizardToolbar from "@/components/automations/automation-wizard-toolbar";
import DeliveryRules from "@/components/automations/delivery-rules";
import MessageAutomationPreview from "@/components/automations/message-automation-preview";
import MessageResponseEditor from "@/components/automations/message-response-editor";
import {
  DEFAULT_FOLLOW_REQUEST_BUTTON_TEXT,
  DEFAULT_FOLLOW_REQUEST_DM_TEXT,
  resolveFollowRequestButtonText,
  resolveFollowRequestDmText,
} from "@/lib/comment-dm-flow";
import { DEFAULT_LINK_BUTTON_LABEL, linkButtonsAreComplete, readLinkButtons, type LinkButton } from "@/lib/link-buttons";
import { AtSign, Loader2, MessageCircleReply, SmilePlus, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Source = "STORY" | "DM";
type StoryTrigger = "MENTION" | "REACTION" | "REPLY";

type Draft = {
  name: string;
  storyTriggerType: StoryTrigger;
  triggerMode: "SPECIFIC_KEYWORD" | "ANY_MESSAGE";
  keywords: string[];
  message: string;
  linkButtons: LinkButton[];
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
  message: "Thanks for reaching out! Here's what you asked for ✨",
  linkButtons: [{ label: DEFAULT_LINK_BUTTON_LABEL, url: "" }],
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
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const stepsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!automation?.listener) return;
    const storedLinks = readLinkButtons(automation.listener.quickReplies, automation.listener.ctaButtonTitle, automation.listener.ctaLink);
    setDraft({
      name: automation.name ?? "",
      storyTriggerType: automation.storyTriggerType === "REACTION" || automation.storyTriggerType === "REPLY" ? automation.storyTriggerType : "MENTION",
      triggerMode: automation.triggerMode === "SPECIFIC_KEYWORD" ? "SPECIFIC_KEYWORD" : "ANY_MESSAGE",
      keywords: Array.isArray(automation.keywords) ? automation.keywords.map((item: any) => item.word).filter(Boolean) : [],
      message: automation.listener.prompt ?? "",
      linkButtons: storedLinks.length ? storedLinks : [{ label: DEFAULT_LINK_BUTTON_LABEL, url: "" }],
      followGateRequired: Boolean(automation.followGateRequired),
      followRequestDmText: resolveFollowRequestDmText(automation.listener.followRequestDmText),
      followRequestButtonText: resolveFollowRequestButtonText(automation.listener.followRequestButtonText),
    });
  }, [automation]);

  useEffect(() => {
    if (step <= 1) return;
    window.requestAnimationFrame(() => {
      const container = stepsScrollRef.current;
      if (container) container.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }, [reduceMotion, step]);

  const ruleSummary = useMemo(() => {
    const trigger = source === "STORY"
      ? draft.storyTriggerType === "MENTION" ? "mentions you in a story" : draft.storyTriggerType === "REACTION" ? "reacts to your story" : "replies to your story"
      : draft.triggerMode === "ANY_MESSAGE" ? "sends you a DM" : `sends a DM containing ${draft.keywords.join(", ") || "your keyword"}`;
    return <>When <strong>someone {trigger}</strong>, AP3K will <strong>send them a DM</strong>.</>;
  }, [draft.keywords, draft.storyTriggerType, draft.triggerMode, source]);

  const canContinue = step === 1
    ? source === "STORY" || draft.triggerMode === "ANY_MESSAGE" || draft.keywords.length > 0
    : step === 2
      ? Boolean(draft.message.trim()) && linkButtonsAreComplete(draft.linkButtons)
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
    const firstLink = draft.linkButtons[0];
    const result = await saveMessageAutomation({
      ...draft,
      source,
      active: true,
      responseFormat: "LINK",
      ctaLink: firstLink?.url,
      ctaButtonTitle: firstLink?.label,
    }, automationId);
    if (result.status === 200 && typeof result.data === "object" && result.data?.id) {
      router.push(`/dashboard/${slug}/automation/${result.data.id}`);
      router.refresh();
      return;
    }
    setError(typeof result.data === "string" ? result.data : "Could not save automation.");
    setSaving(false);
  };

  return (
    <div className="min-h-screen min-w-0 bg-[#f5f6fa] pb-24 text-slate-950 dark:bg-[#050816] dark:text-white xl:mt-3 xl:h-[calc(100dvh-2.5rem)] xl:min-h-[620px] xl:overflow-hidden xl:rounded-2xl xl:pb-0 xl:ring-1 xl:ring-slate-200 xl:dark:ring-white/10">
      <div className="mx-auto grid w-full min-w-0 max-w-[1700px] gap-4 p-3 sm:p-4 xl:h-full xl:grid-cols-[minmax(0,1.15fr)_minmax(310px,0.85fr)] 2xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <section className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0d1220] xl:min-h-0">
          <AutomationWizardToolbar backHref={`/dashboard/${slug}/automation`} currentStep={step} totalSteps={3} accountLabel={source === "STORY" ? "Instagram Stories" : "Instagram DMs"} onOpenPreview={() => setMobilePreviewOpen(true)} />
          <div ref={stepsScrollRef} data-automation-scroll-region className="min-w-0 [overflow-anchor:none] xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:overscroll-contain">
        <AnimatePresence mode="wait">
          <motion.main id="current-message-step" key={step} initial={reduceMotion ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: 10 }} transition={{ duration: 0.22 }} className="h-fit min-w-0 p-5 sm:p-6 xl:min-h-full">
            {step === 1 && (
              <section>
                <PhaseHeader title={source === "STORY" ? "When someone interacts with your story" : "When someone sends you a DM"} description="Set the conditions that launch this automation." />
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
              <section><PhaseHeader title="DM with a link" description="Write the response and add up to three link buttons." /><MessageResponseEditor message={draft.message} linkButtons={draft.linkButtons} onChange={(next) => setDraft((current) => ({ ...current, ...next }))} /></section>
            )}

            {step === 3 && (
              <section><PhaseHeader title="Configure rules & name" description="Name the automation and decide whether the final message is reserved for followers." /><label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Automation name</label><input value={draft.name} maxLength={120} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder={source === "STORY" ? "Story mention welcome" : "Guide request DM"} className="ap3k-input mb-7 w-full rounded-xl px-4 py-3 text-sm" /><p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Optional follow request</p><DeliveryRules followGateRequired={draft.followGateRequired} followRequestDmText={draft.followRequestDmText} followRequestButtonText={draft.followRequestButtonText} onChange={(next) => setDraft((current) => ({ ...current, ...next }))} /><div className="mt-6 rounded-2xl border border-rf-purple/25 bg-rf-purple/[0.07] p-5"><p className="text-xs font-black uppercase tracking-[0.16em] text-rf-purple">Rule logic summary</p><p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{ruleSummary}</p></div></section>
            )}

            {error && <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">{error}</p>}
          </motion.main>
        </AnimatePresence>
          </div>
          <div className="hidden shrink-0 border-t border-slate-200 bg-white/95 px-4 py-3 dark:border-white/10 dark:bg-[#0d1220]/95 xl:block">
            <MessageWizardActions step={step} canContinue={canContinue} saving={saving} onBack={() => step === 1 ? router.push(`/dashboard/${slug}/automation`) : setStep(step - 1)} onContinue={() => setStep(step + 1)} onSave={() => void save()} />
          </div>
        </section>
        <aside className="hidden min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white/70 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.025] xl:flex">
          <MessageAutomationPreview
            source={source}
            step={step}
            trigger={draft.storyTriggerType}
            triggerMode={draft.triggerMode}
            keywords={draft.keywords}
            message={draft.message}
            linkButtons={draft.linkButtons}
            followGateRequired={draft.followGateRequired}
            followRequestDmText={draft.followRequestDmText}
            followRequestButtonText={draft.followRequestButtonText}
          />
        </aside>
      </div>

      {mobilePreviewOpen && (
        <div role="dialog" aria-modal="true" aria-label="Instagram preview" className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-sm xl:hidden">
          <div className="mx-auto flex h-[calc(100dvh-1.5rem)] max-w-[460px] flex-col rounded-3xl bg-white p-3 shadow-2xl dark:bg-[#080c18]">
            <div className="z-10 mb-2 flex shrink-0 items-center justify-between rounded-2xl bg-white/95 px-3 py-2 backdrop-blur dark:bg-[#080c18]/95"><p className="text-sm font-black">Instagram preview</p><button type="button" onClick={() => setMobilePreviewOpen(false)} aria-label="Close preview" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 dark:border-white/10"><X className="h-4 w-4" /></button></div>
            <div className="min-h-0 flex-1"><MessageAutomationPreview source={source} step={step} trigger={draft.storyTriggerType} triggerMode={draft.triggerMode} keywords={draft.keywords} message={draft.message} linkButtons={draft.linkButtons} followGateRequired={draft.followGateRequired} followRequestDmText={draft.followRequestDmText} followRequestButtonText={draft.followRequestButtonText} /></div>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-10px_40px_-28px_rgba(15,23,42,0.6)] backdrop-blur-xl dark:border-white/10 dark:bg-[#080c18]/95 xl:hidden">
        <MessageWizardActions step={step} canContinue={canContinue} saving={saving} onBack={() => step === 1 ? router.push(`/dashboard/${slug}/automation`) : setStep(step - 1)} onContinue={() => setStep(step + 1)} onSave={() => void save()} />
      </div>
    </div>
  );
}

function MessageWizardActions({ step, canContinue, saving, onBack, onContinue, onSave }: { step: number; canContinue: boolean; saving: boolean; onBack: () => void; onContinue: () => void; onSave: () => void }) {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <button type="button" onClick={onBack} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-600 dark:border-white/10 dark:text-slate-300">Back</button>
      {step < 3 ? (
        <button type="button" disabled={!canContinue} onClick={onContinue} className="rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-black text-white disabled:opacity-35 dark:bg-white dark:text-slate-950">Continue</button>
      ) : (
        <button type="button" disabled={!canContinue || saving} onClick={onSave} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-7 py-2.5 text-sm font-black text-white shadow-lg disabled:opacity-40">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Go live</button>
      )}
    </div>
  );
}

function PhaseHeader({ title, description }: { title: string; description: string }) { return <div className="mb-5"><h1 className="text-2xl font-black tracking-tight">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p></div>; }
function Choice({ selected, title, description, onClick }: { selected: boolean; title: string; description: string; onClick: () => void }) { return <button type="button" onClick={onClick} className={["rounded-2xl border p-5 text-left transition", selected ? "border-rf-purple bg-rf-purple/10 ring-2 ring-rf-purple/15" : "border-slate-200 bg-slate-50 hover:border-rf-purple/30 dark:border-white/10 dark:bg-white/[0.04]"].join(" ")}><span className="block text-base font-black">{title}</span><span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{description}</span></button>; }
