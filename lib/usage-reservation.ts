import { client } from "@/lib/prisma";
import { getUserMonthlyUsage } from "@/actions/usage/queries";
import { activeUsageReservationSince } from "@/lib/usage-reservation-window";
import type { UsageSummary } from "@/lib/plan-limits";

/**
 * Atomic reservations for quota-consuming automated sends (public replies and
 * DMs). Billing is unchanged: a successful public reply and a successful DM
 * each count once, from their SENT records.
 *
 * Why: usage was counted from SENT records written after the Graph call, so
 * simultaneous webhooks for one account could all read the same remaining
 * balance and all send. A reservation is taken under a per-account advisory
 * lock before the send. It counts as used while the send is in flight, then is
 * settled once the outcome is logged. Failed or skipped sends therefore never
 * become usage, and a crashed worker's reservation lapses after the TTL in
 * usage-reservation-window.ts.
 */
export type UsageReservationResult =
  | { ok: true; reservationId: string; usage: UsageSummary }
  | { ok: false; reservationId: null; usage: UsageSummary; reason: "static_reply_limit_reached" };

export async function reserveStaticUsage(input: { userId: string; units?: number; source: string; date?: Date }): Promise<UsageReservationResult> {
  const units = Math.max(1, Math.floor(input.units ?? 1));
  return client.$transaction(async (tx) => {
    // pg_advisory_xact_lock returns void, which Prisma cannot deserialize; cast it.
    await tx.$queryRaw<Array<{ lockResult: string }>>`
      SELECT pg_advisory_xact_lock(hashtext(${`static-usage:${input.userId}`}))::text AS "lockResult"
    `;
    // Keep the table small: lapsed reservations no longer count.
    await tx.usageReservation.deleteMany({ where: { userId: input.userId, createdAt: { lt: activeUsageReservationSince() } } });
    const usage = await getUserMonthlyUsage(input.userId, input.date ?? new Date(), tx, { includeReservations: true });
    const remaining = usage.staticReplies.remaining;
    if (remaining !== null && remaining < units) {
      return { ok: false as const, reservationId: null, usage, reason: "static_reply_limit_reached" as const };
    }
    const reservation = await tx.usageReservation.create({
      data: { userId: input.userId, units, source: input.source },
      select: { id: true },
    });
    return { ok: true as const, reservationId: reservation.id, usage };
  }, { timeout: 15000 });
}

/** Settle one reserved unit after its send's outcome (SENT or FAILED) is logged.
 * Call it only after the log write, so the unit is never uncounted in between. */
export async function settleStaticUsageUnit(reservationId: string | null | undefined) {
  if (!reservationId) return;
  try {
    const decremented = await client.usageReservation.updateMany({
      where: { id: reservationId, units: { gt: 1 } },
      data: { units: { decrement: 1 } },
    });
    if (!decremented.count) await client.usageReservation.deleteMany({ where: { id: reservationId } });
  } catch (error) {
    // Failing to settle only over-counts until the TTL lapses; never throw from a send path.
    console.error("[usage] could not settle reservation", { error: error instanceof Error ? error.message : "unknown_error" });
  }
}

/** Release any units left on a reservation whose remaining sends will not happen. */
export async function releaseStaticUsage(reservationId: string | null | undefined) {
  if (!reservationId) return;
  try {
    await client.usageReservation.deleteMany({ where: { id: reservationId } });
  } catch (error) {
    console.error("[usage] could not release reservation", { error: error instanceof Error ? error.message : "unknown_error" });
  }
}
