# Multi-stage Dockerfile for @ak/attendance-api
# Builds shared package first, then attendance backend.

FROM node:20-alpine AS base
RUN apk add --no-cache openssl
ENV PNPM_HOME="/pnpm" PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

# Stage 1: Install all workspace deps (cached if package.json unchanged)
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY systems ./systems
RUN pnpm install --frozen-lockfile

# Stage 2: Build shared package + backends
FROM deps AS build
RUN pnpm prisma:generate
RUN pnpm --filter @ak/shared build
RUN pnpm --filter @ak/attendance-api build

# Stage 3: Production runtime. Keep the pnpm workspace layout so generated
# Prisma engines and workspace links resolve exactly as they did at build time.
FROM base AS runtime
WORKDIR /repo
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/systems/shared/package.json ./systems/shared/package.json
COPY --from=build /repo/systems/shared/node_modules ./systems/shared/node_modules
COPY --from=build /repo/systems/shared/dist ./systems/shared/dist
COPY --from=build /repo/systems/shared/src ./systems/shared/src
COPY --from=build /repo/systems/attendance/backend/package.json ./systems/attendance/backend/package.json
COPY --from=build /repo/systems/attendance/backend/node_modules ./systems/attendance/backend/node_modules
COPY --from=build /repo/systems/attendance/backend/dist ./systems/attendance/backend/dist

RUN apk add --no-cache wget

EXPOSE 3000
USER node
CMD ["node", "systems/attendance/backend/dist/server.js"]
