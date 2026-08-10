FROM node:22-bookworm-slim AS dependencies

WORKDIR /app
COPY package.json package-lock.json ./
# npm 11 validates optional WASI packages against the Windows-generated lockfile
# even when they are not installable on this Linux target. `npm install` keeps
# the pinned lockfile graph while reconciling those platform-only entries.
RUN npm install --no-audit --no-fund

FROM dependencies AS build

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app ./

EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD ["node", "scripts/docker-healthcheck.mjs"]

CMD ["sh", "-c", "npm run db:bootstrap && npm run db:demo && exec node scripts/production-server.mjs"]
