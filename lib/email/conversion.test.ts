import { describe, it, expect, vi } from "vitest";
import { buildEmailTemplate, EMAIL_TEMPLATE_IDS } from "./catalog";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { renderAp3kEmail } from "./render";
vi.mock("@/lib/prisma", () => ({ client: {} }));
vi.mock("@/actions/usage/queries", () => ({ getUserMonthlyUsage: vi.fn() }));
vi.mock("./delivery", () => ({
  sendAp3kEmail: vi.fn(),
  getEmailConfiguration: vi.fn(),
}));
import { usageNotice } from "./usage-alerts";
import type { UsageSummary } from "@/lib/plan-limits";
describe("localized conversion emails", () => {
  for (const locale of SUPPORTED_LOCALES)
    it(`provides every service email in ${locale}`, async () => {
      for (const id of EMAIL_TEMPLATE_IDS) {
        const content = buildEmailTemplate(
          id,
          { locale, actionsUsed: 500, actionLimit: 500 },
          "https://ap3k.com",
        );
        expect(content.headline.length).toBeGreaterThan(4);
        expect(
          content.paragraphs.every(
            (p) => typeof p === "string" && p.length > 0,
          ),
        ).toBe(true);
        if (locale !== "en")
          expect(content.headline).not.toBe(
            buildEmailTemplate(id, {}, "https://ap3k.com").headline,
          );
      }
      const rendered = await renderAp3kEmail({
        templateId: "usage_limit_reached",
        context: { locale },
        appUrl: "https://ap3k.com",
      });
      expect(rendered.html).toContain(`lang="${locale}"`);
      expect(rendered.html).toContain(
        `dir="${locale === "ar" ? "rtl" : "ltr"}"`,
      );
    });
  it("respects free, custom and unlimited usage thresholds", () => {
    const notice = (used: number, limit: number | "unlimited") =>
      usageNotice({ staticReplies: { used, limit } } as UsageSummary);
    expect(notice(399, 500)).toBeNull();
    expect(notice(400, 500)).toBe("usage_80_percent");
    expect(notice(500, 500)).toBe("usage_limit_reached");
    expect(notice(500, 100000)).toBeNull();
    expect(notice(80000, 100000)).toBe("usage_80_percent");
    expect(notice(100000, "unlimited")).toBeNull();
  });
  it("preserves support content and metric values", () => {
    expect(
      buildEmailTemplate(
        "support_reply",
        { locale: "ar", supportReply: "Customer-specific answer" },
        "https://ap3k.com",
      ).paragraphs,
    ).toContain("Customer-specific answer");
    expect(
      buildEmailTemplate(
        "weekly_report",
        {
          locale: "fr",
          weeklyLeads: 12,
          weeklyReplies: 34,
          weeklyDms: 56,
          weeklyComments: 78,
        },
        "https://ap3k.com",
      ).metrics?.map((m) => m.value),
    ).toEqual(["12", "34", "56", "78"]);
  });
});
