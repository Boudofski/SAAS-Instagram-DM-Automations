export type ActivityInput = {
  id?: string | null;
  type: string;
  status?: string | null;
  keyword?: string | null;
  errorMessage?: string | null;
  meta?: unknown;
  source?: string | null;
  igUserId?: string | null;
  mediaId?: string | null;
  commentId?: string | null;
  createdAt?: Date | string;
  privateDmEnabled?: boolean;
};

export type ActivityDisplay = {
  label: string;
  badge: string | null;
  tone: "green" | "blue" | "amber" | "red" | "slate";
  detail: string | null;
  technical: boolean;
};

export type RecentActivityItem = {
  title: string;
  actor: string | null;
  subtitle: string;
  time: string;
  tone: "green" | "blue" | "purple" | "amber" | "red" | "slate";
  kind: string;
};

export type GroupedActivity = {
  id: string;
  commentId: string | null;
  mediaId: string | null;
  igUserId: string | null;
  keyword: string | null;
  createdAt: Date | string;
  actorLabel: string | null;
  commentText: string | null;
  title: string;
  subtitle: string;
  steps: {
    commentReceived: boolean;
    triggerMatched: boolean;
    publicReply: "sent" | "skipped" | "failed" | "off" | null;
    privateDm: "sent" | "skipped" | "blocked" | "failed" | "off" | null;
    selfCommentSkipped: boolean;
    duplicateSkipped: boolean;
    usageLimitReached: boolean;
    loopGuard: boolean;
  };
  tone: "green" | "blue" | "amber" | "red" | "slate";
  badge: string;
  details: {
    commentId?: string;
    mediaId?: string;
    igUserId?: string;
    commenterUsername?: string;
    keyword?: string;
    endpoint?: string;
    publicReplyCommentId?: string;
    replyTextPreview?: string;
    visibilityHelper?: string;
    error?: string;
    technicalTypes: string[];
  };
};

export function getCampaignModeLabels(input: {
  sendPrivateDm?: boolean | null;
  publicReplyCount?: number;
}) {
  const publicReplyOn = (input.publicReplyCount ?? 0) > 0;
  return {
    publicReply: publicReplyOn ? "On" : "Off",
    privateDm: input.sendPrivateDm === false ? "Off — external tool" : "Sent by AP3k",
  };
}

export function getReviewerTestCopy(sendPrivateDm: boolean) {
  return sendPrivateDm
    ? "This campaign listens for comments on the selected Instagram media, matches the configured trigger, replies publicly if enabled, and AP3k will attempt private DM through Meta. If instagram_manage_messages is pending, DM may fail with capability missing."
    : "This campaign listens for comments on the selected Instagram media, matches the configured trigger, replies publicly if enabled, and AP3k will skip private DM. External DM tool handles the private message.";
}

export function formatActivityDisplay(item: ActivityInput): ActivityDisplay {
  const text = activityText(item);
  const type = item.type;
  const status = item.status ?? undefined;
  const capabilityBlocked = isMetaCapabilityMissing(text);
  const usageLimit = text.includes("static_reply_limit_reached");

  if (type === "REAL_COMMENT_EVENT" && capabilityBlocked) {
    return {
      label: "Comment processed · DM blocked by Meta",
      badge: "PARTIAL",
      tone: "amber",
      detail: formatLogError(text),
      technical: true,
    };
  }

  if ((type === "DM_FAILED" || type === "DM_FAILED_FAILED") && capabilityBlocked && item.privateDmEnabled === false) {
    return {
      label: "Old private DM failure before DM was turned off",
      badge: "OLD",
      tone: "slate",
      detail: formatLogError(text),
      technical: false,
    };
  }

  if ((type === "DM_FAILED" || type === "DM_FAILED_FAILED") && capabilityBlocked) {
    return {
      label: "Public reply sent · Private DM blocked by Meta",
      badge: "WARNING",
      tone: "amber",
      detail: formatLogError(text),
      technical: false,
    };
  }

  if (type === "DM_SKIPPED" && text.includes("external_dm_tool_enabled")) {
    return {
      label: "Private DM skipped",
      badge: "SKIPPED",
      tone: "amber",
      detail: "External DM tool enabled.",
      technical: false,
    };
  }

  if (type === "SELF_COMMENT_SKIPPED") {
    return {
      label: "Ignored self-comment from connected account",
      badge: "SKIPPED",
      tone: "amber",
      detail: null,
      technical: false,
    };
  }

  if (type === "COMMENT_SKIPPED" && usageLimit) {
    return {
      label: "Skipped — monthly static reply limit reached",
      badge: "LIMIT",
      tone: "amber",
      detail: null,
      technical: false,
    };
  }

  if (type === "COMMENT_SKIPPED" && text.includes("public_reply_disabled")) {
    return {
      label: "Public reply skipped",
      badge: "OFF",
      tone: "amber",
      detail: "Public reply is disabled for this campaign.",
      technical: false,
    };
  }

  if (type === "DUPLICATE_SKIPPED" || text.includes("duplicate_comment_webhook")) {
    return {
      label: "Duplicate webhook ignored",
      badge: "SKIPPED",
      tone: "slate",
      detail: null,
      technical: false,
    };
  }

  if (type === "LOOP_GUARD_TRIGGERED") {
    return {
      label: "Loop guard protected this campaign",
      badge: "PROTECTED",
      tone: "amber",
      detail: null,
      technical: false,
    };
  }

  if (type === "LOOP_GUARD_PAUSED_CAMPAIGN") {
    return {
      label: "Campaign auto-paused by loop guard",
      badge: "PAUSED",
      tone: "red",
      detail: null,
      technical: false,
    };
  }

  if (type === "KEYWORD_MATCHED" && item.keyword === "ANY_COMMENT") {
    return { label: "Any comment trigger matched", badge: "MATCHED", tone: "green", detail: null, technical: false };
  }

  const label = friendlyActivityType(type);
  const failed = type.includes("FAILED") || status === "FAILED";
  const technical = isTechnicalActivity(type, item.source);
  const badge = status ?? (technical ? "TECHNICAL" : null);

  return {
    label,
    badge,
    tone: failed ? "red" : activityTone(type, status),
    detail: item.errorMessage ? formatLogError(item.errorMessage) : null,
    technical,
  };
}

export function formatRecentActivity(item: ActivityInput): RecentActivityItem {
  const display = formatActivityDisplay(item);
  const meta = metaRecord(item.meta);
  const actor = actorLabel(firstString([meta.commenterUsername]), item.igUserId);
  const commentSuffix = item.commentId ? ` → comment ${truncateId(item.commentId)}` : "";
  const replyId = typeof meta.publicReplyCommentId === "string" ? meta.publicReplyCommentId : null;
  const endpoint = typeof meta.endpoint === "string" ? meta.endpoint : null;
  const base = {
    actor,
    time: item.createdAt ? formatActivityTime(item.createdAt) : "",
  };

  if (item.type === "PUBLIC_REPLY_SENT" || item.type === "COMMENT_REPLY_SENT") {
    return {
      ...base,
      title: "Public reply sent",
      subtitle: `Comment reply (static)${commentSuffix}${replyId ? ` · Meta reply ${truncateId(replyId)}` : ""}`,
      tone: "green",
      kind: "sent",
    };
  }
  if (item.type === "DM_SKIPPED") {
    return {
      ...base,
      title: "Private DM skipped",
      subtitle: `External DM tool enabled${commentSuffix}`,
      tone: "amber",
      kind: "skipped",
    };
  }
  if ((item.type === "DM_FAILED" || item.type === "DM_FAILED_FAILED") && isMetaCapabilityMissing(activityText(item))) {
    return {
      ...base,
      title: "Private DM blocked by Meta",
      subtitle: `Requires instagram_manage_messages approval${commentSuffix}`,
      tone: "red",
      kind: "failed",
    };
  }
  if (item.type === "KEYWORD_MATCHED") {
    return {
      ...base,
      title: "Trigger matched",
      subtitle: item.keyword ? `Keyword "${item.keyword}" → post comments` : "Comment trigger matched",
      tone: "purple",
      kind: "activity",
    };
  }
  if (item.type === "COMMENT_RECEIVED" || item.type === "REAL_COMMENT_EVENT" || item.type === "WEBHOOK_RECEIVED" || item.type === "COMMENT_WEBHOOK_RECEIVED") {
    return {
      ...base,
      title: "Comment received",
      subtitle: commentSuffix ? commentSuffix.replace(/^ → /, "") : "Instagram comment webhook",
      tone: "blue",
      kind: "activity",
    };
  }
  if (item.type === "SELF_COMMENT_SKIPPED") {
    return {
      ...base,
      title: "Ignored self-comment",
      subtitle: "Connected account comment ignored",
      tone: "amber",
      kind: "skipped",
    };
  }
  if (display.label === "Duplicate webhook ignored") {
    return {
      ...base,
      title: "Duplicate ignored",
      subtitle: "Repeated webhook delivery ignored",
      tone: "slate",
      kind: "skipped",
    };
  }
  return {
    ...base,
    title: display.label,
    subtitle: `${display.detail ?? endpoint ?? "Campaign activity"}${commentSuffix}`,
    tone: display.tone === "slate" ? "slate" : display.tone,
    kind: display.technical ? "technical" : display.tone === "red" ? "failed" : display.tone === "amber" ? "skipped" : "activity",
  };
}

export function groupCampaignActivity(
  items: ActivityInput[],
  options: { privateDmEnabled?: boolean; limit?: number } = {}
): GroupedActivity[] {
  const groups = new Map<string, ActivityInput[]>();
  const sorted = [...items].sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt));

  for (const item of sorted) {
    const key = groupKey(item);
    const current = groups.get(key) ?? [];
    current.push({ ...item, privateDmEnabled: options.privateDmEnabled });
    groups.set(key, current);
  }

  return Array.from(groups.entries())
    .map(([id, groupItems]) => buildGroupedActivity(id, groupItems, options.privateDmEnabled))
    .sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt))
    .slice(0, options.limit ?? 20);
}

export function isAppReviewFriendlyActivity(item: GroupedActivity) {
  const text = `${item.title} ${item.subtitle} ${item.badge}`.toLowerCase();
  const blockedTerms = [
    "no trigger",
    "skipped",
    "failed",
    "blocked",
    "ignored",
    "duplicate",
    "capability",
    "private dm",
    "monthly reply limit",
    "loop guard",
  ];

  if (blockedTerms.some((term) => text.includes(term))) return false;
  return (
    item.steps.commentReceived ||
    item.steps.triggerMatched ||
    item.steps.publicReply === "sent" ||
    item.tone === "green" ||
    item.tone === "blue"
  );
}

export function filterAppReviewActivity(items: GroupedActivity[], limit = 20) {
  return items.filter(isAppReviewFriendlyActivity).slice(0, limit);
}

function buildGroupedActivity(id: string, items: ActivityInput[], privateDmEnabled?: boolean): GroupedActivity {
  const newest = [...items].sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt))[0];
  const metas = items.map((item) => metaRecord(item.meta));
  const commentId = firstString([...metas.map((meta) => meta.sourceCommentId), ...items.map((item) => item.commentId)]);
  const mediaId = firstString(items.map((item) => item.mediaId));
  const igUserId = firstString(items.map((item) => item.igUserId));
  const keyword = firstString(items.map((item) => item.keyword));
  const text = items.map(activityText).join(" ");
  const types = new Set(items.map((item) => item.type));
  const statuses = new Set(items.map((item) => item.status).filter(Boolean));
  const publicReplyCommentId = firstString(metas.map((meta) => meta.publicReplyCommentId));
  const endpoint = firstString(metas.map((meta) => meta.endpoint));
  const commenterUsername = firstString(metas.map((meta) => meta.commenterUsername));
  const replyTextPreview = firstString(metas.map((meta) => meta.replyTextPreview ?? meta.normalizedPublicReplyText));
  const error = firstString([
    ...items.map((item) => item.errorMessage),
    ...metas.map((meta) => meta.error),
  ].map((value) => (typeof value === "string" ? formatLogError(value) : null)));

  const steps = {
    commentReceived: types.has("COMMENT_RECEIVED") || types.has("REAL_COMMENT_EVENT") || types.has("WEBHOOK_RECEIVED") || types.has("COMMENT_WEBHOOK_RECEIVED"),
    triggerMatched: types.has("KEYWORD_MATCHED"),
    publicReply: null as GroupedActivity["steps"]["publicReply"],
    privateDm: null as GroupedActivity["steps"]["privateDm"],
    selfCommentSkipped: types.has("SELF_COMMENT_SKIPPED"),
    duplicateSkipped: types.has("DUPLICATE_SKIPPED") || text.includes("duplicate_comment_webhook"),
    usageLimitReached: text.includes("static_reply_limit_reached"),
    loopGuard: types.has("LOOP_GUARD_TRIGGERED") || types.has("LOOP_GUARD_PAUSED_CAMPAIGN"),
  };

  if (types.has("PUBLIC_REPLY_SENT") || types.has("COMMENT_REPLY_SENT")) steps.publicReply = "sent";
  if (types.has("PUBLIC_REPLY_FAILED") || types.has("COMMENT_REPLY_FAILED")) steps.publicReply = "failed";
  if (text.includes("public_reply_disabled")) steps.publicReply = "off";
  if (types.has("COMMENT_SKIPPED") && steps.publicReply === null) steps.publicReply = "skipped";

  if (types.has("DM_SENT")) steps.privateDm = "sent";
  if (types.has("DM_SKIPPED")) steps.privateDm = text.includes("external_dm_tool_enabled") ? "off" : "skipped";
  if (types.has("DM_FAILED") || types.has("DM_FAILED_FAILED")) {
    steps.privateDm = isMetaCapabilityMissing(text) ? "blocked" : "failed";
  }

  const base: Omit<GroupedActivity, "title" | "subtitle" | "tone" | "badge"> = {
    id,
    commentId,
    mediaId,
    igUserId,
    keyword,
    createdAt: newest?.createdAt ?? new Date(0).toISOString(),
    actorLabel: actorLabel(commenterUsername, igUserId),
    commentText: firstString(metas.map((meta) => meta.commentText)),
    steps,
    details: {
      ...(commentId ? { commentId } : {}),
      ...(mediaId ? { mediaId } : {}),
      ...(igUserId ? { igUserId } : {}),
      ...(commenterUsername ? { commenterUsername } : {}),
      ...(keyword ? { keyword } : {}),
      ...(endpoint ? { endpoint } : {}),
      ...(publicReplyCommentId ? { publicReplyCommentId } : {}),
      ...(replyTextPreview ? { replyTextPreview } : {}),
      ...(publicReplyCommentId
        ? { visibilityHelper: "Meta confirmed the reply. If it is not visible, check the exact post, collapsed replies, or Instagram filtering." }
        : steps.publicReply === "failed"
        ? { visibilityHelper: "Meta did not confirm reply creation." }
        : {}),
      ...(error ? { error } : {}),
      technicalTypes: Array.from(types),
    },
  };

  if (steps.selfCommentSkipped) {
    return completeGroup(base, "Ignored self-comment from connected account", "Connected account comment ignored.", "amber", "SKIPPED");
  }
  if (steps.duplicateSkipped) {
    return completeGroup(base, "Duplicate webhook ignored", "Repeated webhook delivery ignored.", "slate", "SKIPPED");
  }
  if (steps.loopGuard) {
    return completeGroup(base, "Loop guard protected this campaign", "AP3k blocked a possible self-reply loop.", "amber", "PROTECTED");
  }
  if (steps.usageLimitReached) {
    return completeGroup(base, "Monthly reply limit reached", "No public reply or DM was sent.", "amber", "LIMIT");
  }
  if (privateDmEnabled === false && steps.privateDm === "blocked") {
    return completeGroup(
      base,
      "Older DM attempt blocked by Meta",
      "Private DM is currently off; this is an older or historical event.",
      "slate",
      "OLD"
    );
  }
  if (steps.publicReply === "sent" && (steps.privateDm === "skipped" || steps.privateDm === "off")) {
    return completeGroup(base, "Comment handled successfully", "Public reply sent · Private DM skipped", "green", "SENT");
  }
  if (steps.publicReply === "sent" && steps.privateDm === "blocked") {
    return completeGroup(base, "Comment partially handled", "Public reply sent · Private DM blocked by Meta approval", "amber", "PARTIAL");
  }
  if (steps.publicReply === "sent") {
    return completeGroup(base, "Public reply sent", keyword ? `Trigger matched "${keyword}"` : "Trigger matched", "green", "SENT");
  }
  if (steps.publicReply === "off" && steps.privateDm === "off") {
    return completeGroup(base, "Comment matched · no outbound action", "Public reply and private DM are disabled.", "slate", "SKIPPED");
  }
  if (steps.publicReply === "failed") {
    return completeGroup(base, "Public reply failed", error ?? "Meta did not confirm the public reply.", "red", "FAILED");
  }
  if (steps.privateDm === "sent") {
    return completeGroup(base, "Private DM sent", keyword ? `Trigger matched "${keyword}"` : "Trigger matched", "green", "SENT");
  }
  if (steps.privateDm === "blocked") {
    return completeGroup(base, "Private DM blocked by Meta", "Requires instagram_manage_messages approval.", "red", "FAILED");
  }
  if (steps.triggerMatched) {
    return completeGroup(base, "Comment matched · no outbound action", "No public reply or private DM was sent.", "slate", "SKIPPED");
  }
  return completeGroup(base, "Comment received · no trigger match", "No configured trigger matched this comment.", "slate", "NO MATCH");
}

export function formatLogError(message: string) {
  if (message.includes("static_reply_limit_reached")) {
    return "Skipped — monthly static reply limit reached.";
  }
  if (isMetaCapabilityMissing(message)) {
    return "Meta blocked private DM until instagram_manage_messages capability is approved.";
  }
  return message;
}

export function isMetaCapabilityMissing(message: string) {
  const text = message.toLowerCase();
  return (
    text.includes("dm_capability_missing") ||
    text.includes("code=3") ||
    text.includes("capability") ||
    text.includes("permission")
  );
}

export function isWeakPublicReply(text: string) {
  const meaningful = Array.from(text).filter((char) => /[A-Za-z0-9\u0600-\u06FF]/.test(char)).join("");
  return meaningful.length < 6;
}

function friendlyActivityType(type: string) {
  const friendly: Record<string, string> = {
    WEBHOOK_RECEIVED: "Comment received",
    REAL_COMMENT_EVENT: "Comment received",
    COMMENT_RECEIVED: "Comment received",
    KEYWORD_MATCHED: "Trigger matched",
    ANY_COMMENT: "Any comment trigger matched",
    PUBLIC_REPLY_SENT: "Public reply sent",
    PUBLIC_REPLY_FAILED: "Public reply failed",
    DM_SENT: "Private DM sent",
    DM_SKIPPED: "Private DM skipped",
    DM_FAILED: "Private DM failed",
    COMMENT_SKIPPED: "Comment skipped",
    NO_MATCH: "No trigger match",
    DM_FAILED_FAILED: "Private DM failed",
    COMMENT_REPLY_SENT: "Public reply sent",
    COMMENT_REPLY_FAILED: "Public reply failed",
  };
  if (friendly[type]) return friendly[type];
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function activityTone(type: string, status?: string) {
  if (type.includes("SENT") || type.includes("MATCHED") || status === "PROCESSED") return "green";
  if (type.includes("WEBHOOK") || type === "REAL_COMMENT_EVENT" || status === "PROCESSING" || status === "RECEIVED") return "blue";
  if (type.includes("SKIPPED")) return "amber";
  return "slate";
}

function isTechnicalActivity(type: string, source?: string | null) {
  return type === "REAL_COMMENT_EVENT" || type === "WEBHOOK_RECEIVED" || source === "webhook";
}

function activityText(item: ActivityInput) {
  return [
    item.type,
    item.status,
    item.errorMessage,
    typeof item.meta === "string" ? item.meta : JSON.stringify(item.meta ?? {}),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function metaRecord(meta: unknown): Record<string, unknown> {
  return meta && typeof meta === "object" && !Array.isArray(meta) ? (meta as Record<string, unknown>) : {};
}

function groupKey(item: ActivityInput) {
  const meta = metaRecord(item.meta);
  const sourceCommentId = typeof meta.sourceCommentId === "string" ? meta.sourceCommentId : null;
  if (sourceCommentId) return `comment:${sourceCommentId}`;
  if (item.commentId) return `comment:${item.commentId}`;
  const timeBucket = Math.floor(toTime(item.createdAt) / 5000);
  if (item.mediaId && item.igUserId) return `near:${item.mediaId}:${item.igUserId}:${timeBucket}`;
  return `item:${item.id ?? item.type}:${timeBucket}`;
}

function completeGroup(
  base: Omit<GroupedActivity, "title" | "subtitle" | "tone" | "badge">,
  title: string,
  subtitle: string,
  tone: GroupedActivity["tone"],
  badge: string
): GroupedActivity {
  return { ...base, title, subtitle, tone, badge };
}

function firstString(values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function toTime(value?: Date | string | null) {
  if (!value) return 0;
  return new Date(value).getTime();
}

function truncateId(value: string) {
  return value.length > 12 ? `${value.slice(0, 12)}...` : value;
}

export function shortInstagramId(value: string) {
  return value.length > 8 ? `${value.slice(0, 4)}…${value.slice(-4)}` : value;
}

function actorLabel(username: string | null, igUserId?: string | null) {
  if (username) return `@${username.replace(/^@/, "")}`;
  if (igUserId) return `Instagram user ${shortInstagramId(igUserId)}`;
  return null;
}

function formatActivityTime(value: Date | string) {
  return new Date(value).toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
