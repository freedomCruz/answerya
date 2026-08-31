# Workspace Foundation Specification

> Established by change **ANS-01 — Foundations**, archived 2026-08-31.
> Verified: all ten acceptance criteria PASS. See `openspec/changes/archive/ANS-01/verify-report.md`.

## Purpose

Establish the pnpm + Turborepo monorepo layout, shared TypeScript strict configuration, lint/format tooling, CI pipeline, and commit conventions that every later ANS-0x stage builds on. This spec covers infrastructure only — no product behaviour.

## Requirements

### Requirement: Monorepo Workspace Layout

The system MUST define a pnpm workspace containing `apps/web`, `apps/worker`, `packages/core`, `packages/contracts`, `packages/adapters`, and `packages/ui`, orchestrated by a Turborepo pipeline covering `build`, `lint`, `typecheck`, and `test`.

#### Scenario: Installing resolves every workspace package

- GIVEN `pnpm-workspace.yaml` declares `apps/*` and `packages/*`
- WHEN a contributor runs `pnpm install`
- THEN all workspace packages resolve with exit code `0`

#### Scenario: Building runs the full pipeline

- GIVEN the Turborepo `build` pipeline is configured
- WHEN a contributor runs `pnpm build`
- THEN every buildable package builds and the command exits `0` (Traces: AC-2)

### Requirement: TypeScript Strict Configuration

The system MUST provide a shared `tsconfig.base.json` with `strict: true` and `noUncheckedIndexedAccess: true`, and every package MUST extend it without relaxing those flags.

#### Scenario: Typechecking passes workspace-wide

- GIVEN every package extends `tsconfig.base.json`
- WHEN a contributor runs `pnpm typecheck`
- THEN the command exits `0` across all packages (Traces: AC-4)

#### Scenario: Unchecked index access is rejected

- GIVEN `noUncheckedIndexedAccess` is enabled
- WHEN code reads an array element by index without a bounds check and uses it as non-nullable
- THEN `tsc` MUST report a compile error

### Requirement: Lint and Format Enforcement

The system MUST run ESLint and Prettier across all packages through the Turborepo `lint` pipeline.

#### Scenario: Linting the clean workspace

- GIVEN ESLint and Prettier are configured at the workspace root
- WHEN a contributor runs `pnpm lint`
- THEN the command exits `0` (Traces: AC-3)

#### Scenario: Formatting violations fail lint

- GIVEN a file violates the shared Prettier configuration
- WHEN `pnpm lint` runs
- THEN the command exits non-zero and reports the offending file

### Requirement: CI Pipeline

The system MUST run a CI workflow on push and pull request that executes `lint`, `typecheck`, then `test`, in that order, failing fast on the first non-zero step.

#### Scenario: CI runs on push

- GIVEN a GitHub Actions workflow is committed under `.github/workflows/`
- WHEN a commit is pushed to any branch
- THEN the workflow triggers and runs lint, typecheck, and test sequentially

#### Scenario: CI fails fast

- GIVEN the `lint` step fails
- WHEN the workflow executes
- THEN `typecheck` and `test` MUST NOT run, and the workflow MUST report failure

### Requirement: Commit Conventions

The system MUST enforce Conventional Commits via commitlint and MUST document the contribution workflow in `CONTRIBUTING.md`.

#### Scenario: Non-conventional commit is rejected

- GIVEN commitlint is configured with the conventional-commits ruleset
- WHEN a contributor commits with a message that does not follow the convention
- THEN the commit MUST be rejected by the commit-msg hook

#### Scenario: Contribution guide exists

- GIVEN a new contributor clones the repository
- WHEN they open `CONTRIBUTING.md`
- THEN it MUST document branch naming, PR workflow, and commit conventions
