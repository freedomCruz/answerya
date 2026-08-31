# Testing Harness Specification

## Purpose

Establish Vitest across the workspace, guarantee `packages/core` tests run with zero infrastructure, and provide a Testcontainers-backed integration layer whose flagship test proves the `flow_executions.comment_id` UNIQUE invariant is enforced by the database, not by application code.

## Requirements

### Requirement: Vitest Workspace Setup

The system MUST configure Vitest at the workspace root with per-package test projects wired into the Turborepo `test` pipeline.

#### Scenario: Running all tests

- GIVEN every package defines a Vitest project
- WHEN a contributor runs `pnpm test`
- THEN all test suites run and the command exits `0` (Traces: AC-5)

### Requirement: Infrastructure-Free Core Tests

Tests under `packages/core` MUST run without any Docker, database, or network dependency.

#### Scenario: Core tests pass with Docker stopped

- GIVEN `packages/core` has zero runtime dependencies and no adapter imports
- WHEN a contributor stops Docker and runs `pnpm --filter @answerya/core test`
- THEN the command exits `0` (Traces: AC-6)

### Requirement: Testcontainers Integration Layer

Persistence integration tests MUST provision an ephemeral Postgres instance via Testcontainers. A documented fallback to the Compose `postgres` service via a test `DATABASE_URL` MUST exist for environments where the Docker socket is unreachable from Testcontainers (e.g., WSL2).

#### Scenario: Integration tests run against a Testcontainers Postgres

- GIVEN the integration suite starts a Testcontainers Postgres instance
- WHEN migrations are applied to it
- THEN the suite runs its assertions against that ephemeral database

#### Scenario: Fallback path when the Docker socket is unavailable

- GIVEN Testcontainers cannot reach the Docker socket
- WHEN the integration suite starts
- THEN it MUST fall back to the documented Compose Postgres service via a test `DATABASE_URL`, rather than failing outright

### Requirement: UNIQUE Index Idempotency Test (CRITICAL)

The integration suite MUST include a test that inserts two `flow_executions` rows for the same `comment_id` and asserts the second insert is rejected at the database layer, proving the `INSERT ... ON CONFLICT DO NOTHING` invariant on `flow_executions.comment_id`. This test MUST run as part of `pnpm test` and MUST be green for the suite to pass.

#### Scenario: Second insert for a duplicate comment_id is a no-op

- GIVEN one `flow_executions` row already exists for a `comment_id`
- WHEN the test performs a second `INSERT ... ON CONFLICT DO NOTHING` for the same `comment_id`
- THEN exactly one row exists afterward, no application-level duplicate check ran, and no error is raised (Traces: AC-5)

#### Scenario: The test fails if the UNIQUE constraint is removed

- GIVEN a future schema change removes the UNIQUE index on `flow_executions.comment_id`
- WHEN this test runs
- THEN it MUST fail, acting as a regression guard for the product's highest-severity invariant
