"use client";

import { Check, Copy, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ReferralShareCard({ inviteUrl }: { inviteUrl: string }) {
  const [copied, setCopied] = useState(false);
  const shareText = "Connect Instagram to AP3K and get 500 automated replies free for 14 days.";

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
    <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm sm:p-5">
      <label htmlFor="referral-link" className="text-xs font-black uppercase tracking-[0.12em] text-white/70">
        Your referral link
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="referral-link"
          readOnly
          value={inviteUrl}
          onFocus={(event) => event.currentTarget.select()}
          className="min-w-0 flex-1 rounded-xl border border-white/20 bg-[#0b1020]/35 px-4 py-3 text-sm font-bold text-white outline-none selection:bg-pink-400"
        />
        <button type="button" onClick={copyLink} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#5b21b6] transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy link"}
        </button>
        <button type="button" onClick={shareLink} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          <Send className="h-4 w-4" /> Share
        </button>
      </div>
    </div>
  );
}
