// Shared integration-test database connection helper. Each suite gets its
// own `Pool`/`db` pair against the DSN the global setup published, and
// truncates every table in `beforeEach` (task 4.26) so tests stay
// independent regardless of run order.
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import { inject } from "vitest";

import * as schema from "../../src/persistence/schema/index.js";

export function connectTestDb(): { db: NodePgDatabase<typeof schema>; pool: Pool } {
  const pool = new Pool({ connectionString: inject("databaseUrl") });
  const db = drizzle(pool, { schema });
  return { db, pool };
}

const TABLE_NAMES = [
  "messages",
  "conversations",
  "webhook_events",
  "flow_executions",
  "flows",
  "comments",
  "account_snapshots",
  "metric_snapshots",
  "content_items",
  "connected_accounts",
] as const;

export async function truncateAll(db: NodePgDatabase<typeof schema>): Promise<void> {
  await db.execute(sql.raw(`TRUNCATE ${TABLE_NAMES.join(", ")} RESTART IDENTITY CASCADE`));
}
