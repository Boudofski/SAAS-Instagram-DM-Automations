import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = { id: string; userId: string; units: number; source: string; createdAt: Date };
const state = vi.hoisted(() => ({ rows: [] as Row[], sent: 0, limit: 500 as number | null, locks: [] as string[], seq: 0 }));

const tx = vi.hoisted(() => ({
  $queryRaw: vi.fn(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    state.locks.push(String(values[0]));
    return [{ lockResult: "" }];
  }),
  usageReservation: {
    deleteMany: vi.fn(async ({ where }: any) => {
      const before = state.rows.length;
      state.rows = state.rows.filter((r) => !(r.userId === where.userId && r.createdAt < where.createdAt.lt));
      return { count: before - state.rows.length };
    }),
    create: vi.fn(async ({ data }: any) => {
      const row = { id: `res-${++state.seq}`, createdAt: new Date(), ...data };
      state.rows.push(row);
      return { id: row.id };
    }),
  },
}));

// Serialize transactions the way pg_advisory_xact_lock serializes reservers.
let queue: Promise<unknown> = Promise.resolve();
vi.mock("@/lib/prisma", () => ({
  client: {
    $transaction: (fn: (t: typeof tx) => Promise<unknown>) => {
      const run = queue.then(() => fn(tx));
      queue = run.catch(() => undefined);
      return run;
    },
    usageReservation: {
      updateMany: vi.fn(async ({ where, data }: any) => {
        const row = state.rows.find((r) => r.id === where.id && r.units > where.units.gt);
        if (!row) return { count: 0 };
        row.units -= data.units.decrement;
        return { count: 1 };
      }),
      deleteMany: vi.fn(async ({ where }: any) => {
        const before = state.rows.length;
        state.rows = state.rows.filter((r) => r.id !== where.id);
        return { count: before - state.rows.length };
      }),
    },
  },
}));

const usageCalls = vi.hoisted(() => [] as unknown[][]);
vi.mock("@/actions/usage/queries", () => ({
  getUserMonthlyUsage: async (...args: unknown[]) => {
    usageCalls.push(args);
    const userId = args[0] as string;
    const reserved = state.rows.filter((r) => r.userId === userId).reduce((sum, r) => sum + r.units, 0);
    const used = state.sent + reserved;
    return {
      plan: "FREE",
      staticReplies: { used, limit: state.limit ?? "unlimited", remaining: state.limit === null ? null : Math.max(0, state.limit - used) },
    };
  },
}));

import { client } from "@/lib/prisma";
import { releaseStaticUsage, reserveStaticUsage, settleStaticUsageUnit } from "./usage-reservation";

beforeEach(() => {
  state.rows = [];
  state.sent = 0;
  state.limit = 500;
  state.locks = [];
  usageCalls.length = 0;
  vi.clearAllMocks();
});

describe("atomic static usage reservations", () => {
  it("lets only one of several simultaneous sends take the last action", async () => {
    state.sent = 499;
    const results = await Promise.all(
      Array.from({ length: 5 }, () => reserveStaticUsage({ userId: "user-1", source: "DM" })),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.filter((r) => !r.ok).every((r) => !r.ok && r.reason === "static_reply_limit_reached")).toBe(true);
    expect(state.rows).toHaveLength(1);
  });

  it("reserves a public reply and DM together, or neither", async () => {
    state.sent = 499;
    const pair = await reserveStaticUsage({ userId: "user-1", units: 2, source: "COMMENT" });
    expect(pair.ok).toBe(false);
    expect(state.rows).toHaveLength(0);
    state.sent = 498;
    expect((await reserveStaticUsage({ userId: "user-1", units: 2, source: "COMMENT" })).ok).toBe(true);
    expect(state.rows[0].units).toBe(2);
  });

  it("locks per account and reads usage inside the transaction, including reservations", async () => {
    await reserveStaticUsage({ userId: "user-1", source: "DM" });
    await reserveStaticUsage({ userId: "user-2", source: "DM" });
    expect(state.locks).toEqual(["static-usage:user-1", "static-usage:user-2"]);
    expect(usageCalls[0][2]).toBe(tx);
    expect(usageCalls[0][3]).toEqual({ includeReservations: true });
  });

  it("never blocks one account because another is at its limit", async () => {
    state.sent = 499;
    await reserveStaticUsage({ userId: "user-1", source: "DM" });
    const other = await reserveStaticUsage({ userId: "user-2", source: "DM" });
    expect(other.ok).toBe(true);
  });

  it("allows unlimited owner overrides without counting against a cap", async () => {
    state.limit = null;
    state.sent = 1_000_000;
    expect((await reserveStaticUsage({ userId: "owner", source: "DM" })).ok).toBe(true);
  });

  it("drops lapsed reservations from a crashed worker before deciding", async () => {
    state.sent = 499;
    state.rows.push({ id: "stale", userId: "user-1", units: 1, source: "DM", createdAt: new Date(Date.now() - 11 * 60 * 1000) });
    expect((await reserveStaticUsage({ userId: "user-1", source: "DM" })).ok).toBe(true);
    expect(state.rows.map((r) => r.id)).not.toContain("stale");
  });

  it("settles one unit per logged send and removes the hold when none remain", async () => {
    state.sent = 0;
    const pair = await reserveStaticUsage({ userId: "user-1", units: 2, source: "COMMENT" });
    if (!pair.ok) throw new Error("expected reservation");
    await settleStaticUsageUnit(pair.reservationId);
    expect(state.rows[0].units).toBe(1);
    await settleStaticUsageUnit(pair.reservationId);
    expect(state.rows).toHaveLength(0);
  });

  it("releases unused units, for example when the DM is skipped after the public reply", async () => {
    const pair = await reserveStaticUsage({ userId: "user-1", units: 2, source: "COMMENT" });
    if (!pair.ok) throw new Error("expected reservation");
    await settleStaticUsageUnit(pair.reservationId);
    await releaseStaticUsage(pair.reservationId);
    expect(state.rows).toHaveLength(0);
  });

  it("ignores missing reservation ids and never throws from a send path", async () => {
    await expect(settleStaticUsageUnit(null)).resolves.toBeUndefined();
    await expect(releaseStaticUsage(undefined)).resolves.toBeUndefined();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(client.usageReservation.deleteMany).mockRejectedValueOnce(new Error("db down"));
    await expect(releaseStaticUsage("res-x")).resolves.toBeUndefined();
  });
});
