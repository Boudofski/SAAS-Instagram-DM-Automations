"use client";

import {
  getInstagramConnectUrl,
  resubscribeCurrentInstagramWebhooks,
} from "@/actions/integration";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type Props = {
  connected: boolean;
};

export default function AccountConnectionActions({ connected }: Props) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const reconnect = async () => {
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

  const resubscribe = () => {
    startTransition(async () => {
      const result = await resubscribeCurrentInstagramWebhooks();
      if (result.status === 200) toast.success(result.data);
      else toast.error(result.data ?? "Webhook resubscribe failed");
    });
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <Button
        type="button"
        onClick={reconnect}
        disabled={isConnecting}
        className="ap3k-gradient-button h-11 rounded-xl px-4 text-white"
      >
        <RefreshCw className="h-4 w-4" />
        {connected ? "Reconnect Instagram" : "Connect Instagram"}
      </Button>
      {connected && (
        <Button
          type="button"
          variant="outline"
          onClick={resubscribe}
          disabled={isPending}
          className="h-11 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
        >
          {isPending ? "Refreshing..." : "Resubscribe webhooks"}
        </Button>
      )}
    </div>
  );
}
