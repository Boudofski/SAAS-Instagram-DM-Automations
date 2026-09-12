import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("authentication redirects", () => {
  it("always sends completed sign-ins and sign-ups through workspace routing", () => {
    const signIn = source("app/(auth)/sign-in/[[...sign-in]]/page.tsx");
    const signUp = source("app/(auth)/sign-up/[[...sign-up]]/page.tsx");

    expect(signIn).toContain('<SignIn forceRedirectUrl="/dashboard" />');
    expect(signUp).toContain('<SignUp forceRedirectUrl="/dashboard" />');
  });
});
