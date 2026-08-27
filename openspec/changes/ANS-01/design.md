# Design: ANS-01 — Foundations

> Materialises [[ADR_Answerya_Hexagonal_Worker_Split]] structurally and prepares the persistence half of [[ADR_Answerya_Frontend_Design_And_Flow_Canvas]] (decision 3, `flows.graph` as an owned jsonb document). Specs: `workspace-foundation`, `local-environment`, `domain-core`, `persistence-schema`, `testing-harness`.

## Technical Approach

Build the hexagon as a **resolution graph, not a convention**. Every boundary this stage claims is enforced by a mechanism that fails a command, in three layers: pnpm strict resolution, TypeScript `composite` + `rootDir`, and ESLint zones. These layers are ordered, not fully independent: the type layer fires on what resolution lets through, so it narrows the hole rather than covering it alone (see D4). The `flow_executions.comment_id` UNIQUE index and the migration journal put idempotency in Postgres, never in application code. No product behaviour ships; the only executable logic is a liveness endpoint, a migration runner, and the Drizzle flow repository whose sole job is validating the graph document on both edges.

## Architecture Decisions

### D1 — Package topology: one `@answerya/adapters` package with subpath exports

| Option | Tradeoff | Decision |
|---|---|---|
| Single `@answerya/adapters`, folders `src/persistence`, later `src/meta` | One package.json; boundary rule is one path prefix | **Chosen** |
| `packages/adapters/*` as separate packages (`@answerya/adapter-meta`) | Truer screaming architecture, but 4 package.jsons for 1 real adapter in ANS-01 | Rejected — premature; splitting later is a `package.json` move, the ESLint zone is unchanged |

Names/paths: `apps/web` → `@answerya/web`, `apps/worker` → `@answerya/worker`, `packages/core` → `@answerya/core`, `packages/contracts` → `@answerya/contracts`, `packages/adapters` → `@answerya/adapters` (export `.` and `./persistence`), `packages/ui` → `@answerya/ui` (empty placeholder, ANS-04).

```
apps/web ────┐                     ┌──→ @answerya/core  (zero deps, imports nothing)
apps/worker ─┼──→ @answerya/contracts ─┘        ▲
             └──→ @answerya/adapters ───────────┘
                        └──→ @answerya/contracts
```
Legal directions only. `core → *` is empty by construction.

### D2 — TypeScript composition: project references, not path aliases

| Option | Tradeoff | Decision |
|---|---|---|
| `references` + `composite: true` per package | Declares the dependency graph and redirects output; with `rootDir: src` an import that resolves to a source file outside the project fails `tsc` (TS6059/TS6307) | **Chosen** |
| `paths` aliases in `tsconfig.base.json` | Zero setup, but aliases resolve regardless of `package.json` deps — the core→adapters ban degrades to a lint rule one `eslint-disable` away | Rejected |

`tsconfig.base.json` holds compiler flags only (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `module: nodenext`, `moduleResolution: nodenext`, `isolatedModules`, `verbatimModuleSyntax`). Each package sets `composite`, `rootDir: src`, `outDir: dist`, and its `references`.

**Module resolution is `nodenext`, not `bundler`.** `bundler` must be paired with `module: esnext` or `module: preserve`, and TypeScript's own documentation warns it "may allow imports of externalized dependencies that would work in a bundler but are unsafe in Node.js": an extensionless relative specifier type-checks and is emitted verbatim, and Node's ESM resolver rejects it with `ERR_MODULE_NOT_FOUND`. `apps/worker` is a separately deployed long-lived Node process built by `tsc` with no bundler (ADR: two deployables), so under `bundler` it would satisfy AC-2 and AC-4 and then crash on boot, failing AC-1 — green in CI, broken at runtime. `apps/web` overrides to `moduleResolution: bundler` in its own `tsconfig.json` because Next.js bundles it; every tsc-emitted package keeps `nodenext`.

**`packages/core/tsconfig.json` declares no `dependencies` and no `references`.** The load-bearing half is the absent `dependencies`: with pnpm's isolated store nothing is installed to resolve. The absent `references` does not by itself forbid an import — project references govern build orchestration and output redirection, not import admissibility, and an import that resolves to a built `.d.ts` compiles silently. What fires at `tsc` time is `composite` + `rootDir: src`, when resolution reaches a source file outside the project.

### D3 — Turborepo task graph

| Task | `dependsOn` | Cache | Outputs |
|---|---|---|---|
| `build` | `^build` | yes | `dist/**`, `.next/**` |
| `typecheck` | `^build` | yes | — |
| `lint` | — | yes | — |
| `test` | `^build` | yes | — |
| `db:migrate` | `^build` | **no** | — |

```
lint ──(independent)
^build ──→ build ──→ typecheck
              └────→ test ──→ (integration project boots Postgres)
              └────→ db:migrate  [cache:false, env: DATABASE_URL]
```

`test` depends on `^build` deliberately: suites resolve workspace packages through their real `exports` map, so a broken export surfaces in CI now instead of in ANS-03. Rejected alternative: Vite `resolve.alias` pointing at `src` — faster, but tests would then exercise a module graph production never uses. AC-6 still holds: building `@answerya/core` needs no Docker.

### D4 — Core purity: three layers, not one rule

| Layer | Mechanism | Catches |
|---|---|---|
| Resolution | pnpm strict `node_modules`; `packages/core/package.json` has **no `dependencies` key** | Any bare specifier — nothing is installed to import |
| Types | `composite: true` + `rootDir: src` in core's tsconfig | An import resolving to a source file outside the project (TS6059/TS6307). Does **not** catch an import that resolves to a built `.d.ts` — absent `references` is not an import ban |
| Lint | ESLint 9 flat config, block scoped to `packages/core/**` | What the layers above let through: relative escapes, node builtins, and any import that resolves to a built `.d.ts` |

ESLint uses **both** rules, because each misses what the other catches:
- `import-x/no-restricted-paths` zone `target: packages/core/src` ← `from: packages/adapters` — catches `../../adapters/...` relative traversal, which a specifier pattern cannot see.
- `no-restricted-imports` patterns `@answerya/adapters*`, `@answerya/contracts*`, `zod`, `drizzle-orm`, `node:*` — catches bare specifiers, which a filesystem zone cannot see. **`contracts` is banned from core too**: it carries Zod, and one import would end zero-runtime-dependency.

Rejected: `eslint-plugin-boundaries` — a layer taxonomy for a project with exactly one boundary.

**Verifying the rule without breaking CI**: the fixture must live **inside** `packages/core/src`, because `import-x/no-restricted-paths` reports only on files matching the zone `target` — a fixture under `packages/core/test/` sits outside the zone and could never trigger the very relative-traversal case the zone exists to catch. So it lives at `packages/core/src/__fixtures__/adapter-import.fixture.ts` and carries both violations (a relative `../../adapters/...` traversal and a bare `@answerya/adapters` specifier), one per rule.

Two exclusions keep it from breaking the build: `eslint.config.js` `ignores` so `pnpm lint` skips it, and `exclude` in `packages/core/tsconfig.json` so `tsc` never type-checks an import core cannot resolve.

The Vitest test must then pass **`new ESLint({ ignore: false })`**. A file matched by flat-config `ignores` is skipped by `ESLint#lintFiles`, which returns a result carrying only the warning "File ignored because of a matching ignore pattern" and **zero rule messages** — with default options the assertion would be checking nothing. The test asserts both rule ids report, so neither half of the guard can silently stop matching. The guard is tested, not trusted.

### D5 — Port placement: ports belong to their domain, not to a `ports/` bucket

| Domain folder | Ports |
|---|---|
| `core/src/engagement/ports/` | `CommentSource`, `PrivateReplySender`, `PublicReplier`, `ExecutionLedger`, `FlowRepository` |
| `core/src/analytics/ports/` | `MetricSource` |
| `core/src/identity/ports/` | `TokenVault` |
| `core/src/shared/` | `Result<T,E>`, `Clock`, value objects, barrels |

Rejected: a flat `core/src/ports/` — grouping by technical role is the layered pattern the ADR rejected in decision 4.

```ts
const RESULT_KIND = { OK: "ok", ERR: "err" } as const;
type ResultKind = (typeof RESULT_KIND)[keyof typeof RESULT_KIND];
interface Ok<T> { readonly kind: typeof RESULT_KIND.OK; readonly value: T }
interface Err<E> { readonly kind: typeof RESULT_KIND.ERR; readonly error: E }
type Result<T, E> = Ok<T> | Err<E>;

interface Clock { now(): Date }

const CLAIM_OUTCOME = { CLAIMED: "claimed", ALREADY_CLAIMED: "already_claimed" } as const;
interface ExecutionLedger {
  claim(input: ExecutionClaim): Promise<Result<ClaimOutcome, LedgerError>>;
}
```

**`ALREADY_CLAIMED` is a success value, not an error.** `ON CONFLICT DO NOTHING` returning zero rows is the invariant working as designed; modelling it as `Err` would invite ANS-03 to retry it.

### D6 — Drizzle schema and the shape of the critical index

Tables exactly as ANS-00 §4.4, one file per table under `packages/adapters/src/persistence/schema/`, re-exported by a barrel that drizzle-kit reads.

| Table | Key columns | DB-level constraints |
|---|---|---|
| `connected_accounts` | `platform`, `external_id`, `handle`, `token_ciphertext`, `token_expires_at`, `scopes` | UNIQUE `(platform, external_id)`; `CHECK (token_ciphertext ~ '^v[0-9]+\.')` |
| `content_items` | `platform`, `external_id`, `account_id`, `type`, `permalink`, `caption`, `published_at` | UNIQUE `(platform, external_id)`; FK `account_id` |
| `metric_snapshots` | `content_item_id`, `captured_at`, `views`, `likes`, `comments`, `shares`, `saves`, `reach` | UNIQUE `(content_item_id, captured_at)` |
| `account_snapshots` | `account_id`, `captured_at`, `followers`, `following`, `total_views` | UNIQUE `(account_id, captured_at)` |
| `comments` | `platform`, `external_id`, `content_item_id`, `author_external_id`, `text`, `raw jsonb` | UNIQUE `(platform, external_id)` |
| `flows` | `account_id`, `name`, `status`, `scope`, `schema_version`, `graph jsonb`, `updated_at` | `status` enum `draft\|active` |
| `flow_executions` | `flow_id`, `comment_id`, `status`, `current_node_id`, `attempts`, `error` | **UNIQUE `(comment_id)`** |
| `webhook_events` | `raw jsonb`, `dedupe_key`, `signature_ok`, `received_at`, `processed_at` | **UNIQUE `(dedupe_key)`** |
| `conversations` | `account_id`, `platform`, `external_thread_id`, `participant_external_id`, `last_message_at` | UNIQUE `(platform, external_thread_id)` |
| `messages` | `conversation_id`, `external_id`, `direction`, `text`, `sent_at`, `raw jsonb` | UNIQUE `(conversation_id, external_id)` |

**`flow_executions.comment_id` is UNIQUE alone, never composite with `flow_id`.** A `(flow_id, comment_id)` index would let two flows each claim the same comment and burn the one private reply Meta ever grants. The constraint models the platform rule, not the application's row shape.

Other decisions: `uuid` PKs defaulting to `gen_random_uuid()` (rejected `bigserial` — leaks volume/ordering; rejected external ids as PK — unique only per platform). `timestamptz` everywhere, never `timestamp`. A `platform` pgEnum with all four values including YouTube/TikTok — the values cost nothing now and save a migration in ANS-06. `webhook_events.raw` is `NOT NULL` and written before any parsing, per §4.4 decision 1. `token_ciphertext` stores a self-describing envelope `v1.<iv>.<tag>.<ct>` (base64) so key rotation is a version prefix, not a migration; the CHECK constraint makes committing plaintext structurally impossible. ANS-01 ships the column and the `TokenVault` port only — no crypto implementation, no credential (ANS-02).

### D7 — Migration idempotency lives in the journal, not in the SQL

| Option | Tradeoff | Decision |
|---|---|---|
| `drizzle-kit generate` → committed SQL + `meta/_journal.json`, applied by programmatic `migrate()` | Drizzle's `__drizzle_migrations` ledger table makes re-running a no-op **in the database**; history is versioned and reviewable | **Chosen** |
| `drizzle-kit push` | Diffs live schema, no versioned history, not reproducible from zero | Rejected |
| Hand-written `CREATE TABLE IF NOT EXISTS` | Idempotent per statement, but cannot express `ALTER` and drifts silently | Rejected |

`packages/adapters/src/persistence/migrate.ts` reads `DATABASE_URL`, applies pending migrations in a transaction, exits `0` when the journal is already satisfied. This is the mechanism behind AC-7 and AC-9 — same rule as the UNIQUE index: **the database decides, not the script.**

### D8 — Contracts: `schema_version` selects the validator, and the column is typed `unknown`

Layout: `packages/contracts/src/flow-graph/{node-types.ts, nodes/*.ts, edge.ts, graph.ts, versions.ts}` (Zod 4).

```ts
const FLOW_NODE_TYPE = {
  TRIGGER_COMMENT: "trigger.comment",
  ACTION_SEND_DM: "action.send_dm",
  ACTION_PUBLIC_REPLY: "action.public_reply",
} as const;

const flowNodeV1Schema = z.discriminatedUnion("type", [triggerCommentNode, sendDmNode, publicReplyNode]);
const flowGraphV1Schema = z.object({ nodes: z.array(flowNodeV1Schema).min(1), edges: z.array(edgeSchema) })
  .refine(uniqueNodeIds).refine(edgesReferenceExistingNodes).refine(exactlyOneTrigger);

const FLOW_GRAPH_SCHEMAS = { 1: flowGraphV1Schema } as const;   // schema_version → validator
```

Adding a node type is one entry in the union; adding a version is one entry in the registry. **Neither requires an `ALTER TABLE`** — the spec's third `flows.graph` scenario.

Core cannot import Zod (D4), so `packages/core` declares the domain `FlowGraph` types as plain TypeScript and `packages/contracts` carries a compile-time assertion that `z.infer<typeof flowGraphV1Schema>` is assignable to it. Contracts → core is a legal direction; the assertion breaks the build if the two ever drift.

**How neither edge can be skipped:** the Drizzle column is declared `jsonb().$type<unknown>()`, *not* `$type<FlowGraph>()`. Typing it as the domain type would be a lie the compiler happily accepts. Typed `unknown`, TypeScript refuses to hand the value to any caller expecting a graph until it passes the registry. `flows` is reachable only through `DrizzleFlowRepository`, the single module exported from `@answerya/adapters/persistence` that touches the table.

```
write                                    read
─────                                    ────
caller                                   caller
  │ FlowGraph                              ▲ Result<FlowGraph, InvalidGraph>
  ▼                                        │
DrizzleFlowRepository.save()             DrizzleFlowRepository.findById()
  │ FLOW_GRAPH_SCHEMAS[current].parse()    │ FLOW_GRAPH_SCHEMAS[row.schema_version]
  │   ✗ → reject before SQL                │   ✗ unknown version → err(UNSUPPORTED_VERSION)
  ▼                                        │   ✗ invalid doc     → err(INVALID_GRAPH)
Postgres  flows.graph jsonb  ─── unknown ──┘
```

Scope note: this repository is the one place ANS-01 ships executable logic. It is an adapter, not a use case — no graph traversal, no engine. The `persistence-schema` spec requires write- and read-side rejection to be testable now.

### D9 — Compose topology and the two-DSN gotcha

| Service | Image / build | Healthcheck | `depends_on` |
|---|---|---|---|
| `postgres` | `postgres:17-alpine`, volume `answerya_pgdata` | `pg_isready -U $POSTGRES_USER -d $POSTGRES_DB`, 5s/3s/10, `start_period 5s` | — |
| `redis` | `redis:7-alpine --appendonly yes`, volume `answerya_redisdata` | `redis-cli ping` | — |
| `web` | `apps/web/Dockerfile` multi-stage | `GET /api/health` | both `service_healthy` |
| `worker` | `apps/worker/Dockerfile` multi-stage | `GET :$WORKER_HEALTH_PORT/health` | both `service_healthy` |

The worker gets a **minimal `node:http` liveness server** (zero dependencies) rather than a `pgrep` healthcheck: `pgrep` proves a process exists, not that it functions, and the endpoint is where ANS-08 metrics will land. Redis keeps AOF and a volume — dedup no longer depends on it (D6), but queued jobs do.

```
docker compose up -d
   ├─ postgres ──── starting ──→ pg_isready ok ──→ healthy ─┐
   ├─ redis ─────── starting ──→ PING PONG ────→ healthy ─┤
   │                                                       ├─→ web    (created → running)
   └───────────────── gate: condition service_healthy ─────┴─→ worker (created → running)
                        a failing gate leaves both unstarted
```

`.env.example` contract: `POSTGRES_USER|PASSWORD|DB|PORT`, `DATABASE_URL`, `REDIS_URL`, `TOKEN_ENCRYPTION_KEY` (placeholder), `NODE_ENV`, `WEB_PORT`, `WORKER_HEALTH_PORT`, `TEST_DATABASE_URL`. Placeholder values only; no Meta variable appears (ANS-02).

**Gotcha to document in `CONTRIBUTING.md`:** `pnpm db:migrate` runs on the host, so `.env`'s `DATABASE_URL` must target `localhost:${POSTGRES_PORT}`, while Compose overrides it per-service with the internal host `postgres:5432`. AC-7 and AC-9 both run migrate from the host; a single container-facing DSN would break them. `packages/contracts/src/env.ts` parses env with Zod at boot so a missing variable fails immediately with a named field.

### D10 — Testing topology and a deterministic WSL2 fallback

Vitest 3 root config using `test.projects`:

| Project | Setup | Infra |
|---|---|---|
| `core` | none | **none** — no `globalSetup`, Vitest in `devDependencies` only |
| `contracts` | none | none |
| `adapters:unit` | none | none |
| `adapters:integration` | `globalSetup` | Postgres |

Isolating integration into its own project is what makes AC-6 structural: `pnpm --filter @answerya/core test` never loads the Testcontainers `globalSetup`, so Docker being stopped is irrelevant.

`globalSetup` starts a `PostgreSqlContainer` on `postgres:17-alpine` (same tag as Compose), runs `migrate()` against it, and publishes the DSN via `provide()`. Suites `TRUNCATE ... RESTART IDENTITY CASCADE` in `beforeEach`.

**Fallback:** attempt Testcontainers first; on a Docker-socket failure, if `TEST_DATABASE_URL` is set, log a warning and use it; if unset, fail with a message naming the variable and pointing at `CONTRIBUTING.md`. Rejected: falling back on the variable's mere presence (would silently mask a genuine Docker outage in CI) and catching-and-continuing without a variable (nondeterministic).

The flagship test asserts three things, not one: (1) `INSERT ... ON CONFLICT (comment_id) DO NOTHING` for a duplicate returns `rowCount === 0` and raises nothing; (2) exactly one row remains; (3) `pg_indexes` still reports a unique index on `flow_executions(comment_id)`. Assertion (3) is what makes it a regression guard — without it, deleting the index would make the test pass by accident on a single-threaded run.

### D11 — PR slicing: the pre-approved two-way split is revised to four

The proposal's PR#1 (monorepo + Compose + CI + commitlint) estimates ~735 authored lines on its own — 1.8× the budget. Revised to four chained slices on `feat/ans-01-foundations`, each mapping 1:1 to a capability spec.

| PR | Scope | Est. authored lines | Verification | Risk |
|---|---|---|---|---|
| #1 `workspace-foundation` | pnpm-workspace, root package.json, turbo.json, tsconfig.base, ESLint flat config incl. core zones, Prettier, commitlint + husky, `.gitignore`, CI workflow, `CONTRIBUTING.md`, empty `packages/ui` | ~330 | `pnpm lint`, `pnpm typecheck` (AC-3, AC-4) | Low |
| #2 `local-environment` | `docker-compose.yml`, two Dockerfiles, `.dockerignore`, `.env.example`, `apps/web` liveness + `/api/health`, `apps/worker` liveness, `contracts/env.ts` | ~350 | AC-1, AC-2, AC-10 | Medium |
| #3 `domain-core` | `packages/core` (7 ports, `Result`, `Clock`, barrels), Vitest root projects config, core unit tests, ESLint-rule test + fixture | ~330 | AC-6, AC-8 | Low |
| #4 `persistence-schema` + `testing-harness` | contracts flow-graph Zod + registry, Drizzle schema (10 tables), migration 0000, `migrate.ts`, `DrizzleFlowRepository`, Testcontainers `globalSetup`, UNIQUE idempotency test | ~390 | AC-5, AC-7, AC-9 | **High** |

Each targets the previous slice's branch; #1 targets the stage branch. `pnpm-lock.yaml` and the drizzle-generated `0000_*.sql` / `_journal.json` are tool output — excluded from the authored budget, present in the diff.

`Decision needed before apply: No` (chained slices already resolve it) · `Chained PRs recommended: Yes` · `400-line budget risk: High` for PR#4 only.

**Contingency for PR#4**: if it measures over 400 authored lines at apply time, split at the contracts/Drizzle seam — #4a contracts flow-graph schemas + core `FlowGraph` types, #4b Drizzle schema + migration + repository + integration tests.

PR#1 note: `pnpm test` on a workspace with no test files must pass — Vitest runs with `--passWithNoTests` until PR#3 lands.

## File Changes

| Path | Action | Description |
|---|---|---|
| `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `package.json` | Create | Workspace + task graph (D1–D3) |
| `eslint.config.js`, `.prettierrc`, `commitlint.config.js`, `.husky/commit-msg` | Create | Boundary + convention enforcement (D4) |
| `.github/workflows/ci.yml`, `CONTRIBUTING.md`, `.gitignore` | Create | CI lint→typecheck→test fail-fast; branch/PR/DSN conventions |
| `docker-compose.yml`, `apps/{web,worker}/Dockerfile`, `.dockerignore`, `.env.example` | Create | Local environment (D9) |
| `apps/web/**`, `apps/worker/**` | Create | Liveness only |
| `packages/core/src/{engagement,analytics,identity,shared}/**` | Create | Ports + primitives (D5) |
| `packages/core/src/__fixtures__/adapter-import.fixture.ts` | Create | Fixture inside the zone `target`, lint-ignored and tsc-excluded, proving both boundary rules fire (D4) |
| `packages/contracts/src/{env.ts,flow-graph/**}` | Create | Zod env + graph registry (D8) |
| `packages/adapters/src/persistence/{schema/**,migrations/**,migrate.ts,flow-repository.ts}` | Create | Drizzle model, migration 0000, validating repository (D6–D8) |
| `packages/ui/package.json` | Create | Empty placeholder (ANS-04) |
| `vitest.config.ts`, `packages/*/vitest.config.ts` | Create | Projects incl. isolated integration (D10) |
| `openspec/config.yaml` | Modify | `rules.verify.test_command`/`build_command`, `rules.apply.tdd` once Vitest lands |

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit (core) | `Result` variants, `Clock` substitution, port type-level compilation | Vitest, no setup, Docker stopped (AC-6) |
| Unit (contracts) | Each v1 node type, discriminated-union rejection of unknown `type`, graph refinements, unknown `schema_version` → `err` | Zod `safeParse` assertions |
| Unit (lint guard) | ESLint reports on the adapter-import fixture | Programmatic `ESLint().lintFiles` (D4) |
| Integration | Migration applies to an empty DB; **duplicate `comment_id` no-op + index still present**; `dedupe_key` duplicate rejected; invalid graph rejected on write; stored graph re-validated on read | Testcontainers Postgres 17, `TEST_DATABASE_URL` fallback (D10) |
| E2E | — | Out of scope; Playwright arrives with UI (ANS-04/ANS-07) |

## Threat Matrix

| Boundary | Applicability | Reason |
|---|---|---|
| Documentation-like paths | N/A | ANS-01 classifies no file as executable; no manifest is interpreted from untrusted input |
| Git repository selection | N/A | No git automation ships; no `git -C` or cwd-derived repository selection |
| Commit state | N/A | commitlint validates a message string; it never stages, indexes, or commits |
| Push state | N/A | The CI workflow is triggered by pushes; it originates none |
| PR commands | N/A | No PR automation, no composed shell command from variable input |

Non-matrix security boundaries this design does address: `.env.example` carries placeholder values only (AC-10); `token_ciphertext` is CHECK-constrained to an encrypted envelope so plaintext cannot be persisted; no Meta credential, secret, or external endpoint exists in this stage.

## Migration / Rollout

First migration on an empty database — no data migration. Rollback per the proposal, now per-slice across four PRs: revert a slice's merge commit and every earlier slice stays usable. Environment reset is `docker compose down -v`; schema reset is drop-and-re-migrate, which AC-9 already exercises as an acceptance criterion.

## Open Questions

- [ ] `conversations` / `messages` are specified in ANS-00 §4.4 only as "inbox threads". The columns in D6 are a minimal provisional shape; the real one lands when ANS-02 sees actual Meta message payloads. Accepted per the proposal's "do not over-design" risk entry — migrations are versioned from day 1.
- [ ] Testcontainers under WSL2 is the stage's only unproven technical assumption. `sdd-tasks` MUST schedule that check as the first task of PR#4, since it gates the slice; the D10 fallback is the mitigation, not the plan.
