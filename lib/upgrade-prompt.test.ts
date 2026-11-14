import { it, expect, vi, afterEach } from "vitest";
import { requestUpgradeForResult, UPGRADE_EVENT } from "./upgrade-prompt";
afterEach(() => vi.unstubAllGlobals());
it("opens pricing only for a structured plan limit, never an auth or server failure", () => {
  const dispatchEvent = vi.fn();
  vi.stubGlobal("window", { dispatchEvent });
  for (const result of [
    null,
    { status: 403, error: "Reconnect Instagram" },
    { status: 500 },
    { code: "AUTH_REQUIRED" },
    { status: 200 },
  ])
    expect(requestUpgradeForResult(result)).toBe(false);
  expect(dispatchEvent).not.toHaveBeenCalled();
  expect(requestUpgradeForResult({ code: "PLAN_LIMIT", status: 403 })).toBe(
    true,
  );
  expect(dispatchEvent.mock.calls[0][0].type).toBe(UPGRADE_EVENT);
});
