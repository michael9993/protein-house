#!/bin/bash

# Saleor Development Environment Initialization Script
# This script helps set up the development environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$INFRA_DIR")"

echo "🚀 Saleor Development Environment Setup"
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Generate SECRET_KEY if .env doesn't exist
ENV_FILE="$INFRA_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp "$INFRA_DIR/.env.example" "$ENV_FILE"
    
    # Generate SECRET_KEY
    echo "🔑 Generating SECRET_KEY..."
    if command -v python3 &> /dev/null; then
        SECRET_KEY=$(python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
    elif command -v python &> /dev/null; then
        SECRET_KEY=$(python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
    else
        echo "⚠️  Python not found. Please generate SECRET_KEY manually."
        echo "   Run: python -c \"from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())\""
        SECRET_KEY="changeme-in-production-generate-secure-key"
    fi
    
    # Replace SECRET_KEY in .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" "$ENV_FILE"
    else
        # Linux
        sed -i "s/SECRET_KEY=.*/SECRET_KEY=$SECRET_KEY/" "$ENV_FILE"
    fi
    
    echo "✅ .env file created with generated SECRET_KEY"
else
    echo "ℹ️  .env file already exists, skipping creation"
fi

echo ""

# Check if services are already running
if docker compose -f "$INFRA_DIR/docker-compose.dev.yml" ps | grep -q "Up"; then
    echo "ℹ️  Services are already running"
    echo ""
    read -p "Do you want to restart services? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Restarting services..."
        docker compose -f "$INFRA_DIR/docker-compose.dev.yml" down
        docker compose -f "$INFRA_DIR/docker-compose.dev.yml" up -d
    fi
else
    echo "🚀 Starting Docker services..."
    docker compose -f "$INFRA_DIR/docker-compose.dev.yml" up -d
fi

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until docker compose -f "$INFRA_DIR/docker-compose.dev.yml" exec -T postgres pg_isready -U saleor > /dev/null 2>&1; do
    echo "   PostgreSQL is not ready yet, waiting..."
    sleep 2
done
echo "✅ PostgreSQL is ready"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis..."
until docker compose -f "$INFRA_DIR/docker-compose.dev.yml" exec -T redis redis-cli ping > /dev/null 2>&1; do
    echo "   Redis is not ready yet, waiting..."
    sleep 2
done
echo "✅ Redis is ready"

echo ""
echo "📊 Service Status:"
docker compose -f "$INFRA_DIR/docker-compose.dev.yml" ps

echo ""
echo "🔧 Running database migrations..."
docker compose -f "$INFRA_DIR/docker-compose.dev.yml" exec -T saleor-api python manage.py migrate

# Setup Stripe app PostgreSQL database and schema
echo ""
echo "🔧 Setting up Stripe app PostgreSQL database..."
# Ensure stripe_app database exists
docker compose -f "$INFRA_DIR/docker-compose.dev.yml" exec -T postgres psql -U saleor -d postgres -c "SELECT 1 FROM pg_database WHERE datname='stripe_app'" | grep -q 1 || \
docker compose -f "$INFRA_DIR/docker-compose.dev.yml" exec -T postgres psql -U saleor -d postgres -c "CREATE DATABASE stripe_app;" 2>&1 | grep -v "already exists" || true

# Run Stripe app schema migration if container is running
if docker compose -f "$INFRA_DIR/docker-compose.dev.yml" ps saleor-stripe-app-dev | grep -q "Up"; then
    echo "📋 Running Stripe app database schema migration..."
    docker compose -f "$INFRA_DIR/docker-compose.dev.yml" exec saleor-stripe-app-dev sh -c "cd /app/apps/stripe && pnpm setup-postgres" 2>&1 || echo "⚠️  Stripe app schema migration will run when container starts"
else
    echo "ℹ️  Stripe app container not running. Schema will be created when you start it."
    echo "   Run: docker compose -f $INFRA_DIR/docker-compose.dev.yml up -d saleor-stripe-app"
    echo "   Then: docker compose -f $INFRA_DIR/docker-compose.dev.yml exec saleor-stripe-app-dev sh -c 'cd /app/apps/stripe && pnpm setup-postgres'"
fi

echo ""
read -p "Do you want to create a superuser? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "👤 Creating superuser..."
    docker compose -f "$INFRA_DIR/docker-compose.dev.yml" exec saleor-api python manage.py createsuperuser
fi

echo ""
read -p "Do you want to load demo data? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Loading demo data..."
    docker compose -f "$INFRA_DIR/docker-compose.dev.yml" exec -T saleor-api python manage.py populatedb --createsuperuser
fi

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "📍 Service URLs:"
echo "   - Saleor API:        http://localhost:8000/graphql/"
echo "   - GraphQL Playground: http://localhost:8000/graphql/"
echo ""
echo "📚 Next steps:"
echo "   1. Set up the Dashboard (see README.md)"
echo "   2. Set up the Storefront (see storefront/README.md)"
echo "   3. Configure your shop (see docs/SALEOR_CONFIGURATION.md)"
echo ""
echo "💡 Useful commands:"
echo "   - View logs:        docker compose -f $INFRA_DIR/docker-compose.dev.yml logs -f"
echo "   - Stop services:    docker compose -f $INFRA_DIR/docker-compose.dev.yml down"
echo "   - Restart services: docker compose -f $INFRA_DIR/docker-compose.dev.yml restart"
echo ""

