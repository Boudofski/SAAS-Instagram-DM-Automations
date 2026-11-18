import { describe, expect, it } from "vitest";
import { getDocsArticle } from "../docs";
import { localizeDocsArticle } from "./docs-ar-articles";

const slugs = [
  "getting-started/connect-instagram-account",
  "post-automation/create-instagram-comment-to-dm-automation",
  "post-automation/instagram-automation-triggers",
] as const;

describe("Arabic documentation onboarding", () => {
  it.each(slugs)("localizes %s without changing article structure", (slug) => {
    const original = getDocsArticle(slug);
    expect(original).toBeDefined();
    if (!original) return;
    const ar = localizeDocsArticle(original, "ar");
    expect(ar.title).toMatch(/[\u0600-\u06ff]/);
    expect(ar.description).toMatch(/[\u0600-\u06ff]/);
    expect(ar.html).toMatch(/[\u0600-\u06ff]/);
    expect(ar.headings.map(({ id }) => id)).toEqual(original.headings.map(({ id }) => id));
    for (const heading of ar.headings) {
      expect(heading.text).toMatch(/[\u0600-\u06ff]/);
      expect(ar.html).toContain(`id="${heading.id}"`);
    }
    // Screenshot insertion and deep links depend on the original anchor IDs.
    for (const match of original.html.matchAll(/href="(\/docs\/[^"]+)"/g)) {
      expect(ar.html).toContain(`href="${match[1]}"`);
    }
    // English and other locales must keep their original published content.
    expect(localizeDocsArticle(original, "en")).toBe(original);
    expect(localizeDocsArticle(original, "fr")).toBe(original);
    expect(original.html).not.toBe(ar.html);
  });

  it("does not alter an article without reviewed Arabic content", () => {
    const original = getDocsArticle("post-automation/choose-which-post-or-reel-to-automate");
    expect(original).toBeDefined();
    if (original) expect(localizeDocsArticle(original, "ar")).toBe(original);
  });
});
