import { defineConfig } from "drizzle-kit";

// Host-run tool (design D9 two-DSN gotcha): `DATABASE_URL` here must point
// at `localhost:${POSTGRES_PORT}`, the host-facing value `.env` ships —
// never the Compose-internal `postgres:5432` hostname.
const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run drizzle-kit");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/persistence/schema/index.ts",
  out: "./src/persistence/migrations",
  dbCredentials: { url: databaseUrl },
});
