# syntax=docker/dockerfile:1

# Build context is the repo root (this is a pnpm workspace), e.g.:
#   docker build -f api/Dockerfile .

FROM node:24.18.0-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.13.0 --activate
WORKDIR /app

# Only package.json files are copied here, so this layer is cached until a
# dependency actually changes, regardless of source edits.
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY api/package.json ./api/package.json
COPY web/package.json ./web/package.json
RUN pnpm install --filter @todo/api... --frozen-lockfile

FROM base AS runtime
ENV NODE_ENV=production
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/api/node_modules ./api/node_modules
COPY api ./api

WORKDIR /app/api
EXPOSE 3000
CMD ["node_modules/.bin/tsx", "src/index.ts"]
