# Multi-stage Dockerfile för Next.js 15 CRM Application

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Kopiera package files
COPY crm-app/package*.json ./
COPY crm-app/prisma ./prisma/

# Installera dependencies
RUN npm ci

# Generera Prisma client
RUN npx prisma generate

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Kopiera dependencies från deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY crm-app/ .

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Set dummy DATABASE_URL for build (will be overridden at runtime)
ENV DATABASE_URL="mysql://user:password@localhost:3306/db"
ENV SKIP_ENV_VALIDATION=1

# Build Next.js application
RUN npm run build

# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Kopiera nödvändiga filer
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Kopiera built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start application
CMD ["node", "server.js"]
