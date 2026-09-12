"use client";

import { Check, Copy, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ReferralShareCard({ inviteUrl }: { inviteUrl: string }) {
  const [copied, setCopied] = useState(false);
  const shareText = "Join AP3K with my link and get 500 automated actions every month for free.";

  async function copyLink() {
    try {
      await copyText(inviteUrl);
      setCopied(true);
      toast.success("Referral link copied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy the link");
    }
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Try AP3K", text: shareText, url: inviteUrl });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyLink();
  }

  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Your personal invite link</p>
      <div className="mt-2 flex min-h-11 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-white/10 dark:bg-[#0b1020]">
        <span className="block min-w-0 flex-1 truncate text-xs font-bold text-slate-700 dark:text-slate-200">{inviteUrl}</span>
      </div>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <button type="button" onClick={copyLink} className="ap3k-gradient-button inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy invite link"}
        </button>
        <button type="button" onClick={shareLink} aria-label="Share referral link" className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08] sm:px-4">
          <Send className="h-4 w-4" /><span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </div>
  );
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Some mobile and privacy-restricted browsers expose the API but deny access.
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();
  if (!copied) throw new Error("COPY_FAILED");
}
