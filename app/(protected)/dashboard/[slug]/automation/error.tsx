"use client";

import Link from "next/link";

export default function AutomationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
        <p className="text-xs font-black uppercase tracking-wider text-red-200">
          Campaign page error
        </p>
        <h1 className="mt-2 text-2xl font-black text-rf-text">
          Campaigns could not load
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-rf-muted">
          AP3k hit a client-side issue while rendering campaigns. You can retry
          or create a campaign from the stable builder.
        </p>
        {error?.message && (
          <p className="mt-4 rounded-xl border border-red-500/20 bg-rf-bg/50 p-3 text-xs text-red-100">
            {error.message}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={reset}
          className="ap3k-gradient-button px-5 py-2.5 text-sm"
        >
          Try again
        </button>
        <Link
          href="../automation/new"
          className="rounded-xl border border-rf-border px-5 py-2.5 text-sm font-bold text-rf-muted hover:text-rf-text"
        >
          Create Campaign
        </Link>
      </div>
    </div>
  );
}
