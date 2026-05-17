import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — AP3k",
  description: "Terms for using AP3k Instagram comment-to-DM automation.",
};

const sections = [
  {
    title: "What AP3k Does",
    body: "AP3k is an Instagram comment-to-DM automation tool. It monitors comments on Instagram posts you connect, matches configured keywords, sends automated public comment replies, and delivers private direct messages — using official Meta Graph APIs only.",
  },
  {
    title: "Authorized Accounts Only",
    body: "You must connect only Instagram Business or Creator accounts that you own or are duly authorized to manage. You are responsible for obtaining and maintaining all necessary permissions, roles, and access to operate your connected accounts within Meta's platform.",
  },
  {
    title: "Your Responsibility for Campaigns",
    body: "You are solely responsible for the campaigns, keywords, public replies, private messages, CTA links, offers, and claims you configure in AP3k. AP3k executes your instructions — you remain legally responsible for the content and intent of every automated message sent through your account.",
  },
  {
    title: "Official Meta APIs Only",
    body: "AP3k uses only official Meta Platform APIs. AP3k does not use private, undocumented, or unofficial Instagram APIs, does not scrape Instagram, and does not ask for or store your Instagram password.",
  },
  {
    title: "Platform Compliance",
    body: "You must comply with Meta Platform Terms, Instagram Terms of Use, Instagram Community Guidelines, and all applicable laws and regulations when using AP3k. This includes but is not limited to consumer protection, anti-spam, data protection, and marketing laws in your jurisdiction.",
  },
  {
    title: "Prohibited Uses",
    body: "You may not use AP3k for spam, unsolicited mass messaging, harassment, fake engagement, coordinated inauthentic behavior, scraping, unauthorized data collection, impersonation, illegal promotions, or any use that violates Meta's or Instagram's policies or applicable law.",
  },
  {
    title: "Suspension and Termination",
    body: "AP3k may suspend or permanently terminate accounts that abuse the service, violate these terms, harm users or third parties, violate platform rules, or create legal, security, or reputational risk. AP3k reserves the right to remove content or campaigns that violate these terms without prior notice.",
  },
  {
    title: "Service Availability and Meta API Dependency",
    body: "AP3k depends on Meta API access, permissions, app review approvals, rate limits, and Meta's platform policies. The service may change, pause, degrade, or fail as a result of Meta API limitations, permission revocations, app review outcomes, rate limiting, or technical issues beyond AP3k's control. AP3k does not guarantee uninterrupted service or delivery of any specific message.",
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
  return (
    <div className="relative min-h-screen overflow-hidden text-rf-text">
      <div className="pointer-events-none absolute inset-0 bg-ap3k-radial opacity-80" />
      <WebsiteNav current="terms" />
      <main className="relative z-10 mx-auto max-w-3xl px-4 py-16 sm:px-8">
        <p className="ap3k-kicker">Legal</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm leading-7 text-rf-muted">
          Last updated: May 17, 2026. These terms govern your use of AP3k. By
          connecting an Instagram account or creating campaigns, you agree to
          these terms.
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
            For questions about these terms, contact{" "}
            <a href="mailto:contact@ap3k.com" className="font-bold text-rf-pink hover:underline">
              contact@ap3k.com
            </a>
            .
          </p>
        </div>
      </main>
      <WebsiteFooter />
    </div>
  );
}
