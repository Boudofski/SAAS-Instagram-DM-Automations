import { describe, it, expect } from "vitest";
import { matchKeywordWithMode } from "./matching";

const keywords = [
  { word: "GUIDE" },
  { word: "price" },
  { word: "FREE" },
];

describe("matchKeywordWithMode — EXACT", () => {
  it("matches exact keyword case-insensitively", () => {
    expect(matchKeywordWithMode("guide", keywords, "EXACT")).toBe("GUIDE");
    expect(matchKeywordWithMode("GUIDE", keywords, "EXACT")).toBe("GUIDE");
    expect(matchKeywordWithMode("Guide", keywords, "EXACT")).toBe("GUIDE");
  });

  it("does not match a substring in EXACT mode", () => {
    expect(matchKeywordWithMode("I want the GUIDE please", keywords, "EXACT")).toBeNull();
  });

  it("returns null for no match", () => {
    expect(matchKeywordWithMode("hello world", keywords, "EXACT")).toBeNull();
  });
});

describe("matchKeywordWithMode — CONTAINS", () => {
  it("matches when comment contains the keyword", () => {
    expect(matchKeywordWithMode("I want the GUIDE please", keywords, "CONTAINS")).toBe("GUIDE");
    expect(matchKeywordWithMode("send me the guide!", keywords, "CONTAINS")).toBe("GUIDE");
  });

  it("still matches exact in CONTAINS mode", () => {
    expect(matchKeywordWithMode("GUIDE", keywords, "CONTAINS")).toBe("GUIDE");
  });

  it("returns null when keyword not present", () => {
    expect(matchKeywordWithMode("hello world", keywords, "CONTAINS")).toBeNull();
  });
});

describe("matchKeywordWithMode — SMART_AI", () => {
  it("falls back to CONTAINS behaviour", () => {
    expect(matchKeywordWithMode("Can I get the guide?", keywords, "SMART_AI")).toBe("GUIDE");
  });
});

describe("matchKeywordWithMode — edge cases", () => {
  it("returns null for empty comment text", () => {
    expect(matchKeywordWithMode("", keywords, "EXACT")).toBeNull();
  });

  it("returns null for empty keyword list", () => {
    expect(matchKeywordWithMode("GUIDE", [], "EXACT")).toBeNull();
  });

  it("returns first matched keyword when multiple could match", () => {
    const multi = [{ word: "FREE" }, { word: "free guide" }];
    const result = matchKeywordWithMode("get free guide now", multi, "CONTAINS");
    expect(result).toBe("FREE");
  });
});
