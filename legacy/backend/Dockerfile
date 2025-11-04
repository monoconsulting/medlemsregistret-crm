# syntax=docker/dockerfile:1.6

# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app/backend

# Copy manifests first to leverage Docker layer caching
COPY backend/package.json backend/package-lock.json ./

# Install dependencies (including dev dependencies for build & Prisma CLI)
RUN npm ci

# Copy backend source code and configuration
COPY backend/tsconfig.json ./tsconfig.json
COPY backend/prisma ./prisma
COPY backend/src ./src
COPY backend/.env.production.backend ./

# Generate Prisma client and compile TypeScript
RUN npm run prisma:generate
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine AS runtime
WORKDIR /app/backend

ENV NODE_ENV=production \
    BACKEND_ENV_FILE=/app/backend/.env.production.backend

# Copy package manifests and install production dependencies only
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled application and Prisma artifacts from build stage
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/backend/.env.production.backend ./

EXPOSE 4040

CMD ["node", "dist/server.cjs"]
