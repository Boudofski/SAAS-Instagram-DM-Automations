import { createHash, timingSafeEqual } from "node:crypto";
import { jwtVerify } from "jose";

export const QSTASH_SCHEDULER_URL = "https://ap3k.com/api/cron/automation-follow-ups";

/** QStash sends a signed, empty POST to wake the existing database queues. */
export async function authorizeQStashScheduler(request: Request) {
  if (process.env.VERCEL_ENV !== "production" || request.method !== "POST" || request.url !== QSTASH_SCHEDULER_URL) return false;
  const signature = request.headers.get("upstash-signature");
  const keys = [process.env.QSTASH_CURRENT_SIGNING_KEY, process.env.QSTASH_NEXT_SIGNING_KEY]
    .map((key) => key?.trim()).filter((key): key is string => Boolean(key));
  if (!signature || signature.length > 16_384 || !keys.length) return false;

  // Bound the raw body before verifying its signed SHA-256 digest. No payload
  // from QStash controls recipients, campaign IDs, or worker parameters.
  const hash = createHash("sha256");
  const reader = request.body?.getReader();
  let bytes = 0;
  try {
    if (reader) {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > 1024) { await reader.cancel(); return false; }
        hash.update(chunk.value);
      }
    }
  } catch { return false; }
  finally { reader?.releaseLock(); }
  const digest = Buffer.from(hash.digest("base64url"));

  for (const key of keys) {
    try {
      const { payload } = await jwtVerify(signature, new TextEncoder().encode(key), {
        algorithms: ["HS256"], issuer: "Upstash", subject: QSTASH_SCHEDULER_URL,
        requiredClaims: ["exp", "nbf", "iat", "sub", "body"],
        maxTokenAge: "10m", clockTolerance: 5,
      });
      if (typeof payload.body !== "string" || !/^[A-Za-z0-9_-]{43}=?$/.test(payload.body)) return false;
      const supplied = Buffer.from(payload.body.replace(/=+$/, ""));
      return supplied.length === digest.length && timingSafeEqual(supplied, digest);
    } catch { /* The next signing key supports Upstash key rotation. */ }
  }
  return false;
}
