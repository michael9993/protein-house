# Fixing Stripe App Installation via Extensions Page

## The Problem

When installing the Stripe app via the Dashboard's **Extensions** page, you see:

```
Couldn't Install Stripe
The auth data given during registration request could not be used to fetch app ID.
This usually means that App could not connect to Saleor during installation.
Saleor URL that App tried to connect: http://localhost:8000/graphql/
```

## Root Cause

When you install an app via the **Extensions** page in the Dashboard:

1. The Dashboard reads its own `API_URL` environment variable
2. It sends that URL to the Stripe app's `/api/register` endpoint
3. The Stripe app uses that URL to connect back to Saleor

**If the Dashboard's `API_URL` is set to `localhost:8000`, it will send that to the Stripe app!**

## Solution

### Step 1: Ensure Dashboard is Using Tunnel URL

The Dashboard must be configured with the tunnel URL for the API:

```powershell
cd infra

# Update .env file
@"
DASHBOARD_API_URL=https://your-api-tunnel.trycloudflare.com/graphql/
STRIPE_APP_URL=https://your-stripe-tunnel.trycloudflare.com
"@ | Out-File -FilePath .env -Encoding utf8 -Force

# Recreate Dashboard to pick up new URL
docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-dashboard
```

### Step 2: Verify Dashboard is Using Tunnel URL

1. **Check Dashboard environment**:

   ```powershell
   docker compose -f docker-compose.dev.yml exec saleor-dashboard printenv API_URL
   ```

   Should show: `https://your-api-tunnel.trycloudflare.com/graphql/`

2. **Test in browser**:
   - Open Dashboard via tunnel
   - Open DevTools (F12) → Network tab
   - Look for GraphQL requests
   - They should go to the tunnel URL, NOT localhost:8000

### Step 3: Recreate Stripe App

Even though the Stripe app should use `NEXT_PUBLIC_SALEOR_API_URL`, it's good to ensure it's set correctly:

```powershell
docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-stripe-app
```

### Step 4: Try Installation Again

1. Open Dashboard via tunnel
2. Navigate to **Extensions** → **Add Extension**
3. Enter manifest URL: `https://your-stripe-tunnel.trycloudflare.com/api/manifest`
4. Click **Install**

## Why This Happens

The Dashboard's `API_URL` is used for:

- Making GraphQL requests to Saleor
- **Sending the API URL to apps during installation**

When the Dashboard sends the installation request to the Stripe app, it includes the Saleor API URL. If that URL is `localhost:8000`, the Stripe app will try to use it, which fails when accessed via tunnel.

## Important: Dashboard Must Use Tunnel URL

**The Dashboard's `API_URL` must be the tunnel URL when accessing via tunnel!**

This is because:

1. The Dashboard needs to make GraphQL requests (uses `API_URL`)
2. The Dashboard sends `API_URL` to apps during installation
3. Both need to work through the tunnel

## Quick Fix Script

Use the update script to fix everything at once:

```powershell
cd infra
.\scripts\update-current-tunnels.ps1
```

This will:

1. Update `.env` with your current tunnel URLs
2. Recreate Dashboard and Stripe app
3. Verify the configuration

## Verification Checklist

- [ ] `.env` file has `DASHBOARD_API_URL` set to tunnel URL
- [ ] Dashboard container has `API_URL` set to tunnel URL
- [ ] Dashboard makes GraphQL requests to tunnel URL (check browser DevTools)
- [ ] Stripe app has `NEXT_PUBLIC_SALEOR_API_URL` set to tunnel URL
- [ ] Hard refresh browser after changes

## If Still Not Working

The Stripe app code might be using the URL from the Dashboard request instead of the environment variable. In that case, you may need to modify the Stripe app code to always use `process.env.NEXT_PUBLIC_SALEOR_API_URL` and ignore the URL from the request.

Check the Stripe app's register endpoint code (in `../../apps/apps/stripe`) and ensure it uses the environment variable, not the request parameter.
