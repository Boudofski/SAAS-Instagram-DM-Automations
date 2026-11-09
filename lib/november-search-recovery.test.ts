import { describe, it, expect } from 'vitest';
import { BLOG_POSTS } from './blog';
import { NOVEMBER_SEARCH_RECOVERY } from './content/november-search-recovery';
import { buildSitemap } from './sitemap';
import { getEditorialArchive } from './blog-archive';
describe('search recovery editorial release', () => {
 it('keeps established URLs indexable and publishes real revision dates', () => {
  const sitemap = buildSitemap();
  for (const slug of Object.keys(NOVEMBER_SEARCH_RECOVERY)) {
   const post = BLOG_POSTS.find(p => p.slug === slug)!;
   expect(post).toBeDefined();
   expect(post.importedArchive).toBe(false);
   expect(post.noIndex).not.toBe(true);
   expect(post.contentLocale).toBe('en');
   expect(post.sections.length).toBeGreaterThanOrEqual(4);
   const entry = sitemap.find(p => p.url === `https://ap3k.com/blog/${slug}`)!;
   expect(entry).toBeDefined();
   expect(new Date(entry.lastModified!).toISOString()).toContain('2026-11-09');
  }
 });
 it('makes maintained conversion guides visible in the archive', () => {
  expect(getEditorialArchive(BLOG_POSTS).featured.map(p => p.slug)).toContain('free-instagram-chatbot');
 });
 it('explains free-plan action accounting without promising unlimited AI', () => {
  const post = BLOG_POSTS.find(p => p.slug === 'free-instagram-chatbot')!;
  expect(post.intro).toContain('500');
  expect(post.intro).toContain('separate paid capability');
  expect(JSON.stringify(post.sections)).toContain('250 completed pairs');
 });
});
