#!/bin/bash
# Script to fix PostgreSQL connection pool exhaustion
# This recreates the postgres container with increased max_connections

set -e

echo "🔧 Fixing PostgreSQL connection pool configuration..."
echo ""

# Stop and remove the postgres container
echo "📦 Stopping and removing existing postgres container..."
docker-compose -f docker-compose.dev.yml stop postgres
docker-compose -f docker-compose.dev.yml rm -f postgres

# Recreate the postgres container with new settings
echo "🔄 Recreating postgres container with max_connections=200..."
docker-compose -f docker-compose.dev.yml up -d postgres

# Wait for postgres to be healthy
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout=60
counter=0
while ! docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U saleor > /dev/null 2>&1; do
  sleep 1
  counter=$((counter + 1))
  if [ $counter -ge $timeout ]; then
    echo "❌ Timeout waiting for PostgreSQL to be ready"
    exit 1
  fi
done

echo "✅ PostgreSQL is ready!"
echo ""
echo "📊 Verifying max_connections setting..."
docker-compose -f docker-compose.dev.yml exec -T postgres psql -U saleor -d saleor -c "SHOW max_connections;"

echo ""
echo "✅ Done! PostgreSQL now supports up to 200 connections."
echo "💡 Make sure DB_CONN_MAX_AGE=60 is set in your infra/.env file for connection pooling."
