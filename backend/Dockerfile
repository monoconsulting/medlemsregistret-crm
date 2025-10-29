# syntax=docker/dockerfile:1.6

# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# Copy backend package manifests
COPY backend/package.json backend/package-lock.json ./backend/
WORKDIR /app/backend

# Install dependencies (with dev deps for build tooling)
RUN npm ci

# Copy backend source
COPY backend/ ./

# Build TypeScript -> dist/
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine AS runtime
WORKDIR /app/backend

ENV NODE_ENV=production

# Copy package manifest for prod install
COPY --from=build /app/backend/package.json ./
COPY --from=build /app/backend/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy compiled application
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma

EXPOSE 4040

CMD ["node", "dist/server.js"]
