"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

type MatchingMode = "EXACT" | "CONTAINS" | "SMART_AI";

type Props = {
  keywords: string[];
  matchingMode: MatchingMode;
  onAdd: (word: string) => void;
  onRemove: (word: string) => void;
  onModeChange: (mode: MatchingMode) => void;
  isProUser?: boolean;
};

const KW_COLOURS = [
  "bg-rf-pink/10 text-rf-pink border-rf-pink/25",
  "bg-rf-purple/10 text-rf-purple border-rf-purple/25",
  "bg-rf-blue/10 text-rf-blue border-rf-blue/25",
  "bg-rf-green/10 text-rf-green border-rf-green/25",
];

const MODES: { value: MatchingMode; label: string; desc: string; pro?: boolean }[] = [
  { value: "CONTAINS", label: "Contains",   desc: "Keyword appears anywhere in comment" },
  { value: "EXACT",    label: "Exact match", desc: "Comment is exactly this word" },
  { value: "SMART_AI", label: "Smart AI",    desc: "AI detects intent", pro: true },
];

export default function KeywordInput({
  keywords, matchingMode, onAdd, onRemove, onModeChange, isProUser,
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
      {/* Input row */}
      <div className="flex gap-2.5">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder='Type a keyword (e.g. "link", "guide", "yes")'
          className="flex-1 bg-rf-surface/80 border border-white/10 rounded-xl px-4 py-3 text-sm
                     text-rf-text placeholder:text-rf-subtle outline-none focus:border-rf-blue
                     transition-colors"
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
      <div className="flex gap-2 bg-rf-surface/80 border border-white/10 rounded-2xl p-3">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            disabled={m.pro && !isProUser}
            onClick={() => (!m.pro || isProUser) ? onModeChange(m.value) : undefined}
            className={cn(
              "flex-1 rounded-lg px-3 py-2.5 text-center transition-all border",
              matchingMode === m.value
                ? "bg-ap3k-gradient-soft border-rf-pink/30 text-rf-text"
                : "border-transparent hover:bg-white/5 text-rf-muted",
              m.pro && !isProUser && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="text-xs font-bold flex items-center justify-center gap-1.5">
              {m.label}
              {m.pro && (
                <span className="bg-ap3k-gradient text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  PRO
                </span>
              )}
            </div>
            <div className="text-[10px] text-rf-muted mt-0.5">{m.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
