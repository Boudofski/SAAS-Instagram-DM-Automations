"use client";
import ConversionTracking from "./conversion-tracking";
import { UiText } from "@/components/i18n/localized-copy";


import LocalizedCopy from "@/components/i18n/localized-copy";
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
          <ConversionTracking />
          <SpeedInsights />
        </>
      ) : null}

      {ready && consent === null ? (
        <LocalizedCopy><div
          role="dialog"
          aria-label="Cookie preferences"
          className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-2xl border border-border bg-card/95 p-4 text-card-foreground shadow-overlay backdrop-blur-xl sm:bottom-5 sm:p-5"
        >
          <p className="text-sm font-black"><UiText>{"Your privacy, your choice"}</UiText></p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground"><UiText>{" AP3K uses necessary storage to run the site. With your permission, analytics and marketing tools help us improve AP3K and measure campaigns. Read the "}</UiText><Link href="/cookies" className="font-bold text-violet-700 dark:text-violet-300 hover:underline"><UiText>{"Cookie Policy"}</UiText></Link>.
          </p>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => choose("necessary")} className="min-h-11 rounded-xl border border-border px-4 text-xs font-black transition hover:bg-accent"><UiText>{" Necessary only "}</UiText></button>
            <button type="button" onClick={() => choose("accepted")} className="ap3k-gradient-button min-h-11 px-5 text-xs"><UiText>{"Accept analytics"}</UiText></button>
          </div>
        </div></LocalizedCopy>
      ) : null}
    </>
  );
}
