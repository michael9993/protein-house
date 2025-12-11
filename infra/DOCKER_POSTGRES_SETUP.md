# Docker PostgreSQL Setup for Stripe App

This guide explains how the Stripe app integrates with PostgreSQL in the Docker environment.

## Architecture

The Stripe app uses the **same PostgreSQL instance** as Saleor but with a **separate database** (`stripe_app`). This provides:

- ✅ Shared infrastructure (cost-effective)
- ✅ Data isolation (separate databases)
- ✅ Easy backup and management
- ✅ No additional services needed

## Database Structure

```
PostgreSQL Container (saleor-postgres-dev)
├── saleor (Saleor's database)
└── stripe_app (Stripe app's database)
```

## Automatic Setup

### On First Start

When you start the Docker services for the first time:

1. **PostgreSQL container starts** and runs `init-stripe-database.sh`
2. **`stripe_app` database is created automatically**
3. **Stripe app container starts** with `DATABASE_URL` pointing to `stripe_app`
4. **Schema migration runs** when you first access the app or run `pnpm setup-postgres`

### Manual Setup

If you need to set up the database manually:

```powershell
# From infra/ directory
.\scripts\setup-stripe-postgres.ps1
```

Or using Docker directly:

```bash
# Ensure database exists
docker compose -f docker-compose.dev.yml exec -T postgres psql -U saleor -d postgres -c "CREATE DATABASE stripe_app;" 2>&1 | grep -v "already exists" || true

# Run schema migration
docker compose -f docker-compose.dev.yml exec saleor-stripe-app-dev sh -c "cd /app/apps/stripe && pnpm setup-postgres"
```

## Environment Variables

The Stripe app service in `docker-compose.dev.yml` is configured with:

```yaml
STORAGE_BACKEND: postgres # Configs and transactions use PostgreSQL
DATABASE_URL: postgres://saleor:saleor@postgres:5432/stripe_app
APL: file # Auth tokens use file-based storage (separate from config storage)
```

**Note:** Config storage is controlled by `STORAGE_BACKEND`, while authentication tokens (APL) are controlled by `APL`. They are independent settings.

## Connection Details

- **Host**: `postgres` (Docker service name)
- **Port**: `5432` (internal Docker network)
- **User**: `saleor`
- **Password**: `saleor`
- **Database**: `stripe_app`

## Verification

Check if everything is working:

```powershell
# Check database exists
docker compose -f docker-compose.dev.yml exec -T postgres psql -U saleor -l | Select-String "stripe_app"

# Check tables exist
docker compose -f docker-compose.dev.yml exec -T postgres psql -U saleor -d stripe_app -c "\dt"

# Check Stripe app logs for PostgreSQL connection
docker compose -f docker-compose.dev.yml logs saleor-stripe-app-dev | Select-String "PostgreSQL"
```

## Troubleshooting

### Database doesn't exist

If the `stripe_app` database wasn't created automatically:

```bash
docker compose -f docker-compose.dev.yml exec -T postgres psql -U saleor -d postgres -c "CREATE DATABASE stripe_app;"
```

### Schema not created

Run the migration manually:

```bash
docker compose -f docker-compose.dev.yml exec saleor-stripe-app-dev sh -c "cd /app/apps/stripe && pnpm setup-postgres"
```

### Connection errors

Verify:

1. PostgreSQL container is running: `docker compose -f docker-compose.dev.yml ps postgres`
2. Stripe app can reach postgres: `docker compose -f docker-compose.dev.yml exec saleor-stripe-app-dev ping postgres`
3. DATABASE_URL is correct in container: `docker compose -f docker-compose.dev.yml exec saleor-stripe-app-dev env | Select-String "DATABASE_URL"`

## Production Considerations

For production (`docker-compose.prod.yml`):

1. Use strong passwords (set via environment variables)
2. Use separate PostgreSQL instance if needed for isolation
3. Set up regular backups
4. Monitor connection pool usage
5. Consider read replicas for high traffic

## Benefits

✅ **No DynamoDB costs** - Uses existing PostgreSQL  
✅ **Better tooling** - Standard SQL, pgAdmin, etc.  
✅ **Easier debugging** - Direct database access  
✅ **Better performance** - Local connections, no network latency  
✅ **Unified infrastructure** - One database server for all services
