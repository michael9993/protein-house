# Tunnel Setup Guide

This guide explains how to configure tunnel URLs for your Saleor platform.

## Quick Start

### For Localhost Development (No Tunnels)

1. Delete or comment out tunnel variables in `.env`:

   ```bash
   # SALEOR_API_TUNNEL_URL=
   # STRIPE_APP_TUNNEL_URL=
   # STOREFRONT_TUNNEL_URL=
   ```

2. Start services:

   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

3. Access locally:
   - API: http://localhost:8000/graphql/
   - Dashboard: http://localhost:9000
   - Storefront: http://localhost:3000
   - Stripe App: http://localhost:3002

### For Tunnel Development (Cloudflare, ngrok, etc.)

1. Start your tunnels for each service:

   ```bash
   # Terminal 1 - API Tunnel
   cloudflared tunnel --url http://localhost:8000

   # Terminal 2 - Stripe App Tunnel
   cloudflared tunnel --url http://localhost:3002

   # Terminal 3 - Storefront Tunnel (optional)
   cloudflared tunnel --url http://localhost:3000
   ```

2. Update `.env` with your tunnel URLs:

   ```env
   SALEOR_API_TUNNEL_URL=https://your-api.trycloudflare.com
   STRIPE_APP_TUNNEL_URL=https://your-stripe-app.trycloudflare.com
   STOREFRONT_TUNNEL_URL=https://your-storefront.trycloudflare.com
   ```

3. Restart services to pick up new URLs:

   ```bash
   docker compose -f docker-compose.dev.yml restart saleor-api saleor-stripe-app saleor-storefront saleor-dashboard
   ```

4. **IMPORTANT**: Reinstall the Stripe app in Dashboard to update webhook URLs with new tunnel URLs

## Environment Variables Reference

### Core Tunnel URLs

| Variable                | Description                        | Example                                     | Required    |
| ----------------------- | ---------------------------------- | ------------------------------------------- | ----------- |
| `SALEOR_API_TUNNEL_URL` | Saleor API base URL (no /graphql/) | `https://your-api.trycloudflare.com`        | For tunnels |
| `STRIPE_APP_TUNNEL_URL` | Stripe app base URL                | `https://your-app.trycloudflare.com`        | For tunnels |
| `STOREFRONT_TUNNEL_URL` | Storefront base URL                | `https://your-storefront.trycloudflare.com` | Optional    |

### How URLs are Used

#### Saleor API (`SALEOR_API_TUNNEL_URL`)

- Used as `PUBLIC_URL` for JWT token issuer
- Used by Dashboard API calls
- Used by Storefront API calls
- Used by Stripe App API calls
- **Fallback**: `http://localhost:8000` (for local dev)

#### Stripe App (`STRIPE_APP_TUNNEL_URL`)

- Used as `APP_URL` for installation callbacks
- Used as `APP_API_BASE_URL` for webhook URLs
- **CRITICAL**: Must match for webhook signature verification
- **Fallback**: `http://localhost:3002` (for local dev)

#### Storefront (`STOREFRONT_TUNNEL_URL`)

- Used as `NEXT_PUBLIC_STOREFRONT_URL` for canonical links
- **Fallback**: `http://localhost:3000` (for local dev)

## URL Naming Convention

All tunnel URLs should follow this pattern:

- **Base URL Only**: No trailing slashes, no paths
  - ✅ Good: `https://your-api.trycloudflare.com`
  - ❌ Bad: `https://your-api.trycloudflare.com/`
  - ❌ Bad: `https://your-api.trycloudflare.com/graphql/`

The `/graphql/` suffix is automatically added by the docker-compose configuration.

## Updating Tunnel URLs

When your tunnel URLs change:

1. Update `.env` file with new URLs
2. Restart services: `docker compose -f docker-compose.dev.yml restart`
3. **Reinstall Stripe app** in Dashboard (webhooks need new URLs)

## Troubleshooting

### Stripe Webhook 401 Errors

**Problem**: `SIGNATURE_VERIFICATION_FAILED: Fetching remote JWKS failed`

**Solution**:

1. Ensure `SALEOR_API_TUNNEL_URL` is set in `.env`
2. Ensure `STRIPE_APP_TUNNEL_URL` is set in `.env`
3. Restart Saleor API: `docker compose -f docker-compose.dev.yml restart saleor-api`
4. Uninstall and reinstall Stripe app in Dashboard

### Dashboard Can't Connect to API

**Problem**: Dashboard shows "Cannot connect to API"

**Solution**:

1. Check `SALEOR_API_TUNNEL_URL` in `.env`
2. Verify tunnel is running: `curl <your-tunnel-url>/graphql/`
3. Restart Dashboard: `docker compose -f docker-compose.dev.yml restart saleor-dashboard`

### Stripe App Installation Fails

**Problem**: "App installation failed" when installing from Dashboard

**Solution**:

1. Ensure `STRIPE_APP_TUNNEL_URL` is set correctly
2. Verify tunnel is running: `curl <your-stripe-app-tunnel-url>/api/manifest`
3. Check logs: `docker compose -f docker-compose.dev.yml logs saleor-stripe-app`

## Saleor Cloud APIs

The platform uses these optional Saleor Cloud APIs:

- `APPS_MARKETPLACE_API_URL`: For discovering official Saleor apps
- `EXTENSIONS_API_URL`: For app extensions

**These are optional** and can be disabled by setting to empty string:

```env
APPS_MARKETPLACE_API_URL=
EXTENSIONS_API_URL=
```

Your platform is **fully self-hosted** and does not require Saleor Cloud.

## Architecture Overview

```
┌─────────────────┐     Tunnel      ┌──────────────┐
│ Your Browser    │ ───────────────> │ Cloudflare   │
└─────────────────┘                  │ Tunnel       │
                                     └──────┬───────┘
                                            │
                                            v
┌─────────────────────────────────────────────────────┐
│ Docker Network (saleor-network)                     │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────┐   │
│  │ Saleor API   │  │ Dashboard    │  │ Redis  │   │
│  │ :8000        │  │ :9000        │  │ :6379  │   │
│  └──────────────┘  └──────────────┘  └────────┘   │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────┐   │
│  │ Storefront   │  │ Stripe App   │  │Postgres│   │
│  │ :3000        │  │ :3002        │  │ :5432  │   │
│  └──────────────┘  └──────────────┘  └────────┘   │
└─────────────────────────────────────────────────────┘
```

All services communicate internally via Docker network using service names (e.g., `http://saleor-api:8000`).

External access (from browser or webhooks) uses tunnel URLs when configured, localhost otherwise.
