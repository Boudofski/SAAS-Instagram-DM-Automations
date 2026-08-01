import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import { isAppReviewMode } from "@/lib/app-review-mode";
import type { Metadata } from "next";

export function generateMetadata(): Metadata {
  const appReviewMode = isAppReviewMode();
  return {
    title: "Terms of Service — AP3k",
    description: appReviewMode
      ? "Terms for using AP3k Instagram comment automation."
      : "Terms for using AP3k Instagram comment automation and private reply workflows.",
  };
}

const sections = (appReviewMode: boolean) => [
  {
    title: "What AP3k Does",
    body: appReviewMode
      ? "AP3k is an Instagram comment automation tool. It monitors comments on Instagram posts you connect, matches configured keywords, sends automated public comment replies, prepares private reply workflows when configured, and tracks leads using official Meta Graph APIs only."
      : "AP3k is an Instagram comment automation tool. It monitors comments on Instagram posts you connect, matches configured keywords, sends automated public comment replies, runs private reply workflows when configured, and tracks leads using official Meta Graph APIs only.",
  },
  {
    title: "Authorized Accounts Only",
    body: "You must connect only Instagram Business or Creator accounts that you own or are duly authorized to manage. You are responsible for obtaining and maintaining all necessary permissions, roles, and access to operate your connected accounts within Meta's platform.",
  },
  {
    title: "Your Responsibility for Campaigns",
    body: appReviewMode
      ? "You are solely responsible for the campaigns, keywords, public replies, private reply text, CTA links, offers, and claims you configure in AP3k. AP3k executes your instructions, and you remain legally responsible for the content and intent of every automated reply configured through your account."
      : "You are solely responsible for the campaigns, keywords, public replies, private replies, CTA links, offers, and claims you configure in AP3k. AP3k executes your instructions, and you remain legally responsible for the content and intent of every automated reply configured through your account.",
  },
  {
    title: "Official Meta APIs Only",
    body: appReviewMode
      ? "AP3k uses only official Meta Platform APIs. AP3k does not use undocumented or unofficial Instagram APIs, does not scrape Instagram, and does not ask for or store your Instagram password."
      : "AP3k uses only official Meta Platform APIs. AP3k does not use private, undocumented, or unofficial Instagram APIs, does not scrape Instagram, and does not ask for or store your Instagram password.",
  },
  {
    title: "Platform Compliance",
    body: "You must comply with Meta Platform Terms, Instagram Terms of Use, Instagram Community Guidelines, and all applicable laws and regulations when using AP3k. This includes consumer protection, anti-spam, data protection, and marketing laws in your jurisdiction.",
  },
  {
    title: "Prohibited Uses",
    body: appReviewMode
      ? "You may not use AP3k for spam, harassment, fake engagement, coordinated inauthentic behavior, scraping, unauthorized data collection, impersonation, illegal promotions, or any use that violates Meta's or Instagram's policies or applicable law."
      : "You may not use AP3k for spam, unsolicited mass messaging, harassment, fake engagement, coordinated inauthentic behavior, scraping, unauthorized data collection, impersonation, illegal promotions, or any use that violates Meta's or Instagram's policies or applicable law.",
  },
  {
    title: "Suspension and Termination",
    body: "AP3k may suspend or permanently terminate accounts that abuse the service, violate these terms, harm users or third parties, violate platform rules, or create legal, security, or reputational risk. AP3k reserves the right to remove content or campaigns that violate these terms without prior notice.",
  },
  {
    title: "Service Availability and Meta API Dependency",
    body: appReviewMode
      ? "AP3k depends on Meta API access, permissions, app review approvals, rate limits, and Meta's platform policies. The service may change, pause, degrade, or fail as a result of Meta API limitations, permission revocations, app review outcomes, rate limiting, or technical issues beyond AP3k's control. AP3k does not guarantee uninterrupted service or delivery of any specific reply."
      : "AP3k depends on Meta API access, permissions, app review approvals, rate limits, and Meta's platform policies. The service may change, pause, degrade, or fail as a result of Meta API limitations, permission revocations, app review outcomes, rate limiting, or technical issues beyond AP3k's control. AP3k does not guarantee uninterrupted service or delivery of any specific reply or message.",
  },
  {
    title: "Limitation of Liability",
    body: "To the maximum extent permitted by applicable law, AP3k and its operators are not liable for any indirect, incidental, special, consequential, or punitive damages, including loss of business, revenue, data, or goodwill, arising from your use of or inability to use AP3k, whether based on warranty, contract, tort, or any other legal theory, even if advised of the possibility of such damages.",
  },
  {
    title: "Changes to These Terms",
    body: "AP3k may update these terms at any time. Continued use of the service after changes are posted constitutes your acceptance of the revised terms. Material changes will be communicated where reasonably practicable.",
  },
];

export default function TermsPage() {
  const appReviewMode = isAppReviewMode();
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-rf-text">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_0%,rgba(249,115,22,0.10),transparent_28rem),radial-gradient(circle_at_78%_8%,rgba(236,72,153,0.14),transparent_30rem),radial-gradient(circle_at_52%_42%,rgba(139,92,246,0.10),transparent_32rem)] dark:bg-ap3k-radial" />
      <WebsiteNav current="terms" />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-16 sm:px-8">
        <div className="rounded-[2rem] border border-white/70 bg-white/60 p-6 shadow-sm backdrop-blur-xl dark:border-white/[0.08] dark:bg-white/[0.03] sm:p-8">
          <p className="ap3k-kicker">Legal</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-rf-muted">
            Last updated: May 17, 2026. These terms govern your use of AP3k. By
            connecting an Instagram account or creating campaigns, you agree to
            these terms.
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
            For questions about these terms, contact{" "}
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
