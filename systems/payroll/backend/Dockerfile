# Multi-stage Dockerfile for @ak/payroll-api
FROM node:20-alpine AS base
RUN apk add --no-cache openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY systems ./systems
RUN pnpm install --frozen-lockfile || pnpm install

FROM deps AS build
RUN pnpm --filter @ak/shared prisma:generate
RUN pnpm --filter @ak/shared build
RUN pnpm --filter @ak/payroll-api build

FROM node:20-alpine AS runtime
WORKDIR /repo/systems/payroll/backend
ENV NODE_ENV=production

COPY --from=build /repo/node_modules /repo/node_modules
COPY --from=build /repo/systems/payroll/backend/node_modules ./node_modules
COPY --from=build /repo/systems/payroll/backend/dist ./dist
COPY --from=build /repo/systems/payroll/backend/package.json ./
COPY --from=build /repo/systems/shared/package.json /repo/systems/shared/package.json
COPY --from=build /repo/systems/shared/node_modules /repo/systems/shared/node_modules
COPY --from=build /repo/systems/shared/dist /repo/systems/shared/dist

RUN apk add --no-cache openssl wget
EXPOSE 3001
USER node
CMD ["node", "dist/server.js"]
