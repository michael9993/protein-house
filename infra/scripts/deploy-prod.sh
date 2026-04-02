#!/bin/bash

# Saleor Production Deployment Script
# This script helps deploy Saleor to production

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"

ENV_FILE="$INFRA_DIR/.env.prod"
COMPOSE_FILE="$INFRA_DIR/docker-compose.prod.yml"

echo "🚀 Saleor Production Deployment"
echo "==============================="
echo ""

# Check if .env.prod exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Production environment file not found: $ENV_FILE"
    echo "   Please create it from .env.example and configure all variables."
    exit 1
fi

echo "✅ Found environment file: $ENV_FILE"
echo ""

# Validate required environment variables
echo "🔍 Validating environment variables..."
source "$ENV_FILE"

REQUIRED_VARS=(
    "SECRET_KEY"
    "POSTGRES_PASSWORD"
    "REDIS_PASSWORD"
    "ALLOWED_HOSTS"
    "EMAIL_URL"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] || [[ "${!var}" == *"changeme"* ]] || [[ "${!var}" == *"example"* ]]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Missing or invalid required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "   Please update $ENV_FILE with proper values."
    exit 1
fi

echo "✅ All required environment variables are set"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Create backup directory
BACKUP_DIR="/home/saleor/backups"
mkdir -p "$BACKUP_DIR"
echo "📦 Backup directory: $BACKUP_DIR"
echo ""

# Backup database if it exists
if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps postgres | grep -q "Up"; then
    echo "💾 Backing up database..."
    BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres pg_dump -U saleor saleor > "$BACKUP_FILE" || {
        echo "⚠️  Database backup failed, but continuing..."
    }
    echo "✅ Database backed up to: $BACKUP_FILE"
    echo ""
fi

# Pull latest images
echo "📥 Pulling latest Docker images..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull

echo ""
echo "🛑 Stopping existing services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down

echo ""
echo "🚀 Starting services..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 15

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
MAX_RETRIES=30
RETRY_COUNT=0
until docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres pg_isready -U saleor > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ PostgreSQL failed to start after $MAX_RETRIES attempts"
        exit 1
    fi
    echo "   PostgreSQL is not ready yet, waiting... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done
echo "✅ PostgreSQL is ready"

# Wait for Redis
echo "⏳ Waiting for Redis..."
RETRY_COUNT=0
until docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T redis redis-cli --raw incr ping > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ Redis failed to start after $MAX_RETRIES attempts"
        exit 1
    fi
    echo "   Redis is not ready yet, waiting... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done
echo "✅ Redis is ready"

# Wait for API
echo "⏳ Waiting for Saleor API..."
RETRY_COUNT=0
until curl -f http://localhost:8000/graphql/ > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "⚠️  API health check failed, but continuing..."
        break
    fi
    echo "   API is not ready yet, waiting... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 3
done

if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo "✅ Saleor API is ready"
fi

echo ""
echo "🔧 Running database migrations..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T aura-api python manage.py migrate

echo ""
echo "📊 Service Status:"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📍 Service URLs:"
echo "   - Saleor API: https://api.yourdomain.com/graphql/"
echo ""
echo "💡 Next steps:"
echo "   1. Verify services are running: docker compose -f $COMPOSE_FILE --env-file $ENV_FILE ps"
echo "   2. Check logs: docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f"
echo "   3. Test API: curl https://api.yourdomain.com/graphql/"
echo "   4. Configure Nginx (see docs/PRODUCTION_DEPLOYMENT.md)"
echo "   5. Set up SSL certificates with Let's Encrypt"
echo ""
echo "🔒 Security reminders:"
echo "   - Ensure .env.prod has secure permissions: chmod 600 $ENV_FILE"
echo "   - Review firewall rules: sudo ufw status"
echo "   - Set up regular backups"
echo "   - Monitor logs for suspicious activity"
echo ""

