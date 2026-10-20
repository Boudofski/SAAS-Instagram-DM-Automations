"use client";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import { CONSENT_TEXT, LAUNCH_KIT_PATH } from "@/lib/marketing/content";

export default function NewsletterForm() {
  const id = useId();
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const data = new FormData(event.currentTarget);
    submitting.current = true;
    setPending(true);
    setMessage("");
    setError(false);
    try {
      const response = await fetch("/api/marketing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          audience: data.get("audience"),
          consent: data.get("consent") === "on",
          website: data.get("website"),
          source: "launch-kit",
        }),
      });
      if (!response.ok) {
        setError(true);
        setMessage(response.status === 429
          ? "Too many requests. Please try again later. You can still read the free kit."
          : "Email signup is temporarily unavailable. Please try again later, or read the free kit now.");
        return;
      }
      setComplete(true);
      setMessage("If this address is eligible, a confirmation email is on its way. Check your inbox and spam folder, then confirm to receive your kit and lessons.");
    } catch {
      setError(true);
      setMessage("We could not connect. Check your connection and try again. The free kit is still available below.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  const inputClass = "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 dark:border-white/20 dark:bg-slate-900 dark:text-white";
  return <section aria-labelledby={id + "-title"} className="my-10 rounded-3xl border border-violet-200 bg-violet-50 p-5 dark:border-violet-400/20 dark:bg-violet-400/5 sm:p-8">
    <h2 id={id + "-title"} className="text-2xl font-bold">Put your first campaign into action</h2>
    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Get the launch kit and two practical follow-up lessons by email. Free, with no account required.</p>
    {!complete && <form onSubmit={subscribe} className="mt-6 space-y-4" aria-busy={pending}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label htmlFor={id + "-email"} className="text-sm font-semibold">Email address
          <input id={id + "-email"} name="email" type="email" autoComplete="email" maxLength={254} required disabled={pending} placeholder="you@example.com" className={inputClass} />
        </label>
        <label htmlFor={id + "-audience"} className="text-sm font-semibold">What are you growing?
          <select id={id + "-audience"} name="audience" required disabled={pending} className={inputClass}>
            <option value="creator">Creator or service business</option>
            <option value="ecommerce">Online store</option>
          </select>
        </label>
      </div>
      <div className="hidden" aria-hidden="true"><label>Website<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="flex items-start gap-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
        <input type="checkbox" name="consent" required disabled={pending} className="mt-1 h-4 w-4 shrink-0 accent-violet-600" />
        <span>{CONSENT_TEXT} <Link href="/privacy" className="underline underline-offset-4">Privacy policy</Link></span>
      </label>
      <button type="submit" disabled={pending} className="min-h-11 w-full rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-60 sm:w-auto">{pending ? "Sending…" : "Email me the free kit"}</button>
    </form>}
    <div aria-live="polite" aria-atomic="true" className={error ? "mt-4 text-sm leading-6 text-rose-700 dark:text-rose-300" : "mt-4 text-sm leading-6 text-slate-700 dark:text-slate-300"}>{message}</div>
    <Link href={LAUNCH_KIT_PATH + "#campaign-examples"} className="mt-4 inline-block text-sm font-semibold text-violet-700 underline underline-offset-4 dark:text-violet-300">Read the kit without subscribing</Link>
  </section>;
}
