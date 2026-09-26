import { describe, expect, it } from "vitest";
import type { WizardData } from "@/hooks/use-wizard";
import { createCommentEditorPayload } from "./comment-editor-payload";
import { normalizeCampaignPayload, validateNormalizedCampaignPayload } from "./campaign-save";
import { DEFAULT_AI_PROTECTION_RULES } from "./ai-reply-config";

const draft: WizardData & {post: NonNullable<WizardData["post"]>} = {
  post:{postid:"ANY",media:"",mediaType:"IMAGE"}, campaignName:"Guide",triggerMode:"SPECIFIC_KEYWORD",keywords:["guide"],matchingMode:"CONTAINS",
  sendPrivateDm:true,dmMessage:"Here is your guide",messageFormat:"TEXT",linkButtons:[{label:"Old link",url:"https://example.com"}],
  followGateRequired:false,openingDmEnabled:false,openingDmText:"Tap to continue",openingDmButtonText:"Continue",followRequestDmText:"Please follow first",followRequestButtonText:"Following",
  publicReply:"Check your DMs",publicReply2:"",publicReply3:"",publicReplyEnabled:true,aiReplyEnabled:false,aiReplyTone:"FRIENDLY",aiReplyInstructions:"",aiProtectionRules:DEFAULT_AI_PROTECTION_RULES,active:true,
};
describe("accordion editor delivery payload",()=>{
  it("saves plain text without restoring a link from a previously selected format",()=>{
    const payload=normalizeCampaignPayload(createCommentEditorPayload(draft,false));
    expect(payload.active).toBe(false);expect(payload.listener.responseFormat).toBe("TEXT");expect(payload.listener.ctaLink).toBeUndefined();expect(payload.listener.quickReplies).toEqual([]);
    expect(validateNormalizedCampaignPayload(payload)).toBeNull();
  });
  it("publishes link messages with their destinations intact",()=>{
    const payload=normalizeCampaignPayload(createCommentEditorPayload({...draft,active:false,messageFormat:"LINK"},true));
    expect(payload.active).toBe(true);expect(payload.listener.ctaLink).toBe("https://example.com/");expect(payload.listener.responseFormat).toBe("LINK");expect(validateNormalizedCampaignPayload(payload)).toBeNull();
  });
  it("preserves AI, opening, follow and email settings through an edit",()=>{
    const payload=normalizeCampaignPayload(createCommentEditorPayload({...draft,openingDmEnabled:true,followGateRequired:true,emailCaptureEnabled:true,emailCapturePrompt:"Share your email",aiReplyEnabled:true,aiReplyInstructions:"Answer about this guide",aiReplyTone:"PROFESSIONAL"}));
    expect(payload).toMatchObject({followGateRequired:true,listener:{openingDmEnabled:true,emailCaptureEnabled:true,aiReplyEnabled:true,aiReplyInstructions:"Answer about this guide",aiReplyTone:"PROFESSIONAL"}});
  });
  it("validates missing configuration regardless of which accordion is open",()=>{
    const noKeyword=normalizeCampaignPayload(createCommentEditorPayload({...draft,keywords:[]}));
    expect(validateNormalizedCampaignPayload(noKeyword)).not.toBeNull();
    const badLink=normalizeCampaignPayload(createCommentEditorPayload({...draft,messageFormat:"LINK",linkButtons:[{label:"Guide",url:""}]}));
    expect(validateNormalizedCampaignPayload(badLink)).not.toBeNull();
  });
});
