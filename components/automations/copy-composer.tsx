"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Info, Loader2, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useUi } from "@/components/i18n/use-ui";
import { useI18n } from "@/providers/i18n-provider";
import { generateAutomationCopyAction } from "@/actions/automation-copy";
import { DEFAULT_COMMENT_PROMPT, DEFAULT_COMMENT_ONLY_PROMPT, MAX_COMMENT_REPLIES, MAX_MESSAGE_VARIATIONS, normalizeCopyList, type AutomationCopyInput, type AutomationCopyMode } from "@/lib/automation-copy";
import { editorStyles as s } from "./editor-layout";

type Context = Omit<AutomationCopyInput, "mode" | "text" | "existing" | "instructions" | "locale"> & { available: boolean };

function useCopyGeneration(context: Context) {
  const { locale } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const contextKey = JSON.stringify({ ...context, locale });
  const latestContext = useRef(contextKey); latestContext.current = contextKey;
  async function generate(mode: AutomationCopyMode, values: Partial<AutomationCopyInput> = {}) {
    if (pending.current) return null;
    if (!context.available) { setError("AI generation is available on Pro and Business plans."); return null; }
    pending.current = true; setBusy(true); setError(null);
    try {
      const result = await generateAutomationCopyAction({ ...context, ...values, mode, locale });
      if (latestContext.current !== contextKey) return null;
      if (!result.ok) { setError(result.error); return null; }
      return result.items;
    } catch { setError("AI could not generate copy. Your saved text is unchanged. Try again."); return null; }
    finally { pending.current = false; setBusy(false); }
  }
  return { generate, busy, error };
}

export function CopyField({ label, value, onChange, maxLength = 1000, rows = 4, disabled = false, compact = false }: { label: string; value: string; onChange: (value: string) => void; maxLength?: number; rows?: number; disabled?: boolean; compact?: boolean }) {
  const tr = useUi();
  const ref = useRef<HTMLTextAreaElement>(null);
  function insertUsername() {
    const start = ref.current?.selectionStart ?? value.length;
    const end = ref.current?.selectionEnd ?? start;
    const token = "{{username}}";
    if (value.length - (end - start) + token.length > maxLength) return;
    onChange(value.slice(0, start) + token + value.slice(end));
    requestAnimationFrame(() => { ref.current?.focus(); ref.current?.setSelectionRange(start + token.length, start + token.length); });
  }
  return <div className={`${s.copyField} ${compact ? s.copyCompact : ""}`}>
    <textarea ref={ref} aria-label={tr(label)} value={value} onChange={e => onChange(e.target.value)} rows={rows} maxLength={maxLength} dir="auto" disabled={disabled} placeholder={tr("Enter your message here")} />
    <div className={s.copyFooter}><span>{value.length}/{maxLength}</span><button type="button" title={tr("Insert username")} aria-label={tr("Insert username")} onClick={insertUsername} disabled={disabled}>{"{}"}<span>{tr("Username")}</span></button></div>
  </div>;
}

export function PublicReplyComposer({ replies, onRepliesChange, ai, prompt, onPromptChange, context, onPreview }: {
  replies: string[]; onRepliesChange: (value: string[]) => void; ai: boolean; prompt: string; onPromptChange: (value: string) => void; context: Context; onPreview: (reply: string) => void;
}) {
  const tr = useUi(); const generation = useCopyGeneration(context);
  const [draft, setDraft] = useState("");
  const [samples, setSamples] = useState<string[]>([]);
  const [showSamples, setShowSamples] = useState(false);
  const repliesRef = useRef(replies); repliesRef.current = replies;
  const promptRef = useRef(prompt); promptRef.current = prompt;
  useEffect(() => { setSamples([]); onPreview(""); }, [prompt, context.sendDm, context.openingDm, onPreview]); // Samples must reflect the current prompt and delivery mode.
  const defaultPrompt = tr(context.sendDm ? DEFAULT_COMMENT_PROMPT : DEFAULT_COMMENT_ONLY_PROMPT);
  const add = () => { const next = draft.trim(); if (!next || replies.length >= MAX_COMMENT_REPLIES) return; onRepliesChange(normalizeCopyList([...replies, next])); setDraft(""); };
  async function generateReplies() {
    const items = await generation.generate("COMMENT_REPLIES", { text: draft, existing: replies });
    if (items) { onRepliesChange(normalizeCopyList([...repliesRef.current, ...items])); setDraft(""); }
  }
  async function regeneratePrompt() {
    const before = prompt;
    const items = await generation.generate("COMMENT_PROMPT", { instructions: prompt || defaultPrompt, existing: [prompt] });
    if (items && promptRef.current === before) onPromptChange(items[0]);
  }
  async function preview() {
    setShowSamples(true);
    const before = prompt;
    const items = await generation.generate("COMMENT_SAMPLES", { instructions: prompt || defaultPrompt, existing: samples });
    if (items && promptRef.current === before) { setSamples(items); onPreview(items[0]); }
  }
  return <div className={s.copySection}>
    {ai ? <>
      <div className={s.copyHeading}><strong>{tr("Prompt")}</strong><button type="button" className={s.textAction} disabled={generation.busy || !context.available} onClick={() => void regeneratePrompt()}>{generation.busy ? <Loader2 className="animate-spin"/> : <Sparkles/>}{tr("Regenerate prompt")}</button></div>
      <CopyField label="AI comment prompt" value={prompt} onChange={onPromptChange} maxLength={1600} rows={4}/>
      <button type="button" className={s.outlineAction} disabled={generation.busy} onClick={() => showSamples ? setShowSamples(false) : void preview()}>{showSamples ? <EyeOff/> : <Eye/>}{tr(showSamples ? "Hide preview" : "Preview replies")}</button>
      {showSamples && <><div className={s.copyHeading}><strong>{tr("Sample replies")}</strong><button type="button" className={s.textAction} disabled={generation.busy || !context.available} onClick={() => void preview()}><RefreshCw className={generation.busy ? "animate-spin" : ""}/>{tr("New samples")}</button></div><div className={s.replyList}>{samples.length ? samples.map((reply, index) => <button type="button" key={index} className={s.sampleReply} onClick={() => onPreview(reply)} dir="auto">{reply.replace(/\{\{username\}\}|\bUsername\b/g, "@username")}</button>) : <p className={s.hint}>{tr(generation.busy ? "Generating replies…" : "Generate samples to preview your prompt.")}</p>}</div><p className={s.hint}>{tr("Samples show the AI style. Live replies are written for each matching comment.")}</p></>}
    </> : <>
      <div className={s.copyHeading}><strong>{tr("Your replies")} · {replies.length}</strong><span className={s.hint}>{tr("Rotate randomly per comment")}</span></div>
      <div className={s.replyList}>{replies.map((reply, index) => <div className={s.replyLine} key={index}><textarea aria-label={`${tr("Reply")} ${index + 1}`} dir="auto" rows={1} maxLength={1000} value={reply} onFocus={() => onPreview(reply)} onChange={e => { onRepliesChange(replies.map((x, i) => i === index ? e.target.value : x)); onPreview(e.target.value); }}/><button type="button" className={s.remove} aria-label={`${tr("Delete reply")} ${index + 1}`} onClick={() => onRepliesChange(replies.filter((_, i) => i !== index))}><Trash2 size={15}/></button></div>)}</div>
      {replies.length < MAX_COMMENT_REPLIES && <div className={s.replyEntry}><input aria-label={tr("Add reply")} placeholder={tr("Type a reply and press Enter…")} value={draft} maxLength={1000} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}/><button type="button" className={s.generateAction} disabled={generation.busy || !context.available} onClick={() => void generateReplies()}>{generation.busy ? <Loader2 className="animate-spin"/> : <Sparkles/>}{tr("Generate")}</button><button type="button" aria-label={tr("Insert username")} title={tr("Insert username")} onClick={() => setDraft(x => `${x}{{username}}`.slice(0, 1000))}>{"{}"}</button><button type="button" aria-label={tr("Add reply")} disabled={!draft.trim()} onClick={add}><Plus size={16}/></button></div>}
      <p className={s.infoHint}><Info size={14}/>{tr("Add 3 or more replies to keep responses varied. Every variation should communicate the same next step.")}</p>
    </>}
    {generation.error && <p role="alert" className={s.error}>{tr(generation.error)}</p>}
  </div>;
}

export function MessageCopyComposer({ message, onMessageChange, variations, onVariationsChange, context, onPreview, maxLength = 1000 }: {
  message: string; onMessageChange: (value: string) => void; variations: string[]; onVariationsChange: (value: string[]) => void; context: Context; onPreview?: (value: string) => void; maxLength?: number;
}) {
  const tr = useUi(); const generation = useCopyGeneration(context);
  const [open, setOpen] = useState(false); const [draft, setDraft] = useState<string[]>([]);
  const [selected, setSelected] = useState(0);
  const messageRef = useRef(message); messageRef.current = message;
  const openRef = useRef(false); openRef.current = open;
  const draftRef = useRef(draft); draftRef.current = draft;
  async function generateMessage() {
    const before = message;
    const items = await generation.generate("MESSAGE", { text: message });
    if (items && messageRef.current === before) onMessageChange(items[0].slice(0, maxLength));
  }
  async function generateVariations(replace = false, index?: number) {
    const before = draftRef.current;
    const original = message;
    const items = await generation.generate("MESSAGE_VARIATIONS", { text: message, existing: draftRef.current });
    if (!items || messageRef.current !== original || !openRef.current || before !== draftRef.current) return;
    setDraft(current => index !== undefined ? current.map((value, i) => i === index ? items[0] : value) : normalizeCopyList(replace ? items : [...current, ...items], MAX_MESSAGE_VARIATIONS));
  }
  const show = () => { setDraft([...variations]); setOpen(true); };
  const shown = selected > 0 ? variations[selected - 1] ?? message : message;
  return <div className={s.copySection}>
    <div className={s.copyHeading}><strong>{tr("Message")}</strong><div className={s.copyActions}><button type="button" className={s.textAction} disabled={generation.busy || !context.available} onClick={() => void generateMessage()}>{generation.busy ? <Loader2 className="animate-spin"/> : <Sparkles/>}{tr("Generate message")}</button><button type="button" className={s.textAction} onClick={show}><Sparkles/>{tr(variations.length ? "Edit variations" : "Add variations")}{variations.length ? ` (${variations.length})` : ""}</button></div></div>
    {variations.length > 0 && <div className={s.variationTabs}>{[message, ...variations].map((_, index) => <button type="button" key={index} aria-pressed={selected === index} onClick={() => { setSelected(index); onPreview?.(index ? variations[index - 1] : message); }}>{index === 0 ? tr("Original") : `${tr("Variation")} ${index}`}</button>)}</div>}
    <CopyField label="DM message text" value={shown} maxLength={maxLength} onChange={value => { if (selected > 0 && variations[selected - 1] !== undefined) onVariationsChange(variations.map((x, i) => i === selected - 1 ? value : x)); else onMessageChange(value); onPreview?.(value); }}/>
    {generation.error && !open && <p role="alert" className={s.error}>{tr(generation.error)}</p>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className={s.copyDialog}><DialogTitle>{tr("Variations")}</DialogTitle><DialogDescription>{tr("These rotate automatically so your DMs feel personal. Your links and buttons stay the same.")}</DialogDescription>
      <div className={s.copyHeading}><span>{draft.length}/{MAX_MESSAGE_VARIATIONS} {tr("variations")}</span><button type="button" className={s.textAction} disabled={generation.busy || !context.available || !message.trim()} onClick={() => void generateVariations(true)}><RefreshCw className={generation.busy ? "animate-spin" : ""}/>{tr("Regenerate")}</button></div>
      <div className={s.variationList}>{draft.map((value, index) => <div key={index}><div className={s.copyHeading}><strong>{tr("Variation")} {index + 1}</strong><div className={s.copyActions}><button type="button" aria-label={`${tr("Regenerate variation")} ${index + 1}`} disabled={generation.busy || !context.available} onClick={() => void generateVariations(false, index)}><RefreshCw size={15}/></button><button type="button" aria-label={`${tr("Delete variation")} ${index + 1}`} onClick={() => setDraft(x => x.filter((_, i) => i !== index))}><Trash2 size={15}/></button></div></div><CopyField label={`${tr("Variation")} ${index + 1}`} value={value} maxLength={maxLength} onChange={text => setDraft(x => x.map((v, i) => i === index ? text : v))} rows={3}/></div>)}</div>
      {generation.error && <p role="alert" className={s.error}>{tr(generation.error)}</p>}
      <div className={s.dialogActions}><button type="button" className={s.outlineAction} disabled={draft.length >= MAX_MESSAGE_VARIATIONS || generation.busy} onClick={() => setDraft(x => [...x, ""])}><Plus/>{tr("Write my own")}</button><button type="button" className={s.generateAction} disabled={draft.length >= MAX_MESSAGE_VARIATIONS || generation.busy || !context.available || !message.trim()} onClick={() => void generateVariations()}>{generation.busy ? <Loader2 className="animate-spin"/> : <Sparkles/>}{tr("Generate more")}</button></div>
      <div className={s.dialogActions}><button type="button" className={s.outlineAction} onClick={() => setOpen(false)}>{tr("Cancel")}</button><button type="button" className={s.publish} disabled={generation.busy || draft.some(x => !x.trim())} onClick={() => { onVariationsChange(normalizeCopyList(draft, MAX_MESSAGE_VARIATIONS)); setSelected(0); onPreview?.(message); setOpen(false); }}>{tr("Save")}</button></div>
    </DialogContent></Dialog>
  </div>;
}
