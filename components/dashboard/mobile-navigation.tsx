"use client";

import { Menu } from "lucide-react";
import Sheet from "@/components/global/sheet";
import Sidebar from "@/components/global/sidebar";
import { useI18n } from "@/providers/i18n-provider";

/** Navigation stays reachable on small screens without a second app header. */
export default function MobileNavigation({ slug }: { slug: string }) {
  const { t } = useI18n();
  return <div data-mobile-navigation className="fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-3 z-40 lg:hidden">
    <Sheet
      trigger={<Menu className="h-5 w-5" aria-hidden="true" />}
      triggerLabel={t("openNavigation")}
      className="border border-slate-200 bg-white text-slate-800 shadow-lg dark:border-white/15 dark:bg-[#181a28] dark:text-white"
      contentClassName="h-[100dvh] max-h-[100dvh] w-[min(320px,calc(100vw-40px))]"
      side="left"
      closeOnNavigation
    ><Sidebar slug={slug} drawer /></Sheet>
  </div>;
}
