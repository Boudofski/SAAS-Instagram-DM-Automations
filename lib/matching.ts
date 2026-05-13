import { MATCHING_MODE } from "@prisma/client";

export function matchKeywordWithMode(
  text: string,
  keywords: { word: string }[],
  mode: MATCHING_MODE
): string | null {
  const lower = text.toLowerCase().trim();

  for (const kw of keywords) {
    const kwLower = kw.word.toLowerCase();

    if (mode === "EXACT") {
      if (lower === kwLower) return kw.word;
    } else {
      // CONTAINS and SMART_AI both use substring match.
      // SMART_AI adds optional OpenAI verification at the call site.
      if (lower.includes(kwLower)) return kw.word;
    }
  }

  return null;
}
