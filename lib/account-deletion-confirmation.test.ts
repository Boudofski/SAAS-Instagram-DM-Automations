import { describe, expect, it } from "vitest";
import {
  getAccountDeletionConfirmation,
  isAccountDeletionConfirmationValid,
} from "@/lib/account-deletion-confirmation";

describe("account deletion confirmation", () => {
  it("builds an account-specific confirmation phrase", () => {
    expect(getAccountDeletionConfirmation(" Creator@Example.COM ")).toBe(
      "DELETE creator@example.com"
    );
  });

  it("accepts only the signed-in account confirmation", () => {
    expect(
      isAccountDeletionConfirmationValid(
        "DELETE creator@example.com",
        "creator@example.com"
      )
    ).toBe(true);
    expect(
      isAccountDeletionConfirmationValid(
        "DELETE another@example.com",
        "creator@example.com"
      )
    ).toBe(false);
  });
});
