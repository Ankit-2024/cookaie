# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  Cookaie — Multi-Stage Production Dockerfile                               ║
# ║  Target: Cloud-agnostic (Cloud Run, ECS, Azure Container Apps, Local)      ║
# ║  Stack: Next.js 16 (App Router), Prisma 7, node:20-alpine                  ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies deterministically based on package-lock.json
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# ─── Stage 2: Builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client (v7) for database access
RUN npx prisma generate

# Build Next.js standalone application bundle
RUN npm run build

# ─── Stage 3: Runner ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Create dedicated non-root user and group
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and public directory
COPY --from=builder /app/public ./public

# Prepare .next directory with correct user permissions
RUN mkdir .next && chown nextjs:nodejs .next

# Copy minimal standalone build output and static bundles
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
