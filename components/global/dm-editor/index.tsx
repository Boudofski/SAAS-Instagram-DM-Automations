"use client";

import { resolveTemplate } from "@/lib/template";
import { useState } from "react";

const DM_TEMPLATES = [
  { label: "Free guide",   icon: "🎁", text: "Hey {{first_name}}! Here's the free guide you asked for → {{link}}" },
  { label: "Price inquiry",icon: "💰", text: "Hey {{first_name}}! Here are the full pricing details → {{link}}" },
  { label: "Booking call", icon: "📅", text: "Hey {{first_name}}! Grab your spot here → {{link}}" },
  { label: "Discount code",icon: "🔥", text: "Hey {{first_name}}! Your exclusive discount is inside → {{link}}" },
  { label: "Course link",  icon: "🎓", text: "Hey {{first_name}}! Here's the course link → {{link}}" },
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
  ctaButtonTitle: string;
  onChange: (value: string) => void;
  onCtaLinkChange: (link: string) => void;
  onCtaButtonTitleChange: (title: string) => void;
};

export default function DmEditor({
  value,
  ctaLink,
  ctaButtonTitle,
  onChange,
  onCtaLinkChange,
  onCtaButtonTitleChange,
}: Props) {
  const [showTemplates, setShowTemplates] = useState(false);

  const insertVar = (v: string) => onChange(value + v);
  const preview = resolveTemplate(value, PREVIEW_VARS);
  const hasCta = ctaButtonTitle.trim() || ctaLink.trim();

  return (
    <div className="flex flex-col gap-4">
      {/* Template picker header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-rf-text">DM message</span>
        <button
          type="button"
          onClick={() => setShowTemplates((s) => !s)}
          className="text-xs text-rf-blue font-semibold hover:underline"
        >
          {showTemplates ? "Hide templates" : "⚡ Use a template"}
        </button>
      </div>

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
        className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-4 py-3.5 text-sm
                   text-rf-text placeholder:text-rf-subtle outline-none focus:border-rf-blue/60
                   resize-none transition-colors leading-relaxed"
      />

      {/* Variable chips */}
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

      {/* CTA button section */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-rf-muted">CTA button</p>
          <span className="text-[10px] text-rf-subtle">optional</span>
        </div>
        <input
          type="text"
          value={ctaButtonTitle}
          onChange={(e) => onCtaButtonTitleChange(e.target.value)}
          placeholder='Button label — e.g. "Get the guide"'
          className="bg-white/[0.04] border border-white/15 rounded-xl px-4 py-3 text-sm
                     text-rf-text placeholder:text-rf-subtle outline-none focus:border-rf-blue/60
                     transition-colors"
        />
        <input
          type="url"
          value={ctaLink}
          onChange={(e) => onCtaLinkChange(e.target.value)}
          placeholder="Button URL — e.g. https://yoursite.com/guide"
          className="bg-white/[0.04] border border-white/15 rounded-xl px-4 py-3 text-sm
                     text-rf-text placeholder:text-rf-subtle outline-none focus:border-rf-blue/60
                     transition-colors"
        />
        <p className="text-[11px] text-rf-subtle leading-relaxed">
          Instagram doesn&apos;t support button templates in all DM contexts. AP3k appends the link
          to your message text so the recipient always receives it. The button below shows how it
          looks when the API supports it.
        </p>
      </div>

      {/* Live preview */}
      {value && (
        <div className="rounded-2xl border border-rf-blue/20 bg-rf-blue/5 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-rf-muted mb-3">
            Preview
          </p>
          <div className="flex flex-col items-start gap-2 max-w-[85%]">
            <div className="bg-white/[0.07] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3
                            text-sm text-rf-text leading-relaxed">
              {preview.split("\n").map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </div>
            {hasCta && (
              <div className="w-full rounded-xl border border-rf-blue/30 bg-rf-blue/15 px-4 py-2.5
                              flex items-center justify-center gap-2 text-xs font-bold text-rf-blue">
                <span>{ctaButtonTitle || "Open link"}</span>
                {ctaLink && (
                  <span className="opacity-50 font-normal text-[10px] truncate max-w-[140px]">
                    {ctaLink.replace(/^https?:\/\//, "")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
