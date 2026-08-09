# Multi-stage Dockerfile for @ak/payroll-api
FROM node:20-alpine AS base
RUN apk add --no-cache openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="/pnpm:${PATH}"
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
RUN pnpm --filter @ak/payroll-api deploy --prod /prod/payroll

WORKDIR /prod/payroll/node_modules/@ak/shared
RUN PRISMA_GENERATE_SKIP_AUTOINSTALL=true \
    /repo/systems/shared/node_modules/.bin/prisma generate \
    --schema=src/db/prisma/schema.prisma
RUN rm /prod/payroll/node_modules/.pnpm/node_modules/@ak/payroll-api

FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl wget
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /prod/payroll/package.json ./package.json
COPY --from=build /prod/payroll/node_modules ./node_modules
COPY --from=build /prod/payroll/dist ./dist

EXPOSE 3001
USER node
CMD ["node", "dist/server.js"]
