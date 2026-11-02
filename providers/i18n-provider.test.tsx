import React from "react";
import { act, create } from "react-test-renderer";
import { expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ path: "/ar" }));
vi.mock("next/navigation", () => ({ usePathname: () => state.path }));
import { I18nProvider, useI18n } from "./i18n-provider";
function Probe() { return <span>{useI18n().locale}</span>; }
it("preserves Arabic through an English-only article and dashboard navigation", async () => {
  const doc = { cookie: "ap3k_locale=ar", documentElement: { lang: "", dir: "" } };
  vi.stubGlobal("document", doc);
  vi.stubGlobal("window", { location: { protocol: "https:" } });
  let tree: ReturnType<typeof create>;
  try {
    await act(async () => { tree = create(<I18nProvider locale="ar"><Probe /></I18nProvider>); });
    state.path = "/blog/connect-instagram-to-ap3k";
    await act(async () => { tree!.update(<I18nProvider locale="en"><Probe /></I18nProvider>); });
    expect(doc.cookie).toContain("ap3k_locale=ar");
    state.path = "/dashboard/user_test";
    await act(async () => { tree!.update(<I18nProvider locale="en"><Probe /></I18nProvider>); });
    expect(tree!.root.findByType("span").children).toEqual(["ar"]);
    expect(doc.documentElement.dir).toBe("rtl");
    await act(async () => tree!.unmount());
  } finally { vi.unstubAllGlobals(); }
});
