type ActivityInput = {
  type: string;
  status?: string | null;
  keyword?: string | null;
  errorMessage?: string | null;
  meta?: unknown;
  source?: string | null;
};

export type ActivityDisplay = {
  label: string;
  badge: string | null;
  tone: "green" | "blue" | "amber" | "red" | "slate";
  detail: string | null;
  technical: boolean;
};

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

  if ((type === "DM_FAILED" || type === "DM_FAILED_FAILED") && capabilityBlocked) {
    return {
      label: "Public reply sent · Private DM blocked by Meta",
      badge: "WARNING",
      tone: "amber",
      detail: formatLogError(text),
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
