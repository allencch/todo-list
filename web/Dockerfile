# syntax=docker/dockerfile:1

# Build context is the repo root (this is a pnpm workspace), e.g.:
#   docker build -f web/Dockerfile .

FROM node:24.18.0-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.13.0 --activate
WORKDIR /app

# Only package.json files are copied here, so this layer is cached until a
# dependency actually changes, regardless of source edits.
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY api/package.json ./api/package.json
COPY web/package.json ./web/package.json
RUN pnpm install --filter @todo/web... --frozen-lockfile

FROM deps AS build
COPY web ./web
RUN pnpm --filter @todo/web run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/web/dist /usr/share/nginx/html
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
