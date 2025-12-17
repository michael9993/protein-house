# Config Storage Migration to PostgreSQL

## Overview

Config storage has been migrated to use `STORAGE_BACKEND` instead of `APL`. This means configs will now be stored in PostgreSQL when `STORAGE_BACKEND=postgres`, which is the default in Docker.

## What Changed

### Before
- Config storage was controlled by `APL`:
  - `APL=file` → Used `FileAppConfigRepo`
  - `APL=dynamodb` → Used `DynamodbAppConfigRepo`
  - No PostgreSQL option for configs

### After
- Config storage is now controlled by `STORAGE_BACKEND`:
  - `STORAGE_BACKEND=postgres` → Uses `PostgresAppConfigRepo` ✅
  - `STORAGE_BACKEND=dynamodb` → Uses `DynamodbAppConfigRepo`
  - Not set → Falls back to `FileAppConfigRepo` (for local dev)

- `APL` is now **only** used for authentication tokens:
  - `APL=file` → File-based auth tokens (local dev)
  - `APL=dynamodb` → DynamoDB auth tokens (production)
  - `APL=saleor-cloud` → Saleor Cloud APL

## Benefits

1. **Consistency**: Configs and transactions now use the same storage backend
2. **Separation of Concerns**: Config storage and auth tokens are independent
3. **Better for Production**: PostgreSQL is more suitable for production than file-based storage
4. **Flexibility**: Can use PostgreSQL for configs while keeping file-based APL for local dev

## Migration Steps

### 1. Automatic (Recommended)

If you have existing configs in `.saleor-app-config.json`:

```powershell
# From infra/ directory
.\scripts\migrate-stripe-configs-to-postgres.ps1
```

### 2. Manual

```bash
# From apps/stripe directory
pnpm tsx scripts/migrate-to-postgres.ts
```

### 3. Verify Migration

```powershell
# Check configs in PostgreSQL
docker exec saleor-postgres-dev psql -U saleor -d stripe_app -c "SELECT config_id, config_name FROM stripe_configs;"
```

## Current Configuration

In `docker-compose.dev.yml`:

```yaml
STORAGE_BACKEND: postgres  # Configs and transactions → PostgreSQL
DATABASE_URL: postgres://saleor:saleor@postgres:5432/stripe_app
APL: file                  # Auth tokens → File (local dev)
```

## What Happens Now

1. **New configs** will be saved to PostgreSQL automatically
2. **Existing file configs** can be migrated using the migration script
3. **The app will read from PostgreSQL** when `STORAGE_BACKEND=postgres`
4. **Auth tokens** continue to use the `APL` setting (file for local dev)

## Troubleshooting

### Configs not appearing in PostgreSQL

1. Verify `STORAGE_BACKEND=postgres` is set
2. Check database connection: `docker exec saleor-postgres-dev psql -U saleor -d stripe_app -c "SELECT 1;"`
3. Run migration script if you have file-based configs
4. Check app logs for PostgreSQL connection errors

### Migration fails

1. Ensure PostgreSQL is running and accessible
2. Verify `DATABASE_URL` is correct
3. Check that schema exists: `docker exec saleor-postgres-dev psql -U saleor -d stripe_app -c "\dt"`
4. Review migration script logs for specific errors

## Files Changed

- `src/modules/app-config/repositories/app-config-repo-impl.ts` - Now uses `STORAGE_BACKEND` instead of `APL`
- `scripts/migrate-to-postgres.ts` - Updated to migrate from file to PostgreSQL
- `infra/scripts/migrate-stripe-configs-to-postgres.ps1` - New migration helper script

## Backward Compatibility

- File-based configs still work if `STORAGE_BACKEND` is not set (fallback)
- DynamoDB configs still work if `STORAGE_BACKEND=dynamodb`
- Existing file configs are preserved (not deleted during migration)
