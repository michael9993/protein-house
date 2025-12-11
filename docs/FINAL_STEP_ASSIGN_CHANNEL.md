# ✅ FINAL STEP: Assign Stripe Configuration to Channel

## Current Status

- ✅ Webhook implemented and registered
- ✅ Stripe configuration exists ("saleor" in test mode)
- ❌ Configuration **NOT** assigned to any channel

## The Problem

The `PAYMENT_LIST_GATEWAYS` webhook code (line 53-55) checks for channel config:

```typescript
if (!config) {
  return { gateways: [] }; // Empty array = no gateway appears
}
```

Since no config is assigned to `default-channel`, the webhook returns `[]`, so Stripe doesn't appear in `availablePaymentGateways`.

## Solution: Assign Configuration via Dashboard

### Step-by-Step Instructions

1. **Open Saleor Dashboard**

   - URL: https://lately-tue-river-risks.trycloudflare.com/dashboard

2. **Navigate to Stripe App**

   - Go to: **Extensions** → **Installed** → **Stripe**
   - The app should open in an embedded iframe

3. **Scroll Down to "Channels configurations" Section**

   - You'll see two sections:
     - "Stripe configurations" (top - lists your configs)
     - "Channels configurations" (bottom - assigns configs to channels)

4. **Assign Configuration**

   - In the "Channels configurations" section
   - Find the row for `default-channel`
   - In the dropdown next to it, select: **"saleor"**
   - The change should save automatically

5. **Verify Assignment**
   - The `default-channel` row should now show "saleor" as selected
   - Not "Not assigned"

## Verification

After assigning, test immediately:

```powershell
cd c:\Users\micha\saleor-platform\infra\scripts
.\check-payment-gateways.ps1
```

**Expected output:**

```
Found 1 payment gateway(s):
- ID: saleor.app.payment.stripe
  Name: Stripe
  Currencies: USD, EUR, GBP, PLN

✓ Stripe gateway found!
```

## What Happens Behind the Scenes

1. You assign "saleor" config → `default-channel`
2. Saleor calls `PAYMENT_LIST_GATEWAYS` webhook with `channelId`
3. Webhook queries: "Is there a Stripe config for this channel?"
4. **Now YES** → Returns Stripe gateway in response
5. Gateway appears in `availablePaymentGateways` query
6. Storefront shows Stripe as payment option! 🎉

## Troubleshooting

### If gateway still doesn't appear:

1. **Check webhook logs** for errors:

   ```powershell
   docker compose -f infra/docker-compose.dev.yml logs saleor-stripe-app --tail=50
   ```

2. **Verify webhook is still registered**:

   ```powershell
   .\infra\scripts\find-and-check-stripe-app.ps1
   ```

   Should list: "Stripe Payment List Gateways"

3. **Check channel slug**:
   Your storefront might use a different channel. Check in Dashboard → Configuration → Channels

4. **Clear any caches** (if applicable)

## Screenshot Reference

The UI should look like this:

```
┌─────────────────────────────────────────┐
│ Stripe configurations                   │
├─────────────────────────────────────────┤
│  saleor           [Stripe test mode] 🗑  │
│                                          │
│  [+ Add new configuration]               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Channels configurations                  │
│ Assign created Stripe configurations    │
│ to Saleor channel.                       │
├─────────────────────────────────────────┤
│  default-channel    [saleor      ▼]     │
│  (other channels if any...)              │
└─────────────────────────────────────────┘
```

## Success Criteria

✅ Dashboard shows "saleor" assigned to "default-channel"
✅ `check-payment-gateways.ps1` shows Stripe gateway
✅ Storefront checkout shows Stripe payment option

---

**You're almost there!** This is the final step. Once the configuration is assigned to the channel, the Stripe payment gateway will be fully functional! 🚀

