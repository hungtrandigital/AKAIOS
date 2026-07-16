# Multi-stage Dockerfile for @ak/payroll-api
FROM node:20-alpine AS base
RUN apk add --no-cache openssl
ENV PNPM_HOME="/pnpm" PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY systems ./systems
RUN pnpm install --frozen-lockfile || pnpm install

FROM deps AS build
RUN pnpm --filter @ak/shared build
RUN pnpm --filter @ak/payroll-api build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /repo/systems/payroll/backend/dist ./dist
COPY --from=build /repo/systems/payroll/backend/package.json ./
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/systems/shared/package.json ./node_modules/@ak/shared/package.json
COPY --from=build /repo/systems/shared/dist ./node_modules/@ak/shared/dist

RUN apk add --no-cache wget
EXPOSE 3001
USER node
CMD ["node", "dist/server.js"]
