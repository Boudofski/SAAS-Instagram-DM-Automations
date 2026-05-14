"use client";

import { getInstagramConnectUrl } from "@/actions/integration";
import { onUserInfo } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { toast } from "sonner";

type Props = {
  title: string;
  description: string;
  icon: React.ReactNode;
  strategy: "INSTAGRAM" | "CRM";
};

function IntegrationCard({ title, description, icon, strategy }: Props) {
  const [isConnecting, setIsConnecting] = React.useState(false);

  const { data } = useQuery({
    queryKey: ["user-profile"],
    queryFn: onUserInfo,
  });

  const integrated = data?.data?.integrations.find((i) => i.name === strategy);
  const isInstagram = strategy === "INSTAGRAM";

  const onConnect = async () => {
    if (!isInstagram) return;

    setIsConnecting(true);
    try {
      const result = await getInstagramConnectUrl();
      if (result.status === 200 && result.url) {
        window.location.assign(result.url);
        return;
      }

      toast.error("Instagram connection could not be started.");
    } catch {
      toast.error("Instagram connection could not be started.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="ap3k-card ap3k-card-hover flex flex-col gap-5 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
      {icon}
      <div className="flex flex-col flex-1">
        <h3 className="text-xl font-black">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-rf-muted">{description}</p>
        {integrated?.instagramId && (
          <p className="mt-2 text-xs font-semibold text-rf-green">
            Connected account ID: {integrated.instagramId}
          </p>
        )}
      </div>
      <Button
        onClick={onConnect}
        disabled={!isInstagram || isConnecting}
        className="ap3k-gradient-button min-w-36 text-white disabled:opacity-60"
      >
        {integrated ? "Reconnect Instagram" : isConnecting ? "Connecting..." : "Connect Instagram"}
      </Button>
    </div>
  );
}

export default IntegrationCard;
