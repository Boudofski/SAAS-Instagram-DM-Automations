import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SUPPORTED_LOCALES, type Locale } from "./config";
import { SETUP_ROWS } from "./setup-copy";
import { translateUi } from "./translate";
import WizardPage from "@/app/(protected)/dashboard/[slug]/automation/new/page";
import MessageAutomationPreview from "@/components/automations/message-automation-preview";
import type { WizardData, WizardStep } from "@/hooks/use-wizard";

let locale: Locale = "en";
let step: WizardStep = 1;
const data: WizardData = {
  campaignName: "Save こんにちは", post: { postid: "ANY", media: "", mediaType: "IMAGE", caption: "Any post - triggers on all Instagram posts" },
  triggerMode: "SPECIFIC_KEYWORD", keywords: ["hello こんにちは"], matchingMode: "CONTAINS",
  publicReplyEnabled: true, publicReply: "Keep my reply unchanged", publicReply2: "", publicReply3: "",
  sendPrivateDm: true, dmMessage: "Keep my DM unchanged", linkButtons: [{ label: "Save", url: "https://example.com" }],
  openingDmEnabled: true, openingDmText: "Keep my opener", openingDmButtonText: "Continue",
  followGateRequired: true, followRequestDmText: "Keep my follow request", followRequestButtonText: "Following",
  aiReplyEnabled: false, aiReplyTone: "FRIENDLY", aiReplyInstructions: "", aiProtectionRules: {} as WizardData["aiProtectionRules"], active: true,
};
vi.mock("@/providers/i18n-provider", () => ({ useI18n: () => ({ locale }) }));
vi.mock("@/components/ui/dialog", () => ({ Dialog: ({children}: any) => <>{children}</>, DialogContent: ({children}: any) => <section>{children}</section>, DialogTitle: ({children}: any) => <h1>{children}</h1>, DialogDescription: ({children}: any) => <p>{children}</p> }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/actions/automation", () => ({ saveMessageAutomation: vi.fn() }));
vi.mock("@/actions/ai-workspace", () => ({ getAiWorkspace: vi.fn() }));
vi.mock("@/hooks/use-wizard", () => ({ useWizard: () => ({ step, data, update: vi.fn(), next: vi.fn(), back: vi.fn(), goTo: vi.fn(), canAdvance: () => true, activate: vi.fn(), isSubmitting: false, error: null }) }));
vi.mock("@/hooks/user-queries", () => ({
  useQueryAutomationPosts: () => ({ data: { data: { data: [] } } }), useQueryWebhookHealth: () => ({}), useQueryAutomations: () => ({}),
  useQueryUser: () => ({ data: { data: { integrations: [{ id: "fixture", name: "INSTAGRAM", token: "fixture", instagramUsername: "boudofi" }], subscription: { plan: "FREE" } } } }),
}));
vi.mock("@/lib/app-review-mode", () => ({ isAppReviewMode: () => true }));
vi.mock("@/lib/messaging-review-mode", () => ({ isMessagingReviewMode: () => false, applyMessagingReviewCampaignDefaults: (value: unknown) => value }));
const plain = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"');

describe("automation setup localization", () => {
  it("keeps complete catalogs and substitution tokens in all supported languages", () => {
    expect(new Set(SETUP_ROWS.map(r => r[0])).size).toBe(SETUP_ROWS.length);
    for (const row of SETUP_ROWS) {
      expect(row).toHaveLength(5);
      const tokens = row[0].match(/\{\w+\}/g)?.sort() ?? [];
      for (const text of row) { expect(text.trim()).not.toBe(""); expect(text.match(/\{\w+\}/g)?.sort() ?? []).toEqual(tokens); }
    }
  });
  it("renders all four actual comment setup steps in every language and returns exactly to English", () => {
    const headings = ["Choose a post or Reel", "What comment starts this automation?", "What should AP3K do?", "Review & Activate"];
    for (step of [1, 2, 3, 4] as WizardStep[]) {
      let english = "";
      for (locale of [...SUPPORTED_LOCALES, "en"] as Locale[]) {
        const html = renderToStaticMarkup(<WizardPage params={{ slug: "fixture" }} searchParams={{ type: "comment" }} />);
        const text = plain(html);
        expect(text).toContain(translateUi(headings[step - 1], locale));
        if (locale !== "en") expect(text).not.toContain(headings[step - 1]);
        if (step === 3) { expect(text).toContain("Keep my DM unchanged"); expect(html).toContain('value="Keep my reply unchanged"'); }
        if (step === 4 && locale !== "en") expect(text).not.toContain("Keyword:");
        if (step === 4) { expect(text).toContain("Save こんにちは"); expect(text).toContain("hello こんにちは"); }
        expect(html).not.toContain("Step</span>1");
        if (locale === "en") { if (english) expect(html).toBe(english); english = html; }
      }
    }
  });
  it("renders the actual type picker and both message entry screens without English headings", () => {
    for (locale of SUPPORTED_LOCALES) {
      const picker = plain(renderToStaticMarkup(<WizardPage params={{ slug: "fixture" }} />));
      for (const label of ["Automation templates", "Auto-DM links from comments", "Send affiliate product links"]) expect(picker).toContain(translateUi(label, locale));
      expect(picker).not.toContain("Start from scratch");
      for (const type of ["story", "dm"]) {
        const text = plain(renderToStaticMarkup(<WizardPage params={{ slug: "fixture" }} searchParams={{ type }} />));
        const heading = type === "story" ? "When someone interacts with your story" : "When someone sends you a DM";
        expect(text).toContain(translateUi(heading, locale));
        if (locale !== "en") expect(text).not.toContain(heading);
      }
    }
  });
  it("translates generated preview events while preserving customer messages, keywords and button labels", () => {
    for (locale of SUPPORTED_LOCALES) {
      const html = renderToStaticMarkup(<MessageAutomationPreview source="DM" step={2} trigger="MENTION" triggerMode="SPECIFIC_KEYWORD" keywords={["hello こんにちは"]} message="Keep my DM unchanged" linkButtons={[{ label: "Save", url: "https://example.com" }]} followGateRequired followRequestDmText="Keep my follow request" followRequestButtonText="Following" />);
      expect(html).toContain("hello こんにちは"); expect(html).toContain("Keep my DM unchanged"); expect(html).toContain("Keep my follow request"); expect(html).toContain('dir="auto"');
      expect(plain(html)).toContain(translateUi("Follow", locale));
    }
  });
});
