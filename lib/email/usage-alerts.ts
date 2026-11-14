import {client} from '@/lib/prisma';
import {getUserMonthlyUsage} from '@/actions/usage/queries';
import {isUnlimited,type UsageSummary} from '@/lib/plan-limits';
import {sendAp3kEmail,getEmailConfiguration} from './delivery';
import {getApplicationUrl} from '@/lib/app-url';
import {dashboardPath} from '@/lib/dashboard';
export function usageNotice(usage:UsageSummary){const {used,limit}=usage.staticReplies;if(isUnlimited(limit)||limit<=0||used/limit<.8)return null;return used>=limit?'usage_limit_reached' as const:'usage_80_percent' as const;}
export async function notifyUsage(userId:string){
 if(process.env.VERCEL_ENV!=='production'||!getEmailConfiguration().configured)return;
 const user=await client.user.findUnique({where:{id:userId},select:{id:true,clerkId:true,email:true,status:true}});if(!user||user.status!=='ACTIVE')return;
 const usage=await getUserMonthlyUsage(userId),templateId=usageNotice(usage);if(!templateId)return;
 const period=`${usage.enforcementStart.toISOString()}:${usage.plan}:${usage.staticReplies.limit}`;
 return sendAp3kEmail({templateId,to:user.email,userId,idempotencyKey:`usage:v1:${userId}:${period}:${templateId}`,context:{actionsUsed:usage.staticReplies.used,actionLimit:usage.staticReplies.limit as number,usagePercent:usage.staticReplies.percent,actionUrl:`${getApplicationUrl()}${dashboardPath(user.clerkId)}/billing`},metadata:{source:'usage-monitor',period,plan:usage.plan}});
}
const recent=new Map<string,number>();
export async function notifyAutomationUsage(automationId:string,blocked=false){try{
 if(process.env.VERCEL_ENV!=='production'||!getEmailConfiguration().configured)return;
 const key=`${automationId}:${blocked}`;if(Date.now()-(recent.get(key)??0)<60000)return;if(recent.size>5000)recent.clear();recent.set(key,Date.now());
 const row=await client.automation.findUnique({where:{id:automationId},select:{userId:true}});if(row?.userId)await notifyUsage(row.userId);
}catch{console.warn('[usage-email] deferred to scheduled reconciliation');}}
export async function processUsageAlerts(){
 const result={checked:0,sent:0,failed:0};if(process.env.VERCEL_ENV!=='production'||!getEmailConfiguration().configured)return result;
 const since=new Date();since.setUTCDate(1);since.setUTCHours(0,0,0,0);
 const users=await client.user.findMany({where:{status:'ACTIVE',OR:[{automations:{some:{messageLogs:{some:{createdAt:{gte:since},status:'SENT'}}}}},{deletedReplyUsage:{some:{createdAt:{gte:since}}}}]},select:{id:true},orderBy:[{usageEmailCheckedAt:{sort:'asc',nulls:'first'}},{id:'asc'}],take:50});
 const deadline=Date.now()+20000;
 for(const user of users){
  if(Date.now()>deadline)break;
  result.checked++;
  try{const r=await notifyUsage(user.id);if(r?.ok&&r.status==='sent'){result.sent++;await new Promise(resolve=>setTimeout(resolve,650));}if(r&&!r.ok&&r.status==='failed')result.failed++;}catch{result.failed++;}
  await client.user.update({where:{id:user.id},data:{usageEmailCheckedAt:new Date()}});
 }
 return result;
}
