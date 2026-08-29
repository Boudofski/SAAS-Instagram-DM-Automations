"use client";

import { cn } from "@/lib/utils";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { formatKeywordDisplay } from "@/lib/keyword-display";
import { useState } from "react";

type Props = {
  triggerMode: "SPECIFIC_KEYWORD" | "ANY_COMMENT";
  keywords: string[];
  onTriggerModeChange: (mode: "SPECIFIC_KEYWORD" | "ANY_COMMENT") => void;
  onAdd: (word: string) => void;
  onRemove: (word: string) => void;
};

const KW_COLOURS = [
  "bg-rf-pink/10 text-rf-pink border-rf-pink/25",
  "bg-rf-purple/10 text-rf-purple border-rf-purple/25",
  "bg-rf-blue/10 text-rf-blue border-rf-blue/25",
  "bg-rf-green/10 text-rf-green border-rf-green/25",
];

export default function KeywordInput({
  triggerMode, keywords, onTriggerModeChange, onAdd, onRemove,
}: Props) {
  const [value, setValue] = useState("");
  const appReviewMode = isAppReviewMode();

  const handleAdd = () => {
    const w = value.trim().toLowerCase();
    if (!w || keywords.includes(w)) return;
    onAdd(w);
    setValue("");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          {
            value: "SPECIFIC_KEYWORD" as const,
            label: "Specific keyword",
            desc: "Only trigger when the comment contains one of your keywords.",
          },
          {
            value: "ANY_COMMENT" as const,
            label: "Any comment",
            desc: "Trigger for every comment in the post scope. Best for small controlled launches.",
          },
        ].map((mode) => (
          <button
            key={mode.value}
            type="button"
            onClick={() => onTriggerModeChange(mode.value)}
            className={cn(
              "rounded-2xl border-2 p-4 text-left transition-all",
              triggerMode === mode.value
                ? "border-rf-blue bg-rf-blue/10 shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
                : "border-slate-200 bg-white hover:border-rf-blue/40"
            )}
          >
            <span className="text-sm font-black text-slate-950">{mode.label}</span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-500">{mode.desc}</span>
          </button>
        ))}
      </div>

      {triggerMode === "ANY_COMMENT" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-bold">Every comment will trigger this automation.</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800">
            AP3k automatically ignores your own replies to prevent loops. Use this when every commenter should get the same response.
          </p>
        </div>
      )}

      {triggerMode === "SPECIFIC_KEYWORD" && (
        <>
      {/* Input row */}
      <div className="flex gap-2.5">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder='Type a keyword (e.g. "link", "guide", "yes")'
          className="ap3k-input flex-1 rounded-xl px-4 py-3 text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!value.trim()}
          className="ap3k-gradient-button disabled:opacity-40 text-sm px-5"
        >
          + Add
        </button>
      </div>
      {keywords.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
          Add at least one word people will comment intentionally. Example: if the post says comment GUIDE, add guide here.
        </p>
      )}

      {/* Keyword chips */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw, i) => (
            <span
              key={kw}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold",
                KW_COLOURS[i % KW_COLOURS.length]
              )}
            >
              {formatKeywordDisplay(kw, appReviewMode)}
              <button
                type="button"
                onClick={() => onRemove(kw)}
                className="opacity-60 hover:opacity-100 text-xs leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
}
