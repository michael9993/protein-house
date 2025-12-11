# Debugging Stripe App Installation with Tunnels

## The Persistent Problem

Even after setting environment variables and recreating containers, the Stripe app still tries to connect to `http://localhost:8000/graphql/` during installation.

## Root Cause Analysis

The issue might be that the **Dashboard** is sending `localhost:8000` to the Stripe app during installation, not the Stripe app itself.

### How Installation Works

1. User clicks "Install Stripe" in Dashboard
2. Dashboard sends installation request to Stripe app's `/api/register` endpoint
3. The request includes the Saleor API URL that Dashboard knows about
4. Stripe app uses that URL to verify the app token

**If the Dashboard is configured with `localhost:8000`, it will send that to the Stripe app!**

## Solution: Fix Dashboard First

### Step 1: Verify Dashboard Environment

```powershell
cd infra
docker compose -f docker-compose.dev.yml exec saleor-dashboard printenv API_URL VITE_API_URL
```

Both should show the tunnel URL:

- `API_URL=https://linking-ipod-cup-embedded.trycloudflare.com/graphql/`
- `VITE_API_URL=https://linking-ipod-cup-embedded.trycloudflare.com/graphql/`

### Step 2: If Dashboard Shows localhost

1. **Ensure .env file exists** in `infra/` directory:

   ```env
   DASHBOARD_API_URL=https://linking-ipod-cup-embedded.trycloudflare.com/graphql/
   ```

2. **Recreate Dashboard container**:

   ```powershell
   docker compose -f docker-compose.dev.yml up -d --force-recreate saleor-dashboard
   ```

3. **Wait 30 seconds** for Dashboard to start

4. **Hard refresh browser** (Ctrl+Shift+R)

### Step 3: Verify Dashboard is Using Tunnel URL

1. Open Dashboard: `https://sells-juice-soldier-kids.trycloudflare.com`
2. Open DevTools (F12) → Network tab
3. Look for GraphQL requests
4. They should go to: `https://linking-ipod-cup-embedded.trycloudflare.com/graphql/`
5. **NOT** `http://localhost:8000/graphql/`

### Step 4: Try Installing Stripe Again

Once Dashboard is using the tunnel URL, it should send the correct URL to the Stripe app during installation.

## Alternative: Check Stripe App Code

If the issue persists, the Stripe app code might be:

1. Hardcoding the URL
2. Getting it from a different source
3. Not reading `NEXT_PUBLIC_SALEOR_API_URL` correctly

To check, look at the Stripe app's register endpoint code (in `../../apps/apps/stripe`):

- Check `apps/stripe/src/pages/api/register.ts` or similar
- Look for where it gets the Saleor API URL
- It should use `process.env.NEXT_PUBLIC_SALEOR_API_URL`

## Nuclear Option

If nothing works, try the nuclear fix script:

```powershell
cd infra
.\scripts\fix-stripe-nuclear.ps1
```

This will:

- Remove all caches
- Remove volumes
- Recreate everything from scratch

## Verification Checklist

- [ ] `.env` file exists in `infra/` with `DASHBOARD_API_URL` set
- [ ] Dashboard container has correct `API_URL` environment variable
- [ ] Dashboard is making requests to tunnel URL (check browser DevTools)
- [ ] Stripe app container has correct `NEXT_PUBLIC_SALEOR_API_URL` environment variable
- [ ] Next.js cache is cleared
- [ ] Browser cache is cleared
- [ ] Hard refresh performed (Ctrl+Shift+R)

## If Still Not Working

The Stripe app code might need to be modified. Check:

1. How the register endpoint gets the Saleor API URL
2. If it's using the URL from the Dashboard's request instead of environment variable
3. If there's a hardcoded fallback to localhost

You may need to modify the Stripe app code to:

- Always use `process.env.NEXT_PUBLIC_SALEOR_API_URL`
- Not trust the URL from the Dashboard request
- Log what URL it's actually using for debugging

