"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { useI18n } from "@/providers/i18n-provider";
import { stripLocaleFromPath } from "@/lib/i18n/config";

/** Mounted only after analytics consent. Never collect message text, account IDs or URLs. */
export default function ConversionTracking() {
  const { locale } = useI18n();
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest("a[href]");
      if (!link) return;
      let target: URL;
      try { target = new URL(link.getAttribute("href")!, window.location.origin); }
      catch { return; }
      if (target.origin !== window.location.origin) return;
      const path = stripLocaleFromPath(target.pathname);
      const name = path === "/sign-up" ? "signup_cta_clicked" : path === "/payment" ? "checkout_cta_clicked" : null;
      if (!name) return;
      const plan = target.searchParams.get("plan");
      const interval = target.searchParams.get("interval");
      const properties = {
        locale,
        ...(plan === "pro" || plan === "business" ? { plan } : {}),
        ...(interval === "month" || interval === "year" ? { interval } : {}),
      };
      // Instrumentation must never prevent navigation or checkout.
      try {
        track(name, properties);
        const analytics = window as Window & { gtag?: (...args: unknown[]) => void };
        analytics.gtag?.("event", name, properties);
      } catch { /* Optional analytics cannot block the product. */ }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [locale]);
  return null;
}
