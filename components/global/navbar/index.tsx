"use client";

import { Separator } from "@/components/ui/separator";
import ThemeToggle from "@/components/global/theme-toggle";
import { PAGE_BREAD_CRUMBS } from "@/constants/pages";
import { usePath } from "@/hooks/user-nav";
import { Menu } from "lucide-react";
import AP3kLogo from "../ap3k-logo";
import CreateAutomation from "../create-automation";
import Sheet from "../sheet";
import Items from "../sidebar/items";
import UpgradeCard from "../sidebar/upgrade";
import SubscriptionPlan from "../subscription-plan";
import Notification from "./notification";
import Search from "./search";

type Props = {
  slug: string;
};

function NavBar({ slug }: Props) {
  const { page, pathname } = usePath();
  const currentPage = PAGE_BREAD_CRUMBS.includes(page) || page == slug;
  const isCampaignList = pathname === `/dashboard/${slug}/automation`;

  return (
    currentPage && (
      <div className="sticky top-3 z-30 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/82 p-2 text-slate-950 shadow-sm backdrop-blur-xl transition-shadow duration-300 hover:shadow-md dark:border-white/10 dark:bg-[#0B1020]/80 dark:text-slate-50 sm:flex-nowrap lg:justify-end">
        <span className="flex flex-1 items-center gap-x-2 lg:hidden">
          <Sheet
            trigger={<Menu aria-hidden="true" />}
            triggerLabel="Open navigation"
            className="lg:hidden"
            side="left"
            closeOnNavigation
          >
            <div className="flex h-full w-full flex-col gap-y-5 bg-white p-3 text-slate-950 backdrop-blur-3xl dark:bg-[#0b1020] dark:text-white">
              <div className="flex items-center justify-center gap-x-2 p-5">
                <AP3kLogo className="text-slate-950 dark:text-white" />
              </div>
              <div className="flex flex-col py-3">
                <Items page={page} slug={slug} />
              </div>
              <div className="px-16">
                <Separator orientation="horizontal" className="bg-slate-200 dark:bg-[#333336]" />
              </div>
              <SubscriptionPlan type="FREE">
                <div className="flex flex-1 flex-col justify-end">
                  <UpgradeCard />
                </div>
              </SubscriptionPlan>
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
