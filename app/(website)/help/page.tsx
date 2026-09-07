import WebsiteFooter from "@/components/global/website-footer";
import WebsiteNav from "@/components/global/website-nav";
import HelpCenter from "@/components/help/help-center";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AP3K Help Center",
  description: "Learn how to connect Instagram, build AP3K automations, use AP3K AI, manage Inbox, billing, privacy, and account settings.",
  alternates: { canonical: "/help" },
};

export default function HelpPage() {
  return <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#050816] dark:text-white"><WebsiteNav /><main className="relative overflow-hidden px-4 py-14 sm:px-8 sm:py-20"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.18),transparent_34rem)]" /><div className="relative"><HelpCenter /></div></main><WebsiteFooter /></div>;
}
