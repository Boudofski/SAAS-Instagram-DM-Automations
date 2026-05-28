"use client";

import { disconnectCurrentInstagramIntegration } from "@/actions/integration";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function ReviewDisconnectInstagramButton() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmed, setConfirmed] = useState(false);

  const disconnect = () => {
    if (!confirmed) {
      setConfirmed(true);
      setMessage("Click again to disconnect Instagram from AP3k.");
      return;
    }

    startTransition(async () => {
      const result = await disconnectCurrentInstagramIntegration();
      if (result.status === 200) {
        setMessage("Instagram disconnected from AP3k.");
        router.refresh();
        return;
      }
      setMessage(typeof result.data === "string" ? result.data : "Instagram could not be disconnected.");
      setConfirmed(false);
    });
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={disconnect}
        disabled={isPending}
        className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
      >
        {isPending ? "Disconnecting..." : "Disconnect Instagram"}
      </button>
      <p className="max-w-[240px] text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
        {message ?? "Remove this Instagram account from AP3k."}
      </p>
    </div>
  );
}
