# Manual Check: Stripe App Installation Status

Since the GraphQL `apps` query requires authentication, here's how to check manually:

## Method 1: Dashboard (Easiest)

1. **Open Dashboard** (via tunnel URL):

   ```
   https://your-dashboard-tunnel.trycloudflare.com
   ```

2. **Navigate to Extensions**:

   - Click on **"Extensions"** in the left sidebar
   - Click on **"Installed"** tab

3. **Find Stripe App**:

   - Look for **"Stripe"** in the list
   - Check the status:
     - ✅ **"Active"** or **"Connected"** = Good
     - ❌ **"Inactive"** = Need to activate
     - ❌ **Not listed** = Not installed

4. **Check Permissions**:

   - Click on the Stripe app
   - Verify it has **"HANDLE_PAYMENTS"** permission
   - Should be listed in the app details

5. **Check Webhooks**:
   - In the app details, check if webhooks are registered
   - Should see webhooks like:
     - `PAYMENT_GATEWAY_INITIALIZE_SESSION`
     - `TRANSACTION_INITIALIZE_SESSION`
     - etc.

## Method 2: Check via API Logs

Check if the app registered successfully:

```powershell
cd infra
docker compose -f docker-compose.dev.yml logs saleor-api --tail=100 | Select-String -Pattern "stripe|app"
```

Look for:

- App registration events
- Webhook registration
- Any errors

## Method 3: Check Stripe App Logs

Check if the Stripe app is running and responding:

```powershell
cd infra
docker compose -f docker-compose.dev.yml logs saleor-stripe-app --tail=50
```

Look for:

- App started successfully
- Manifest endpoint accessible
- Registration endpoint working

## Method 4: Test App Endpoints

Check if the app is accessible:

1. **Manifest endpoint**:

   ```
   https://your-stripe-app-tunnel.trycloudflare.com/api/manifest
   ```

   Should return JSON with app details

2. **Registration endpoint**:
   ```
   https://your-stripe-app-tunnel.trycloudflare.com/api/register
   ```
   Should be accessible (POST only)

## What to Look For

### ✅ Good Signs:

- App shows as "Active" in Dashboard
- Has "HANDLE_PAYMENTS" permission
- Webhooks are registered
- App logs show no errors
- Manifest endpoint returns valid JSON

### ❌ Problem Signs:

- App shows as "Inactive"
- Missing "HANDLE_PAYMENTS" permission
- No webhooks registered
- App logs show errors
- Manifest endpoint returns 404 or error

## If App is Inactive

1. **Try to activate**:

   - Dashboard → Extensions → Installed → Stripe
   - Click "Activate" button

2. **If activation fails**:
   - Check app logs for errors
   - Verify app URL is accessible
   - Reinstall the app if needed

## Next Steps After Verification

Once you confirm the app is active:

1. ✅ **App is Active** → Check channel configuration assignment
2. ✅ **Configuration assigned** → Run payment gateway diagnostic
3. ✅ **Gateway appears** → Test in storefront
