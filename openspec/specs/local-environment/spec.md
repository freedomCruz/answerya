# Local Environment Specification

> Established by change **ANS-01 — Foundations**, archived 2026-08-31.
> Verified: all ten acceptance criteria PASS. See `openspec/changes/archive/ANS-01/verify-report.md`.

## Purpose

Define the Docker Compose local development topology, healthcheck-gated startup ordering, and the environment-variable contract, so the stack boots deterministically with zero real secrets committed.

## Requirements

### Requirement: Docker Compose Service Topology

The system MUST define `postgres:17-alpine`, `redis:7-alpine`, `web`, and `worker` services in `docker-compose.yml`.

#### Scenario: Starting the full stack

- GIVEN `docker-compose.yml` declares all four services
- WHEN a contributor runs `docker compose up -d`
- THEN all services report `healthy` in under 60 seconds (Traces: AC-1)

### Requirement: Healthcheck-Gated Startup Ordering

Each service MUST declare a healthcheck. The `web` and `worker` services MUST declare `depends_on` with `condition: service_healthy` for `postgres` and `redis`, so they never start against a database or cache that is not ready.

#### Scenario: App services wait for infrastructure

- GIVEN `web` and `worker` depend on `postgres` and `redis` with `service_healthy` conditions
- WHEN `docker compose up -d` runs
- THEN `web` and `worker` MUST NOT enter a running state until `postgres` and `redis` report healthy (Traces: AC-1)

#### Scenario: A failing dependency blocks startup

- GIVEN `postgres` fails its healthcheck
- WHEN Compose evaluates startup order
- THEN `web` and `worker` MUST remain unstarted

### Requirement: Environment Variable Contract

The system MUST ship `.env.example` enumerating every environment variable consumed by Compose services and apps, using placeholder values only. It MUST NOT contain any real secret, token, or password.

#### Scenario: Example file exists with no real secrets

- GIVEN `.env.example` is committed at the repo root
- WHEN a reviewer runs `git grep -i "secret\|token\|password" -- .env.example`
- THEN every match MUST be a placeholder key name, never a real value (Traces: AC-10)

#### Scenario: Local setup from the example file

- GIVEN a contributor copies `.env.example` to `.env`
- WHEN they fill in local-only values
- THEN `docker compose up -d` MUST start successfully using those values

### Requirement: Destructive Reset Reproducibility

The system MUST reproduce a fully working environment from empty volumes: destroying volumes, restarting, and migrating MUST succeed without manual intervention.

#### Scenario: Full reset from scratch

- GIVEN a running stack with existing volumes
- WHEN a contributor runs `docker compose down -v && docker compose up -d && pnpm db:migrate`
- THEN all three commands complete and the final command exits `0` (Traces: AC-9)
