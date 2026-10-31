import { eligibleCommentTimestamp } from "@/lib/automation-backtrack";
import { parseEmailReply } from "@/lib/automation-engagement-settings";
import { client } from "@/lib/prisma";
import { scheduleDeliveryWake } from "@/lib/qstash-delivery-wake";
import type { Prisma } from "@prisma/client";
/** A unique database claim prevents simultaneous comments/shares sending twice.
 * Ambiguous send failures retain the claim: retrying may duplicate a delivered DM. */
export async function claimDmRecipient(automationId:string,recipientIgId:string) {
  if (await client.messageLog.findFirst({where:{automationId,recipientIgId,messageType:"DM",status:"SENT"},select:{id:true}})) return false;
  const result=await client.automationDmRecipient.createMany({data:[{automationId,recipientIgId}],skipDuplicates:true});
  return result.count===1;
}
export async function deferAutomationDelivery(input:{automationId:string;eventKey:string;recipientIgId?:string;seconds:number;entry:unknown;object:string}) {
  const seconds=Math.min(82800,Math.max(1,Math.floor(input.seconds)));
  const job = await client.automationDeliveryJob.upsert({where:{automationId_eventKey:{automationId:input.automationId,eventKey:input.eventKey}},create:{automationId:input.automationId,eventKey:input.eventKey,dueAt:new Date(Date.now()+seconds*1000),payload:{entry:input.entry,object:input.object,recipientIgId:input.recipientIgId ?? null} as Prisma.InputJsonValue},update:{}});
  if (job.status !== "PENDING") return;
  // Use the original deadline on webhook retries, never extend the wait.
  if (await scheduleDeliveryWake(job)) return;
  // Short waits run inside the acknowledged webhook's background lifetime.
  // A durable row remains available to cron if that worker is interrupted.
  const remainingMs = Math.max(0, job.dueAt.getTime() - Date.now());
  if(remainingMs<=15000) {
    await new Promise(resolve=>setTimeout(resolve,remainingMs));
    await processAutomationDeliveries(new Date(),{automationId:input.automationId,eventKey:input.eventKey});
  }
}
export async function processAutomationDeliveries(now=new Date(), only?:{automationId:string;eventKey:string}) {
  const started=Date.now();
  const jobs=await client.automationDeliveryJob.findMany({where:{status:"PENDING",dueAt:{lte:now},...only},orderBy:{dueAt:"asc"},take:20,include:{automation:{select:{active:true,archivedAt:true,integrationId:true,User:{select:{status:true,subscription:{select:{plan:true}}}},listener:{select:{aiReplyEnabled:true,aiDmReplyEnabled:true,flowDefinition:true}},integration:{select:{status:true,reconnectRequired:true,planLocked:true}}}}}});
  let processed=0;
  let recoveryDeferred=0;
  for(const job of jobs){
    if(Date.now()-started>35000)break;
    const claimed=await client.automationDeliveryJob.updateMany({where:{id:job.id,status:"PENDING"},data:{status:"PROCESSING"}});
    if(!claimed.count)continue;
    const payload=job.payload as {entry:unknown;object:string;recipientIgId?:string;backtrack?:boolean;commentTimestamp?:string;recoveryDmOnly?:boolean;recoveryAttempt?:number};
    const currentAccount = job.automation.integration;
    const ownerInactive = job.automation.User?.status && job.automation.User.status !== "ACTIVE";
    const accountInactive = currentAccount && (currentAccount.status !== "CONNECTED" || currentAccount.reconnectRequired || currentAccount.planLocked);
    const paidRequired = payload.backtrack && (job.automation.listener?.aiReplyEnabled || job.automation.listener?.aiDmReplyEnabled || job.automation.listener?.flowDefinition) && !["PRO","BUSINESS"].includes(job.automation.User?.subscription?.plan ?? "FREE");
    if (ownerInactive || accountInactive || paidRequired) {await client.automationDeliveryJob.update({where:{id:job.id},data:{status:"CANCELLED",payload:{}}});continue;}
    if (payload.backtrack) {
      const latest = payload.recipientIgId && job.automation.integrationId ? await client.inboxMessage.findFirst({where:{conversation:{integrationId:job.automation.integrationId,recipientIgId:payload.recipientIgId},direction:"INBOUND"},orderBy:{createdAt:"desc"},select:{content:true}}) : null;
      if (!eligibleCommentTimestamp(payload.commentTimestamp,now.getTime()) || (latest && parseEmailReply(latest.content).kind === "stop")) {
        await client.automationDeliveryJob.update({where:{id:job.id},data:{status:"CANCELLED",payload:{}}});continue;
      }
    }
    if (payload.recoveryDmOnly && job.automation.integrationId) {
      const latestDmHealth = await client.messageLog.findFirst({
        where: {
          automation: { integrationId: job.automation.integrationId },
          messageType: "DM",
          OR: [
            { status: "SENT" },
            { status: "FAILED", errorMessage: "dm_access_disabled" },
          ],
        },
        orderBy: { createdAt: "desc" },
        select: { status: true, errorMessage: true },
      });
      if (latestDmHealth?.status === "FAILED" && latestDmHealth.errorMessage === "dm_access_disabled") {
        const dueAt = new Date(Date.now() + 5 * 60_000);
        const nextPayload = { ...payload, recoveryAttempt: (payload.recoveryAttempt ?? 0) + 1 } as Prisma.InputJsonValue;
        await client.automationDeliveryJob.update({where:{id:job.id},data:{status:"PENDING",dueAt,payload:nextPayload}});
        await scheduleDeliveryWake({id:job.id,dueAt});
        recoveryDeferred++;
        continue;
      }
    }
    // Cancel if the person has since replied, opted out, or received another response.
    const publicOnly = (payload.entry as {ap3kDeliveryStep?:string})?.ap3kDeliveryStep === "PUBLIC_REPLY";
    const conversationMovedOn = payload.recipientIgId && job.automation.integrationId ? await client.inboxMessage.findFirst({where:{conversation:{integrationId:job.automation.integrationId,recipientIgId:payload.recipientIgId},createdAt:{gt:job.createdAt},direction:{in:publicOnly ? ["INBOUND"] : ["INBOUND","OUTBOUND"]}},select:{id:true}}) : null;
    if(conversationMovedOn || !job.automation.active || job.automation.archivedAt || now.getTime()-job.createdAt.getTime()>=86400000){await client.automationDeliveryJob.update({where:{id:job.id},data:{status:"CANCELLED",payload:{}}});continue;}
    try {
      const {resumeAutomationDelivery}=await import("@/lib/meta-webhook-handler");
      const attemptStartedAt = new Date();
      await resumeAutomationDelivery(job.automationId,payload.entry,payload.object);
      if (payload.recoveryDmOnly) {
        const entry = payload.entry as {changes?:Array<{value?:{id?:string}}>} | undefined;
        const outcome = await client.messageLog.findFirst({
          where: {
            automationId: job.automationId,
            recipientIgId: payload.recipientIgId,
            commentId: entry?.changes?.[0]?.value?.id,
            messageType: "DM",
            createdAt: { gte: attemptStartedAt },
          },
          orderBy: { createdAt: "desc" },
          select: { status: true, errorMessage: true },
        });
        const retryable = outcome?.errorMessage === "dm_access_disabled" ||
          outcome?.errorMessage === "static_reply_limit_reached" ||
          Boolean(outcome?.errorMessage && /rate.?limit|too many requests|\b429\b|\b613\b/i.test(outcome.errorMessage));
        if (!outcome || (outcome.status !== "SENT" && retryable)) {
          const attempt = (payload.recoveryAttempt ?? 0) + 1;
          const dueAt = new Date(Date.now() + Math.min(15, 2 + attempt) * 60_000);
          const nextPayload = { ...payload, recoveryAttempt: attempt } as Prisma.InputJsonValue;
          await client.automationDeliveryJob.update({where:{id:job.id},data:{status:"PENDING",dueAt,payload:nextPayload}});
          await scheduleDeliveryWake({id:job.id,dueAt});
          recoveryDeferred++;
          continue;
        }
        if (outcome.status !== "SENT") {
          await client.automationDeliveryJob.update({where:{id:job.id},data:{status:"FAILED",payload:{}}});
          continue;
        }
      }
      await client.automationDeliveryJob.update({where:{id:job.id},data:{status:"COMPLETED",payload:{}}});processed++;
    } catch {
      // Never replay a worker whose external send outcome may be unknown.
      await client.automationDeliveryJob.update({where:{id:job.id},data:{status:"FAILED",payload:{}}});
    }
  }
  await client.automationDeliveryJob.updateMany({where:{status:"PROCESSING",updatedAt:{lt:new Date(now.getTime()-10*60000)}},data:{status:"FAILED",payload:{}}});
  // One wake per batch keeps large recovery queues moving without publishing
  // thousands of QStash messages. The persisted dueAt still controls pacing.
  const nextJob = await client.automationDeliveryJob.findFirst({
    where: { status: "PENDING" },
    orderBy: { dueAt: "asc" },
    select: { id: true, dueAt: true },
  });
  if (nextJob) await scheduleDeliveryWake(nextJob);
  return {delayedProcessed:processed,recoveryDeferred};
}

/** Reserve the same unique event key used by delayed/backtracked jobs before any
 * immediate send. This receipt survives ambiguous failures; never replay it. */
export async function claimImmediateComment(automationId:string,commentId:string) {
  const result=await client.automationDeliveryJob.createMany({data:[{automationId,eventKey:`comment:${commentId}`,status:"COMPLETED",dueAt:new Date(),payload:{}}],skipDuplicates:true});
  return result.count===1;
}

/** Reserve a Story webhook once even with one-DM-per-user switched off. */
export async function claimImmediateStory(automationId:string,messageId:string) {
  const result=await client.automationDeliveryJob.createMany({data:[{automationId,eventKey:`story:${messageId}`,status:"COMPLETED",dueAt:new Date(),payload:{}}],skipDuplicates:true});
  return result.count===1;
}
