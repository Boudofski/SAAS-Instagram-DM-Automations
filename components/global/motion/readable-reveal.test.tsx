import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FadeIn, ReadableReveal, ScaleIn, StaggerContainer, StaggerItem } from "./fade-in";

describe("readable content before browser animations", () => {
  it("ships visible content without JavaScript or a viewport intersection", () => {
    const markup = renderToStaticMarkup(<ReadableReveal>Read this tutorial</ReadableReveal>);
    expect(markup).toContain("Read this tutorial");
    expect(markup).not.toMatch(/opacity:\s*0(?:[;"\s])|visibility:\s*hidden|display:\s*none/);
  });

  it("keeps public sections crawlable and readable if hydration or observers fail", () => {
    const markup = renderToStaticMarkup(<>
      <FadeIn>Approved heading</FadeIn>
      <ScaleIn>Approved explanation</ScaleIn>
      <StaggerContainer><StaggerItem>Approved linked content</StaggerItem></StaggerContainer>
    </>);
    expect(markup).not.toMatch(/opacity:\s*0(?:[;"\s])|visibility:\s*hidden|display:\s*none/);
    expect(markup).toContain("Approved linked content");
  });
});
