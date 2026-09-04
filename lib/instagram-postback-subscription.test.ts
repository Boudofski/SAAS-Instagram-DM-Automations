import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

vi.mock("axios");
const findUnique = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ client: { integrations: { findUnique } } }));
import { ensureInstagramPostbackSubscription } from "./instagram-postback-subscription";

describe("existing-account button subscription repair", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INSTAGRAM_APP_ID = "app-1";
    findUnique.mockResolvedValue({ instagramId: "ig-1", igAccountSource: "instagram_login", status: "CONNECTED", reconnectRequired: false });
  });

  it("adds postbacks to an older account and preserves other fields", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { data: [{ id: "app-1", subscribed_fields: ["comments", "messages", "message_reactions"] }] } });
    vi.mocked(axios.post).mockResolvedValue({ status: 200, data: { success: true } });
    expect(await ensureInstagramPostbackSubscription("old-account", "token")).toBe(true);
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining("/ig-1/subscribed_apps"), null, expect.objectContaining({
      params: { subscribed_fields: "comments,messages,message_reactions,messaging_postbacks" },
      headers: { Authorization: "Bearer token" },
    }));
    expect(await ensureInstagramPostbackSubscription("old-account", "token")).toBe(true);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it("does not rewrite a complete subscription", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { data: [{ id: "app-1", subscribed_fields: ["comments", "messages", "messaging_postbacks"] }] } });
    expect(await ensureInstagramPostbackSubscription("healthy-account", "token")).toBe(true);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("uses a message quick reply if Meta rejects the subscription", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { data: [] } });
    vi.mocked(axios.post).mockRejectedValue(new Error("permission missing"));
    expect(await ensureInstagramPostbackSubscription("rejected-account", "token")).toBe(false);
  });

  it("does not assume another app's subscription belongs to AP3K", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { data: [{ id: "different-app", subscribed_fields: ["comments", "messages", "messaging_postbacks"] }] } });
    vi.mocked(axios.post).mockResolvedValue({ status: 200, data: { success: true } });
    expect(await ensureInstagramPostbackSubscription("other-app-account", "token")).toBe(true);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});
