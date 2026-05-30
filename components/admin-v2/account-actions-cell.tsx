"use client";

import { type FormEvent, useState, useTransition } from "react";
import {
  adminRefreshProfileSnapshotAction,
  adminMarkReconnectRequiredAction,
  adminSoftDisconnectAction,
  adminPauseCampaignsForAccountAction,
} from "@/actions/admin/account-actions";

type Props = {
  integrationId: string;
  instagramUsername: string | null;
  status: string;
  reconnectRequired: boolean;
};

type ModalKey = "refresh" | "reconnect" | "disconnect" | "pause";

const ACTION_LABELS: Record<ModalKey, string> = {
  refresh: "Refresh Profile Snapshot",
  reconnect: "Mark Reconnect Required",
  disconnect: "Soft Disconnect Account",
  pause: "Pause All Campaigns",
};

const ACTION_FNS: Record<ModalKey, (fd: FormData) => Promise<{ status: number; data: string }>> = {
  refresh: adminRefreshProfileSnapshotAction,
  reconnect: adminMarkReconnectRequiredAction,
  disconnect: adminSoftDisconnectAction,
  pause: adminPauseCampaignsForAccountAction,
};

export function AccountActionsCell({ integrationId, instagramUsername, status, reconnectRequired }: Props) {
  const [activeModal, setActiveModal] = useState<ModalKey | null>(null);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDisconnected = status === "DISCONNECTED";
  const label = instagramUsername ? `@${instagramUsername}` : integrationId.slice(0, 8);

  function openModal(modal: ModalKey) {
    setActiveModal(modal);
    setReason("");
    setConfirmation("");
    setError(null);
    setSuccessMsg(null);
  }

  function closeModal() {
    setActiveModal(null);
    setReason("");
    setConfirmation("");
    setError(null);
    setSuccessMsg(null);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeModal) return;
    if (reason.trim().length < 5) {
      setError("Reason must be at least 5 characters.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.set("integrationId", integrationId);
      fd.set("reason", reason);
      if (activeModal === "disconnect" || activeModal === "pause") fd.set("confirmation", confirmation);

      const result = await ACTION_FNS[activeModal](fd);
      if (result.status === 200) {
        setSuccessMsg(String(result.data));
      } else {
        setError(String(result.data));
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button onClick={() => openModal("refresh")} className="rounded px-2 py-1 text-left text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
        Refresh snapshot
      </button>
      <button onClick={() => openModal("reconnect")} disabled={reconnectRequired} className="rounded px-2 py-1 text-left text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40">
        Mark reconnect
      </button>
      <button onClick={() => openModal("disconnect")} disabled={isDisconnected} className="rounded px-2 py-1 text-left text-[11px] font-medium text-amber-400 hover:bg-slate-800 disabled:opacity-40">
        Soft disconnect
      </button>
      <button onClick={() => openModal("pause")} className="rounded px-2 py-1 text-left text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
        Pause campaigns
      </button>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1117] p-6 shadow-2xl">
            <p className="text-[11px] font-black uppercase tracking-widest text-pink-400">Account Action</p>
            <h2 className="mt-1 text-lg font-black text-white">{ACTION_LABELS[activeModal]}</h2>
            <p className="mt-1 text-xs text-slate-400">{label}</p>

            {activeModal === "disconnect" && (
              <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-900/20 px-3 py-2 text-[11px] text-amber-300">
                Disconnecting an account does not pause campaigns. Campaigns may fail until the account reconnects. Consider pausing campaigns for this account.
              </p>
            )}

            {successMsg ? (
              <>
                <p className="mt-4 rounded-lg bg-green-900/30 px-3 py-2 text-sm text-green-300">{successMsg}</p>
                <button onClick={closeModal} className="mt-4 w-full rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white">
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-400">
                    Reason <span className="text-pink-400">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Minimum 5 characters"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-pink-500"
                  />
                </div>

                {(activeModal === "disconnect" || activeModal === "pause") && (
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-amber-400">
                      {activeModal === "disconnect" ? "Type DISCONNECT to confirm" : "Type PAUSE to continue"}
                    </label>
                    <input
                      type="text"
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      placeholder={activeModal === "disconnect" ? "DISCONNECT" : "PAUSE"}
                      className="w-full rounded-lg border border-amber-500/30 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                )}

                {error && (
                  <p role="alert" className="rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-300">
                    {error}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50">
                    {isPending ? "Processing…" : "Confirm"}
                  </button>
                  <button type="button" onClick={closeModal} disabled={isPending} className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white disabled:opacity-50">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
