import { describe, expect, it } from "vitest";
import { analyticsPage, analyticsReferrer, googleTag, type GoogleWindow } from "./google-analytics";

describe("analytics data boundaries", () => {
  it("redacts private account paths, queries and fragments", () => {
    expect(analyticsPage("/fr/dashboard/user_secret/inbox/thread_secret?email=private#message").path).toBe("/dashboard");
    expect(analyticsPage("/callback/instagram?code=secret").path).toBe("/callback");
    expect(analyticsPage("/blog/automate-instagram-dms-from-comments?email=private#section-1").path).toBe("/blog/automate-instagram-dms-from-comments");
  });
  it("preserves public locale paths and limits external referrers to origins", () => {
    expect(analyticsPage("/fr/pricing").path).toBe("/fr/pricing");
    expect(analyticsReferrer("https://google.com/search?q=private")).toBe("https://google.com");
    expect(analyticsReferrer("https://ap3k.com/dashboard/user_secret/inbox")).toBe("https://ap3k.com/dashboard");
    expect(analyticsReferrer("javascript:alert(1)")).toBe("");
  });
  it("queues early events and preserves an existing Google tag", () => {
    const win = {} as GoogleWindow;
    const tag = googleTag(win);
    tag("event", "signup_cta_clicked", { locale: "en" });
    expect(Array.from(win.dataLayer![0] as IArguments)).toEqual(["event", "signup_cta_clicked", { locale: "en" }]);
    expect(googleTag(win)).toBe(tag);
  });
});
