"use client";

import { Button } from "@/components/ui/button";
import { AutomationDuoToneWhite } from "@/icons";
import Link from "next/link";

type Props = {
  slug?: string;
};

function CreateAutomation({ slug }: Props) {
  const href = slug ? `/dashboard/${slug}/automation/new` : "/dashboard";

  return (
    <Button
      asChild
      className="ap3k-gradient-button h-10 rounded-xl px-3 text-white sm:px-4 lg:px-6"
    >
      <Link href={href}>
        <AutomationDuoToneWhite />
        <p className="lg:inline hidden">Create Campaign</p>
      </Link>
    </Button>
  );
}

export default CreateAutomation;

// 04.40
