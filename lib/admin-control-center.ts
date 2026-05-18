export type AdminIssueInput = {
  lastPostRaw?: unknown;
  signatureFailures24h: number;
  dmCapabilityMissing: boolean;
  tokenMissingFailures24h: number;
  dmFailed24h: number;
  activeCampaigns: number;
};

const SENSITIVE_KEY_PATTERN =
  /(token|secret|authorization|client_secret|access_token|page_access_token|stripe_secret|webhook_secret)/i;

export function sanitizeAdminPayload(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => sanitizeAdminPayload(item));
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : sanitizeAdminPayload(item),
    ])
  );
}

export function adminEnvironmentLabel() {
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    return "Production";
  }
  if (process.env.VERCEL_ENV === "preview") return "Preview";
  return "Development";
}

export function stripeCustomerDashboardUrl(customerId?: string | null) {
  if (!customerId) return null;
  return `https://dashboard.stripe.com/customers/${encodeURIComponent(customerId)}`;
}

export function formatAdminDate(value?: Date | string | null) {
  if (!value) return "Never";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString();
}

export function classifyDeliveryError(error?: string | null) {
  const text = error ?? "";
  if (text.includes("dm_capability_missing") || text.includes("code=3")) {
    return {
      label: "Meta capability missing",
      detail: "Requires instagram_manage_messages approval.",
      tone: "red" as const,
    };
  }
  if (text.includes("token_missing")) {
    return {
      label: "Reconnect account",
      detail: "Page token missing or unavailable.",
      tone: "amber" as const,
    };
  }
  if (!text) {
    return { label: "No error", detail: "No delivery error recorded.", tone: "green" as const };
  }
  return { label: "Meta/API error", detail: text, tone: "amber" as const };
}

export function getTopAdminIssue(input: AdminIssueInput) {
  if (!input.lastPostRaw) {
    return {
      label: "No real webhook delivered yet",
      detail:
        "Meta has not delivered a recent POST. In Development mode, connected account and commenter must be accepted app testers/admins/developers.",
      tone: "red" as const,
    };
  }
  if (input.signatureFailures24h > 0) {
    return {
      label: "Webhook signature failures",
      detail: `${input.signatureFailures24h} signature failure(s) in the last 24h.`,
      tone: "red" as const,
    };
  }
  if (input.dmCapabilityMissing) {
    return {
      label: "Private DM blocked by Meta",
      detail: "Meta is returning code=3. Public replies can still work while instagram_manage_messages is pending.",
      tone: "red" as const,
    };
  }
  if (input.tokenMissingFailures24h > 0) {
    return {
      label: "Reconnect required",
      detail: `${input.tokenMissingFailures24h} token_missing failure(s) in the last 24h.`,
      tone: "amber" as const,
    };
  }
  if (input.dmFailed24h > 5) {
    return {
      label: "Elevated DM failures",
      detail: `${input.dmFailed24h} private DM failure(s) in the last 24h.`,
      tone: "amber" as const,
    };
  }
  if (input.activeCampaigns === 0) {
    return {
      label: "No active campaigns",
      detail: "Users have not activated any campaign yet.",
      tone: "amber" as const,
    };
  }
  return {
    label: "No active issue",
    detail: "Core delivery signals are healthy based on recent records.",
    tone: "green" as const,
  };
}
