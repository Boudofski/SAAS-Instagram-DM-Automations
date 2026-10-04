"use server";
import { getCurrentWorkspaceClerkId } from "@/actions/user";
import { currentInstagramAccountId } from "@/lib/instagram-account-scope";
import { client } from "@/lib/prisma";
import { resolveInstagramMediaConnection } from "@/lib/instagram-media";
import { readFlowTriggers } from "@/lib/automation-flow/triggers";
import { backtrackMediaIds, backtrackMatches, eligibleCommentTimestamp, encodeBacktrackCursor, decodeBacktrackCursor, type BacktrackCursor } from "@/lib/automation-backtrack";
import { hasProcessedCommentWebhook } from "@/actions/webhook/queries";
import { scheduleDeliveryWake } from "@/lib/qstash-delivery-wake";
import { Prisma } from "@prisma/client";

class ToolError extends Error {}

async function context(id:string) {
  const clerkId=await getCurrentWorkspaceClerkId();
  if(!clerkId) throw new ToolError("Sign in to manage your automations.");
  if(!/^[0-9a-f-]{36}$/i.test(id)) throw new ToolError("Automation not found.");
  const integrationId=await currentInstagramAccountId(clerkId);
  const automation=await client.automation.findFirst({where:{id,integrationId,User:{clerkId,status:"ACTIVE"},archivedAt:null},include:{posts:true,keywords:true,listener:true,integration:true,User:{select:{subscription:{select:{plan:true}}}}}});
  if(!automation?.integration || automation.integration.status!=="CONNECTED" || automation.integration.reconnectRequired || automation.integration.planLocked) throw new ToolError("Reconnect the selected Instagram account to use this tool.");
  const connection=resolveInstagramMediaConnection([automation.integration]);
  if(!connection.ok) throw new ToolError(connection.error);
  return {automation,connection,integration:automation.integration};
}
async function graph(connection:{apiBaseUrl:string;token:string}, id:string, fields:string, after?:string) {
  const url=new URL(`${connection.apiBaseUrl.replace(/\/$/,"")}/${id}`);
  url.searchParams.set("fields",fields);
  if(id.endsWith("/comments")){url.searchParams.set("limit","20");if(after)url.searchParams.set("after",after);}
  const response=await fetch(url,{headers:{Authorization:`Bearer ${connection.token}`},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(10000)});
  if(!response.ok) throw new ToolError("Instagram could not load this media or its comments. Check your connection and permissions, then try again.");
  return response.json();
}
async function ownedMedia(ctx:Awaited<ReturnType<typeof context>>, id:string) {
  const media=await graph(ctx.connection,id,"id,owner,caption,permalink,media_url,thumbnail_url");
  if(String(media.owner?.id ?? media.owner)!==ctx.integration.instagramId || String(media.id)!==id) throw new ToolError("This post does not belong to the selected Instagram account.");
  const link=typeof media.permalink === "string" ? new URL(media.permalink) : null;
  const permalink=link?.protocol==="https:" && /^(www\.)?instagram\.com$/.test(link.hostname) ? link.href : undefined;
  return {id,caption:typeof media.caption === "string" ? media.caption : undefined,permalink,thumbnailUrl:typeof (media.thumbnail_url ?? media.media_url)==="string" ? media.thumbnail_url ?? media.media_url : undefined};
}
export async function getBacktrackInfo(automationId:string) {
  try {
    const ctx=await context(automationId);const ids=backtrackMediaIds(ctx.automation);
    const media=await Promise.all(ids.map(id=>ownedMedia(ctx,id)));
    const triggers=readFlowTriggers(ctx.automation.listener?.flowTriggers);
    const commentTriggers=triggers?.filter(t=>t.source==="COMMENT");
    const keywords=commentTriggers ? Array.from(new Set(commentTriggers.map(t=>t.keyword).filter(Boolean))) : ctx.automation.keywords.map(k=>k.word);
    const anyComment=commentTriggers ? commentTriggers.some(t=>t.anyMessage) : ctx.automation.triggerMode==="ANY_COMMENT";
    const eligible=ctx.automation.active && Boolean(ctx.automation.listener) && ids.length>0;
    return {ok:true as const,keywords,anyComment,media,eligible,reason:eligible?undefined:!ids.length?"Choose a specific post or Reel before backtracking.":"Publish this automation before backtracking."};
  } catch(e) { return {ok:false as const,error:e instanceof ToolError?e.message:"Could not load automation tools."}; }
}
export async function startBacktrack(automationId:string,cursor?:string) {
  try {
    const ctx=await context(automationId);const {automation,integration,connection}=ctx;
    if(!automation.active || !automation.listener) throw new ToolError("Publish this automation before backtracking.");
    if((automation.listener.aiReplyEnabled || automation.listener.aiDmReplyEnabled || automation.listener.flowDefinition) && !["PRO","BUSINESS"].includes(automation.User?.subscription?.plan ?? "FREE")) throw new ToolError("AI replies and Flow automations are only available on paid plans.");
    const mediaIds=backtrackMediaIds(automation);
    if(!mediaIds.length) throw new ToolError("Choose a specific post or Reel before backtracking.");
    const state:BacktrackCursor=cursor ? decodeBacktrackCursor(cursor,connection.token,automationId,integration.id) : {automationId,integrationId:integration.id,mediaIds,index:0,expires:Date.now()+3600000};
    if(state.mediaIds.join(",")!==mediaIds.join(",")) throw new ToolError("The automation's posts changed. Start backtracking again.");
    const mediaId=state.mediaIds[state.index];await ownedMedia(ctx,mediaId);
    const page=await graph(connection,`${mediaId}/comments`,"id,text,timestamp,from",state.after);
    if(!Array.isArray(page.data)) throw new ToolError("Instagram returned an invalid comments page. Try again.");
    let queued=0,skipped=0;const wakes:Promise<boolean>[]=[];
    for(const comment of page.data) {
      const recipient=comment.from?.id;
      if(!/^\d+$/.test(String(comment.id ?? "")) || typeof recipient!=="string" || recipient===integration.instagramId || !eligibleCommentTimestamp(comment.timestamp) || typeof comment.text!=="string" || !backtrackMatches(automation,comment.text,mediaId) || await hasProcessedCommentWebhook(automation.id,comment.id)){skipped++;continue;}
      const entry={ap3kBacktrack:true,id:integration.webhookAccountId || integration.instagramId,changes:[{field:"comments",value:{id:comment.id,text:comment.text,from:comment.from,media:{id:mediaId},timestamp:comment.timestamp}}]};
      const payload={entry,object:connection.apiFamily==="instagram_graph"?"instagram":"page",recipientIgId:recipient,backtrack:true,commentTimestamp:comment.timestamp};
      const dueAt=new Date(Date.now()+Math.max(1,automation.deliveryDelaySeconds)*1000);
      if(!eligibleCommentTimestamp(comment.timestamp,dueAt.getTime())){skipped++;continue;}
      const eventKey=`comment:${comment.id}`;
      const created=await client.automationDeliveryJob.createMany({data:[{automationId,eventKey,dueAt,payload:payload as Prisma.InputJsonValue}],skipDuplicates:true});
      if(!created.count){skipped++;continue;}
      queued++;
      const job=await client.automationDeliveryJob.findUnique({where:{automationId_eventKey:{automationId,eventKey}},select:{id:true,dueAt:true}});
      if(job)wakes.push(scheduleDeliveryWake(job));
    }
    await Promise.all(wakes);
    const after=page.paging?.next && typeof page.paging?.cursors?.after==="string" ? page.paging.cursors.after : undefined;
    if(page.paging?.next && (!after || after===state.after)) throw new ToolError("Instagram did not provide a valid continuation. Already queued comments remain scheduled; please try again.");
    const next={...state,index:after?state.index:state.index+1,after};
    const done=next.index>=mediaIds.length;
    return {ok:true as const,queued,skipped,done,cursor:done?undefined:encodeBacktrackCursor(next,connection.token)};
  } catch(e) {return {ok:false as const,error:e instanceof ToolError?e.message:"Could not backtrack comments."};}
}
