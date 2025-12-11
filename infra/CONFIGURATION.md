# Saleor Platform - Unified Configuration Guide

This guide explains the unified configuration system for the entire Saleor platform (API, Dashboard, Storefront, and Stripe App).

## Table of Contents

1. [Quick Start](#quick-start)
2. [URL Configuration](#url-configuration)
3. [Service-Specific Configuration](#service-specific-configuration)
4. [Saleor Cloud Integration (Optional)](#saleor-cloud-integration-optional)
5. [Environment Variables Reference](#environment-variables-reference)

## Quick Start

### Local Development (No Tunnels)

1. Copy the example environment file:

   ```powershell
   cd infra
   cp .env.example .env
   ```

2. Configure Stripe keys in `.env`:

   ```env
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

3. Start all services:

   ```powershell
   docker compose -f docker-compose.dev.yml up -d
   ```

4. Access services:
   - **Saleor API**: http://localhost:8000/graphql/
   - **Dashboard**: http://localhost:9000
   - **Storefront**: http://localhost:3000
   - **Stripe App**: http://localhost:3002

### Development with Tunnels (For Webhooks)

1. Start Cloudflare tunnels for Saleor API and Stripe App:

   ```powershell
   # Terminal 1: Tunnel for Saleor API
   cloudflared tunnel --url localhost:8000

   # Terminal 2: Tunnel for Stripe App
   cloudflared tunnel --url localhost:3002
   ```

2. Update `.env` with tunnel URLs:

   ```env
   # Use the URLs provided by cloudflared (without /graphql/ suffix for API)
   SALEOR_API_TUNNEL_URL=https://your-api-tunnel.trycloudflare.com
   STRIPE_APP_TUNNEL_URL=https://your-stripe-app.trycloudflare.com
   ```

3. Restart services to pick up new configuration:

   ```powershell
   docker compose -f docker-compose.dev.yml restart saleor-api saleor-stripe-app saleor-dashboard saleor-storefront
   ```

4. Configure Stripe webhooks:
   ```powershell
   stripe listen --forward-to https://your-stripe-app.trycloudflare.com/api/webhooks/stripe
   ```

## URL Configuration

### Understanding the URL Hierarchy

The platform uses a **unified URL configuration** with consistent fallback logic:

```
TUNNEL URL (if set) → LOCALHOST (default)
```

### Single Source of Truth: SALEOR_API_TUNNEL_URL

All services reference `SALEOR_API_TUNNEL_URL` for consistency:

- **Saleor API**: Uses it as `PUBLIC_URL` (JWT issuer URL)
- **Dashboard**: Uses it for API requests
- **Storefront**: Uses it for GraphQL queries
- **Stripe App**: Uses it for webhook verification

### URL Formats

#### Saleor API URL

- **Tunnel**: `https://your-api-tunnel.trycloudflare.com` (NO `/graphql/` suffix)
- **Localhost**: `http://localhost:8000` or `http://127.0.0.1:8000`
- **Docker Internal**: `http://saleor-api:8000` (service name, used by containers)

#### Stripe App URL

- **Tunnel**: `https://your-stripe-app.trycloudflare.com` (NO path)
- **Localhost**: `http://localhost:3002` or `http://127.0.0.1:3002`

#### Storefront URL

- **Tunnel**: `https://your-storefront.trycloudflare.com`
- **Localhost**: `http://localhost:3000` or `http://127.0.0.1:3000`

### Why Tunnel URLs Are Critical for Webhooks

When using tunnels, Saleor's `PUBLIC_URL` must be set to the tunnel URL (not localhost). This ensures:

1. **JWT Signature Verification**: Saleor signs webhook requests with JWT tokens. The signature includes the issuer URL (`PUBLIC_URL`). If Saleor uses `localhost` but the Stripe app receives the request via a tunnel, signature verification fails because the issuer doesn't match.

2. **External Service Webhooks**: Services like Stripe need to reach your application over the internet, not localhost.

## Service-Specific Configuration

### Saleor API (Django/GraphQL Backend)

**Docker Service**: `saleor-api`  
**Port**: 8000  
**Configuration**: `/saleor/saleor/settings.py`

**Key Environment Variables**:

```env
# JWT Issuer URL - CRITICAL for webhook signature verification
PUBLIC_URL=${SALEOR_API_TUNNEL_URL:-http://localhost:8000}

# Security
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0,saleor-api
ALLOWED_GRAPHQL_ORIGINS=*

# Database
DATABASE_URL=postgres://saleor:saleor@postgres:5432/saleor

# Redis
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
```

**No Hardcoded Values**: All configuration via environment variables.

### Dashboard (Admin Interface)

**Docker Service**: `saleor-dashboard`  
**Port**: 9000  
**Framework**: Vite + React

**Key Environment Variables**:

```env
# API URL for GraphQL requests (browser-side)
API_URL=${SALEOR_API_TUNNEL_URL:-http://localhost:8000}/graphql/
VITE_API_URL=${SALEOR_API_TUNNEL_URL:-http://localhost:8000}/graphql/

# Saleor Cloud Services (OPTIONAL - see below)
APPS_MARKETPLACE_API_URL=${APPS_MARKETPLACE_API_URL:-}
EXTENSIONS_API_URL=${EXTENSIONS_API_URL:-}
```

**Hardcoded Values Found**:

- `dashboard/src/components/Sidebar/menu/hooks/useEnvLink.ts`: Contains hardcoded links to `cloud.saleor.io` for cloud environment management. **Not used in self-hosted setups** (sidebar button only appears for Saleor Cloud users).

### Storefront (Customer-Facing Site)

**Docker Service**: `saleor-storefront`  
**Port**: 3000  
**Framework**: Next.js 15 + React 19

**Key Environment Variables**:

```env
# Browser-side API URL
NEXT_PUBLIC_SALEOR_API_URL=${SALEOR_API_TUNNEL_URL:-http://localhost:8000}/graphql/

# Server-side codegen (can use Docker service name when not tunneled)
SALEOR_API_URL=${SALEOR_API_TUNNEL_URL:-http://saleor-api:8000}/graphql/

# Storefront URL for canonical links
NEXT_PUBLIC_STOREFRONT_URL=${STOREFRONT_TUNNEL_URL:-http://localhost:3000}

# Default channel
NEXT_PUBLIC_DEFAULT_CHANNEL=default-channel
```

**No Hardcoded Values**: Uses environment variables exclusively.

### Stripe Payment App

**Docker Service**: `saleor-stripe-app`  
**Port**: 3002 (mapped from container port 3000)  
**Framework**: Next.js + tRPC

**Key Environment Variables**:

```env
# Saleor API connection (server-to-server)
SALEOR_API_URL=${SALEOR_API_TUNNEL_URL:-http://saleor-api:8000}/graphql/

# Public URL for browser/registration
NEXT_PUBLIC_SALEOR_API_URL=${SALEOR_API_TUNNEL_URL:-http://localhost:8000}/graphql/

# App URLs (for manifest and webhooks)
APP_URL=${STRIPE_APP_TUNNEL_URL:-http://localhost:3002}
APP_API_BASE_URL=${STRIPE_APP_TUNNEL_URL:-http://localhost:3002}

# Stripe API keys
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App encryption key (NOT the same as Stripe secret or Saleor secret)
SECRET_KEY=${APP_SECRET_KEY:-default-key}

# PostgreSQL (separate database: stripe_app)
DATABASE_URL=postgres://saleor:saleor@postgres:5432/stripe_app
```

**No Hardcoded Values**: All configuration via environment variables or computed from `appBaseUrl`.

## Saleor Cloud Integration (Optional)

### What is Saleor Cloud?

Saleor Cloud is a managed hosting service provided by Saleor Commerce. It includes:

- Managed infrastructure
- App Marketplace (discover and install official Saleor apps)
- Extensions registry
- Cloud dashboard for environment management

### For Self-Hosted Setups

If you're self-hosting Saleor (like this setup), you **do not need** Saleor Cloud services unless you want to:

- Browse and install apps from Saleor's official App Marketplace
- Use Saleor-hosted app extensions

### Configuration

**To disable Saleor Cloud APIs** (recommended for self-hosted):

```env
# In .env file
APPS_MARKETPLACE_API_URL=
EXTENSIONS_API_URL=
```

**To enable Saleor Cloud APIs** (optional):

```env
# In .env file
APPS_MARKETPLACE_API_URL=https://apps.saleor.io/api/v2/saleor-apps
EXTENSIONS_API_URL=https://apps.saleor.io/api/v1/extensions
```

### Dashboard Behavior

The Dashboard has some hardcoded references to `cloud.saleor.io`:

- **Location**: `dashboard/src/components/Sidebar/menu/hooks/useEnvLink.ts`
- **Purpose**: Provides a link to Saleor Cloud environment management
- **Impact on Self-Hosting**: None - this link is only shown to Saleor Cloud users. For self-hosted, the button doesn't appear or is not functional.
- **Action Required**: No changes needed. The code is safe to leave as-is.

## Environment Variables Reference

### Global Configuration

| Variable                | Required           | Default                 | Description                              |
| ----------------------- | ------------------ | ----------------------- | ---------------------------------------- |
| `SALEOR_API_TUNNEL_URL` | When using tunnels | `http://localhost:8000` | Base URL for Saleor API (no `/graphql/`) |
| `STRIPE_APP_TUNNEL_URL` | When using tunnels | `http://localhost:3002` | Base URL for Stripe app                  |
| `STOREFRONT_TUNNEL_URL` | When using tunnels | `http://localhost:3000` | Base URL for storefront                  |

### Saleor API

| Variable                  | Required   | Default                    | Description                         |
| ------------------------- | ---------- | -------------------------- | ----------------------------------- |
| `SECRET_KEY`              | ✅         | -                          | Django secret key (generate random) |
| `PUBLIC_URL`              | ⚠️ Tunnels | `${SALEOR_API_TUNNEL_URL}` | JWT issuer URL                      |
| `ALLOWED_HOSTS`           | No         | `localhost,127.0.0.1,...`  | Comma-separated allowed hosts       |
| `ALLOWED_GRAPHQL_ORIGINS` | No         | `*`                        | CORS origins (use `*` for dev)      |
| `DATABASE_URL`            | ✅         | (auto-configured)          | PostgreSQL connection string        |
| `REDIS_URL`               | ✅         | (auto-configured)          | Redis connection string             |

### Dashboard

| Variable                   | Required | Default                             | Description                       |
| -------------------------- | -------- | ----------------------------------- | --------------------------------- |
| `API_URL`                  | No       | `${SALEOR_API_TUNNEL_URL}/graphql/` | Saleor API GraphQL endpoint       |
| `VITE_API_URL`             | No       | `${SALEOR_API_TUNNEL_URL}/graphql/` | Browser-side API URL              |
| `APPS_MARKETPLACE_API_URL` | No       | `` (empty)                          | Saleor App Marketplace (optional) |
| `EXTENSIONS_API_URL`       | No       | `` (empty)                          | Saleor Extensions (optional)      |

### Storefront

| Variable                      | Required | Default                             | Description              |
| ----------------------------- | -------- | ----------------------------------- | ------------------------ |
| `NEXT_PUBLIC_SALEOR_API_URL`  | No       | `${SALEOR_API_TUNNEL_URL}/graphql/` | Browser-side GraphQL URL |
| `SALEOR_API_URL`              | No       | `${SALEOR_API_TUNNEL_URL}/graphql/` | Server-side GraphQL URL  |
| `NEXT_PUBLIC_STOREFRONT_URL`  | No       | `${STOREFRONT_TUNNEL_URL}`          | Storefront canonical URL |
| `NEXT_PUBLIC_DEFAULT_CHANNEL` | No       | `default-channel`                   | Default sales channel    |

### Stripe App

| Variable                 | Required      | Default                    | Description                           |
| ------------------------ | ------------- | -------------------------- | ------------------------------------- |
| `STRIPE_PUBLISHABLE_KEY` | ✅            | -                          | Stripe publishable key                |
| `STRIPE_SECRET_KEY`      | ✅            | -                          | Stripe secret key                     |
| `STRIPE_WEBHOOK_SECRET`  | ✅            | -                          | Stripe webhook signing secret         |
| `STRIPE_APP_TOKEN`       | After install | -                          | Saleor app authentication token       |
| `APP_SECRET_KEY`         | No            | (default)                  | App encryption key (32 bytes hex)     |
| `APP_URL`                | No            | `${STRIPE_APP_TUNNEL_URL}` | App public URL                        |
| `APP_API_BASE_URL`       | ⚠️ Tunnels    | `${STRIPE_APP_TUNNEL_URL}` | Webhook base URL                      |
| `DATABASE_URL`           | ✅            | (auto-configured)          | PostgreSQL connection (stripe_app DB) |

## Best Practices

### 1. Use Environment Variables for All Configuration

❌ **Bad**: Hardcoding values in code

```typescript
const apiUrl = "http://localhost:8000/graphql/";
```

✅ **Good**: Using environment variables

```typescript
const apiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;
```

### 2. Consistent Fallback Logic

All services use the same pattern:

```typescript
const saleorApiUrl =
  process.env.SALEOR_API_TUNNEL_URL || "http://localhost:8000";
```

### 3. Separate Tunnel URLs by Service

Don't reuse one tunnel for multiple services. Each service gets its own:

- Saleor API: One tunnel
- Stripe App: Separate tunnel
- Storefront: Separate tunnel (if needed)

### 4. Document Environment Variables

Always include:

- **Description**: What the variable does
- **Required**: Is it mandatory?
- **Default**: What's the fallback value?
- **Format**: URL? Token? Comma-separated list?

### 5. Disable Unused Features

For self-hosted setups:

- Disable Saleor Cloud APIs if not needed
- Disable observability (OTEL, Sentry) in development
- Disable features that require external services

## Troubleshooting

### Webhook 401 Unauthorized Errors

**Symptom**: Stripe app returns 401 for Saleor webhooks

**Cause**: JWT signature mismatch - Saleor is using `localhost` as issuer, but request comes via tunnel

**Solution**:

1. Set `SALEOR_API_TUNNEL_URL` in `.env`
2. Restart Saleor API: `docker compose -f docker-compose.dev.yml restart saleor-api`
3. Reinstall Stripe app in Dashboard

### Dashboard Can't Connect to API

**Symptom**: Dashboard shows connection errors

**Cause**: Wrong API URL or CORS issue

**Solution**:

1. Check `API_URL` in dashboard environment
2. Verify `ALLOWED_GRAPHQL_ORIGINS=*` in Saleor API
3. Check browser console for CORS errors

### Stripe Webhooks Not Working

**Symptom**: Payments fail, no webhook events received

**Cause**: Webhook URL is localhost (not reachable by Stripe)

**Solution**:

1. Set up tunnel for Stripe app
2. Configure `STRIPE_APP_TUNNEL_URL` in `.env`
3. Update Stripe webhook endpoint to tunnel URL
4. Restart Stripe app

## Summary

This unified configuration system ensures:

✅ **No hardcoded URLs** - everything configurable via environment  
✅ **Consistent fallback logic** - tunnel URLs → localhost  
✅ **Single source of truth** - `SALEOR_API_TUNNEL_URL` for all services  
✅ **Optional Saleor Cloud** - easily enable/disable marketplace  
✅ **Self-hosting optimized** - defaults work without cloud services  
✅ **Tunnel-aware** - JWT signatures work correctly with tunnels

## Support

For issues or questions:

- [Saleor Discord](https://saleor.io/discord)
- [Saleor Documentation](https://docs.saleor.io/)
- [Saleor GitHub](https://github.com/saleor/saleor)
