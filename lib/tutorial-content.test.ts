import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { BLOG_POSTS } from "./blog";
import { AP3K_HELP_ARTICLES } from "./ap3k-help";
import { HELP_TUTORIALS, ILLUSTRATED_POSTS, TUTORIAL_SCREENSHOTS, tutorialImageSrc } from "./tutorial-content";
import { translateUi } from "./i18n/translate";

describe("illustrated tutorials", () => {
  it("uses all twelve supplied screenshots in blog sections and matching help entries", () => {
    const ids = Object.keys(TUTORIAL_SCREENSHOTS).sort();
    expect(ids).toHaveLength(12);
    expect([...new Set(ILLUSTRATED_POSTS.flatMap(post => post.sections.flatMap(section => section.screenshot ?? [])))].sort()).toEqual(ids);
    expect([...new Set(Object.values(HELP_TUTORIALS).flatMap(entry => entry.screenshots))].sort()).toEqual(ids);
    for (const [slug, entry] of Object.entries(HELP_TUTORIALS)) {
      expect(AP3K_HELP_ARTICLES.some(article => article.slug === slug)).toBe(true);
      expect(BLOG_POSTS.some(post => post.slug === entry.guide)).toBe(true);
    }
  });

  it("preserves the real image dimensions to prevent layout shifts or cropping", () => {
    for (const [id, shot] of Object.entries(TUTORIAL_SCREENSHOTS)) {
      const png = readFileSync(`public${tutorialImageSrc(id as keyof typeof TUTORIAL_SCREENSHOTS)}`);
      expect(png.readUInt32BE(16)).toBe(2048);
      expect(png.readUInt32BE(20)).toBe(shot.height);
    }
  });

  it("translates new tutorial prose from its English source without retaining Arabic on return", () => {
    for (const post of ILLUSTRATED_POSTS) {
      const strings = [post.title, post.description, post.intro, ...post.sections.flatMap(section => [section.heading, ...section.paragraphs, ...(section.bullets ?? [])])];
      for (const source of strings) {
        expect(translateUi(source, "ar")).toMatch(/[\u0600-\u06ff]/);
        expect(translateUi(source, "en")).toBe(source);
      }
    }
  });
});
