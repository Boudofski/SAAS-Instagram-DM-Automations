// Additive rollout: keep extra connections closed until the account-aware
// runtime is live and the legacy inbox uniqueness constraint is removed.
export const MULTI_ACCOUNT_CONNECTIONS_ENABLED = process.env.NODE_ENV === "test";
