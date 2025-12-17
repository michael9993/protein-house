# Complete PostgreSQL Migration - No APL, No DynamoDB

## Overview

The Stripe app has been **fully migrated to PostgreSQL** for both development and production. All storage backends (APL, configs, transactions) now use PostgreSQL exclusively.

## What Changed

### ✅ Complete Removal of APL and DynamoDB

1. **Authentication Tokens (APL)** - Now stored in PostgreSQL (`auth_data` table)
2. **App Configurations** - Stored in PostgreSQL (`stripe_configs` table)
3. **Channel Mappings** - Stored in PostgreSQL (`channel_config_mappings` table)
4. **Transaction Records** - Stored in PostgreSQL (`recorded_transactions` table)

### ✅ Removed Environment Variables

- `APL` - No longer needed (always uses PostgreSQL)
- `STORAGE_BACKEND` - No longer needed (always uses PostgreSQL)
- `DYNAMODB_MAIN_TABLE_NAME` - Removed
- `AWS_REGION` - Removed
- `AWS_ACCESS_KEY_ID` - Removed
- `AWS_SECRET_ACCESS_KEY` - Removed

### ✅ Required Environment Variable

- `DATABASE_URL` - **Required** - PostgreSQL connection string

## Database Schema

The Stripe app uses four tables in PostgreSQL:

1. **auth_data** - Authentication tokens (APL replacement)
   - `saleor_api_url` (PRIMARY KEY)
   - `app_id`
   - `token`
   - `jwks`
   - `created_at`, `updated_at`

2. **stripe_configs** - Stripe API keys, webhook secrets, etc.
3. **channel_config_mappings** - Maps Saleor channels to Stripe configs
4. **recorded_transactions** - Payment intent tracking

See `src/modules/postgres/migrations/001_initial_schema.sql` for the complete schema.

## Implementation Details

### New Files

- `src/modules/postgres/postgres-apl.ts` - PostgreSQL-based APL implementation
- Updated `src/modules/postgres/migrations/001_initial_schema.sql` - Added `auth_data` table

### Updated Files

- `src/lib/saleor-app.ts` - Now uses `PostgresAPL` instead of FileAPL/DynamoAPL
- `src/lib/env.ts` - Removed APL, STORAGE_BACKEND, and DynamoDB env vars; made DATABASE_URL required
- `src/modules/app-config/repositories/app-config-repo-impl.ts` - Always uses PostgreSQL
- `src/modules/transactions-recording/repositories/transaction-recorder-impl.ts` - Always uses PostgreSQL
- `infra/docker-compose.dev.yml` - Removed APL and DynamoDB env vars
- `infra/docker-compose.prod.yml` - Added Stripe app service with PostgreSQL

## Docker Configuration

### Development (`docker-compose.dev.yml`)

```yaml
saleor-stripe-app:
  environment:
    DATABASE_URL: postgres://saleor:saleor@postgres:5432/stripe_app
```

### Production (`docker-compose.prod.yml`)

```yaml
saleor-stripe-app:
  environment:
    DATABASE_URL: postgres://${POSTGRES_USER:-saleor}:${POSTGRES_PASSWORD}@postgres:5432/stripe_app
```

## Setup

### 1. Database Schema Migration

Run the setup script to create all tables:

```bash
# From apps/stripe directory
pnpm setup-postgres
```

Or via Docker:

```powershell
# From infra/ directory
.\scripts\setup-stripe-postgres.ps1
```

### 2. Verify Setup

```powershell
# Check all tables exist
docker exec saleor-postgres-dev psql -U saleor -d stripe_app -c "\dt"

# Should show:
# - auth_data
# - stripe_configs
# - channel_config_mappings
# - recorded_transactions
```

## Migration from File/DynamoDB

If you have existing data:

1. **Auth tokens**: Will be automatically saved to PostgreSQL when the app registers
2. **Configs**: Use the migration script:
   ```powershell
   .\scripts\migrate-stripe-configs-to-postgres.ps1
   ```
3. **Transactions**: No migration needed (they're created fresh)

## Benefits

✅ **Unified Storage** - Everything in one PostgreSQL database  
✅ **No External Dependencies** - No DynamoDB, no file storage  
✅ **Production Ready** - Works the same in dev and production  
✅ **Simpler Configuration** - Only one environment variable (`DATABASE_URL`)  
✅ **Better Performance** - Direct database access, no API calls  
✅ **Easier Debugging** - Standard SQL queries  

## Troubleshooting

### DATABASE_URL Not Set

The app will fail to start if `DATABASE_URL` is not set. Make sure it's configured in:
- `docker-compose.dev.yml` (for development)
- `docker-compose.prod.yml` (for production)
- Environment variables (for manual deployment)

### Schema Not Created

If tables don't exist, run:
```bash
pnpm setup-postgres
```

### Connection Issues

Verify PostgreSQL is accessible:
```bash
docker exec saleor-postgres-dev psql -U saleor -d stripe_app -c "SELECT 1;"
```

## Production Deployment

1. Set `DATABASE_URL` in your production environment
2. Ensure PostgreSQL database exists
3. Run schema migration: `pnpm setup-postgres`
4. Deploy the app
5. Verify tables exist and app can connect

## Backward Compatibility

⚠️ **Breaking Change**: This migration removes support for:
- File-based APL (`APL=file`)
- DynamoDB APL (`APL=dynamodb`)
- DynamoDB storage backend (`STORAGE_BACKEND=dynamodb`)
- File-based config storage (fallback)

All environments must use PostgreSQL.
