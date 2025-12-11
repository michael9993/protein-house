# CORS: Accept All Origins in Development

## Overview

When using tunnels (cloudflared, ngrok), tunnel URLs change every time you restart the tunnels. To avoid manually updating CORS configuration each time, we've configured the system to **accept all origins** in development mode.

## Current Configuration

### Saleor API (Django/ASGI)

✅ **Already configured to allow all origins** in development:

```yaml
# docker-compose.dev.yml
ALLOWED_GRAPHQL_ORIGINS: ${ALLOWED_GRAPHQL_ORIGINS:-*}
```

The `*` wildcard allows **all origins**, including:

- All localhost URLs
- All tunnel URLs (trycloudflare.com, ngrok.io, etc.)
- Any other origin

**Location**: `saleor/saleor/settings.py` and `saleor/saleor/asgi/cors_handler.py`

### Dashboard (Vite)

✅ **Updated to allow all hosts** in development:

```javascript
// dashboard/vite.config.js
server: {
  allowedHosts: isDev ? true : [],  // Allows all hosts in dev mode
}
```

This allows the Dashboard to accept requests from **any host**, including all tunnel URLs.

### Storefront (Next.js)

Next.js doesn't have the same host restrictions, but CORS is handled by the API (which already allows all origins).

### Stripe App (Next.js)

Same as Storefront - CORS is handled by the API.

## How It Works

### Development Mode (`DEBUG=True` or `NODE_ENV=development`)

- **Saleor API**: `ALLOWED_GRAPHQL_ORIGINS=*` allows all origins
- **Dashboard**: `allowedHosts: true` allows all hosts
- **No manual configuration needed** - any tunnel URL will work automatically

### Production Mode

⚠️ **Never use `*` in production!** You must set specific allowed origins:

```yaml
ALLOWED_GRAPHQL_ORIGINS: "https://yourdomain.com,https://api.yourdomain.com"
```

## Verification

### Check API CORS Configuration

```powershell
# Check environment variable
docker compose -f infra/docker-compose.dev.yml exec saleor-api printenv ALLOWED_GRAPHQL_ORIGINS

# Should show: *
```

### Test CORS from Any Origin

You can test from any tunnel URL - it should work:

```powershell
# Test from any tunnel URL
Invoke-WebRequest -Uri "https://any-tunnel-url.trycloudflare.com/graphql/" `
  -Method POST `
  -Headers @{"Origin"="https://any-other-tunnel-url.trycloudflare.com"} `
  -ContentType "application/json" `
  -Body '{"query":"{ __typename }"}'
```

Should return 200 OK (not a CORS error).

## Benefits

✅ **No manual configuration** - works with any tunnel URL automatically  
✅ **No restarts needed** - CORS accepts all origins dynamically  
✅ **Works with cloudflared, ngrok, or any tunnel service**  
✅ **Safe in development** - only applies when `DEBUG=True`

## Important Notes

1. **Development Only**: This configuration is safe because:

   - `DEBUG=True` in development
   - `NODE_ENV=development` for frontend apps
   - Production uses specific allowed origins

2. **Tunnel URLs Still Need Configuration**: While CORS accepts all origins, the apps themselves still need to know the correct API URL:

   - Dashboard needs `DASHBOARD_API_URL` to know where to send GraphQL requests
   - Stripe app needs `NEXT_PUBLIC_SALEOR_API_URL` for the same reason
   - But you can use the auto-detect script to update these automatically

3. **Auto-Detection Script**: Use `infra/scripts/auto-detect-tunnel-urls.ps1` to automatically update tunnel URLs when they change.

## Troubleshooting

### Still Getting CORS Errors?

1. **Verify CORS is set to `*`**:

   ```powershell
   docker compose -f infra/docker-compose.dev.yml exec saleor-api printenv ALLOWED_GRAPHQL_ORIGINS
   ```

2. **Restart API** to pick up changes:

   ```powershell
   docker compose -f infra/docker-compose.dev.yml restart saleor-api
   ```

3. **Check CORS handler logs**:
   ```powershell
   docker compose -f infra/docker-compose.dev.yml logs saleor-api | Select-String -Pattern "CORS|origin"
   ```

### Dashboard Blocked Host Error?

1. **Verify Vite config** has `allowedHosts: true` in development
2. **Restart Dashboard**:
   ```powershell
   docker compose -f infra/docker-compose.dev.yml restart saleor-dashboard
   ```

## Summary

✅ **CORS is configured to accept all origins in development**  
✅ **No manual updates needed when tunnel URLs change**  
✅ **Works automatically with any tunnel service**  
✅ **Safe - only applies in development mode**

You can now use any tunnel URL without worrying about CORS configuration!
