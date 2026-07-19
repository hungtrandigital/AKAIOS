# Multi-stage Dockerfile for @ak/payroll-web-admin (Next.js).

FROM node:20-alpine AS deps
RUN apk add --no-cache openssl
ENV PNPM_HOME="/pnpm" PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

# Copy manifests only (cache layer)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY systems/payroll/web-admin/package.json ./systems/payroll/web-admin/
COPY systems/shared/package.json ./systems/shared/

# Install with cache mount
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --filter @ak/payroll-web-admin... --frozen-lockfile

# Build
FROM deps AS build
WORKDIR /repo/systems/payroll/web-admin
ARG ATTENDANCE_API_URL=http://localhost:3000
ARG PAYROLL_API_URL=http://localhost:3001
ENV ATTENDANCE_API_URL=$ATTENDANCE_API_URL
ENV PAYROLL_API_URL=$PAYROLL_API_URL
COPY systems/payroll/web-admin ./
COPY systems/shared ./../../shared
RUN pnpm build

# Production runtime
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy standalone output + shared
COPY --from=build /repo/systems/payroll/web-admin/.next ./.next
COPY --from=build /repo/systems/payroll/web-admin/public ./public
COPY --from=build /repo/systems/payroll/web-admin/package.json ./
COPY --from=build /repo/systems/payroll/web-admin/next.config.js ./
COPY --from=build /repo/node_modules ./node_modules

RUN apk add --no-cache wget
EXPOSE 3002
USER node
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3002", "-H", "0.0.0.0"]
