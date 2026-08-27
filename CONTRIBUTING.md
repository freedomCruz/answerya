# Contributing to answerya

This repository follows Spec-Driven Development (SDD). Every change starts as an
`openspec/changes/ANS-<NN>` proposal before any code lands.

## Branch Naming

One git branch per stage: `feat/ans-<NN>-<slug>`, e.g. `feat/ans-01-foundations`.

A stage is delivered as a chain of smaller pull requests when the change is large
enough to risk reviewer overload. Slice branches follow
`feat/ans-<NN>-pr<M>-<slug>`, e.g. `feat/ans-01-pr1-workspace-foundation`, and
target the stage's tracker branch rather than `main` directly. Only the tracker
branch merges to `main`.

A stage does not start until the previous stage is merged to `main` and archived.

## PR Workflow

1. Open the PR against its base branch (the stage tracker branch for a slice,
   or `main` for a tracker itself once every slice has merged).
2. Keep each PR focused on one deliverable work unit — see the change's
   `tasks.md` for the reviewed slice boundaries.
3. CI (`.github/workflows/ci.yml`) runs `lint` → `typecheck` → `test`,
   sequentially and fail-fast. All three must be green before merge.
4. Squash or rebase-merge; keep `main` linear.

## Commit Conventions

Commits MUST follow [Conventional Commits](https://www.conventionalcommits.org/),
enforced by commitlint (`commitlint.config.js`) via a Husky `commit-msg` hook.

Format: `<type>(<scope>): <description>`

Common types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `ci`.

Example: `feat(workspace): add turborepo task graph`

## Local Development

```bash
pnpm install     # resolve every workspace package
pnpm lint        # ESLint + Prettier across all packages
pnpm typecheck   # tsc --noEmit across all packages
pnpm build       # build every buildable package
pnpm test        # run the Vitest suite
```

## Architecture Boundaries

`packages/core` is pure domain: it MUST NOT import `packages/adapters`,
`packages/contracts`, `zod`, `drizzle-orm`, or any `node:*` builtin. This is
enforced at three layers (pnpm resolution, TypeScript project references,
ESLint) — see `openspec/changes/ANS-01/design.md` (D4) for the full rationale.
