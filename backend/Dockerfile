# syntax=docker/dockerfile:1.6

FROM node:20.17-alpine AS build
WORKDIR /app

ENV BACKEND_ENV_FILE=/app/backend/.env.production.backend

# Backend dependencies (include dev deps for the build step)
COPY backend/package.json ./backend/
RUN cd backend && npm install --include=dev

# Copy backend source and configuration
COPY backend/tsconfig.json ./backend/
COPY backend/.env.production.backend ./backend/.env.production.backend
COPY backend/src ./backend/src

# Copy CRM app code needed for shared imports
COPY crm-app/lib ./crm-app/lib
COPY crm-app/server ./crm-app/server
COPY crm-app/prisma ./crm-app/prisma

# Build backend bundle
RUN cd backend && npm run build

FROM node:20.17-alpine
WORKDIR /app

ENV NODE_ENV=production \
    BACKEND_ENV_FILE=/app/backend/.env.production.backend

COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/.env.production.backend ./backend/.env.production.backend
COPY --from=build /app/crm-app ./crm-app

EXPOSE 4040

CMD ["node", "backend/dist/server.cjs"]
