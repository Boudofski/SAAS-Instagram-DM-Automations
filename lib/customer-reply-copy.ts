export function customerReplyCopy(value: string) {
  return value
    .replace(/monthly public reply limit/gi, "monthly automated-reply limit")
    .replace(/monthly reply limit/gi, "monthly automated-reply limit")
    .replace(/static replies?/gi, (match) =>
      match.toLowerCase().endsWith("ies") ? "automated replies" : "automated reply"
    )
    .replace(/public replies/gi, "Comment replies")
    .replace(/public reply/gi, "Comment reply")
    .replace(/private replies/gi, "DMs")
    .replace(/private reply/gi, "DM")
    .replace(/private dm/gi, "DM");
}
