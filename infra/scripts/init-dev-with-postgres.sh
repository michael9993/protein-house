#!/bin/bash
# Enhanced init script that includes Stripe app PostgreSQL setup

set -e

INFRA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$INFRA_DIR"

echo "🚀 Initializing development environment with PostgreSQL for Stripe app..."

# Start services
echo "📦 Starting Docker services..."
docker compose -f docker-compose.dev.yml up -d postgres redis

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
until docker compose -f docker-compose.dev.yml exec -T postgres pg_isready -U saleor > /dev/null 2>&1; do
    echo "   PostgreSQL is not ready yet, waiting..."
    sleep 2
done
echo "✅ PostgreSQL is ready"

# Ensure stripe_app database exists
echo "🔍 Ensuring stripe_app database exists..."
docker compose -f docker-compose.dev.yml exec -T postgres psql -U saleor -d postgres -c "SELECT 1 FROM pg_database WHERE datname='stripe_app'" | grep -q 1 || \
docker compose -f docker-compose.dev.yml exec -T postgres psql -U saleor -d postgres -c "CREATE DATABASE stripe_app;"
echo "✅ Stripe app database ready"

# Start remaining services
echo "📦 Starting remaining services..."
docker compose -f docker-compose.dev.yml up -d

echo ""
echo "✅ Development environment initialized!"
echo ""
echo "Next steps:"
echo "1. Run Stripe app schema migration:"
echo "   docker compose -f docker-compose.dev.yml exec saleor-stripe-app-dev sh -c 'cd /app/apps/stripe && pnpm setup-postgres'"
echo ""
echo "Or use the PowerShell script:"
echo "   .\scripts\setup-stripe-postgres.ps1"
echo ""
