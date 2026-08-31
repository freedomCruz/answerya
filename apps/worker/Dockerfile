# syntax=docker/dockerfile:1
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /repo

# ---- deps: install the full workspace so Turborepo can resolve internal
# package references, then build only what @answerya/worker needs.
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/adapters/package.json packages/adapters/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile

# ---- build: compile @answerya/worker and its workspace dependencies.
FROM deps AS build
COPY . .
RUN pnpm --filter @answerya/worker... build

# ---- runtime: minimal image with only production deps and build output.
FROM node:24-alpine AS runtime
RUN corepack enable
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=build /repo/pnpm-workspace.yaml /repo/pnpm-lock.yaml /repo/package.json ./
COPY --from=build /repo/apps/worker/package.json apps/worker/package.json
COPY --from=build /repo/packages/contracts/package.json packages/contracts/package.json
COPY --from=build /repo/packages/adapters/package.json packages/adapters/package.json
RUN pnpm install --frozen-lockfile --prod --ignore-scripts --filter @answerya/worker...
COPY --from=build /repo/apps/worker/dist apps/worker/dist
COPY --from=build /repo/packages/contracts/dist packages/contracts/dist
COPY --from=build /repo/packages/adapters/dist packages/adapters/dist

EXPOSE 3001
CMD ["node", "apps/worker/dist/index.js"]
