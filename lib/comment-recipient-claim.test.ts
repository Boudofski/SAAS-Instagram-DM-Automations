import { beforeEach, describe, it, expect, vi } from "vitest";
const db = vi.hoisted(() => ({
  findUnique: vi.fn(),
  createMany: vi.fn(),
  history: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  client: {
    commentRecipientClaim: {
      findUnique: db.findUnique,
      createMany: db.createMany,
    },
    messageLog: { findFirst: db.history },
  },
}));
import {
  claimCommentRecipient,
  isCommentThreadReply,
} from "./comment-recipient-claim";
const input = {
  userId: "owner",
  automationId: "campaign",
  mediaId: "post",
  recipientIgId: "person",
  commentId: "comment-1",
};
beforeEach(() => {
  vi.resetAllMocks();
  const rows = new Map<string, typeof input>();
  const key = (r: typeof input) =>
    JSON.stringify([r.userId, r.mediaId, r.recipientIgId]);
  db.history.mockResolvedValue(null);
  db.findUnique.mockImplementation(
    async ({ where }) =>
      rows.get(key(where.userId_mediaId_recipientIgId)) ?? null,
  );
  db.createMany.mockImplementation(async ({ data }) => {
    const value = data[0];
    if (rows.has(key(value))) return { count: 0 };
    rows.set(key(value), value);
    return { count: 1 };
  });
});
describe("one comment journey per person and post", () => {
  it("allows only one of simultaneous different comments", async () => {
    expect(
      await Promise.all([
        claimCommentRecipient(input),
        claimCommentRecipient({ ...input, commentId: "comment-2" }),
      ]),
    ).toEqual([true, false]);
  });
  it("allows the same comment continuation but blocks another campaign and comment", async () => {
    expect(await claimCommentRecipient(input)).toBe(true);
    expect(await claimCommentRecipient(input)).toBe(true);
    expect(
      await claimCommentRecipient({ ...input, automationId: "copy" }),
    ).toBe(false);
    expect(await claimCommentRecipient({ ...input, commentId: "reply" })).toBe(
      false,
    );
  });
  it("allows another post or another person", async () => {
    await claimCommentRecipient(input);
    expect(await claimCommentRecipient({ ...input, mediaId: "post-2" })).toBe(
      true,
    );
    expect(
      await claimCommentRecipient({ ...input, recipientIgId: "person-2" }),
    ).toBe(true);
  });
  it("honors previous successful public replies even from another automation", async () => {
    db.history.mockResolvedValue({
      commentId: "old-comment",
      automationId: "old-campaign",
    });
    expect(await claimCommentRecipient(input)).toBe(false);
    expect(db.history).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          automation: { userId: "owner" },
          status: "SENT",
          mediaId: "post",
        }),
      }),
    );
  });
  it("recognizes Meta thread replies and leaves top-level comments eligible", () => {
    expect(isCommentThreadReply({ parent_id: "123" })).toBe(true);
    expect(isCommentThreadReply({ comment: { parent_id: "123" } })).toBe(true);
    expect(isCommentThreadReply({})).toBe(false);
    expect(isCommentThreadReply({ parent_id: null })).toBe(false);
  });
});
