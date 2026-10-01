import { describe, expect, it } from "vitest";
import { BLOG_POSTS } from "./blog";
import { getEditorialArchive, blogPaginationItems, REFERENCE_GUIDE_SLUGS } from "./blog-archive";
import { buildSitemap } from "./sitemap";
import { getBlogPage } from "./blog-pagination";

describe("editorial archive", () => {
  it("keeps published articles reachable exactly once across featured and all pages", () => {
    const { featured, posts } = getEditorialArchive(BLOG_POSTS);
    const seen = [...featured.map(p => p.slug)];
    const pages = getBlogPage(undefined, posts.length)!.pages;
    for (let page = 1; page <= pages; page++) {
      const range = getBlogPage(String(page), posts.length)!;
      const visible = posts.slice(range.start, range.end);
      if (page < pages) expect(visible).toHaveLength(9);
      seen.push(...visible.map(p => p.slug));
    }
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen).not.toContain("ap3k-workspace-visual-guide");
    expect(BLOG_POSTS.some(p => p.slug === "ap3k-workspace-visual-guide")).toBe(true);
    expect(seen.length).toBe(BLOG_POSTS.length - REFERENCE_GUIDE_SLUGS.size);
  });
  it("only puts valid editorial archive pages in the sitemap", () => {
    const total = getEditorialArchive(BLOG_POSTS).posts.length;
    const pages = buildSitemap(BLOG_POSTS).filter(p => new URL(p.url).pathname === "/blog" && new URL(p.url).searchParams.has("page"));
    expect(pages).toHaveLength(getBlogPage(undefined, total)!.pages - 1);
    for (const page of pages) expect(getBlogPage(new URL(page.url).searchParams.get("page")!, total)).not.toBeNull();
  });
  it("searches featured posts and respects the published collection passed by the CMS", () => {
    const { featured } = getEditorialArchive(BLOG_POSTS);
    expect(getEditorialArchive(BLOG_POSTS, featured[0].title).posts).toContain(featured[0]);
    const hidden = featured[0].slug;
    const result = getEditorialArchive(BLOG_POSTS.filter(p => p.slug !== hidden));
    expect([...result.posts, ...result.featured].some(p => p.slug === hidden)).toBe(false);
    expect(result.featured).toHaveLength(4);
  });
  it("bounds page controls and always includes the current page and endpoints", () => {
    for (let page = 1; page <= 100; page++) {
      const items = blogPaginationItems(page, 100);
      expect(items).toContain(1);
      expect(items).toContain(100);
      expect(items).toContain(page);
      expect(items.length).toBeLessThanOrEqual(7);
    }
    expect(blogPaginationItems(1, 1)).toEqual([1]);
  });
});
