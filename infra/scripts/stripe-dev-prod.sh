#!/bin/sh
# Dev production mode for Stripe app - runs Next.js dev server with production-like optimizations
# but skips static generation to avoid Html import errors

set -e

cd /app/apps/stripe

# Set environment variables to prevent static generation
export NEXT_PRIVATE_SKIP_STATIC_GENERATION=true
export SKIP_ENV_VALIDATION=true

# Run Next.js dev server with production-like settings
# Using NODE_ENV=development but with optimizations enabled
exec pnpm dev
