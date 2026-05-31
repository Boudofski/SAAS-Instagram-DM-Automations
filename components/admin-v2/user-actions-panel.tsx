"use client";

import { type FormEvent, useState, useTransition } from "react";
import {
  adminSuspendUserAction,
  adminReactivateUserAction,
  adminChangeUserPlanAction,
  adminResetUserUsageAction,
} from "@/actions/admin/user-actions";

type Props = {
  userId: string;
  email: string;
  status: string;
  plan?: string;
};

type ModalKey = "suspend" | "reactivate" | "change_plan" | "reset_usage";

export function UserActionsPanel({ userId, email, status, plan }: Props) {
  const [activeModal, setActiveModal] = useState<ModalKey | null>(null);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"FREE" | "PRO">("FREE");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSuspended = status === "SUSPENDED";

  function openModal(modal: ModalKey) {
    setActiveModal(modal);
    setReason("");
    setConfirmation("");
    if (modal === "change_plan") {
      setSelectedPlan(plan === "PRO" ? "PRO" : "FREE");
    }
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
      fd.set("userId", userId);
      fd.set("reason", reason);
      if (activeModal === "suspend" || activeModal === "reset_usage") {
        fd.set("confirmation", confirmation);
      }
      if (activeModal === "change_plan") fd.set("plan", selectedPlan);

      const action =
        activeModal === "suspend"
          ? adminSuspendUserAction
          : activeModal === "reactivate"
            ? adminReactivateUserAction
            : activeModal === "change_plan"
              ? adminChangeUserPlanAction
              : adminResetUserUsageAction;

      const result = await action(fd);
      if (result.status === 200) {
        setSuccessMsg(String(result.data));
      } else {
        setError(String(result.data));
      }
    });
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
      <h2 className="mb-1 text-[11px] font-black uppercase tracking-widest text-slate-500">
        Admin Actions
      </h2>
      <p className="mb-4 text-[10px] text-slate-600">All actions are audited</p>

      <div className="flex flex-wrap gap-2">
        {!isSuspended ? (
          <button
            onClick={() => openModal("suspend")}
            className="rounded-lg bg-red-900/40 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-900/60 hover:text-red-200 transition-colors"
          >
            Suspend user
          </button>
        ) : (
          <button
            onClick={() => openModal("reactivate")}
            className="rounded-lg bg-emerald-900/40 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-900/60 hover:text-emerald-200 transition-colors"
          >
            Reactivate user
          </button>
        )}

        <button
          onClick={() => openModal("change_plan")}
          className="rounded-lg bg-pink-900/40 px-4 py-2 text-sm font-semibold text-pink-300 hover:bg-pink-900/60 hover:text-pink-200 transition-colors"
        >
          Change plan
        </button>

        <button
          onClick={() => openModal("reset_usage")}
          className="rounded-lg bg-amber-900/40 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-900/60 hover:text-amber-200 transition-colors"
        >
          Reset usage
        </button>
      </div>

      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1117] p-6 shadow-2xl">
            <p className="text-[11px] font-black uppercase tracking-widest text-pink-400">
              Admin Action
            </p>
            <h2 className="mt-1 text-lg font-black text-white">
              {activeModal === "suspend"
                ? "Suspend user"
                : activeModal === "reactivate"
                  ? "Reactivate user"
                  : activeModal === "change_plan"
                    ? "Change user plan"
                    : "Reset monthly usage"}
            </h2>
            <p className="mt-1 text-xs text-slate-400">{email}</p>

            {activeModal === "suspend" && (
              <p className="mt-3 rounded-lg border border-red-500/20 bg-red-900/20 px-3 py-2 text-[11px] text-red-300">
                Suspending pauses all active campaigns. Record, integrations, leads, and billing preserved.
              </p>
            )}

            {activeModal === "change_plan" && (
              <p className="mt-3 rounded-lg border border-pink-500/20 bg-pink-900/20 px-3 py-2 text-[11px] text-pink-300">
                Manual plan changes affect AP3k internal access only. Stripe billing is not modified.
              </p>
            )}

            {activeModal === "reset_usage" && (
              <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-900/20 px-3 py-2 text-[11px] text-amber-300">
                This resets this user’s displayed current monthly reply usage from this moment forward. It does not delete logs, campaigns, integrations, invoices, or Stripe data.
              </p>
            )}

            {successMsg ? (
              <>
                <p className="mt-4 rounded-lg bg-green-900/30 px-3 py-2 text-sm text-green-300">
                  {successMsg}
                </p>
                <button
                  onClick={closeModal}
                  className="mt-4 w-full rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
                {activeModal === "change_plan" && (
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-400">
                      Select Plan <span className="text-pink-400">*</span>
                    </label>
                    <select
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value as "FREE" | "PRO")}
                      className="w-full rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500"
                    >
                      <option value="FREE">FREE</option>
                      <option value="PRO">PRO</option>
                    </select>
                  </div>
                )}

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

                {activeModal === "suspend" && (
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-amber-400">
                      Type SUSPEND to confirm
                    </label>
                    <input
                      type="text"
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      placeholder="SUSPEND"
                      className="w-full rounded-lg border border-amber-500/30 bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                )}

                {activeModal === "reset_usage" && (
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-amber-400">
                      Type RESET USAGE to confirm
                    </label>
                    <input
                      type="text"
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      placeholder="RESET USAGE"
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
                  <button
                    type="submit"
                    disabled={isPending}
                    className={
                      activeModal === "suspend"
                        ? "flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        : activeModal === "reactivate"
                          ? "flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          : activeModal === "change_plan"
                            ? "flex-1 rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
                            : "flex-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                    }
                  >
                    {isPending
                      ? "Processing…"
                      : activeModal === "suspend"
                        ? "Suspend user"
                        : activeModal === "reactivate"
                          ? "Reactivate user"
                          : activeModal === "change_plan"
                            ? "Change plan"
                            : "Reset usage"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isPending}
                    className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white disabled:opacity-50"
                  >
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
