"use client";

import {
  getInstagramConnectUrl,
  refreshInstagramProfileSnapshot,
  resubscribeCurrentInstagramWebhooks,
} from "@/actions/integration";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type Props = {
  connected: boolean;
  integrationId?: string;
};

export default function AccountConnectionActions({ connected, integrationId }: Props) {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isProfileRefreshing, setIsProfileRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<{ ok: boolean; message: string } | null>(null);

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

  const refreshProfile = () => {
    if (!integrationId) return;
    setIsProfileRefreshing(true);
    setRefreshStatus(null);
    startTransition(async () => {
      try {
        const result = await refreshInstagramProfileSnapshot(integrationId, { force: true });
        if (result.status === 200 && !result.error) {
          const msg = result.cached
            ? result.message ?? "Using latest cached profile stats."
            : result.message ?? "Instagram profile stats refreshed.";
          toast.success(msg);
          setRefreshStatus({ ok: true, message: msg });
          router.refresh();
          return;
        }
        const errMsg = result.error ?? "Instagram profile stats could not be refreshed.";
        toast.error(errMsg);
        setRefreshStatus({ ok: false, message: errMsg });
        router.refresh();
      } catch {
        const errMsg = "Instagram profile stats could not be refreshed.";
        toast.error(errMsg);
        setRefreshStatus({ ok: false, message: errMsg });
      } finally {
        setIsProfileRefreshing(false);
      }
    });
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto">
      <div className="flex w-full flex-col gap-2 sm:flex-row">
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
        <>
          <Button
            type="button"
            variant="outline"
            onClick={refreshProfile}
            disabled={isProfileRefreshing}
            className="h-11 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
          >
            {isProfileRefreshing ? "Refreshing..." : "Refresh profile"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={resubscribe}
            disabled={isPending}
            className="h-11 rounded-xl border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
          >
            {isPending ? "Refreshing..." : "Resubscribe webhooks"}
          </Button>
        </>
      )}
      </div>
      {refreshStatus && (
        <p className={`text-xs font-bold ${refreshStatus.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
          {refreshStatus.message}
        </p>
      )}
    </div>
  );
}
