# ✅ Saleor Platform - Unified URL Configuration System

## 🎯 What Was Accomplished

Your Saleor platform now has a **unified, centralized URL management system** that:

- ✅ **Eliminates all hardcoded URLs** in docker-compose.dev.yml
- ✅ **Centralizes configuration** in `infra/.env`
- ✅ **Supports both localhost and tunnel URLs** with easy switching
- ✅ **Provides interactive setup scripts** for configuration
- ✅ **Includes comprehensive documentation** for all scenarios
- ✅ **Ensures consistency** across all 4 services (API, Dashboard, Storefront, Stripe App)

## 📁 Files Created

### Configuration Files
1. **`infra/.env.example`** - Template with all variables and documentation
   - Complete list of all URL variables
   - Examples for localhost and tunnel configurations
   - Stripe API key configuration
   - Clear comments explaining each variable

### Setup Scripts
2. **`infra/setup-tunnel-urls.ps1`** - Interactive configuration wizard
   - Choose between localhost or tunnel mode
   - Prompts for all tunnel URLs
   - Optional Stripe API key configuration
   - Creates `.env` file automatically

### Sync Script
3. **`infra/scripts/sync-tunnel-urls.ps1`** (Updated)
   - Loads configuration from `.env`
   - Restarts services with new URLs
   - Verifies URLs in running containers
   - Tests Stripe app manifest
   - Provides troubleshooting output

### Documentation
4. **`docs/URL_CONFIGURATION.md`** - Comprehensive URL configuration guide
   - Complete explanation of all URL variables
   - Setup instructions for localhost and tunnel modes
   - Troubleshooting guide
   - Best practices

5. **`infra/README.md`** - Infrastructure documentation
   - Quick start guides
   - Service descriptions
   - Common commands
   - Development workflow

6. **`MIGRATION_GUIDE.md`** - Migration guide from old to new system
   - What changed
   - Step-by-step migration instructions
   - Troubleshooting
   - Rollback plan

7. **`UNIFIED_URL_SYSTEM.md`** - This summary document

## 🔧 Files Modified

### Docker Compose Configuration
**`infra/docker-compose.dev.yml`**

**Changed:**
- ❌ Removed all hardcoded tunnel URLs
- ✅ Added environment variable references
- ✅ Added consistent fallback to localhost
- ✅ Fixed healthcheck URLs (now use localhost internally)
- ✅ Unified variable naming across services

**Example transformation:**
```yaml
# Before (❌ Hardcoded)
API_URL: https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/

# After (✅ Environment Variable)
API_URL: ${SALEOR_API_URL:-http://localhost:8000/graphql/}
```

### Django Settings
**`saleor/saleor/settings.py`**

**Changed:**
- ✅ Fixed `PUBLIC_URL` validation to handle empty strings
- ✅ Now returns `None` for empty values instead of raising error

## 📊 Environment Variables Structure

### Core Variables
```bash
# Saleor API
SALEOR_API_URL=http://localhost:8000/graphql/  # Full GraphQL endpoint
PUBLIC_URL=http://localhost:8000                # Base URL (no /graphql/)

# Dashboard
DASHBOARD_API_URL=http://localhost:8000/graphql/  # API connection
DASHBOARD_URL=http://localhost:9000               # Dashboard frontend

# Storefront
STOREFRONT_URL=http://localhost:3000

# Stripe App
STRIPE_APP_URL=http://localhost:3002
```

### How They're Used

| Variable | Used By | Purpose | Example |
|----------|---------|---------|---------|
| `SALEOR_API_URL` | All services | API endpoint | `http://localhost:8000/graphql/` |
| `PUBLIC_URL` | Saleor API | JWT issuer | `http://localhost:8000` |
| `DASHBOARD_API_URL` | Dashboard, Storefront | API connection | Falls back to `SALEOR_API_URL` |
| `DASHBOARD_URL` | Healthchecks | Dashboard access | `http://localhost:9000` |
| `STOREFRONT_URL` | Storefront | Canonical URLs | `http://localhost:3000` |
| `STRIPE_APP_URL` | Stripe App | Webhooks, manifest | `http://localhost:3002` |

## 🚀 How to Use

### For Localhost Development (No Tunnels)

```powershell
# 1. Setup (first time only)
cd infra
.\setup-tunnel-urls.ps1
# Choose option 1 (localhost)

# 2. Start services
docker compose -f docker-compose.dev.yml up -d

# 3. Access services
# - API: http://localhost:8000/graphql/
# - Dashboard: http://localhost:9000
# - Storefront: http://localhost:3000
# - Stripe App: http://localhost:3002
```

### For Tunnel Development (External Access)

```powershell
# 1. Start tunnels (in separate terminals)
cloudflared tunnel --url http://localhost:8000  # Copy URL
cloudflared tunnel --url http://localhost:9000  # Copy URL
cloudflared tunnel --url http://localhost:3000  # Copy URL
cloudflared tunnel --url http://localhost:3002  # Copy URL

# 2. Setup with tunnel URLs
cd infra
.\setup-tunnel-urls.ps1
# Choose option 2 (tunnels)
# Enter the URLs from step 1

# 3. Start services
docker compose -f docker-compose.dev.yml up -d

# 4. Reinstall Stripe app in Dashboard

# 5. Run webhook migration
docker compose -f docker-compose.dev.yml exec saleor-stripe-app pnpm run migrate
```

### Switching Between Modes

```powershell
# Switch to new URLs
cd infra
.\setup-tunnel-urls.ps1  # Enter new URLs

# Apply changes
.\scripts\sync-tunnel-urls.ps1

# Reinstall Stripe app (if using)
# Go to Dashboard → Apps → Reinstall Stripe
```

## 🎨 Architecture Improvements

### Before (❌ Old System)

```
┌─────────────────────────┐
│  docker-compose.dev.yml │
│                         │
│  ❌ Hardcoded URLs:     │
│  refugees-fleece...     │
│  lately-tue...          │
│  latin-rather...        │
│  indiana-decades...     │
└─────────────────────────┘
```

**Problems:**
- URLs hardcoded in multiple places
- Different tunnel URLs for each service
- Difficult to change environments
- Easy to have inconsistencies
- No clear documentation

### After (✅ New System)

```
┌──────────────────┐
│   infra/.env     │  ← Single source of truth
│                  │
│  SALEOR_API_URL  │
│  PUBLIC_URL      │
│  DASHBOARD_URL   │
│  STOREFRONT_URL  │
│  STRIPE_APP_URL  │
└────────┬─────────┘
         │
         ├────→ docker-compose.dev.yml (uses ${VAR:-default})
         ├────→ saleor-api (PUBLIC_URL for JWT)
         ├────→ saleor-dashboard (API_URL)
         ├────→ saleor-storefront (NEXT_PUBLIC_SALEOR_API_URL)
         └────→ saleor-stripe-app (APP_API_BASE_URL)
```

**Benefits:**
- ✅ Single `.env` file for all configuration
- ✅ Consistent URLs across all services
- ✅ Easy environment switching
- ✅ Clear localhost fallbacks
- ✅ Comprehensive documentation

## 🔍 Verification

### Check Your Configuration

```powershell
# 1. View your .env file
cat infra/.env

# 2. Verify environment in containers
docker compose -f infra/docker-compose.dev.yml exec saleor-api printenv PUBLIC_URL
docker compose -f infra/docker-compose.dev.yml exec saleor-stripe-app printenv APP_API_BASE_URL

# 3. Test Stripe app manifest
curl http://localhost:3002/api/manifest
# Or: curl https://your-tunnel.trycloudflare.com/api/manifest

# 4. Check JWKS storage
docker compose -f infra/docker-compose.dev.yml exec postgres psql -U saleor -d stripe_app -c "SELECT saleor_api_url, LEFT(jwks, 50) as jwks_preview FROM auth_data;"
```

## 📝 Key Concepts

### 1. Environment Variable Fallback Pattern

```yaml
API_URL: ${DASHBOARD_API_URL:-${SALEOR_API_URL:-http://localhost:8000/graphql/}}
```

This pattern:
1. Tries `DASHBOARD_API_URL` first
2. Falls back to `SALEOR_API_URL`
3. Finally falls back to localhost

### 2. URL Format Consistency

| Type | Format | Example |
|------|--------|---------|
| GraphQL Endpoint | With `/graphql/` | `http://localhost:8000/graphql/` |
| Base URL | No trailing path | `http://localhost:8000` |
| Frontend URL | No trailing slash | `http://localhost:3000` |

### 3. Critical URLs for Tunnels

When using tunnels, these **MUST** match your actual tunnel URLs:

- ✅ `PUBLIC_URL` - For JWT signature verification
- ✅ `STRIPE_APP_URL` - For webhook signature verification

If these don't match, you'll get `401 Unauthorized` errors.

## 🛠️ Troubleshooting

### Common Issues

1. **Services won't start**
   ```powershell
   # Create .env file
   cd infra
   .\setup-tunnel-urls.ps1
   ```

2. **URL changes not applying**
   ```powershell
   # Force recreate
   docker compose -f infra/docker-compose.dev.yml up -d --force-recreate
   ```

3. **Webhook 401 errors**
   ```powershell
   # Verify URLs match
   cat infra/.env
   # Reinstall Stripe app
   # Run: .\scripts\sync-tunnel-urls.ps1
   ```

## 📚 Documentation Index

1. **[URL Configuration Guide](docs/URL_CONFIGURATION.md)** - Complete guide
2. **[Infrastructure README](infra/README.md)** - Quick reference
3. **[Migration Guide](MIGRATION_GUIDE.md)** - Upgrade instructions
4. **[Stripe Setup](docs/STRIPE_EXTENSIONS_INSTALL_FIX.md)** - Stripe configuration

## ✨ Benefits Summary

### For Development
- ✅ **Faster setup** - Interactive scripts guide you through configuration
- ✅ **Easier testing** - Switch between localhost and tunnels instantly
- ✅ **Better debugging** - Clear separation of config and infrastructure
- ✅ **No duplication** - URLs defined once, used everywhere

### For Maintenance
- ✅ **Single source of truth** - All config in `.env`
- ✅ **Version control friendly** - `.env` in gitignore, `.env.example` tracked
- ✅ **Easy onboarding** - New developers run setup script
- ✅ **Clear documentation** - Every variable explained

### For Operations
- ✅ **Environment consistency** - Same pattern for dev/staging/prod
- ✅ **No hardcoded secrets** - All sensitive data in `.env`
- ✅ **Audit trail** - Changes to URLs tracked in `.env`
- ✅ **Disaster recovery** - Easy to restore configuration

## 🎉 Success Criteria

Your system is correctly configured when:

- ✅ `infra/.env` exists with your URLs
- ✅ All services start without errors
- ✅ Dashboard connects to API
- ✅ Storefront loads product data
- ✅ Stripe app appears in Dashboard
- ✅ Webhook payments work (if using tunnels)
- ✅ No hardcoded URLs in docker-compose.dev.yml

## 🚦 Next Steps

1. **Test Your Configuration**
   ```powershell
   cd infra
   .\scripts\sync-tunnel-urls.ps1
   ```

2. **Install/Update Stripe App**
   - Go to Dashboard → Apps
   - Reinstall Stripe app
   - Test a payment

3. **Read the Docs**
   - Review [URL Configuration Guide](docs/URL_CONFIGURATION.md)
   - Bookmark [Infrastructure README](infra/README.md)

4. **Customize**
   - Edit `infra/.env` for your needs
   - Add custom environment variables
   - Document your setup

## 💡 Tips

- Use `localhost` for daily development
- Use tunnels only when you need external access
- Keep `infra/.env` in your password manager
- Run `sync-tunnel-urls.ps1` after URL changes
- Check logs if something doesn't work: `docker compose -f infra/docker-compose.dev.yml logs -f`

---

**You now have a production-grade, maintainable URL configuration system! 🎉**

