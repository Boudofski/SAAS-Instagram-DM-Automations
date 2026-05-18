import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import React from "react";

type Props = {};

function Notification({}: Props) {
  return (
    <Button
      aria-label="Notifications"
      title="Notifications coming later"
      className="hidden rounded-xl border border-slate-200 bg-white py-5 text-rf-pink shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] sm:inline-flex"
    >
      <Bell className="h-4 w-4" />
    </Button>
  );
}

export default Notification;
