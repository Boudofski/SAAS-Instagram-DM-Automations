import {
  formatUsageMetricValue,
  isUnlimited,
  usageTone,
  type UsageMetric,
} from "@/lib/plan-limits";

export type BillingMetricKind = "default" | "accounts";

export function getBillingUsagePresentation(
  metric: UsageMetric,
  kind: BillingMetricKind = "default",
  helper?: string
) {
  const accountLimitReached = kind === "accounts" && !isUnlimited(metric.limit) && metric.used >= metric.limit;
  const tone = accountLimitReached ? "amber" : usageTone(metric.percent, metric.blocked);
  const value = kind === "accounts" && !isUnlimited(metric.limit)
    ? `${metric.used.toLocaleString()} of ${metric.limit.toLocaleString()} accounts connected`
    : formatUsageMetricValue(metric);
  const description = accountLimitReached
    ? "Plan account limit reached"
    : helper ?? (metric.blocked ? "Limit reached" : isUnlimited(metric.limit) ? "Unlimited" : `${metric.remaining?.toLocaleString()} remaining`);

  return { tone, value, description };
}
