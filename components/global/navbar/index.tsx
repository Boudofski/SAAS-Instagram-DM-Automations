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
        <div className="sticky top-3 z-30 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/82 p-2 text-slate-950 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#0B1020]/80 dark:text-slate-50 lg:justify-end">
          <span className="lg:hidden flex items-center flex-1 gap-x-2">
            <Sheet trigger={<Menu aria-label="Open navigation" />} className="lg:hidden" side="left">
              <div className="flex h-full w-full flex-col gap-y-5 bg-[#0b1020] p-3 text-white backdrop-blur-3xl">
                <div className="flex gap-x-2 items-center p-5 justify-center">
                  <LogoSmall />
                </div>
                <div className="flex flex-col py-3">
                  <Items page={page} slug={slug} />
                </div>
                <div className="px-16">
                  <Separator
                    orientation="horizontal"
                    className="bg-[#333336]"
                  />
                </div>
                <div className="px-3 flex flex-col gap-y-5">
                  <div className="flex gap-x-2">
                    <ClerkAuthState />
                    <p className="text-[#9B9CA0]">Profile</p>
                  </div>
                  <div className="flex gap-x-3">
                    <HelpDuoToneWhite />
                    <p className="text-[#9B9CA0]">Help</p>
                  </div>
                </div>
                <SubscriptionPlan type="FREE">
                  <div className="flex-1 flex flex-col justify-end">
                    <UpgradeCard />
                  </div>
                </SubscriptionPlan>
              </div>
            </Sheet>
          </span>
          <Search />
          <CreateAutomation slug={slug} />
          <ThemeToggle compact />
          <Notification />
        </div>
        {page !== slug && <MainBreadCrumbs page={page} slug={slug} />}
      </div>
    )
  );
}

export default NavBar;
