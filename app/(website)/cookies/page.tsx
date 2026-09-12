import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — AP3K",
  description: "How AP3K uses necessary storage and optional analytics and marketing technologies.",
  alternates: { canonical: "/cookies" },
};

const sections = [
  ["Necessary storage", "AP3K uses essential browser storage and cookies for authentication, security, preferences, and core product functions. These cannot be disabled through the optional tracking control."],
  ["Analytics", "If you accept analytics, AP3K may use Vercel Web Analytics, Vercel Speed Insights, and Google Analytics to understand visits, performance, and product usage."],
  ["Marketing", "If configured and accepted, AP3K may use Google Ads and Meta Pixel to measure campaigns and conversions."],
  ["Your choice", "Optional tools do not load until you select Accept analytics. Choose Necessary only to reject them. You can withdraw or change your choice at any time through Cookie preferences in the footer."],
] as const;

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-white">
      <WebsiteNav />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
        <p className="ap3k-kicker">Legal</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Cookie Policy</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">Last updated: September 12, 2026.</p>
        <div className="mt-8 space-y-4">
          {sections.map(([title, body]) => (
            <section key={title} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-[#111827]">
              <h2 className="text-lg font-black">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{body}</p>
            </section>
          ))}
        </div>
      </main>
      <WebsiteFooter />
    </div>
  );
}
