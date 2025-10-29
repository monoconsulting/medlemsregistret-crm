# syntax=docker/dockerfile:1.6

# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app/backend

# Copy backend package manifests and install dev dependencies for build
COPY backend/package.json backend/package-lock.json ./
RUN npm ci

# Copy source and config
COPY backend/tsconfig.json ./
COPY backend/prisma ./prisma
COPY backend/src ./src
COPY backend/.env.production.backend ./

# Build TypeScript sources to dist/
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production

# Install production dependencies only
COPY --from=build /app/backend/package.json ./
COPY --from=build /app/backend/package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled application and Prisma schema
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma
COPY --from=build /app/backend/.env.production.backend ./

EXPOSE 4040

CMD ["node", "dist/server.js"]
