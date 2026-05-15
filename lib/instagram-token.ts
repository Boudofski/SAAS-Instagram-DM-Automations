export type InstagramTokenFormatDiagnostic = {
  present: boolean;
  type: "missing" | "string" | "non_string";
  length: number;
  looksUsable: boolean;
  reason: string;
  hasObjectCoercion: boolean;
  hasJsonShape: boolean;
};

export function getInstagramTokenFormatDiagnostic(
  value: unknown
): InstagramTokenFormatDiagnostic {
  if (typeof value !== "string") {
    return {
      present: value !== null && value !== undefined,
      type: value === null || value === undefined ? "missing" : "non_string",
      length: 0,
      looksUsable: false,
      reason: value === null || value === undefined ? "missing" : "not_a_string",
      hasObjectCoercion: false,
      hasJsonShape: false,
    };
  }

  const token = value.trim();
  const hasObjectCoercion = token === "[object Object]";
  const hasJsonShape = token.startsWith("{") || token.startsWith("[");
  const invalidLiteral = ["undefined", "null", "false", "true"].includes(
    token.toLowerCase()
  );
  const looksUsable =
    token.length > 20 &&
    token === value &&
    !hasObjectCoercion &&
    !hasJsonShape &&
    !invalidLiteral &&
    !token.includes("access_token");

  return {
    present: token.length > 0,
    type: "string",
    length: token.length,
    looksUsable,
    reason: looksUsable
      ? "ok"
      : hasObjectCoercion
      ? "object_coercion_string"
      : hasJsonShape
      ? "json_string"
      : invalidLiteral
      ? "literal_string"
      : token.length === 0
      ? "empty"
      : token !== value
      ? "surrounding_whitespace"
      : "too_short_or_malformed",
    hasObjectCoercion,
    hasJsonShape,
  };
}

export function normalizeInstagramAccessToken(value: unknown): string | null {
  const token =
    typeof value === "string"
      ? value
      : value &&
        typeof value === "object" &&
        "access_token" in value &&
        typeof (value as { access_token?: unknown }).access_token === "string"
      ? (value as { access_token: string }).access_token
      : null;

  if (!token) return null;
  const diagnostic = getInstagramTokenFormatDiagnostic(token);
  return diagnostic.looksUsable ? token : null;
}
