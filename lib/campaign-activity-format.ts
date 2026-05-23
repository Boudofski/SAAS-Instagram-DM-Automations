type ActivityInput = {
  type: string;
  status?: string | null;
  keyword?: string | null;
  errorMessage?: string | null;
  meta?: unknown;
  source?: string | null;
  igUserId?: string | null;
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
  const actor = item.igUserId ? `@${item.igUserId}` : null;
  const commentSuffix = item.commentId ? ` → comment ${truncateId(item.commentId)}` : "";
  const meta = metaRecord(item.meta);
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
  if (item.type === "COMMENT_RECEIVED" || item.type === "REAL_COMMENT_EVENT" || item.type === "WEBHOOK_RECEIVED") {
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

function truncateId(value: string) {
  return value.length > 12 ? `${value.slice(0, 12)}...` : value;
}

function formatActivityTime(value: Date | string) {
  return new Date(value).toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
