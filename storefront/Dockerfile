FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile --prefer-offline

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

ENV NEXT_OUTPUT=standalone
ARG NEXT_PUBLIC_SALEOR_API_URL
ENV NEXT_PUBLIC_SALEOR_API_URL=${NEXT_PUBLIC_SALEOR_API_URL}
ARG NEXT_PUBLIC_STOREFRONT_URL
ENV NEXT_PUBLIC_STOREFRONT_URL=${NEXT_PUBLIC_STOREFRONT_URL}
ARG NEXT_PUBLIC_DEFAULT_CHANNEL
ENV NEXT_PUBLIC_DEFAULT_CHANNEL=${NEXT_PUBLIC_DEFAULT_CHANNEL}

# Storefront Control config generation
# These args are optional - if not provided, the script will use defaults or fail gracefully
# Prioritize tunnel URLs for build-time fetching (needed when building outside Docker network)
ARG STOREFRONT_CONTROL_APP_TUNNEL_URL
ARG STOREFRONT_CONTROL_APP_URL
ARG STOREFRONT_CONTROL_URL
ARG STOREFRONT_CONTROL_APP_INTERNAL_URL
ARG SALEOR_API_URL
ARG STOREFRONT_CHANNELS
ENV STOREFRONT_CONTROL_APP_TUNNEL_URL=${STOREFRONT_CONTROL_APP_TUNNEL_URL}
ENV STOREFRONT_CONTROL_APP_URL=${STOREFRONT_CONTROL_APP_URL}
ENV STOREFRONT_CONTROL_URL=${STOREFRONT_CONTROL_URL}
ENV STOREFRONT_CONTROL_APP_INTERNAL_URL=${STOREFRONT_CONTROL_APP_INTERNAL_URL}
ENV SALEOR_API_URL=${SALEOR_API_URL}
ENV STOREFRONT_CHANNELS=${STOREFRONT_CHANNELS}

# Get PNPM version from package.json
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Generate fallback config file before building (if script exists and env vars are set)
# This is optional - if it fails, the build continues and will use defaults
# The script generates the file in the project root, so we copy it to the storefront directory
# Tunnel URLs are prioritized for build-time fetching (needed when building outside Docker network)
RUN if [ -f "../scripts/fetch-storefront-config.ts" ] && [ -n "${SALEOR_API_URL}" ]; then \
      echo "🔍 Generating storefront config fallback file (using tunnel URL if available)..." && \
      cd .. && \
      (STOREFRONT_CONTROL_APP_TUNNEL_URL="${STOREFRONT_CONTROL_APP_TUNNEL_URL}" \
       STOREFRONT_CONTROL_APP_URL="${STOREFRONT_CONTROL_APP_URL}" \
       STOREFRONT_CONTROL_URL="${STOREFRONT_CONTROL_URL}" \
       STOREFRONT_CONTROL_APP_INTERNAL_URL="${STOREFRONT_CONTROL_APP_INTERNAL_URL}" \
       SALEOR_API_URL="${SALEOR_API_URL}" \
       STOREFRONT_CHANNELS="${STOREFRONT_CHANNELS}" \
       node scripts/fetch-storefront-config.ts && \
       if [ -f "storefront-cms-config.json" ]; then \
         cp storefront-cms-config.json storefront/storefront-cms-config.json && \
         echo "✅ Config file generated and copied to storefront directory"; \
       fi) || echo "⚠️  Config generation failed, continuing with defaults"; \
    else \
      echo "ℹ️  Skipping config generation (script not found or SALEOR_API_URL not set)"; \
    fi

RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

ARG NEXT_PUBLIC_SALEOR_API_URL
ENV NEXT_PUBLIC_SALEOR_API_URL=${NEXT_PUBLIC_SALEOR_API_URL}
ARG NEXT_PUBLIC_STOREFRONT_URL
ENV NEXT_PUBLIC_STOREFRONT_URL=${NEXT_PUBLIC_STOREFRONT_URL}

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy fallback config file if it exists (generated during build in builder stage)
# Use RUN with mount to conditionally copy the file
RUN --mount=from=builder,source=/app,target=/tmp/builder \
    if [ -f /tmp/builder/storefront-cms-config.json ]; then \
      cp /tmp/builder/storefront-cms-config.json ./storefront-cms-config.json && \
      chown nextjs:nodejs ./storefront-cms-config.json && \
      echo "✅ Copied fallback config file"; \
    else \
      echo "ℹ️  No fallback config file found, will use defaults"; \
    fi

USER nextjs


CMD ["node", "server.js"]
