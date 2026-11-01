import fr from "./catalogs/fr.json";
import es from "./catalogs/es.json";
import de from "./catalogs/de.json";
import pt from "./catalogs/pt.json";
import ar from "./catalogs/ar.json";
import type { Locale } from "./config";
import EDITORIAL_COPY from './editorial-copy.json';

// Repository-owned static copy. Drafted locally; explicit editorial catalogs
// override these entries. No runtime translation service or customer data.
export const EXTENDED_COPY = Object.fromEntries(
  Object.entries({ en: {}, ar, fr, es, de, nl: {}, pt }).map(([locale, entries]) => {
    const reviewed = (EDITORIAL_COPY as Partial<Record<Locale, Record<string, string>>>)[locale as Locale] ?? {};
    return [locale, Object.fromEntries(Object.entries(entries).filter(([source]) => !Object.prototype.hasOwnProperty.call(reviewed, source)))];
  }),
) as Record<Locale, Record<string, string>>;
