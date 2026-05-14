import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — AP3k",
  description: "Terms for using AP3k Instagram comment-to-DM automation.",
};

const sections = [
  {
    title: "Authorized Accounts Only",
    body: "You must use Instagram Business or Creator accounts that you own or are authorized to manage. You are responsible for maintaining the permissions and access needed to operate your connected accounts.",
  },
  {
    title: "Acceptable Use",
    body: "You may not use AP3k for spam, scraping, fake engagement, unsolicited mass messaging, illegal activity, platform policy abuse, or any use that violates Meta, Instagram, or applicable laws.",
  },
  {
    title: "Interaction-Based Automation",
    body: "AP3k only automates replies to users who interact with connected accounts, such as by commenting on selected posts or sending messages. AP3k is not a tool for messaging arbitrary Instagram users.",
  },
  {
    title: "Your Content And Compliance",
    body: "You are responsible for the message content, keywords, links, public replies, offers, claims, and compliance obligations in your automations.",
  },
  {
    title: "Abuse And Suspension",
    body: "AP3k may suspend or terminate accounts that abuse the service, harm users, violate platform rules, or create legal, security, or deliverability risk.",
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
          Last updated: May 14, 2026. These terms apply to your use of AP3k.
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
