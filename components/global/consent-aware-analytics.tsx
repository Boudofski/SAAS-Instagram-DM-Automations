"use client";

import TrackingScripts from "@/components/global/tracking-scripts";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_KEY = "ap3k_tracking_consent_v1";
type Consent = "accepted" | "necessary" | null;

export default function ConsentAwareAnalytics() {
  const [consent, setConsent] = useState<Consent>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(CONSENT_KEY);
    setConsent(saved === "accepted" || saved === "necessary" ? saved : null);
    setReady(true);
  }, []);

  function choose(next: Exclude<Consent, null>) {
    window.localStorage.setItem(CONSENT_KEY, next);
    setConsent(next);
  }

  return (
    <>
      {consent === "accepted" ? (
        <>
          <TrackingScripts />
          <Analytics />
          <SpeedInsights />
        </>
      ) : null}

      {ready && consent === null ? (
        <aside
          role="dialog"
          aria-label="Cookie preferences"
          className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-2xl border border-white/15 bg-[#111320]/95 p-4 text-white shadow-2xl backdrop-blur-xl sm:bottom-5 sm:p-5"
        >
          <p className="text-sm font-black">Your privacy, your choice</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            AP3K uses necessary storage to run the site. With your permission, analytics and marketing tools help us improve AP3K and measure campaigns. Read the <Link href="/cookies" className="font-bold text-violet-300 hover:underline">Cookie Policy</Link>.
          </p>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => choose("necessary")} className="min-h-11 rounded-xl border border-white/15 px-4 text-xs font-black transition hover:bg-white/10">
              Necessary only
            </button>
            <button type="button" onClick={() => choose("accepted")} className="ap3k-gradient-button min-h-11 px-5 text-xs">
              Accept analytics
            </button>
          </div>
        </aside>
      ) : null}
    </>
  );
}
