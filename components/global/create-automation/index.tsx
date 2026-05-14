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
      className="ap3k-gradient-button rounded-xl py-6 text-white lg:px-8"
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
