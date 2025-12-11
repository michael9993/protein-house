# Tunneling Guide for Saleor Services

This guide explains how to create tunnels for your local Saleor services to make them accessible from the internet.

## Why Use Tunnels?

Tunnels allow external services (like Stripe webhooks, OAuth callbacks, etc.) to reach your local development environment. This is essential for:

- Testing webhooks from external services
- OAuth authentication flows
- Sharing your local environment with team members
- Testing mobile apps that need to connect to your backend

## Available Services

- **Port 8000**: Saleor API (GraphQL endpoint)
- **Port 9000**: Saleor Dashboard
- **Port 3002**: Stripe App

## Quick Start

### Option 1: Tunnel All Services (Recommended)

Tunnel all three services at once:

```powershell
.\infra\scripts\tunnel-all.ps1
```

This will create tunnels for:

- Saleor API (port 8000)
- Dashboard (port 9000)
- Stripe App (port 3002)

### Option 2: Tunnel Individual Services

Tunnel specific services as needed:

```powershell
# Saleor API only
.\infra\scripts\tunnel-api.ps1

# Dashboard only
.\infra\scripts\tunnel-dashboard.ps1

# Stripe App only
.\infra\scripts\tunnel-stripe.ps1
```

### Option 3: Custom Ports

Tunnel any combination of ports:

```powershell
.\infra\scripts\tunnel-services.ps1 -Ports @("8000", "9000")
```

## Using Cloudflared (Recommended)

Cloudflared is free, requires no account, and handles multiple ports easily.

### Installation

Cloudflared will be automatically installed if not found. Or install manually:

```powershell
winget install --id Cloudflare.cloudflared -e
```

### Usage

```powershell
# All services
.\infra\scripts\tunnel-all.ps1

# Or with explicit tool selection
.\infra\scripts\tunnel-all.ps1 -Tool cloudflared
```

### Output

You'll see output like:

```
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at:                                         |
|  https://api-service.trycloudflare.com                                                     |
+--------------------------------------------------------------------------------------------+
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at:                                         |
|  https://dashboard-service.trycloudflare.com                                               |
+--------------------------------------------------------------------------------------------+
+--------------------------------------------------------------------------------------------+
|  Your quick Tunnel has been created! Visit it at:                                         |
|  https://stripe-app-service.trycloudflare.com                                              |
+--------------------------------------------------------------------------------------------+
```

**Note:** Each service gets its own unique tunnel URL.

## Using Ngrok

Ngrok requires an account but offers more features and persistent URLs.

### Installation

Download from: https://ngrok.com/download

### Usage

```powershell
# Single port (requires separate terminals for multiple ports)
.\infra\scripts\tunnel-api.ps1 -Tool ngrok
.\infra\scripts\tunnel-dashboard.ps1 -Tool ngrok
.\infra\scripts\tunnel-stripe.ps1 -Tool ngrok
```

### Multiple Ports with Ngrok

For multiple ports, you need separate terminals or an ngrok config file:

```powershell
# Terminal 1
ngrok http 8000

# Terminal 2
ngrok http 9000

# Terminal 3
ngrok http 3002
```

## Use Cases

### 1. Stripe Webhooks

Tunnel the Stripe app (port 3002) and use the tunnel URL in Stripe Dashboard:

```powershell
.\infra\scripts\tunnel-stripe.ps1
# Use the provided URL: https://your-tunnel.trycloudflare.com
# In Stripe Dashboard: https://your-tunnel.trycloudflare.com/api/webhooks/stripe
```

### 2. OAuth Callbacks

Tunnel the API (port 8000) for OAuth redirects:

```powershell
.\infra\scripts\tunnel-api.ps1
# Use the tunnel URL as your OAuth redirect URI
```

### 3. External API Testing

Tunnel the API to test from external tools or mobile apps:

```powershell
.\infra\scripts\tunnel-api.ps1
# Use the tunnel URL as your GraphQL endpoint
```

### 4. Dashboard Access

Tunnel the Dashboard for remote access:

```powershell
.\infra\scripts\tunnel-dashboard.ps1
# Share the tunnel URL with team members
```

## Important Notes

### Tunnel URLs Change

- **Cloudflared quick tunnels**: URLs change every time you restart the tunnel
- **Ngrok free tier**: URLs change unless you have a paid plan
- For production, use named tunnels or paid plans for persistent URLs

### Security

- Quick tunnels are public - anyone with the URL can access your services
- Don't use tunnels for production without proper authentication
- Consider using authentication or IP restrictions

### Performance

- Tunnels add latency (usually 50-200ms)
- Not suitable for high-performance testing
- Use only for development and testing

## Troubleshooting

### Tunnel Not Connecting?

1. **Check service is running**:

```powershell
docker compose -f infra/docker-compose.dev.yml ps
```

2. **Verify port is accessible locally**:

```powershell
# Test API
curl http://localhost:8000/graphql/

# Test Dashboard
curl http://localhost:9000

# Test Stripe App
curl http://localhost:3002/api/manifest
```

3. **Check firewall**: Ensure your firewall allows the tunnel tool

### Multiple Tunnels Confusing?

Each service gets its own tunnel URL. Keep track of which URL corresponds to which service:

- First URL = First port (usually 8000)
- Second URL = Second port (usually 9000)
- Third URL = Third port (usually 3002)

Or use individual tunnel scripts for clarity.

### Cloudflared Not Found?

1. Restart PowerShell after installation
2. Or use the full path shown in the script output
3. Or manually add cloudflared to your PATH

## Advanced: Named Tunnels (Cloudflared)

For persistent URLs, set up a named tunnel:

```bash
# Login to Cloudflare
cloudflared tunnel login

# Create a named tunnel
cloudflared tunnel create saleor-dev

# Configure the tunnel
# Edit ~/.cloudflared/config.yml
```

See: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

## Quick Reference

| Service    | Port | Script                 | Use Case       |
| ---------- | ---- | ---------------------- | -------------- |
| Saleor API | 8000 | `tunnel-api.ps1`       | GraphQL, OAuth |
| Dashboard  | 9000 | `tunnel-dashboard.ps1` | Admin access   |
| Stripe App | 3002 | `tunnel-stripe.ps1`    | Webhooks       |

**All Services**: `tunnel-all.ps1`
