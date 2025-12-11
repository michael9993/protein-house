# Troubleshooting: Payment Gateway Not Appearing

## Quick Diagnostic

Run the diagnostic script to check what the API returns:

```powershell
cd infra\scripts
.\check-payment-gateways.ps1
```

Or with your tunnel URL:

```powershell
.\check-payment-gateways.ps1 -ApiUrl "https://your-api-tunnel.trycloudflare.com/graphql/"
```

## Common Issues and Fixes

### 1. Stripe App Not Active

**Check:**

- Go to Dashboard → Extensions → Installed → Stripe
- Verify the app shows as "Active" or "Connected"

**Fix:**

- If not active, click "Activate" or reinstall the app
- Make sure the app has `HANDLE_PAYMENTS` permission (should be automatic)

### 2. Configuration Not Assigned to Channel

**This is the most common issue!**

**Check:**

1. Go to Dashboard → Extensions → Installed → Stripe
2. Click on the Stripe app
3. Go to the "Channels configurations" section
4. Verify your channel has a Stripe configuration assigned

**Fix:**

1. In the "Channels configurations" section
2. Find your channel (e.g., "Default Channel")
3. Select the Stripe configuration you created
4. Click "Save" or "Update"

**Important:** The gateway will NOT appear if no configuration is assigned to the channel!

### 3. Wrong Channel Slug

**Check:**

- Your storefront might be using a different channel than expected
- The diagnostic script defaults to `default-channel`

**Fix:**

- Find your actual channel slug:
  1. Go to Dashboard → Channels
  2. Check the slug of your active channel
  3. Run diagnostic with correct slug:
     ```powershell
     .\check-payment-gateways.ps1 -ChannelSlug "your-actual-channel-slug"
     ```

### 4. App Not Installed Correctly

**Check:**

- Verify the app appears in Dashboard → Extensions → Installed
- Check app manifest is accessible: `https://your-stripe-app-tunnel.trycloudflare.com/api/manifest`

**Fix:**

- Reinstall the app if needed
- Make sure the app URL is accessible

### 5. API Not Returning Gateway

**Check:**

- Run the diagnostic script to see what gateways the API returns
- Check API logs for errors:
  ```powershell
  docker compose -f infra/docker-compose.dev.yml logs saleor-api | Select-String -Pattern "payment|gateway|stripe"
  ```

**Fix:**

- If API returns no gateways, check:
  1. App is active
  2. Configuration is assigned to channel
  3. App has HANDLE_PAYMENTS permission

## Step-by-Step Verification

### Step 1: Verify App Installation

1. Open Dashboard (via tunnel URL)
2. Go to Extensions → Installed
3. Find "Stripe" app
4. Should show as "Active" or "Connected"
5. Click on it to open app details

### Step 2: Verify Configuration Exists

1. In Stripe app page
2. Go to "Stripe configurations" section
3. Should see your configuration (e.g., "stripe")
4. Verify it has:
   - Publishable key
   - Restricted key (encrypted)
   - Webhook ID

### Step 3: Assign Configuration to Channel

1. In Stripe app page
2. Scroll to "Channels configurations" section
3. Find your channel (e.g., "Default Channel")
4. Select your Stripe configuration from dropdown
5. Click "Save" or "Update"
6. **This is critical - gateway won't appear without this!**

### Step 4: Verify via API

Run the diagnostic script:

```powershell
cd infra\scripts
.\check-payment-gateways.ps1
```

Should see:

```
✓ Stripe gateway found!
  ID: saleor.app.payment.stripe
  Name: Stripe
```

### Step 5: Check Storefront

1. Open storefront (via tunnel URL)
2. Add items to cart
3. Go to checkout
4. Fill shipping/billing information
5. Check Payment section
6. Should see Stripe payment option

## GraphQL Query to Test

You can also test directly with GraphQL:

```graphql
query {
  shop {
    availablePaymentGateways(channel: "default-channel") {
      id
      name
      currencies
      config {
        field
        value
      }
    }
  }
}
```

Expected response should include:

```json
{
  "data": {
    "shop": {
      "availablePaymentGateways": [
        {
          "id": "saleor.app.payment.stripe",
          "name": "Stripe",
          "currencies": ["USD"],
          "config": [...]
        }
      ]
    }
  }
}
```

## Still Not Working?

If after all these steps the gateway still doesn't appear:

1. **Check API logs:**

   ```powershell
   docker compose -f infra/docker-compose.dev.yml logs saleor-api --tail=100
   ```

2. **Check Stripe app logs:**

   ```powershell
   docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app --tail=100
   ```

3. **Verify app webhook is registered:**

   - Dashboard → Extensions → Installed → Stripe
   - Check webhooks are registered in Saleor

4. **Restart services:**

   ```powershell
   docker compose -f infra/docker-compose.dev.yml restart saleor-api saleor-stripe-app
   ```

5. **Check browser console** on storefront checkout page for errors

## Most Common Issue

**90% of the time, the issue is: Configuration not assigned to channel.**

Make sure you:

1. Created a Stripe configuration ✅
2. **Assigned it to your channel** ⚠️ (this is often missed!)

The gateway will NOT appear until the configuration is assigned to the channel.
