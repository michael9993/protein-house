# Fixing Stripe App Register Endpoint with Tunnels

## The Problem

When installing the Stripe app via tunnel, you see this error:

```
The auth data given during registration request could not be used to fetch app ID.
This usually means that App could not connect to Saleor during installation.
Saleor URL that App tried to connect: http://localhost:8000/graphql/
```

## Root Cause

The `/api/register` endpoint in the Stripe app is making a request to Saleor API, but it's using `http://localhost:8000/graphql/` which doesn't work when:

1. The app is accessed via tunnel (HTTPS)
2. The browser is making the request from a tunnel URL
3. The API is also behind a tunnel

The register endpoint needs to use the **tunnel URL** for the Saleor API, not localhost.

## Solution

### Step 1: Ensure .env File Has Tunnel URL

Create or update `infra/.env`:

```env
DASHBOARD_API_URL=https://linking-ipod-cup-embedded.trycloudflare.com/graphql/
STRIPE_APP_URL=https://currencies-head-arabic-landscapes.trycloudflare.com
```

### Step 2: Clear Next.js Cache and Recreate Container

The Stripe app is a Next.js app, and Next.js caches environment variables. You need to:

1. **Clear the Next.js cache**
2. **Recreate the container** (not just restart)

```powershell
cd infra

# Clear Next.js cache
docker compose -f docker-compose.dev.yml exec -T saleor-stripe-app sh -c "rm -rf /app/apps/stripe/.next" 2>&1

# Stop and remove container
docker compose -f docker-compose.dev.yml stop saleor-stripe-app
docker compose -f docker-compose.dev.yml rm -f saleor-stripe-app

# Recreate with new environment
docker compose -f docker-compose.dev.yml up -d saleor-stripe-app

# Wait for it to start
Start-Sleep -Seconds 25
```

Or use the fix script:

```powershell
cd infra
.\scripts\fix-stripe-complete.ps1
```

### Step 3: Verify Environment Variables

Check that the container has the correct values:

```powershell
docker compose -f docker-compose.dev.yml exec saleor-stripe-app sh -c "printenv | grep SALEOR_API_URL"
```

You should see:

- `NEXT_PUBLIC_SALEOR_API_URL=https://linking-ipod-cup-embedded.trycloudflare.com/graphql/`

### Step 4: Test the Register Endpoint

The register endpoint should now use the tunnel URL. You can verify by:

1. Opening browser DevTools (F12)
2. Going to Network tab
3. Trying to install the Stripe app
4. Looking for the `/api/register` request
5. Check the request payload - it should contain the tunnel URL

## Why This Happens

The Stripe app's register endpoint (`/api/register`) is a Next.js API route that:

1. Receives installation data from the Dashboard
2. Needs to verify the app token with Saleor
3. Makes a GraphQL request to Saleor API

If `NEXT_PUBLIC_SALEOR_API_URL` is set to `http://localhost:8000/graphql/`, the browser tries to connect to localhost, which:

- Doesn't work when accessed via tunnel (mixed content/HTTPS)
- Can't reach the API through the tunnel

## Important Notes

- **`NEXT_PUBLIC_SALEOR_API_URL`** is used by client-side code (browser)
- **`SALEOR_API_URL`** is used by server-side code (Docker internal)
- The register endpoint runs **client-side** (in the browser), so it needs `NEXT_PUBLIC_SALEOR_API_URL`
- Next.js caches environment variables, so you must **clear the cache** and **recreate the container**

## Troubleshooting

### Still seeing localhost:8000

1. **Verify .env file exists** and has correct values
2. **Clear Next.js cache**: `docker compose -f docker-compose.dev.yml exec saleor-stripe-app sh -c "rm -rf /app/apps/stripe/.next"`
3. **Force recreate container**: `docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-stripe-app`
4. **Wait 30 seconds** for Next.js to fully start
5. **Hard refresh browser** (Ctrl+Shift+R)

### Check Container Logs

```powershell
docker compose -f docker-compose.dev.yml logs saleor-stripe-app | Select-String -Pattern "SALEOR_API_URL|register"
```

### Verify Environment in Container

```powershell
docker compose -f docker-compose.dev.yml exec saleor-stripe-app printenv NEXT_PUBLIC_SALEOR_API_URL
```

This should show the tunnel URL, not localhost.

