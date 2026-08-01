import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion Instructions — AP3k",
  description:
    "How to delete your AP3k account data, Instagram account connection, campaigns, and message logs.",
};

const cardClass =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/[0.10] dark:bg-[#111827] dark:shadow-ap3k-card";
const mutedClass = "text-sm leading-7 text-slate-600 dark:text-rf-muted";
const strongClass = "font-bold text-slate-950 dark:text-white";

export default function DataDeletionPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-rf-text">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_0%,rgba(249,115,22,0.10),transparent_28rem),radial-gradient(circle_at_78%_8%,rgba(236,72,153,0.14),transparent_30rem),radial-gradient(circle_at_52%_42%,rgba(139,92,246,0.10),transparent_32rem)] dark:bg-ap3k-radial" />
      <WebsiteNav current="data-deletion" />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-16 sm:px-8">
        <div className="rounded-[2rem] border border-white/70 bg-white/60 p-6 shadow-sm backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.03] sm:p-8">
          <p className="ap3k-kicker">Legal</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Data Deletion Instructions
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-rf-muted">
            You can request deletion of your AP3k account data at any time. This
            page explains the self-service option and the email request process.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <section className={cardClass}>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">Option 1 — Self-service inside AP3k</h2>
            <p className={`mt-3 ${mutedClass}`}>
              If you have access to your AP3k account, you can immediately remove
              your Instagram account connection and its associated access token:
            </p>
            <ol className={`mt-4 list-decimal space-y-2 pl-5 ${mutedClass}`}>
              <li>Sign in to AP3k and open your Dashboard.</li>
              <li>
                Go to <strong className={strongClass}>Instagram Account</strong>.
              </li>
              <li>
                Click <strong className={strongClass}>Remove connection</strong>.
              </li>
            </ol>
            <p className={`mt-4 ${mutedClass}`}>
              Disconnecting removes your stored Page access token and unlinks your
              Instagram Business or Creator account from AP3k.
            </p>
          </section>

          <section className={cardClass}>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">Option 2 — Email deletion request</h2>
            <p className={`mt-3 ${mutedClass}`}>
              To request full deletion of stored data associated with your account,
              send an email to:
            </p>
            <p className="mt-4">
              <a
                href="mailto:support@ap3k.com"
                className="text-sm font-bold text-rf-pink hover:underline"
              >
                support@ap3k.com
              </a>
            </p>
            <div className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-white/10 dark:bg-white/[0.04]">
              <p className="font-black text-slate-950 dark:text-white">Required email format</p>
              <p className="text-slate-600 dark:text-rf-muted">
                <span className={strongClass}>Subject:</span>{" "}
                AP3k Data Deletion Request
              </p>
              <p className="text-slate-600 dark:text-rf-muted">
                <span className={strongClass}>Include:</span>
              </p>
              <ul className="list-disc space-y-1 pl-5 text-slate-600 dark:text-rf-muted">
                <li>The email address associated with your AP3k account</li>
                <li>The connected Instagram username, such as @yourhandle</li>
              </ul>
            </div>
          </section>

          <section className={cardClass}>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">What AP3k will delete</h2>
            <p className={`mt-3 ${mutedClass}`}>
              Upon a verified deletion request, AP3k will delete or anonymize,
              where legally and technically possible:
            </p>
            <ul className={`mt-4 list-disc space-y-2 pl-5 ${mutedClass}`}>
              <li>Your AP3k user account and profile data</li>
              <li>Your Instagram account connection record, including stored Page access tokens and linked account identifiers</li>
              <li>Campaigns, keywords, listeners, and settings</li>
              <li>Webhook diagnostic events and processing logs</li>
              <li>Lead records and message delivery logs</li>
              <li>Subscription metadata where permitted by payment records law</li>
            </ul>
          </section>

          <section className={cardClass}>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">Records that may be retained</h2>
            <p className={`mt-3 ${mutedClass}`}>
              AP3k may retain minimal records where required or permitted by law
              for security, abuse prevention, legal compliance, or payment records.
              Retained data is held for the minimum period required and is not used
              for any other purpose.
            </p>
          </section>

          <section className={cardClass}>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">Processing time</h2>
            <p className={`mt-3 ${mutedClass}`}>
              Deletion requests are processed within a reasonable timeframe after
              identity verification. You will receive a confirmation email once
              deletion is complete.
            </p>
          </section>
        </div>

        <div className="mt-8 rounded-2xl border border-rf-pink/25 bg-gradient-to-br from-pink-50 via-white to-indigo-50 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-rf-pink/20 dark:bg-ap3k-gradient-soft dark:from-transparent dark:via-transparent dark:to-transparent">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Questions</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-rf-muted">
            For questions about your data or this process, contact{" "}
            <a href="mailto:support@ap3k.com" className="font-bold text-rf-pink hover:underline">
              support@ap3k.com
            </a>.
          </p>
        </div>
      </main>
      <WebsiteFooter />
    </div>
  );
}
