export const AUTOPILOT_KEYS = ["creator_test", "creator_launch", "ecommerce_test", "ecommerce_launch"] as const;
export type AutopilotKey = (typeof AUTOPILOT_KEYS)[number];
export type EmailDecision = { variant: "standard" | "checklist"; delayHours: 0 | 6 | 12 };
export type EmailPlan = Record<AutopilotKey, EmailDecision>;
export function defaultEmailPlan(): EmailPlan {
  return Object.fromEntries(AUTOPILOT_KEYS.map(key => [key, { variant: "standard", delayHours: 0 }])) as EmailPlan;
}
export function parseEmailPlan(value: unknown): EmailPlan | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== AUTOPILOT_KEYS.length) return null;
  const result = defaultEmailPlan();
  for (const key of AUTOPILOT_KEYS) {
    const item = record[key];
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const decision = item as Record<string, unknown>;
    if (Object.keys(decision).some(field => !["variant", "delayHours"].includes(field))) return null;
    if (!["standard", "checklist"].includes(String(decision.variant)) ||
        typeof decision.delayHours !== "number" || ![0, 6, 12].includes(decision.delayHours)) return null;
    result[key] = decision as EmailDecision;
  }
  return result;
}
