"use client";

import { useState, useTransition } from "react";
import {
  adminPauseCampaignAction,
  adminResumeCampaignAction,
} from "@/actions/admin/campaign-actions";

type Props = {
  campaignId: string;
  campaignName: string;
  active: boolean;
  needsReview: boolean;
  archivedAt: Date | null;
};

export function CampaignActionsCell({
  campaignId,
  campaignName,
  active,
  needsReview,
  archivedAt,
}: Props) {
  const [modal, setModal] = useState<"pause" | "resume" | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function closeModal() {
    setModal(null);
    setReason("");
    setError(null);
  }

  function openModal(type: "pause" | "resume") {
    setReason("");
    setError(null);
    setModal(type);
  }

  function handleSubmit() {
    if (!modal) return;
    if (reason.trim().length < 5) {
      setError("Reason must be at least 5 characters.");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("campaignId", campaignId);
      fd.set("reason", reason);
      const result =
        modal === "pause"
          ? await adminPauseCampaignAction(fd)
          : await adminResumeCampaignAction(fd);
      if (result.status === 200) {
        closeModal();
      } else {
        setError(typeof result.data === "string" ? result.data : "An unexpected error occurred.");
      }
    });
  }

  // State 1: Archived
  if (archivedAt !== null) {
    return <span className="text-[11px] text-slate-600">—</span>;
  }

  // State 2: Needs review
  if (needsReview) {
    return (
      <span className="text-[11px] font-medium text-amber-400">
        Review required before activation.
      </span>
    );
  }

  // State 3: Normal — show Pause or Resume button
  return (
    <>
      {active ? (
        <button
          onClick={() => openModal("pause")}
          disabled={isPending}
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
        >
          Pause
        </button>
      ) : (
        <button
          onClick={() => openModal("resume")}
          disabled={isPending}
          className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-[11px] font-bold text-blue-400 hover:bg-blue-500/20 disabled:opacity-50"
        >
          Resume
        </button>
      )}

      {modal !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) closeModal();
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            {/* Header */}
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              {modal === "pause" ? "Pause campaign" : "Resume campaign"}
            </p>
            <p className="mt-1 truncate text-sm font-bold text-slate-200">
              {campaignName}
            </p>
            <p className="mt-2 text-[12px] text-slate-400">
              {modal === "pause"
                ? "Sets campaign to inactive. Does not affect the review state."
                : "Sets campaign to active. Campaign must not require review."}
            </p>

            {/* Reason textarea */}
            <div className="mt-4 flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Reason
              </label>
              <textarea
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                rows={3}
                placeholder="Min. 5 characters"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isPending}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-white/20 focus:outline-none disabled:opacity-50"
              />
              {error && (
                <p className="text-[11px] text-red-400">{error}</p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeModal}
                disabled={isPending}
                className="rounded-lg border border-white/10 bg-transparent px-4 py-2 text-[12px] font-bold text-slate-400 hover:bg-white/[0.06] disabled:opacity-50"
              >
                Cancel
              </button>
              {modal === "pause" ? (
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="rounded-lg bg-amber-500/80 px-4 py-2 text-[12px] font-bold text-white hover:bg-amber-500 disabled:opacity-50"
                >
                  {isPending ? "Working…" : "Pause campaign"}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="rounded-lg bg-blue-500/80 px-4 py-2 text-[12px] font-bold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {isPending ? "Working…" : "Resume campaign"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
