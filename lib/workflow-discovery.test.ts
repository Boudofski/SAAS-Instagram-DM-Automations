import { describe, expect, it } from "vitest";
import { BLOG_POSTS } from "./blog";
import { WORKFLOW_GUIDES, WORKFLOW_POSTS } from "./content/workflows";
import paths from "./content/workflows/paths.json";
import { SEO_RESOURCES } from "./seo-resources";
import { buildSitemap } from "./sitemap";
import { localeAlternates, localizePublicPath } from "./i18n/config";

describe("AP3K workflow discovery", () => {
  it("publishes 25 distinct useful assets with one canonical each", () => {
    const worksheets = SEO_RESOURCES.filter(item => item.visual);
    expect(WORKFLOW_POSTS).toHaveLength(20);
    expect(worksheets).toHaveLength(5);
    const visible = [...WORKFLOW_POSTS, ...worksheets];
    expect(new Set(visible.map(item => item.title)).size).toBe(25);
    expect(new Set(visible.map(item => item.description)).size).toBe(25);
    expect(paths).toHaveLength(25);
    expect(new Set(paths).size).toBe(25);
    const sitemap = buildSitemap();
    for (const path of paths) {
      const canonical = `https://ap3k.com${path}`;
      const entry = sitemap.filter(item => item.url === canonical);
      expect(entry, path).toHaveLength(1);
      expect(entry[0].alternates?.languages).toEqual({ en: canonical, "x-default": canonical });
      expect(localizePublicPath(path, "ar")).toBe(path);
      expect(localeAlternates(path)).toEqual({ en: path, "x-default": path });
    }
    for (const guide of WORKFLOW_GUIDES) {
      expect(BLOG_POSTS.filter(post => post.slug === guide.slug)).toHaveLength(1);
      expect(worksheets.some(resource => resource.slug === guide.resource)).toBe(true);
      expect(guide.stages).toHaveLength(3);
    }
    for (const resource of worksheets) {
      expect(WORKFLOW_GUIDES.some(guide => guide.resource === resource.slug)).toBe(true);
      expect(resource.visual).toHaveLength(3);
      expect(resource.sections.flatMap(section => section.items)).toHaveLength(9);
    }
  });
});
