"use client";

import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import { useI18n } from "@/providers/i18n-provider";
import { translateUi } from "@/lib/i18n/translate";
import { isProtectedPath, localizePublicPath, type Locale } from "@/lib/i18n/config";

// Only use for trusted, static marketing copy. Never wrap inboxes, editors or
// user-generated names. React retains the original children on every render.
export function localizeCopyTree(node: ReactNode, locale: Locale): ReactNode {
  return Children.map(node, (child) => {
    if (typeof child === "string") return translateUi(child, locale);
    if (!isValidElement<Record<string, any>>(child)) return child;
    if (child.props.translate === "no" || child.props["data-no-translate"] || ["script", "style", "code", "pre", "textarea"].includes(child.type as string)) return child;
    const props: Record<string, unknown> = {};
    for (const key of ["aria-label", "title", "alt", "placeholder"]) {
      if (typeof child.props[key] === "string") props[key] = translateUi(child.props[key], locale);
    }
    const href = child.props.href;
    if (typeof href === "string" && href.startsWith("/") && !href.startsWith("//") && !isProtectedPath(href.split(/[?#]/)[0]) && !href.startsWith("/media/")) {
      props.href = localizePublicPath(href, locale);
    }
    if (child.props.children !== undefined) props.children = localizeCopyTree(child.props.children, locale);
    return cloneElement(child, props);
  });
}

export default function LocalizedCopy({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  return <>{localizeCopyTree(children, locale)}</>;
}

// Safe for a single UI label; the caller explicitly excludes user content.
export function UiText({ children }: { children: string }) {
  const { locale } = useI18n();
  return <>{translateUi(children, locale)}</>;
}
