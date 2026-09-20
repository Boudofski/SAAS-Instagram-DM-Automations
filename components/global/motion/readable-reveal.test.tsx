import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ReadableReveal } from "./fade-in";

describe("readable content before browser animations", () => {
  it("ships visible content without JavaScript or a viewport intersection", () => {
    const markup = renderToStaticMarkup(<ReadableReveal>Read this tutorial</ReadableReveal>);
    expect(markup).toContain("Read this tutorial");
    expect(markup).not.toMatch(/opacity:\s*0(?:[;"\s])|visibility:\s*hidden|display:\s*none/);
  });
});
