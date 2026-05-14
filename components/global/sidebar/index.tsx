"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePath } from "@/hooks/user-nav";
import SubscriptionPlan from "../subscription-plan";
import AP3kLogo from "../ap3k-logo";
import { Home, Link2, Megaphone, Settings } from "lucide-react";

const NAV = [
  { icon: Home, label: "Home",         segment: "" },
  { icon: Megaphone, label: "Campaigns",    segment: "automation" },
  { icon: Link2, label: "Integrations", segment: "integrations" },
  { icon: Settings, label: "Settings",    segment: "settings" },
] as const;

type Props = { slug: string };

export default function Sidebar({ slug }: Props) {
  const { page } = usePath();

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-40 hidden w-[236px] flex-col border-r border-white/10
                      bg-rf-bg/76 py-0 shadow-[18px_0_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl lg:flex">
      {/* Logo */}
      <div className="border-b border-white/10 px-5 py-5">
        <AP3kLogo className="text-sm" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const href = `/dashboard/${slug}${item.segment ? `/${item.segment}` : ""}`;
          const isActive =
            item.segment === ""
              ? page === slug || page === ""
              : page === item.segment;
          return (
            <Link
              key={item.segment}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "border border-rf-pink/25 bg-ap3k-gradient-soft text-rf-text shadow-[0_10px_30px_rgba(221,42,123,0.12)]"
                  : "text-rf-muted hover:text-rf-text hover:bg-white/5"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade card — Free tier only */}
      <SubscriptionPlan type="FREE">
          <div className="px-3 pb-4">
          <div className="relative overflow-hidden rounded-2xl border border-rf-pink/20 bg-ap3k-gradient-soft p-4 shadow-ap3k-card">
            <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-rf-pink/20 blur-2xl" />
            <p className="relative text-xs font-black text-rf-text mb-1">Upgrade to Creator</p>
            <p className="text-[11px] text-rf-muted mb-3 leading-snug">
              Unlock AI replies &amp; unlimited campaigns
            </p>
            <Link
              href="/payment"
              className="ap3k-gradient-button block py-2 text-center text-xs"
            >
              Upgrade — $29/mo
            </Link>
          </div>
        </div>
      </SubscriptionPlan>
    </aside>
  );
}
