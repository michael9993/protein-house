# Stripe App Installation with Tunnels

When using tunnels (cloudflared, ngrok) to expose your services, the Stripe app installation requires special configuration.

## The Problem

During installation, the Stripe app needs to:

1. **Connect to Saleor API** to verify the app token and fetch the app ID
2. **Be reachable by Saleor** for callbacks during installation

If the Stripe app is using `http://localhost:8000/graphql/` instead of your tunnel URL, installation will fail with:

```
The auth data given during registration request could not be used to fetch app ID.
This usually means that App could not connect to Saleor during installation.
Saleor URL that App tried to connect: http://localhost:8000/graphql/
```

## Solution

### Step 1: Configure Tunnel URLs

Create or update `infra/.env` file:

```env
# API Tunnel URL (used by Dashboard and Stripe app)
DASHBOARD_API_URL=https://your-api-tunnel.trycloudflare.com/graphql/

# Stripe App Tunnel URL (used for callbacks during installation)
STRIPE_APP_URL=https://your-stripe-tunnel.trycloudflare.com
```

### Step 2: Recreate Stripe App Container

The Stripe app needs to be recreated (not just restarted) to pick up new environment variables:

```powershell
cd infra
docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-stripe-app
```

Or use the fix script:

```powershell
cd infra
.\scripts\fix-stripe-tunnel-urls.ps1
```

### Step 3: Verify Configuration

Check that the Stripe app has the correct environment variables:

```powershell
docker compose -f docker-compose.dev.yml exec saleor-stripe-app printenv | Select-String -Pattern "NEXT_PUBLIC_SALEOR_API_URL|APP_URL"
```

You should see:

- `NEXT_PUBLIC_SALEOR_API_URL=https://your-api-tunnel.trycloudflare.com/graphql/`
- `APP_URL=https://your-stripe-tunnel.trycloudflare.com`

### Step 4: Verify Manifest

Check the manifest endpoint to see what URLs the app is reporting:

```powershell
# Should return JSON with appUrl and tokenTargetUrl
Invoke-WebRequest -Uri "https://your-stripe-tunnel.trycloudflare.com/api/manifest" | Select-Object -ExpandProperty Content
```

The `appUrl` should be your Stripe tunnel URL, and the `tokenTargetUrl` should use the same domain.

### Step 5: Install the App

1. **Open Dashboard** via tunnel: `https://your-dashboard-tunnel.trycloudflare.com`
2. **Navigate to Apps** → **Install Stripe**
3. **Or use Manifest URL**:
   - Go to **Extensions** → **Add Extension**
   - Enter: `https://your-stripe-tunnel.trycloudflare.com/api/manifest`
   - Click **Install**

## How It Works

The Stripe app uses two different API URLs:

1. **`SALEOR_API_URL`** (`http://saleor-api:8000/graphql/`):

   - Used for server-to-server communication within Docker
   - This stays as the Docker service name

2. **`NEXT_PUBLIC_SALEOR_API_URL`** (from `DASHBOARD_API_URL`):

   - Used for client-side requests (browser)
   - Used during installation when the app needs to call Saleor from the browser
   - **Must be the tunnel URL** when accessing via tunnel

3. **`APP_URL`** (from `STRIPE_APP_URL`):
   - The public URL where the Stripe app is accessible
   - Used for callbacks during installation
   - **Must be the tunnel URL** when using tunnels

## Troubleshooting

### Still seeing localhost:8000 in errors

1. **Verify .env file exists** in `infra/` directory
2. **Check environment variables** in the container:
   ```powershell
   docker compose -f docker-compose.dev.yml exec saleor-stripe-app printenv
   ```
3. **Force recreate** the container:
   ```powershell
   docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-stripe-app
   ```

### CORS errors during installation

Make sure CORS is configured to allow all origins in development:

- Check `ALLOWED_GRAPHQL_ORIGINS=*` in `docker-compose.dev.yml`
- Restart the API: `docker compose -f docker-compose.dev.yml restart saleor-api`

### App can't reach Saleor API

1. **Test API accessibility** from your machine:
   ```powershell
   Invoke-WebRequest -Uri "https://your-api-tunnel.trycloudflare.com/graphql/" -Method POST
   ```
2. **Check API logs** for connection attempts:
   ```powershell
   docker compose -f docker-compose.dev.yml logs saleor-api | Select-String -Pattern "stripe"
   ```

### Manifest returns wrong URLs

The manifest is generated at runtime using `APP_URL` and `NEXT_PUBLIC_SALEOR_API_URL`. If you see wrong URLs:

1. Verify environment variables are set correctly
2. Restart the Stripe app container
3. Clear browser cache and try again

## Current Configuration

Based on your setup:

- **API Tunnel**: `https://linking-ipod-cup-embedded.trycloudflare.com`
- **Dashboard Tunnel**: `https://sells-juice-soldier-kids.trycloudflare.com`
- **Stripe App Tunnel**: `https://currencies-head-arabic-landscapes.trycloudflare.com`

Your `.env` file should contain:

```env
DASHBOARD_API_URL=https://linking-ipod-cup-embedded.trycloudflare.com/graphql/
STRIPE_APP_URL=https://currencies-head-arabic-landscapes.trycloudflare.com
```

Run the fix script to apply these automatically:

```powershell
cd infra
.\scripts\fix-stripe-tunnel-urls.ps1
```

