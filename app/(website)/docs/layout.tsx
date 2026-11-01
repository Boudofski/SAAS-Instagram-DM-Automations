import { docsFont } from "@/components/docs/font";
import DocsShell from "@/components/docs/docs-shell";
import { DOCS_SEARCH } from "@/lib/docs";
import { LOCALE_DETAILS } from "@/lib/i18n/config";
import { getServerLocale } from "@/lib/i18n/server";
import { translateUi } from "@/lib/i18n/translate";
import tokens from "@/components/docs/tokens.module.css";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const locale = getServerLocale();
  const details = LOCALE_DETAILS[locale];
  const entries = DOCS_SEARCH.map((entry) => ({
    ...entry,
    title: translateUi(entry.title, locale),
    description: translateUi(entry.description, locale),
    headings: entry.headings.map((heading) => ({ ...heading, text: translateUi(heading.text, locale) })),
  }));
  return <div className={`${tokens.root} ${docsFont.className}`} lang={details.htmlLang} dir={details.direction} style={{ fontFamily: docsFont.style.fontFamily }}><DocsShell entries={entries}>{children}</DocsShell></div>;
}
