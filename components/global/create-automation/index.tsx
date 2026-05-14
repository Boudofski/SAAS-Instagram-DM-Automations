"use client";

import { Button } from "@/components/ui/button";
import { useCreateAutomation } from "@/hooks/use-automation";
import { AutomationDuoToneWhite } from "@/icons";
import React, { useMemo } from "react";
import { v4 } from "uuid";
import Loader from "../loader";

type Props = {};

function CreateAutomation({}: Props) {
  const mutationId = useMemo(
    () => v4(),
    [
      /* v4() */
    ]
  );
  //console.log("🚀 ~ CreateAutomation ~ mutationId:", mutationId);

  const { isPending, mutate } = useCreateAutomation(mutationId);

  return (
    <Button
      onClick={() =>
        mutate({
          name: "Untitled",
          id: mutationId,
          createdAt: new Date(),
          keywords: [],
        })
      }
      disabled={isPending}
      className="ap3k-gradient-button rounded-xl py-6 text-white lg:px-8"
    >
      <Loader state={false} />
      <AutomationDuoToneWhite />
      <p className="lg:inline hidden">Create Automation</p>
    </Button>
  );
}

export default CreateAutomation;

// 04.40
