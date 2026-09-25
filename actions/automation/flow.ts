"use server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { onCurrentUser } from "@/actions/user";
import { currentInstagramAccountId } from "@/lib/instagram-account-scope";
import { client } from "@/lib/prisma";
import { canActivateCampaign } from "@/actions/usage/queries";
import { validateFlow } from "@/lib/automation-flow/definition";
import { productImageId } from "@/lib/product-card";

const inputSchema = z.object({
  id: z.string().uuid().optional(),
  integrationId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  revision: z.number().int().min(0),
  active: z.boolean(),
  source: z.enum(["COMMENT", "DM", "STORY"]),
  storyTrigger: z.enum(["REPLY", "MENTION", "REACTION"]),
  keyword: z.string().trim().max(100),
  anyMessage: z.boolean(),
  post: z
    .object({
      postid: z.string().min(1).max(100),
      media: z.string().max(4000),
      caption: z.string().max(4000).optional(),
      mediaType: z.enum(["IMAGE", "VIDEO", "CAROUSEL_ALBUM"]),
    })
    .nullable(),
  opening: z.string().trim().min(1).max(800),
  openingButton: z.string().trim().min(1).max(20),
  publicReply: z.string().trim().max(300),
  flow: z.unknown(),
});
export type SaveFlowInput = z.infer<typeof inputSchema>;
export async function saveAutomationFlow(raw: SaveFlowInput) {
  const current = await onCurrentUser();
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success)
    return { status: 400, error: parsed.error.issues[0].message };
  const input = parsed.data;
  const checked = validateFlow(input.flow);
  if (!checked.flow) return { status: 400, error: checked.errors.join(" ") };
  if (input.source !== "STORY" && !input.anyMessage && !input.keyword)
    return { status: 400, error: "Add a trigger keyword." };
  if (input.source === "COMMENT" && !input.post)
    return { status: 400, error: "Choose a post or Any post." };
  const accountId = await currentInstagramAccountId(current.id);
  if (input.integrationId !== accountId)
    return {
      status: 409,
      error: "Your Instagram account changed. Reload before saving.",
    };
  const user = await client.user.findUnique({
    where: { clerkId: current.id },
    include: { subscription: true },
  });
  const integration = user
    ? await client.integrations.findFirst({
        where: { id: accountId, userId: user.id },
      })
    : null;
  if (!user || !integration)
    return { status: 403, error: "Connect Instagram before saving this flow." };
  if (user.status === "SUSPENDED")
    return { status: 403, error: "Your account is suspended." };
  const existing = input.id
    ? await client.automation.findFirst({
        where: {
          id: input.id,
          userId: user.id,
          integrationId: accountId,
          archivedAt: null,
        },
        include: { listener: true },
      })
    : null;
  if (input.id && (!existing || !existing.listener?.flowDefinition))
    return {
      status: 404,
      error: "This flow is not available in the selected account.",
    };
  if (input.active) {
    if (!["PRO", "BUSINESS"].includes(user.subscription?.plan ?? "FREE"))
      return {
        status: 403,
        error:
          "Publishing custom flows requires Pro or Business. You can save and preview a draft on Free.",
      };
    if (
      integration.status !== "CONNECTED" ||
      integration.reconnectRequired ||
      integration.planLocked
    )
      return {
        status: 403,
        error: "Reconnect or unlock this Instagram account before publishing.",
      };
    if (existing?.needsReview)
      return {
        status: 403,
        error:
          "This automation needs an account review before it can be published.",
      };
    if (!(await canActivateCampaign(user.id, input.id)).ok)
      return {
        status: 403,
        error: "Your active-automation limit has been reached.",
      };
  }
  for (const node of checked.flow.nodes)
    if (node.kind === "product") {
      const imageId = productImageId(node.image);
      if (
        !imageId ||
        !(await client.automationImage.findFirst({
          where: { id: imageId, userId: user.id },
          select: { id: true },
        }))
      )
        return {
          status: 400,
          error: `${node.label}: upload a product image from your own account.`,
        };
    }
  try {
    const saved = await client.$transaction(async (tx) => {
      if (input.id) {
        const claimed = await tx.listener.updateMany({
          where: { automationId: input.id, flowRevision: input.revision },
          data: { flowRevision: { increment: 1 } },
        });
        if (!claimed.count) throw new Error("FLOW_CONFLICT");
      }
      const automation = await tx.automation.upsert({
        where: { id: input.id ?? crypto.randomUUID() },
        create: { userId: user.id, integrationId: accountId, name: input.name },
        update: {},
        select: { id: true },
      });
      await tx.keyword.deleteMany({ where: { automationId: automation.id } });
      await tx.post.deleteMany({ where: { automationId: automation.id } });
      await tx.trigger.deleteMany({ where: { automationId: automation.id } });
      // Editing cancels pending runs; old buttons cannot silently execute a new graph.
      await tx.automationFlowSession.updateMany({
        where: { automationId: automation.id },
        data: { status: "CANCELLED" },
      });
      return tx.automation.update({
        where: { id: automation.id },
        data: {
          name: input.name,
          active: input.active,
          source: input.source,
          sendPrivateDm: true,
          storyTriggerType:
            input.source === "STORY" ? input.storyTrigger : null,
          triggerMode: input.anyMessage
            ? input.source === "COMMENT"
              ? "ANY_COMMENT"
              : "ANY_MESSAGE"
            : "SPECIFIC_KEYWORD",
          matchingMode: "CONTAINS",
          followGateRequired: false,
          keywords:
            !input.anyMessage && input.source !== "STORY"
              ? { create: { word: input.keyword.toLowerCase() } }
              : undefined,
          posts:
            input.source === "COMMENT" && input.post
              ? { create: input.post }
              : undefined,
          trigger: {
            create: {
              type:
                input.source === "STORY"
                  ? `STORY_${input.storyTrigger}`
                  : input.source,
            },
          },
          listener: {
            upsert: {
              create: {
                flowRevision: 1,
                prompt: "Continue the conversation",
                flowDefinition: checked.flow as Prisma.InputJsonValue,
                openingDmEnabled: true,
                openingDmText: input.opening,
                openingDmButtonText: input.openingButton,
                commentReply: input.publicReply || null,
              },
              update: {
                flowDefinition: checked.flow as Prisma.InputJsonValue,
                openingDmEnabled: true,
                openingDmText: input.opening,
                openingDmButtonText: input.openingButton,
                commentReply: input.publicReply || null,
              },
            },
          },
        },
        select: { id: true },
      });
    });
    return {
      status: 200,
      id: saved.id,
      revision: input.id ? input.revision + 1 : 1,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "FLOW_CONFLICT")
      return {
        status: 409,
        error:
          "This flow was changed in another tab. Reload before replacing its settings.",
      };
    return {
      status: 500,
      error:
        "The flow could not be saved. Your changes are still in the editor. Please try again.",
    };
  }
}

export async function getAutomationFlowEntries(automationId: string) {
  const current = await onCurrentUser();
  const accountId = await currentInstagramAccountId(current.id);
  const automation = await client.automation.findFirst({
    where: {
      id: automationId,
      integrationId: accountId,
      User: { clerkId: current.id },
      archivedAt: null,
    },
    select: { id: true },
  });
  if (!automation) return [];
  return client.automationFlowEntry.findMany({
    where: { automationId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, recipientIgId: true, outcome: true, createdAt: true },
  });
}
