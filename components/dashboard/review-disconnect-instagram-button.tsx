"use client";

import { disconnectCurrentInstagramIntegration } from "@/actions/integration";
import { isCanonicalInstagramConnected } from "@/lib/instagram-integration-status";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  onDisconnected?: () => void;
};

const DISCONNECT_QUERY_KEYS = [
  ["user-profile"],
  ["user-integrations"],
  ["instagram-integration"],
  ["instagram-media"],
  ["user-automation"],
  ["webhook-health"],
  ["onboarding-connect"],
];

export default function ReviewDisconnectInstagramButton({ onDisconnected }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const disconnect = () => {
    startTransition(async () => {
      const result = await disconnectCurrentInstagramIntegration();
      if (result.status === 200) {
        setRemoved(true);
        setMessage("Connection removed.");
        setShowConfirm(false);
        onDisconnected?.();
        queryClient.setQueriesData({ queryKey: ["user-profile"] }, markInstagramDisconnected);
        queryClient.setQueriesData({ queryKey: ["user-integrations"] }, markInstagramDisconnected);
        queryClient.setQueriesData({ queryKey: ["instagram-integration"] }, markInstagramDisconnected);
        await Promise.all([
          ...DISCONNECT_QUERY_KEYS.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
          queryClient.invalidateQueries({ queryKey: ["automation-info"] }),
        ]);
        router.refresh();
        return;
      }
      setMessage("Instagram connection could not be removed. Please try again.");
      setShowConfirm(false);
    });
  };

  if (removed) {
    return (
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <p className="text-sm font-black text-slate-950 dark:text-white">Instagram not connected</p>
        <p className="max-w-[260px] text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
          Connection removed. Campaign history is preserved.
        </p>
      </div>
    );
  }

  if (showConfirm) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04] sm:min-w-[280px]">
        <p className="text-sm font-black text-slate-950 dark:text-white">Remove Instagram connection?</p>
        <p className="text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
          AP3k will stop using this Instagram account. Campaign history, leads, and activity stay saved.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={disconnect}
            disabled={isPending}
            className="flex-1 rounded-xl bg-slate-950 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            {isPending ? "Removing..." : "Remove connection"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
      >
        Remove connection
      </button>
      <p className="max-w-[260px] text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
        Remove this Instagram account from AP3k. Campaign history is preserved.
      </p>
      {message && (
        <p className="max-w-[240px] text-xs font-semibold leading-relaxed text-slate-500 dark:text-slate-400">
          {message}
        </p>
      )}
    </div>
  );
}

function markInstagramDisconnected<T>(old: T): T {
  if (!old || typeof old !== "object") return old;

  const root = old as any;
  const integrations = root?.data?.integrations ?? root?.integrations;
  if (!Array.isArray(integrations)) return old;

  const nextIntegrations = integrations.map((integration: any) =>
    isCanonicalInstagramConnected(integration)
      ? {
          ...integration,
          status: "DISCONNECTED",
          reconnectRequired: false,
          tokenPresent: false,
        }
      : integration
  );

  if (root?.data?.integrations) {
    return {
      ...root,
      data: {
        ...root.data,
        integrations: nextIntegrations,
      },
    };
  }

  return {
    ...root,
    integrations: nextIntegrations,
  };
}
