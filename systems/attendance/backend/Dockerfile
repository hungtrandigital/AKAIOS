# Multi-stage Dockerfile for @ak/attendance-api
# Builds shared package first, then attendance backend.

FROM node:20-alpine AS base
RUN apk add --no-cache openssl
ENV PNPM_HOME="/pnpm" PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

# Stage 1: Install all workspace deps (cached if package.json unchanged)
FROM base AS deps
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY systems ./systems
# Copy package.json files first for better caching
RUN find systems -name "package.json" -not -path "*/node_modules/*" | xargs -I {} echo {} && \
    pnpm install --frozen-lockfile || pnpm install

# Stage 2: Build shared package + backends
FROM deps AS build
RUN pnpm --filter @ak/shared build
RUN pnpm --filter @ak/attendance-api build

# Stage 3: Production runtime — minimal image
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts + production node_modules
COPY --from=build /repo/systems/attendance/backend/dist ./dist
COPY --from=build /repo/systems/attendance/backend/package.json ./
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/systems/shared/package.json ./node_modules/@ak/shared/package.json
COPY --from=build /repo/systems/shared/dist ./node_modules/@ak/shared/dist

# Health check uses wget (already in alpine)
RUN apk add --no-cache wget

EXPOSE 3000
USER node
CMD ["node", "dist/server.js"]
