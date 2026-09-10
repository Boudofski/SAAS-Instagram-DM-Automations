"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, CheckCircle2, CreditCard, Inbox } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

type Props = {
  slug: string;
};

function Notification({ slug }: Props) {
  const [open, setOpen] = useState(false);
  const closeNotifications = () => setOpen(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          aria-label="Open notifications"
          title="Notifications"
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-xl border-slate-200 bg-white text-rf-pink shadow-sm hover:bg-slate-50 hover:text-rf-pink dark:border-white/10 dark:bg-white/[0.04] dark:text-rf-pink dark:hover:bg-white/[0.08]"
        >
          <Bell aria-hidden="true" className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border-slate-200 bg-white p-0 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-[#111827] dark:text-white"
      >
        <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <p className="text-sm font-black">Notifications</p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Workspace and billing updates</p>
        </div>

        <div className="px-4 py-5 text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-black">You&apos;re all caught up</p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Important automation, account, and billing updates will appear here.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-slate-200 p-3 dark:border-white/10">
          <Button asChild variant="outline" className="h-10 rounded-xl border-slate-200 bg-white text-xs font-bold dark:border-white/10 dark:bg-white/[0.04]">
            <Link href={`/dashboard/${slug}/inbox`} onClick={closeNotifications}>
              <Inbox aria-hidden="true" />
              Open inbox
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-10 rounded-xl border-slate-200 bg-white text-xs font-bold dark:border-white/10 dark:bg-white/[0.04]">
            <Link href={`/dashboard/${slug}/billing`} onClick={closeNotifications}>
              <CreditCard aria-hidden="true" />
              Billing
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default Notification;
