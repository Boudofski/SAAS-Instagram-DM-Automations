import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Deletion Instructions — AP3k",
  description:
    "How to delete your AP3k account data, Instagram integration, campaigns, and message logs.",
};

export default function DataDeletionPage() {
  return (
    <div className="relative min-h-screen overflow-hidden text-rf-text">
      <div className="pointer-events-none absolute inset-0 bg-ap3k-radial opacity-80" />
      <WebsiteNav current="data-deletion" />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-16 sm:px-8">
        <p className="ap3k-kicker">Legal</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Data Deletion Instructions
        </h1>
        <p className="mt-4 text-sm leading-7 text-rf-muted">
          You have the right to request deletion of your AP3k account data. This
          page explains how. No login is required to submit a deletion request.
        </p>

        {/* Self-service option */}
        <div className="mt-10 ap3k-card rounded-2xl p-6">
          <h2 className="text-lg font-black">Option 1 — Self-service inside AP3k</h2>
          <p className="mt-3 text-sm leading-7 text-rf-muted">
            If you have access to your AP3k account, you can immediately remove
            your Instagram integration and its associated access token:
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-7 text-rf-muted">
            <li>Sign in to AP3k and open your Dashboard.</li>
            <li>
              Go to <strong className="text-rf-text">Integrations</strong>.
            </li>
            <li>
              Click <strong className="text-rf-text">Disconnect account</strong>.
            </li>
          </ol>
          <p className="mt-4 text-sm leading-7 text-rf-muted">
            Disconnecting removes your stored Page access token and unlinks your
            Instagram Business account from AP3k immediately.
          </p>
        </div>

        {/* Email request */}
        <div className="mt-4 ap3k-card rounded-2xl p-6">
          <h2 className="text-lg font-black">Option 2 — Email deletion request</h2>
          <p className="mt-3 text-sm leading-7 text-rf-muted">
            To request full deletion of all stored data associated with your
            account, send an email to:
          </p>
          <p className="mt-4">
            <a
              href="mailto:officialabde@gmail.com"
              className="font-bold text-rf-pink hover:underline text-sm"
            >
              officialabde@gmail.com
            </a>
          </p>
          <div className="mt-5 space-y-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            <p className="font-black text-rf-text">Required email format</p>
            <p className="text-rf-muted">
              <span className="font-bold text-rf-text">Subject:</span>{" "}
              AP3k Data Deletion Request
            </p>
            <p className="text-rf-muted">
              <span className="font-bold text-rf-text">Include:</span>
            </p>
            <ul className="list-disc space-y-1 pl-5 text-rf-muted">
              <li>The email address associated with your AP3k account</li>
              <li>The connected Instagram username (e.g. @yourhandle)</li>
            </ul>
          </div>
        </div>

        {/* What gets deleted */}
        <div className="mt-4 ap3k-card rounded-2xl p-6">
          <h2 className="text-lg font-black">What AP3k will delete</h2>
          <p className="mt-3 text-sm leading-7 text-rf-muted">
            Upon a verified deletion request, AP3k will delete or anonymize,
            where legally and technically possible:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-rf-muted">
            <li>Your AP3k user account and profile data</li>
            <li>
              Your Instagram integration record, including stored Page access
              tokens and linked account identifiers
            </li>
            <li>Automation campaigns, keywords, listeners, and settings</li>
            <li>Webhook diagnostic events and processing logs</li>
            <li>Lead records and message delivery logs</li>
            <li>Subscription metadata where permitted by payment records law</li>
          </ul>
        </div>

        {/* Retained records */}
        <div className="mt-4 ap3k-card rounded-2xl p-6">
          <h2 className="text-lg font-black">Records that may be retained</h2>
          <p className="mt-3 text-sm leading-7 text-rf-muted">
            AP3k may retain minimal records where required or permitted by law
            for the following purposes:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-rf-muted">
            <li>Security incident investigation and abuse prevention</li>
            <li>Legal compliance obligations</li>
            <li>Payment and billing records required by financial regulations</li>
          </ul>
          <p className="mt-4 text-sm leading-7 text-rf-muted">
            Any retained data is held for the minimum period required and is not
            used for any other purpose.
          </p>
        </div>

        {/* Timeline */}
        <div className="mt-4 ap3k-card rounded-2xl p-6">
          <h2 className="text-lg font-black">Processing time</h2>
          <p className="mt-3 text-sm leading-7 text-rf-muted">
            Deletion requests are processed within a reasonable timeframe after
            identity verification. You will receive a confirmation email once
            deletion is complete.
          </p>
        </div>

        {/* Contact */}
        <div className="mt-8 rounded-2xl border border-rf-pink/20 bg-ap3k-gradient-soft p-6">
          <h2 className="text-lg font-black">Questions</h2>
          <p className="mt-3 text-sm leading-7 text-rf-muted">
            For questions about your data or this process, contact{" "}
            <a
              href="mailto:officialabde@gmail.com"
              className="font-bold text-rf-pink hover:underline"
            >
              officialabde@gmail.com
            </a>
            .
          </p>
        </div>
      </main>
      <WebsiteFooter />
    </div>
  );
}
