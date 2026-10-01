import type { BlogPost } from "./blog";
import { EXPANSION_POSTS } from "./content/expansion";
import { filterBlogPosts } from "./blog-search";

// Archive curation only: preserve existing product walkthrough URLs and help links.
export const REFERENCE_GUIDE_SLUGS = new Set([
  ...EXPANSION_POSTS.map(post => post.slug),
  "ap3k-workspace-visual-guide", "create-ap3k-automation-visual-guide",
  "set-up-ap3k-ai-visual-guide", "connect-instagram-to-ap3k",
]);
export const FEATURED_BLOG_SLUGS = [
  "instagram-comment-to-dm-automation",
  "instagram-dm-campaigns-that-match-customer-intent",
  "sell-products-through-instagram-conversations",
  "troubleshoot-instagram-comment-dm-automation",
];
export function getEditorialArchive(posts: BlogPost[], query = "") {
  const editorial = posts.filter(p => !REFERENCE_GUIDE_SLUGS.has(p.slug));
  const selected = FEATURED_BLOG_SLUGS.flatMap(slug => {
    const post = editorial.find(p => p.slug === slug);
    return post ? [post] : [];
  });
  const featured = [...selected, ...editorial.filter(p => !selected.includes(p))].slice(0, 4);
  // Search includes featured posts; otherwise remove featured before pagination.
  return {
    featured: query ? [] : featured,
    posts: query ? filterBlogPosts(editorial, query) : editorial.filter(p => !featured.includes(p)),
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
