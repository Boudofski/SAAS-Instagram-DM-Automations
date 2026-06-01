"use client";

import { useState, useTransition } from "react";
import { V2Badge } from "@/components/admin-v2/v2-badge";
import LocalTime from "@/components/global/local-time";
import { adminUpdateUserBillingOverridesAction } from "@/actions/admin/user-actions";
import type { AdminV2UserDetail } from "@/lib/admin-v2/queries";
import type { UsageSummary } from "@/lib/plan-limits";
import { getPlanLimits, type ProductPlan } from "@/lib/plan-limits";

type Props = {
  user: AdminV2UserDetail;
  usage: UsageSummary | null;
};

export function InternalOverridesCard({ user, usage }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [monthlyReply, setMonthlyReply] = useState(user.monthlyReplyLimitOverride?.toString() ?? "");
  const [aiReply, setAiReply] = useState(user.aiReplyLimitOverride?.toString() ?? "");
  const [activeCampaign, setActiveCampaign] = useState(user.activeCampaignLimitOverride?.toString() ?? "");
  const [connectedAccount, setConnectedAccount] = useState(user.connectedAccountLimitOverride?.toString() ?? "");
  const [expiresAt, setExpiresAt] = useState(user.overrideExpiresAt ? new Date(user.overrideExpiresAt).toISOString().split("T")[0] : "");
  const [reason, setReason] = useState(user.overrideReason ?? "");

  const isOverrideActive = !!(user.overrideReason && (!user.overrideExpiresAt || new Date(user.overrideExpiresAt) > new Date()));
  const isOverrideExpired = !!(user.overrideExpiresAt && new Date(user.overrideExpiresAt) <= new Date());

  const planLimits = getPlanLimits(user.plan as ProductPlan);

  function openModal() {
    setIsModalOpen(true);
    setError(null);
    setSuccessMsg(null);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!reason.trim()) {
      setError("Reason is required.");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("userId", user.id);
      fd.set("reason", reason);
      fd.set("monthlyReplyLimitOverride", monthlyReply);
      fd.set("aiReplyLimitOverride", aiReply);
      fd.set("activeCampaignLimitOverride", activeCampaign);
      fd.set("connectedAccountLimitOverride", connectedAccount);
      fd.set("overrideExpiresAt", expiresAt);

      const res = await adminUpdateUserBillingOverridesAction(fd);
      if (res.status === 200) {
        setSuccessMsg("Overrides updated successfully.");
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        setError(res.data as string);
      }
    });
  }

  async function handleClear() {
    setError(null);
    if (!reason.trim()) {
        setError("Reason is required to clear overrides.");
        return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("userId", user.id);
      fd.set("reason", reason);
      fd.set("monthlyReplyLimitOverride", "");
      fd.set("aiReplyLimitOverride", "");
      fd.set("activeCampaignLimitOverride", "");
      fd.set("connectedAccountLimitOverride", "");
      fd.set("overrideExpiresAt", "");

      const res = await adminUpdateUserBillingOverridesAction(fd);
      if (res.status === 200) {
        setSuccessMsg("Overrides cleared.");
        setMonthlyReply("");
        setAiReply("");
        setActiveCampaign("");
        setConnectedAccount("");
        setExpiresAt("");
        setReason("");
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        setError(res.data as string);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#111827] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500">
          Internal access overrides
        </h2>
        <button
          onClick={openModal}
          className="text-[11px] font-bold text-pink-400 hover:text-pink-300 transition-colors uppercase tracking-wider"
        >
          Edit internal overrides
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OverrideField
          label="Status"
          value={
            <div className="flex items-center gap-2">
              {isOverrideActive ? (
                <V2Badge tone="pink">Override active</V2Badge>
              ) : isOverrideExpired ? (
                <V2Badge tone="amber">Override expired</V2Badge>
              ) : (
                <V2Badge tone="slate">Inactive</V2Badge>
              )}
            </div>
          }
        />
        <OverrideField
          label="Static Replies"
          value={usage?.staticReplies.limit.toLocaleString() ?? "—"}
          sub={isOverrideActive && user.monthlyReplyLimitOverride !== null ? `Plan default: ${planLimits.staticRepliesPerMonth.toLocaleString()}` : undefined}
        />
        <OverrideField
          label="AI Replies"
          value={usage?.aiReplies.limit.toLocaleString() ?? "—"}
          sub={isOverrideActive && user.aiReplyLimitOverride !== null ? `Plan default: ${planLimits.aiRepliesPerMonth.toLocaleString()}` : undefined}
        />
        <OverrideField
          label="Active Campaigns"
          value={usage?.activeCampaigns.limit.toLocaleString() ?? "—"}
          sub={isOverrideActive && user.activeCampaignLimitOverride !== null ? `Plan default: ${planLimits.activeCampaigns.toLocaleString()}` : undefined}
        />
        <OverrideField
            label="Connected Accounts"
            value={usage?.connectedAccounts.limit.toLocaleString() ?? "—"}
            sub={isOverrideActive && user.connectedAccountLimitOverride !== null ? `Plan default: ${planLimits.connectedInstagramAccounts.toLocaleString()}` : undefined}
        />
        {user.overrideExpiresAt && (
            <OverrideField
                label="Expires At"
                value={<LocalTime value={user.overrideExpiresAt} />}
            />
        )}
        {user.overrideReason && (
            <div className="sm:col-span-2 lg:col-span-4 mt-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Last Override Reason
                </p>
                <p className="mt-1 text-xs text-slate-400 italic">&quot;{user.overrideReason}&quot;</p>
            </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1117] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-black text-white">Edit internal access overrides</h2>
            <p className="mt-2 text-xs text-slate-400">
              These overrides affect AP3k internal limits only. Stripe billing is not modified.
            </p>

            {successMsg ? (
              <div className="mt-6">
                <p className="rounded-lg bg-green-900/30 px-3 py-2 text-sm text-green-300">
                  {successMsg}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSave} className="mt-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-400">Monthly replies override</label>
                    <input
                      type="number"
                      value={monthlyReply}
                      onChange={(e) => setMonthlyReply(e.target.value)}
                      placeholder="Plan default"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-400">AI replies override</label>
                    <input
                      type="number"
                      value={aiReply}
                      onChange={(e) => setAiReply(e.target.value)}
                      placeholder="Plan default"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-400">Active campaigns override</label>
                    <input
                      type="number"
                      value={activeCampaign}
                      onChange={(e) => setActiveCampaign(e.target.value)}
                      placeholder="Plan default"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-slate-400">Connected accounts override</label>
                    <input
                      type="number"
                      value={connectedAccount}
                      onChange={(e) => setConnectedAccount(e.target.value)}
                      placeholder="Plan default"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-400">Expiration date (optional)</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-400">Reason <span className="text-pink-400">*</span></label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    placeholder="Why are you applying this override?"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                  />
                </div>

                {!expiresAt && (
                  <p className="rounded-lg border border-slate-700 bg-white/[0.02] px-3 py-2 text-[11px] text-slate-500">
                    No expiration set — these overrides will persist indefinitely. Consider setting an expiry date.
                  </p>
                )}

                {error && (
                  <p className="rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-300">
                    {error}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
                  >
                    {isPending ? "Saving..." : "Save overrides"}
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={isPending}
                    className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white disabled:opacity-50"
                  >
                    Clear overrides
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white"
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

function OverrideField({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
        {label}
      </p>
      <div className="mt-1 text-sm text-slate-300 font-bold">{value}</div>
      {sub && <p className="mt-0.5 text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}
