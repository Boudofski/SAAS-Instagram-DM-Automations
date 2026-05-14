"use client";

import { resolveTemplate } from "@/lib/template";
import { useState } from "react";

const DM_TEMPLATES = [
  {
    label: "Free guide",
    icon: "🎁",
    text: "Hey {{first_name}}! Here's the free guide you asked for → {{link}}",
  },
  {
    label: "Price inquiry",
    icon: "💰",
    text: "Hey {{first_name}}! Here are the full pricing details → {{link}}",
  },
  {
    label: "Booking call",
    icon: "📅",
    text: "Hey {{first_name}}! Grab your spot here → {{link}}",
  },
  {
    label: "Discount code",
    icon: "🔥",
    text: "Hey {{first_name}}! Your exclusive discount is inside → {{link}}",
  },
  {
    label: "Course link",
    icon: "🎓",
    text: "Hey {{first_name}}! Here's the course link → {{link}}",
  },
];

const VARS = ["{{first_name}}", "{{username}}", "{{keyword}}", "{{link}}"] as const;

const PREVIEW_VARS = {
  first_name: "Sarah",
  username: "@sarah.creates",
  keyword: "guide",
  link: "yoursite.com/resource",
};

type Props = {
  value: string;
  ctaLink: string;
  onChange: (value: string) => void;
  onCtaLinkChange: (link: string) => void;
};

export default function DmEditor({ value, ctaLink, onChange, onCtaLinkChange }: Props) {
  const [showTemplates, setShowTemplates] = useState(false);

  const insertVar = (v: string) => {
    onChange(value + v);
  };

  const preview = resolveTemplate(value, PREVIEW_VARS);

  return (
    <div className="flex flex-col gap-3">
      {/* Template picker toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-rf-muted font-medium">Write your message</span>
        <button
          type="button"
          onClick={() => setShowTemplates((s) => !s)}
          className="text-xs text-rf-blue font-semibold hover:underline"
        >
          {showTemplates ? "Hide templates" : "⚡ Use a template"}
        </button>
      </div>

      {/* Templates */}
      {showTemplates && (
        <div className="flex gap-2 flex-wrap">
          {DM_TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => { onChange(t.text); setShowTemplates(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg
                         bg-rf-surface2 border border-rf-border hover:border-rf-blue/40
                         text-rf-muted hover:text-rf-text transition-all"
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Textarea */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Hey {{first_name}}! Here's what you asked for → {{link}}"
        rows={4}
        className="w-full bg-rf-surface border border-rf-border rounded-xl px-4 py-3 text-sm
                   text-rf-text placeholder:text-rf-subtle outline-none focus:border-rf-blue
                   resize-none transition-colors leading-relaxed"
      />

      {/* Variable insert buttons */}
      <div className="flex gap-2 flex-wrap">
        {VARS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => insertVar(v)}
            className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md
                       bg-rf-purple/10 border border-rf-purple/25 text-rf-purple
                       hover:bg-rf-purple/20 transition-colors"
          >
            {v}
          </button>
        ))}
      </div>

      {/* CTA link input */}
      <input
        type="url"
        value={ctaLink}
        onChange={(e) => onCtaLinkChange(e.target.value)}
        placeholder="CTA link — replaces {{link}} (optional)"
        className="bg-rf-surface border border-rf-border rounded-lg px-4 py-2.5 text-sm
                   text-rf-text placeholder:text-rf-subtle outline-none focus:border-rf-blue
                   transition-colors"
      />

      {/* Live preview */}
      {value && (
        <div className="bg-rf-blue/5 border border-rf-blue/15 rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-rf-muted mb-2">
            Preview
          </p>
          <div className="bg-rf-surface rounded-xl rounded-bl-sm px-4 py-3 text-sm
                          text-rf-text leading-relaxed inline-block max-w-[85%]">
            {preview.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                {i < preview.split("\n").length - 1 && <br />}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
