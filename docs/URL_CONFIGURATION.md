# Saleor Platform - URL Configuration Guide

## Overview

This guide explains how to configure URLs for your Saleor platform, whether you're running locally or using tunnels for external access.

All URLs are centrally managed through the `infra/.env` file, ensuring consistency across all services.

## Quick Start

### For Local Development (No Tunnels)

```powershell
cd infra
.\setup-tunnel-urls.ps1
# Choose option 1 for localhost URLs
docker compose -f docker-compose.dev.yml up -d
```

### For Tunnel/External Access

```powershell
cd infra
.\setup-tunnel-urls.ps1
# Choose option 2 and enter your tunnel URLs
docker compose -f docker-compose.dev.yml up -d
```

## Architecture

The platform consists of 4 main services:

| Service | Default Port | Purpose |
|---------|-------------|---------|
| **Saleor API** | 8000 | GraphQL API, backend logic |
| **Dashboard** | 9000 | Admin interface |
| **Storefront** | 3000 | Customer-facing shop |
| **Stripe App** | 3002 | Payment processing |

## Environment Variables

All URLs are configured in `infra/.env`:

```bash
# Main API endpoint
SALEOR_API_URL=http://localhost:8000/graphql/

# Public URL for JWT issuer (CRITICAL for tunnels)
PUBLIC_URL=http://localhost:8000

# Dashboard connects to API
DASHBOARD_API_URL=http://localhost:8000/graphql/
DASHBOARD_URL=http://localhost:9000

# Storefront
STOREFRONT_URL=http://localhost:3000

# Stripe App (CRITICAL for webhook signature verification)
STRIPE_APP_URL=http://localhost:3002
```

## URL Configuration Modes

### Mode 1: Local Development (Localhost)

**Best for:** Development without external access

```bash
SALEOR_API_URL=http://localhost:8000/graphql/
PUBLIC_URL=http://localhost:8000
DASHBOARD_URL=http://localhost:9000
STOREFRONT_URL=http://localhost:3000
STRIPE_APP_URL=http://localhost:3002
```

**Characteristics:**
- ✅ Fast and simple
- ✅ No tunnel required
- ✅ Works offline
- ❌ Not accessible from external devices
- ❌ Cannot receive webhooks from Stripe

### Mode 2: Tunnel URLs (External Access)

**Best for:** Testing with external services, mobile devices, webhooks

**Example with Cloudflare Tunnel:**
```bash
SALEOR_API_URL=https://your-api.trycloudflare.com/graphql/
PUBLIC_URL=https://your-api.trycloudflare.com
DASHBOARD_URL=https://your-dashboard.trycloudflare.com
STOREFRONT_URL=https://your-storefront.trycloudflare.com
STRIPE_APP_URL=https://your-stripe-app.trycloudflare.com
```

**Characteristics:**
- ✅ Accessible from anywhere
- ✅ Receives Stripe webhooks
- ✅ Test on mobile devices
- ✅ JWT signature verification works
- ❌ Requires running tunnel service
- ❌ URLs change each time tunnel restarts

## Critical URLs Explained

### `PUBLIC_URL` (Saleor API)

**Purpose:** Used as JWT token issuer URL

**Why it matters:**
- Saleor signs JWT tokens for webhook authentication
- The issuer URL is embedded in the JWT
- If `PUBLIC_URL` doesn't match the actual access URL, JWT verification fails
- Results in `401 Unauthorized` errors for webhooks

**Rule:** 
- Localhost mode: `http://localhost:8000`
- Tunnel mode: `https://your-api.trycloudflare.com` (no /graphql/ suffix)

### `STRIPE_APP_URL`

**Purpose:** Used for webhook URLs and signature verification

**Why it matters:**
- Stripe app generates webhook URLs based on this
- Webhook signature verification requires correct issuer URL
- If this doesn't match the actual access URL, webhooks fail

**Rule:**
- Localhost mode: `http://localhost:3002`
- Tunnel mode: `https://your-stripe-app.trycloudflare.com`

### `SALEOR_API_URL` vs `PUBLIC_URL`

| Variable | Format | Purpose | Example |
|----------|--------|---------|---------|
| `SALEOR_API_URL` | Full GraphQL endpoint | API connections | `https://api.example.com/graphql/` |
| `PUBLIC_URL` | Base URL only | JWT issuer | `https://api.example.com` |

## Setup Scripts

### `setup-tunnel-urls.ps1`

**Purpose:** Initial configuration wizard

**Usage:**
```powershell
cd infra
.\setup-tunnel-urls.ps1
```

**Features:**
- Interactive prompts for all URLs
- Validates URL formats
- Creates `.env` file
- Optional Stripe API key configuration

### `sync-tunnel-urls.ps1`

**Purpose:** Apply URL changes and restart services

**Usage:**
```powershell
cd infra\scripts
.\sync-tunnel-urls.ps1
```

**Features:**
- Loads URLs from existing `.env`
- Restarts services with new configuration
- Verifies URLs in running containers
- Tests Stripe app manifest

## Switching Between Modes

### From Localhost to Tunnel

1. Get your tunnel URLs (start cloudflared/ngrok)
2. Run setup script:
   ```powershell
   cd infra
   .\setup-tunnel-urls.ps1
   # Choose option 2, enter tunnel URLs
   ```
3. Restart services:
   ```powershell
   cd infra\scripts
   .\sync-tunnel-urls.ps1
   ```
4. Reinstall Stripe app in Dashboard
5. Run webhook migration:
   ```powershell
   docker compose -f docker-compose.dev.yml exec saleor-stripe-app pnpm run migrate
   ```

### From Tunnel to Localhost

1. Run setup script:
   ```powershell
   cd infra
   .\setup-tunnel-urls.ps1
   # Choose option 1 for localhost
   ```
2. Restart services:
   ```powershell
   cd infra\scripts
   .\sync-tunnel-urls.ps1
   ```
3. Reinstall Stripe app in Dashboard

## Tunnel Setup Examples

### Cloudflare Tunnel

```powershell
# Terminal 1: API tunnel
cloudflared tunnel --url http://localhost:8000

# Terminal 2: Dashboard tunnel
cloudflared tunnel --url http://localhost:9000

# Terminal 3: Storefront tunnel
cloudflared tunnel --url http://localhost:3000

# Terminal 4: Stripe App tunnel
cloudflared tunnel --url http://localhost:3002
```

Copy the generated URLs to your `.env` file.

### ngrok

```powershell
# Terminal 1: API tunnel
ngrok http 8000

# Terminal 2: Dashboard tunnel
ngrok http 9000

# Terminal 3: Storefront tunnel
ngrok http 3000

# Terminal 4: Stripe App tunnel
ngrok http 3002
```

## Troubleshooting

### Webhook 401 Unauthorized

**Symptom:** Stripe webhooks return 401

**Causes:**
1. `PUBLIC_URL` doesn't match tunnel URL
2. JWKS not updated after URL change
3. `STRIPE_APP_URL` doesn't match tunnel URL

**Solution:**
```powershell
# 1. Update .env with correct tunnel URLs
cd infra
.\setup-tunnel-urls.ps1

# 2. Restart services
.\scripts\sync-tunnel-urls.ps1

# 3. Reinstall Stripe app in Dashboard

# 4. Verify JWKS
docker compose -f docker-compose.dev.yml exec postgres psql -U saleor -d stripe_app -c "SELECT saleor_api_url, LEFT(jwks, 50) as jwks_preview FROM auth_data;"
```

### URLs Not Updating

**Symptom:** Services still use old URLs

**Solution:**
```powershell
# Force recreate containers
docker compose -f docker-compose.dev.yml up -d --force-recreate

# Verify environment variables
docker compose -f docker-compose.dev.yml exec saleor-stripe-app printenv | grep URL
docker compose -f docker-compose.dev.yml exec saleor-api printenv PUBLIC_URL
```

### Dashboard Can't Connect to API

**Symptom:** Dashboard shows "Cannot connect to API"

**Causes:**
1. `DASHBOARD_API_URL` is incorrect
2. API is not accessible from Dashboard container

**Solution:**
```powershell
# Check API health
docker compose -f docker-compose.dev.yml ps saleor-api

# Check Dashboard environment
docker compose -f docker-compose.dev.yml exec saleor-dashboard printenv API_URL

# Test API connectivity from Dashboard
docker compose -f docker-compose.dev.yml exec saleor-dashboard wget -O- http://saleor-api:8000/graphql/
```

## Best Practices

1. **Use `.env` file:** Never hardcode URLs in `docker-compose.dev.yml`
2. **Consistent URLs:** All services should use the same base URL for API
3. **Restart after changes:** Always restart services when URLs change
4. **Reinstall Stripe app:** Required after changing `PUBLIC_URL` or `STRIPE_APP_URL`
5. **Test webhooks:** After URL changes, test a payment to verify webhooks work

## Environment Variable Precedence

Docker Compose loads environment variables in this order (later overrides earlier):

1. Default values in `docker-compose.dev.yml` (e.g., `${SALEOR_API_URL:-http://localhost:8000/graphql/}`)
2. Values from `infra/.env` file
3. Environment variables set in shell
4. Values from `-e` flag in `docker compose` command

## Advanced Configuration

### Multiple Environments

Create separate `.env` files for different environments:

```powershell
# Local development
cp .env .env.local

# Staging with tunnels
cp .env .env.staging

# Use specific env file
docker compose -f docker-compose.dev.yml --env-file .env.staging up -d
```

### Custom Ports

To use different ports:

1. Update `ports` in `docker-compose.dev.yml`
2. Update URLs in `.env` to match
3. Restart services

## See Also

- [Stripe App Setup](STRIPE_EXTENSIONS_INSTALL_FIX.md)
- [Docker Compose Reference](docker-compose.dev.yml)
- [Environment Variables Reference](.env.example)

