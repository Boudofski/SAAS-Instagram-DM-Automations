import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import { client } from "@/lib/prisma";
import { messagingWindowOpen } from "@/lib/automation-engagement-settings";
import {
  readFlow,
  branchTarget,
  responseTarget,
  resolveFlowText,
  type FlowValues,
} from "./definition";
import { resolveIntegrationSendToken } from "@/lib/send-token";
import { sendInstagramDirectResponse } from "@/lib/instagram-dm";
import { canSendStaticReply } from "@/actions/usage/queries";
import {
  createAutomationEvent,
  createMessageLog,
  recordOutboundInboxMessage,
  trackResponse,
} from "@/actions/webhook/queries";

export type FlowInput = {
  integrationId: string;
  recipientIgId: string;
  text: string;
  inboundAt?: Date | null;
  eventId: string;
  automationId?: string;
  startEventId?: string;
};
/** Returns true only when a custom flow owns this inbound message. */
export async function processAutomationFlow(
  input: FlowInput,
): Promise<boolean> {
  const key = {
    integrationId: input.integrationId,
    recipientIgId: input.recipientIgId,
  };
  let session = await client.automationFlowSession.findUnique({
    where: { integrationId_recipientIgId: key },
  });
  const now = new Date();
  if (/^stop$/i.test(input.text.trim())) {
    if (session)
      await client.automationFlowSession.update({
        where: { id: session.id },
        data: {
          status: "STOPPED",
          expiresAt: new Date(now.getTime() + 86400000),
        },
      });
    return Boolean(session);
  }
  if (!input.inboundAt || !messagingWindowOpen(input.inboundAt))
    return Boolean(input.automationId || session?.status === "WAITING");
  if (
    session?.lastEventId === input.eventId ||
    (session?.status === "STOPPED" && session.expiresAt > now)
  )
    return true;
  // An ambiguous send is never retried automatically after a crashed worker.
  if (session?.status.startsWith("PROCESSING:")) {
    if (session.updatedAt.getTime() < now.getTime() - 90_000)
      await client.automationFlowSession.updateMany({
        where: {
          id: session.id,
          status: session.status,
          updatedAt: session.updatedAt,
        },
        data: { status: "FAILED" },
      });
    return true;
  }
  if (input.startEventId && session?.startEventId === input.startEventId)
    return true;
  const resuming =
    !input.automationId &&
    session?.status === "WAITING" &&
    session.expiresAt > now;
  const automationId =
    input.automationId ?? (resuming ? session?.automationId : undefined);
  if (!automationId) return false;
  const automation = await client.automation.findFirst({
    where: {
      id: automationId,
      integrationId: input.integrationId,
      active: true,
      archivedAt: null,
      User: { status: { not: "SUSPENDED" } },
    },
    include: {
      listener: true,
      integration: true,
      User: { include: { subscription: true } },
    },
  });
  const integration = automation?.integration;
  const flow = readFlow(
    resuming ? session?.definition : automation?.listener?.flowDefinition,
  );
  if (
    !flow ||
    !automation?.userId ||
    !integration ||
    integration.status !== "CONNECTED" ||
    integration.reconnectRequired ||
    integration.planLocked ||
    !["PRO", "BUSINESS"].includes(automation.User?.subscription?.plan ?? "FREE")
  ) {
    if (resuming && session)
      await client.automationFlowSession.update({
        where: { id: session.id },
        data: { status: "CANCELLED" },
      });
    return Boolean(input.automationId);
  }
  const token = resolveIntegrationSendToken(integration);
  if (!token.ok || !integration.instagramId) return true;
  if (resuming && session) {
    // A manual response ends the bot's turn rather than competing with the owner.
    const humanReply = await client.inboxMessage.findFirst({
      where: {
        conversation: {
          integrationId: integration.id,
          recipientIgId: input.recipientIgId,
        },
        direction: "OUTBOUND",
        createdAt: { gt: session.updatedAt },
      },
      select: { id: true },
    });
    if (humanReply) {
      await client.automationFlowSession.update({
        where: { id: session.id },
        data: { status: "CANCELLED" },
      });
      return true;
    }
  }
  const receipt = await client.automationFlowReceipt.createMany({
    data: [{ ...key, automationId, eventId: input.eventId }],
    skipDuplicates: true,
  });
  if (!receipt.count) return true;
  const lease = `PROCESSING:${crypto.randomUUID()}`;
  const expiresAt = new Date(input.inboundAt.getTime() + 86400000);
  try {
    if (!session) {
      session = await client.automationFlowSession.create({
        data: {
          ...key,
          automationId,
          definition: flow as Prisma.InputJsonValue,
          nodeId: flow.entry,
          status: lease,
          expiresAt,
          lastEventId: input.eventId,
          startEventId: input.startEventId ?? input.eventId,
        },
      });
    } else {
      const claim = await client.automationFlowSession.updateMany({
        where: {
          id: session.id,
          status: session.status,
          updatedAt: session.updatedAt,
        },
        data: {
          status: lease,
          expiresAt,
          lastEventId: input.eventId,
          ...(!resuming
            ? {
                automationId,
                definition: flow as Prisma.InputJsonValue,
                values: {},
                nodeId: flow.entry,
                startedAt: now,
                startEventId: input.startEventId ?? input.eventId,
              }
            : {}),
        },
      });
      if (!claim.count) return true;
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return true;
    throw e;
  }
  const sessionId = session.id;
  const persist = async (
    status: string,
    nodeId: string | null,
    values: FlowValues,
  ) =>
    client.automationFlowSession.updateMany({
      where: { id: sessionId, status: lease },
      data: { status, nodeId, values },
    });
  let values: FlowValues =
    resuming &&
    session.values &&
    typeof session.values === "object" &&
    !Array.isArray(session.values)
      ? Object.fromEntries(
          Object.entries(session.values).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          ),
        )
      : {};
  let nodeId = resuming ? session.nodeId : flow.entry;
  let sentCount = 0;
  try {
    if (!resuming)
      await client.automationEngagementJob.updateMany({
        where: {
          recipientIgId: input.recipientIgId,
          kind: "EMAIL",
          status: { in: ["WAITING", "PENDING"] },
          automation: { integrationId: input.integrationId },
        },
        data: { status: "CANCELLED" },
      });
    if (!resuming && flow.oncePerContact) {
      const entry = await client.automationFlowEntry.createMany({
        data: [{ automationId, recipientIgId: input.recipientIgId }],
        skipDuplicates: true,
      });
      if (!entry.count) {
        await persist("COMPLETED", null, values);
        return true;
      }
    }
    if (resuming) {
      const waiting = flow.nodes.find((n) => n.id === nodeId);
      const response = waiting ? responseTarget(waiting, input.text) : null;
      if (!response) {
        await persist("WAITING", nodeId, values);
        return true;
      }
      values = { ...values, ...response.values };
      nodeId = response.next;
      if (response.values.email)
        await client.lead.upsert({
          where: {
            automationId_igUserId: {
              automationId,
              igUserId: input.recipientIgId,
            },
          },
          create: {
            automationId,
            igUserId: input.recipientIgId,
            email: response.values.email,
            emailCollectedAt: now,
          },
          update: { email: response.values.email, emailCollectedAt: now },
        });
    }
    for (let steps = 0; nodeId && steps < 30; steps++) {
      const node = flow.nodes.find((n) => n.id === nodeId);
      if (!node) throw new Error("flow_step_missing");
      // Save the selected outcome before sending. A retry cannot redraw a giveaway.
      if (
        node.kind === "random" ||
        node.kind === "condition" ||
        node.kind === "tag"
      ) {
        if (node.kind === "tag") values[`tag_${node.tag}`] = "true";
        nodeId = branchTarget(
          node,
          values,
          randomInt(0, 1_000_000) / 1_000_000,
        );
        if (node.kind === "random" && flow.oncePerContact) {
          await client.automationFlowEntry.updateMany({
            where: { automationId, recipientIgId: input.recipientIgId },
            data: {
              outcome:
                flow.nodes.find((n) => n.id === nodeId)?.label ?? "Finished",
            },
          });
        }
        await persist(lease, nodeId, values);
        continue;
      }
      if (node.kind === "end") {
        nodeId = null;
        break;
      }
      if (
        ++sentCount > 6 ||
        !messagingWindowOpen(input.inboundAt) ||
        !(await canSendStaticReply(automation.userId)).ok
      )
        throw new Error("flow_delivery_limit");
      const owned = await client.automationFlowSession.findFirst({
        where: { id: sessionId, status: lease },
        select: { id: true },
      });
      const active = await client.automation.findFirst({
        where: {
          id: automationId,
          active: true,
          archivedAt: null,
          integration: {
            status: "CONNECTED",
            reconnectRequired: false,
            planLocked: false,
          },
          User: { status: { not: "SUSPENDED" } },
        },
        select: { id: true },
      });
      if (!owned || !active) {
        await persist("CANCELLED", nodeId, values);
        return true;
      }
      const text =
        resolveFlowText(node.text, values) +
        (node.kind === "email"
          ? "\n\nReply SKIP to continue without an email, or STOP to cancel."
          : node.kind === "question"
            ? "\n\nReply with one of the options below, or STOP to cancel."
            : "");
      const result = await sendInstagramDirectResponse({
        token: token.token,
        igBusinessAccountId: integration.instagramId,
        recipientId: input.recipientIgId,
        automationId,
        message: text,
        responseFormat:
          node.kind === "product"
            ? "PRODUCT_CARD"
            : "links" in node && node.links.length
              ? "LINK"
              : "TEXT",
        linkButtons: "links" in node ? node.links : [],
        quickReplies:
          node.kind === "question" ? node.options.map((o) => o.label) : [],
        mediaUrl: node.kind === "product" ? node.image : undefined,
        mediaType: node.kind === "product" ? "IMAGE" : undefined,
        cardSubtitle: node.kind === "product" ? node.subtitle : undefined,
      });
      await createMessageLog({
        automationId,
        recipientIgId: input.recipientIgId,
        commentId: `${input.eventId}:${node.id}`,
        messageType: "DM",
        status: result.ok ? "SENT" : "FAILED",
        errorMessage: result.ok ? "flow_step_sent" : "flow_step_failed",
      });
      if (!result.ok) throw new Error("flow_step_failed");
      await trackResponse(automationId, "DM");
      await recordOutboundInboxMessage({
        userId: automation.userId,
        integrationId: integration.id,
        recipientIgId: input.recipientIgId,
        automationId,
        content: text,
        metaMessageId: result.messageIds[0],
      });
      await createAutomationEvent({
        automationId,
        eventType: "DM_SENT",
        igUserId: input.recipientIgId,
        meta: { flowNodeId: node.id, flowNodeKind: node.kind },
      });
      if (node.kind === "email" || node.kind === "question") {
        await persist("WAITING", node.id, values);
        return true;
      }
      nodeId = node.next;
      await persist(lease, nodeId, values);
    }
    await persist("COMPLETED", null, values);
  } catch (error) {
    await persist("FAILED", nodeId, values);
    await createAutomationEvent({
      automationId,
      eventType: "DM_FAILED",
      igUserId: input.recipientIgId,
      meta: {
        reason: error instanceof Error ? error.message : "flow_failed",
        flowNodeId: nodeId,
      },
    });
  }
  return true;
}
