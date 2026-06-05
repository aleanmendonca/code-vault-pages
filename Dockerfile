FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for argon2
RUN apk add --no-cache python3 make g++ openssl

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source
COPY . .

# Build the app
RUN npm run build

# ─── Production image ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime dependencies for argon2 native binding
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=3000

# Copy built app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create uploads directory
RUN mkdir -p /app/uploads/covers /app/uploads/zips

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/server.js"]