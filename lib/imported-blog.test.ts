import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import imported from './content/imported-blog/index.json';
import covers from './content/imported-blog/covers.json';
import { BLOG_POSTS } from './blog';
import { getEditorialArchive } from './blog-archive';
import { getBlogPage } from './blog-pagination';

describe('supplied blog archive migration', () => {
  it('publishes all 175 unique articles in the source order across 20 archive pages', () => {
    const archive = getEditorialArchive(BLOG_POSTS);
    expect(archive.posts.map(p => p.slug)).toEqual(imported.map(p => p.slug));
    expect(new Set(archive.posts.map(p => p.slug)).size).toBe(175);
    expect(getBlogPage(undefined, archive.posts.length)?.pages).toBe(20);
    expect(archive.featured).toHaveLength(4);
  });
  it('uses a distinct, present cover for every imported article', () => {
    const images = Object.values(covers);
    expect(images).toHaveLength(175);
    const hashes = images.map(image => createHash('sha256').update(readFileSync(`public${image.src}`)).digest('hex'));
    expect(new Set(hashes).size).toBe(175);
  });
  it('retains substantial bodies and only local existing image assets, without active imported code', () => {
    for (const post of imported) {
      const html = readFileSync(`lib/content/imported-blog/${post.slug}.html`, 'utf8');
      expect(post.wordCount, post.slug).toBeGreaterThan(150);
      expect(html).not.toMatch(/<(script|iframe|form|object|embed)\b|\son\w+=|javascript:/i);
      for (const [, src] of Array.from(html.matchAll(/<img[^>]+src="([^"]+)"/g))) {
        expect(src).toMatch(/^\/images\/blog\/imported\/[a-f0-9]+\.webp$/);
        expect(existsSync(`public${src}`), `${post.slug}: ${src}`).toBe(true);
      }
      for (const [, slug] of Array.from(html.matchAll(/href="\/blog\/([^"#?]+)/g))) {
        expect(BLOG_POSTS.some(p => p.slug === slug), `${post.slug}: ${slug}`).toBe(true);
      }
    }
  });
});
