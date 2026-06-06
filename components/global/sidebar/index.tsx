"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePath } from "@/hooks/user-nav";
import SubscriptionPlan from "../subscription-plan";
import AP3kLogo from "../ap3k-logo";
import InstagramAvatar from "@/components/dashboard/instagram-avatar";
import { CreditCard, Home, Instagram, Megaphone, Settings } from "lucide-react";
import { useQueryUser } from "@/hooks/user-queries";
import { useClerk, useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { isAppReviewMode } from "@/lib/app-review-mode";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";

const NAV = [
  { icon: Home, label: "Home",         segment: "" },
  { icon: Megaphone, label: "Campaigns",    segment: "automation" },
  { icon: Instagram, label: "Instagram Account", segment: "account" },
  { icon: CreditCard, label: "Billing", segment: "billing" },
  { icon: Settings, label: "Settings",    segment: "settings" },
] as const;

type Props = { slug: string };

export default function Sidebar({ slug }: Props) {
  const appReviewMode = isAppReviewMode();
  const { page } = usePath();
  const { data } = useQueryUser();
  const { user } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const instagram = getCanonicalInstagramIntegration(data?.data?.integrations);
  const displayName =
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    "Signed in";
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-[260px] flex-col border-r border-slate-200 bg-white/92 py-0 text-slate-950 shadow-[18px_0_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#0b1020]/92 dark:text-slate-50 lg:flex">
      {/* Logo */}
      <div className="border-b border-slate-200 px-5 py-5 dark:border-white/10">
        <AP3kLogo className="text-sm text-slate-950 dark:text-white" />
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/[0.12] dark:bg-white/[0.06]">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            AP3k user
          </p>
          <p className="mt-2 truncate text-sm font-black text-slate-950 dark:text-white">
            {displayName}
          </p>
          {email && (
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{email}</p>
          )}
        </div>
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/[0.12] dark:bg-white/[0.06]">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Instagram account
          </p>
          <div className="mt-3 flex items-center gap-3">
            <InstagramAvatar
              src={instagram?.profilePictureUrl}
              username={instagram?.instagramUsername}
              label={instagram?.pageName}
              size="sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                {instagram?.instagramUsername
                  ? `@${instagram.instagramUsername}`
                  : "Not connected"}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {instagram ? "Official Meta connection" : "Connect to start"}
              </p>
            </div>
          </div>
        </div>
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
                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                isActive
                  ? "border border-pink-200 bg-gradient-to-r from-orange-50 via-pink-50 to-indigo-50 text-slate-950 shadow-[0_10px_30px_rgba(221,42,123,0.10)] dark:border-rf-pink/30 dark:bg-ap3k-gradient-soft dark:text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
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
          <div className="relative overflow-hidden rounded-2xl border border-pink-200 bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 p-4 dark:border-rf-pink/25 dark:bg-ap3k-gradient-soft">
            <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-rf-pink/20 blur-2xl" />
            <p className="relative mb-1 text-xs font-black text-slate-950 dark:text-white">Upgrade to Creator</p>
            <p className="mb-3 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
              {appReviewMode ? "Unlock more public replies and campaigns" : "Unlock AI replies & unlimited campaigns"}
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
      <div className="border-t border-slate-200 p-3 dark:border-white/10">
        <button
          onClick={() => {
            queryClient.clear();
            void signOut({ redirectUrl: "/" });
          }}
          className="flex w-full items-center justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
