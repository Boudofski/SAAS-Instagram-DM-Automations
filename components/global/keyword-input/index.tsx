"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

type MatchingMode = "EXACT" | "CONTAINS";

type Props = {
  triggerMode: "SPECIFIC_KEYWORD" | "ANY_COMMENT";
  keywords: string[];
  matchingMode: MatchingMode;
  onTriggerModeChange: (mode: "SPECIFIC_KEYWORD" | "ANY_COMMENT") => void;
  onAdd: (word: string) => void;
  onRemove: (word: string) => void;
  onModeChange: (mode: MatchingMode) => void;
};

const KW_COLOURS = [
  "bg-rf-pink/10 text-rf-pink border-rf-pink/25",
  "bg-rf-purple/10 text-rf-purple border-rf-purple/25",
  "bg-rf-blue/10 text-rf-blue border-rf-blue/25",
  "bg-rf-green/10 text-rf-green border-rf-green/25",
];

const MODES: { value: MatchingMode; label: string; desc: string }[] = [
  { value: "CONTAINS", label: "Contains",   desc: "Keyword appears anywhere in comment" },
  { value: "EXACT",    label: "Exact match", desc: "Comment is exactly this word" },
];

export default function KeywordInput({
  triggerMode, keywords, matchingMode, onTriggerModeChange, onAdd, onRemove, onModeChange,
}: Props) {
  const [value, setValue] = useState("");

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
            desc: "Trigger for every comment on the selected post scope.",
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
            Use carefully to avoid sending too many public replies or DMs.
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
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm
                     text-slate-950 placeholder:text-slate-400 outline-none transition-colors
                     focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
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
              {kw}
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

      {/* Matching mode */}
      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => onModeChange(m.value)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2.5 text-center transition-all border",
              matchingMode === m.value
                ? "border-rf-blue bg-white text-slate-950 shadow-sm"
                : "border-transparent text-slate-500 hover:bg-white"
            )}
          >
            <div className="text-xs font-bold flex items-center justify-center gap-1.5">
              {m.label}
            </div>
            <div className="mt-0.5 text-[10px] text-slate-500">{m.desc}</div>
          </button>
        ))}
      </div>
      </>
      )}
    </div>
  );
}
