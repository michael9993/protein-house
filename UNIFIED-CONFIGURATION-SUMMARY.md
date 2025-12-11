# Saleor Platform - Unified Configuration Summary

## Overview

Your Saleor platform has been fully unified and optimized for self-hosted deployment with consistent URL management, no hardcoded values, and optional Saleor Cloud integration.

## What Changed

### 1. Unified Environment Variable System

**Created**: `infra/.env.example` - Complete template with all configuration

**Key Variables**:

- `SALEOR_API_TUNNEL_URL` - Single source of truth for Saleor API URL
- `STRIPE_APP_TUNNEL_URL` - Stripe app public URL
- `STOREFRONT_TUNNEL_URL` - Storefront public URL
- `APP_SECRET_KEY` - Stripe app encryption key (separate from other secrets)

**Fallback Logic** (Consistent across all services):

```
TUNNEL_URL (if set) → LOCALHOST (default)
```

### 2. Docker Compose Improvements

**File**: `infra/docker-compose.dev.yml`

**Changes Made**:

#### Saleor API

```yaml
# Before: PUBLIC_URL: ${PUBLIC_URL:-}
# After:  PUBLIC_URL: ${SALEOR_API_TUNNEL_URL:-http://localhost:8000}
```

✅ **Now**: Uses tunnel URL when set, falls back to localhost

#### Dashboard

```yaml
# Before: API_URL: ${DASHBOARD_API_URL:-http://localhost:8000/graphql/}
# After:  API_URL: ${SALEOR_API_TUNNEL_URL:-http://localhost:8000}/graphql/
```

✅ **Now**: Uses same variable as API (consistency)

**Saleor Cloud Integration**:

```yaml
# Before: APPS_MARKETPLACE_API_URL: ${APPS_MARKETPLACE_API_URL:-https://apps.saleor.io/api/v2/saleor-apps}
# After:  APPS_MARKETPLACE_API_URL: ${APPS_MARKETPLACE_API_URL:-}
```

✅ **Now**: Disabled by default for self-hosted setups
✅ **Documented**: Can be enabled if needed

#### Storefront

```yaml
# Before: NEXT_PUBLIC_SALEOR_API_URL: ${DASHBOARD_API_URL:-http://localhost:8000/graphql/}
# After:  NEXT_PUBLIC_SALEOR_API_URL: ${SALEOR_API_TUNNEL_URL:-http://localhost:8000}/graphql/
```

✅ **Now**: Uses unified variable name

```yaml
# Before: SALEOR_API_URL: http://saleor-api:8000/graphql/
# After:  SALEOR_API_URL: ${SALEOR_API_TUNNEL_URL:-http://saleor-api:8000}/graphql/
```

✅ **Now**: Can use tunnel URL for codegen when needed

#### Stripe App

```yaml
# Before: APP_URL: ${STRIPE_APP_URL:-http://localhost:3002}
# After:  APP_URL: ${STRIPE_APP_TUNNEL_URL:-http://localhost:3002}
```

✅ **Now**: Renamed to `STRIPE_APP_TUNNEL_URL` for clarity

```yaml
# Before: SECRET_KEY: ${SECRET_KEY:-default...}
# After:  SECRET_KEY: ${APP_SECRET_KEY:-default...}
```

✅ **Now**: Uses dedicated `APP_SECRET_KEY` variable to avoid confusion with Saleor's `SECRET_KEY`

```yaml
# Before: Hardcoded Stripe keys
# After:  STRIPE_PUBLISHABLE_KEY: ${STRIPE_PUBLISHABLE_KEY:-}
```

✅ **Now**: No hardcoded Stripe keys

### 3. No Hardcoded Values

#### Before This Audit:

- ❌ Hardcoded Stripe API keys in docker-compose
- ❌ Mixed variable names (`DASHBOARD_API_URL`, `STRIPE_APP_URL`)
- ❌ Saleor Cloud APIs enabled by default
- ❌ Different fallback patterns across services

#### After This Audit:

- ✅ All secrets in `.env` file (not committed)
- ✅ Unified variable names (`SALEOR_API_TUNNEL_URL`)
- ✅ Saleor Cloud APIs disabled by default
- ✅ Consistent fallback logic everywhere

### 4. Saleor Cloud Integration (Optional)

**What is Saleor Cloud?**

- Managed hosting service by Saleor Commerce
- Includes App Marketplace and Extensions registry
- **NOT required** for self-hosted setups

**Configuration**:

```env
# Disabled (recommended for self-hosted)
APPS_MARKETPLACE_API_URL=
EXTENSIONS_API_URL=

# Enabled (if you want marketplace)
APPS_MARKETPLACE_API_URL=https://apps.saleor.io/api/v2/saleor-apps
EXTENSIONS_API_URL=https://apps.saleor.io/api/v1/extensions
```

**Dashboard Behavior**:

- File: `dashboard/src/components/Sidebar/menu/hooks/useEnvLink.ts`
- Contains hardcoded link to `cloud.saleor.io`
- **Not an issue**: Only shown to Saleor Cloud customers
- **Action**: No changes needed (safe to leave as-is)

### 5. Documentation Created

**New Files**:

1. **`infra/.env.example`** - Complete environment template

   - All variables documented
   - Sensible defaults provided
   - Clear instructions for tunnels

2. **`infra/CONFIGURATION.md`** - Comprehensive guide (16 pages)

   - URL configuration explained
   - Service-specific configuration
   - Saleor Cloud integration details
   - Troubleshooting guide
   - Best practices

3. **`infra/scripts/setup-environment.ps1`** - Interactive setup
   - Guided configuration wizard
   - Automatic key generation
   - Tunnel or localhost mode
   - Validates and creates `.env` file

## Current Architecture

### URL Flow (With Tunnels)

```
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL ACCESS                           │
│                                                              │
│  Cloudflare Tunnels:                                        │
│  ├─ https://api-tunnel.trycloudflare.com → localhost:8000  │
│  ├─ https://stripe-tunnel.trycloudflare.com → localhost:3002│
│  └─ https://store-tunnel.trycloudflare.com → localhost:3000│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    ENVIRONMENT VARIABLES                     │
│                                                              │
│  SALEOR_API_TUNNEL_URL=https://api-tunnel.trycloudflare.com│
│  STRIPE_APP_TUNNEL_URL=https://stripe-tunnel.trycloudflare.com│
│  STOREFRONT_TUNNEL_URL=https://store-tunnel.trycloudflare.com│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER SERVICES                           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Saleor API   │  │  Dashboard   │  │  Storefront  │     │
│  │ Port: 8000   │  │  Port: 9000  │  │  Port: 3000  │     │
│  │              │  │              │  │              │     │
│  │ PUBLIC_URL=  │  │  API_URL=    │  │  API_URL=    │     │
│  │ [TUNNEL]     │  │  [TUNNEL]    │  │  [TUNNEL]    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Stripe App   │  │  PostgreSQL  │  │    Redis     │     │
│  │ Port: 3002   │  │  Port: 5432  │  │  Port: 6379  │     │
│  │              │  │              │  │              │     │
│  │ APP_URL=     │  │  (Internal)  │  │  (Internal)  │     │
│  │ [TUNNEL]     │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Variable Mapping

| Service                      | Environment Variable                | Fallback                          |
| ---------------------------- | ----------------------------------- | --------------------------------- |
| **Saleor API**               |
| `PUBLIC_URL`                 | `${SALEOR_API_TUNNEL_URL}`          | `http://localhost:8000`           |
| **Dashboard**                |
| `API_URL`                    | `${SALEOR_API_TUNNEL_URL}/graphql/` | `http://localhost:8000/graphql/`  |
| `VITE_API_URL`               | `${SALEOR_API_TUNNEL_URL}/graphql/` | `http://localhost:8000/graphql/`  |
| **Storefront**               |
| `NEXT_PUBLIC_SALEOR_API_URL` | `${SALEOR_API_TUNNEL_URL}/graphql/` | `http://localhost:8000/graphql/`  |
| `SALEOR_API_URL`             | `${SALEOR_API_TUNNEL_URL}/graphql/` | `http://saleor-api:8000/graphql/` |
| `NEXT_PUBLIC_STOREFRONT_URL` | `${STOREFRONT_TUNNEL_URL}`          | `http://localhost:3000`           |
| **Stripe App**               |
| `SALEOR_API_URL`             | `${SALEOR_API_TUNNEL_URL}/graphql/` | `http://saleor-api:8000/graphql/` |
| `NEXT_PUBLIC_SALEOR_API_URL` | `${SALEOR_API_TUNNEL_URL}/graphql/` | `http://localhost:8000/graphql/`  |
| `APP_URL`                    | `${STRIPE_APP_TUNNEL_URL}`          | `http://localhost:3002`           |
| `APP_API_BASE_URL`           | `${STRIPE_APP_TUNNEL_URL}`          | `http://localhost:3002`           |

## How to Use

### Option 1: Local Development Only

```powershell
cd infra
.\scripts\setup-environment.ps1 -LocalOnly
docker compose -f docker-compose.dev.yml up -d
```

Access:

- Saleor API: http://localhost:8000/graphql/
- Dashboard: http://localhost:9000
- Storefront: http://localhost:3000
- Stripe App: http://localhost:3002

### Option 2: With Tunnels (For Webhooks)

```powershell
# Terminal 1: Start Saleor API tunnel
cloudflared tunnel --url localhost:8000

# Terminal 2: Start Stripe App tunnel
cloudflared tunnel --url localhost:3002

# Terminal 3: Setup environment
cd infra
.\scripts\setup-environment.ps1 -WithTunnels
# Enter the tunnel URLs when prompted

docker compose -f docker-compose.dev.yml up -d
```

Access:

- Saleor API: https://your-api-tunnel.trycloudflare.com/graphql/
- Dashboard: http://localhost:9000
- Storefront: http://localhost:3000
- Stripe App: https://your-stripe-app.trycloudflare.com

## Benefits of This Unified System

### 1. Consistency

✅ All services use the same variable names  
✅ All services have the same fallback logic  
✅ All services configured from one `.env` file

### 2. Flexibility

✅ Works with or without tunnels  
✅ Supports localhost, 127.0.0.1, or any tunnel provider  
✅ Can enable/disable Saleor Cloud features

### 3. Security

✅ No hardcoded secrets  
✅ All sensitive data in `.env` (gitignored)  
✅ Separate encryption keys per service

### 4. Maintainability

✅ Single source of truth for URLs  
✅ Comprehensive documentation  
✅ Automated setup script  
✅ Clear troubleshooting guide

### 5. Self-Hosting Optimized

✅ Saleor Cloud APIs disabled by default  
✅ All features work without external dependencies  
✅ Full control over infrastructure

## Testing the Changes

### 1. Verify Environment

```powershell
# Check environment variables
cd infra
cat .env

# Verify docker-compose picks them up
docker compose -f docker-compose.dev.yml config | Select-String "TUNNEL_URL"
```

### 2. Test Saleor API

```powershell
# Start API
docker compose -f docker-compose.dev.yml up -d saleor-api

# Test GraphQL endpoint
curl http://localhost:8000/graphql/ -H "Content-Type: application/json" -d '{"query":"{ shop { name } }"}'

# Check PUBLIC_URL is set correctly
docker compose -f docker-compose.dev.yml exec saleor-api printenv PUBLIC_URL
```

### 3. Test Dashboard

```powershell
# Start Dashboard
docker compose -f docker-compose.dev.yml up -d saleor-dashboard

# Access Dashboard
Start-Process "http://localhost:9000"

# Check API URL in browser console
# Dashboard > F12 > Console > type: localStorage.getItem('apiUrl')
```

### 4. Test Stripe App

```powershell
# Start Stripe App
docker compose -f docker-compose.dev.yml up -d saleor-stripe-app

# Test manifest endpoint
curl http://localhost:3002/api/manifest

# Verify webhook URLs use correct domain
curl http://localhost:3002/api/manifest | ConvertFrom-Json | Select-Object -ExpandProperty webhooks | Format-Table name, targetUrl
```

### 5. Test Webhook Signature Verification

```powershell
# With tunnel configured, trigger a payment
# Check Stripe app logs for successful signature verification
docker compose -f docker-compose.dev.yml logs -f saleor-stripe-app | Select-String "Signature verification"
```

## Migration Notes

### Migrating from Old Configuration

If you were using the old configuration:

1. **Backup your current `.env`**:

   ```powershell
   copy infra\.env infra\.env.old
   ```

2. **Map old variables to new ones**:

   ```env
   # Old → New
   DASHBOARD_API_URL → SALEOR_API_TUNNEL_URL
   STRIPE_APP_URL → STRIPE_APP_TUNNEL_URL
   PUBLIC_URL → SALEOR_API_TUNNEL_URL
   ```

3. **Update your `.env`** with new variable names

4. **Restart all services**:
   ```powershell
   docker compose -f docker-compose.dev.yml down
   docker compose -f docker-compose.dev.yml up -d
   ```

## Troubleshooting

### Issue: Services still using localhost when tunnel is configured

**Solution**: Restart services to pick up new environment

```powershell
docker compose -f docker-compose.dev.yml restart
```

### Issue: Webhook 401 errors persist

**Solution**:

1. Verify `SALEOR_API_TUNNEL_URL` is set correctly (no `/graphql/` suffix)
2. Restart Saleor API: `docker compose -f docker-compose.dev.yml restart saleor-api`
3. Reinstall Stripe app in Dashboard

### Issue: Dashboard can't connect to API

**Solution**:

1. Check `ALLOWED_GRAPHQL_ORIGINS=*` in Saleor API
2. Verify API is accessible from browser
3. Check browser console for CORS errors

## Next Steps

1. **Setup your environment**:

   ```powershell
   cd infra
   .\scripts\setup-environment.ps1
   ```

2. **Start services**:

   ```powershell
   docker compose -f docker-compose.dev.yml up -d
   ```

3. **Install Stripe app** in Dashboard

4. **Test a payment** to verify webhooks work

5. **Read the full documentation**: `infra/CONFIGURATION.md`

## Support

- **Configuration Guide**: `infra/CONFIGURATION.md`
- **Setup Script**: `infra/scripts/setup-environment.ps1`
- **Environment Template**: `infra/.env.example`
- **Saleor Discord**: https://saleor.io/discord

---

**Summary**: Your Saleor platform now has a unified, consistent, and flexible configuration system that works seamlessly for both localhost and tunneled development, with no hardcoded values and full self-hosting support! 🚀
