"use client";

import { onOathInstagram } from "@/actions/integration";
import { onUserInfo } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import React from "react";

type Props = {
  title: string;
  description: string;
  icon: React.ReactNode;
  strategy: "INSTAGRAM" | "CRM";
};

function IntegrationCard({ title, description, icon, strategy }: Props) {
  const onInstOAuth = () => onOathInstagram(strategy);

  const { data } = useQuery({
    queryKey: ["user-profile"],
    queryFn: onUserInfo,
  });

  const integrated = data?.data?.integrations.find((i) => i.name === strategy);

  return (
    <div className="ap3k-card ap3k-card-hover flex items-center justify-between gap-x-5 rounded-2xl p-5">
      {icon}
      <div className="flex flex-col flex-1">
        <h3 className="text-xl font-black"> {title}</h3>
        <p className="text-rf-muted text-base ">{description}</p>
      </div>
      <Button
        onClick={onInstOAuth}
        disabled={integrated?.name === strategy}
        className="ap3k-gradient-button text-white"
      >
        {integrated ? "Connected" : "Connect"}
      </Button>
    </div>
  );
}

export default IntegrationCard;
