"use client";

import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type PortalResponse = {
  url?: string;
  error?: { message?: string };
};

export function ManageBillingButton() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openBillingPortal() {
    if (isPending) return;

    setIsPending(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => ({}))) as PortalResponse;

      if (!response.ok || !payload.url) {
        throw new Error(payload.error?.message || "Could not open billing management.");
      }

      window.location.assign(payload.url);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not open billing management.";
      setError(message);
      toast.error(message);
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5 md:items-end">
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={openBillingPortal}
        className="h-11 rounded-xl border-slate-200 bg-white/80 px-4 font-bold text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:bg-white/[0.10]"
      >
        {isPending ? <Loader2 aria-hidden="true" className="animate-spin" /> : <CreditCard aria-hidden="true" />}
        {isPending ? "Opening billing…" : "Manage billing"}
      </Button>
      {error && <p role="alert" className="max-w-xs text-xs font-semibold text-red-600 dark:text-red-300">{error}</p>}
    </div>
  );
}
