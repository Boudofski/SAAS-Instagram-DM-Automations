"use client";

import ReviewDisconnectInstagramButton from "@/components/dashboard/review-disconnect-instagram-button";
import Link from "next/link";
import { useState } from "react";

type Props = {
  connected: boolean;
  displayUsername?: string | null;
  displayProfilePictureUrl?: string | null;
  pageName?: string | null;
};

export default function ReviewInstagramAccountProfile({
  connected,
  displayUsername,
  displayProfilePictureUrl,
  pageName,
}: Props) {
  const [removed, setRemoved] = useState(false);
  const liveConnected = connected && !removed;

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Profile</p>
        </div>
        {liveConnected ? (
          <ReviewDisconnectInstagramButton onDisconnected={() => setRemoved(true)} />
        ) : (
          <Link href="/onboarding/connect" className="ap3k-gradient-button inline-flex justify-center px-4 py-2.5 text-sm">
            Connect Instagram
          </Link>
        )}
      </div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-5">
          {liveConnected && displayProfilePictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayProfilePictureUrl}
              alt={displayUsername ?? "Instagram account"}
              className="h-24 w-24 rounded-3xl object-cover shadow-sm"
            />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-3xl bg-ap3k-gradient text-base font-black text-white shadow-sm">
              IG
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              {liveConnected && displayUsername ? `@${displayUsername}` : "No Instagram account connected"}
            </p>
            <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
              {liveConnected ? pageName ?? "Instagram Business or Creator profile" : "Connect Instagram to start."}
            </p>
            <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
              {liveConnected ? "Profile connected" : "Connect Instagram to view profile details."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {liveConnected && <StatusBadge tone="pink">Official Meta connection</StatusBadge>}
              <StatusBadge tone={liveConnected ? "green" : "slate"}>{liveConnected ? "Connected" : "Not connected"}</StatusBadge>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatusBadge({ tone, children }: { tone: "green" | "pink" | "slate"; children: React.ReactNode }) {
  const classes = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    pink: "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-500/30 dark:bg-pink-500/10 dark:text-pink-200",
    slate: "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300",
  };
  return <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase ${classes[tone]}`}>{children}</span>;
}
