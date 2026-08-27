import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — AP3K",
  description: "How AP3K handles Instagram account, campaign, Comment reply, DM, lead, activity, and billing data.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "Instagram Data We Collect",
    body: "AP3K collects account and profile information only after you authorize an Instagram Business or Creator account. This may include the Instagram account ID, username, profile information made available by the Instagram API, media identifiers used for campaigns, comment identifiers used to match campaign triggers, and connection status.",
  },
  {
    title: "Product Data We Store",
    body: "AP3K stores campaign settings, keywords, selected post or media identifiers, Comment reply configuration, DM configuration, CTA links, lead records, activity and delivery records, account information, and subscription data needed to operate the service.",
  },
  {
    title: "How We Use Instagram Data",
    body: "AP3K uses Instagram data only to provide comment automation, the Comment replies and DMs you configure, campaign analytics, lead tracking, account management, and related product features requested by the account owner.",
  },
  {
    title: "What We Do Not Do",
    body: "AP3K does not sell Instagram data, scrape Instagram, request your Instagram password, or use browser bots to imitate user activity. Connections are authorized through supported Instagram API flows for professional accounts.",
  },
  {
    title: "Disconnect And Delete",
    body: "You can disconnect Instagram from AP3K or request deletion of your AP3K account data, campaigns, leads, Comment reply and DM delivery records, and activity records. Self-service account deletion is also available from Settings.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-rf-text">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_0%,rgba(249,115,22,0.10),transparent_28rem),radial-gradient(circle_at_78%_8%,rgba(236,72,153,0.14),transparent_30rem),radial-gradient(circle_at_52%_42%,rgba(139,92,246,0.10),transparent_32rem)] dark:bg-ap3k-radial" />
      <WebsiteNav current="privacy" />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-16 sm:px-8">
        <div className="rounded-[2rem] border border-white/70 bg-white/60 p-6 shadow-sm backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.03] sm:p-8">
          <p className="ap3k-kicker">Legal</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">Privacy Policy</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-rf-muted">
            Last updated: August 27, 2026. This policy explains how AP3K handles data used for Instagram comment automation, Comment replies, DMs, analytics, and account management.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/[0.10] dark:bg-[#111827] dark:shadow-ap3k-card">
              <h2 className="text-lg font-black text-slate-950 dark:text-white">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-rf-muted">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-rf-pink/25 bg-gradient-to-br from-pink-50 via-white to-indigo-50 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-rf-pink/20 dark:bg-ap3k-gradient-soft dark:from-transparent dark:via-transparent dark:to-transparent">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Contact</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-rf-muted">
            For privacy questions or data requests, contact{" "}
            <a href="mailto:support@ap3k.com" className="font-bold text-rf-pink hover:underline">support@ap3k.com</a>.
          </p>
        </div>
      </main>
      <WebsiteFooter />
    </div>
  );
}
