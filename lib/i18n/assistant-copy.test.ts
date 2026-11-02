import { expect, it } from "vitest";
import copy from "./assistant-copy.json";
import { translateUi } from "./translate";
it("provides non-English assistant prompts in every supported translation", () => {
  const keys = Object.keys(copy.ar).sort();
  for (const locale of Object.keys(copy) as Array<keyof typeof copy>) {
    expect(Object.keys(copy[locale]).sort()).toEqual(keys);
    for (const key of keys) {
      const translated = translateUi(key, locale);
      expect(translated.trim()).not.toBe("");
      expect(translated).toBe((copy[locale] as Record<string,string>)[key]);
    }
  }
});
