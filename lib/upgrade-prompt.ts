export const UPGRADE_EVENT = "ap3k:upgrade-required";
export function requestUpgradeForResult(result: unknown): boolean {
  if (
    !result ||
    typeof result !== "object" ||
    !("code" in result) ||
    result.code !== "PLAN_LIMIT"
  )
    return false;
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(UPGRADE_EVENT));
  return true;
}
