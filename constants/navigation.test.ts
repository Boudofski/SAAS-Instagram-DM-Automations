import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("primary navigation", () => {
  it("uses Instagram Account instead of Integrations in primary sidebar config", () => {
    const source = readFileSync(join(process.cwd(), "components/global/sidebar/index.tsx"), "utf8");

    expect(source).toContain('label: "Instagram Account"');
    expect(source).not.toContain('label: "Integrations"');
  });
});
