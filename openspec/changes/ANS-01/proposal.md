# Proposal: ANS-01 — Foundations

> PRD: `Answerya/01_Product/PRDs/PRD_ANS01_Foundations.md` (umbrella: `PRD_ANS00_Answerya_Platform`).
> ADRs: `ADR_Answerya_Hexagonal_Worker_Split`, `ADR_Answerya_Frontend_Design_And_Flow_Canvas`.

## Intent

Greenfield repository, no source code. ANS-02..ANS-06 must land on a real hexagonal structure, not folders refactored mid-ANS-03. Otherwise webhook ingestion and the flow engine couple to the framework and the database, and the product's highest-severity requirement — Meta allows exactly ONE private reply per comment, forever — becomes untestable in isolation. ANS-01 ships a skeleton that boots, migrates and tests. No product behaviour.

## Scope

### In Scope
- Monorepo: pnpm workspaces + Turborepo, TS strict + `noUncheckedIndexedAccess`, shared `tsconfig.base.json`, ESLint + Prettier.
- Docker Compose: `postgres:17-alpine`, `redis:7-alpine`, `web`, `worker`; healthchecks gate app startup; `.env.example` with zero real secrets.
- `packages/core`: `engagement|analytics|identity|shared`, `Result<T,E>`, `Clock`, and seven ports declared without implementation. Zero runtime dependencies; ESLint forbids importing `packages/adapters`.
- `packages/adapters/persistence`: Drizzle schema for the ANS-00 §4.4 core model, `flow_executions.comment_id` UNIQUE, `webhook_events.dedupe_key` UNIQUE, `flows.graph jsonb` + `schema_version`, node-type Zod schemas in `packages/contracts`, first versioned migration, idempotent `pnpm db:migrate`.
- Testing: Vitest workspace-wide, Testcontainers Postgres, DB-level idempotency integration test.
- CI (`lint`/`typecheck`/`test`), commitlint, `CONTRIBUTING.md`.

### Out of Scope
- Meta app creation, credentials, any external API call (ANS-02+); `cloudflared` (ANS-02).
- Business use cases and graph traversal logic (ANS-03) — ANS-01 only creates tables.
- Visual language, tokens, Storybook, Base UI primitives (ANS-04); `packages/ui` stays empty.
- Flow canvas and `@xyflow/react` (ANS-05); YouTube/TikTok adapters (ANS-06).
- Any UI beyond a liveness page (ANS-04/ANS-07).

## Capabilities

### New Capabilities
- `workspace-foundation`: monorepo layout, TS strict config, lint/format, CI pipeline, commit conventions.
- `local-environment`: Docker Compose services, healthcheck ordering, environment-variable contract.
- `domain-core`: pure domain package, port declarations, enforced core→adapters import ban.
- `persistence-schema`: Drizzle core-model schema, UNIQUE invariants, `flows.graph` document model, idempotent migrations.
- `testing-harness`: Vitest workspace setup, infrastructure-free core tests, Testcontainers integration layer.

### Modified Capabilities
- None (greenfield; `openspec/specs/` is empty).

## Approach

Materialise `ADR_Answerya_Hexagonal_Worker_Split` structurally before any behaviour exists.

- `packages/core` declares ports only, so ANS-03 can express `ExecutionLedger.claim()` without infrastructure.
- Idempotency lives in Postgres constraints, never application logic — the guarantee is created here, in the schema, next to the test proving the second insert is rejected.
- `flows.graph` persists as an owned `jsonb` document (not normalized rows, not a serialized React Flow blob) with Zod validation on write AND read, so ANS-05 adds node types without a migration.
- Delivery follows the PRD's pre-approved two-PR split (see Rollback Plan) to respect the 400-line review budget.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `package.json` | New | Workspace + pipelines |
| `docker-compose.yml`, `apps/*/Dockerfile`, `.env.example` | New | Local environment |
| `packages/core/**` | New | Pure domain + ports |
| `packages/contracts/**` | New | Zod node-type schemas |
| `packages/adapters/persistence/**` | New | Drizzle schema + migrations |
| `apps/web`, `apps/worker` | New | Liveness only |
| `.github/workflows/**`, `commitlint.config.*`, `CONTRIBUTING.md` | New | CI + conventions |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Scaffolding exceeds the 400-line review budget | High | Pre-split into two chained PRs (below) |
| Testcontainers fails under WSL2 (Docker socket) | Med | Verify on day 1; documented fallback to Compose Postgres via test `DATABASE_URL` |
| `jsonb` enforces nothing at DB level | Med | Zod mandatory on both edges + test rejecting an invalid graph |
| Graph schema too narrow once ANS-05 adds node types | Med | `schema_version` + per-type Zod: adding a type needs no migration |
| Data model shifts against real payloads in ANS-02/03 | Med | Accepted — migrations versioned from day 1; do not over-design now |
| No GitHub remote yet for CI | Low | Commit the workflow anyway; it activates when the remote exists |

## Rollback Plan

Chained PRs on `feat/ans-01-foundations`, each under 400 lines:
- **PR#1 — infrastructure**: monorepo, Docker Compose, CI, commitlint. Targets the stage branch.
- **PR#2 — domain + persistence**: `packages/core`, `packages/contracts`, Drizzle schema + first migration, Vitest/Testcontainers. Targets PR#1's branch.

Revert paths, in escalation order:
1. **Per-slice**: `git revert` PR#2's merge commit; PR#1 infrastructure stays intact and usable.
2. **Full stage**: delete `feat/ans-01-foundations` before merge; `main` is unaffected, nothing else exists yet.
3. **Environment**: `docker compose down -v` destroys all volumes. No production data, no external system contacted, no Meta credential issued — nothing outside this repository to undo.
4. **Database**: this is the FIRST migration, so rollback is dropping the schema and re-running `pnpm db:migrate` from zero — already covered by an acceptance criterion.

## Dependencies

- Docker + Compose reachable on the WSL2 host (Testcontainers needs the Docker socket).
- pnpm and the Node runtime version pinned by ANS-01.
- No external API, credential or Meta app — deferred to ANS-02.
- Gating: ANS-02 does not start until ANS-01 is merged to `main` and archived.

## Success Criteria

The ten executable acceptance criteria from PRD_ANS01 §4:

- [ ] `docker compose up -d` → all services `healthy` in under 60 s
- [ ] `pnpm install && pnpm build` → exit 0
- [ ] `pnpm lint` → exit 0
- [ ] `pnpm typecheck` → exit 0
- [ ] `pnpm test` → exit 0, with the UNIQUE INDEX test green
- [ ] `pnpm --filter @answerya/core test` → exit 0 **with Docker not running**
- [ ] `pnpm db:migrate && pnpm db:migrate` → exit 0 both times
- [ ] `grep -r "from '@answerya/adapters" packages/core/src | wc -l` → `0`
- [ ] `docker compose down -v && docker compose up -d && pnpm db:migrate` → exit 0 from scratch
- [ ] `.env.example` exists and `git grep -i "secret\|token\|password" -- .env.example` reveals no real value
