import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — AP3k",
  description: "How AP3k handles Instagram account, automation, lead, and billing data.",
};

const sections = [
  {
    title: "Instagram Data We Collect",
    body: "AP3k collects account and profile information from Instagram only after you authorize the connection. This may include the connected Instagram account ID, username or profile identifiers made available by Meta, media identifiers needed for automations, and authorization status.",
  },
  {
    title: "Product Data We Store",
    body: "AP3k stores automation settings, campaign keywords, selected post/media IDs, webhook events, leads, message logs, public reply configuration, account information, and subscription data needed to operate the service.",
  },
  {
    title: "How We Use Instagram Data",
    body: "AP3k uses Instagram data only to provide comment-to-DM automation, public comment replies when configured, campaign analytics, lead tracking, and related account management features.",
  },
  {
    title: "What We Do Not Do",
    body: "AP3k does not sell Instagram data. AP3k does not scrape Instagram. AP3k does not ask for Instagram passwords and does not use private Instagram APIs.",
  },
  {
    title: "Disconnect And Delete",
    body: "You can disconnect Instagram from AP3k or request deletion of account data, automation data, leads, webhook events, and message logs by contacting support@ap3k.com.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden text-rf-text">
      <div className="pointer-events-none absolute inset-0 bg-ap3k-radial opacity-80" />
      <WebsiteNav current="privacy" />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-16 sm:px-8">
        <p className="ap3k-kicker">Legal</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm leading-7 text-rf-muted">
          Last updated: May 14, 2026. This policy explains how AP3k uses data
          to provide Instagram comment-to-DM automation.
        </p>

        <div className="mt-10 space-y-4">
          {sections.map((section) => (
            <section key={section.title} className="ap3k-card rounded-2xl p-6">
              <h2 className="text-lg font-black">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-rf-muted">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-rf-pink/20 bg-ap3k-gradient-soft p-6">
          <h2 className="text-lg font-black">Contact</h2>
          <p className="mt-3 text-sm leading-7 text-rf-muted">
            For privacy questions or deletion requests, contact{" "}
            <a href="mailto:support@ap3k.com" className="font-bold text-rf-pink">
              support@ap3k.com
            </a>.
          </p>
        </div>
      </main>
      <WebsiteFooter />
    </div>
  );
}
