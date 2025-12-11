# Fixing JWT Token Issuer URL for Tunnel Installation

## The Problem

When installing the Stripe app via tunnel, you see:

```
Couldn't Install Stripe
The auth data given during registration request could not be used to fetch app ID.
This usually means that App could not connect to Saleor during installation.
Saleor URL that App tried to connect: http://localhost:8000/graphql/
```

Even though:

- The Dashboard is making GraphQL requests to the tunnel URL ✓
- The Dashboard's `API_URL` is set to the tunnel URL ✓
- The Stripe app's `NEXT_PUBLIC_SALEOR_API_URL` is set to the tunnel URL ✓

## Root Cause

The JWT token itself contains `localhost:8000` as the issuer (`iss` field):

```json
{
  "iss": "http://localhost:8000/graphql/",
  ...
}
```

When the Stripe app receives this token during installation, it sees `localhost:8000` in the issuer and tries to connect to that URL, which fails when accessed via tunnel.

## Why This Happens

Saleor generates JWT tokens with an issuer URL (`iss` field). The issuer URL is determined by:

1. **`PUBLIC_URL` environment variable** (if set) - This is the preferred method
2. **Site domain** (if `PUBLIC_URL` is not set) - Falls back to Django Site model

The JWT issuer is built using:

```python
build_absolute_uri(reverse("api"), domain=get_domain())
```

Where `get_domain()` checks `settings.PUBLIC_URL` first.

**If `PUBLIC_URL` is not set, Saleor uses `localhost:8000` as the domain, causing JWT tokens to have `http://localhost:8000/graphql/` as the issuer.**

## Solution

### Step 1: Set PUBLIC_URL Environment Variable

The Saleor API needs `PUBLIC_URL` set to your tunnel URL:

```powershell
cd infra

# Update .env file
@"
PUBLIC_URL=https://refugees-fleece-peterson-incurred.trycloudflare.com
DASHBOARD_API_URL=https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/
STRIPE_APP_URL=https://indiana-decades-burn-cold.trycloudflare.com
"@ | Out-File -FilePath .env -Encoding utf8 -Force
```

**Important**: `PUBLIC_URL` should be the base URL (without `/graphql/`), while `DASHBOARD_API_URL` includes `/graphql/`.

### Step 2: Recreate Saleor API

The API must be recreated to pick up the new `PUBLIC_URL`:

```powershell
docker compose -f docker-compose.dev.yml stop saleor-api
docker compose -f docker-compose.dev.yml rm -f saleor-api
docker compose -f docker-compose.dev.yml up -d saleor-api

# Wait 30 seconds for API to start
Start-Sleep -Seconds 30
```

### Step 3: Verify PUBLIC_URL is Set

Check that the API has the correct `PUBLIC_URL`:

```powershell
docker compose -f docker-compose.dev.yml exec saleor-api printenv PUBLIC_URL
```

Should show: `https://refugees-fleece-peterson-incurred.trycloudflare.com`

### Step 4: Get a New JWT Token

**CRITICAL**: Existing JWT tokens still have `localhost:8000` as the issuer. You need to get a new token:

1. **Log out** of the Dashboard
2. **Log back in** - This will generate a new JWT token with the correct issuer
3. Or use an **incognito/private window** to force a fresh login

### Step 5: Verify JWT Token Issuer

After logging in, check the JWT token in browser DevTools:

1. Open Dashboard → DevTools (F12) → Network tab
2. Find a GraphQL request → Headers → `authorization-bearer`
3. Decode the JWT token (use jwt.io or browser console)
4. Check the `iss` field - it should be: `https://refugees-fleece-peterson-incurred.trycloudflare.com/graphql/`
5. **NOT**: `http://localhost:8000/graphql/`

### Step 6: Try Installing Stripe Again

1. Navigate to **Extensions** → **Add Extension**
2. Enter manifest URL: `https://indiana-decades-burn-cold.trycloudflare.com/api/manifest`
3. Click **Install**

The Stripe app should now receive a JWT token with the tunnel URL as the issuer.

## Quick Fix Script

Use the fix script:

```powershell
cd infra
.\scripts\fix-api-public-url.ps1
```

This script will:

1. Update `.env` file with `PUBLIC_URL`
2. Recreate the Saleor API
3. Recreate Dashboard and Stripe app
4. Verify the configuration

## Why This Fixes It

When `PUBLIC_URL` is set:

- JWT tokens will have `https://your-tunnel.trycloudflare.com/graphql/` as the issuer
- The Stripe app will see the tunnel URL in the token
- The Stripe app will connect to the tunnel URL instead of `localhost:8000`

## Verification Checklist

- [ ] `.env` file has `PUBLIC_URL` set to tunnel URL (without `/graphql/`)
- [ ] Saleor API container has `PUBLIC_URL` environment variable set
- [ ] Logged out and logged back into Dashboard (to get new JWT token)
- [ ] JWT token has tunnel URL as issuer (check in DevTools)
- [ ] Stripe app installation succeeds

## If Still Not Working

1. **Check JWT token issuer**: Decode the token and verify `iss` field
2. **Ensure you logged out/in**: Old tokens still have `localhost:8000`
3. **Check API logs**: `docker compose -f docker-compose.dev.yml logs saleor-api`
4. **Verify PUBLIC_URL**: `docker compose -f docker-compose.dev.yml exec saleor-api printenv PUBLIC_URL`

## Important Notes

- `PUBLIC_URL` should be the **base URL** (e.g., `https://api.trycloudflare.com`)
- `DASHBOARD_API_URL` should be the **GraphQL endpoint** (e.g., `https://api.trycloudflare.com/graphql/`)
- The JWT issuer will be: `{PUBLIC_URL}/graphql/`
- You **must log out and log back in** after setting `PUBLIC_URL` to get a new token
