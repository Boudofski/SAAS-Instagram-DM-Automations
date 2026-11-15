CREATE TABLE "CommentRecipientClaim" (
 "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "mediaId" TEXT NOT NULL,
 "recipientIgId" TEXT NOT NULL,
 "commentId" TEXT NOT NULL,
 "automationId" UUID NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY ("userId", "mediaId", "recipientIgId")
);
INSERT INTO "CommentRecipientClaim" ("userId","mediaId","recipientIgId","commentId","automationId","createdAt")
SELECT DISTINCT ON (a."userId",m."mediaId",m."recipientIgId")
 a."userId",m."mediaId",m."recipientIgId",m."commentId",m."automationId",m."createdAt"
FROM "MessageLog" m JOIN "Automation" a ON a.id=m."automationId"
WHERE a."userId" IS NOT NULL AND m."mediaId" IS NOT NULL AND m."commentId" IS NOT NULL
 AND m.status='SENT' AND m."messageType" IN ('DM','COMMENT_REPLY')
ORDER BY a."userId",m."mediaId",m."recipientIgId",m."createdAt",m.id
ON CONFLICT DO NOTHING;
