# Saleor Platform - URL Configuration Migration Guide

## What Changed?

The Saleor platform configuration has been unified to eliminate hardcoded URLs and improve maintainability. All URL configuration is now centralized in `infra/.env`.

## Summary of Changes

### Before (❌ Hardcoded URLs)

```yaml
# docker-compose.dev.yml
environment:
  API_URL: https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/
  STRIPE_APP_URL: https://indiana-decades-burn-cold.trycloudflare.com
  # ... more hardcoded URLs
```

### After (✅ Environment Variables)

```yaml
# docker-compose.dev.yml
environment:
  API_URL: ${SALEOR_API_URL:-http://localhost:8000/graphql/}
  STRIPE_APP_URL: ${STRIPE_APP_URL:-http://localhost:3002}
  # ... uses .env for configuration
```

## Files Modified

### New Files Created

1. **`infra/.env.example`** - Template with all configuration options
2. **`infra/setup-tunnel-urls.ps1`** - Interactive setup wizard
3. **`docs/URL_CONFIGURATION.md`** - Comprehensive URL configuration guide
4. **`infra/README.md`** - Infrastructure documentation
5. **`MIGRATION_GUIDE.md`** - This file

### Files Updated

1. **`infra/docker-compose.dev.yml`** - All hardcoded URLs replaced with environment variables
2. **`infra/scripts/sync-tunnel-urls.ps1`** - Updated to work with new `.env` structure
3. **`saleor/saleor/settings.py`** - Fixed `PUBLIC_URL` validation to handle empty strings

### Code Already Supporting URL Fallback

1. **`apps/apps/stripe/src/app/api/register/route.ts`** - Handles localhost/tunnel URL conversion
2. **`apps/apps/stripe/src/app/api/webhooks/saleor/verify-signature.ts`** - Fetches JWKS from tunnel URL
3. **`apps/apps/stripe/src/lib/saleor-app.ts`** - APL with URL fallback logic

## Migration Steps

### Step 1: Update Your Configuration

Choose one of the following options:

#### Option A: Use Setup Script (Recommended)

```powershell
cd infra
.\setup-tunnel-urls.ps1
# Follow the prompts
```

#### Option B: Manual Configuration

```powershell
cd infra
copy .env.example .env
# Edit .env with your URLs
```

### Step 2: Verify Configuration

Check your `.env` file:

```bash
# infra/.env should contain:
SALEOR_API_URL=http://localhost:8000/graphql/  # or your tunnel URL
PUBLIC_URL=http://localhost:8000               # or your tunnel base URL
DASHBOARD_URL=http://localhost:9000            # or your dashboard tunnel
STOREFRONT_URL=http://localhost:3000           # or your storefront tunnel
STRIPE_APP_URL=http://localhost:3002           # or your stripe app tunnel
```

### Step 3: Restart Services

```powershell
cd infra
.\scripts\sync-tunnel-urls.ps1
```

Or manually:

```powershell
docker compose -f docker-compose.dev.yml up -d --force-recreate
```

### Step 4: Reinstall Stripe App (If Using Tunnels)

If you changed from localhost to tunnel URLs (or vice versa):

1. Go to Saleor Dashboard → Apps
2. Uninstall "Stripe" app
3. Install it again using the tunnel URL
4. Run webhook migration:
   ```powershell
   docker compose -f docker-compose.dev.yml exec saleor-stripe-app pnpm run migrate
   ```

## Breaking Changes

### 1. `.env` File Required

**Before:** Configuration was hardcoded in `docker-compose.dev.yml`

**After:** Configuration must be in `infra/.env`

**Action:** Create `infra/.env` using the setup script or copy from `.env.example`

### 2. Healthcheck URLs

**Before:** Healthchecks used hardcoded tunnel URLs

**After:** Healthchecks use `localhost` (internal container checks)

**Impact:** None - healthchecks work more reliably now

### 3. Default URLs

**Before:** Defaults were a mix of localhost and tunnel URLs

**After:** All defaults are `localhost` URLs

**Impact:** You must explicitly configure tunnel URLs in `.env`

## Configuration Patterns

### Pattern 1: Localhost Development

```bash
# infra/.env
SALEOR_API_URL=http://localhost:8000/graphql/
PUBLIC_URL=http://localhost:8000
DASHBOARD_URL=http://localhost:9000
STOREFRONT_URL=http://localhost:3000
STRIPE_APP_URL=http://localhost:3002
```

**Use case:** Local development without external access

### Pattern 2: Tunnel Development

```bash
# infra/.env
SALEOR_API_URL=https://api-abc123.trycloudflare.com/graphql/
PUBLIC_URL=https://api-abc123.trycloudflare.com
DASHBOARD_URL=https://dashboard-xyz789.trycloudflare.com
STOREFRONT_URL=https://store-def456.trycloudflare.com
STRIPE_APP_URL=https://stripe-ghi012.trycloudflare.com
```

**Use case:** Testing with external services, webhooks, mobile devices

### Pattern 3: Hybrid (Advanced)

```bash
# infra/.env
# API and Stripe app via tunnel (for webhooks)
SALEOR_API_URL=https://api-abc123.trycloudflare.com/graphql/
PUBLIC_URL=https://api-abc123.trycloudflare.com
STRIPE_APP_URL=https://stripe-ghi012.trycloudflare.com

# Frontend apps via localhost (for faster development)
DASHBOARD_URL=http://localhost:9000
STOREFRONT_URL=http://localhost:3000
```

**Use case:** Webhook testing while keeping frontend local

## Troubleshooting Migration Issues

### Issue 1: Services Won't Start

**Symptom:**
```
Error: environment variable SALEOR_API_URL not found
```

**Solution:**
```powershell
cd infra
.\setup-tunnel-urls.ps1  # Create .env file
```

### Issue 2: URLs Not Updating

**Symptom:** Changed `.env` but services still use old URLs

**Solution:**
```powershell
# Force recreate containers
docker compose -f docker-compose.dev.yml up -d --force-recreate

# Verify
docker compose -f docker-compose.dev.yml exec saleor-stripe-app printenv | grep URL
```

### Issue 3: Webhook 401 Errors

**Symptom:** Stripe webhooks return 401 Unauthorized

**Solution:**
```powershell
# Ensure PUBLIC_URL matches tunnel base URL
# Edit infra/.env

# Restart services
.\scripts\sync-tunnel-urls.ps1

# Reinstall Stripe app in Dashboard
```

### Issue 4: Old Scripts Still Using Hardcoded URLs

**Symptom:** Legacy scripts in `infra/scripts/` have hardcoded URLs

**Solution:** 
These scripts are deprecated. Use:
- `setup-tunnel-urls.ps1` for initial setup
- `sync-tunnel-urls.ps1` for URL changes

## Verifying Migration Success

### Check 1: Environment Variables in Containers

```powershell
# Saleor API
docker compose -f docker-compose.dev.yml exec saleor-api printenv PUBLIC_URL

# Stripe App
docker compose -f docker-compose.dev.yml exec saleor-stripe-app printenv APP_API_BASE_URL NEXT_PUBLIC_SALEOR_API_URL

# Dashboard
docker compose -f docker-compose.dev.yml exec saleor-dashboard printenv API_URL
```

### Check 2: Stripe App Manifest

```powershell
# If using localhost
curl http://localhost:3002/api/manifest

# If using tunnel
curl https://your-stripe-app.trycloudflare.com/api/manifest
```

Verify that `appUrl` and webhook URLs match your configuration.

### Check 3: JWKS Storage

```powershell
docker compose -f docker-compose.dev.yml exec postgres psql -U saleor -d stripe_app -c "SELECT saleor_api_url, LEFT(jwks, 50) as jwks_preview FROM auth_data;"
```

Should show JWKS as JSON, not a URL.

## Rollback Plan

If you need to rollback:

```powershell
# 1. Stop services
docker compose -f docker-compose.dev.yml down

# 2. Restore old docker-compose.dev.yml from git
git checkout HEAD -- infra/docker-compose.dev.yml

# 3. Remove .env file
Remove-Item infra/.env

# 4. Restart services
docker compose -f docker-compose.dev.yml up -d
```

**Note:** Rollback is not recommended. The new system is more maintainable and flexible.

## Benefits of New System

✅ **Centralized Configuration** - All URLs in one place (`infra/.env`)

✅ **No Hardcoded Values** - Easy to change environments

✅ **Localhost + Tunnel Support** - Switch modes without editing docker-compose

✅ **Better Defaults** - Sensible localhost defaults for development

✅ **Easier Debugging** - Clear separation of configuration and infrastructure

✅ **Setup Scripts** - Interactive wizards for configuration

✅ **Documentation** - Comprehensive guides for all scenarios

## Questions?

See documentation:
- [URL Configuration Guide](docs/URL_CONFIGURATION.md)
- [Infrastructure README](infra/README.md)
- [Stripe App Setup](docs/STRIPE_EXTENSIONS_INSTALL_FIX.md)

