import { describe, expect, it } from 'vitest';
import { BLOG_POSTS } from './blog';
import { blogArchiveAlternates, getLocalizedBlogArchive } from './localized-blog-archive';
import { getBlogPage } from './blog-pagination';
import { hasUiTranslation, translateUi } from './i18n/translate';
import { HOME_LEARNING_PATHS } from './i18n/home-learning';
import { localizePublicPath } from './i18n/config';
import { buildSitemap } from './sitemap';

describe('language-specific article discovery', () => {
  for (const locale of ['fr', 'es', 'de', 'pt'] as const) {
    it(`${locale}: lists translated articles only and searches their visible words`, () => {
      const { posts, featured } = getLocalizedBlogArchive(BLOG_POSTS, locale);
      expect(posts.length).toBeGreaterThan(10);
      expect(posts.length).toBeLessThan(BLOG_POSTS.length);
      for (const post of [...posts, ...featured]) {
        expect(post.contentLocale).toBeUndefined();
        expect(localizePublicPath(`/blog/${post.slug}`, locale)).toBe(`/${locale}/blog/${post.slug}`);
        for (const text of [post.title, post.description, post.intro, ...post.sections.flatMap(section => [section.heading, ...section.paragraphs, ...(section.bullets || []), ...(section.steps || []).flatMap(step => [step.title, step.body])])]) {
          if (text.length > 30) expect(hasUiTranslation(text, locale), `${post.slug}: ${text}`).toBe(true);
        }
      }
      const title = translateUi(posts[0].title, locale);
      expect(title).not.toBe(posts[0].title);
      expect(getLocalizedBlogArchive(BLOG_POSTS, locale, title).posts.map(post => post.slug)).toContain(posts[0].slug);
      expect(getLocalizedBlogArchive(BLOG_POSTS.filter(post => post.slug !== posts[0].slug), locale, title).posts).toHaveLength(0);
      expect(getLocalizedBlogArchive([{ ...posts[0], noIndex: true }], locale).posts).toHaveLength(0);
    });
    it(`${locale}: keeps pagination, sitemap and homepage destinations in agreement`, () => {
      const pages = buildSitemap();
      const total = getLocalizedBlogArchive(BLOG_POSTS, locale).posts.length;
      const last = getBlogPage(undefined, total)!.pages;
      expect(blogArchiveAlternates(BLOG_POSTS, last)[locale]).toBe(`https://ap3k.com/${locale}/blog?page=${last}`);
      expect(blogArchiveAlternates(BLOG_POSTS, last + 1)).not.toHaveProperty(locale);
      for (const path of HOME_LEARNING_PATHS) {
        expect(pages.some(page => page.url === `https://ap3k.com/${locale}${path}`)).toBe(true);
      }
    });
  }
  it('preserves every indexable English article', () => {
    expect(new Set(getLocalizedBlogArchive(BLOG_POSTS, 'en').posts.map(post => post.slug)))
      .toEqual(new Set(BLOG_POSTS.filter(post => !post.noIndex).map(post => post.slug)));
  });
});
