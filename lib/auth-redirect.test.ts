import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("authentication redirects", () => {
  it("sends sign-ins and new sign-ups through dashboard workspace routing", () => {
    const signIn = source("app/(auth)/sign-in/[[...sign-in]]/page.tsx");
    const signUp = source("app/(auth)/sign-up/[[...sign-up]]/page.tsx");

    expect(signIn).toContain('mode="sign-in"');
    expect(signUp).toContain('mode="sign-up"');

    const experience = source("components/auth/auth-experience.tsx");
    expect(experience).toContain("signUpForceRedirectUrl=\"/dashboard\"");
    expect(experience).not.toContain("'/onboarding'");
  });
});
