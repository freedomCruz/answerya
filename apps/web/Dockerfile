# syntax=docker/dockerfile:1
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /repo

# ---- deps: install the full workspace so Turborepo can resolve internal
# package references, then build only what @answerya/web needs.
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/adapters/package.json packages/adapters/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile

# ---- build: compile @answerya/web and its workspace dependencies.
FROM deps AS build
COPY . .
RUN pnpm --filter @answerya/web... build

# ---- runtime: Next.js standalone output only.
FROM node:24-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production
# Next.js standalone server.js binds to $HOSTNAME:$PORT; Docker sets
# HOSTNAME to the container id by default, which the server would then try
# to bind to instead of all interfaces. Force it to listen on every
# interface so the Compose healthcheck (and host port mapping) can reach it.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static apps/web/.next/static
COPY --from=build /repo/apps/web/public apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
