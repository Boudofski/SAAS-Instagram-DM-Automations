import { getPlanLimits, isUnlimited, type PlanLimit } from "./plan-limits";

const plans = ["FREE", "PRO", "BUSINESS"] as const;

export function suggestPublicPlan(input: {
  actions: number;
  accounts: number;
  automations: number;
  paidFeatures: boolean;
}) {
  const fits = (required: number, available: PlanLimit) => isUnlimited(available) || required <= available;
  return plans.find(plan => {
    const limits = getPlanLimits(plan);
    return !(input.paidFeatures && plan === "FREE")
      && fits(input.actions, limits.staticRepliesPerMonth)
      && fits(input.accounts, limits.connectedInstagramAccounts)
      && fits(input.automations, limits.activeCampaigns);
  }) ?? null;
}
