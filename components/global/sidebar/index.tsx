"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePath } from "@/hooks/user-nav";
import AP3KLogo from "../ap3k-logo";
import InstagramAvatar from "@/components/dashboard/instagram-avatar";
import HelpHub from "@/components/help/help-hub";
import { useQueryUser } from "@/hooks/user-queries";
import { useClerk } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";
import { PRIMARY_NAVIGATION, primaryNavigationHref } from "@/constants/menu";
import { planDisplayName } from "@/lib/billing-plans";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

type Props = { slug: string };

export default function Sidebar({ slug }: Props) {
  const [expanded, setExpanded] = useState(true);
  const { page } = usePath();
  const { data } = useQueryUser();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const instagram = getCanonicalInstagramIntegration(data?.data?.integrations);
  const plan = planDisplayName(data?.data?.subscription?.plan);

  useEffect(() => {
    const saved = window.localStorage.getItem("ap3k-sidebar-expanded");
    if (saved !== null) setExpanded(saved !== "false");
  }, []);

  const toggleExpanded = () => {
    setExpanded((value) => {
      window.localStorage.setItem("ap3k-sidebar-expanded", String(!value));
      return !value;
    });
  };

  return (
    <aside className={cn(
      "peer fixed bottom-0 left-0 top-0 z-40 hidden flex-col overflow-visible border-r border-slate-200 bg-white/95 py-0 text-slate-950 shadow-[18px_0_60px_rgba(15,23,42,0.08)] backdrop-blur-2xl transition-[width] duration-300 dark:border-white/10 dark:bg-[#0b1020]/95 dark:text-slate-50 lg:flex",
      expanded ? "w-[232px]" : "w-[76px]"
    )} data-expanded={expanded ? "true" : "false"}>
      <div className={cn("shrink-0 border-b border-slate-200 py-4 dark:border-white/10", expanded ? "px-4" : "px-3")}>
        <div className={cn("flex items-center", expanded ? "justify-between" : "justify-center")}>
          {expanded ? <AP3KLogo className="text-sm text-slate-950 dark:text-white" /> : <AP3KLogo showText={false} markClassName="h-11 w-11 rounded-2xl" />}
        </div>
        <Link href={`/dashboard/${slug}/account`} title={!expanded ? (instagram?.instagramUsername ? `@${instagram.instagramUsername}` : "Connect Instagram") : undefined} className={cn("mt-4 flex items-center rounded-2xl border border-slate-200 bg-slate-50 transition hover:border-violet-300 dark:border-white/[0.12] dark:bg-white/[0.06] dark:hover:border-violet-400/40", expanded ? "gap-3 p-2.5" : "justify-center border-0 bg-transparent p-0 dark:bg-transparent")}>
          <InstagramAvatar src={instagram?.profilePictureUrl} username={instagram?.instagramUsername} label={instagram?.pageName} size="sm" />
          {expanded ? <div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{instagram?.instagramUsername ? `@${instagram.instagramUsername}` : "Connect Instagram"}</p><p className="mt-0.5 truncate text-[11px] font-bold text-violet-500">{plan} plan</p></div> : null}
        </Link>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-3 py-3">
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
                "flex min-h-10 items-center rounded-xl text-sm font-bold transition-all duration-200",
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

      <div className="shrink-0 px-3 pb-1">
        <HelpHub slug={slug} expanded={expanded} />
      </div>
      <div className="shrink-0 px-3 pb-2">
        <button
          type="button"
          onClick={toggleExpanded}
          aria-label={expanded ? "Collapse navigation" : "Expand navigation"}
          title={expanded ? "Collapse menu" : "Expand menu"}
          className={cn("flex min-h-10 w-full items-center rounded-xl text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white", expanded ? "gap-2.5 px-3" : "justify-center")}
        >
          {expanded ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
          {expanded ? "Collapse" : null}
        </button>
      </div>

      <div className="shrink-0 border-t border-slate-200 p-3 dark:border-white/10">
        <button
          onClick={() => {
            queryClient.clear();
            void signOut({ redirectUrl: "/" });
          }}
          title={!expanded ? "Sign out" : undefined}
          aria-label={!expanded ? "Sign out" : undefined}
          className={cn("flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white", expanded ? "gap-2 px-3 py-2.5" : "px-0")}
        >
          <LogOut className="h-4 w-4" />
          {expanded && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
