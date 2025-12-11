# Complete Stripe App Tunnel Fix Summary

## All Fixes Applied

### 1. Register Endpoint URL Override

**File**: `apps/apps/stripe/src/app/api/register/route.ts`

- Overrides `localhost:8000` with `NEXT_PUBLIC_SALEOR_API_URL` during installation
- Ensures installation uses tunnel URL even if JWT token has localhost as issuer
- Normalizes URLs to ensure consistent format

### 2. tRPC Context URL Override

**File**: `apps/apps/stripe/src/modules/trpc/context-app-router.ts`

- Overrides `localhost:8000` with `NEXT_PUBLIC_SALEOR_API_URL` in all tRPC requests
- Ensures config fetching and other operations use tunnel URL
- Normalizes URLs for consistent APL lookups

### 3. APL Lookup Fallback

**File**: `apps/apps/stripe/src/modules/trpc/protected-client-procedure.ts`

- If auth data not found with tunnel URL, tries localhost URL as fallback
- If found with localhost, automatically migrates to tunnel URL
- Prevents "Missing auth data" errors when URL format differs

### 4. Enhanced Logging

**Files**: Multiple

- Added logging for URL overrides
- Added logging for APL lookups
- Helps debug configuration issues

## How to Use

1. **Set environment variable** in `.env`:

   ```env
   DASHBOARD_API_URL=https://your-api-tunnel.trycloudflare.com/graphql/
   ```

2. **Restart Stripe app**:

   ```powershell
   cd infra
   docker compose -f docker-compose.dev.yml restart saleor-stripe-app
   ```

3. **Wait 30-40 seconds** for app to fully restart

4. **Refresh the Stripe app page** in Dashboard

5. **Configuration should now load** without errors

## Verification

Check logs to confirm fixes are working:

```powershell
docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app | Select-String -Pattern "Overriding|authData|APL"
```

You should see:

- "Overriding Saleor API URL" messages (confirms override is working)
- "Auth data found in APL" (confirms lookup succeeded)
- "Found auth data with fallback URL" (if fallback was used)

## Troubleshooting

If you still see "App failed to fetch config":

1. **Check environment variable**:

   ```powershell
   docker compose -f infra/docker-compose.dev.yml exec saleor-stripe-app printenv NEXT_PUBLIC_SALEOR_API_URL
   ```

2. **Check APL storage** (FileAPL stores in `.saleor-app-auth.json`):

   ```powershell
   docker compose -f infra/docker-compose.dev.yml exec saleor-stripe-app ls -la /app/apps/stripe/.saleor-app-auth.json
   ```

3. **Check logs for errors**:

   ```powershell
   docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app | Select-String -Pattern "error|Error|ERROR" | Select-Object -Last 20
   ```

4. **Reinstall the app** if auth data is missing:
   - Go to Dashboard → Extensions → Installed
   - Remove the Stripe app
   - Reinstall it using the tunnel URL

## Files Modified

1. `apps/apps/stripe/src/app/api/register/route.ts` - Register endpoint override
2. `apps/apps/stripe/src/modules/trpc/context-app-router.ts` - tRPC context override
3. `apps/apps/stripe/src/modules/trpc/protected-client-procedure.ts` - APL lookup with fallback

## Next Steps

After these fixes:

1. ✅ Installation should work (register endpoint override)
2. ✅ Configuration fetching should work (tRPC context override)
3. ✅ APL lookups should work (fallback mechanism)

If issues persist, check the logs for specific error messages and URL mismatches.
