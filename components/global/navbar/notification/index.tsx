import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import React from "react";

type Props = {};

function Notification({}: Props) {
  return (
    <Button className="rounded-xl border border-slate-200 bg-white py-6 text-rf-pink shadow-sm hover:bg-slate-50">
      <Bell className="h-4 w-4" />
    </Button>
  );
}

export default Notification;
