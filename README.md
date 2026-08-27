# Answerya

Self-hosted comment-to-DM automation and multi-platform social analytics.

Replaces the ManyChat "comment X and I'll DM you the link" workflow with an owned
implementation on top of the Meta Private Replies API, including a visual flow builder,
plus a unified dashboard for Instagram, Facebook, YouTube and TikTok performance data.

## Platform capabilities

Verified against official platform documentation. These constraints are hard limits,
not implementation gaps.

| Platform | Read comments | Realtime webhook | DM the commenter | Public reply | Own metrics |
|---|---|---|---|---|---|
| Instagram (professional) | yes | yes (`comments`) | yes — **once per comment**, 7-day window | yes | yes (Insights) |
| Facebook Page | yes | yes (`feed`) | yes (Messenger via `comment_id`) | yes | yes (Insights) |
| YouTube | polling only | no | no such feature | yes (`comments.insert`) | yes (Data + Analytics API) |
| TikTok | no | no | no | no | yes (Display API, polling) |

TikTok exposes no public comments API. Comment-to-DM automation is not possible there
by any supported means; TikTok is an analytics source only.

## Architecture

Hexagonal, single-tenant. `packages/core` holds pure domain logic and defines ports;
`packages/adapters` implements them. The domain never imports an adapter, so use cases
are testable without Postgres, Redis or network access.

```
apps/web       Next.js 15 dashboard, flow builder and webhook receiver
apps/worker    BullMQ consumers and schedulers
packages/core  domain: engagement, analytics, identity, shared
packages/adapters  meta, youtube, tiktok, persistence
packages/contracts  Zod schemas shared across apps
packages/ui    design system on Base UI primitives
```

Automation flows are stored as a domain-owned document (`flows.graph` jsonb, validated per
node type with Zod and versioned via `schema_version`), never as a serialized blob of the
canvas library. The execution engine runs in the worker without React; the canvas is only an
editor over that document. Execution records stay relational — `flow_executions.comment_id`
carries a UNIQUE index, the constraint that guarantees one DM per comment.

Front-end stack: Base UI v1 primitives with a project-specific visual language (no
generated shadcn/ui theme), `@xyflow/react` for the flow canvas, Recharts for analytics.

## Status

Pre-implementation. Product requirements are tracked as PRDs; each stage ships on its
own branch and merges to `main` after verification.

## Development workflow

Stages run sequentially, one branch each (`feat/ans-<NN>-<slug>`), following the SDD
cycle: propose, design, spec, tasks, apply, verify, archive. A stage does not start
until the previous one is merged and archived.
