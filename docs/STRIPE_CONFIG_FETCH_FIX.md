# Fixing "App failed to fetch config" Error in Stripe App

## The Problem

After successfully installing the Stripe app, when you try to configure it, you see:

```
Error fetching config: App failed to fetch config, please contact Saleor
```

This error appears in:

- **Stripe configurations** section
- **Channels configurations** section

## Root Cause

The Stripe app uses tRPC to fetch configuration from Saleor. The tRPC context gets the Saleor API URL from request headers, which may still contain `localhost:8000` even after installation.

The issue occurs in this flow:

1. **Frontend makes tRPC request** → Includes `saleor-api-url` header (might be `localhost:8000`)
2. **tRPC context reads header** → Gets `localhost:8000`
3. **Looks up auth data in APL** → Uses `localhost:8000` as key
4. **Auth data not found** → Because it was stored with tunnel URL during installation
5. **Error thrown** → "Missing auth data" or "App failed to fetch config"

## Solution

We've added URL override logic in two places:

### 1. tRPC Context (`context-app-router.ts`)

**File**: `apps/apps/stripe/src/modules/trpc/context-app-router.ts`

Added `overrideSaleorApiUrl` function that:

- Checks if `NEXT_PUBLIC_SALEOR_API_URL` is set
- Checks if incoming URL contains `localhost:8000`
- If both true, replaces with environment variable value
- Normalizes URLs to ensure consistent format (trailing `/graphql/`)

### 2. Register Endpoint (`register/route.ts`)

**File**: `apps/apps/stripe/src/app/api/register/route.ts`

Already has override logic (from previous fix) that ensures installation uses the tunnel URL.

## How It Works

1. **Frontend makes tRPC request** with `saleor-api-url: localhost:8000` header
2. **tRPC context override** intercepts and replaces with tunnel URL from `NEXT_PUBLIC_SALEOR_API_URL`
3. **APL lookup** uses tunnel URL → Finds auth data stored during installation
4. **Config fetch succeeds** → App can now fetch configuration from Saleor

## Configuration

Ensure `NEXT_PUBLIC_SALEOR_API_URL` is set correctly:

```yaml
# infra/docker-compose.dev.yml
saleor-stripe-app:
  environment:
    NEXT_PUBLIC_SALEOR_API_URL: ${DASHBOARD_API_URL:-http://localhost:8000/graphql/}
```

When using tunnels, set in `.env`:

```env
DASHBOARD_API_URL=https://your-api-tunnel.trycloudflare.com/graphql/
```

## Verification

After making these changes:

1. **Restart the Stripe app container**:

   ```powershell
   cd infra
   docker compose -f docker-compose.dev.yml restart saleor-stripe-app
   ```

2. **Wait 30 seconds** for the app to restart

3. **Refresh the Stripe app page** in the Dashboard

4. **Check the logs** for override messages:

   ```powershell
   docker compose -f docker-compose.dev.yml logs saleor-stripe-app | Select-String -Pattern "Overriding Saleor API URL"
   ```

5. **The configuration should now load** without errors

## Debugging

If you still see the error, check the logs:

```powershell
docker compose -f docker-compose.dev.yml logs saleor-stripe-app | Select-String -Pattern "authData|saleorApiUrl|APL"
```

Look for:

- "Overriding Saleor API URL in tRPC context" - confirms override is working
- "Auth data found in APL" - confirms auth data lookup succeeded
- "Auth data not found in APL" - indicates APL lookup failed (URL mismatch or missing data)

## Common Issues

### Issue 1: APL URL Mismatch

**Symptom**: "Auth data not found in APL" in logs

**Cause**: Auth data was stored with one URL format, but lookup uses a different format

**Solution**: The URL normalization should fix this, but if it persists:

- Check if URLs have different trailing slashes
- Verify `NEXT_PUBLIC_SALEOR_API_URL` matches exactly what was used during installation

### Issue 2: Auth Data Not Stored

**Symptom**: "Auth data not found" even after successful installation

**Cause**: Installation didn't complete successfully, or APL storage failed

**Solution**:

- Reinstall the Stripe app
- Check APL storage location (FileAPL stores in `.saleor-app-auth.json` by default)
- Verify the register endpoint completed successfully

### Issue 3: Environment Variable Not Set

**Symptom**: Override not happening (no log messages)

**Cause**: `NEXT_PUBLIC_SALEOR_API_URL` is not set or not being read

**Solution**:

- Verify environment variable in container: `docker compose -f infra/docker-compose.dev.yml exec saleor-stripe-app printenv NEXT_PUBLIC_SALEOR_API_URL`
- Ensure it's set in `docker-compose.dev.yml` or `.env` file
- Restart container after setting

## Notes

- URL normalization ensures consistent format (always ends with `/graphql/`)
- The override only applies when incoming URL contains `localhost:8000`
- Both register endpoint and tRPC context now have the override logic
- Logging is added to help debug URL override and APL lookup issues
