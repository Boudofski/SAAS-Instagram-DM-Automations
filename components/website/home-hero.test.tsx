import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SUPPORTED_LOCALES, type Locale } from '@/lib/i18n/config';
import { KEYWORD_ANIMATION_COPY } from '@/lib/i18n/home-hero';
import HomeHero from './home-hero';
const state = vi.hoisted(() => ({ locale: 'en' as Locale }));
vi.mock('next/font/google', () => ({ Inter: () => ({ className: 'font-inter' }), Noto_Sans_Arabic: () => ({ className: 'font-arabic' }) }));
vi.mock('@/providers/i18n-provider', () => ({ useI18n: () => ({ locale: state.locale }) }));
describe('localized hero animation', () => {
  for (const locale of SUPPORTED_LOCALES) {
    it(`renders live ${locale} text before hydration with the correct direction`, () => {
      state.locale = locale;
      const html = renderToStaticMarkup(<HomeHero />);
      const copy = KEYWORD_ANIMATION_COPY[locale];
      expect(html).toContain(copy.prefix);
      expect(html).toContain(copy.suffix);
      expect(html).toContain(`<bdi>${copy.keywords[0]}</bdi>`);
      expect(html).toContain(`dir="${locale === 'ar' ? 'rtl' : 'ltr'}"`);
      expect(html).not.toContain('<video');
      if (locale !== 'en') expect(html).not.toContain('to get the product link');
    });
  }
});
