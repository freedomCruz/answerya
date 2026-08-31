// Testcontainers-backed integration setup (task 4.20, design D10).
//
// Tries Testcontainers first. On a Docker-socket failure, falls back to
// `TEST_DATABASE_URL` (the Compose `postgres` service) if it is set,
// logging a warning; otherwise fails naming the variable and pointing at
// CONTRIBUTING.md. Falling back on the variable's mere presence — without
// first attempting Testcontainers — would silently mask a genuine Docker
// outage in CI, so the order here is deliberate.
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { TestProject } from "vitest/node";

import { runMigrations } from "../../src/persistence/migrate.js";

let container: StartedPostgreSqlContainer | undefined;

async function startTestcontainer(): Promise<string> {
  container = await new PostgreSqlContainer("postgres:17-alpine").start();
  return container.getConnectionUri();
}

function fallbackDatabaseUrl(): string {
  const testDatabaseUrl = process.env["TEST_DATABASE_URL"];
  if (!testDatabaseUrl) {
    throw new Error(
      "Testcontainers could not reach the Docker socket and TEST_DATABASE_URL is unset. " +
        "Set TEST_DATABASE_URL to the Compose `postgres` service DSN, or fix Docker socket " +
        "access — see CONTRIBUTING.md's Testcontainers fallback section.",
    );
  }
  console.warn(
    "Testcontainers could not reach the Docker socket; falling back to TEST_DATABASE_URL.",
  );
  return testDatabaseUrl;
}

export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  let databaseUrl: string;
  try {
    databaseUrl = await startTestcontainer();
  } catch {
    databaseUrl = fallbackDatabaseUrl();
  }

  await runMigrations(databaseUrl);
  project.provide("databaseUrl", databaseUrl);

  return async () => {
    if (container) {
      await container.stop();
    }
  };
}

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}
