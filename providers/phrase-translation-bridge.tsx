"use client";

import { PHRASE_TRANSLATIONS } from "@/lib/i18n/phrase-translations";
import type { Locale } from "@/lib/i18n/config";
import { useEffect } from "react";

const TRANSLATABLE_ATTRIBUTES = ["aria-label", "placeholder", "title", "alt"] as const;
const SKIPPED_ELEMENTS = new Set(["SCRIPT", "STYLE", "CODE", "PRE", "TEXTAREA"]);

function shouldSkip(element: Element | null) {
  return Boolean(
    !element ||
    SKIPPED_ELEMENTS.has(element.tagName) ||
    element.closest('[data-no-translate], [translate="no"], .notranslate, [contenteditable="true"]'),
  );
}

function translateTextNode(node: Text, catalog: Record<string, string>) {
  if (shouldSkip(node.parentElement)) return;
  const source = node.data.trim();
  const translated = catalog[source];
  if (!translated || translated === source) return;
  const leading = node.data.match(/^\s*/)?.[0] ?? "";
  const trailing = node.data.match(/\s*$/)?.[0] ?? "";
  node.data = `${leading}${translated}${trailing}`;
}

function translateAttribute(element: Element, attribute: (typeof TRANSLATABLE_ATTRIBUTES)[number], catalog: Record<string, string>) {
  const source = element.getAttribute(attribute)?.trim();
  if (!source) return;
  const translated = catalog[source];
  if (translated && translated !== source) element.setAttribute(attribute, translated);
}

function translateElement(element: Element, catalog: Record<string, string>) {
  if (shouldSkip(element)) return;
  for (const attribute of TRANSLATABLE_ATTRIBUTES) {
    translateAttribute(element, attribute, catalog);
  }
  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) translateTextNode(child as Text, catalog);
    else if (child.nodeType === Node.ELEMENT_NODE) translateElement(child as Element, catalog);
  }
}

export default function PhraseTranslationBridge({ locale }: { locale: Locale }) {
  useEffect(() => {
    if (locale === "en") return;
    const catalog = PHRASE_TRANSLATIONS[locale];
    const translate = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) translateTextNode(node as Text, catalog);
      else if (node.nodeType === Node.ELEMENT_NODE) translateElement(node as Element, catalog);
    };

    translateElement(document.body, catalog);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData") translate(record.target);
        else if (record.type === "attributes" && record.target instanceof Element && record.attributeName) {
          translateAttribute(
            record.target,
            record.attributeName as (typeof TRANSLATABLE_ATTRIBUTES)[number],
            catalog,
          );
        }
        else for (const node of Array.from(record.addedNodes)) translate(node);
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRIBUTES],
    });
    return () => observer.disconnect();
  }, [locale]);

  return null;
}
