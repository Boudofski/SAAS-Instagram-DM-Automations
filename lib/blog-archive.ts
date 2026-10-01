import { LEGACY_BLOG_POSTS } from "./blog";
import importedSlugs from "./content/imported-blog/slugs.json";
import FEATURED_BLOG_SLUGS from "./content/imported-blog/featured.json";
import type { BlogPost } from "./blog";
import { EXPANSION_POSTS } from "./content/expansion";
import { filterBlogPosts } from "./blog-search";

// Archive curation only: preserve existing product walkthrough URLs and help links.
export const REFERENCE_GUIDE_SLUGS = new Set([
  ...EXPANSION_POSTS.map(post => post.slug),
  "ap3k-workspace-visual-guide", "create-ap3k-automation-visual-guide",
  "set-up-ap3k-ai-visual-guide", "connect-instagram-to-ap3k",
]);
export { default as FEATURED_BLOG_SLUGS } from "./content/imported-blog/featured.json";
export function getEditorialArchive(posts: BlogPost[], query = "") {
  const legacy = new Set(LEGACY_BLOG_POSTS.map(p => p.slug));
  const editorial = posts.filter(p => p.importedArchive || !legacy.has(p.slug)).sort((a,b) => {
    const ai = importedSlugs.indexOf(a.slug), bi = importedSlugs.indexOf(b.slug);
    return (ai < 0 ? -1 : ai) - (bi < 0 ? -1 : bi);
  });
  const selected = FEATURED_BLOG_SLUGS.flatMap(slug => {
    const post = editorial.find(p => p.slug === slug);
    return post ? [post] : [];
  });
  const featured = [...selected, ...editorial.filter(p => !selected.includes(p))].slice(0, 4);
  // Source lists featured articles again in the chronological archive.
  return {
    featured: query ? [] : featured,
    posts: query ? filterBlogPosts(editorial, query) : editorial,
  };
}
export function blogPaginationItems(page: number, pages: number): (number | "gap")[] {
  const selected = new Set([1, pages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach(p => selected.add(p));
  if (page >= pages - 2) [pages - 3, pages - 2, pages - 1].forEach(p => selected.add(p));
  const numbers = Array.from(selected).filter(p => p >= 1 && p <= pages).sort((a,b) => a-b);
  const result: (number | "gap")[] = [];
  numbers.forEach((p, index) => {
    if (index && p - numbers[index - 1] > 1) result.push("gap");
    result.push(p);
  });
  return result;
}
