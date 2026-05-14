import { NextRequest, NextResponse } from "next/server";
import {
  findAutomationForComment,
  findAutomationForDM,
  findAutomationById,
  isDuplicate,
  createMessageLog,
  upsertLead,
  createAutomationEvent,
  createChatHistory,
  getChatHistory,
  trackResponse,
} from "@/actions/webhook/queries";
import { matchKeywordWithMode } from "@/lib/matching";
import {
  formatSafeMetaError,
  getSafeMetaError,
  sendDm,
  sendPrivateMessage,
  sendCommentReply,
} from "@/lib/fetch";
import { resolveTemplate } from "@/lib/template";
import { openai } from "@/lib/openai";

// ---------------------------------------------------------------------------
// GET — Meta webhook verification challenge
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  const tokenMatch = token === process.env.META_VERIFY_TOKEN;
  console.log("[webhook] GET verify", {
    mode,
    token_match: tokenMatch,
    challenge_exists: Boolean(challenge),
    has_env_token: Boolean(process.env.META_VERIFY_TOKEN),
  });

  if (mode === "subscribe" && tokenMatch && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "webhook_verification_failed" }, { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — Process Instagram comment and DM events
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entries = Array.isArray(body.entry) ? body.entry : [];
    if (entries.length === 0) return ok();

    await Promise.all(entries.map(processEntry));

    return ok();
  } catch (error) {
    // Never return 5xx to Meta — always acknowledge receipt
    console.error("[webhook] unhandled error", {
      message: error instanceof Error ? error.message : String(error),
    });
    return ok();
  }
}

async function processEntry(entry: any) {
  const igAccountId: string = entry.id;
  const changes = Array.isArray(entry.changes) ? entry.changes : [];
  const messaging = Array.isArray(entry.messaging) ? entry.messaging : [];

  const field = changes[0]?.field ?? (messaging.length ? "messaging" : "unknown");
  console.log(`[webhook] POST field=${field} igAccountId=${igAccountId}`);

  for (const changeItem of changes) {

    // -----------------------------------------------------------------------
    // COMMENT EVENT
    // -----------------------------------------------------------------------
    if (changeItem.field === "comments") {
      const change = changeItem.value;
      const mediaId: string | undefined = change.media?.id;
      const commentId: string | undefined = change.id;
      const commenterId: string | undefined = change.from?.id;
      const commenterUsername: string | undefined = change.from?.username;
      const commentText: string = change.text ?? "";

      if (!mediaId || !commentId || !commenterId || !commentText) continue;

      // 1. Find active automation for this post
      const automation = await findAutomationForComment(mediaId, igAccountId);
      if (!automation?.listener) {
        console.log(`[webhook] automation match: none (mediaId=${mediaId})`);
        continue;
      }

      // 2. Match keyword using this automation's matching mode
      const matchedKeyword = matchKeywordWithMode(
        commentText,
        automation.keywords,
        automation.matchingMode
      );

      if (!matchedKeyword) {
        console.log(`[webhook] automation match: none (automationId=${automation.id} mode=${automation.matchingMode})`);
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "NO_MATCH",
          igUserId: commenterId,
          mediaId,
          commentId,
          keyword: commentText.slice(0, 100),
        });
        continue;
      }

      console.log(`[webhook] automation match: ${automation.id} keyword="${matchedKeyword}"`);

      // 3. Log comment received
      await createAutomationEvent({
        automationId: automation.id,
        eventType: "COMMENT_RECEIVED",
        igUserId: commenterId,
        mediaId,
        commentId,
        keyword: matchedKeyword,
      });
      await trackResponse(automation.id, "COMMENT");

      // 4. Duplicate check — skip if we already DM'd this person for this automation
      if (await isDuplicate(automation.id, commenterId, mediaId, commentId)) {
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "DUPLICATE_SKIPPED",
          igUserId: commenterId,
          mediaId,
          commentId,
          keyword: matchedKeyword,
        });
        continue;
      }

      const token = automation.User?.integrations?.[0]?.token;
      if (!token) {
        console.warn("[webhook] automation token missing", { automationId: automation.id });
        continue;
      }

      const listener = automation.listener;

      const templateVars = {
        username: commenterUsername ?? "",
        first_name: commenterUsername ?? "",
        keyword: matchedKeyword,
        link: listener.ctaLink ?? "",
      };

      // 5. Send public comment reply if configured
      if (listener.commentReply) {
        const replyText = resolveTemplate(listener.commentReply, templateVars);
        try {
          const replyResult = await sendCommentReply(commentId, replyText, token);
          const sent = replyResult.status === 200;
          await createMessageLog({
            automationId: automation.id,
            recipientIgId: commenterId,
            mediaId,
            commentId,
            messageType: "COMMENT_REPLY",
            status: sent ? "SENT" : "FAILED",
          });
          await createAutomationEvent({
            automationId: automation.id,
            eventType: sent ? "PUBLIC_REPLY_SENT" : "PUBLIC_REPLY_FAILED",
            igUserId: commenterId,
            mediaId,
            commentId,
            keyword: matchedKeyword,
          });
        } catch (err) {
          const safeError = formatSafeMetaError(err);
          console.warn("[webhook] public reply failed", getSafeMetaError(err));
          await createMessageLog({
            automationId: automation.id,
            recipientIgId: commenterId,
            mediaId,
            commentId,
            messageType: "COMMENT_REPLY",
            status: "FAILED",
            errorMessage: safeError,
          });
          await createAutomationEvent({
            automationId: automation.id,
            eventType: "PUBLIC_REPLY_FAILED",
            igUserId: commenterId,
            mediaId,
            commentId,
            keyword: matchedKeyword,
            meta: { error: safeError },
          });
        }
      }

      // 6. Build DM message — resolve template first, then optionally run through SMARTAI
      const isSmartAi =
        listener.listener === "SMARTAI" &&
        automation.User?.subscription?.plan === "PRO" &&
        !!process.env.OPENAI_API_KEY;

      let dmMessageText = resolveTemplate(listener.prompt, templateVars);

      if (isSmartAi) {
        try {
          const aiResp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "assistant",
                content: `${dmMessageText}: Keep responses under 2 sentences`,
              },
            ],
          });
          dmMessageText = aiResp.choices[0].message.content ?? dmMessageText;
        } catch {
          // SMARTAI unavailable — fall through with the resolved prompt text
        }
      }

      // 7. Send private DM (referenced to the comment)
      try {
        const dmResult = await sendPrivateMessage(
          igAccountId,
          commentId,
          dmMessageText,
          token
        );
        const sent = dmResult.status === 200;
        console.log(`[webhook] ${sent ? "DM_SENT" : "DM_FAILED"} recipientId=${commenterId} automationId=${automation.id}`);
        await createMessageLog({
          automationId: automation.id,
          recipientIgId: commenterId,
          mediaId,
          commentId,
          messageType: "DM",
          status: sent ? "SENT" : "FAILED",
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: sent ? "DM_SENT" : "DM_FAILED",
          igUserId: commenterId,
          mediaId,
          commentId,
          keyword: matchedKeyword,
        });
        if (sent) {
          await upsertLead({
            automationId: automation.id,
            igUserId: commenterId,
            igUsername: commenterUsername,
            commentText,
            mediaId,
          });
          await trackResponse(automation.id, "DM");
        }
      } catch (err) {
        const safeError = formatSafeMetaError(err);
        console.warn("[webhook] private reply failed", getSafeMetaError(err));
        await createMessageLog({
          automationId: automation.id,
          recipientIgId: commenterId,
          mediaId,
          commentId,
          messageType: "DM",
          status: "FAILED",
          errorMessage: safeError,
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "DM_FAILED",
          igUserId: commenterId,
          mediaId,
          commentId,
          keyword: matchedKeyword,
          meta: { error: safeError },
        });
      }
      continue;
    } else {
      console.log("[webhook] unsupported change ignored", { field: changeItem.field });
      continue;
    }
  }

  for (const messagingItem of messaging) {
    // -----------------------------------------------------------------------
    // DM EVENT
    // -----------------------------------------------------------------------
    if (messagingItem) {
      const senderId: string | undefined = messagingItem.sender?.id;
      const dmText: string = messagingItem.message?.text ?? "";

      if (!senderId || !dmText) continue;

      // 1. Try to match an automation by keyword
      const result = await findAutomationForDM(dmText, igAccountId);

      if (!result) {
        console.log(`[webhook] DM no-match senderId=${senderId} — checking SMARTAI conversation`);
        // No keyword match — check for an ongoing SMARTAI conversation
        try {
          const chatHistory = await getChatHistory(igAccountId, senderId);
          if (chatHistory.history.length > 0 && chatHistory.automationId) {
            const automation = await findAutomationById(chatHistory.automationId);
            if (
              automation?.listener?.listener === "SMARTAI" &&
              automation.User?.subscription?.plan === "PRO" &&
              process.env.OPENAI_API_KEY
            ) {
              const token = automation.User?.integrations?.[0]?.token;
              if (token) {
                const aiResp = await openai.chat.completions.create({
                  model: "gpt-4o-mini",
                  messages: [
                    {
                      role: "assistant",
                      content: `${automation.listener.prompt}: Keep responses under 2 sentences`,
                    },
                    ...chatHistory.history,
                    { role: "user", content: dmText },
                  ],
                });
                const aiText = aiResp.choices[0].message.content;
                if (aiText) {
                  await Promise.all([
                    createChatHistory(automation.id, igAccountId, dmText, senderId),
                    createChatHistory(automation.id, igAccountId, aiText, senderId),
                  ]);
                  await sendDm(igAccountId, senderId, aiText, token);
                }
              }
            }
          }
        } catch {
          // Continuation path is non-critical — swallow errors
        }
        continue;
      }

      const { automation, matchedKeyword } = result;
      console.log(`[webhook] DM match: automationId=${automation.id} keyword="${matchedKeyword}"`);

      // 2. Duplicate check
      if (await isDuplicate(automation.id, senderId)) {
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "DUPLICATE_SKIPPED",
          igUserId: senderId,
          keyword: matchedKeyword,
        });
        continue;
      }

      const token = automation.User?.integrations?.[0]?.token;
      if (!token || !automation.listener) {
        console.warn("[webhook] DM automation token or listener missing", {
          automationId: automation.id,
          hasToken: Boolean(token),
          hasListener: Boolean(automation.listener),
        });
        continue;
      }

      const templateVars = {
        username: "",
        first_name: "",
        keyword: matchedKeyword,
        link: automation.listener.ctaLink ?? "",
      };

      const isSmartAi =
        automation.listener.listener === "SMARTAI" &&
        automation.User?.subscription?.plan === "PRO" &&
        !!process.env.OPENAI_API_KEY;

      let dmMessageText = resolveTemplate(automation.listener.prompt, templateVars);

      if (isSmartAi) {
        try {
          await createChatHistory(automation.id, igAccountId, dmText, senderId);
          const aiResp = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "assistant",
                content: `${dmMessageText}: Keep responses under 2 sentences`,
              },
            ],
          });
          dmMessageText = aiResp.choices[0].message.content ?? dmMessageText;
          await createChatHistory(automation.id, igAccountId, dmMessageText, senderId);
        } catch {
          // SMARTAI unavailable — fall through with resolved prompt
        }
      }

      try {
        const dmResult = await sendDm(igAccountId, senderId, dmMessageText, token);
        const sent = dmResult.status === 200;
        await createMessageLog({
          automationId: automation.id,
          recipientIgId: senderId,
          messageType: "DM",
          status: sent ? "SENT" : "FAILED",
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: sent ? "DM_SENT" : "DM_FAILED",
          igUserId: senderId,
          keyword: matchedKeyword,
        });
        if (sent) await trackResponse(automation.id, "DM");
      } catch (err) {
        const safeError = formatSafeMetaError(err);
        console.warn("[webhook] DM send failed", getSafeMetaError(err));
        await createMessageLog({
          automationId: automation.id,
          recipientIgId: senderId,
          messageType: "DM",
          status: "FAILED",
          errorMessage: safeError,
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "DM_FAILED",
          igUserId: senderId,
          keyword: matchedKeyword,
          meta: { error: safeError },
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function ok() {
  return NextResponse.json({ received: true }, { status: 200 });
}
