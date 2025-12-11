# Stripe Storefront Integration Guide

## ✅ Integration Status

**Great news!** Stripe is **already fully integrated** into the Saleor storefront. The integration uses the official Saleor Stripe App architecture.

## Architecture Overview

The storefront uses a **gateway-based payment system** where:

1. **Payment Gateways** are registered in `supportedPaymentApps.ts`
2. Each gateway has its own **component** that handles the payment UI
3. The **gateway ID** must match the Saleor app identifier: `saleor.app.payment.stripe`

## Current Implementation

### Files Structure

```
storefront/src/checkout/sections/PaymentSection/
├── supportedPaymentApps.ts          # Gateway registration
├── utils.ts                         # Gateway filtering & utilities
├── types.ts                         # TypeScript types
└── StripeV2DropIn/                  # Stripe implementation
    ├── types.ts                     # Gateway ID: "saleor.app.payment.stripe"
    ├── stripeComponent.tsx          # Main Stripe component
    ├── stripeForm.tsx              # Payment form with Stripe Elements
    └── useCheckoutCompleteRedirect.ts # Redirect handling
```

### Key Components

1. **StripeComponent** (`stripeComponent.tsx`)
   - Initializes Stripe with publishable key
   - Wraps payment form in Stripe Elements
   - Handles loading states

2. **CheckoutForm** (`stripeForm.tsx`)
   - Implements full payment flow:
     - Validates payment method
     - Initializes transaction with Saleor
     - Confirms payment with Stripe
     - Processes transaction
     - Completes checkout

3. **Payment Flow**
   ```
   User submits form
   → Validate with Stripe Elements
   → Initialize transaction (Saleor API)
   → Get client secret
   → Confirm payment (Stripe)
   → Process transaction (Saleor API)
   → Complete checkout
   ```

## Dependencies

Stripe packages are already installed:

```json
{
  "@stripe/react-stripe-js": "3.7.0",
  "@stripe/stripe-js": "7.3.0"
}
```

## Verification Steps

### 1. Verify Stripe App Installation

1. Go to Saleor Dashboard: `http://localhost:9000`
2. Navigate to **Extensions** section
3. Verify **Stripe** app is installed and active
4. Check that the app shows as **Connected**

### 2. Verify Stripe Configuration

The Stripe app should have:
- ✅ **Publishable Key** configured (from Stripe Dashboard)
- ✅ **Secret Key** configured (from Stripe Dashboard)
- ✅ **Webhook Secret** configured (from Stripe CLI)

### 3. Test Payment Gateway in Checkout

1. Add items to cart
2. Go to checkout: `http://localhost:3000/checkout`
3. Fill in shipping/billing information
4. In **Payment** section, you should see:
   - Stripe payment option (if app is active)
   - Stripe Elements payment form
   - "Pay now" button

### 4. Test Payment Flow

1. Use Stripe test card: `4242 4242 4242 4242`
2. Any future expiry date (e.g., `12/34`)
3. Any 3-digit CVC (e.g., `123`)
4. Any ZIP code (e.g., `12345`)
5. Submit payment
6. Should redirect to order confirmation

## How It Works

### Gateway Registration

```typescript
// supportedPaymentApps.ts
export const paymentMethodToComponent = {
  [stripeV2GatewayId]: StripeComponent,  // "saleor.app.payment.stripe"
  // ... other gateways
};
```

### Gateway Filtering

```typescript
// utils.ts
export const supportedPaymentGateways = [
  adyenGatewayId,
  stripeV2GatewayId  // "saleor.app.payment.stripe"
] as const;
```

The storefront automatically:
1. Fetches available payment gateways from Saleor API
2. Filters to only show supported gateways
3. Renders the appropriate component for each gateway

### Payment Initialization

When user selects Stripe:
1. `usePaymentGatewaysInitialize` hook calls Saleor API
2. Saleor returns gateway config with `stripePublishableKey`
3. `StripeComponent` loads Stripe.js with the key
4. Payment form is rendered with Stripe Elements

### Transaction Flow

1. **Initialize**: `transactionInitialize` mutation
   - Sends payment method to Saleor
   - Saleor creates PaymentIntent with Stripe
   - Returns `clientSecret`

2. **Confirm**: `stripe.confirmPayment()`
   - Stripe processes payment
   - May redirect for 3DS authentication
   - Returns to storefront with status

3. **Process**: `transactionProcess` mutation
   - Syncs Saleor with Stripe payment status
   - Updates order/checkout state

4. **Complete**: `onCheckoutComplete()`
   - Finalizes order
   - Redirects to confirmation page

## Troubleshooting

### Stripe Gateway Not Appearing

**Check:**
1. Stripe app is installed in Dashboard
2. App is active (not disabled)
3. App has valid publishable key configured
4. Checkout has billing address set

**Debug:**
- Check browser console for errors
- Verify `availablePaymentGateways` in checkout state
- Check Saleor API logs for gateway initialization errors

### Payment Form Not Loading

**Check:**
1. Stripe publishable key is valid
2. Network requests to Stripe API are not blocked
3. Browser console for Stripe.js errors

**Debug:**
- Check `stripePromise` state in `StripeComponent`
- Verify `config.data.stripePublishableKey` is present
- Check Stripe.js loading errors in console

### Payment Fails

**Check:**
1. Stripe secret key is valid
2. Webhook secret is configured
3. Stripe CLI is forwarding webhooks (if testing locally)
4. Transaction logs in Saleor Dashboard

**Debug:**
- Check `transactionInitialize` response
- Verify `clientSecret` is returned
- Check Stripe Dashboard for payment attempts
- Review Saleor transaction events

## Configuration

### Environment Variables

The Stripe app uses these environment variables (configured in `docker-compose.dev.yml`):

```yaml
STRIPE_PUBLISHABLE_KEY: pk_test_...
STRIPE_SECRET_KEY: sk_test_...
STRIPE_WEBHOOK_SECRET: whsec_...
```

### Gateway Configuration

The gateway configuration is fetched from Saleor API via:
- `paymentGatewaysInitialize` mutation
- Returns `gatewayConfigs` with `stripePublishableKey`

## Testing

### Test Cards

Use Stripe test cards for testing:

- **Success**: `4242 4242 4242 4242`
- **3DS Required**: `4000 0025 0000 3155`
- **Declined**: `4000 0000 0000 0002`

### Test Mode

Ensure you're using **test mode** keys:
- Publishable key: `pk_test_...`
- Secret key: `sk_test_...`

## Next Steps

1. ✅ Verify Stripe app is installed and active
2. ✅ Test payment gateway appears in checkout
3. ✅ Test complete payment flow
4. ✅ Configure production keys when ready

## Additional Resources

- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Saleor Stripe App Docs](https://docs.saleor.io/developer/app-store/apps/stripe)
- [Stripe Elements Docs](https://stripe.com/docs/stripe-js)

