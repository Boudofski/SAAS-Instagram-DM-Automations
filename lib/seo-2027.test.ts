import { describe, it, expect } from 'vitest';
import { PLANNING_2027_POSTS } from './content/planning-2027';
import { buildSitemap } from './sitemap';
import { SUPPORTED_LOCALES } from './i18n/config';
import { translateUi } from './i18n/translate';

describe('2027 planning content and docs search snippets', () => {
  it('publishes distinct planning guides with real dates and valid internal destinations', () => {
    const pages = buildSitemap();
    const paths = new Set(pages.map(p => new URL(p.url).pathname));
    expect(PLANNING_2027_POSTS).toHaveLength(3);
    for (const post of PLANNING_2027_POSTS) {
      expect(post.title).toContain('2027');
      expect(post.publishedAt).toBe('2026-11-04');
      expect(post.wordCount).toBeGreaterThan(500);
      expect(pages.filter(p => p.url.endsWith('/blog/'+post.slug))).toHaveLength(1);
      for (const section of post.sections) for (const link of section.links || []) {
        if (link.href.startsWith('/') && link.href !== '/sign-up') expect(paths.has(link.href), link.href).toBe(true);
      }
    }
  });
  it('provides unique translated documentation titles and descriptions', () => {
    for (const source of ['AP3K Documentation for Instagram Automation', 'Step-by-step AP3K guides for connecting Instagram, creating comment-to-DM automations, sending messages and troubleshooting delivery.']) {
      const texts = SUPPORTED_LOCALES.map(locale => translateUi(source, locale));
      expect(new Set(texts).size).toBe(SUPPORTED_LOCALES.length);
    }
  });
});
