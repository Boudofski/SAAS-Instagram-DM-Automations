"use client";

import { ImageIcon, Link2, MessageSquareText, Plus, X } from "lucide-react";
import { useState } from "react";

export type ResponseFormat = "TEXT" | "LINK" | "MEDIA";

type Props = {
  format: ResponseFormat;
  message: string;
  quickReplies: string[];
  ctaLink: string;
  ctaButtonTitle: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  onChange: (next: Partial<Omit<Props, "onChange">>) => void;
};

const FORMATS = [
  { value: "TEXT", label: "Text only", icon: MessageSquareText },
  { value: "LINK", label: "Card / Link", icon: Link2 },
  { value: "MEDIA", label: "Rich media", icon: ImageIcon },
] as const;

export default function MessageResponseEditor({ format, message, quickReplies, ctaLink, ctaButtonTitle, mediaUrl, mediaType, onChange }: Props) {
  const [draftChip, setDraftChip] = useState("");

  const addChip = () => {
    const chip = Array.from(draftChip.trim()).slice(0, 20).join("");
    if (!chip || quickReplies.length >= 4 || quickReplies.includes(chip)) return;
    onChange({ quickReplies: [...quickReplies, chip] });
    setDraftChip("");
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Direct message format</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {FORMATS.map((item) => {
            const Icon = item.icon;
            const selected = format === item.value;
            return (
              <button key={item.value} type="button" onClick={() => onChange({ format: item.value })} className={["flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-black transition", selected ? "border-rf-purple bg-rf-purple/10 text-rf-purple ring-2 ring-rf-purple/15" : "border-slate-200 bg-white text-slate-600 hover:border-rf-purple/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"].join(" ")}>
                <Icon className="h-4 w-4" /> {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-4">
          <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">DM message text</label>
          <span className={message.length > 1000 ? "text-xs font-bold text-red-500" : "text-xs font-bold text-slate-400"}>{message.length}/1000</span>
        </div>
        <textarea value={message} maxLength={1000} onChange={(event) => onChange({ message: event.target.value })} rows={6} placeholder="Write the helpful message your prospect receives…" className="ap3k-textarea w-full resize-none rounded-2xl px-4 py-3 text-sm" />
      </div>

      {format === "LINK" && (
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Button label</label>
            <input value={ctaButtonTitle} maxLength={20} onChange={(event) => onChange({ ctaButtonTitle: event.target.value })} placeholder="Get the link" className="ap3k-input w-full rounded-xl px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Destination URL</label>
            <input type="url" value={ctaLink} onChange={(event) => onChange({ ctaLink: event.target.value })} placeholder="https://your-site.com/offer" className="ap3k-input w-full rounded-xl px-4 py-3 text-sm" />
          </div>
        </div>
      )}

      {format === "MEDIA" && (
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04] sm:grid-cols-[140px_1fr]">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Media type</label>
            <select value={mediaType} onChange={(event) => onChange({ mediaType: event.target.value as "IMAGE" | "VIDEO" })} className="ap3k-select w-full rounded-xl px-3 py-3 text-sm font-bold"><option value="IMAGE">Image</option><option value="VIDEO">Video</option></select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Public media URL</label>
            <input type="url" value={mediaUrl} onChange={(event) => onChange({ mediaUrl: event.target.value })} placeholder="https://your-site.com/media.jpg" className="ap3k-input w-full rounded-xl px-4 py-3 text-sm" />
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Quick reply chips ({quickReplies.length}/4)</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Optional tap-to-reply choices shown under the message.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickReplies.map((chip) => (
            <span key={chip} className="inline-flex items-center gap-2 rounded-full border border-rf-purple/25 bg-rf-purple/10 px-3 py-2 text-xs font-bold text-rf-purple">{chip}<button type="button" onClick={() => onChange({ quickReplies: quickReplies.filter((item) => item !== chip) })} aria-label={`Remove ${chip}`}><X className="h-3.5 w-3.5" /></button></span>
          ))}
        </div>
        {quickReplies.length < 4 && (
          <div className="mt-3 flex gap-2">
            <input value={draftChip} maxLength={20} onChange={(event) => setDraftChip(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addChip(); } }} placeholder="Example: Tell me more" className="ap3k-input min-w-0 flex-1 rounded-xl px-4 py-3 text-sm" />
            <button type="button" onClick={addChip} disabled={!draftChip.trim()} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-40 dark:bg-white dark:text-slate-950"><Plus className="h-4 w-4" /> Add chip</button>
          </div>
        )}
      </div>

    </div>
  );
}
