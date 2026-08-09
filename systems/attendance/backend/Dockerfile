# Multi-stage Dockerfile for @ak/attendance-api
# Builds shared package first, then attendance backend.

FROM node:20-alpine AS base
RUN apk add --no-cache openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="/pnpm:${PATH}"
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
RUN pnpm --filter @ak/attendance-api deploy --prod /prod/attendance

# Generate Prisma Client inside the isolated production closure. The CLI comes
# from the build workspace only and is not copied into the API runtime image.
WORKDIR /prod/attendance/node_modules/@ak/shared
RUN PRISMA_GENERATE_SKIP_AUTOINSTALL=true \
    /repo/systems/shared/node_modules/.bin/prisma generate \
    --schema=src/db/prisma/schema.prisma
RUN rm /prod/attendance/node_modules/.pnpm/node_modules/@ak/attendance-api

# Compose uses this explicit target for the one-shot migration service. It keeps
# migration tooling out of the long-running API image.
FROM build AS migration
WORKDIR /repo
ENV NODE_ENV=production
USER node

# Stage 3: Production runtime containing only the deployed production closure.
FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl wget
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /prod/attendance/package.json ./package.json
COPY --from=build /prod/attendance/node_modules ./node_modules
COPY --from=build /prod/attendance/dist ./dist

EXPOSE 3000
USER node
CMD ["node", "dist/server.js"]
