"use client";

import { Check, Copy, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ReferralShareCard({ inviteUrl }: { inviteUrl: string }) {
  const [copied, setCopied] = useState(false);
  const shareText = "Connect Instagram to AP3K and get 500 automated actions every month for free.";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
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
    <div className="rounded-2xl border border-white/20 bg-white/10 p-3.5 backdrop-blur-sm sm:p-4">
      <label htmlFor="referral-link" className="text-xs font-black uppercase tracking-[0.12em] text-white/70">
        Your referral link
      </label>
      <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <input
          id="referral-link"
          readOnly
          value={inviteUrl}
          onFocus={(event) => event.currentTarget.select()}
          className="h-11 min-w-0 rounded-xl border border-white/20 bg-[#0b1020]/35 px-3 text-xs font-bold text-white outline-none selection:bg-pink-400 focus:border-white/40"
        />
        <button type="button" onClick={copyLink} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-[#5b21b6] transition-all hover:-translate-y-0.5 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy link"}
        </button>
        <button type="button" onClick={shareLink} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-black text-white transition-all hover:-translate-y-0.5 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          <Send className="h-4 w-4" /> Share
        </button>
      </div>
    </div>
  );
}
