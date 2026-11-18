import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("creates the additive reservation table, sums in-flight units and cascades with the account", async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE TABLE "User" (id UUID PRIMARY KEY);
      INSERT INTO "User" VALUES ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');`);
    await db.exec(readFileSync("prisma/migrations/20261116150000_usage_reservation/migration.sql", "utf8"));
    await db.exec(`INSERT INTO "UsageReservation" ("userId","units","source","createdAt") VALUES
      ('00000000-0000-0000-0000-000000000001', 2, 'COMMENT', now()),
      ('00000000-0000-0000-0000-000000000001', 1, 'DM', now() - interval '11 minutes'),
      ('00000000-0000-0000-0000-000000000002', 1, 'DM', now());`);
    const active = await db.query<{ units: number }>(`SELECT COALESCE(SUM(units),0)::int AS units FROM "UsageReservation"
      WHERE "userId"='00000000-0000-0000-0000-000000000001' AND "createdAt" >= now() - interval '10 minutes'`);
    expect(active.rows[0].units).toBe(2);
    await db.exec(`DELETE FROM "User" WHERE id='00000000-0000-0000-0000-000000000001'`);
    expect((await db.query(`SELECT * FROM "UsageReservation"`)).rows).toHaveLength(1);
    const ids = await db.query<{ id: string }>(`SELECT id FROM "UsageReservation"`);
    expect(ids.rows[0].id).toMatch(/^[0-9a-f-]{36}$/);
  } finally {
    await db.close();
  }
}, 15000);
