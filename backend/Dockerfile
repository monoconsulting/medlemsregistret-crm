# syntax=docker/dockerfile:1.6

# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app/backend

# Copy manifest files first to leverage Docker layer caching
COPY backend/package.json ./
COPY backend/package-lock.json ./
COPY backend/.env.production.backend ./

# Install all dependencies (including dev deps for the build step)
RUN npm ci

# Copy source code and Prisma schema
COPY backend/tsconfig.json ./
COPY backend/prisma ./prisma
COPY backend/src ./src

# Build the production bundle (tsup -> dist/)
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production \
    BACKEND_ENV_FILE=/app/backend/.env.production.backend

# Copy package manifests and install only production dependencies
COPY backend/package.json ./
COPY backend/package-lock.json ./
COPY backend/.env.production.backend ./
RUN npm ci --omit=dev

# Copy compiled sources and Prisma schema
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma

# Expose backend port
EXPOSE 4040

# Start the server
CMD ["node", "dist/server.js"]
