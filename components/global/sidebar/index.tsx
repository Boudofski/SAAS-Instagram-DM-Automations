"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePath } from "@/hooks/user-nav";
import SubscriptionPlan from "../subscription-plan";

const NAV = [
  { icon: "⚡", label: "Home",         segment: "" },
  { icon: "📣", label: "Campaigns",    segment: "automation" },
  { icon: "🔗", label: "Integrations", segment: "integrations" },
  { icon: "⚙️", label: "Settings",    segment: "settings" },
] as const;

type Props = { slug: string };

export default function Sidebar({ slug }: Props) {
  const { page } = usePath();

  return (
    <aside className="w-[220px] fixed left-0 top-0 bottom-0 bg-rf-surface border-r border-rf-border
                      hidden lg:flex flex-col py-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-rf-border">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rf-blue to-rf-purple
                        flex items-center justify-center text-white text-xs font-black flex-shrink-0">
          RF
        </div>
        <span className="font-bold text-rf-text text-sm">ReplyFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map((item) => {
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
                  ? "bg-rf-blue/10 text-rf-text border border-rf-blue/20"
                  : "text-rf-muted hover:text-rf-text hover:bg-white/5"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade card — Free tier only */}
      <SubscriptionPlan type="FREE">
        <div className="px-3 pb-4">
          <div className="bg-gradient-to-br from-rf-blue/12 to-rf-purple/12 border border-rf-blue/20
                          rounded-xl p-4">
            <p className="text-xs font-bold text-rf-text mb-1">Upgrade to Creator</p>
            <p className="text-[11px] text-rf-muted mb-3 leading-snug">
              Unlock AI replies &amp; unlimited campaigns
            </p>
            <Link
              href="/payment"
              className="block text-center bg-rf-blue hover:bg-rf-blue/90 text-white
                         text-xs font-bold py-2 rounded-lg transition-colors"
            >
              Upgrade — $29/mo
            </Link>
          </div>
        </div>
      </SubscriptionPlan>
    </aside>
  );
}
