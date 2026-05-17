"use client";

import {
  saveCampaign,
} from "@/actions/automation";
import { canAdvancePublicReplyStep, canAdvanceTriggerStep } from "@/lib/campaign-validation";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type WizardStep = 1 | 2 | 3 | 4 | 5;

type SelectedPost = {
  postid: string;
  caption?: string;
  media: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROSEL_ALBUM";
};

export type WizardData = {
  post: SelectedPost | null;
  campaignName: string;
  triggerMode: "SPECIFIC_KEYWORD" | "ANY_COMMENT";
  keywords: string[];
  matchingMode: "EXACT" | "CONTAINS";
  dmMessage: string;
  ctaLink: string;
  ctaButtonTitle: string;
  publicReply: string;
  publicReply2: string;
  publicReply3: string;
  publicReplyEnabled: boolean;
  active: boolean;
};

const INITIAL: WizardData = {
  post: null,
  campaignName: "",
  triggerMode: "SPECIFIC_KEYWORD",
  keywords: [],
  matchingMode: "CONTAINS",
  dmMessage: "",
  ctaLink: "",
  ctaButtonTitle: "",
  publicReply: "",
  publicReply2: "",
  publicReply3: "",
  publicReplyEnabled: true,
  active: true,
};

export function useWizard(slug: string, automationId?: string) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const [data, setData] = useState<WizardData>(INITIAL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (partial: Partial<WizardData>) =>
    setData((prev) => ({ ...prev, ...partial }));

  const next = () => setStep((s) => Math.min(5, s + 1) as WizardStep);
  const back = () => setStep((s) => Math.max(1, s - 1) as WizardStep);
  const goTo = (s: WizardStep) => setStep(s);

  const canAdvance = (): boolean => {
    if (step === 1) return !!data.post;
    if (step === 2) return canAdvanceTriggerStep(data.triggerMode, data.keywords);
    if (step === 3) return data.dmMessage.trim().length > 0;
    if (step === 4) return canAdvancePublicReplyStep(data.publicReplyEnabled, [data.publicReply, data.publicReply2, data.publicReply3]);
    return true;
  };

  const activate = async (activeOverride?: boolean) => {
    if (!data.post || !data.dmMessage.trim()) {
      setError("Please complete all required steps before activating.");
      return;
    }
    if (data.triggerMode === "SPECIFIC_KEYWORD" && data.keywords.length === 0) {
      setError("Add at least one keyword or switch the trigger to Any comment.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const saved = await saveCampaign({
        name: data.campaignName,
        active: typeof activeOverride === "boolean" ? activeOverride : data.active,
        matchingMode: data.matchingMode,
        triggerMode: data.triggerMode,
        post: data.post,
        keywords: data.triggerMode === "ANY_COMMENT" ? [] : data.keywords,
        listener: {
          listener: "MESSAGE",
          prompt: data.dmMessage,
          commentReply: data.publicReplyEnabled ? data.publicReply || undefined : undefined,
          commentReply2: data.publicReplyEnabled ? data.publicReply2 || undefined : undefined,
          commentReply3: data.publicReplyEnabled ? data.publicReply3 || undefined : undefined,
          ctaLink: data.ctaLink || undefined,
          ctaButtonTitle: data.ctaButtonTitle || undefined,
        },
      }, automationId);

      const savedData = saved.data;
      const campaignId =
        typeof savedData === "object" && savedData !== null && "id" in savedData
          ? String(savedData.id)
          : null;

      if (saved.status !== 200 || !campaignId) {
        throw new Error(typeof saved.data === "string" ? saved.data : "Failed to save campaign");
      }

      router.push(`/dashboard/${slug}/automation/${campaignId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return { step, data, update, next, back, goTo, canAdvance, activate, isSubmitting, error };
}
