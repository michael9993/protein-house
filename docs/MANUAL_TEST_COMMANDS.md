# Manual Testing Commands

## The Issue

The shell commands aren't returning output in my environment, so I need you to manually run these commands to test.

## Step 1: Check if Stripe App is Running

```powershell
docker ps --filter "name=stripe"
```

**Expected**: Should show `saleor-stripe-app` container running

## Step 2: Check Recent Logs

```powershell
docker logs saleor-stripe-app --tail 50
```

**Look for**:

- Compilation errors
- "No channel ID in payload" log messages (means our fix is running)
- Any error messages

## Step 3: Restart the App (if needed)

```powershell
cd c:\Users\micha\saleor-platform
docker compose -f infra/docker-compose.dev.yml restart saleor-stripe-app
```

Wait 20 seconds, then continue.

## Step 4: Test the Gateway Query

```powershell
.\test-gateway.ps1
```

**Expected**: Should show Stripe gateway with ID `app:stripe:stripe`

## Step 5: Check Webhook Deliveries

Go to Dashboard:
https://lately-tue-river-risks.trycloudflare.com/dashboard/extensions/app/QXBwOjIy

Scroll down to "Extension Webhooks" section, find "Stripe Payment List Gateways", and check:

- Is it showing recent deliveries?
- Are they successful (HTTP 200) or failing (HTTP 500)?
- What's the response body?

## Troubleshooting

### If app isn't running:

```powershell
docker compose -f infra/docker-compose.dev.yml up -d saleor-stripe-app
```

### If app shows compilation errors:

The TypeScript changes might have syntax issues. Check logs for details.

### If webhook shows HTTP 500:

The app is crashing when handling the webhook. Check logs with:

```powershell
docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app --tail=100
```

### If webhook shows HTTP 200 but no gateway:

The webhook is working but returning empty array. Check:

1. Is "saleor" config assigned to "default-channel" in Dashboard?
2. Check the response body in webhook delivery details

## What the Fix Should Do

When the webhook is called WITHOUT a checkout (like in `shop.availablePaymentGateways`):

1. Log: "No channel ID in payload (query without checkout context)"
2. Call `executeForAnyChannel()` method
3. Return Stripe gateway regardless of channel configuration

This matches Saleor's behavior for `TRANSACTION_INITIALIZE_SESSION`.

