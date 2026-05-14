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
import { sendDm, sendPrivateMessage, sendCommentReply } from "@/lib/fetch";
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
  console.log(`[webhook] GET verify: mode=${mode} token_match=${tokenMatch}`);

  if (mode === "subscribe" && tokenMatch) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// ---------------------------------------------------------------------------
// POST — Process Instagram comment and DM events
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = body.entry?.[0];
    if (!entry) return ok();

    const igAccountId: string = entry.id;

    const field = entry.changes?.[0]?.field ?? (entry.messaging ? "messaging" : "unknown");
    console.log(`[webhook] POST field=${field} igAccountId=${igAccountId}`);

    // -----------------------------------------------------------------------
    // COMMENT EVENT
    // -----------------------------------------------------------------------
    if (entry.changes?.[0]?.field === "comments") {
      const change = entry.changes[0].value;
      const mediaId: string | undefined = change.media?.id;
      const commentId: string | undefined = change.id;
      const commenterId: string | undefined = change.from?.id;
      const commenterUsername: string | undefined = change.from?.username;
      const commentText: string = change.text ?? "";

      if (!mediaId || !commentId || !commenterId || !commentText) return ok();

      // 1. Find active automation for this post
      const automation = await findAutomationForComment(mediaId, igAccountId);
      if (!automation?.listener) {
        console.log(`[webhook] automation match: none (mediaId=${mediaId})`);
        return ok();
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
        return ok();
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

      // 4. Duplicate check — skip if we already DM'd this person for this automation
      if (await isDuplicate(automation.id, commenterId)) {
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "DUPLICATE_SKIPPED",
          igUserId: commenterId,
          mediaId,
          commentId,
          keyword: matchedKeyword,
        });
        return ok();
      }

      const token = automation.User?.integrations?.[0]?.token;
      if (!token) return ok();

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
          await createMessageLog({
            automationId: automation.id,
            recipientIgId: commenterId,
            mediaId,
            commentId,
            messageType: "COMMENT_REPLY",
            status: "FAILED",
            errorMessage: String(err),
          });
          await createAutomationEvent({
            automationId: automation.id,
            eventType: "PUBLIC_REPLY_FAILED",
            igUserId: commenterId,
            mediaId,
            keyword: matchedKeyword,
            meta: { error: String(err) },
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
          await trackResponse(automation.id, "COMMENT");
        }
      } catch (err) {
        await createMessageLog({
          automationId: automation.id,
          recipientIgId: commenterId,
          mediaId,
          commentId,
          messageType: "DM",
          status: "FAILED",
          errorMessage: String(err),
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "DM_FAILED",
          igUserId: commenterId,
          keyword: matchedKeyword,
          meta: { error: String(err) },
        });
      }

      return ok();
    }

    // -----------------------------------------------------------------------
    // DM EVENT
    // -----------------------------------------------------------------------
    if (entry.messaging?.[0]) {
      const messaging = entry.messaging[0];
      const senderId: string | undefined = messaging.sender?.id;
      const dmText: string = messaging.message?.text ?? "";

      if (!senderId || !dmText) return ok();

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
        return ok();
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
        return ok();
      }

      const token = automation.User?.integrations?.[0]?.token;
      if (!token || !automation.listener) return ok();

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
        await createMessageLog({
          automationId: automation.id,
          recipientIgId: senderId,
          messageType: "DM",
          status: "FAILED",
          errorMessage: String(err),
        });
        await createAutomationEvent({
          automationId: automation.id,
          eventType: "DM_FAILED",
          igUserId: senderId,
          keyword: matchedKeyword,
          meta: { error: String(err) },
        });
      }

      return ok();
    }

    return ok();
  } catch (error) {
    // Never return 5xx to Meta — always acknowledge receipt
    console.error("[Webhook] Unhandled error:", error);
    return ok();
  }
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function ok() {
  return NextResponse.json({ received: true }, { status: 200 });
}
