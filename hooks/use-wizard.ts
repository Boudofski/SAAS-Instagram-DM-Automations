"use client";

import {
  activateAutomation,
  createAutomations,
  saveKeywords,
  saveListener,
  saveMatchingMode,
  savePosts,
  saveTrigger,
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
  publicReply: string;
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
  publicReply: "",
  aiMode: false,
  active: true,
};

export function useWizard(slug: string) {
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
      const created = await createAutomations();
      if (created.status !== 200) throw new Error("Failed to create automation");

      const { getAllAutomation } = await import("@/actions/automation");
      const all = await getAllAutomation();
      if (all.status !== 200 || !all.data.length) throw new Error("Automation not found");
      const automationId = all.data[all.data.length - 1].id;

      if (data.campaignName.trim()) {
        const { updateAutomationName } = await import("@/actions/automation");
        await updateAutomationName(automationId, {
          name: data.campaignName.trim(),
        });
      }

      await savePosts(automationId, [data.post]);

      for (const kw of data.keywords) {
        await saveKeywords(automationId, kw);
      }

      await saveTrigger(automationId, ["COMMENT"]);

      await saveListener(
        automationId,
        data.aiMode ? "SMARTAI" : "MESSAGE",
        data.dmMessage,
        data.publicReply || undefined,
        data.ctaLink || undefined
      );

      await saveMatchingMode(automationId, data.matchingMode);

      await activateAutomation(automationId, data.active);

      router.push(`/dashboard/${slug}/automation/${automationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return { step, data, update, next, back, goTo, canAdvance, activate, isSubmitting, error };
}
