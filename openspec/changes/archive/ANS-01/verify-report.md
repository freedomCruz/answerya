# Verify Report: ANS-01 — Foundations

> Verified 2026-08-31 against the merged tracker branch `feat/ans-01-foundations` (26 commits over `main`).
> Every command below was executed by the verifier, not reported by an implementing agent.

## Verdict: PASS

66 of 66 tasks complete. All ten acceptance criteria from the proposal pass. Five capability specs closed.

## Acceptance criteria

| # | Criterion | Result |
|---|---|---|
| AC-1 | `docker compose up -d` → all services healthy under 60s | **PASS** — 4/4 healthy in **12s** |
| AC-2 | `pnpm install && pnpm build` → exit 0 | **PASS** |
| AC-3 | `pnpm lint` → exit 0 | **PASS** |
| AC-4 | `pnpm typecheck` → exit 0 | **PASS** |
| AC-5 | `pnpm test` → exit 0, UNIQUE INDEX test green | **PASS** — 5 tasks successful, `flow-executions.integration.test.ts` green |
| AC-6 | `pnpm --filter @answerya/core test` → exit 0 with Docker not running | **PASS by equivalence** — see deviations |
| AC-7 | `pnpm db:migrate` twice → exit 0 both times | **PASS** |
| AC-8 | No adapter imports in `packages/core/src` | **PASS** — 0 excluding fixtures, 1 including (non-vacuous) |
| AC-9 | `down -v && up -d && db:migrate` → exit 0 from scratch | **PASS** — 10 tables recreated from an empty volume |
| AC-10 | `.env.example` reveals no real secret | **PASS** — placeholders only |

## Capability specs

| Spec | Closed by | Status |
|---|---|---|
| `workspace-foundation` | PR#1 | Closed |
| `local-environment` | PR#2 | Closed |
| `domain-core` | PR#1 (stub), PR#3 | Closed |
| `persistence-schema` | PR#1 (stub), PR#4 | Closed |
| `testing-harness` | PR#1 (runner), PR#3, PR#4 | Closed |

## The critical invariant

`flow_executions.comment_id` is `UNIQUE` **alone**, never composite with `flow_id`. Confirmed in the generated migration as `CONSTRAINT "flow_executions_comment_id_unique" UNIQUE("comment_id")`, and confirmed live via `pg_indexes` after a from-scratch migration.

Idempotency is enforced by the database through `INSERT ... ON CONFLICT DO NOTHING`. No idempotency logic exists in application code — verified by inspection of `DrizzleFlowRepository`, which validates the graph document on both edges and does nothing else.

The flagship test carries all three required assertions: the second insert is a silent no-op (`rowCount` 0), exactly one row remains, and `pg_indexes` still reports the unique index. The third assertion prevents the test passing by accident if the constraint were dropped.

## Deviations from spec, each deliberate and recorded

**AC-6 — passed by equivalence, not literally.** The criterion requires Docker stopped. This environment is WSL2 + Docker Desktop: `docker` is a shim at `/mnt/wsl/docker-desktop/cli-tools/`, there is no `docker.service` in systemd, and the daemon runs in a Windows-side VM. Stopping it requires quitting Docker Desktop, which would cut Docker machine-wide. Verified by four equivalent or stricter means: zero infrastructure imports in core, no `dependencies` key at all, the suite passing with `DOCKER_HOST` pointed at a nonexistent socket, and the structural argument that core could not compile against an infrastructure client since the purity guard forbids it. Writing acceptance criteria that depend on stopping a daemon is fragile across Docker Desktop, Colima, and Podman; prefer a poisoned `DOCKER_HOST`.

**AC-8 — the original grep pattern was a false pass.** The spec read `grep -r "from '@answerya/adapters" packages/core/src | wc -l` → 0. The specifier is single-quoted, but this project's Prettier config sets `singleQuote: false`, so no import in the codebase can ever match it. Run against a tree containing a fixture that imports `@answerya/adapters` twice on purpose, the original pattern returned 0 — reporting success while a file violated the boundary. The criterion also could not coexist with the fixture the `testing-harness` spec requires inside `packages/core/src`. Amended to a quote-agnostic pattern excluding `__fixtures__`, plus the inverse assertion that the same grep without the exclusion returns non-zero.

**PR slicing — two slices became four.** The proposal pre-approved a two-PR split. Design D11 revised it to four after estimating the original PR#1 at ~735 lines, 1.8x the review budget. The proposal's Rollback Plan and `openspec/config.yaml`'s task rule still describe the two-PR shape and should be reconciled at archive.

## Defects found during verification, not by the implementing agents

Four guards in this stage reported green while not actually checking anything. All four shared the same shape: the tool returns "no problems" both when there are none and when it is looking at nothing.

1. **`basePath` unpinned** — `import-x/no-restricted-paths` resolves zones against `process.cwd()`; Turborepo runs lint per package, so the zone matched nothing.
2. **No TS-aware resolver** — `nodenext`-style `.js` specifiers could not resolve, and the rule silently skips what it cannot resolve.
3. **AC-8's quote mismatch** — described above.
4. **Root `test` bypassed the task graph** — the script invoked `vitest` directly, so `turbo.json`'s `test dependsOn ^build` never applied. The adapters integration suite imports `@answerya/core`, whose exports map points at `dist/`, so it passed only on a warm tree. **CI passed for the same accidental reason**: the workflow runs lint → typecheck → test, and typecheck had already emitted declarations. Fixed by routing root `test` through `turbo run test`.

Verification rule adopted: delete every `dist/` and the turbo cache before trusting a green suite.

## Review budget

All four slices overran their estimate: +35%, +24%, +91%, +150% (976 authored lines against ~390 for PR#4). The estimates were produced during design, before any code existed. For ANS-02, prefer slicing by verifiable seam over estimating line counts.

## Blocked, and why it does not affect this verdict

`gentle-ai sdd-status` reports `blocked(maintainer_decision)`. The native attempt ledger is frozen on PR#1's attempt, recorded `outcome: passed` with `changed_lines: 3042` against a 400 budget — a count that includes `pnpm-lock.yaml`, which design D11 explicitly excludes from the review budget. Receipt-driven review was subsequently disabled for this repository (`--scope clone`) at the user's direction, but the stale objective remains and blocks the native dispatcher.

This is orphaned accounting from a disabled layer, not a defect in the change. Delivery for this repository follows ordinary policy: CI green on every PR, `main` protected with required PR and linear history, and every diff reviewed before merge.

## Next

`sdd-archive` — merge delta specs into `openspec/specs/`, move the change to `openspec/changes/archive/`, set the ADR to accepted and the PRD to approved, then open the tracker → `main` pull request.
