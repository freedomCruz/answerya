// Migration runner (design D7): idempotency lives in Drizzle's
// `__drizzle_migrations` journal table, not in hand-written SQL guards.
// Running this twice against the same database exits `0` both times
// because the journal already records every applied migration.
//
// Host-run tool (design D9 two-DSN gotcha): `DATABASE_URL` must point at
// `localhost:${POSTGRES_PORT}` when run directly on the host, never the
// Compose-internal `postgres:5432` hostname.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { fileURLToPath } from "node:url";
import path from "node:path";

const MIGRATIONS_FOLDER = path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations");

export async function runMigrations(databaseUrl: string): Promise<void> {
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await pool.end();
  }
}

async function main(): Promise<void> {
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run migrations");
  }

  await runMigrations(databaseUrl);
  console.log("Migrations applied.");
}

const isEntrypoint = process.argv[1] === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
