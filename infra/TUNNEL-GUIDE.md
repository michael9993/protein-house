# Saleor Platform - Tunnel Configuration Guide

## Overview

This guide explains when and how to use tunnels for each service in your Saleor platform.

## Tunnel Priority

### ✅ Required Tunnels (for Webhooks)

These tunnels are **REQUIRED** if you want to test webhooks from external services:

1. **Saleor API Tunnel** (port 8000)
   - **Why**: JWT signature verification requires correct issuer URL
   - **When**: Always, when using tunnels
   - **Script**: `.\scripts\tunnel-api.ps1`
2. **Stripe App Tunnel** (port 3002)
   - **Why**: Stripe webhooks need to reach your app
   - **When**: Always, when using tunnels
   - **Script**: `.\scripts\tunnel-stripe.ps1`

### 📱 Optional Tunnels (for External Frontend Access)

These tunnels are **OPTIONAL** and only needed for specific use cases:

3. **Dashboard Tunnel** (port 9000)

   - **Why**: Admin interface external access
   - **When to use**:
     - Accessing Dashboard from mobile devices
     - Sharing admin interface with team/clients
     - External demos
   - **When NOT needed**: Local development (use `localhost:9000`)
   - **Script**: `.\scripts\tunnel-dashboard.ps1`

4. **Storefront Tunnel** (port 3000)
   - **Why**: Customer-facing site external access
   - **When to use**:
     - Testing from real mobile devices
     - Sharing storefront with users/clients
     - External user testing or demos
   - **When NOT needed**: Local development (use `localhost:3000`)
   - **Script**: `.\scripts\tunnel-storefront.ps1`

## Quick Start

### Minimal Setup (Webhooks Only)

```powershell
# Terminal 1: API tunnel
cd infra\scripts
.\tunnel-api.ps1

# Terminal 2: Stripe app tunnel
cd infra\scripts
.\tunnel-stripe.ps1

# Terminal 3: Configure and start services
cd infra
.\scripts\setup-environment.ps1 -WithTunnels
docker compose -f docker-compose.dev.yml up -d
```

### Full Setup (All Tunnels)

```powershell
# Terminal 1: API tunnel (REQUIRED)
cd infra\scripts
.\tunnel-api.ps1

# Terminal 2: Stripe app tunnel (REQUIRED)
.\tunnel-stripe.ps1

# Terminal 3: Dashboard tunnel (OPTIONAL)
.\tunnel-dashboard.ps1

# Terminal 4: Storefront tunnel (OPTIONAL)
.\tunnel-storefront.ps1

# Terminal 5: Configure and start services
cd infra
.\scripts\setup-environment.ps1 -WithTunnels
docker compose -f docker-compose.dev.yml up -d
```

## Configuration

After starting tunnels, update `infra/.env`:

```env
# Required for webhooks
SALEOR_API_TUNNEL_URL=https://your-api.trycloudflare.com
STRIPE_APP_TUNNEL_URL=https://your-stripe.trycloudflare.com

# Optional for external frontend access
DASHBOARD_TUNNEL_URL=https://your-dashboard.trycloudflare.com
STOREFRONT_TUNNEL_URL=https://your-storefront.trycloudflare.com
```

## Service Access Matrix

| Service        | Local URL                        | Tunnel URL                               | Required? | Use Case                          |
| -------------- | -------------------------------- | ---------------------------------------- | --------- | --------------------------------- |
| **Saleor API** | `http://localhost:8000/graphql/` | `https://api.trycloudflare.com/graphql/` | ✅ Yes    | JWT signatures, external webhooks |
| **Stripe App** | `http://localhost:3002`          | `https://stripe.trycloudflare.com`       | ✅ Yes    | Stripe webhooks                   |
| **Dashboard**  | `http://localhost:9000`          | `https://dash.trycloudflare.com`         | ❌ No     | External admin access             |
| **Storefront** | `http://localhost:3000`          | `https://store.trycloudflare.com`        | ❌ No     | Mobile testing, external sharing  |

## Use Cases

### 1. Local Development Only

**Tunnels needed**: None

```powershell
cd infra
.\scripts\setup-environment.ps1 -LocalOnly
docker compose -f docker-compose.dev.yml up -d
```

Access:

- Dashboard: `http://localhost:9000`
- Storefront: `http://localhost:3000`

### 2. Payment Testing (with Stripe Webhooks)

**Tunnels needed**: API + Stripe App

```powershell
# Start required tunnels
.\tunnel-api.ps1         # Terminal 1
.\tunnel-stripe.ps1      # Terminal 2

# Configure with tunnel URLs
cd infra
.\scripts\setup-environment.ps1 -WithTunnels
docker compose -f docker-compose.dev.yml up -d
```

Access:

- Dashboard: `http://localhost:9000` (local)
- Storefront: `http://localhost:3000` (local)

### 3. Mobile Device Testing

**Tunnels needed**: API + Stripe App + Dashboard + Storefront

```powershell
# Start all tunnels
.\tunnel-api.ps1         # Terminal 1
.\tunnel-stripe.ps1      # Terminal 2
.\tunnel-dashboard.ps1   # Terminal 3
.\tunnel-storefront.ps1  # Terminal 4

# Configure with all tunnel URLs
cd infra
.\scripts\setup-environment.ps1 -WithTunnels
docker compose -f docker-compose.dev.yml up -d
```

Access:

- Dashboard: `https://your-dashboard.trycloudflare.com` (mobile)
- Storefront: `https://your-storefront.trycloudflare.com` (mobile)

### 4. Client Demo (Full External Access)

**Tunnels needed**: All four

Same as mobile testing above. Share tunnel URLs with clients.

## Troubleshooting

### Dashboard tunnel not working

**Symptom**: Dashboard loads but can't connect to API

**Cause**: Dashboard needs to know the API tunnel URL

**Solution**: Set `SALEOR_API_TUNNEL_URL` in `.env` before starting Dashboard

### Storefront tunnel not working

**Symptom**: Storefront loads but shows errors

**Cause**: Storefront needs to know the API tunnel URL

**Solution**: Set `SALEOR_API_TUNNEL_URL` in `.env` before starting Storefront

### Tunnels keep disconnecting

**Cause**: Cloudflare free tunnels have no uptime guarantee

**Solution**: Use named tunnels with Cloudflare account for production:

```powershell
cloudflared tunnel login
cloudflared tunnel create my-tunnel
cloudflared tunnel route dns my-tunnel subdomain.yourdomain.com
```

## Best Practices

1. **Start API tunnel first** - Other services depend on it
2. **Use named tunnels for production** - Free tunnels are temporary
3. **Only tunnel what you need** - Reduces complexity
4. **Document your tunnel URLs** - In your `.env` file
5. **Restart services after changing tunnel URLs** - To pick up new configuration

## Security Notes

- **Free tunnels are public** - Anyone with the URL can access
- **Use authentication** - Enable Saleor's built-in auth
- **Don't commit tunnel URLs** - They're temporary and in `.gitignore`
- **Use named tunnels for production** - With access controls

## Quick Reference

```powershell
# Start individual tunnels
.\tunnel-api.ps1         # Port 8000 - Required
.\tunnel-stripe.ps1      # Port 3002 - Required
.\tunnel-dashboard.ps1   # Port 9000 - Optional
.\tunnel-storefront.ps1  # Port 3000 - Optional

# Start all tunnels at once
.\tunnel-all.ps1         # All four tunnels

# Update configuration
.\setup-environment.ps1 -WithTunnels

# Restart services with new tunnel URLs
docker compose -f docker-compose.dev.yml restart saleor-api saleor-stripe-app
```

## Support

For more information:

- **Main Config Guide**: `CONFIGURATION.md`
- **Quick Start**: `../QUICK-START.md`
- **JWT Fix**: `CRITICAL-JWT-FIX.md`
- **Saleor Discord**: https://saleor.io/discord
