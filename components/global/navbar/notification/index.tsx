import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import React from "react";

type Props = {};

function Notification({}: Props) {
  return (
    <Button className="rounded-xl border border-white/10 bg-white/[0.04] py-6 text-rf-pink hover:bg-white/[0.07]">
      <Bell className="h-4 w-4" />
    </Button>
  );
}

export default Notification;
