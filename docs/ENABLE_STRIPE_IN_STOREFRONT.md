# Enabling Stripe Payment Gateway in Storefront

## Overview

The Stripe payment gateway is **already integrated** into the Saleor storefront. You just need to:

1. ✅ **Stripe app installed** (already done)
2. ✅ **Stripe configuration created** (already done)
3. ⚠️ **Assign configuration to channel** (need to do this)

## Step-by-Step Guide

### Step 1: Assign Stripe Configuration to Channel

1. **Open the Stripe app** in Dashboard:

   - Go to your Dashboard (via tunnel URL)
   - Navigate to **Extensions** → **Installed** → **Stripe**

2. **Go to Configuration page**:

   - You should see two sections:
     - **Stripe configurations** (your saved config)
     - **Channels configurations** (channel assignment)

3. **Assign configuration to channel**:
   - In the **"Channels configurations"** section
   - Find your channel (e.g., "Default Channel")
   - Select the Stripe configuration you created
   - Save the mapping

### Step 2: Verify Payment Gateway Appears

1. **Open your storefront** (via tunnel URL):

   - Go to: `https://your-storefront-tunnel.trycloudflare.com`

2. **Add items to cart**:

   - Browse products
   - Add items to cart
   - Go to checkout

3. **Check Payment section**:
   - Fill in shipping/billing information
   - In the **Payment** section, you should see:
     - ✅ Stripe payment option
     - ✅ Stripe Elements payment form (card input fields)

### Step 3: Test Payment Flow

1. **Use Stripe test card**:

   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

2. **Complete payment**:
   - Click "Pay now"
   - Payment should process successfully
   - You should be redirected to order confirmation page

## How It Works

### Automatic Gateway Detection

The storefront automatically:

1. **Fetches available gateways** from Saleor API

   - Queries `availablePaymentGateways` from checkout
   - Filters to supported gateways (Stripe is already supported)

2. **Initializes payment gateway**:

   - Calls `paymentGatewaysInitialize` mutation
   - Receives `stripePublishableKey` from Stripe app
   - Loads Stripe.js with the publishable key

3. **Renders payment form**:
   - Shows Stripe Elements (card input)
   - Handles payment processing
   - Manages 3DS authentication if needed

### Gateway ID

The storefront looks for gateway ID: `saleor.app.payment.stripe`

This matches the Stripe app's identifier, so it should work automatically once:

- Stripe app is installed ✅
- Configuration is assigned to channel ⚠️

## Troubleshooting

### Stripe Gateway Not Appearing in Checkout

**Possible causes:**

1. **Configuration not assigned to channel**

   - ✅ Check: Go to Stripe app → Channels configurations
   - ✅ Fix: Assign your Stripe config to the channel

2. **Stripe app not active**

   - ✅ Check: Dashboard → Extensions → Installed → Stripe
   - ✅ Fix: Ensure app is active/enabled

3. **No publishable key configured**

   - ✅ Check: Stripe app → Configuration → Check publishable key
   - ✅ Fix: Ensure publishable key is set

4. **Wrong channel**
   - ✅ Check: Verify you're using the correct channel in storefront
   - ✅ Fix: Assign config to the channel your storefront uses

### Payment Form Not Loading

**Check:**

1. Browser console for errors
2. Network tab for failed requests to Stripe API
3. Verify `stripePublishableKey` is present in gateway config

**Debug:**

```typescript
// In browser console on checkout page:
// Check available payment gateways
console.log(checkout.availablePaymentGateways);

// Should include:
// { id: "saleor.app.payment.stripe", config: {...} }
```

### Payment Fails

**Check:**

1. Stripe secret key is valid
2. Webhook secret is configured (for webhook events)
3. Transaction logs in Saleor Dashboard

**Test cards:**

- **Success**: `4242 4242 4242 4242`
- **3DS Required**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 0002`

## Quick Checklist

- [ ] Stripe app installed in Dashboard
- [ ] Stripe configuration created (with publishable & secret keys)
- [ ] Configuration assigned to channel
- [ ] Storefront accessible via tunnel
- [ ] Items added to cart
- [ ] Checkout page shows Stripe payment option
- [ ] Payment form loads correctly
- [ ] Test payment succeeds

## Next Steps After Setup

1. **Test with different cards**:

   - Success cards
   - 3DS authentication flow
   - Declined cards

2. **Configure webhooks** (if not already):

   - Use Stripe CLI: `stripe listen --forward-to http://localhost:3002/api/webhooks/stripe`
   - Update webhook secret in Stripe app configuration

3. **Production setup** (when ready):
   - Switch to live Stripe keys
   - Configure production webhook endpoint
   - Update environment variables

## Additional Resources

- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Saleor Stripe App Documentation](https://docs.saleor.io/developer/app-store/apps/stripe)
- [Stripe Elements Documentation](https://stripe.com/docs/stripe-js)
