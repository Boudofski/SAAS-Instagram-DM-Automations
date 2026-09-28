"use client";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";
import { ClerkProvider } from "@clerk/nextjs";
import CommentEditor from "@/components/automations/comment-editor";
import FlowBuilder from "@/components/automations/flow-builder";
import { normalizeEngagementSettings } from "@/lib/automation-engagement-settings";
import { DEFAULT_AI_PROTECTION_RULES } from "@/lib/ai-reply-config";
import type { WizardData } from "@/hooks/use-wizard";
import PublicPricing from "@/components/website/public-pricing";
import ThemeToggle from "@/components/global/theme-toggle";
import LanguageSwitcher from "@/components/global/language-switcher";
export default function Review() {
  const params = useSearchParams();
  const { setTheme } = useTheme();
  useEffect(() => {
    setTheme(params.get("theme") || "light");
  }, [params, setTheme]);
  const [paid, setPaid] = useState(false);
  const [data, setData] = useState<WizardData>({
    ...normalizeEngagementSettings({}),
    post: {
      postid: "test",
      caption: "Your next creative idea starts here.",
      media: "/media/showcase/collect_contact_details_r.webp",
      mediaType: "IMAGE",
    },
    campaignName: "Link Delivery DM",
    triggerMode: "ANY_COMMENT",
    keywords: [],
    matchingMode: "CONTAINS",
    sendPrivateDm: true,
    dmMessage: "Here’s the resource you asked for 👇",
    linkButtons: [{ label: "Get the guide", url: "https://example.com/guide" }],
    openingDmEnabled: true,
    openingDmText: "Would you like the guide?",
    openingDmButtonText: "Send it",
    followGateRequired: false,
    followRequestDmText: "Follow us to get your guide.",
    followRequestButtonText: "I followed",
    publicReplyEnabled: true,
    publicReply: "Check your DMs!",
    publicReply2: "",
    publicReply3: "",
    aiReplyEnabled: false,
    aiReplyTone: "FRIENDLY",
    aiReplyInstructions: "",
    aiProtectionRules: DEFAULT_AI_PROTECTION_RULES,
    active: false,
  });
  if (params.get("view") === "flow")
    return (
      <ClerkProvider>
        <FlowBuilder
          slug="preview"
          integrationId=""
          plan="PRO"
          refreshPosts={() => {}}
          templateId="followers"
          username="yourbrand"
        />
      </ClerkProvider>
    );
  if (params.get("view") === "billing")
    return (
      <div className="mx-auto max-w-6xl p-6">
        <ThemeToggle />
        <LanguageSwitcher />
        <PublicPricing currentPlan="FREE" />
      </div>
    );
  return (
    <div>
      <div className="flex gap-4 p-2 text-xs">
        <label>
          <input
            type="checkbox"
            checked={paid}
            onChange={(e) => setPaid(e.target.checked)}
          />{" "}
          Paid fixture
        </label>
        <span>Preview only — saves disabled</span>
      </div>
      <CommentEditor
        slug="preview"
        data={data}
        update={(v) => setData((d) => ({ ...d, ...v }))}
        onSave={() => {}}
        saving={false}
        error={null}
        editingActive={false}
        posts={[]}
        postsLoading={false}
        postsFetching={false}
        refreshPosts={() => {}}
        username="yourbrand"
        connected
        accountLoading={false}
        accountError={false}
        retryAccount={() => {}}
        followUpsReady
        aiAvailable={false}
        paid={paid}
        commentOnly={false}
      />
    </div>
  );
}
