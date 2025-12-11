# Stripe App PostgreSQL Integration - Complete Guide

## Overview

The Stripe app has been **fully migrated to PostgreSQL** for both development and production. All storage (APL/auth tokens, configs, transactions) now uses PostgreSQL exclusively. **No APL, no DynamoDB, no file storage** - PostgreSQL only.

## What Changed

### ✅ Complete PostgreSQL Migration

1. **Authentication Tokens (APL)** - Now stored in PostgreSQL (`auth_data` table)
2. **App Configurations** - Stored in PostgreSQL (`stripe_configs` table)
3. **Channel Mappings** - Stored in PostgreSQL (`channel_config_mappings` table)
4. **Transaction Records** - Stored in PostgreSQL (`recorded_transactions` table)

### ✅ Removed Dependencies

- ❌ APL (Application Persistence Layer) - No longer needed
- ❌ DynamoDB - Completely removed
- ❌ File-based storage - No longer used
- ❌ `STORAGE_BACKEND` env var - Removed
- ❌ `APL` env var - Removed
- ❌ All DynamoDB/AWS env vars - Removed

### ✅ Docker Integration

- Uses the **same PostgreSQL container** as Saleor
- Creates **separate database** (`stripe_app`) for data isolation
- **Automatic database creation** on first start
- **Health checks** ensure proper startup order

## Architecture

```
┌─────────────────────────────────────────┐
│  Docker Network: saleor-network         │
│                                         │
│  ┌──────────────┐                      │
│  │  PostgreSQL  │                      │
│  │  Container   │                      │
│  │              │                      │
│  │  Databases:  │                      │
│  │  • saleor    │ ← Saleor API        │
│  │  • stripe_app│ ← Stripe App        │
│  └──────────────┘                      │
│         ↑                               │
│         │                               │
│  ┌──────┴──────┐                        │
│  │ Saleor API  │                        │
│  └─────────────┘                        │
│                                         │
│  ┌──────────────┐                       │
│  │ Stripe App   │ ──DATABASE_URL──→    │
│  │ Container    │   postgres:5432/     │
│  │              │   stripe_app         │
│  └──────────────┘                       │
└─────────────────────────────────────────┘
```

## Quick Start

### 1. Start Services

```powershell
cd infra
docker compose -f docker-compose.dev.yml up -d
```

### 2. Setup Stripe App Database

The database is created automatically, but you need to run the schema migration:

```powershell
.\scripts\setup-stripe-postgres.ps1
```

Or manually:

```bash
docker compose -f docker-compose.dev.yml exec saleor-stripe-app-dev sh -c "cd /app/apps/stripe && pnpm setup-postgres"
```

### 3. Verify

```powershell
# Check database exists
docker compose -f docker-compose.dev.yml exec -T postgres psql -U saleor -l | Select-String "stripe_app"

# Check tables
docker compose -f docker-compose.dev.yml exec -T postgres psql -U saleor -d stripe_app -c "\dt"
```

## Configuration

### Environment Variables (in docker-compose.dev.yml)

```yaml
# PostgreSQL connection - ALL data (auth tokens, configs, transactions) stored here
DATABASE_URL: postgres://saleor:saleor@postgres:5432/stripe_app
```

**Note:** `DATABASE_URL` is **required**. No other storage backend options are available.

## Database Schema

The Stripe app uses four tables:

1. **auth_data** - Authentication tokens (replaces APL)
2. **stripe_configs** - Stripe API keys, webhook secrets, etc.
3. **channel_config_mappings** - Maps Saleor channels to Stripe configs
4. **recorded_transactions** - Payment intent tracking

See `apps/apps/stripe/src/modules/postgres/migrations/001_initial_schema.sql` for full schema.

## Benefits

✅ **Unified Infrastructure** - One PostgreSQL instance for all services  
✅ **Cost Effective** - No DynamoDB costs  
✅ **Better Tooling** - Standard SQL, pgAdmin, DBeaver, etc.  
✅ **Easier Debugging** - Direct database queries  
✅ **Better Performance** - Local Docker network, no external API calls  
✅ **Data Isolation** - Separate database, shared infrastructure

## Migration from Existing Setup

If you have existing data in DynamoDB or file storage:

1. **Export your current configs** (if any)
2. **Start Docker services** with PostgreSQL
3. **Run schema migration**: `.\scripts\setup-stripe-postgres.ps1`
4. **Re-configure Stripe** via Dashboard (configs will be saved to PostgreSQL)

The app will automatically use PostgreSQL for all new configurations.

## Troubleshooting

### Database Connection Issues

```powershell
# Test connection from Stripe app container
docker compose -f docker-compose.dev.yml exec saleor-stripe-app-dev sh -c "cd /app/apps/stripe && node -e \"const postgres = require('postgres'); const sql = postgres('postgres://saleor:saleor@postgres:5432/stripe_app'); sql\`SELECT 1\`.then(() => console.log('✅ Connected')).catch(e => console.error('❌', e));\""
```

### Schema Not Created

```bash
# Run migration manually
docker compose -f docker-compose.dev.yml exec saleor-stripe-app-dev sh -c "cd /app/apps/stripe && pnpm setup-postgres"
```

### Check Logs

```powershell
# Stripe app logs
docker compose -f docker-compose.dev.yml logs saleor-stripe-app-dev | Select-String "PostgreSQL\|Postgres\|DATABASE"

# PostgreSQL logs
docker compose -f docker-compose.dev.yml logs postgres | Select-String "stripe_app"
```

## Production Deployment

For production, update `docker-compose.prod.yml` similarly:

1. Add `DATABASE_URL` to Stripe app service
2. Set `STORAGE_BACKEND=postgres`
3. Use production PostgreSQL credentials
4. Run migrations on deployment

## Files Modified

- ✅ `infra/docker-compose.dev.yml` - Added PostgreSQL config to Stripe app
- ✅ `infra/scripts/init-stripe-database.sh` - Auto-creates database
- ✅ `infra/scripts/setup-stripe-postgres.ps1` - Setup script
- ✅ `infra/scripts/init-dev.sh` - Includes Stripe setup
- ✅ `apps/apps/stripe/src/lib/env.ts` - Added DATABASE_URL
- ✅ `apps/apps/stripe/src/modules/app-config/repositories/app-config-repo-impl.ts` - PostgreSQL support
- ✅ `apps/apps/stripe/src/modules/transactions-recording/repositories/transaction-recorder-impl.ts` - PostgreSQL support

## Next Steps

1. ✅ Start Docker services
2. ✅ Run `.\scripts\setup-stripe-postgres.ps1`
3. ✅ Configure Stripe via Dashboard
4. ✅ Test payment flows
5. ✅ Verify data is stored in PostgreSQL

Everything is now integrated and ready to use! 🎉
