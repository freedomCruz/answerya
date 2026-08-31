# Archive Report: ANS-01 — Foundations

> Archived 2026-08-31. Stage closed after `sdd-verify` returned PASS on all ten acceptance criteria.

## Outcome

66 of 66 tasks complete across four chained pull requests, all merged into the stage tracker
`feat/ans-01-foundations` and verified independently.

| PR | Slice | Merged |
|---|---|---|
| [#1](https://github.com/freedomCruz/answerya/pull/1) | `workspace-foundation` | 2026-08-31 |
| [#2](https://github.com/freedomCruz/answerya/pull/2) | `local-environment` | 2026-08-31 |
| [#3](https://github.com/freedomCruz/answerya/pull/3) | `domain-core` | 2026-08-31 |
| [#4](https://github.com/freedomCruz/answerya/pull/4) | `persistence-schema` + `testing-harness` | 2026-08-31 |

## Specs promoted

Five capability specs moved from the change folder into `openspec/specs/`, which was previously
empty. This is a purely additive merge — no existing requirement was modified or removed, so the
config's "warn before merging destructive deltas" rule had nothing to flag.

- `workspace-foundation`, `local-environment`, `domain-core`, `persistence-schema`, `testing-harness`

## Reconciliation of superseded plans

The proposal's Rollback Plan and `openspec/config.yaml`'s task rule both described a two-PR split
(infrastructure, then domain plus persistence). Design decision D11 replaced it with four chained
slices after estimating the original PR#1 at ~735 authored lines, 1.8x the review budget. Both
documents are corrected at archive so the historical record matches what shipped.

## What this stage leaves behind

- A monorepo where the hexagonal boundary is enforced by three mechanisms that fail a command, not
  by convention: pnpm strict resolution, `composite` + `rootDir`, and two ESLint rules with a
  regression test that asserts both fire.
- A database schema for all ten ANS-00 §4.4 tables, with `flow_executions.comment_id` UNIQUE alone
  and idempotency living in Postgres via `INSERT ... ON CONFLICT DO NOTHING` — never in application
  code.
- `flows.graph` as a versioned jsonb document typed `unknown`, so the compiler refuses to hand it to
  any caller until it passes the `schema_version` validator registry.
- A working Testcontainers integration layer, proven on this machine at 4.7s container startup, with
  a documented Compose fallback that was never needed.
- CI running lint, typecheck and test on every push and pull request.

## Carried forward to ANS-02

- The tracker has not yet merged to `main`. That pull request is the final step and requires explicit
  approval.
- Estimating changed lines before code exists proved unreliable: all four slices overran by +35%,
  +24%, +91% and +150%. Prefer slicing by verifiable seam.
- The native `sdd-attempt` ledger remains frozen on PR#1's objective, which counted `pnpm-lock.yaml`
  against the review budget. Receipt-driven review is disabled for this clone; the stale objective is
  orphaned accounting, not a defect.
- `conversations` and `messages` carry a deliberately minimal provisional shape. Their real columns
  land when ANS-02 sees actual Meta payloads.
- Meta app setup is done and verified: Instagram App ID `3133033193560776`, IG User ID
  `28245347428418847`, `account_type: BUSINESS`, using the Instagram Login variant. Webhook
  configuration is blocked on ANS-02 code, not on manual work.

## Obsidian

- [[PRD_ANS01_Foundations]] → `approved`
- [[ADR_Answerya_Hexagonal_Worker_Split]] → `accepted`
- [[PR_1_Workspace_Foundation]] … [[PR_4_Persistence_And_Testing]] → `merged`
- [[PRD_ANS02_Meta_Ingestion]] → `draft`, next stage
