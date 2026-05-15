"use client";

import {
  saveCampaign,
} from "@/actions/automation";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

type SelectedPost = {
  postid: string;
  caption?: string;
  media: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROSEL_ALBUM";
};

export type WizardData = {
  post: SelectedPost | null;
  campaignName: string;
  keywords: string[];
  matchingMode: "EXACT" | "CONTAINS" | "SMART_AI";
  dmMessage: string;
  ctaLink: string;
  ctaButtonTitle: string;
  publicReply: string;
  publicReply2: string;
  publicReply3: string;
  aiMode: boolean;
  active: boolean;
};

const INITIAL: WizardData = {
  post: null,
  campaignName: "",
  keywords: [],
  matchingMode: "CONTAINS",
  dmMessage: "",
  ctaLink: "",
  ctaButtonTitle: "",
  publicReply: "",
  publicReply2: "",
  publicReply3: "",
  aiMode: false,
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

  const next = () => setStep((s) => Math.min(6, s + 1) as WizardStep);
  const back = () => setStep((s) => Math.max(1, s - 1) as WizardStep);
  const goTo = (s: WizardStep) => setStep(s);

  const canAdvance = (): boolean => {
    if (step === 1) return !!data.post;
    if (step === 2) return data.keywords.length > 0;
    if (step === 3) return data.dmMessage.trim().length > 0;
    return true;
  };

  const activate = async () => {
    if (!data.post || data.keywords.length === 0 || !data.dmMessage.trim()) {
      setError("Please complete all required steps before activating.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const saved = await saveCampaign({
        name: data.campaignName,
        active: data.active,
        matchingMode: data.matchingMode,
        post: data.post,
        keywords: data.keywords,
        listener: {
          listener: data.aiMode ? "SMARTAI" : "MESSAGE",
          prompt: data.dmMessage,
          commentReply: data.publicReply || undefined,
          commentReply2: data.publicReply2 || undefined,
          commentReply3: data.publicReply3 || undefined,
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
