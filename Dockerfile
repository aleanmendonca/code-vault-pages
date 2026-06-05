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

# Install production-only dependencies for native modules (e.g. @node-rs/argon2)
# marked as external by vite.config.ts. These can't be bundled, so they must be
# present at runtime. We use `npm install --omit=dev` to keep the image small.
RUN npm install --omit=dev --no-audit --no-fund --loglevel=error

# Create uploads directory
RUN mkdir -p /app/uploads/covers /app/uploads/zips

EXPOSE 3000

# Start the Nitro server
CMD ["node", ".output/server/index.mjs"]