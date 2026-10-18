import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("account recreation hotfix contracts", () => {
  it("provisions an AP3K profile before entering the dashboard", () => {
    const userActions = source("actions/user/index.ts");
    const dashboardEntry = source("app/(protected)/dashboard/page.tsx");

    expect(userActions).toContain("export const ensureCurrentUserProfile");
    expect(userActions).toContain("const racedProfile = await findUser(user.id)");
    expect(dashboardEntry).toContain("await onboardUser()");
    expect(dashboardEntry).toContain("user.status === 200 || user.status === 201");
  });

  it("routes an authenticated user with no local profile back through provisioning", () => {
    const dashboardLayout = source("app/(protected)/dashboard/[slug]/layout.tsx");

    expect(dashboardLayout).toContain("if (userResult.status !== 200)");
    expect(dashboardLayout).toContain('redirect("/dashboard")');
  });

  it("uses an explicit dark onboarding surface with readable inherited text", () => {
    const onboardingLayout = source("app/(protected)/onboarding/layout.tsx");

    expect(onboardingLayout).toContain("dark:bg-[#050816]");
    expect(onboardingLayout).toContain("dark:bg-[#0f172a]");
    expect(onboardingLayout).toContain("dark:text-slate-50");
    expect(onboardingLayout).not.toContain("dark:bg-[#0f172a]/78");
  });

  it("clears the Clerk browser session after successful account deletion", () => {
    const button = source("components/settings/delete-account-button.tsx");

    expect(button).toContain('import { useClerk } from "@clerk/nextjs"');
    expect(button).toContain('await clerk.signOut({ redirectUrl: "/?account_deleted=1" })');
    expect(button).toContain("await clerk.setActive({ session: null })");
    expect(button).toContain('window.location.replace("/?account_deleted=1")');
  });
});
