import { expect, it, vi } from "vitest";
vi.mock("next/font/local", () => ({ default: () => ({ className: "" }) }));
vi.mock("next/font/google", () => ({ Inter: () => ({ className: "" }) }));
vi.mock("@/lib/i18n/server", () => ({ getServerLocale: () => "en" }));
vi.mock("@/lib/editorial-server", () => ({
  getPublishedPosts: vi
    .fn()
    .mockRejectedValue(new Error("database unavailable")),
}));
import LandingPage from "./page";
it("still produces the public homepage when the optional editorial feed is unavailable", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const result = await LandingPage();
  expect(result).toBeTruthy();
  expect(log).toHaveBeenCalledWith("AP3K homepage: editorial feed unavailable");
  log.mockRestore();
});
