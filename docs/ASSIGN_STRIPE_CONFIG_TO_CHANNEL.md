# How to Assign Stripe Configuration to a Channel

## Problem

The Stripe gateway doesn't appear in `availablePaymentGateways` because the Stripe configuration is not assigned to any channel.

## Solution

### Via Dashboard (Visual)

1. Go to **Dashboard → Extensions → Installed → Stripe**
2. Click on the existing configuration (e.g., "saleor")
3. Look for **"Assign to channels"** or **"Channels"** section
4. Select the channel you want (e.g., "default-channel")
5. Save the configuration

### Via Stripe App UI

1. Open the Stripe app configuration page:
   - https://indiana-decades-burn-cold.trycloudflare.com/channels
2. Click on your configuration ("saleor")

3. Find the channel assignment section and add "default-channel"

4. Save

## Verification

After assigning the configuration, run:

```powershell
.\infra\scripts\check-payment-gateways.ps1
```

You should see:

```
Found 1 payment gateway(s):
- ID: saleor.app.payment.stripe
  Name: Stripe
  Currencies: USD, EUR, GBP, PLN
```

## Technical Details

The `PAYMENT_LIST_GATEWAYS` webhook checks if a Stripe configuration exists for the requested channel:

```typescript
// If no config for this channel, return empty array
if (!config) {
  return {
    gateways: [], // Gateway won't appear
  };
}

// If config exists, return Stripe gateway
return {
  gateways: [
    {
      id: "stripe",
      name: "Stripe",
      currencies: ["USD", "EUR", "GBP", "PLN"],
    },
  ],
};
```

## Current Status

- ✅ Webhook is registered and working
- ✅ Stripe configuration exists
- ❌ Configuration is not assigned to any channel
- **Action needed**: Assign configuration to "default-channel"

