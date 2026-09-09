# ── Stage 1: Build TypeScript ──
FROM node:20-alpine AS builder
WORKDIR /app

# Install all dependencies (including TypeScript & build tools)
COPY package*.json ./
RUN npm ci

# Copy configuration and TypeScript sources
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript to JavaScript (/app/dist)
RUN npm run build

# ── Stage 2: Production Runner ──
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies and clean cache
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JavaScript output from builder stage
COPY --from=builder /app/dist ./dist

# Run as non-root user for security
USER node

EXPOSE 4000

CMD ["node", "dist/server.js"]
