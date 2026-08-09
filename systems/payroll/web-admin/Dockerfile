# Multi-stage Dockerfile for @ak/payroll-web-admin (Next.js).

FROM node:20-alpine AS deps
RUN apk add --no-cache openssl
ENV PNPM_HOME="/pnpm"
ENV PATH="/pnpm:${PATH}"
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

# Production runtime: Next's file tracer emits only the server closure.
FROM node:20-alpine AS runtime
RUN apk add --no-cache wget
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3002

COPY --from=build /repo/systems/payroll/web-admin/.next/standalone ./
COPY --from=build /repo/systems/payroll/web-admin/.next/static ./systems/payroll/web-admin/.next/static
COPY --from=build /repo/systems/payroll/web-admin/public ./systems/payroll/web-admin/public

EXPOSE 3002
USER node
WORKDIR /app/systems/payroll/web-admin
CMD ["node", "server.js"]
