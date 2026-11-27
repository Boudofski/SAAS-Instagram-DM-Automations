"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type Section = { title: string; intro?: string; items: string[] };

/** Local planning aid. Checklist progress never leaves the current page. */
export default function WorkflowChecklist({ title, sections }: { title: string; sections: Section[] }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [copyState, setCopyState] = useState("");
  const total = sections.reduce((sum, section) => sum + section.items.length, 0);
  const checked = Object.values(selected).filter(Boolean).length;
  async function copyWorksheet() {
    const text = [title, ...sections.map((section, i) => [section.title, ...section.items.map((item, j) => `[${selected[`${i}-${j}`] ? "x" : " "}] ${item}`)].join("\n"))].join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("Worksheet copied.");
    } catch {
      setCopyState("Could not copy. You can select and copy the checklist directly.");
    }
  }
  return (
    <div className="mt-7 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200" aria-live="polite">{checked} of {total} checked</p>
        <button type="button" onClick={copyWorksheet} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 text-sm font-semibold text-violet-800 hover:bg-violet-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:border-violet-300/30 dark:bg-slate-900 dark:text-violet-200">
          {copyState === "Worksheet copied." ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />} Copy worksheet
        </button>
        {copyState && <p role="status" className="w-full text-sm">{copyState}</p>}
      </div>
      {sections.map((section, i) => (
        <fieldset key={section.title} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/15 dark:bg-white/[0.04] sm:p-6">
          <legend className="px-2 text-lg font-bold">{section.title}</legend>
          {section.intro && <p className="mb-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{section.intro}</p>}
          {section.items.map((item, j) => {
            const key = `${i}-${j}`;
            return (
              <label key={item} className="flex min-h-11 cursor-pointer items-start gap-3 border-b border-slate-100 py-3 text-sm leading-6 last:border-b-0 dark:border-white/10">
                <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-violet-700" checked={Boolean(selected[key])} onChange={event => {
                  const value = event.currentTarget.checked;
                  setSelected(previous => ({ ...previous, [key]: value }));
                  setCopyState("");
                }} />
                <span>{item}</span>
              </label>
            );
          })}
        </fieldset>
      ))}
    </div>
  );
}
