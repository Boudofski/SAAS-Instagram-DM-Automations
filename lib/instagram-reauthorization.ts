import { client } from "@/lib/prisma";
import { INSTAGRAM_AUTH_EXPIRED_REVIEW_REASON } from "@/lib/instagram-authorization";
import { notifyInstagramReconnectEmail } from "@/lib/email/events";

/** Only call for a proven expired or invalid token. Match the credential we
 * checked so a late refresh/send result cannot invalidate a new connection. */
export async function requireInstagramReauthorization(input: {
  id: string;
  expected: { token: string } | { expiresAt: Date };
  source: "token_refresh" | "token_expiry" | "comment_private_reply";
}) {
  const at = new Date();
  const reason = input.source === "token_expiry" ? "instagram_token_expired" : "instagram_token_invalidated";
  const changed = await client.$transaction(async (tx) => {
    const result = await tx.integrations.updateMany({
      where: {
        id: input.id, status: "CONNECTED", reconnectRequired: false, planLocked: false,
        ...input.expected,
      },
      data: {
        reconnectRequired: true,
        oauthLastError: reason,
        oauthLastErrorAt: at,
        oauthLastErrorSource: input.source,
        lastAdminNote: reason,
        lastAdminActionAt: at,
      },
    });
    if (!result.count) return false;
    await tx.automation.updateMany({
      where: { integrationId: input.id, active: true, archivedAt: null },
      data: { active: false, needsReview: true, reviewReason: INSTAGRAM_AUTH_EXPIRED_REVIEW_REASON },
    });
    return true;
  });
  if (changed) await notifyInstagramReconnectEmail({ integrationId: input.id });
  return changed;
}
