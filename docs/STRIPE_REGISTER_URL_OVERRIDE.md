# Stripe App Register Endpoint URL Override

## The Problem

When installing the Stripe app via tunnel, the installation fails with:

```
Couldn't Install Stripe
The auth data given during registration request could not be used to fetch app ID.
This usually means that App could not connect to Saleor during installation.
Saleor URL that App tried to connect: http://localhost:8000/graphql/
```

Even though:

- `NEXT_PUBLIC_SALEOR_API_URL` is set to the tunnel URL
- The Dashboard is using the tunnel URL
- The JWT token issuer is set to the tunnel URL (via `PUBLIC_URL`)

## Root Cause

The Stripe app's `/api/register` endpoint receives the Saleor API URL from the **request headers** that Saleor sends during installation. This URL comes from the JWT token's `iss` field.

Even if you set `PUBLIC_URL` and get a new JWT token, if there's any cached token or the Dashboard sends an old token, the register endpoint will receive `localhost:8000` in the headers.

## Solution

We've modified the Stripe app's register endpoint to **override the URL from the request headers** with the environment variable `NEXT_PUBLIC_SALEOR_API_URL` if:

1. `NEXT_PUBLIC_SALEOR_API_URL` is set
2. The incoming URL from headers contains `localhost:8000`

### Code Changes

**File**: `apps/apps/stripe/src/app/api/register/route.ts`

Added a middleware function `overrideSaleorApiUrl` that:

- Checks if `NEXT_PUBLIC_SALEOR_API_URL` environment variable is set
- Checks if the incoming URL from request headers contains `localhost:8000`
- If both conditions are true, replaces the header with the environment variable value
- Logs the override for debugging

The handler is now wrapped to apply this override before processing:

```typescript
const wrappedHandler = async (req: NextRequest) => {
  const modifiedReq = await overrideSaleorApiUrl(req);
  return handler(modifiedReq);
};
```

## How It Works

1. **Saleor sends installation request** to Stripe app's `/api/register` endpoint
2. **Request includes headers** with `saleor-api-url` header set to `http://localhost:8000/graphql/` (from JWT token issuer)
3. **Override middleware intercepts** the request
4. **Checks environment variable** `NEXT_PUBLIC_SALEOR_API_URL`
5. **If set and URL is localhost**, replaces the header with the environment variable value
6. **Handler processes** the modified request with the correct tunnel URL
7. **Stripe app connects** to Saleor using the tunnel URL instead of localhost

## Configuration

Ensure `NEXT_PUBLIC_SALEOR_API_URL` is set in the Stripe app's environment:

```yaml
# infra/docker-compose.dev.yml
saleor-stripe-app:
  environment:
    NEXT_PUBLIC_SALEOR_API_URL: ${DASHBOARD_API_URL:-http://localhost:8000/graphql/}
```

When using tunnels, set it in `.env`:

```env
DASHBOARD_API_URL=https://your-api-tunnel.trycloudflare.com/graphql/
```

## Verification

After making this change:

1. **Restart the Stripe app container**:

   ```powershell
   cd infra
   docker compose -f docker-compose.dev.yml restart saleor-stripe-app
   ```

2. **Check the logs** for the override message:

   ```powershell
   docker compose -f docker-compose.dev.yml logs saleor-stripe-app | Select-String -Pattern "Overriding Saleor API URL"
   ```

3. **Try installing the Stripe app again** via Dashboard Extensions page

4. **The installation should succeed** because the app will use the tunnel URL from the environment variable

## Benefits

- **Works even with old JWT tokens**: The override ensures the correct URL is used regardless of what's in the token
- **No need to log out/in**: You don't need to get a new JWT token for this to work
- **Automatic**: Once configured, it works automatically for all installations
- **Logging**: The override is logged so you can verify it's working

## Important Notes

- This override **only applies when** the incoming URL contains `localhost:8000`
- If `NEXT_PUBLIC_SALEOR_API_URL` is not set, the original URL from headers is used
- The override is logged for debugging purposes
- This is a **development/tunnel-specific fix** - in production, the JWT token should have the correct issuer URL

## Alternative Solutions

If you prefer not to modify the Stripe app code:

1. **Set `PUBLIC_URL` in Saleor API** (recommended)
2. **Log out and log back into Dashboard** to get a new JWT token with correct issuer
3. **Install the Stripe app** - it should work with the correct token

However, the code override is more reliable because it works even if there are cached tokens or other issues.
