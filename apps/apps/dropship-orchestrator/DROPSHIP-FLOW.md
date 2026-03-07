# Dropship Flow: End-to-End Order Lifecycle

How the Aura platform handles dropship orders from product setup through delivery.

---

## 1. Product Setup (One-Time)

Dropship products are regular Saleor products with special metadata that tells the
orchestrator "forward this to a supplier instead of fulfilling from warehouse."

### Required Metadata

Set on the **product** (via Dashboard > Product > Metadata, or Bulk Manager CSV):

| Key | Where | Example | Purpose |
|-----|-------|---------|---------|
| `dropship.supplier` | Private + Public | `cj` | Which supplier fulfills this |
| `dropship.costPrice` | Private | `12.50` | Wholesale cost (USD) for margin calc |

Set on each **variant**:

| Key | Where | Example | Purpose |
|-----|-------|---------|---------|
| `dropship.supplierSku` | Private + Public | `1005003821654327` | CJ variant ID (vid) |

Optional shipping metadata on the **product** (public):

| Key | Example | Purpose |
|-----|---------|---------|
| `shipping.estimatedMinDays` | `7` | Shown on product cards |
| `shipping.estimatedMaxDays` | `15` | Shown on product cards |
| `shipping.carrier` | `CJ Packet` | Shown in product tabs |

### How to Apply Metadata

**Option A: Bulk Manager CSV** (recommended for bulk)

Enable the "Dropship product" checkbox and select supplier. The CSV supports columns:
- `supplier_sku` / `supplierSku` / `cj_sku` - CJ variant VID
- `shipping_min_days` / `shipping_max_days` / `shipping_carrier`

When "Dropship product" is enabled, the Bulk Manager automatically:
- Sets `dropship.supplier` and `dropship.costPrice` on the product (private + public)
- Sets `dropship.supplierSku` on each variant (private + public)
- Disables `trackInventory` (CJ manages stock via webhooks)
- Creates dummy stock of 1000 units (so Saleor considers the product purchasable)
- Sets shipping estimation metadata if CSV columns are present

**Option B: Dashboard Manual**

1. Dashboard > Products > [Product] > Metadata > Add Private Metadata
2. Add `dropship.supplier` = `cj` and `dropship.costPrice` = `12.50`
3. For each variant: Metadata > Add Private > `dropship.supplierSku` = `<CJ VID>`
4. Also add `dropship.supplier` to public metadata (needed by checkout shipping webhook)

### Inventory for Dropship Products

Dropship products use **virtual inventory**:
- `trackInventory` is set to `false` on variants
- Dummy stock (1000 units) is created so Saleor allows purchases
- Actual stock is managed by CJ webhooks updating quantities in real-time
- The stock webhook (`/api/webhooks/cj/stock`) receives CJ stock changes and updates
  the Saleor variant stock via `productVariantStocksUpdate` mutation

---

## 2. Customer Checkout Flow

From the customer's perspective, dropship products behave identically to warehouse
products. The only visible differences are shipping estimates and delivery times.

### Shipping Rates at Checkout

When the customer enters their shipping address:

```
Saleor fires SHIPPING_LIST_METHODS_FOR_CHECKOUT (sync webhook)
    |
    v
Dropship Orchestrator receives checkout data
    |
    v
Classifies checkout lines (dropship vs warehouse)
    |
    v
For dropship lines: calls CJ freightCalculate API
    with actual product VIDs + destination country + postal code
    |
    v
Converts CJ shipping prices to checkout currency (if needed)
    |
    v
Applies shipping rules (margin, minimum, rounding)
    |
    v
Returns shipping options to Saleor
    (e.g. "CJ Packet - $5.99 - 7-15 business days")
```

**Files involved:**
- `src/pages/api/webhooks/saleor/shipping-list.ts` - webhook handler
- `src/modules/webhooks/shipping/shipping-list-use-case.ts` - business logic
- `src/modules/suppliers/cj/adapter.ts` (`getShippingOptionsMulti`) - CJ API call

### What the Customer Sees

- **Product page**: Shipping estimate badge ("Ships in 7-15 days")
- **Cart**: Per-item shipping estimates
- **Checkout**: Real CJ shipping rates as selectable options
- **Order confirmation**: Standard confirmation (no mention of supplier)
- **Account > Orders**: Tracking number and carrier once shipped

---

## 3. Order Forwarding Pipeline

When the customer completes payment:

```
Stripe processes payment
    |
    v
Saleor fires ORDER_FULLY_PAID webhook
    |
    v
Dropship Orchestrator receives it
    |
    v
Step 1: FETCH full order with line items + product metadata
    |
    v
Step 2: CLASSIFY each line item
    - Read each product's metadata for dropship.supplier
    - Lines WITH metadata -> grouped by supplier (e.g. "cj")
    - Lines WITHOUT metadata -> "concrete" (normal warehouse fulfillment)
    |
    v
Step 3: FRAUD CHECKS (if enabled, configurable)
    - Velocity: max 3 orders/hour from same email
    - Address mismatch: billing vs shipping country
    - Value threshold: orders above $200 (configurable)
    - Blacklist: email, phone, address, IP
    - Composite score calculated. Score >= 50 = BLOCKED
    |
    v
Step 4: COST CEILING CHECK
    - Supplier cost must be < 70% of sell price (configurable)
    - Prevents forwarding orders with negative margin
    |
    v
Step 5: DAILY SPEND LIMIT
    - Running total of daily supplier costs
    - Pauses auto-forwarding when limit hit ($1000 default)
    |
    v
Step 6: FORWARD TO SUPPLIER
    For each supplier group:
    a. Get adapter from registry (CJ or AliExpress)
    b. Load stored credentials (API key / access token)
    c. Build order request with:
       - Supplier SKU (vid)
       - Quantity
       - Shipping address (with full country name for CJ)
       - Shipping method
       - Store line item ID (storeLineItemId for CJ disputes)
       - Customer email (for CJ tracking notifications)
       - Platform: "Aura"
       - Idempotency key (deterministic from orderId + supplierId)
    d. Call CJ createOrderV2
    e. Call CJ confirmOrder (triggers CJ wallet charge)
    f. Retry up to 3 times with 2s backoff on failure
    |
    v
Step 7: STORE RESULTS
    a. Save supplier order IDs in Saleor order metadata:
       { status: "forwarded", suppliers: { cj: "240123..." }, forwardedAt: "..." }
    b. Store CJ order ID -> Saleor order ID in Redis (for webhook lookups)
    c. Increment daily spend tracker
    d. Log everything to audit trail
```

**If any check fails**, the order goes to the Exception Queue instead:
- Admin reviews in Orchestrator > Exceptions
- Can manually approve (forwards to supplier) or cancel
- Exception reasons: fraud_velocity, fraud_address, cost_ceiling, daily_spend_limit, supplier_error

**Files involved:**
- `src/pages/api/webhooks/saleor/order-paid.ts` - webhook entry point
- `src/modules/webhooks/order-paid/use-case.ts` - full pipeline logic
- `src/modules/webhooks/order-paid/order-classifier.ts` - line classification
- `src/modules/fraud/fraud-checker.ts` - fraud scoring
- `src/modules/pricing/cost-ceiling.ts` - margin check
- `src/modules/suppliers/cj/adapter.ts` - CJ API calls

---

## 4. Supplier Processing (CJ Side)

After forwarding, CJ handles the order lifecycle:

```
CREATED -> UNPAID -> UNSHIPPED -> SHIPPED -> DELIVERED
   |                                |
   |  CJ charges your wallet       |  CJ assigns tracking
   |  balance                       |  number + carrier
```

Your CJ wallet balance is pre-funded via the CJ portal. The orchestrator's cost
ceiling and daily spend limits protect against runaway charges.

---

## 5. Webhook Updates (CJ -> Aura)

CJ sends webhooks to three endpoints as orders progress. All endpoints use:
- IP whitelist (CJ server IPs: 47.252.50.116-119, 47.88.76.0/24)
- Redis deduplication (prevents double-processing on retries)
- Redis reverse index for O(1) order lookups (fallback: metadata scan)

### Order Status Webhook

**Endpoint:** `POST /api/webhooks/cj/order`
**Payload:** `{ messageId, type: "ORDER", messageType: "UPDATE", params: { cjOrderId, orderStatus, trackNumber?, ... } }`

What it does:
1. Validates payload against Zod schema
2. Deduplicates by messageId (24h TTL)
3. Finds Saleor order via Redis index (or metadata scan fallback)
4. Maps CJ status to internal status (UNSHIPPED->processing, SHIPPED->shipped, etc.)
5. Updates Saleor order metadata with new status + tracking info
6. Logs to audit trail

### Logistics Webhook

**Endpoint:** `POST /api/webhooks/cj/logistics`
**Payload:** `{ messageId, type: "LOGISTICS", messageType: "UPDATE", params: { cjOrderId, trackNumber, logisticName, trackingUrl?, ... } }`

What it does:
1. Validates + deduplicates
2. Finds matching Saleor order
3. **Creates a Saleor Fulfillment** with tracking number via `orderFulfill` mutation
4. Updates order metadata: status="shipped", trackingNumber, carrier, trackingUrl
5. Saleor sends shipping notification email to customer (via SMTP app)

### Stock Webhook

**Endpoint:** `POST /api/webhooks/cj/stock`
**Payload:** `{ messageId, type: "STOCK", messageType: "UPDATE", params: { vid, sku?, stock } }`

What it does:
1. Validates + deduplicates (1h TTL)
2. Finds Saleor variant by SKU match or metadata scan (dropship.supplierSku)
3. Updates variant stock in Saleor via `productVariantStocksUpdate` mutation
4. If variant has no existing stock entries, uses the first available warehouse

---

## 6. Storefront Display

The storefront reads dropship data via helper functions in `storefront/src/lib/shipping.ts`:

| Function | Used By | Reads |
|----------|---------|-------|
| `getProductShippingEstimate()` | ProductCard, ProductDetail, Cart | `shipping.estimatedMinDays/MaxDays` metadata |
| `isDropshipProduct()` | ProductTabs | `dropship.supplier` metadata |
| `getOrderTrackingData()` | OrderDetailsClient | `dropship` order metadata (tracking, carrier, URL) |
| `formatEstimate()` | All card components | Formats "7-15" or "5" |

**Components that display dropship info:**
- `HomepageProductCard.tsx` - shipping estimate badge
- `ProductCard.tsx` (listing page) - shipping estimate badge
- `ProductDetailClient.tsx` - shipping estimate on PDP
- `ProductTabs.tsx` - "Ships from supplier" note + carrier info
- `CartClient.tsx` - per-item shipping estimates
- `OrderDetailsClient.tsx` - tracking number, carrier, tracking URL link

---

## 7. Background Jobs

BullMQ workers running on Redis:

| Job | Interval | Purpose |
|-----|----------|---------|
| Tracking Sync | Every 2 hours | Polls CJ for tracking updates (backup for webhooks) |
| Reconciliation | Every 6 hours | Compares Saleor order status vs CJ status, flags mismatches |
| Token Refresh | Every 12 days | Refreshes CJ access token (15-day expiry) |

---

## 8. Admin Dashboard

Accessible at the Dropship Orchestrator app (port 3009, or via Saleor Dashboard > Apps):

| Page | Purpose |
|------|---------|
| Dashboard | Active orders count, daily spend, success rate |
| Suppliers | CJ config (API key, test connection, webhook URLs) |
| Orders | All forwarded orders with supplier status |
| Exceptions | Failed orders needing manual review (approve/cancel) |
| Settings | Cost ceiling %, daily limit, fraud thresholds, IP whitelist |
| Audit Log | Complete history of all actions |
| Pricing | Margin analysis, price drift alerts |
| Returns | Return/dispute management |

---

## 9. Order Cancellation

If an order is cancelled in Saleor Dashboard:

```
Saleor fires ORDER_CANCELLED webhook
    |
    v
Dropship Orchestrator reads order metadata for supplier order IDs
    |
    v
Calls CJ deleteOrder API for each supplier order
    |
    v
Updates order metadata: status="cancelled"
    |
    v
Logs to audit trail
```

---

## 10. Security

| Layer | Mechanism |
|-------|-----------|
| CJ Webhook Auth | IP whitelist (CJ server ranges) |
| Saleor Webhook Auth | HMAC signature verification (app-sdk) |
| Credentials | Encrypted metadata storage |
| Idempotency | Deterministic UUID from orderId + supplierId (prevents duplicate orders on webhook retries) |
| Deduplication | Redis-backed messageId tracking (24h for orders/logistics, 1h for stock) |
| Rate Limiting | 1 req/sec to CJ API |
| Circuit Breaker | Opens after 5 consecutive failures, recovers after 5 minutes |
| Fraud Detection | 4-rule composite scoring with configurable thresholds |
| Financial Safety | Cost ceiling (70%), daily spend limit ($1000), price drift detection (15%) |
