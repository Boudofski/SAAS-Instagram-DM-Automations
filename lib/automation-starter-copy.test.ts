import { describe, it, expect } from 'vitest';
import { automationStarterCopy, automationCopyLocale, COPY_LANGUAGES, BOUDOFI_INTEGRATION_ID } from './automation-starter-copy';
describe('localized automation defaults', () => {
 it('provides three distinct emoji replies and valid button lengths for every language', () => {
  for (const language of Object.keys(COPY_LANGUAGES)) {
   const copy = automationStarterCopy(language);
   expect(new Set(copy.replies).size).toBe(3);
   for (const reply of copy.replies) { expect(reply).toMatch(/\p{Extended_Pictographic}/u); expect(reply.length).toBeLessThan(220); }
   expect(copy.button.length).toBeLessThanOrEqual(20);
   expect(copy.openingButton.length).toBeLessThanOrEqual(20);
  }
 });
 it('uses Arabic for boudofi without changing other account preferences', () => {
  expect(automationCopyLocale('en', BOUDOFI_INTEGRATION_ID)).toBe('ar');
  expect(automationCopyLocale('ar', 'another-account')).toBe('ar');
  expect(automationCopyLocale('fr', 'another-account')).toBe('fr');
  expect(automationCopyLocale('unknown')).toBe('en');
 });
});
