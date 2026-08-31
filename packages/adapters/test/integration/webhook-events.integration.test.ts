// Task 4.22: `webhook_events.dedupe_key` UNIQUE invariant.
import { beforeEach, describe, expect, it } from "vitest";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";

import { connectTestDb, truncateAll } from "./db.js";
import * as schema from "../../src/persistence/schema/index.js";
import { webhookEvents } from "../../src/persistence/schema/webhook-events.js";

describe("webhook_events.dedupe_key UNIQUE invariant", () => {
  let db: NodePgDatabase<typeof schema>;
  let pool: Pool;

  beforeEach(async () => {
    ({ db, pool } = connectTestDb());
    await truncateAll(db);
  });

  it("rejects/no-ops a duplicate dedupe_key insert", async () => {
    const dedupeKey = "delivery-abc";

    const first = await db
      .insert(webhookEvents)
      .values({ raw: { hello: "world" }, dedupeKey, signatureOk: true })
      .onConflictDoNothing();
    expect(first.rowCount).toBe(1);

    const second = await db
      .insert(webhookEvents)
      .values({ raw: { hello: "world" }, dedupeKey, signatureOk: true })
      .onConflictDoNothing();
    expect(second.rowCount).toBe(0);

    const rows = await db.select().from(webhookEvents);
    expect(rows).toHaveLength(1);

    await pool.end();
  });
});
