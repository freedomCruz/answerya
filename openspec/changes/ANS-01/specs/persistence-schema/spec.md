# Persistence Schema Specification

## Purpose

Define the Drizzle schema for the ANS-00 §4.4 core model, and the two database-level uniqueness invariants that guarantee correctness: `flow_executions.comment_id` UNIQUE (the product's highest-severity invariant) and `webhook_events.dedupe_key` UNIQUE. Also define `flows.graph` as a versioned, Zod-validated jsonb document. This stage creates tables only — no business logic.

## Requirements

### Requirement: Core Data Model

The system MUST implement the ANS-00 §4.4 core model as Drizzle schema definitions, delivered through a first versioned migration.

#### Scenario: Schema matches the approved model

- GIVEN `packages/adapters/persistence/schema` defines the ANS-00 §4.4 tables
- WHEN the first migration is generated
- THEN it MUST create every table declared in that model

### Requirement: `flow_executions.comment_id` UNIQUE Invariant (CRITICAL)

The system MUST enforce, at the database schema level, a UNIQUE constraint on `flow_executions.comment_id`. This is the product's single highest-severity invariant: Meta allows exactly ONE private reply per comment, forever. Idempotency MUST be guaranteed by the database — via `INSERT ... ON CONFLICT DO NOTHING` against this UNIQUE constraint — and MUST NOT be re-implemented, duplicated, or relied upon solely in application logic.

#### Scenario: A duplicate comment_id insert is silently rejected

- GIVEN `flow_executions.comment_id` has a UNIQUE index and one row already exists for a given `comment_id`
- WHEN a second `INSERT ... ON CONFLICT DO NOTHING` targeting the same `comment_id` is executed
- THEN no second row is inserted, no error is raised, and exactly one row for that `comment_id` remains (Traces: AC-5)

#### Scenario: The UNIQUE index exists before any row can be written

- GIVEN the first migration runs against an empty database
- WHEN it completes
- THEN `flow_executions.comment_id` MUST already carry the UNIQUE index

### Requirement: `webhook_events.dedupe_key` UNIQUE Invariant

The system MUST enforce, at the database schema level, a UNIQUE constraint on `webhook_events.dedupe_key`, preventing duplicate webhook processing.

#### Scenario: A duplicate dedupe_key insert is rejected

- GIVEN `webhook_events.dedupe_key` has a UNIQUE index and one row already exists for a given key
- WHEN a second insert targeting the same `dedupe_key` is executed
- THEN the database MUST reject or no-op the second insert, leaving exactly one row for that key

### Requirement: `flows.graph` Versioned JSONB Document Model

`flows.graph` MUST be stored as an owned `jsonb` document — not normalized rows, not a serialized canvas-library blob — accompanied by a `schema_version` column. Its content MUST be validated against per-node-type Zod schemas defined in `packages/contracts`, on BOTH write and read.

#### Scenario: Writing an invalid graph is rejected

- GIVEN a `flows.graph` payload contains a node of an unknown or malformed type
- WHEN the write path validates it against the per-node-type Zod schema
- THEN the write MUST be rejected before reaching the database

#### Scenario: Reading re-validates the stored graph

- GIVEN a `flows.graph` document is persisted
- WHEN it is read back
- THEN it MUST be re-validated against the Zod schema for its `schema_version` before being returned to any caller

#### Scenario: New node types need no migration

- GIVEN `schema_version` decouples graph shape from table structure
- WHEN a later stage (ANS-05) adds a new node type
- THEN it MUST be addable via a new Zod schema and `schema_version` bump, without an ALTER TABLE migration

### Requirement: Idempotent Migrations

`pnpm db:migrate` MUST be safe to run repeatedly. Running it a second time against an already-migrated database MUST exit `0` without error.

#### Scenario: Running the migration twice

- GIVEN a freshly migrated database
- WHEN a contributor runs `pnpm db:migrate && pnpm db:migrate`
- THEN both invocations exit `0` (Traces: AC-7)

#### Scenario: Migrating from a destroyed environment

- GIVEN all Docker volumes have been destroyed
- WHEN a contributor runs `docker compose down -v && docker compose up -d && pnpm db:migrate`
- THEN the schema is rebuilt from zero and the command exits `0` (Traces: AC-9)
