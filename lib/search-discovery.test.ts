import { describe, expect, it } from 'vitest';
import { buildSitemap } from './sitemap';
import { AUTOMATION_GUIDE } from './i18n/automation-guide';
import { SUPPORTED_LOCALES, localeAlternates, localizePublicPath } from './i18n/config';
import { BLOG_POSTS } from './blog';
import { PLAN_LIMITS } from './plan-limits';
import { DOCS_ARTICLES } from './docs';
import { readFileSync } from 'node:fs';

describe('search discovery release', () => {
  it('serves genuinely written copy at each canonical guide URL with reciprocal alternates', () => {
    const sitemap = buildSitemap();
    const paths = SUPPORTED_LOCALES.map(locale => localizePublicPath('/instagram-automation-guide', locale));
    const urls = paths.map(path => `https://ap3k.com${path}`);
    for (const url of urls) {
      const page = sitemap.find(item => item.url === url);
      expect(page).toBeDefined();
      for (const locale of SUPPORTED_LOCALES) expect(page?.alternates?.languages?.[locale]).toBe(`https://ap3k.com${localizePublicPath('/instagram-automation-guide', locale)}`);
    }
    expect(Object.keys(localeAlternates('/instagram-automation-guide'))).toEqual([...SUPPORTED_LOCALES, 'x-default']);
    for (const locale of SUPPORTED_LOCALES) {
      const copy = AUTOMATION_GUIDE[locale];
      expect(copy.intro.length).toBeGreaterThan(180);
      expect(copy.sections).toHaveLength(5);
      for (const section of copy.sections) expect(section.text.length).toBeGreaterThan(140);
    }
  });
  it('keeps original English-only articles at one URL and corrects indexed comparison claims', () => {
    const sitemap = buildSitemap();
    for (const slug of ['accessible-instagram-dm-links-mobile','best-manychat-alternative-for-instagram-dm-automation']) {
      const article = BLOG_POSTS.find(post => post.slug === slug)!;
      expect(article.contentLocale).toBe('en');
      expect(article.importedArchive).not.toBe(true);
      expect(sitemap.some(page => page.url === `https://ap3k.com/blog/${slug}`)).toBe(true);
      expect(sitemap.some(page => page.url.includes(`/fr/blog/${slug}`))).toBe(false);
      expect(article.sections.some(section => section.links?.some(link => link.href.startsWith('/')))).toBe(true);
    }
    const comparison = BLOG_POSTS.find(post => post.slug === 'best-manychat-alternative-for-instagram-dm-automation')!;
    const body = JSON.stringify(comparison);
    expect(body).not.toMatch(/team members to collaborate|unlimited contacts|no limits, no surprises/i);
    expect(body).toContain(String(PLAN_LIMITS.FREE.staticRepliesPerMonth));
    expect(body).toContain('does not currently provide teammate seats');
    expect(DOCS_ARTICLES.find(doc => doc.slug === 'migrating-from-manychat/disconnect-manychat-from-instagram')?.html).toContain('permanently deletes');
  });
  it('exposes a bounded, factual discovery file', () => {
    const text = readFileSync('public/llms.txt', 'utf8');
    expect(text).toContain('https://ap3k.com/instagram-automation-guide');
    expect(text).toContain('500 automated actions');
    expect(text).not.toMatch(/guaranteed ranking|#1 Instagram/i);
  });
});
