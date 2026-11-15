import { client } from "@/lib/prisma";

/** One comment journey per person/post, shared by all of the owner's campaigns.
 * Keep the winning comment so its delayed public reply and DM can both proceed.
 * The existing per-comment job receipts still prevent duplicate execution.
 */
export async function claimCommentRecipient(input: {
  userId: string;
  automationId: string;
  mediaId: string;
  recipientIgId: string;
  commentId: string;
}): Promise<boolean> {
  const { userId, mediaId, recipientIgId } = input;
  const where = {
    userId_mediaId_recipientIgId: { userId, mediaId, recipientIgId },
  };
  const existing = await client.commentRecipientClaim.findUnique({ where });
  if (existing)
    return (
      existing.commentId === input.commentId &&
      existing.automationId === input.automationId
    );
  // Cover history written before this release, including another automation on the post.
  const history = await client.messageLog.findFirst({
    where: {
      automation: { userId },
      mediaId,
      recipientIgId,
      status: "SENT",
      messageType: { in: ["DM", "COMMENT_REPLY"] },
      commentId: { not: null },
    },
    orderBy: { createdAt: "asc" },
    select: { commentId: true, automationId: true },
  });
  await client.commentRecipientClaim.createMany({
    data: [
      {
        ...input,
        ...(history
          ? {
              commentId: history.commentId!,
              automationId: history.automationId,
            }
          : {}),
      },
    ],
    skipDuplicates: true,
  });
  const winner = await client.commentRecipientClaim.findUnique({ where });
  return (
    winner?.commentId === input.commentId &&
    winner?.automationId === input.automationId
  );
}
export function isCommentThreadReply(value: {
  parent_id?: unknown;
  comment?: { parent_id?: unknown };
}): boolean {
  const parent = value.parent_id ?? value.comment?.parent_id;
  return typeof parent === "string"
    ? parent.trim().length > 0
    : typeof parent === "number" && parent > 0;
}
