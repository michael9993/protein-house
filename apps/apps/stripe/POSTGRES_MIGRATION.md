# PostgreSQL Migration Guide

This document describes the migration from DynamoDB to PostgreSQL for the Stripe app.

## Overview

The Stripe app now supports PostgreSQL as the storage backend for:
- **App Configurations** (Stripe configs and channel mappings)
- **Transaction Records** (Payment intent tracking)

DynamoDB is still supported as a legacy option but PostgreSQL is now the default.

## Architecture Changes

### Storage Backend Selection

The app uses the `STORAGE_BACKEND` environment variable to determine which storage to use:
- `postgres` (default) - Uses PostgreSQL
- `dynamodb` (legacy) - Uses DynamoDB

### Storage Backend Selection

**Config Storage:**
- `STORAGE_BACKEND=postgres` (default) - Configs stored in PostgreSQL
- `STORAGE_BACKEND=dynamodb` (legacy) - Configs stored in DynamoDB
- If `STORAGE_BACKEND` is not set - Falls back to file-based storage for local dev

**Authentication Tokens (APL):**
- `APL=file` - File-based storage for auth tokens (local dev)
- `APL=dynamodb` - DynamoDB for auth tokens (production)
- `APL=saleor-cloud` - Saleor Cloud APL

**Note:** Config storage and APL are separate. You can use PostgreSQL for configs while keeping file-based APL for local development.

## Setup

### Docker Environment (Recommended)

If you're using Docker (via `infra/docker-compose.dev.yml`):

1. **The PostgreSQL service is already configured** - The Stripe app uses the same PostgreSQL instance as Saleor
2. **Database is created automatically** - The `stripe_app` database is created on first start
3. **Run schema migration**:
   ```powershell
   # From infra/ directory
   .\scripts\setup-stripe-postgres.ps1
   ```

The Stripe app is already configured with:
- `STORAGE_BACKEND=postgres` (default) - Configs and transactions use PostgreSQL
- `DATABASE_URL=postgres://saleor:saleor@postgres:5432/stripe_app`
- `APL=file` - Auth tokens use file-based storage (can be changed to postgres if needed)

See `infra/DOCKER_POSTGRES_SETUP.md` for detailed Docker setup instructions.

### Manual Setup (Non-Docker)

### 1. Install Dependencies

PostgreSQL support is already included. The `postgres` package is added to `package.json`.

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Storage backend: "postgres" (default) or "dynamodb" (legacy)
STORAGE_BACKEND=postgres

# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/saleor_stripe_app

# Optional: DynamoDB (only needed if STORAGE_BACKEND=dynamodb)
# DYNAMODB_MAIN_TABLE_NAME=...
# AWS_REGION=...
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
```

### 3. Create Database Schema

Run the setup script to create the required tables:

```bash
pnpm setup-postgres
```

Or manually run the migration SQL:

```bash
psql $DATABASE_URL -f src/modules/postgres/migrations/001_initial_schema.sql
```

### 4. Migrate Data (if migrating from File or DynamoDB)

If you have existing configs in a file (`.saleor-app-config.json`) or DynamoDB:

**From File:**
```powershell
# From infra/ directory
.\scripts\migrate-stripe-configs-to-postgres.ps1
```

Or manually:
```bash
# From apps/stripe directory
pnpm tsx scripts/migrate-to-postgres.ts
```

**From DynamoDB:**
The migration script template at `scripts/migrate-to-postgres.ts` can be extended to support DynamoDB migration. Currently it supports file-based migration.

## Database Schema

### Tables

1. **stripe_configs** - Stores Stripe configuration (keys, webhook secrets, etc.)
2. **channel_config_mappings** - Maps Saleor channels to Stripe configs
3. **recorded_transactions** - Tracks payment intents and their associated Saleor transactions

See `src/modules/postgres/migrations/001_initial_schema.sql` for the complete schema.

## Implementation Details

### New Files

- `src/modules/postgres/postgres-client.ts` - PostgreSQL connection utility
- `src/modules/postgres/migrations/001_initial_schema.sql` - Database schema
- `src/modules/app-config/repositories/postgres/postgres-app-config-repo.ts` - PostgreSQL implementation of AppConfigRepo
- `src/modules/transactions-recording/repositories/postgres/postgres-transaction-recorder-repo.ts` - PostgreSQL implementation of TransactionRecorderRepo

### Updated Files

- `src/lib/env.ts` - Added `STORAGE_BACKEND` and `DATABASE_URL` environment variables
- `src/modules/app-config/repositories/app-config-repo-impl.ts` - Now uses `STORAGE_BACKEND` to select PostgreSQL (instead of `APL`)
- `src/modules/transactions-recording/repositories/transaction-recorder-impl.ts` - Now supports PostgreSQL
- `src/modules/dynamodb/dynamo-main-table.ts` - Made lazy to avoid errors when using PostgreSQL

## Backward Compatibility

- DynamoDB support is maintained for backward compatibility
- Set `STORAGE_BACKEND=dynamodb` to use DynamoDB
- The APL (Application Persistence Layer) for authentication tokens is separate and still supports DynamoDB via `APL=dynamodb`

## Benefits of PostgreSQL

1. **Cost-effective** - No per-request pricing
2. **Familiar** - Standard SQL database
3. **Better for relational data** - Natural fit for configs and mappings
4. **Easier to query** - Standard SQL queries
5. **Better tooling** - Wide ecosystem of tools and ORMs

## Troubleshooting

### Connection Issues

If you see connection errors, verify:
- `DATABASE_URL` is correctly formatted
- PostgreSQL server is running and accessible
- Database exists and user has proper permissions

### Migration Issues

If migrating from DynamoDB:
- Ensure all data is exported before switching
- Verify data integrity after migration
- Keep DynamoDB data as backup until migration is verified

## Production Deployment

For production:

1. Set `STORAGE_BACKEND=postgres` in your environment
2. Configure `DATABASE_URL` with production database credentials
3. Run migrations on production database
4. Test thoroughly before switching from DynamoDB
5. Monitor performance and adjust connection pool settings if needed

## Removing DynamoDB (Optional)

If you want to completely remove DynamoDB dependencies:

1. Set `STORAGE_BACKEND=postgres` everywhere
2. Remove AWS environment variables
3. Optionally remove DynamoDB packages from `package.json`:
   - `@aws-sdk/client-dynamodb`
   - `@aws-sdk/lib-dynamodb`
   - `@aws-sdk/util-dynamodb`
   - `dynamodb-toolbox`
4. Remove DynamoDB-related files (keep for reference or delete)

Note: 
- Config storage is controlled by `STORAGE_BACKEND` (postgres/dynamodb/file fallback)
- The APL (authentication layer) is separate and controlled by `APL` (file/dynamodb/saleor-cloud)
- You can use PostgreSQL for configs while keeping file-based APL for local dev
