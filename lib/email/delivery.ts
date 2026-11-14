import {emailLocale} from "./localize";
import { Resend, type CreateEmailOptions } from "resend";
import { Prisma } from "@prisma/client";
import { client } from "@/lib/prisma";
import { getApplicationUrl } from "@/lib/app-url";
import { dashboardEntryPath } from "@/lib/dashboard";
import { generateAiEmailPersonalization } from "@/lib/ai-reply";
import { buildEmailTemplate, EMAIL_TEMPLATES, isEmailTemplateId, type EmailPreferenceKey, type EmailTemplateContext, type EmailTemplateId } from "@/lib/email/catalog";
import { renderAp3kEmail } from "@/lib/email/render";

const DEFAULT_FROM = "AP3K <updates@ap3k.com>";
const DEFAULT_REPLY_TO = "support@ap3k.com";

function normalizeEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("A valid recipient email is required.");
  }
  return email;
}

function cleanError(value: unknown) {
  const raw = value instanceof Error ? value.message : String(value ?? "Unknown email error");
  return raw.replace(/re_[A-Za-z0-9_-]+/g, "[redacted]").slice(0, 600);
}

export function getEmailConfiguration() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  return {
    configured: Boolean(apiKey),
    webhookConfigured: Boolean(webhookSecret),
    from: process.env.AP3K_EMAIL_FROM?.trim() || DEFAULT_FROM,
    replyTo: process.env.AP3K_EMAIL_REPLY_TO?.trim() || DEFAULT_REPLY_TO,
    apiKey,
    webhookSecret,
  };
}

export async function getEmailPreferences(userId: string) {
  const stored = await client.emailPreference.findUnique({ where: { userId } });
  return {
    productTips: stored?.productTips ?? true,
    weeklyReports: stored?.weeklyReports ?? true,
    promotions: stored?.promotions ?? false,
  };
}

async function preferenceAllows(userId: string | undefined, key: EmailPreferenceKey) {
  if (!userId || key === "transactional") return true;
  const preferences = await getEmailPreferences(userId);
  return preferences[key];
}

export type SendAp3kEmailResult =
  | { ok: true; status: "sent" | "duplicate"; deliveryId: string; providerMessageId?: string }
  | { ok: false; status: "disabled" | "opted_out" | "failed"; deliveryId?: string; error: string };

export async function sendAp3kEmail(input: {
  templateId: EmailTemplateId;
  to: string;
  idempotencyKey: string;
  userId?: string;
  context?: EmailTemplateContext;
  metadata?: Record<string, string | number | boolean | null>;
  personalizeWithAi?: boolean;
}): Promise<SendAp3kEmailResult> {
  const configuration = getEmailConfiguration();
  if (!configuration.apiKey) {
    return { ok: false, status: "disabled", error: "Email delivery is not configured." };
  }

  const definition = EMAIL_TEMPLATES[input.templateId];
  const recipient = normalizeEmail(input.to);
  const idempotencyKey = `ap3k:${input.idempotencyKey.trim()}`.slice(0, 240);
  if (idempotencyKey === "ap3k:") throw new Error("An email idempotency key is required.");

  const suppressed = await client.emailDelivery.findFirst({where:{recipient:{equals:recipient,mode:"insensitive"},status:{in:["BOUNCED","COMPLAINED","SUPPRESSED"]}},select:{id:true}});
  if(suppressed)return {ok:false,status:"opted_out",error:"Delivery is suppressed for this recipient."};
  const existing = await client.emailDelivery.findUnique({ where: { idempotencyKey } });
  if (existing) {
    const stored=existing.metadata as unknown as ServiceEmailMetadata|null;
    if(stored?.servicePayload&&!existing.providerMessageId&&["PENDING","FAILED"].includes(existing.status)){
      if(!await preferenceAllows(input.userId,definition.preference))return {ok:false,status:"opted_out",error:"Recipient opted out."};
      if(input.userId && (input.templateId==='usage_limit_reached'||input.templateId==='usage_80_percent')){
        const {getUserMonthlyUsage}=await import('@/actions/usage/queries');
        const {usageNotice}=await import('./usage-alerts');
        const usage=await getUserMonthlyUsage(input.userId);
        const period=`${usage.enforcementStart.toISOString()}:${usage.plan}:${usage.staticReplies.limit}`;
        if(usageNotice(usage)!==input.templateId||stored.period!==period){
          await client.emailDelivery.updateMany({where:{id:existing.id,providerMessageId:null},data:{status:'SKIPPED',errorCode:'usage_notice_obsolete'}});
          return {ok:true,status:'duplicate',deliveryId:existing.id};
        }
      }
      return deliverStoredServiceEmail(existing);
    }
    return {
      ok: existing.status !== "FAILED",
      status: existing.status === "FAILED" ? "failed" : "duplicate",
      deliveryId: existing.id,
      ...(existing.providerMessageId ? { providerMessageId: existing.providerMessageId } : {}),
      ...(existing.status === "FAILED" ? { error: existing.errorMessage || "The previous delivery attempt failed." } : {}),
    } as SendAp3kEmailResult;
  }

  const appUrl = getApplicationUrl();
  const preferenceUrl = `${appUrl}${dashboardEntryPath("/settings#email-preferences")}`;
  const profile=input.userId?await client.user.findUnique({where:{id:input.userId},select:{preferredLocale:true}}):null;
  const context={...input.context,locale:emailLocale(profile?.preferredLocale??input.context?.locale)};
  let content = buildEmailTemplate(input.templateId, context, appUrl);
  const allowed = await preferenceAllows(input.userId, definition.preference);
  if (!allowed) {
    const delivery = await client.emailDelivery.create({
      data: {
        userId: input.userId,
        templateId: input.templateId,
        category: definition.category,
        recipient,
        subject: content.subject,
        idempotencyKey,
        status: "SKIPPED",
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
        errorCode: "recipient_opted_out",
        errorMessage: `Recipient disabled ${definition.preference} emails.`,
      },
    });
    return { ok: false, status: "opted_out", deliveryId: delivery.id, error: "Recipient opted out of this email category." };
  }

  if (context.locale === "en" && input.personalizeWithAi && definition.aiPersonalization) {
    const personalized = await generateAiEmailPersonalization({
      templateLabel: definition.label,
      fallback: {
        subject: content.subject,
        preview: content.preview,
        headline: content.headline,
        introduction: content.paragraphs[0] || "",
      },
      safeContext: {
        firstName: context.firstName,
        instagramUsername: context.instagramUsername,
        automationName: context.automationName,
      },
    });
    if (personalized.ok) {
      content = {
        ...content,
        subject: personalized.subject,
        preview: personalized.preview,
        headline: personalized.headline,
        paragraphs: [personalized.introduction, ...content.paragraphs.slice(1)],
      };
    }
  }
  const rendered = await renderAp3kEmail({
    templateId: input.templateId,
    context: input.context,
    appUrl,
    preferenceUrl,
    recipientHint: recipient,
    contentOverride: content,
  });

  const payload:CreateEmailOptions={from:configuration.from,to:recipient,replyTo:configuration.replyTo,subject:rendered.subject,html:rendered.html,text:rendered.text,tags:[{name:"template",value:input.templateId},{name:"category",value:definition.category}]};
  // Preserve the exact provider payload across ambiguous failures.
  try{
    const row=await client.emailDelivery.create({data:{userId:input.userId,templateId:input.templateId,category:definition.category,recipient,subject:rendered.subject,idempotencyKey,status:"PENDING",metadata:{...input.metadata,servicePayload:payload,serviceAttempts:0} as unknown as Prisma.InputJsonValue}});
    return deliverStoredServiceEmail(row);
  }catch(error){
    if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2002"){
      const raced=await client.emailDelivery.findUnique({where:{idempotencyKey}});if(raced)return {ok:true,status:"duplicate",deliveryId:raced.id};
    }
    throw error;
  }
}
type ServiceEmailMetadata={servicePayload:CreateEmailOptions;serviceAttempts:number;[key:string]:unknown};
async function deliverStoredServiceEmail(row:{id:string;idempotencyKey:string;metadata:unknown;createdAt:Date;updatedAt:Date;errorCode:string|null}):Promise<SendAp3kEmailResult>{
 const metadata=row.metadata as ServiceEmailMetadata,attempts=metadata.serviceAttempts||0;
 if(attempts>=3||Date.now()-row.createdAt.getTime()>=23*3600000||["service_rejected","service_review"].includes(row.errorCode??"")){
  await client.emailDelivery.updateMany({where:{id:row.id,providerMessageId:null},data:{status:"FAILED",errorCode:"service_review"}});
  return {ok:false,status:"failed",deliveryId:row.id,error:"Delivery needs review in Email Center."};
 }
 if(attempts>0&&Date.now()-row.updatedAt.getTime()<60000)return {ok:true,status:"duplicate",deliveryId:row.id};
 const claimed=await client.emailDelivery.updateMany({where:{id:row.id,updatedAt:row.updatedAt,providerMessageId:null,status:{in:["PENDING","FAILED"]}},data:{status:"PENDING",errorCode:"service_sending",metadata:{...metadata,serviceAttempts:attempts+1} as unknown as Prisma.InputJsonValue}});
 if(!claimed.count)return {ok:true,status:"duplicate",deliveryId:row.id};
 try{
  const {data,error}=await new Resend(getEmailConfiguration().apiKey).emails.send(metadata.servicePayload,{idempotencyKey:row.idempotencyKey});
  if(error||!data?.id){
   const code=error&&'statusCode' in error?Number(error.statusCode):0;
   const retry=!code||code===429||code>=500||(code===409&&error?.name==="concurrent_idempotent_requests");
   await client.emailDelivery.updateMany({where:{id:row.id,providerMessageId:null},data:{status:"FAILED",errorCode:retry?"service_retry":"service_rejected",errorMessage:cleanError(error?.message)}});
   return {ok:false,status:"failed",deliveryId:row.id,error:"Provider did not accept the email."};
  }
  await client.emailDelivery.updateMany({where:{id:row.id,providerMessageId:null},data:{status:"SENT",providerMessageId:data.id,sentAt:new Date(),errorCode:null,errorMessage:null}});
  return {ok:true,status:"sent",deliveryId:row.id,providerMessageId:data.id};
 }catch(error){
  await client.emailDelivery.updateMany({where:{id:row.id,providerMessageId:null},data:{status:"FAILED",errorCode:"service_retry",errorMessage:cleanError(error)}});
  return {ok:false,status:"failed",deliveryId:row.id,error:"Email delivery interrupted."};
 }
}
export async function processServiceEmailRetries(){
 if(process.env.VERCEL_ENV!=="production"||!getEmailConfiguration().configured)return {sent:0};
 const now=Date.now();
 const rows=await client.emailDelivery.findMany({where:{providerMessageId:null,status:{in:["PENDING","FAILED"]},OR:[{errorCode:{in:["service_retry","service_sending"]}},{errorCode:null,metadata:{path:["serviceAttempts"],equals:0}}],createdAt:{gt:new Date(now-23*3600000)},updatedAt:{lt:new Date(now-60000)}},orderBy:{updatedAt:"asc"},take:5});
 let sent=0;
 for(const row of rows){if(!isEmailTemplateId(row.templateId))continue;
  const result=await sendAp3kEmail({templateId:row.templateId,userId:row.userId??undefined,to:row.recipient,idempotencyKey:row.idempotencyKey.replace(/^ap3k:/,"")});
  if(result.ok&&result.status==="sent")sent++;await new Promise(resolve=>setTimeout(resolve,650));
 }
 return {sent};
}
