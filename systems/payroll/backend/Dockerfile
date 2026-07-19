# Multi-stage Dockerfile for @ak/payroll-api
FROM node:20-alpine AS base
RUN apk add --no-cache openssl
ENV PNPM_HOME="/pnpm" PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY systems ./systems
RUN pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm prisma:generate
RUN pnpm --filter @ak/shared build
RUN pnpm --filter @ak/payroll-api build

FROM base AS runtime
WORKDIR /repo
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/systems/shared/package.json ./systems/shared/package.json
COPY --from=build /repo/systems/shared/node_modules ./systems/shared/node_modules
COPY --from=build /repo/systems/shared/dist ./systems/shared/dist
COPY --from=build /repo/systems/payroll/backend/package.json ./systems/payroll/backend/package.json
COPY --from=build /repo/systems/payroll/backend/node_modules ./systems/payroll/backend/node_modules
COPY --from=build /repo/systems/payroll/backend/dist ./systems/payroll/backend/dist

RUN apk add --no-cache wget
EXPOSE 3001
USER node
CMD ["node", "systems/payroll/backend/dist/server.js"]
