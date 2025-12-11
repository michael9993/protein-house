# Saleor Platform - Unified Configuration Summary

## ✅ Configuration Audit Complete

Your Saleor platform has been audited and unified to use consistent, environment-based configuration.

## Key Changes Made

### 1. **Unified Environment Variables**

All services now use a consistent set of environment variables with proper fallbacks:

```env
# Core tunnel URLs (set these when using tunnels)
SALEOR_API_TUNNEL_URL=https://your-api.trycloudflare.com
STRIPE_APP_TUNNEL_URL=https://your-stripe-app.trycloudflare.com
STOREFRONT_TUNNEL_URL=https://your-storefront.trycloudflare.com
```

**Fallback Behavior**:

- If tunnel URLs are set → Use tunnel URLs
- If tunnel URLs are empty → Use localhost URLs
- No hardcoded values in docker-compose.yml

### 2. **Service URL Configuration**

| Service        | Environment Variable           | Tunnel URL                          | Localhost Fallback                |
| -------------- | ------------------------------ | ----------------------------------- | --------------------------------- |
| **Saleor API** | `PUBLIC_URL`                   | `${SALEOR_API_TUNNEL_URL}`          | `http://localhost:8000`           |
| **Dashboard**  | `API_URL`, `VITE_API_URL`      | `${SALEOR_API_TUNNEL_URL}/graphql/` | `http://localhost:8000/graphql/`  |
| **Storefront** | `NEXT_PUBLIC_SALEOR_API_URL`   | `${SALEOR_API_TUNNEL_URL}/graphql/` | `http://localhost:8000/graphql/`  |
| **Storefront** | `SALEOR_API_URL` (server-side) | `${SALEOR_API_TUNNEL_URL}/graphql/` | `http://saleor-api:8000/graphql/` |
| **Stripe App** | `NEXT_PUBLIC_SALEOR_API_URL`   | `${SALEOR_API_TUNNEL_URL}/graphql/` | `http://localhost:8000/graphql/`  |
| **Stripe App** | `SALEOR_API_URL` (server-side) | `${SALEOR_API_TUNNEL_URL}/graphql/` | `http://saleor-api:8000/graphql/` |
| **Stripe App** | `APP_URL`, `APP_API_BASE_URL`  | `${STRIPE_APP_TUNNEL_URL}`          | `http://localhost:3002`           |

### 3. **Removed Hardcoded Values**

**Before** (❌ Bad):

```yaml
environment:
  API_URL: ${DASHBOARD_API_URL:-https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/}
```

**After** (✅ Good):

```yaml
environment:
  API_URL: ${SALEOR_API_TUNNEL_URL:-http://localhost:8000}/graphql/
```

### 4. **Saleor Cloud APIs**

The following Saleor Cloud services are **optional** and clearly documented:

```yaml
# Optional: For app marketplace discovery (can be disabled)
APPS_MARKETPLACE_API_URL: ${APPS_MARKETPLACE_API_URL:-https://apps.saleor.io/api/v2/saleor-apps}

# Optional: For app extensions (can be disabled)
EXTENSIONS_API_URL: ${EXTENSIONS_API_URL:-https://apps.saleor.io/api/v1/extensions}
```

**To disable**: Set to empty string in `.env`:

```env
APPS_MARKETPLACE_API_URL=
EXTENSIONS_API_URL=
```

**Your platform is 100% self-hosted** - these APIs are only for discovering official Saleor apps in the marketplace.

### 5. **Fixed Healthchecks**

All healthchecks now use localhost instead of tunnel URLs (services check themselves internally):

```yaml
healthcheck:
  test:
    ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9000"]
```

### 6. **Consistent Naming**

All app identifiers are now consistent:

| Service    | App ID   | App Name | Manifest ID |
| ---------- | -------- | -------- | ----------- |
| Stripe App | `stripe` | `Stripe` | `stripe`    |

## Configuration Files

### Primary Files

1. **`infra/.env`** - Your current tunnel configuration

   - Contains your active tunnel URLs
   - Update this file when tunnel URLs change

2. **`infra/docker-compose.dev.yml`** - Unified service definitions

   - All environment variables with proper fallbacks
   - No hardcoded URLs
   - Consistent patterns across all services

3. **`infra/README-TUNNEL-SETUP.md`** - Complete setup guide
   - Localhost vs tunnel development
   - Troubleshooting common issues
   - Architecture overview

### Helper Scripts

1. **`infra/scripts/update-tunnel-urls.ps1`** - Update tunnel URLs interactively

   ```powershell
   cd infra/scripts
   .\update-tunnel-urls.ps1
   ```

2. **`infra/scripts/sync-tunnel-urls.ps1`** - Legacy script (still works with old variable names)

## Current Configuration

Based on your `.env` file, you're currently using:

```
Saleor API:  https://refugees-fleece-peterson-incurred.trycloudflare.com
Stripe App:  https://indiana-decades-burn-cold.trycloudflare.com
Storefront:  https://latin-rather-italic-cashiers.trycloudflare.com
Dashboard:   https://lately-tue-river-risks.trycloudflare.com
```

## How to Use

### Localhost Development

1. Clear tunnel variables in `.env`:

   ```bash
   cd infra
   # Comment out or delete tunnel URL lines in .env
   ```

2. Restart services:

   ```bash
   docker compose -f docker-compose.dev.yml restart
   ```

3. Access locally:
   - API: http://localhost:8000/graphql/
   - Dashboard: http://localhost:9000
   - Storefront: http://localhost:3000
   - Stripe App: http://localhost:3002

### Tunnel Development

1. Start tunnels:

   ```bash
   # Terminal 1
   cloudflared tunnel --url http://localhost:8000

   # Terminal 2
   cloudflared tunnel --url http://localhost:3002
   ```

2. Update `.env` with new tunnel URLs:

   ```env
   SALEOR_API_TUNNEL_URL=https://new-api-url.trycloudflare.com
   STRIPE_APP_TUNNEL_URL=https://new-stripe-url.trycloudflare.com
   ```

3. Restart services:

   ```bash
   docker compose -f docker-compose.dev.yml restart
   ```

4. **Important**: Reinstall Stripe app in Dashboard (webhooks need new URLs)

## URL Structure

All tunnel URLs follow this pattern:

- **Base URL Only** - No trailing slashes, no `/graphql/`
  - ✅ `https://your-api.trycloudflare.com`
  - ❌ `https://your-api.trycloudflare.com/`
  - ❌ `https://your-api.trycloudflare.com/graphql/`

The `/graphql/` suffix is automatically added by docker-compose.

## Environment Variable Hierarchy

```
┌────────────────────────────────┐
│ .env (highest priority)        │
│ SALEOR_API_TUNNEL_URL=...      │
└─────────────┬──────────────────┘
              │
              v
┌────────────────────────────────┐
│ docker-compose.dev.yml         │
│ ${SALEOR_API_TUNNEL_URL:-...}  │
└─────────────┬──────────────────┘
              │
              v
┌────────────────────────────────┐
│ Fallback (localhost)           │
│ http://localhost:8000          │
└────────────────────────────────┘
```

## Self-Hosted vs Cloud

### ✅ Self-Hosted Components (No Cloud Dependency)

- Saleor API (your instance)
- PostgreSQL database
- Redis cache
- Dashboard
- Storefront
- Stripe App
- All authentication & payments

### 📦 Optional Cloud Services

- **App Marketplace API** - For discovering official apps (optional)
- **Extensions API** - For app extensions (optional)

**These can be disabled** without affecting your platform's core functionality.

## Verification Commands

### Check Current Configuration

```bash
cd infra
docker compose -f docker-compose.dev.yml config | grep -A3 "environment:"
```

### Check Environment Variables in Running Containers

```bash
# Saleor API
docker compose -f docker-compose.dev.yml exec saleor-api printenv | grep PUBLIC_URL

# Stripe App
docker compose -f docker-compose.dev.yml exec saleor-stripe-app printenv | grep -E "SALEOR_API_URL|APP_URL"

# Dashboard
docker compose -f docker-compose.dev.yml exec saleor-dashboard printenv | grep API_URL
```

### Test Stripe App Manifest

```bash
curl https://indiana-decades-burn-cold.trycloudflare.com/api/manifest | jq '.webhooks[].targetUrl'
```

Should show all webhook URLs using your `STRIPE_APP_TUNNEL_URL`.

## Migration Notes

### From Old Configuration

If you were using:

- `DASHBOARD_API_URL` → Now use `SALEOR_API_TUNNEL_URL`
- `STRIPE_APP_URL` → Now use `STRIPE_APP_TUNNEL_URL`
- Hardcoded URLs in docker-compose → Now all use environment variables

### What to Update

1. ✅ Update `.env` with new variable names
2. ✅ Remove hardcoded URLs from any custom scripts
3. ✅ Reinstall Stripe app after updating URLs
4. ✅ Clear browser cache if Dashboard has issues

## Troubleshooting

### Issue: Stripe Webhook 401 Errors

**Symptom**: `SIGNATURE_VERIFICATION_FAILED`

**Fix**:

1. Ensure `SALEOR_API_TUNNEL_URL` is set in `.env`
2. Restart Saleor API: `docker compose -f docker-compose.dev.yml restart saleor-api`
3. Reinstall Stripe app in Dashboard

### Issue: Dashboard Can't Connect

**Symptom**: "Cannot connect to API"

**Fix**:

1. Check `SALEOR_API_TUNNEL_URL` in `.env`
2. Verify tunnel is running: `curl $SALEOR_API_TUNNEL_URL/graphql/`
3. Restart Dashboard: `docker compose -f docker-compose.dev.yml restart saleor-dashboard`

### Issue: Stripe App Installation Fails

**Symptom**: "App installation failed"

**Fix**:

1. Ensure `STRIPE_APP_TUNNEL_URL` is set correctly
2. Test manifest: `curl $STRIPE_APP_TUNNEL_URL/api/manifest`
3. Check logs: `docker compose -f docker-compose.dev.yml logs saleor-stripe-app`

## Summary

✅ **All hardcoded values removed**
✅ **Consistent environment variable pattern**
✅ **Proper localhost fallbacks**
✅ **Self-hosted configuration confirmed**
✅ **Optional Cloud APIs clearly documented**
✅ **No duplicate or conflicting configurations**
✅ **Tunnel and localhost modes both supported**

Your platform is now **fully unified** and ready for both localhost and tunnel development!

## Next Steps

1. Update your `.env` with current tunnel URLs
2. Restart services: `docker compose -f docker-compose.dev.yml restart`
3. Reinstall Stripe app in Dashboard
4. Test a payment flow to verify everything works

For detailed setup instructions, see `infra/README-TUNNEL-SETUP.md`.
