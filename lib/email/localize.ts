import {EMAIL_COPY} from './locale-copy';
import {SUPPORTED_LOCALES,type Locale} from '@/lib/i18n/config';
import type {EmailTemplateContent,EmailTemplateContext,EmailTemplateId} from './catalog';
const order:EmailTemplateId[]=['welcome','connect_instagram','instagram_connected','automation_activated','automation_needs_attention','instagram_reconnect','usage_80_percent','usage_limit_reached','trial_ending','plan_activated','payment_failed','subscription_canceled','referral_qualified','referral_reward','support_received','support_reply','weekly_report','inactive_workspace'];
export function emailLocale(value?:string|null):Locale{return SUPPORTED_LOCALES.includes(value as Locale)?value as Locale:'en';}
export function localizeEmail(id:EmailTemplateId,context:EmailTemplateContext,original:EmailTemplateContent):EmailTemplateContent{
 const locale=emailLocale(context.locale),copy=EMAIL_COPY[locale],usage=id==='usage_80_percent'||id==='usage_limit_reached';
 if(locale==='en')return {...original,locale,...(usage?{paragraphs:[...original.paragraphs,copy.counting,copy.upgrade],cta:original.cta&&{...original.cta,label:copy.plans}}:{})};
 const index=order.indexOf(id),body=copy.bodies[index],paragraphs=[body],format=new Intl.NumberFormat(locale);
 if(usage)paragraphs.push(copy.counting,copy.upgrade);
 if(id==='support_reply'&&context.supportReply)paragraphs.push(context.supportReply);
 if(id==='support_received'&&context.supportMessage)paragraphs.push(context.supportMessage.slice(0,800));
 if(context.automationName)paragraphs.push(context.automationName);
 if(context.instagramUsername)paragraphs.push(`@${context.instagramUsername.replace(/^@/,'')}`);
 if(id==='plan_activated'&&context.planName)paragraphs.push(context.planName);
 if(id==='referral_reward'&&context.rewardLabel)paragraphs.push(context.rewardLabel);
 const metrics=usage?[{label:copy.actions,value:`${format.format(context.actionsUsed??0)} / ${format.format(context.actionLimit??0)}`}]:id==='weekly_report'?[context.weeklyLeads,context.weeklyReplies,context.weeklyDms,context.weeklyComments].map((v,i)=>({label:copy.report[i],value:format.format(v??0)})):undefined;
 return {locale,subject:copy.titles[index],preview:body,eyebrow:'AP3K',headline:copy.titles[index],paragraphs,metrics,cta:original.cta&&{...original.cta,label:usage?copy.plans:copy.open},secondaryCta:original.secondaryCta&&{...original.secondaryCta,label:original.secondaryCta.url.includes('youtube.com')?copy.tutorial:copy.open}};
}
