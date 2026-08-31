// Environment variable contract for @answerya/contracts.
//
// Parsed once at process boot by apps/web and apps/worker. Fails immediately
// with a message naming the missing/invalid field rather than surfacing a
// cryptic runtime error later (design D9).
//
// Two-DSN gotcha (design D9 / CONTRIBUTING.md): `DATABASE_URL` means
// different things depending on where it runs. A host process (e.g. a local
// `pnpm db:migrate`) must point it at `localhost:${POSTGRES_PORT}`; Compose
// overrides it per-service to the internal hostname `postgres:5432`. This
// schema only validates shape, not which host is correct for the caller.
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().int().positive(),

  DATABASE_URL: z.url(),
  TEST_DATABASE_URL: z.url().optional(),

  REDIS_URL: z.url(),

  TOKEN_ENCRYPTION_KEY: z.string().min(1),

  WEB_PORT: z.coerce.number().int().positive(),
  WORKER_HEALTH_PORT: z.coerce.number().int().positive(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parses `process.env` (or an injected source) against the contract.
 * Throws with a field-named message on the first failure — callers should
 * invoke this once at boot, not per-request.
 */
export function parseEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration — ${issues}`);
  }

  return result.data;
}
