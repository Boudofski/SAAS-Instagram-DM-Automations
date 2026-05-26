"use client";

import { Separator } from "@/components/ui/separator";
import ThemeToggle from "@/components/global/theme-toggle";
import { PAGE_BREAD_CRUMBS } from "@/constants/pages";
import { usePath } from "@/hooks/user-nav";
import { HelpDuoToneWhite } from "@/icons";
import { LogoSmall } from "@/svgs/logo-small";
import { Menu } from "lucide-react";
import MainBreadCrumbs from "../bread-crumb/main-bread-crumbs";
import ClerkAuthState from "../clerk-auth-state";
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
  const { page } = usePath();
  const currentPage = PAGE_BREAD_CRUMBS.includes(page) || page == slug;

  return (
    currentPage && (
      <div className="flex flex-col">
        <div className="sticky top-3 z-30 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/82 p-2 text-slate-950 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0B1020]/80 dark:text-slate-50 sm:flex-nowrap lg:justify-end">
          <span className="flex flex-1 items-center gap-x-2 lg:hidden">
            <Sheet trigger={<Menu aria-label="Open navigation" />} className="lg:hidden" side="left">
              <div className="flex h-full w-full flex-col gap-y-5 bg-white p-3 text-slate-950 backdrop-blur-3xl dark:bg-[#0b1020] dark:text-white">
                <div className="flex items-center justify-center gap-x-2 p-5">
                  <LogoSmall />
                </div>
                <div className="flex flex-col py-3">
                  <Items page={page} slug={slug} />
                </div>
                <div className="px-16">
                  <Separator
                    orientation="horizontal"
                    className="bg-slate-200 dark:bg-[#333336]"
                  />
                </div>
                <div className="flex flex-col gap-y-5 px-3">
                  <div className="flex gap-x-2">
                    <ClerkAuthState />
                    <p className="text-slate-500 dark:text-[#9B9CA0]">Profile</p>
                  </div>
                  <div className="flex gap-x-3">
                    <HelpDuoToneWhite />
                    <p className="text-slate-500 dark:text-[#9B9CA0]">Help</p>
                  </div>
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
            <CreateAutomation slug={slug} />
            <ThemeToggle compact />
            <Notification />
          </div>
        </div>
        {page !== slug && <MainBreadCrumbs page={page} slug={slug} />}
      </div>
    )
  );
}

export default NavBar;
