# Tasks: ANS-01 — Foundations

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | PR#1 ~330 · PR#2 ~350 · PR#3 ~330 · PR#4 ~390 (all authored; `pnpm-lock.yaml` and drizzle-generated `0000_*.sql`/`meta/_journal.json` are tool output, excluded from authored count but present in the diff) |
| 400-line budget risk | Low (PR#1, PR#3) / Medium (PR#2) / **High** (PR#4) |
| Chained PRs recommended | Yes |
| Suggested split | PR#1 `workspace-foundation` → PR#2 `local-environment` → PR#3 `domain-core` → PR#4 `persistence-schema` + `testing-harness` |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Workspace + task graph + lint/type boundaries + CI + commit conventions | PR#1 (base: `feat/ans-01-foundations`) | `pnpm lint`, `pnpm typecheck` | N/A — no runtime service exists yet | Revert PR#1 merge commit; nothing downstream exists |
| 2 | Compose topology + healthchecks + liveness apps + env contract | PR#2 (base: PR#1 branch) | `pnpm build` | `docker compose up -d` (healthy <60s), `docker compose down -v && up -d` | Revert PR#2 merge commit; PR#1 stays usable |
| 3 | Pure domain package + ports + Vitest root config + lint-guard test | PR#3 (base: PR#2 branch) | `pnpm --filter @answerya/core test` (Docker stopped) | N/A — core has zero infra dependency by design (AC-6) | Revert PR#3 merge commit; PR#1/#2 stay usable |
| 4 | Contracts flow-graph schemas + Drizzle schema/migration/repository + Testcontainers integration | PR#4 (base: PR#3 branch) | `pnpm test` | Testcontainers Postgres 17, fallback `TEST_DATABASE_URL` via Compose `postgres` | Revert PR#4 merge commit; schema reset is drop-and-re-migrate (AC-9) |

**Contingency for PR#4**: if authored lines exceed 400 at apply time, split at the contracts/Drizzle seam: **#4a** contracts flow-graph schemas + core `FlowGraph` type (tasks 4.2–4.8), **#4b** Drizzle schema + migration + repository + integration tests (tasks 4.9–4.27). #4a targets PR#3's branch; #4b targets #4a's branch.

---

## PR#1 — workspace-foundation (base: `feat/ans-01-foundations`) — verifies AC-3, AC-4

- [ ] 1.1 Create `pnpm-workspace.yaml` declaring `apps/*`, `packages/*`.
- [ ] 1.2 Create root `package.json` with workspace scripts, Turborepo devDependency, pinned `packageManager`.
- [ ] 1.3 Create `turbo.json` per D3: `build`/`typecheck`/`test` `dependsOn: ["^build"]`, `lint` independent, `db:migrate` `cache: false`.
- [ ] 1.4 Create `tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, **`module: nodenext` + `moduleResolution: nodenext`**, `isolatedModules`, `verbatimModuleSyntax`. **Do NOT use `moduleResolution: bundler` in the base config** — it requires `module: esnext`/`preserve`, and TypeScript documents that it permits extensionless relative specifiers which `tsc` emits verbatim and Node's ESM resolver then rejects with `ERR_MODULE_NOT_FOUND`. `apps/worker` is a bundler-less Node process, so `bundler` would make it pass AC-2/AC-4 and crash on boot, failing AC-1. `apps/web` overrides to `bundler` in its own tsconfig (Next.js bundles it); every tsc-emitted package stays on `nodenext`.
- [ ] 1.5 Scaffold `package.json` + `tsconfig.json` (composite, rootDir/outDir, `references` per D1 direction graph) for `apps/web`, `apps/worker`, `packages/core`, `packages/contracts`, `packages/adapters` — no source yet.
- [ ] 1.6 Create `packages/ui/package.json` only — empty placeholder for ANS-04; no other content.
- [ ] 1.7 Create `eslint.config.js` flat config with `import-x/no-restricted-paths` zone (`target: packages/core/src`, `from: packages/adapters`) and `no-restricted-imports` patterns (`@answerya/adapters*`, `@answerya/contracts*`, `zod`, `drizzle-orm`, `node:*`) scoped to `packages/core/**`. **Pin the zone `basePath` to an absolute path derived from `eslint.config.js`'s own location (repo root), not `process.cwd()`** — Turborepo runs `lint` per-package, so a cwd-relative `basePath` would silently match nothing and the guard would pass without ever checking anything.
- [ ] 1.8 Create `.prettierrc`.
- [ ] 1.9 Create `commitlint.config.js` + `.husky/commit-msg` (conventional-commits ruleset).
- [ ] 1.10 Create root `.gitignore`.
- [ ] 1.11 Create `.github/workflows/ci.yml`: `lint` → `typecheck` → `test`, sequential, fail-fast. Ships unverified (no GitHub remote exists yet); activates when a remote appears — do not add a task requiring a push or a green run.
- [ ] 1.12 Create `CONTRIBUTING.md`: branch naming (`feat/ans-<NN>-<slug>`), PR workflow, commit conventions.
- [ ] 1.13 Add root `test` script invoking `vitest run --passWithNoTests` so `pnpm test` exits `0` on a workspace with no test files yet (until PR#3 lands Vitest projects).
- [ ] 1.14 Verify: `pnpm install` exit `0`; `pnpm lint` exit `0` (AC-3); `pnpm typecheck` exit `0` (AC-4).

## PR#2 — local-environment (base: PR#1 branch) — verifies AC-1, AC-2, AC-10

- [ ] 2.1 Create `packages/contracts/src/env.ts` — Zod schema parsing `POSTGRES_USER|PASSWORD|DB|PORT`, `DATABASE_URL`, `REDIS_URL`, `TOKEN_ENCRYPTION_KEY`, `NODE_ENV`, `WEB_PORT`, `WORKER_HEALTH_PORT`, `TEST_DATABASE_URL` at boot; fails immediately naming the missing field.
- [ ] 2.2 Create `.env.example` at repo root with placeholder values only, matching the D9 variable contract.
- [ ] 2.3 Create `apps/web` minimal Next.js 15 App Router liveness page + `GET /api/health` route.
- [ ] 2.4 Create `apps/worker` minimal `node:http` liveness server (zero dependencies) exposing `GET :$WORKER_HEALTH_PORT/health`.
- [ ] 2.5 Create `apps/web/Dockerfile`, `apps/worker/Dockerfile` (multi-stage builds).
- [ ] 2.6 Create `.dockerignore`.
- [ ] 2.7 Create `docker-compose.yml`: `postgres:17-alpine` (`pg_isready -U $POSTGRES_USER -d $POSTGRES_DB`, volume `answerya_pgdata`), `redis:7-alpine --appendonly yes` (`redis-cli ping`, volume `answerya_redisdata`), `web` + `worker` with `depends_on: condition: service_healthy` on both.
- [ ] 2.8 Document the two-DSN gotcha in `CONTRIBUTING.md`: host `pnpm db:migrate` needs `DATABASE_URL` targeting `localhost:${POSTGRES_PORT}`; Compose overrides it per-service with `postgres:5432`.
- [ ] 2.9 Verify: `docker compose up -d` → all four services `healthy` in under 60s (AC-1); `pnpm build` exit `0` now building real liveness code (AC-2); `git grep -i "secret\|token\|password" -- .env.example` shows placeholder keys only (AC-10); `docker compose down -v && docker compose up -d` succeeds (stack-level half of AC-9; `db:migrate` half lands in PR#4).

## PR#3 — domain-core (base: PR#2 branch) — verifies AC-6, AC-8

- [ ] 3.1 Create `packages/core/package.json` with **no `dependencies` key** (D4 layer 1).
- [ ] 3.2 Create `packages/core/tsconfig.json` with **no `references`** (D2/D4 layer 2 — the primary hexagon enforcement).
- [ ] 3.3 Create `packages/core/src/shared/result.ts` — `Result<T,E>` using the const-object pattern (`RESULT_KIND`).
- [ ] 3.4 Create `packages/core/src/shared/clock.ts` — `Clock` interface (`now(): Date`).
- [ ] 3.5 Create `packages/core/src/engagement/ports/{comment-source,private-reply-sender,public-replier,execution-ledger,flow-repository}.ts` — 5 ports; `ExecutionLedger.claim()` returns `ALREADY_CLAIMED` as a success value, never `Err`.
- [ ] 3.6 Create `packages/core/src/analytics/ports/metric-source.ts`.
- [ ] 3.7 Create `packages/core/src/identity/ports/token-vault.ts`.
- [ ] 3.8 Create barrel exports per domain folder + `packages/core/src/index.ts`.
- [ ] 3.9 Create root `vitest.config.ts` with `test.projects`: `core` (no setup), `contracts` (no setup), `adapters:unit` (no setup); declare `adapters:integration` (`globalSetup`) as inert placeholder until PR#4 supplies its setup file.
- [ ] 3.10 Create `packages/core/vitest.config.ts` (no setup, no infra).
- [ ] 3.11 Write `packages/core` unit tests: `Result` OK/Err variants, `Clock` substitution, port type-level compilation.
- [ ] 3.12 Create the boundary fixture at **`packages/core/src/__fixtures__/adapter-import.fixture.ts`** — it MUST live inside `packages/core/src`, because `import-x/no-restricted-paths` reports only on files matching the zone `target`; a fixture under `packages/core/test/` sits outside the zone and could never trigger the relative-traversal case the zone exists to catch. Include BOTH violations, one per rule: a relative `../../adapters/...` traversal (zone rule) and a bare `@answerya/adapters` import (`no-restricted-imports`). Exclude it twice so it cannot break the build: `ignores` in `eslint.config.js`, and `exclude` in `packages/core/tsconfig.json` so `tsc` never type-checks an unresolvable import.
- [ ] 3.13 Write a Vitest test running ESLint programmatically against the fixture with **`new ESLint({ ignore: false })`** — this flag is mandatory: a file matched by flat-config `ignores` is skipped by `lintFiles`, which returns only the warning "File ignored because of a matching ignore pattern" and ZERO rule messages, so the default-options version of this test asserts on nothing. Assert that BOTH rule ids report (`import-x/no-restricted-paths` and `no-restricted-imports`), so neither half of the guard can silently stop matching. Invoke it with the same cwd Turborepo uses for the root `lint` task, so a `basePath` regression (task 1.7) is caught here rather than passing silently.
- [ ] 3.14 Verify: `pnpm --filter @answerya/core test` exit `0` with Docker stopped (AC-6); `grep -r "from '@answerya/adapters" packages/core/src | wc -l` → `0` (AC-8).

## PR#4 — persistence-schema + testing-harness (base: PR#3 branch) — verifies AC-5, AC-7, AC-9 — HIGH budget risk

- [ ] 4.1 **FIRST TASK — feasibility gate.** Verify Testcontainers can reach the Docker socket under WSL2: start a throwaway `PostgreSqlContainer`. On failure, confirm the `TEST_DATABASE_URL` fallback against Compose `postgres` works instead. Record the outcome before continuing — this gates the rest of the slice; the D10 fallback is the mitigation, not the plan.
- [ ] 4.2 Create `packages/contracts/src/flow-graph/node-types.ts` — `FLOW_NODE_TYPE` const (`trigger.comment`, `action.send_dm`, `action.public_reply`).
- [ ] 4.3 Create `packages/contracts/src/flow-graph/nodes/*.ts` — per-node-type Zod schemas.
- [ ] 4.4 Create `packages/contracts/src/flow-graph/edge.ts`.
- [ ] 4.5 Create `packages/contracts/src/flow-graph/graph.ts` — `flowGraphV1Schema`: `discriminatedUnion("type", ...)` + refinements (unique node ids, edges reference existing nodes, exactly one trigger).
- [ ] 4.6 Create `packages/contracts/src/flow-graph/versions.ts` — `FLOW_GRAPH_SCHEMAS = { 1: flowGraphV1Schema }` registry keyed by `schema_version`.
- [ ] 4.7 Create `packages/core/src/engagement/flow-graph.ts` — plain-TS `FlowGraph` domain type (core cannot import Zod, D4).
- [ ] 4.8 Add a compile-time assertion in `packages/contracts` that `z.infer<typeof flowGraphV1Schema>` is assignable to core's `FlowGraph` — breaks the build on drift.
- [ ] 4.9 Create `packages/adapters/src/persistence/schema/*.ts` — one file per table, all 10 ANS-00 §4.4 tables (D6). **`conversations`/`messages` columns are a deliberate minimal provisional shape** — ANS-00 §4.4 specifies only "inbox threads"; do not over-design, the real shape lands with ANS-02 payloads.
- [ ] 4.10 `flow_executions` schema: **UNIQUE `(comment_id)` alone, never composite with `flow_id`** (the product's highest-severity invariant).
- [ ] 4.11 `webhook_events` schema: UNIQUE `(dedupe_key)`, `raw` `NOT NULL`.
- [ ] 4.12 `flows` schema: `graph jsonb().$type<unknown>()` (never `$type<FlowGraph>()`), `schema_version`, `status` enum `draft|active`.
- [ ] 4.13 `connected_accounts` schema: `CHECK (token_ciphertext ~ '^v[0-9]+\.')`, UNIQUE `(platform, external_id)`.
- [ ] 4.14 Create `packages/adapters/src/persistence/schema/index.ts` barrel (drizzle-kit entry point).
- [ ] 4.15 Run `drizzle-kit generate`; commit `0000_*.sql` + `meta/_journal.json` — tool output, excluded from authored-line budget, present in diff.
- [ ] 4.16 Create `packages/adapters/src/persistence/migrate.ts` — reads `DATABASE_URL`, applies pending migrations in a transaction, exits `0` when the journal is already satisfied.
- [ ] 4.17 Create `packages/adapters/src/persistence/flow-repository.ts` (`DrizzleFlowRepository`): `save()` parses `FLOW_GRAPH_SCHEMAS[current]` and rejects before SQL; `findById()` re-validates `FLOW_GRAPH_SCHEMAS[row.schema_version]`, returns `Result<FlowGraph, InvalidGraph>` / `err(UNSUPPORTED_VERSION)`.
- [ ] 4.18 Export `DrizzleFlowRepository` as the sole module from `@answerya/adapters/persistence` that touches `flows`.
- [ ] 4.19 Create `packages/adapters/vitest.config.ts` wiring `adapters:unit` and `adapters:integration` projects (`globalSetup` on integration only).
- [ ] 4.20 Create `packages/adapters/test/integration/global-setup.ts`: Testcontainers first; on Docker-socket failure use `TEST_DATABASE_URL` if set (log a warning), else fail naming the variable and pointing at `CONTRIBUTING.md`. Runs `migrate()`, publishes DSN via `provide()`.
- [ ] 4.21 Write the flagship integration test: duplicate `comment_id` `INSERT ... ON CONFLICT DO NOTHING` → `rowCount === 0`, no error raised, exactly one row remains, **and `pg_indexes` still reports a unique index on `flow_executions(comment_id)`** (three assertions — the third is what makes it a regression guard).
- [ ] 4.22 Write integration test: duplicate `dedupe_key` insert on `webhook_events` rejected/no-op.
- [ ] 4.23 Write integration test: writing an invalid graph (unknown node type) is rejected before reaching the database.
- [ ] 4.24 Write integration test: a stored graph is re-validated against its `schema_version` on read.
- [ ] 4.25 Write integration test: migration idempotency — `pnpm db:migrate && pnpm db:migrate` both exit `0`.
- [ ] 4.26 Add `TRUNCATE ... RESTART IDENTITY CASCADE` in `beforeEach` across integration suites.
- [ ] 4.27 Verify: `pnpm test` exit `0` with the UNIQUE index test green (AC-5); `pnpm db:migrate && pnpm db:migrate` exit `0` both times (AC-7); `docker compose down -v && docker compose up -d && pnpm db:migrate` exit `0` from scratch (AC-9).
- [ ] 4.28 Update `openspec/config.yaml`: set `rules.verify.test_command: "pnpm test"`, `rules.verify.build_command: "pnpm build"`, `rules.apply.tdd: true` now that Vitest is installed workspace-wide.

## Key Learnings

1. `import-x/no-restricted-paths` zones resolve against `basePath`, which defaults to `process.cwd()` — a Turborepo per-package `lint` task would make the rule pass silently by matching nothing, so `basePath` must be pinned to an absolute repo-root path derived from the config file's own location.
2. Testcontainers under WSL2 is ANS-01's only unproven technical assumption and must be checked as the first task of PR#4, before any schema or repository work begins.
3. `flow_executions.comment_id` must stay UNIQUE alone, never composite with `flow_id` — a composite key would let two flows claim the same comment and violate Meta's one-private-reply-per-comment rule.
4. The Drizzle `flows.graph` column must stay typed `jsonb().$type<unknown>()` rather than the domain `FlowGraph` type, so TypeScript cannot hand an unvalidated document to any caller.
