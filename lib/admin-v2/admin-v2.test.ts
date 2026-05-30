import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("Admin v2 — Phase 1 safety invariants", () => {
  it("query layer never selects the token field from Integrations", () => {
    const queries = read("lib/admin-v2/queries.ts");
    // Confirm safety comment is present
    expect(queries).toContain("token field is intentionally NOT selected");
    // The word 'token' must not appear as a selected field key
    // (allow it in comments and the comment string itself)
    const lines = queries.split("\n").filter((line) => {
      const trimmed = line.trim();
      return trimmed.startsWith("token:") || trimmed === "token,";
    });
    expect(lines).toHaveLength(0);
  });

  it("layout calls requireOwnerAdmin before rendering children", () => {
    const layout = read("app/(protected)/ap3k-admin-v2/layout.tsx");
    expect(layout).toContain("requireOwnerAdmin");
    expect(layout).toContain("await requireOwnerAdmin()");
  });

  it("individual pages do not duplicate the admin auth check — layout covers it", () => {
    const pages = [
      "app/(protected)/ap3k-admin-v2/overview/page.tsx",
      "app/(protected)/ap3k-admin-v2/users/page.tsx",
      "app/(protected)/ap3k-admin-v2/accounts/page.tsx",
      "app/(protected)/ap3k-admin-v2/campaigns/page.tsx",
      "app/(protected)/ap3k-admin-v2/replies/page.tsx",
      "app/(protected)/ap3k-admin-v2/activity/page.tsx",
      "app/(protected)/ap3k-admin-v2/diagnostics/page.tsx",
    ];
    for (const p of pages) {
      const src = read(p);
      expect(src, `${p} should not call requireOwnerAdmin — layout handles it`).not.toContain("requireOwnerAdmin");
    }
  });

  it("accounts page tells the user tokens are never displayed", () => {
    const accounts = read("app/(protected)/ap3k-admin-v2/accounts/page.tsx");
    expect(accounts).toContain("tokens are never displayed");
  });

  it("diagnostics page has app review notes behind an advanced panel", () => {
    const diag = read("app/(protected)/ap3k-admin-v2/diagnostics/page.tsx");
    expect(diag).toContain("AdvancedPanel");
    expect(diag).toContain("App Review Notes");
    expect(diag).toContain("not visible to users or Meta App Review");
  });

  it("query layer is bounded — every findMany has a take clause", () => {
    const queries = read("lib/admin-v2/queries.ts");
    expect(queries).toContain("const LIST_LIMIT = 50");
    const findManyCount = (queries.match(/\.findMany\(/g) ?? []).length;
    const takeCount = (queries.match(/\btake:/g) ?? []).length;
    expect(takeCount, "every findMany must have a take: to prevent unbounded queries").toBeGreaterThanOrEqual(findManyCount);
  });

  it("nav component links back to admin v1", () => {
    const nav = read("components/admin-v2/nav.tsx");
    expect(nav).toContain("href=\"/admin\"");
    expect(nav).toContain("Admin v1");
  });

  it("advanced panel is collapsed by default (useState false)", () => {
    const panel = read("components/admin-v2/advanced-panel.tsx");
    expect(panel).toContain("useState(false)");
  });

  it("overview page renders all 6 stat cards", () => {
    const overview = read("app/(protected)/ap3k-admin-v2/overview/page.tsx");
    expect(overview).toContain("Total users");
    expect(overview).toContain("Connected accounts");
    expect(overview).toContain("Active campaigns");
    expect(overview).toContain("Replies today");
    expect(overview).toContain("Leads today");
    expect(overview).toContain("Failed today");
  });

  it("users table renders empty state", () => {
    const users = read("app/(protected)/ap3k-admin-v2/users/page.tsx");
    expect(users).toContain("No users found.");
  });

  it("campaigns table renders empty state", () => {
    const campaigns = read("app/(protected)/ap3k-admin-v2/campaigns/page.tsx");
    expect(campaigns).toContain("No campaigns found.");
  });

  it("accounts table renders empty state", () => {
    const accounts = read("app/(protected)/ap3k-admin-v2/accounts/page.tsx");
    expect(accounts).toContain("No accounts found.");
  });

  it("activity table renders empty state", () => {
    const activity = read("app/(protected)/ap3k-admin-v2/activity/page.tsx");
    expect(activity).toContain("No activity events found.");
  });

  it("reply templates page acknowledges no separate model", () => {
    const replies = read("app/(protected)/ap3k-admin-v2/replies/page.tsx");
    expect(replies).toContain("No separate reply template model exists");
  });

  it("root page redirects to overview", () => {
    const root_ = read("app/(protected)/ap3k-admin-v2/page.tsx");
    expect(root_).toContain('redirect("/ap3k-admin-v2/overview")');
  });
});
