# Multi-stage Dockerfile for @ak/attendance-api
# Builds shared package first, then attendance backend.

FROM node:20-alpine AS base
RUN apk add --no-cache openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

# Stage 1: Install all workspace deps (cached if package.json unchanged)
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY systems ./systems
# Copy package.json files first for better caching
RUN find systems -name "package.json" -not -path "*/node_modules/*" | xargs -I {} echo {} && \
    pnpm install --frozen-lockfile || pnpm install

# Stage 2: Build shared package + backends
FROM deps AS build
RUN pnpm --filter @ak/shared prisma:generate
RUN pnpm --filter @ak/shared build
RUN pnpm --filter @ak/attendance-api build

# Stage 3: Production runtime — minimal image
FROM node:20-alpine AS runtime
WORKDIR /repo/systems/attendance/backend
ENV NODE_ENV=production

# Preserve the pnpm workspace layout so package symlinks resolve correctly.
COPY --from=build /repo/node_modules /repo/node_modules
COPY --from=build /repo/systems/attendance/backend/node_modules ./node_modules
COPY --from=build /repo/systems/attendance/backend/dist ./dist
COPY --from=build /repo/systems/attendance/backend/package.json ./
COPY --from=build /repo/systems/shared/package.json /repo/systems/shared/package.json
COPY --from=build /repo/systems/shared/node_modules /repo/systems/shared/node_modules
COPY --from=build /repo/systems/shared/dist /repo/systems/shared/dist

# Health check uses wget (already in alpine)
RUN apk add --no-cache openssl wget

EXPOSE 3000
USER node
CMD ["node", "dist/server.js"]
