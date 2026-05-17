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
        <div>
          <span className="text-sm font-semibold text-slate-950">Private message</span>
          <p className="mt-1 text-xs text-slate-500">
            This message is sent privately after the user comments.
          </p>
        </div>
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
                         bg-white border border-slate-200 hover:border-rf-blue/40
                         text-slate-600 hover:text-slate-950 transition-all"
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
        dir="auto"
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm
                   leading-relaxed text-slate-950 outline-none transition-colors
                   placeholder:text-slate-400 selection:bg-rf-blue selection:text-white
                   focus:border-pink-300 focus:ring-2 focus:ring-pink-100 disabled:bg-slate-100 disabled:text-slate-500"
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
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">CTA</p>
          <span className="text-[10px] text-slate-500">optional</span>
        </div>
        <input
          type="text"
          value={ctaButtonTitle}
          onChange={(e) => onCtaButtonTitleChange(e.target.value)}
          placeholder='CTA label — e.g. "Get the guide"'
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm
                     text-slate-950 placeholder:text-slate-400 outline-none transition-colors
                     selection:bg-rf-blue selection:text-white focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
        />
        <input
          type="url"
          value={ctaLink}
          onChange={(e) => onCtaLinkChange(e.target.value)}
          placeholder="CTA URL — e.g. https://yoursite.com/guide"
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm
                     text-slate-950 placeholder:text-slate-400 outline-none transition-colors
                     selection:bg-rf-blue selection:text-white focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
        />
        <p className="text-[11px] text-slate-500 leading-relaxed">
          If buttons are not supported by Meta in this context, AP3k appends the link to the
          message text.
        </p>
      </div>

      {/* Live preview */}
      {value && (
        <div className="rounded-2xl border border-rf-blue/20 bg-rf-blue/5 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            Preview
          </p>
          <div className="flex flex-col items-start gap-2 max-w-[85%]">
            <div
              dir="auto"
              className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3
                         text-sm leading-relaxed text-slate-950 shadow-sm whitespace-pre-wrap"
            >
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
