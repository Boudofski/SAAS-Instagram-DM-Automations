"use server";

import { onCurrentUser } from "../user";
import { findUser } from "../user/queries";
import {
  normalizeCampaignPayload,
  summarizeCampaignPayload,
  validateNormalizedCampaignPayload,
  type RawCampaignPayload,
} from "@/lib/campaign-save";
import { instagramMediaFetchError, resolveInstagramMediaConnection } from "@/lib/instagram-media";
import { getCanonicalInstagramIntegration } from "@/lib/instagram-integration-status";
import { canActivateCampaign } from "@/actions/usage/queries";
import { client } from "@/lib/prisma";
import { refreshInstagramProfileSnapshotForUser } from "@/lib/instagram-profile-snapshot";
import {
  addKeyWords,
  addListener,
  addPosts,
  addTrigger,
  createAutomation,
  createCompleteAutomation,
  deleteAutomationQuery,
  deleteKeywordsQuery,
  duplicateAutomationQuery,
  findAutomationForUser,
  getAutomation,
  getAutomationAnalytics,
  getAutomationActivity,
  getDashboardActivity,
  updateAutomation,
  updateCompleteAutomation,
} from "./queries";

export const createAutomations = async (id?: string) => {
  const user = await onCurrentUser();

  try {
    const create = await createAutomation(user.id, id);

    if (create) return { status: 200, data: "Automation created" };
    return { status: 404, data: "Failed to create automation" };
  } catch (error: any) {
    return { status: 500, data: error.message };
  }
};

export const saveCampaign = async (payload: RawCampaignPayload, automationId?: string) => {
  const user = await onCurrentUser();

  try {
    const cleanPayload = normalizeCampaignPayload(payload);
    const validationError = validateNormalizedCampaignPayload(cleanPayload);
    const summary = summarizeCampaignPayload(cleanPayload, payload.publicReplyEnabled !== false);

    if (process.env.NODE_ENV !== "production") {
      console.info("[campaign-save] normalized payload", {
        action: "saveCampaign",
        userId: user.id,
        automationId,
        ...summary,
      });
    }

    if (validationError) {
      console.warn("[campaign-save] validation failed", {
        action: "saveCampaign",
        userId: user.id,
        automationId,
        reason: validationError,
        ...summary,
      });
      return { status: 400, data: validationError };
    }

    if (cleanPayload.active) {
      const profile = await findUser(user.id);
      if ((profile as any)?.status === "SUSPENDED") {
        return {
          status: 403,
          data: "Your account is suspended. Contact support before creating or activating campaigns.",
        };
      }
      if ((profile as any)?.integrations?.length && !getCanonicalInstagramIntegration((profile as any).integrations)) {
        return {
          status: 403,
          data: "Reconnect Instagram before activating campaigns.",
        };
      }
      if (!getCanonicalInstagramIntegration((profile as any)?.integrations)) {
        return {
          status: 403,
          data: "Connect Instagram before activating campaigns.",
        };
      }
      if (automationId) {
        const existing = await client.automation.findFirst({
          where: { id: automationId, User: { clerkId: user.id }, archivedAt: null },
          select: { needsReview: true, reviewReason: true },
        });
        if (existing?.needsReview) {
          const repaired = await validatePostForReviewedCampaign(profile?.integrations, cleanPayload.post.postid);
          if (!repaired.ok) {
            return {
              status: 403,
              data: repaired.message,
            };
          }
        }
      }
      const activation = profile?.id
        ? await canActivateCampaign(profile.id, automationId)
        : { ok: false };

      if (!activation.ok) {
        return {
          status: 403,
          data: "Your plan allows 1 active campaign. Pause another campaign or upgrade.",
        };
      }
    }

    const saved = automationId
      ? await updateCompleteAutomation(automationId, user.id, cleanPayload)
      : await createCompleteAutomation(user.id, cleanPayload);

    const savedResult = saved as
      | { automations?: { id: string }[]; id?: string }
      | null;
    const id = automationId || savedResult?.automations?.[0]?.id || savedResult?.id;
    if (saved && id) return { status: 200, data: { id } };

    return { status: 404, data: "Campaign not found" };
  } catch (error) {
    const message = campaignSaveErrorMessage(error);
    console.error("[campaign-save] save failed", {
      action: "saveCampaign",
      userId: user.id,
      automationId,
      prismaCode: getPrismaErrorCode(error),
      prismaMeta: getSafePrismaMeta(error),
      message,
    });
    return { status: 500, data: message };
  }
};

function campaignSaveErrorMessage(error: unknown) {
  const code = getPrismaErrorCode(error);
  const text = error instanceof Error ? error.message : String(error);
  const meta = JSON.stringify(getSafePrismaMeta(error) ?? {});

  if (code === "P2022" || text.includes("triggerMode") || meta.includes("triggerMode")) {
    return "Could not save campaign because the database migration is missing. Deploy migration.";
  }

  if (
    text.includes("mediaType") ||
    text.includes("MEDIATYPE") ||
    text.includes("CAROSEL_ALBUM") ||
    text.includes("CAROUSEL_ALBUM")
  ) {
    return "Could not save campaign. Check selected Instagram post.";
  }

  return "Could not save campaign. Please try again.";
}

function getPrismaErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : undefined;
}

function getSafePrismaMeta(error: unknown) {
  if (typeof error !== "object" || error === null || !("meta" in error)) return undefined;
  return (error as { meta?: unknown }).meta;
}

export const getAllAutomation = async () => {
  const user = await onCurrentUser();

  try {
    const getAll = await getAutomation(user.id);

    if (getAll) return { status: 200, data: getAll.automations || [] };

    return { status: 404, data: [] };
  } catch (error: any) {
    return { status: 500, data: [] };
  }
};

export const getAutomationInfo = async (id: string) => {
  const user = await onCurrentUser();

  try {
    const automation = await findAutomationForUser(id, user.id);

    if (automation) return { status: 200, data: automation };

    return { status: 404 };
  } catch (error) {
    return { status: 500 };
  }
};

export const duplicateAutomation = async (id: string) => {
  const user = await onCurrentUser();

  try {
    const duplicated = await duplicateAutomationQuery(id, user.id);
    if (duplicated) return { status: 200, data: "Campaign duplicated" };
    return { status: 404, data: "Campaign cannot be duplicated until it has a post and DM" };
  } catch {
    return { status: 500, data: "Failed to duplicate campaign" };
  }
};

export const deleteAutomation = async (id: string) => {
  const user = await onCurrentUser();

  try {
    const deleted = await deleteAutomationQuery(id, user.id);
    if (deleted.count > 0) return { status: 200, data: "Campaign deleted" };
    return { status: 404, data: "Campaign not found" };
  } catch {
    return { status: 500, data: "Failed to delete campaign" };
  }
};

export const updateAutomationName = async (
  automationId: string,
  data: {
    name?: string;
    active?: boolean;
    automation?: string;
  }
) => {
  const user = await onCurrentUser();

  try {
    if (data.active === true) {
      const profile = await findUser(user.id);
      if ((profile as any)?.status === "SUSPENDED") {
        return {
          status: 403,
          data: "Your account is suspended. Contact support before activating campaigns.",
        };
      }
      if ((profile as any)?.integrations?.length && !getCanonicalInstagramIntegration((profile as any).integrations)) {
        return {
          status: 403,
          data: "Reconnect Instagram before activating campaigns.",
        };
      }
      if (!getCanonicalInstagramIntegration((profile as any)?.integrations)) {
        return {
          status: 403,
          data: "Connect Instagram before activating campaigns.",
        };
      }
      const existing = await client.automation.findFirst({
        where: { id: automationId, User: { clerkId: user.id }, archivedAt: null },
        select: { needsReview: true, reviewReason: true },
      });
      if (existing?.needsReview) {
        return {
          status: 403,
          data: existing.reviewReason ?? "Review this campaign before activating.",
        };
      }
      const activation = profile?.id
        ? await canActivateCampaign(profile.id, automationId)
        : { ok: false };
      if (!activation.ok) {
        return {
          status: 403,
          data: "Your plan allows 1 active campaign. Pause another campaign or upgrade.",
        };
      }
    }

    const update = await updateAutomation(automationId, user.id, data);

    if (update) return { status: 200, data: "Automation updated" };
    return { status: 404, data: "Failed to update automation" };
  } catch (error) {
    return { status: 500, data: "Failed to update automation" };
  }
};

export const saveListener = async (
  automationId: string,
  listener: "SMARTAI" | "MESSAGE",
  prompt: string,
  reply?: string,
  ctaLink?: string
) => {
  const user = await onCurrentUser();

  try {
    const create = await addListener(automationId, user.id, listener, prompt, reply, ctaLink);

    if (create) return { status: 200, data: "Listener created" };
    return { status: 404, data: "Failed to create listener" };
  } catch (error) {
    return { status: 500, data: "Failed to save listener" };
  }
};

export const saveTrigger = async (automationId: string, trigger: string[]) => {
  const user = await onCurrentUser();

  try {
    const create = await addTrigger(automationId, user.id, trigger);

    if (create) return { status: 200, data: "Trigger created" };
    return { status: 404, data: "Failed to create trigger" };
  } catch (error) {
    return { status: 500, data: "Failed to save trigger" };
  }
};

export const saveKeywords = async (automationId: string, keywords: string) => {
  const user = await onCurrentUser();

  try {
    const create = await addKeyWords(automationId, user.id, keywords);

    if (create) return { status: 200, data: "Keywords created" };
    return { status: 404, data: "Failed to create keywords" };
  } catch (error) {
    return { status: 500, data: "Failed to save keywords" };
  }
};

export const deleteKeywords = async (automationId: string) => {
  const user = await onCurrentUser();

  try {
    const deleted = await deleteKeywordsQuery(automationId, user.id);
    if (deleted) {
      return { status: 200, data: "Keywords deleted" };
    }
    return { status: 404, data: "Failed to delete keywords" };
  } catch (error) {
    return { status: 500, data: "Failed to delete keywords" };
  }
};

export const getProfilePosts = async () => {
  const user = await onCurrentUser();

  try {
    const profile = await findUser(user.id);
    const connection = resolveInstagramMediaConnection(profile?.integrations);
    if (!connection.ok) {
      console.log("[instagram-media] fetch skipped: missing connected Instagram token or business account");
      return {
        status: 401,
        data: { data: [], error: connection.error },
      };
    }

    const baseUrl = process.env.INSTAGRAM_BASE_URL || "https://graph.facebook.com/v20.0";
    const posts = await fetch(
      `${baseUrl}/${connection.instagramBusinessAccountId}/media?fields=id,caption,media_url,thumbnail_url,media_type,timestamp,permalink&limit=25`,
      {
        headers: { Authorization: `Bearer ${connection.token}` },
        cache: "no-store",
      }
    );

    const parsed = await posts.json();

    if (posts.ok && parsed) return { status: 200, data: parsed };
    console.log("[instagram-media] fetch failed", {
      status: posts.status,
      message: parsed?.error?.message ?? "unknown error",
    });
    return {
      status: posts.status,
      data: {
        data: [],
        error: instagramMediaFetchError(posts.status),
      },
    };
  } catch (error: any) {
    console.log("[instagram-media] fetch error", {
      message: error instanceof Error ? error.message : String(error),
    });

    return { status: 500, data: { data: [], error: "AP3k could not load posts right now." } };
  }
};

export const savePosts = async (
  automationId: string,
  posts: {
    postid: string;
    caption?: string;
    media: string;
    mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  }[]
) => {
  const user = await onCurrentUser();

  try {
    const create = await addPosts(automationId, user.id, posts);

    if (create) return { status: 200, data: "Posts created" };
    return { status: 404, data: "Failed to create posts" };
  } catch (error) {
    return { status: 500, data: "Failed to save posts" };
  }
};

export const activateAutomation = async (id: string, status: boolean) => {
  const user = await onCurrentUser();

  try {
    if (status) {
      const profile = await findUser(user.id);
      const existing = await client.automation.findFirst({
        where: { id, User: { clerkId: user.id }, archivedAt: null },
        select: { needsReview: true, reviewReason: true },
      });
      if (existing?.needsReview) {
        return {
          status: 403,
          data: existing.reviewReason ?? "Review this campaign before activating.",
        };
      }
      if ((profile as any)?.status === "SUSPENDED") {
        return {
          status: 403,
          data: "Your account is suspended. Contact support before activating campaigns.",
        };
      }
      if ((profile as any)?.integrations?.length && !getCanonicalInstagramIntegration((profile as any).integrations)) {
        return {
          status: 403,
          data: "Reconnect Instagram before activating campaigns.",
        };
      }
      if (!getCanonicalInstagramIntegration((profile as any)?.integrations)) {
        return {
          status: 403,
          data: "Connect Instagram before activating campaigns.",
        };
      }
      const activation = profile?.id
        ? await canActivateCampaign(profile.id, id)
        : { ok: false };
      if (!activation.ok) {
        return {
          status: 403,
          data: "Your plan allows 1 active campaign. Pause another campaign or upgrade.",
        };
      }
    }
    const activate = await updateAutomation(id, user.id, { active: status });
    if (activate) {
      return {
        status: 200,
        data: `Automation ${status ? "activated" : "deactivated"}`,
      };
    }
    return { status: 404, data: "Failed to activate automation" };
  } catch (error) {
    return { status: 500, data: "Failed to activate automation" };
  }
};

export const repairCampaign = async (automationId: string) => {
  const user = await onCurrentUser();

  try {
    const [automation, profile] = await Promise.all([
      client.automation.findFirst({
        where: { id: automationId, User: { clerkId: user.id }, archivedAt: null },
        include: { posts: true, keywords: true, listener: true },
      }),
      findUser(user.id),
    ]);
    if (!automation) return { status: 404, data: "Campaign not found" };
    const integrationId = profile?.integrations?.[0]?.id;
    if (integrationId) {
      try {
        await refreshInstagramProfileSnapshotForUser(user.id, integrationId, { force: true });
      } catch {
        // Profile refresh is helpful for repair, but media validation below decides the outcome.
      }
    }

    const postId = automation.posts[0]?.postid;
    const validAction = Boolean(
      automation.sendPrivateDm !== false && automation.listener?.prompt?.trim()
    ) || Boolean(
      automation.listener?.commentReply?.trim() ||
      automation.listener?.commentReply2?.trim() ||
      automation.listener?.commentReply3?.trim()
    );
    const validTrigger = automation.triggerMode === "ANY_COMMENT" || automation.keywords.some((keyword) => keyword.word.trim());
    if (!validAction || !validTrigger) {
      return { status: 403, data: "Campaign is missing trigger or reply settings." };
    }

    const postValidation = await validatePostForReviewedCampaign(profile?.integrations, postId);
    if (!postValidation.ok) {
      return { status: 409, data: postValidation.message };
    }

    await client.automation.update({
      where: { id: automation.id },
      data: { needsReview: false, reviewReason: null },
    });
    return { status: 200, data: "Campaign repaired. You can activate it now." };
  } catch {
    return { status: 500, data: "Could not repair campaign." };
  }
};

async function validatePostForReviewedCampaign(integrations: any[] | undefined, postId?: string | null) {
  if (!postId) {
    return { ok: false, message: "Choose Any Post or a current-account post before reactivating." };
  }
  if (postId === "ANY") return { ok: true, message: "Any Post remains valid." };

  const connection = resolveInstagramMediaConnection(integrations);
  if (!connection.ok) {
    return { ok: false, message: "Reconnect Instagram before reviewing this campaign." };
  }

  try {
    const baseUrl = process.env.INSTAGRAM_BASE_URL || "https://graph.facebook.com/v20.0";
    const response = await fetch(
      `${baseUrl}/${connection.instagramBusinessAccountId}/media?fields=id&limit=100`,
      { headers: { Authorization: `Bearer ${connection.token}` }, cache: "no-store" }
    );
    const parsed = await response.json();
    const ids = Array.isArray(parsed?.data) ? parsed.data.map((item: any) => String(item.id)) : [];
    if (response.ok && ids.includes(postId)) return { ok: true, message: "Selected post belongs to current account." };
    return {
      ok: false,
      message: "Selected post is not in the current Instagram account media list. Choose Any Post or a fresh current-account post.",
    };
  } catch {
    return {
      ok: false,
      message: "Could not verify selected post ownership. Choose Any Post or a fresh current-account post.",
    };
  }
}

export const getAutomationStats = async (automationId: string) => {
  const user = await onCurrentUser();

  try {
    const stats = await getAutomationAnalytics(automationId, user.id);
    if (!stats) return { status: 404, data: null };
    return { status: 200, data: stats };
  } catch (error) {
    return { status: 500, data: null };
  }
};

export const getAutomationLogs = async (automationId: string) => {
  const user = await onCurrentUser();

  try {
    const activity = await getAutomationActivity(automationId, user.id);
    if (!activity) return { status: 404, data: [] };
    return { status: 200, data: activity };
  } catch (error) {
    return { status: 500, data: [] };
  }
};

export const getRecentAutomationActivity = async () => {
  const user = await onCurrentUser();

  try {
    const activity = await getDashboardActivity(user.id);
    return { status: 200, data: activity };
  } catch (error) {
    return { status: 500, data: [] };
  }
};

export const saveMatchingMode = async (
  automationId: string,
  mode: "EXACT" | "CONTAINS" | "SMART_AI"
) => {
  const user = await onCurrentUser();
  try {
    const update = await updateAutomation(automationId, user.id, { matchingMode: mode as any });
    if (update) return { status: 200, data: "Matching mode saved" };
    return { status: 404, data: "Failed to save matching mode" };
  } catch (error) {
    return { status: 500, data: "Failed to save matching mode" };
  }
};
