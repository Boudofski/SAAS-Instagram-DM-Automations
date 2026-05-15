import { describe, expect, it } from "vitest";
import {
  getInstagramTokenFormatDiagnostic,
  normalizeInstagramAccessToken,
} from "./instagram-token";

describe("normalizeInstagramAccessToken", () => {
  it("returns only a usable access_token string from an OAuth response object", () => {
    const token = "IGQVJ" + "a".repeat(40);
    expect(normalizeInstagramAccessToken({ access_token: token })).toBe(token);
  });

  it("rejects object coercion and JSON-shaped token strings", () => {
    expect(normalizeInstagramAccessToken("[object Object]")).toBeNull();
    expect(normalizeInstagramAccessToken('{"access_token":"abc"}')).toBeNull();
  });

  it("rejects undefined, missing, and malformed token values", () => {
    expect(normalizeInstagramAccessToken(undefined)).toBeNull();
    expect(normalizeInstagramAccessToken({})).toBeNull();
    expect(normalizeInstagramAccessToken({ access_token: undefined })).toBeNull();
    expect(normalizeInstagramAccessToken({ access_token: "undefined" })).toBeNull();
  });
});

describe("getInstagramTokenFormatDiagnostic", () => {
  it("reports invalid token formats without exposing token contents", () => {
    expect(getInstagramTokenFormatDiagnostic("[object Object]")).toMatchObject({
      looksUsable: false,
      reason: "object_coercion_string",
      hasObjectCoercion: true,
    });
    expect(getInstagramTokenFormatDiagnostic('{"access_token":"abc"}')).toMatchObject({
      looksUsable: false,
      reason: "json_string",
      hasJsonShape: true,
    });
  });
});
