// Task 4.25: migration idempotency (design D7). Applying the same
// migration set twice against an already-migrated database must be a
// no-op recorded by Drizzle's `__drizzle_migrations` journal table, not
// by an application-level guard.
import { describe, expect, it, inject } from "vitest";

import { runMigrations } from "../../src/persistence/migrate.js";

describe("migration idempotency", () => {
  it("running migrations twice against the same database succeeds both times", async () => {
    const databaseUrl = inject("databaseUrl");

    // The global setup already ran migrations once; running again here
    // must not throw and must remain a no-op in the database.
    await expect(runMigrations(databaseUrl)).resolves.toBeUndefined();
    await expect(runMigrations(databaseUrl)).resolves.toBeUndefined();
  });
});
