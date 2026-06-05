FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for argon2 native module
RUN apk add --no-cache python3 make g++ openssl

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies (including dev for build)
# Using npm install (not npm ci) to avoid lock file sync issues
RUN npm install --no-audit --no-fund --loglevel=error

# Copy source
COPY . .

# Build the app (TanStack Start + Nitro generates .output/)
RUN npm run build

# ─── Production image ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache openssl wget

ENV NODE_ENV=production
ENV PORT=3000

# Copy built app from .output/ (Nitro output)
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

# Create uploads directory
RUN mkdir -p /app/uploads/covers /app/uploads/zips

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the Nitro server
CMD ["node", ".output/server/index.mjs"]