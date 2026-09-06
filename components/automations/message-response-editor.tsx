"use client";

import { DEFAULT_LINK_BUTTON_LABEL, MAX_LINK_BUTTONS, type LinkButton } from "@/lib/link-buttons";
import { Link2, Plus, Trash2 } from "lucide-react";

type Props = {
  message: string;
  linkButtons: LinkButton[];
  onChange: (next: Partial<Omit<Props, "onChange">>) => void;
};

export default function MessageResponseEditor({ message, linkButtons, onChange }: Props) {
  const buttons = linkButtons.length > 0
    ? linkButtons.slice(0, MAX_LINK_BUTTONS)
    : [{ label: DEFAULT_LINK_BUTTON_LABEL, url: "" }];

  const updateButton = (index: number, partial: Partial<LinkButton>) => {
    onChange({ linkButtons: buttons.map((button, buttonIndex) => buttonIndex === index ? { ...button, ...partial } : button) });
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between gap-4">
          <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">DM message text</label>
          <span className={message.length > 1000 ? "text-xs font-bold text-red-500" : "text-xs font-bold text-slate-400"}>{message.length}/1000</span>
        </div>
        <textarea value={message} maxLength={1000} onChange={(event) => onChange({ message: event.target.value })} rows={5} placeholder="Write the message shown above your links…" className="ap3k-textarea w-full resize-none rounded-2xl px-4 py-3 text-sm" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300"><Link2 className="h-4 w-4 text-rf-purple" /> Links ({buttons.length}/{MAX_LINK_BUTTONS})</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Each label appears as a full-width button below the DM.</p>
          </div>
        </div>
        <div className="space-y-3">
          {buttons.map((button, index) => (
            <div key={index} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950/35 sm:grid-cols-[minmax(150px,0.7fr)_minmax(220px,1.3fr)_auto] sm:items-end">
              <label className="min-w-0 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Button label
                <input value={button.label} maxLength={20} onChange={(event) => updateButton(index, { label: event.target.value })} placeholder={`Link ${index + 1}`} className="ap3k-input mt-2 w-full rounded-xl px-4 py-3 text-sm normal-case tracking-normal" />
              </label>
              <label className="min-w-0 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Destination URL
                <input type="url" inputMode="url" value={button.url} onChange={(event) => updateButton(index, { url: event.target.value })} placeholder="https://your-site.com/offer" className="ap3k-input mt-2 w-full rounded-xl px-4 py-3 text-sm normal-case tracking-normal" />
              </label>
              {buttons.length > 1 ? (
                <button type="button" onClick={() => onChange({ linkButtons: buttons.filter((_, buttonIndex) => buttonIndex !== index) })} aria-label={`Remove link ${index + 1}`} className="grid h-11 w-11 place-items-center rounded-xl border border-red-500/20 text-red-500 transition hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : <span className="hidden h-11 w-11 sm:block" />}
            </div>
          ))}
        </div>
        {buttons.length < MAX_LINK_BUTTONS ? (
          <button type="button" onClick={() => onChange({ linkButtons: [...buttons, { label: `Link ${buttons.length + 1}`, url: "" }] })} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-rf-purple/30 bg-rf-purple/10 px-4 text-sm font-black text-rf-purple transition hover:bg-rf-purple/15">
            <Plus className="h-4 w-4" /> Add link
          </button>
        ) : null}
      </div>
    </div>
  );
}
