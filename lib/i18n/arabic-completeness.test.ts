import { describe, expect, it } from "vitest";
import { HOME_FEATURES_COPY } from "./home-features";
import { translatePublicShell } from "./public-shell";
import { translateUi } from "./translate";

const SCREENSHOT_UI = [
  "Start free. Grow at your pace.",
  "Compare plans & features",
  "Frequently asked questions",
  "New automation",
  "Search",
  "Flow",
  "Basic",
  "All",
  "ENABLED",
  "MONTHLY USAGE",
  "Recent automations",
  "AUTOMATION",
  "Chat automation",
  "Post automation",
  "Replies to keywords sent in DMs",
  "Download CSV",
  "Filter",
  "Phone",
  "Email",
  "Created on",
  "Last interacted on",
  "Newest",
  "Showing your 100 most recent conversations.",
  "Reply to this Instagram conversation…",
  "Enter to send · Shift + Enter for a new line",
] as const;

describe("Arabic product completeness", () => {
  it("translates every interface label visible in the Arabic regression screenshots", () => {
    for (const source of SCREENSHOT_UI) {
      expect(translateUi(source, "ar"), source).not.toBe(source);
    }
  });

  it("uses the Arabic homepage feature catalog instead of the English fallback", () => {
    expect(HOME_FEATURES_COPY.ar.kicker).toMatch(/[\u0600-\u06ff]/);
    expect(HOME_FEATURES_COPY.ar.title).toMatch(/[\u0600-\u06ff]/);
    for (const card of [...HOME_FEATURES_COPY.ar.featured, ...HOME_FEATURES_COPY.ar.cards]) {
      expect(card.title).toMatch(/[\u0600-\u06ff]/);
      expect(card.description).toMatch(/[\u0600-\u06ff]/);
    }
  });

  it("translates the complete footer navigation used on Arabic public pages", () => {
    for (const source of [
      "Product", "Instagram automation", "Free Instagram automation",
      "Comment to DM", "Resources", "Documentation", "Solutions",
      "Grow followers", "Compare", "About AP3K", "Contact us",
    ]) expect(translatePublicShell(source, "ar"), source).not.toBe(source);
  });
});
