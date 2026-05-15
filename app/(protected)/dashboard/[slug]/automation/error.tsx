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
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-8 text-slate-950">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-xs font-black uppercase tracking-wider text-red-600">
          Campaign page error
        </p>
        <h1 className="mt-2 text-2xl font-black text-slate-950">
          Campaigns could not load
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          AP3k hit a client-side issue while rendering campaigns. You can retry
          or create a campaign from the stable builder.
        </p>
        {error?.message && (
          <p className="mt-4 rounded-xl border border-red-200 bg-white p-3 text-xs text-red-700">
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
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-950"
        >
          Create Campaign
        </Link>
      </div>
    </div>
  );
}
