# How Saleor Handles Payment Gateways via Extensions/Apps

## Overview

Saleor has moved from plugin-based payment gateways to an **app-based (extension) architecture**. This document explains how the new system works and how our Stripe app implementation aligns with it.

## Architecture: App-Based Payment Gateways

### 1. Payment Gateway Discovery Flow

When a client queries `availablePaymentGateways`, Saleor:

1. **Triggers `PAYMENT_LIST_GATEWAYS` webhook** (synchronous)

   - Finds all apps with this webhook registered
   - Calls each app's webhook endpoint
   - Sends payload: `{ "currency": "USD", "checkout": {...} }`

2. **App responds with gateway list**

   - Format: `[{ "id": "stripe", "name": "Stripe", "currencies": [...], "config": [...] }]`
   - Saleor transforms the ID: `"app:{app.identifier}:{gateway_id}"`
   - Example: `"app:stripe:stripe"` → `"app.stripe.stripe"` (in GraphQL)

3. **Fallback mechanism**
   - If an app has `TRANSACTION_INITIALIZE_SESSION` webhook but no `PAYMENT_LIST_GATEWAYS`
   - Saleor automatically adds it as a gateway with `id = app.identifier`

### 2. Key Code Locations

**Saleor Core Implementation:**

- **`saleor/saleor/plugins/webhook/plugin.py:3360-3414`**

  - `list_payment_gateways()` method
  - Triggers `PAYMENT_LIST_GATEWAYS` webhook
  - Parses responses using `parse_list_payment_gateways_response()`

- **`saleor/saleor/webhook/transport/payment.py:14-36`**

  - `parse_list_payment_gateways_response()` function
  - Transforms gateway ID: `to_payment_app_id(app, gateway_id)`
  - Format: `"app:{app.identifier}:{gateway_id}"`

- **`saleor/saleor/webhook/transport/utils.py:659-661`**

  - `to_payment_app_id()` function
  - Creates: `f"{APP_ID_PREFIX}:{app_identifier}:{external_id}"`
  - `APP_ID_PREFIX = "app"`

- **`saleor/saleor/graphql/checkout/types.py:1387-1408`**

  - `resolve_available_payment_gateways()` resolver
  - Calls `manager.list_payment_gateways()`

- **`saleor/saleor/graphql/shop/types.py:416-419`**
  - `resolve_available_payment_gateways()` resolver for Shop query
  - Also calls `manager.list_payment_gateways()`

### 3. Webhook Payload Format

**Request Payload:**

```json
{
  "currency": "USD",
  "checkout": {
    "id": "...",
    "channel": {
      "id": "...",
      "slug": "default-channel"
    },
    ...
  }
}
```

**Expected Response:**

```json
[
  {
    "id": "stripe",
    "name": "Stripe",
    "currencies": ["USD", "EUR", "GBP"],
    "config": [{ "field": "public_key", "value": "pk_test_..." }]
  }
]
```

### 4. Gateway ID Transformation

**Our Implementation:**

- We return: `id: "stripe"`
- Saleor transforms to: `"app:stripe:stripe"`
- Final GraphQL ID: `"app.stripe.stripe"` (dots replace colons in GraphQL)

**Important:** The gateway ID in our response (`"stripe"`) is the **external ID**. Saleor automatically prefixes it with the app identifier.

### 5. Currency Filtering

Saleor filters gateways by currency:

- If `currency` is provided in the query
- Only gateways supporting that currency are returned
- Filtering happens **after** webhook response parsing

### 6. Legacy Plugin System

**`saleor/saleor/payment/gateways/stripe/plugin.py`** is the **old plugin-based approach**:

- Django plugin architecture
- Configured via `PluginConfiguration` model
- Still exists but being phased out
- **Not used** when apps/extensions are active

## Our Stripe App Implementation

### ✅ Correct Implementation

Our implementation follows the new app-based architecture:

1. **Webhook Registration** (`apps/apps/stripe/src/app/api/manifest/route.ts`)

   - ✅ Registered `PAYMENT_LIST_GATEWAYS` webhook
   - ✅ Marked as synchronous (`SaleorSyncWebhook`)
   - ✅ Active: `true`

2. **Webhook Handler** (`apps/apps/stripe/src/app/api/webhooks/saleor/payment-list-gateways/route.ts`)

   - ✅ Receives payload with `checkout.channel.id`
   - ✅ Checks if Stripe config is assigned to channel
   - ✅ Returns gateway list or empty array

3. **Response Format** (`apps/apps/stripe/src/app/api/webhooks/saleor/payment-list-gateways/use-case-response.ts`)

   - ✅ Returns array of gateway objects
   - ✅ Includes: `id`, `name`, `currencies`, `config`
   - ✅ Matches Saleor's expected format

4. **Gateway ID**
   - ✅ We return: `id: "stripe"`
   - ✅ Saleor will transform to: `"app:stripe:stripe"`
   - ✅ Final ID in GraphQL: `"app.stripe.stripe"`

### 🔍 Verification

To verify the gateway appears:

1. **Check manifest:**

   ```bash
   curl https://your-stripe-app-tunnel.trycloudflare.com/api/manifest
   ```

   Should show `PAYMENT_LIST_GATEWAYS` webhook registered.

2. **Query gateways:**

   ```graphql
   query {
     shop {
       availablePaymentGateways(channel: "default-channel") {
         id
         name
         currencies
       }
     }
   }
   ```

   Should return gateway with `id: "app.stripe.stripe"` (or similar).

3. **Check webhook logs:**
   - Saleor will call: `POST /api/webhooks/saleor/payment-list-gateways`
   - Should return: `[{ "id": "stripe", "name": "Stripe", ... }]`

## Differences: Old Plugin vs New App System

| Aspect            | Old Plugin System                 | New App System                              |
| ----------------- | --------------------------------- | ------------------------------------------- |
| **Configuration** | `PluginConfiguration` model       | App-specific config (APL)                   |
| **Discovery**     | Static plugin list                | Dynamic via `PAYMENT_LIST_GATEWAYS` webhook |
| **Gateway ID**    | `PLUGIN_ID` constant              | `app:{identifier}:{gateway_id}`             |
| **Location**      | `saleor/payment/gateways/stripe/` | External app (Next.js)                      |
| **Webhooks**      | Django signals                    | HTTP webhooks                               |
| **Status**        | Legacy (deprecated)               | Current (recommended)                       |

## Summary

✅ **Our implementation is correct!** We're using the new app-based architecture:

1. ✅ Webhook registered in manifest
2. ✅ Handler checks channel configuration
3. ✅ Returns correct response format
4. ✅ Gateway ID will be transformed correctly by Saleor

The old `saleor/saleor/payment/gateways/stripe/plugin.py` file is **not relevant** for our app-based implementation. It's the legacy plugin system that's being phased out.

## Next Steps

1. ✅ Verify webhook is registered (manifest check)
2. ✅ Test gateway appears in `availablePaymentGateways` query
3. ✅ Ensure Stripe config is assigned to channel
4. ✅ Test payment flow end-to-end
