"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePath } from "@/hooks/user-nav";
import SubscriptionPlan from "../subscription-plan";
import AP3KLogo from "../ap3k-logo";
import InstagramAvatar from "@/components/dashboard/instagram-avatar";
import { useQueryUser } from "@/hooks/user-queries";
import { useClerk, useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";
import { PRIMARY_NAVIGATION, primaryNavigationHref } from "@/constants/menu";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { useState } from "react";

type Props = { slug: string };

export default function Sidebar({ slug }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { page } = usePath();
  const { data } = useQueryUser();
  const { user } = useUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const instagram = getCanonicalInstagramIntegration(data?.data?.integrations);
  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Signed in";
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <aside className={cn(
      "peer fixed bottom-0 left-0 top-0 z-40 hidden flex-col overflow-y-auto overscroll-contain border-r border-slate-200 bg-white/95 py-0 text-slate-950 shadow-[18px_0_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition-[width] duration-300 dark:border-white/10 dark:bg-[#0b1020]/95 dark:text-slate-50 lg:flex",
      expanded ? "w-[260px]" : "w-[84px]"
    )} data-expanded={expanded ? "true" : "false"}>
      <div className={cn("border-b border-slate-200 py-5 dark:border-white/10", expanded ? "px-5" : "px-3")}>
        <div className={cn("flex items-center", expanded ? "justify-between" : "justify-center")}>
          {expanded ? <AP3KLogo className="text-sm text-slate-950 dark:text-white" /> : <AP3KLogo showText={false} markClassName="h-11 w-11 rounded-2xl" />}
        </div>
        <div className={cn("mt-5 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/[0.12] dark:bg-white/[0.06]", !expanded && "hidden")}>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">AP3K user</p>
          <p className="mt-2 truncate text-sm font-black text-slate-950 dark:text-white">{displayName}</p>
          {email && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{email}</p>}
        </div>
        <div className={cn("mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/[0.12] dark:bg-white/[0.06]", !expanded && "hidden")}>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Instagram account</p>
          <div className="mt-3 flex items-center gap-3">
            <InstagramAvatar src={instagram?.profilePictureUrl} username={instagram?.instagramUsername} label={instagram?.pageName} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                {instagram?.instagramUsername ? `@${instagram.instagramUsername}` : "Not connected"}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{instagram ? "Instagram connected" : "Connect to start"}</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {PRIMARY_NAVIGATION.map((item) => {
          const Icon = item.icon;
          const href = primaryNavigationHref(slug, item.segment);
          const isActive = item.segment === "" ? page === slug || page === "" : page === item.segment;
          return (
            <Link
              key={item.segment}
              href={href}
              title={!expanded ? item.label : undefined}
              aria-label={!expanded ? item.label : undefined}
              className={cn(
                "flex min-h-11 items-center rounded-xl text-sm font-bold transition-all duration-200",
                expanded ? "gap-2.5 px-3 py-2.5" : "justify-center px-0 py-2.5",
                isActive
                  ? "border border-pink-200 bg-gradient-to-r from-orange-50 via-pink-50 to-indigo-50 text-slate-950 shadow-[0_10px_30px_rgba(221,42,123,0.10)] dark:border-rf-pink/30 dark:bg-ap3k-gradient-soft dark:text-white"
                  : "text-slate-500 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {expanded && item.label}
            </Link>
          );
        })}
      </nav>

      {expanded && <SubscriptionPlan type="FREE">
        <div className="px-3 pb-4">
          <div className="relative overflow-hidden rounded-2xl border border-pink-200 bg-gradient-to-br from-orange-50 via-pink-50 to-indigo-50 p-4 dark:border-rf-pink/25 dark:bg-ap3k-gradient-soft">
            <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-rf-pink/20 blur-2xl" />
            <p className="relative mb-1 text-xs font-black text-slate-950 dark:text-white">Upgrade to Pro</p>
            <p className="mb-3 text-[11px] leading-snug text-slate-500 dark:text-slate-400">Get 5,000 automated replies and full automation analytics.</p>
            <Link href="/payment?plan=pro&interval=month" className="ap3k-gradient-button block py-2 text-center text-xs">Upgrade — $9/mo</Link>
          </div>
        </div>
      </SubscriptionPlan>}

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? "Collapse navigation" : "Expand navigation"}
          title={expanded ? "Collapse menu" : "Expand menu"}
          className="flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
        >
          {expanded ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
        </button>
      </div>

      <div className="border-t border-slate-200 p-3 dark:border-white/10">
        <button
          onClick={() => {
            queryClient.clear();
            void signOut({ redirectUrl: "/" });
          }}
          title={!expanded ? "Sign out" : undefined}
          aria-label={!expanded ? "Sign out" : undefined}
          className={cn("flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white", expanded ? "gap-2 px-3 py-2.5" : "px-0")}
        >
          {!expanded && <LogOut className="h-4 w-4" />}
          {expanded && "Sign out"}
        </button>
      </div>
    </aside>
  );
}
