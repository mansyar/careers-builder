# Stage 1: Build stage
FROM node:22-slim AS build

WORKDIR /app

# Disable pnpm supply-chain minimum release age policy (packages published very recently)
ENV PNPM_CONFIG_MINIMUM_RELEASE_AGE=0

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml ./

# Install ALL dependencies (including dev dependencies)
RUN pnpm install --frozen-lockfile

# Copy source code and config files
COPY . .

# Build the application
RUN pnpm run build

# Stage 2: Production stage
FROM node:22-slim

WORKDIR /app

# Disable pnpm supply-chain minimum release age policy
ENV PNPM_CONFIG_MINIMUM_RELEASE_AGE=0

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install Playwright Chromium browser for PDF generation and scraping
RUN npx playwright install chromium --with-deps

# Install wget for Docker health check
RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/*

# Copy production dependencies from build stage
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy built application from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

# Expose web UI port
EXPOSE 3000

# Create volume mount point for persistent data
RUN mkdir -p /app/data

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Run the application
CMD ["node", "dist/server/server.js"]
