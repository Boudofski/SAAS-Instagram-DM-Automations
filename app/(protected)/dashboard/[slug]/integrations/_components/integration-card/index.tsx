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
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm transition-colors hover:border-rf-pink/30 sm:flex-row sm:items-center sm:justify-between">
      {icon}
      <div className="flex flex-col flex-1">
        <h3 className="text-xl font-black">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p>
        {integrated?.instagramId && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            {integrated.profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={integrated.profilePictureUrl}
                alt={integrated.instagramUsername ?? "Connected Instagram account"}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ap3k-gradient text-xs font-black text-white">
                IG
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-rf-green">
                {integrated.instagramUsername
                  ? `@${integrated.instagramUsername}`
                  : "Instagram connected"}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                Account ID: {integrated.instagramId}
              </p>
            </div>
          </div>
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
