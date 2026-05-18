import { describe, expect, it } from "vitest";
import { nextThemeMode, normalizeThemeMode } from "./theme-mode";

describe("theme mode helpers", () => {
  it("normalizes unsupported values to system", () => {
    expect(normalizeThemeMode("dark")).toBe("dark");
    expect(normalizeThemeMode("light")).toBe("light");
    expect(normalizeThemeMode("system")).toBe("system");
    expect(normalizeThemeMode("unexpected")).toBe("system");
    expect(normalizeThemeMode(undefined)).toBe("system");
  });

  it("cycles compact theme toggle dark -> light -> system -> dark", () => {
    expect(nextThemeMode("dark")).toBe("light");
    expect(nextThemeMode("light")).toBe("system");
    expect(nextThemeMode("system")).toBe("dark");
    expect(nextThemeMode("bad-value")).toBe("dark");
  });
});
