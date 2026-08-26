"use client";

import { disconnectCurrentInstagramIntegration } from "@/actions/integration";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

export default function DisconnectInstagramButton() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const disconnect = async () => {
    const confirmed = window.confirm(
      "Disconnect Instagram from AP3k? Active campaigns will be paused so they cannot fail silently. You can reconnect at any time."
    );
    if (!confirmed) return;

    setPending(true);
    try {
      const result = await disconnectCurrentInstagramIntegration();
      if (result.status === 200) {
        toast.success("Instagram disconnected. Active campaigns were paused safely.");
        router.refresh();
        return;
      }
      toast.error(result.data ?? "Instagram could not be disconnected.");
    } catch {
      toast.error("Instagram could not be disconnected. Please try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={disconnect}
      disabled={pending}
      className="min-h-11 border-red-200 bg-white px-4 font-bold text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500/30 dark:bg-white/[0.03] dark:text-red-300 dark:hover:bg-red-500/10"
    >
      {pending ? "Disconnecting..." : "Disconnect Instagram"}
    </Button>
  );
}
