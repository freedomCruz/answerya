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

## Local Environment (Docker Compose)

```bash
cp .env.example .env   # fill in local-only values
docker compose up -d   # postgres, redis, web, worker — healthy in <60s
```

### The two-DSN gotcha

`DATABASE_URL` means a different host depending on where the process runs:

- **Host-run commands** (e.g. `pnpm db:migrate` run directly on your machine)
  need `DATABASE_URL` pointing at `localhost:${POSTGRES_PORT}` — this is the
  value `.env.example` ships.
- **Compose services** (`web`, `worker`) get `DATABASE_URL` overridden in
  `docker-compose.yml` to the internal Docker network hostname
  `postgres:5432`, because `localhost` inside a container refers to the
  container itself, not the `postgres` service.

This bites everyone once: if a host command can't reach Postgres, check
whether `.env`'s `DATABASE_URL` still says `localhost`, not `postgres`.

### Opt-in tunnel profile

`cloudflared` is not part of the default `docker compose up -d` stack. Start
it explicitly when you need a public HTTPS callback URL (e.g. to verify a
Meta webhook):

```bash
docker compose --profile tunnel up -d
```

The free-tier `trycloudflare.com` URL changes on every restart — check the
`cloudflared` container logs for the new URL, and re-register it with the
Meta app dashboard each time the tunnel restarts.
