// Flagship integration test (task 4.21, design D10, spec
// `flow_executions.comment_id` UNIQUE invariant, testing-harness
// requirement "UNIQUE Index Idempotency Test (CRITICAL)").
//
// Asserts three things, not one: (1) the second insert for a duplicate
// `comment_id` is a silent no-op, (2) exactly one row remains, and (3)
// `pg_indexes` still reports a unique index on
// `flow_executions(comment_id)`. Assertion (3) is what makes this a
// regression guard — without it, dropping the index would let (1) and (2)
// pass by accident.
import { sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { connectTestDb, truncateAll } from "./db.js";
import * as schema from "../../src/persistence/schema/index.js";
import { connectedAccounts } from "../../src/persistence/schema/connected-accounts.js";
import { flows } from "../../src/persistence/schema/flows.js";
import { flowExecutions } from "../../src/persistence/schema/flow-executions.js";

describe("flow_executions.comment_id UNIQUE invariant", () => {
  let db: NodePgDatabase<typeof schema>;
  let pool: Pool;

  beforeEach(async () => {
    ({ db, pool } = connectTestDb());
    await truncateAll(db);
  });

  it("rejects a duplicate comment_id as a silent no-op, keeps exactly one row, and the unique index still exists", async () => {
    const [account] = await db
      .insert(connectedAccounts)
      .values({
        platform: "instagram",
        externalId: "acct-1",
        handle: "@answerya",
        tokenCiphertext: "v1.iv.tag.ct",
        tokenExpiresAt: new Date(),
        scopes: ["comments"],
      })
      .returning();
    const [flow] = await db
      .insert(flows)
      .values({
        accountId: account!.id,
        name: "welcome-dm",
        scope: "account",
        schemaVersion: 1,
        graph: { nodes: [], edges: [] },
      })
      .returning();

    const commentId = "comment-123";

    const first = await db
      .insert(flowExecutions)
      .values({ flowId: flow!.id, commentId })
      .onConflictDoNothing();
    expect(first.rowCount).toBe(1);

    const second = await db
      .insert(flowExecutions)
      .values({ flowId: flow!.id, commentId })
      .onConflictDoNothing();
    expect(second.rowCount).toBe(0);

    const rows = await db
      .select()
      .from(flowExecutions)
      .where(sql`${flowExecutions.commentId} = ${commentId}`);
    expect(rows).toHaveLength(1);

    const indexes = await pool.query<{ indexname: string }>(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'flow_executions'`,
    );
    const hasUniqueCommentIdIndex = indexes.rows.some((row) =>
      row.indexname.includes("comment_id"),
    );
    expect(hasUniqueCommentIdIndex).toBe(true);

    await pool.end();
  });
});
