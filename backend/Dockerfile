# ==============================================================================
# HireLens Backend - Production Dockerfile
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools for native dependencies
RUN apk add --no-cache openssl python3 make g++

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code and configuration
COPY tsconfig.json ./
COPY src ./src

# Generate Prisma Client & compile TypeScript to dist/
RUN npx prisma generate
RUN npm run build

# Prune dev dependencies for lean production image
RUN npm prune --production

# ------------------------------------------------------------------------------
# Production Runner Image
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3001

# Copy production node_modules and built dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

# Start production server
CMD ["node", "dist/app.js"]
