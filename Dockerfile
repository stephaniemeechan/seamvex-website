# syntax=docker/dockerfile:1

# Seamvex / Seamcor marketing site — Google Cloud Run
# Builds Next.js standalone; branding/ is excluded via .dockerignore

FROM node:20-alpine AS base
# better-sqlite3 native module needs a compiler at install time
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate && \
    pnpm config set node-linker hoisted && \
    pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate && \
    pnpm run check-legal-bundle && pnpm run build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/deploy/legal ./deploy/legal
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080

CMD ["node", "server.js"]
