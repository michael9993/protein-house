# Tunnel CORS Configuration Guide

When using tunnels (cloudflared, ngrok) to expose your Saleor services, you need to configure CORS to allow cross-origin requests between your tunnel URLs.

## Quick Setup

### 1. Configure Tunnel URLs

Use the helper script to set up your tunnel URLs:

```powershell
cd infra
.\scripts\configure-tunnel-urls.ps1 `
    -ApiTunnelUrl "https://linking-ipod-cup-embedded.trycloudflare.com" `
    -DashboardTunnelUrl "https://sells-juice-soldier-kids.trycloudflare.com" `
    -StripeTunnelUrl "https://currencies-head-arabic-landscapes.trycloudflare.com"
```

This will:

- Set `DASHBOARD_API_URL` to your API tunnel URL
- Configure other services to use tunnel URLs
- Save configuration to `.env` file

### 2. Verify CORS Configuration

The Saleor API is configured to allow all origins in development mode:

```yaml
# In docker-compose.dev.yml
ALLOWED_GRAPHQL_ORIGINS: "*"
```

This allows:

- All localhost origins
- All tunnel URLs (trycloudflare.com, ngrok.io, etc.)
- Any other origin in development

**⚠️ Warning:** Never use `*` in production! Set specific origins.

### 3. Restart Services

After configuring tunnel URLs, restart the affected services:

```powershell
docker compose -f infra/docker-compose.dev.yml restart saleor-dashboard saleor-storefront saleor-stripe-app
```

## Manual Configuration

If you prefer to configure manually:

### Option 1: Environment Variables

Create or update `infra/.env`:

```env
# API Tunnel URL (used by Dashboard and Storefront)
DASHBOARD_API_URL=https://your-api-tunnel.trycloudflare.com/graphql/

# Stripe App URL
STRIPE_APP_URL=https://your-stripe-tunnel.trycloudflare.com

# Storefront URL (optional)
NEXT_PUBLIC_STOREFRONT_URL=https://your-storefront-tunnel.trycloudflare.com
```

### Option 2: Docker Compose Override

You can also set these directly in `docker-compose.dev.yml` or use environment variables:

```powershell
$env:DASHBOARD_API_URL="https://your-api-tunnel.trycloudflare.com/graphql/"
docker compose -f infra/docker-compose.dev.yml up -d
```

## How CORS Works

### Saleor API (Django)

The API uses a custom CORS handler (`saleor/saleor/asgi/cors_handler.py`) that:

1. Checks the `Origin` header of incoming requests
2. Matches it against `ALLOWED_GRAPHQL_ORIGINS`
3. Supports:
   - `*` - Allows all origins (development only)
   - Wildcard patterns like `https://*.trycloudflare.com`
   - Specific origins like `https://example.com`

### Dashboard (Vite)

The Dashboard's Vite config allows tunnel hosts:

```javascript
// dashboard/vite.config.js
server: {
  allowedHosts: [
    ".trycloudflare.com", // Matches *.trycloudflare.com
    ".ngrok.io",
    // ...
  ];
}
```

### Storefront (Next.js)

Next.js doesn't have the same host restrictions, but you need to configure the API URL:

```env
NEXT_PUBLIC_SALEOR_API_URL=https://your-api-tunnel.trycloudflare.com/graphql/
```

## Troubleshooting

### CORS Error: "No 'Access-Control-Allow-Origin' header"

**Problem:** The API is rejecting requests from your tunnel URL.

**Solution:**

1. Verify `ALLOWED_GRAPHQL_ORIGINS=*` in `docker-compose.dev.yml`
2. Restart the API: `docker compose -f infra/docker-compose.dev.yml restart saleor-api`
3. Check API logs: `docker compose -f infra/docker-compose.dev.yml logs saleor-api`

### Dashboard Can't Connect to API

**Problem:** Dashboard is trying to connect to `localhost:8000` instead of tunnel URL.

**Solution:**

1. Set `DASHBOARD_API_URL` environment variable
2. Restart Dashboard: `docker compose -f infra/docker-compose.dev.yml restart saleor-dashboard`
3. Verify in browser DevTools that requests go to tunnel URL

### Mixed Content Warnings

**Problem:** HTTPS tunnel trying to connect to HTTP localhost.

**Solution:**

- Always use tunnel URLs for API connections when accessing via tunnel
- Ensure `DASHBOARD_API_URL` uses `https://` not `http://`

## Current Tunnel URLs

Based on your setup:

- **API:** `https://linking-ipod-cup-embedded.trycloudflare.com`
- **Dashboard:** `https://sells-juice-soldier-kids.trycloudflare.com`
- **Stripe App:** `https://currencies-head-arabic-landscapes.trycloudflare.com`

Configure these using the script:

```powershell
.\scripts\configure-tunnel-urls.ps1 `
    -ApiTunnelUrl "https://linking-ipod-cup-embedded.trycloudflare.com" `
    -DashboardTunnelUrl "https://sells-juice-soldier-kids.trycloudflare.com" `
    -StripeTunnelUrl "https://currencies-head-arabic-landscapes.trycloudflare.com"
```

## Production Considerations

In production:

1. **Never use `*` for CORS** - Set specific allowed origins
2. **Use specific tunnel URLs** - Don't rely on wildcards
3. **Enable HTTPS** - All tunnel URLs should use HTTPS
4. **Set proper ALLOWED_HOSTS** - Only allow your production domains

Example production configuration:

```yaml
ALLOWED_GRAPHQL_ORIGINS: "https://dashboard.yourdomain.com,https://storefront.yourdomain.com"
ALLOWED_HOSTS: "api.yourdomain.com"
```
