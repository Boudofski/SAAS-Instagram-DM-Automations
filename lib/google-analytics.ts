import { stripLocaleFromPath } from "@/lib/i18n/config";

// Public AP3K production stream identifier, not a credential.
export const AP3K_GA_ID = "G-1DKJMY5EQ0";

export function gaMeasurementId(value?: string) {
  return value && /^G-[A-Z0-9]+$/.test(value) ? value : AP3K_GA_ID;
}

export function analyticsPage(pathname: string) {
  const path = stripLocaleFromPath(pathname.split(/[?#]/)[0]);
  const privateArea = path.match(/^\/(dashboard|admin|payment|callback|sign-in|sign-up|onboarding|api)(?:\/|$)/)?.[1];
  return {
    path: privateArea ? `/${privateArea}` : pathname.split(/[?#]/)[0],
    privateArea,
    group: privateArea || (path === "/" ? "home" : path.split("/")[1]),
  };
}

export function analyticsReferrer(value: string) {
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return "";
    // External referrer paths can contain search terms or personal information.
    return url.origin === "https://ap3k.com"
      ? `${url.origin}${analyticsPage(url.pathname).path}`
      : url.origin;
  } catch { return ""; }
}

export type GoogleWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

/** Call only within the consent-gated tracking subtree. */
export function googleTag(win: GoogleWindow) {
  win.dataLayer = win.dataLayer || [];
  win.gtag = win.gtag || function () { win.dataLayer!.push(arguments); };
  return win.gtag;
}
