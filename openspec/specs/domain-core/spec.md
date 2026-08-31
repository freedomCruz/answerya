# Domain Core Specification

> Established by change **ANS-01 — Foundations**, archived 2026-08-31.
> Verified: all ten acceptance criteria PASS. See `openspec/changes/archive/ANS-01/verify-report.md`.

## Purpose

Materialise the hexagonal boundary from `ADR_Answerya_Hexagonal_Worker_Split` structurally: `packages/core` is pure domain, has zero runtime dependencies, declares ports only, and is mechanically prevented from importing `packages/adapters`. No port implementation and no business use case ships in this stage.

## Requirements

### Requirement: Zero Runtime Dependencies

`packages/core`'s `package.json` MUST declare zero entries under `dependencies`. Any dependency needed for build or test tooling MUST live under `devDependencies` only.

#### Scenario: Core package has no runtime dependencies

- GIVEN `packages/core/package.json`
- WHEN its `dependencies` field is inspected
- THEN it MUST be empty or absent

#### Scenario: Core tests run without infrastructure

- GIVEN `packages/core` has zero runtime dependencies and no adapter imports
- WHEN a contributor runs `pnpm --filter @answerya/core test` with Docker stopped
- THEN the command exits `0` (Traces: AC-6)

### Requirement: Port Declarations Without Implementation

`packages/core` MUST declare exactly seven ports as TypeScript interfaces, with no concrete implementation: `CommentSource`, `PrivateReplySender`, `PublicReplier`, `ExecutionLedger`, `FlowRepository`, `MetricSource`, `TokenVault`.

#### Scenario: Ports compile with no adapter dependency

- GIVEN all seven port interfaces are declared under `packages/core/src`
- WHEN `pnpm typecheck` runs
- THEN every port interface compiles without referencing any concrete implementation

#### Scenario: ExecutionLedger port is usable without infrastructure

- GIVEN the `ExecutionLedger` port declares its contract only (no implementation)
- WHEN a later stage (ANS-03) implements a use case against this port
- THEN the use case MUST be expressible and typecheckable without any adapter or database import

### Requirement: Shared Domain Primitives

`packages/core` MUST define a `Result<T, E>` type for representing success/failure without throwing, and a `Clock` abstraction for time access, so domain logic never calls `Date` or throws control-flow exceptions directly.

#### Scenario: Result models failure without throwing

- GIVEN a domain function returns `Result<T, E>`
- WHEN the operation fails
- THEN the function MUST return an error variant instead of throwing

#### Scenario: Clock abstracts time access

- GIVEN domain logic needs the current time
- WHEN it is implemented
- THEN it MUST depend on the `Clock` abstraction, not on `Date` directly

### Requirement: Enforced Core-to-Adapters Import Ban

An ESLint rule MUST forbid any import from `packages/adapters` inside `packages/core/src`, enforced both locally (`pnpm lint`) and in CI.

#### Scenario: Lint rejects an adapter import from core

- GIVEN the ESLint boundary rule is active
- WHEN a file under `packages/core/src` imports from `@answerya/adapters`
- THEN `pnpm lint` MUST fail

#### Scenario: No adapter imports exist in core

- GIVEN the current state of `packages/core/src`
- WHEN a reviewer runs `grep -rE "from ['\"]@answerya/adapters" packages/core/src --exclude-dir=__fixtures__ | wc -l`
- THEN the result MUST be `0` (Traces: AC-8)
- AND running the same command WITHOUT `--exclude-dir=__fixtures__` MUST return a non-zero count, proving the check is not vacuous

> **Amended during PR#3.** The original scenario read `grep -r "from '@answerya/adapters" ...` with a
> single-quoted specifier and no fixture exclusion. Both halves were defective. First, this project's
> Prettier config sets `singleQuote: false`, so no import in the codebase ever matches a single-quoted
> pattern — the criterion returned `0` even with a file actively violating the boundary, which is a
> false pass, not a proof. Second, the boundary fixture required by `testing-harness` must live inside
> `packages/core/src` and must contain the very import this criterion forbids; the fixture cannot prove
> the guard fires without committing the violation. The amended form excludes the fixture directory and
> adds the inverse assertion, so the criterion fails loudly if the fixture is ever deleted or renamed.
