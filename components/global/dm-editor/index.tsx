"use client";

import { resolveTemplate } from "@/lib/template";
import { useState } from "react";

const DM_TEMPLATES = [
  { label: "Free guide", icon: "🎁", text: "Hey {{first_name}}! Here's the free guide you asked for → {{link}}" },
  { label: "Price inquiry", icon: "💰", text: "Hey {{first_name}}! Here are the full pricing details → {{link}}" },
  { label: "Booking call", icon: "📅", text: "Hey {{first_name}}! Grab your spot here → {{link}}" },
  { label: "Discount code", icon: "🔥", text: "Hey {{first_name}}! Your exclusive discount is inside → {{link}}" },
  { label: "Course link", icon: "🎓", text: "Hey {{first_name}}! Here's the course link → {{link}}" },
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
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-slate-950 dark:text-white">Private message</span>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
            This message is sent privately after the user comments.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowTemplates((show) => !show)}
          className="text-xs font-semibold text-rf-blue hover:underline"
        >
          {showTemplates ? "Hide templates" : "⚡ Use a template"}
        </button>
      </div>

      {showTemplates && (
        <div className="flex flex-wrap gap-2">
          {DM_TEMPLATES.map((template) => (
            <button
              key={template.label}
              type="button"
              onClick={() => {
                onChange(template.text);
                setShowTemplates(false);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:border-rf-blue/40 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08] dark:hover:text-white"
            >
              {template.icon} {template.label}
            </button>
          ))}
        </div>
      )}

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Hey {{first_name}}! Here's what you asked for → {{link}}"
        rows={4}
        dir="auto"
        className="ap3k-textarea w-full resize-none rounded-xl px-4 py-3.5 text-sm"
      />

      <div className="flex flex-wrap gap-2">
        {VARS.map((variable) => (
          <button
            key={variable}
            type="button"
            onClick={() => insertVar(variable)}
            className="rounded-md border border-rf-purple/25 bg-rf-purple/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-rf-purple transition-colors hover:bg-rf-purple/20"
          >
            {variable}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Button link</p>
          <span className="text-[10px] text-slate-500">optional</span>
        </div>
        <input
          type="text"
          value={ctaButtonTitle}
          onChange={(event) => onCtaButtonTitleChange(event.target.value)}
          placeholder='Button text — e.g. "Get the guide"'
          className="ap3k-input rounded-xl px-4 py-3 text-sm"
        />
        <input
          type="url"
          value={ctaLink}
          onChange={(event) => onCtaLinkChange(event.target.value)}
          placeholder="Button destination URL — e.g. https://yoursite.com/guide"
          className="ap3k-input rounded-xl px-4 py-3 text-sm"
        />
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-300">
          AP3k sends this as an Instagram web button when supported. The raw link is kept hidden from the message bubble.
        </p>
      </div>

      {value && (
        <div className="rounded-2xl border border-rf-blue/20 bg-rf-blue/5 p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Preview
          </p>
          <div className="flex max-w-[85%] flex-col items-start gap-2">
            <div
              dir="auto"
              className="whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-950 shadow-sm dark:border-white/10 dark:bg-[#101827] dark:text-slate-50"
            >
              {preview.split("\n").map((line, index, lines) => (
                <span key={index}>
                  {line}
                  {index < lines.length - 1 && <br />}
                </span>
              ))}
            </div>
            {hasCta && (
              <div className="flex w-full items-center justify-center rounded-xl border border-rf-blue/30 bg-rf-blue/15 px-4 py-2.5 text-xs font-bold text-rf-blue">
                {ctaButtonTitle || "Open link"}
              </div>
            )}
          </div>
          {hasCta && ctaLink && (
            <p className="mt-2 truncate text-[10px] text-slate-500 dark:text-slate-400">
              Button destination saved privately: {ctaLink.replace(/^https?:\/\//, "")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
