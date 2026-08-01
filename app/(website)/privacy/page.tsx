import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import { isAppReviewMode } from "@/lib/app-review-mode";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — AP3k",
  description: "How AP3k handles Instagram account, automation, lead, reply workflow, and billing data.",
};

const sections = (appReviewMode: boolean) => [
  {
    title: "Instagram Data We Collect",
    body: "AP3k collects account and profile information from Instagram only after you authorize the connection. This may include the connected Instagram account ID, username or profile identifiers made available by Meta, media identifiers needed for campaigns, comment identifiers needed to match campaign triggers, and authorization status.",
  },
  {
    title: "Product Data We Store",
    body: appReviewMode
      ? "AP3k stores automation settings, campaign keywords, selected post/media IDs, leads, public reply configuration, private reply after comment configuration, activity records, account information, and subscription data needed to operate the service."
      : "AP3k stores automation settings, campaign keywords, selected post/media IDs, webhook events, leads, message logs, public reply configuration, private reply workflow configuration, account information, and subscription data needed to operate the service.",
  },
  {
    title: "How We Use Instagram Data",
    body: appReviewMode
      ? "AP3k uses Instagram data only to provide Instagram comment automation, public comment replies when configured, private reply after comment workflows when configured, campaign analytics, lead tracking, and related account management features."
      : "AP3k uses Instagram data only to provide Instagram comment automation, public comment replies, private reply workflows when configured, campaign analytics, lead tracking, and related account management features.",
  },
  {
    title: "What We Do Not Do",
    body: appReviewMode
      ? "AP3k does not sell Instagram data. AP3k does not scrape Instagram. AP3k does not ask for Instagram passwords and uses only official Meta APIs."
      : "AP3k does not sell Instagram data. AP3k does not scrape Instagram. AP3k does not ask for Instagram passwords and does not use private Instagram APIs.",
  },
  {
    title: "Disconnect And Delete",
    body: appReviewMode
      ? "You can disconnect Instagram from AP3k or request deletion of account data, automation data, leads, reply workflow records, and activity records by contacting support@ap3k.com."
      : "You can disconnect Instagram from AP3k or request deletion of account data, automation data, leads, webhook events, and message logs by contacting support@ap3k.com.",
  },
];

export default function PrivacyPage() {
  const appReviewMode = isAppReviewMode();
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-rf-text">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_0%,rgba(249,115,22,0.10),transparent_28rem),radial-gradient(circle_at_78%_8%,rgba(236,72,153,0.14),transparent_30rem),radial-gradient(circle_at_52%_42%,rgba(139,92,246,0.10),transparent_32rem)] dark:bg-ap3k-radial" />
      <WebsiteNav current="privacy" />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-16 sm:px-8">
        <div className="rounded-[2rem] border border-white/70 bg-white/60 p-6 shadow-sm backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.03] sm:p-8">
          <p className="ap3k-kicker">Legal</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-rf-muted">
            Last updated: May 14, 2026. This policy explains how AP3k uses data
            to provide {appReviewMode ? "Instagram comment automation and private reply after comment workflows" : "Instagram comment automation and private reply workflows"}.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {sections(appReviewMode).map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-white/[0.10] dark:bg-[#111827] dark:shadow-ap3k-card"
            >
              <h2 className="text-lg font-black text-slate-950 dark:text-white">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-rf-muted">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-rf-pink/25 bg-gradient-to-br from-pink-50 via-white to-indigo-50 p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-rf-pink/20 dark:bg-ap3k-gradient-soft dark:from-transparent dark:via-transparent dark:to-transparent">
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Contact</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-rf-muted">
            For privacy questions or deletion requests, contact{" "}
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
