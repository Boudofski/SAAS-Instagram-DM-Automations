export const ACCOUNT_DELETION_CONFIRMATION_PREFIX = "DELETE";

export function getAccountDeletionConfirmation(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return normalizedEmail
    ? `${ACCOUNT_DELETION_CONFIRMATION_PREFIX} ${normalizedEmail}`
    : ACCOUNT_DELETION_CONFIRMATION_PREFIX;
}

export function isAccountDeletionConfirmationValid(value: string, email: string) {
  return value.trim().toLowerCase() === getAccountDeletionConfirmation(email).toLowerCase();
}
