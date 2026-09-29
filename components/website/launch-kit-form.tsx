"use client";
import { useState } from "react";
import Link from "next/link";
import { CONSENT_TEXT, LAUNCH_KIT_PATH } from "@/lib/marketing/content";

export default function LaunchKitForm({ source = "launch-kit" }: { source?: "launch-kit" | "templates" | "resources" | "guide" }) {
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    const form = new FormData(event.currentTarget);
    setState("sending"); setMessage("");
    try {
      const response = await fetch("/api/marketing/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), audience: form.get("audience"), consent: form.get("consent") === "on", website: form.get("website"), source }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Please try again later.");
      setMessage(result.message); setState("success");
      // Fixed event vocabulary only; never expose email, input values, or tokens.
      try { if (window.localStorage.getItem("ap3k_tracking_consent_v1") === "accepted") window.dispatchEvent(new CustomEvent("ap3k:launch-kit-requested", { detail: { source } })); } catch { /* Storage restrictions must not turn a successful request into an error. */ }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again later."); setState("error"); }
  }
  return <section aria-labelledby={`launch-kit-${source}`} className="my-10 rounded-3xl border border-violet-200 bg-white p-6 text-slate-950 shadow-sm dark:border-violet-400/25 dark:bg-slate-900 dark:text-white sm:p-8">
    <p className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">Free launch kit · 3 emails</p>
    <h2 id={`launch-kit-${source}`} className="mt-3 text-2xl font-black tracking-tight">Launch one working comment-to-DM campaign.</h2>
    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">Get matching caption and DM templates, a real-account test checklist, and two follow-up lessons. The full kit is also available without an email address.</p>
    {state === "success" ? <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{message}</p> : <form onSubmit={submit} className="mt-5 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold" htmlFor={`kit-email-${source}`}>Email address<input id={`kit-email-${source}`} name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 placeholder:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 dark:border-slate-600 dark:bg-slate-950 dark:text-white" /></label>
        <label className="text-sm font-semibold" htmlFor={`kit-audience-${source}`}>I want to use it for<select id={`kit-audience-${source}`} name="audience" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-600 dark:border-slate-600 dark:bg-slate-950 dark:text-white"><option value="creator">My creator business</option><option value="ecommerce">My ecommerce store</option></select></label>
      </div>
      <div aria-hidden="true" className="hidden"><label>Leave empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300"><input type="checkbox" name="consent" required className="mt-1 h-5 w-5 shrink-0 accent-violet-700" /><span>{CONSENT_TEXT} <Link href="/privacy" className="underline underline-offset-2">Privacy policy</Link>.</span></label>
      {state === "error" ? <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-300">{message}</p> : null}
      <button disabled={state === "sending"} type="submit" className="min-h-12 rounded-xl bg-violet-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-60">{state === "sending" ? "Requesting…" : "Email me the launch kit"}</button>
    </form>}
    <Link href={LAUNCH_KIT_PATH} className="mt-5 inline-block text-sm font-semibold text-violet-700 underline underline-offset-4 dark:text-violet-300">Read the kit now — no email required →</Link>
  </section>;
}
