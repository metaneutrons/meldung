# syntax=docker/dockerfile:1
FROM node:24-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS builder
WORKDIR /app
# Pinned explicitly rather than through corepack: from Node 25 on corepack is
# no longer part of the distribution. The version tracks packageManager in
# package.json; both have to move together. Installed in the builder only, so
# the runtime image does not carry a package manager it never uses.
RUN npm install -g pnpm@12.3.4
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# The prepare lifecycle script runs during install and lives here. Without it
# the install aborts before a single dependency is linked.
COPY scripts ./scripts
# --frozen-lockfile fails when the lockfile does not match package.json. That
# is exactly what it is for.
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/meldung.config.yaml ./meldung.config.yaml
COPY --from=builder /app/content ./content
RUN mkdir -p data && chown nextjs:nodejs data
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
