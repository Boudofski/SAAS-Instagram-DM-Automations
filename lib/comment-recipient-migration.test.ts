import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
it('backfills only successful journeys and keeps them after campaign deletion',async()=>{
 const db=new PGlite();
 try{
 await db.exec(`CREATE TABLE "User" (id UUID PRIMARY KEY);CREATE TABLE "Automation" (id UUID PRIMARY KEY,"userId" UUID);CREATE TABLE "MessageLog" (id TEXT,"automationId" UUID,"mediaId" TEXT,"recipientIgId" TEXT,"commentId" TEXT,"createdAt" TIMESTAMP,status TEXT,"messageType" TEXT);
 INSERT INTO "User" VALUES ('00000000-0000-0000-0000-000000000001');
 INSERT INTO "Automation" VALUES ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001');
 INSERT INTO "MessageLog" VALUES
 ('1','00000000-0000-0000-0000-000000000002','post','person','first','2026-11-01','SENT','COMMENT_REPLY'),
 ('2','00000000-0000-0000-0000-000000000002','post','person','second','2026-11-02','SENT','DM'),
 ('3','00000000-0000-0000-0000-000000000002','other-post','person','third','2026-11-02','SENT','DM'),
 ('4','00000000-0000-0000-0000-000000000002','failed-post','person','failed','2026-11-02','FAILED','DM');`);
 await db.exec(readFileSync('prisma/migrations/20261115010000_comment_recipient_claim/migration.sql','utf8'));
 expect((await db.query('SELECT "mediaId","commentId" FROM "CommentRecipientClaim" ORDER BY "mediaId"')).rows).toEqual([{mediaId:'other-post',commentId:'third'},{mediaId:'post',commentId:'first'}]);
 await db.exec('DELETE FROM "Automation"');
 expect((await db.query('SELECT * FROM "CommentRecipientClaim"')).rows).toHaveLength(2);
 await db.exec('DELETE FROM "User"');expect((await db.query('SELECT * FROM "CommentRecipientClaim"')).rows).toHaveLength(0);
 }finally{await db.close()}
},15000);
