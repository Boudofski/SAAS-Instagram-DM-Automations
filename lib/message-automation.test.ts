import { describe, expect, it } from "vitest";
import { normalizeMessageAutomationPayload, validateMessageAutomationPayload } from "./message-automation";

describe("message automation payloads", () => {
  it("normalizes a story reply with bounded chips and delay", () => {
    const payload = normalizeMessageAutomationPayload({
      source: "STORY",
      storyTriggerType: "REPLY",
      name: " Story leads ",
      message: " Here's the guide ",
      quickReplies: ["Tell me more", "Pricing", "Book", "Thanks", "ignored"],
      deliveryDelaySeconds: 10,
      typingIndicator: true,
    });
    expect(payload.name).toBe("Story leads");
    expect(payload.storyTriggerType).toBe("REPLY");
    expect(payload.quickReplies).toHaveLength(4);
    expect(payload.deliveryDelaySeconds).toBe(10);
    expect(validateMessageAutomationPayload(payload)).toBeNull();
  });

  it("supports any incoming DM without a keyword", () => {
    const payload = normalizeMessageAutomationPayload({ source: "DM", triggerMode: "ANY_MESSAGE", message: "Hello" });
    expect(payload.triggerMode).toBe("ANY_MESSAGE");
    expect(payload.keywords).toEqual([]);
    expect(validateMessageAutomationPayload(payload)).toBeNull();
  });

  it("requires keywords in specific-keyword DM mode", () => {
    const payload = normalizeMessageAutomationPayload({ source: "DM", triggerMode: "SPECIFIC_KEYWORD", message: "Hello" });
    expect(validateMessageAutomationPayload(payload)).toBe("Add at least one DM keyword or choose any incoming message.");
  });

  it("rejects missing link and media destinations", () => {
    const link = normalizeMessageAutomationPayload({ source: "STORY", responseFormat: "LINK", message: "Open this" });
    const media = normalizeMessageAutomationPayload({ source: "STORY", responseFormat: "MEDIA", message: "Watch this" });
    expect(validateMessageAutomationPayload(link)).toBe("Add a valid link for the button.");
    expect(validateMessageAutomationPayload(media)).toBe("Add a valid public image or video URL.");
  });
});
