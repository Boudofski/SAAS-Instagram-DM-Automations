"use client";

import ThemeToggle from "@/components/global/theme-toggle";
import { PAGE_BREAD_CRUMBS } from "@/constants/pages";
import { usePath } from "@/hooks/user-nav";
import { Menu } from "lucide-react";
import AP3KLogo from "../ap3k-logo";
import CreateAutomation from "../create-automation";
import Sheet from "../sheet";
import Items from "../sidebar/items";
import InstagramAvatar from "@/components/dashboard/instagram-avatar";
import HelpHub from "@/components/help/help-hub";
import { useQueryUser } from "@/hooks/user-queries";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";
import { planDisplayName } from "@/lib/billing-plans";
import Notification from "./notification";
import Search from "./search";
import { useClerk } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

type Props = {
  slug: string;
};

function NavBar({ slug }: Props) {
  const { page, pathname } = usePath();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const { data } = useQueryUser();
  const instagram = getCanonicalInstagramIntegration(data?.data?.integrations);
  const plan = planDisplayName(data?.data?.subscription?.plan);
  const currentPage = PAGE_BREAD_CRUMBS.includes(page) || page == slug;
  const isCampaignList = pathname === `/dashboard/${slug}/automation`;

  const handleSignOut = () => {
    queryClient.clear();
    void signOut({ redirectUrl: "/" });
  };

  return (
    currentPage && (
      <div className="sticky top-3 z-30 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/82 p-2 text-slate-950 shadow-sm backdrop-blur-xl transition-shadow duration-300 hover:shadow-md dark:border-white/10 dark:bg-[#0B1020]/80 dark:text-slate-50 sm:flex-nowrap lg:justify-end">
        <span className="flex flex-1 items-center gap-x-2 lg:hidden">
          <Sheet
            trigger={<Menu aria-hidden="true" />}
            triggerLabel="Open navigation"
            className="lg:hidden"
            contentClassName="h-[100dvh] max-h-[100dvh]"
            side="left"
            closeOnNavigation
          >
            <div className="flex h-full min-h-0 w-full flex-col bg-white text-slate-950 backdrop-blur-3xl dark:bg-[#0b1020] dark:text-white">
              <div className="shrink-0 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <div className="flex items-center justify-center gap-x-2 p-5">
                  <AP3KLogo className="text-slate-950 dark:text-white" />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4">
                <Link href={`/dashboard/${slug}/account`} className="mb-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.05]">
                  <InstagramAvatar src={instagram?.profilePictureUrl} username={instagram?.instagramUsername} label={instagram?.pageName} size="sm" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-black">{instagram?.instagramUsername ? `@${instagram.instagramUsername}` : "Connect Instagram"}</span><span className="mt-0.5 block text-xs font-bold text-violet-500">{plan} plan</span></span>
                </Link>
                <div className="flex flex-col py-3">
                  <Items page={page} slug={slug} />
                </div>
                <div className="mt-3 border-t border-slate-200 pt-3 dark:border-white/10"><HelpHub slug={slug} mobile /></div>
              </div>

              <div className="shrink-0 border-t border-slate-200 px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] dark:border-white/10">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-center rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rf-pink dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
                >
                  Sign out
                </button>
              </div>
            </div>
          </Sheet>
        </span>
        <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1 lg:max-w-sm">
          <Search />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {!isCampaignList && <CreateAutomation slug={slug} />}
          <ThemeToggle compact />
          <Notification />
        </div>
      </div>
    )
  );
}

export default NavBar;
