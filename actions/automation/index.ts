"use server";

import { onCurrentUser } from "../user";
import { findUser } from "../user/queries";
import {
  addKeyWords,
  addListener,
  addPosts,
  addTrigger,
  CampaignPayload,
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

export const saveCampaign = async (payload: CampaignPayload, automationId?: string) => {
  const user = await onCurrentUser();

  try {
    const cleanPayload: CampaignPayload = {
      ...payload,
      name: payload.name.trim() || "Untitled campaign",
      keywords: Array.from(
        new Set(
          payload.keywords
            .map((keyword) => keyword.trim())
            .filter(Boolean)
        )
      ),
      listener: {
        ...payload.listener,
        prompt: payload.listener.prompt.trim(),
        commentReply: payload.listener.commentReply?.trim() || undefined,
        commentReply2: payload.listener.commentReply2?.trim() || undefined,
        commentReply3: payload.listener.commentReply3?.trim() || undefined,
        ctaLink: payload.listener.ctaLink?.trim() || undefined,
        ctaButtonTitle: payload.listener.ctaButtonTitle?.trim() || undefined,
      },
    };

    if (!cleanPayload.post.postid || !cleanPayload.listener.prompt || cleanPayload.keywords.length === 0) {
      return { status: 400, data: "Campaign needs a post, keyword, and DM message" };
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
    return { status: 500, data: "Failed to save campaign" };
  }
};

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
    const integration = profile?.integrations[0];
    if (!integration?.token) {
      console.log("[instagram-media] fetch skipped: no connected Instagram token");
      return { status: 200, data: { data: [] } };
    }

    const posts = await fetch(
      `${process.env.INSTAGRAM_BASE_URL}/me/media?fields=id,caption,media_url,thumbnail_url,media_type,timestamp,permalink&limit=20`,
      {
        headers: { Authorization: `Bearer ${integration.token}` },
      }
    );

    const parsed = await posts.json();

    if (posts.ok && parsed) return { status: 200, data: parsed };
    console.log("[instagram-media] fetch failed", {
      status: posts.status,
      message: parsed?.error?.message ?? "unknown error",
    });
    return { status: 404 };
  } catch (error: any) {
    console.log("[instagram-media] fetch error", {
      message: error instanceof Error ? error.message : String(error),
    });

    return { status: 500 };
  }
};

export const savePosts = async (
  automationId: string,
  posts: {
    postid: string;
    caption?: string;
    media: string;
    mediaType: "IMAGE" | "VIDEO" | "CAROSEL_ALBUM";
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
