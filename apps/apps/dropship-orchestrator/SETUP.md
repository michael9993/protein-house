# Dropship Orchestrator — Setup & Operations Guide

## Overview

The Dropship Orchestrator is a standalone Saleor App that acts as middleware between customer orders and supplier APIs (AliExpress + CJ Dropshipping). When enabled, it auto-forwards dropship-tagged orders to suppliers, syncs tracking/fulfillment, and provides an admin dashboard with fraud detection and financial safety controls.

**Architecture**: ORDER_PAID webhook → classify lines → fraud check → cost ceiling → forward to supplier → sync tracking → create fulfillment

**Port**: 3009 | **Container**: `saleor-dropship-app-dev`

---

## Prerequisites

Before starting, ensure you have:

- [ ] Docker Compose environment running (`docker compose -f infra/docker-compose.dev.yml up -d`)
- [ ] Saleor API accessible at `http://localhost:8000/graphql/`
- [ ] Redis running (shared `saleor-redis-dev` container)
- [ ] AliExpress developer account (https://open.aliexpress.com/)
- [ ] CJ Dropshipping developer account (https://developers.cjdropshipping.com/)

---

## Step 1: Environment Variables

Add these to `infra/.env` (create if missing):

```env
# Dropship Orchestrator
DROPSHIP_APP_PORT=3009
DROPSHIP_APP_TUNNEL_URL=          # Set if using ngrok/cloudflared for external webhooks

# Encryption key for supplier credentials (REQUIRED for production)
# Generate with: openssl rand -hex 32
SECRET_KEY=your-secret-key-here

# Redis (already shared with other services)
REDIS_URL=redis://saleor-redis-dev:6379
```

**Production-critical**: The `SECRET_KEY` encrypts supplier API credentials stored in Saleor metadata. Without it, the app will refuse to start in production mode.

---

## Step 2: Start the Container

```bash
# Start the dropship app container
docker compose -f infra/docker-compose.dev.yml up -d saleor-dropship-app-dev

# Wait for it to be healthy, then check logs
docker compose -f infra/docker-compose.dev.yml logs -f saleor-dropship-app-dev

# Verify it's running
curl http://localhost:3009/api/manifest
```

The manifest endpoint should return JSON with the app name, permissions, and two webhook definitions (ORDER_FULLY_PAID, ORDER_CANCELLED).

**If the container fails to start:**
```bash
# Install dependencies (first time only)
docker exec -it saleor-dropship-app-dev pnpm install

# Check for type errors
docker exec -it saleor-dropship-app-dev pnpm type-check

# View full logs
docker compose -f infra/docker-compose.dev.yml logs --tail=200 saleor-dropship-app-dev
```

---

## Step 3: Register the App in Saleor

1. Open the Saleor Dashboard: http://localhost:9000
2. Go to **Apps** > **Install external app**
3. Enter the manifest URL: `http://saleor-dropship-app-dev:3000/api/manifest`
4. Click **Install**

The app will register and request these permissions:
- `MANAGE_PRODUCTS` — Read product metadata (dropship tags)
- `MANAGE_ORDERS` — Read orders, create fulfillments, update metadata
- `MANAGE_APPS` — Store encrypted credentials in app metadata
- `MANAGE_SHIPPING` — Read shipping methods
- `MANAGE_CHECKOUTS` — Read checkout data for fraud checks

After registration, the background job scheduler will automatically start (tracking sync every 2h, reconciliation every 6h, CJ token refresh every 12d).

---

## Step 4: Configure Suppliers

### AliExpress Setup

1. Open the app in the Saleor Dashboard (Apps > Dropship Orchestrator)
2. Navigate to **Suppliers** > **AliExpress**
3. Enter your credentials:
   - **App Key**: From AliExpress Open Platform developer console
   - **App Secret**: From AliExpress Open Platform developer console
4. Click **Connect** — this initiates the OAuth flow
5. Authorize the app in the AliExpress popup
6. The access token will be stored (encrypted) in Saleor metadata

**Token lifecycle**: AliExpress tokens last ~1 year. The app will warn you 30 days before expiry. Token refresh is unreliable per AliExpress docs — you'll need to re-authorize when it expires.

**API reference**: All requests go to `https://api-sg.aliexpress.com/sync` with MD5 signing.

### CJ Dropshipping Setup

1. Navigate to **Suppliers** > **CJ Dropshipping**
2. Enter your **API Key** from CJ developer dashboard
3. Click **Connect** — the app will exchange it for an access token
4. Verify the connection shows "Connected" status

**Token lifecycle**: CJ tokens expire after 15 days. The background job scheduler automatically refreshes them every 12 days.

**Webhooks**: After connecting, the app registers webhook endpoints with CJ for:
- Order status updates → `POST /api/webhooks/cj/order`
- Logistics/tracking updates → `POST /api/webhooks/cj/logistics`
- Stock level changes → `POST /api/webhooks/cj/stock`

**For local development**: CJ webhooks need a public URL. Use a tunnel:
```bash
# Option 1: ngrok
ngrok http 3009

# Option 2: cloudflared
cloudflared tunnel --url http://localhost:3009
```

Set `DROPSHIP_APP_TUNNEL_URL` in `.env` to the tunnel URL, then restart the container.

---

## Step 5: Tag Products for Dropshipping

Products are tagged via Saleor **product metadata** — no schema changes needed. There are two ways to tag products:

### Option A: Via Saleor Dashboard (manual)

1. Go to Products > select a product
2. Open the **Metadata** section
3. Add a private metadata entry:
   - **Key**: `dropship`
   - **Value**: (JSON)
   ```json
   {
     "supplier": "aliexpress",
     "supplierSku": "1005006123456789",
     "supplierSkuAttr": "14:173#Red;5:361386#M",
     "costPrice": 12.50,
     "costCurrency": "USD"
   }
   ```

### Option B: Via Bulk Manager (bulk import)

Use the Bulk Manager app to import products with dropship metadata via CSV:

```csv
name,productType,category,metadata
"Red Running Shoe",Shoes,Footwear,"dropship:{""supplier"":""cj"",""supplierSku"":""CJ123456"",""costPrice"":15.00,""costCurrency"":""USD""}"
```

Upload at: Dashboard > Apps > Bulk Manager > Products

### Metadata Fields

| Field | Required | Description |
|-------|----------|-------------|
| `supplier` | Yes | `"aliexpress"` or `"cj"` |
| `supplierSku` | Yes | Supplier's product/variant SKU/ID |
| `supplierSkuAttr` | No | AliExpress variant attributes (e.g., color+size) |
| `supplierUrl` | No | Direct link to supplier product page |
| `costPrice` | Yes | Wholesale cost in supplier's currency |
| `costCurrency` | No | Default: `"USD"` |
| `lastSyncedAt` | Auto | Set by the app on stock/price sync |

**Products WITHOUT `dropship` metadata are treated as concrete inventory and ignored by the app.**

---

## Step 6: Configure Safety Controls

Navigate to **Settings** in the app dashboard.

### Fraud Detection Rules

| Rule | Default | Description |
|------|---------|-------------|
| Velocity check | Enabled | Max 3 orders/hour, max $500/24h from same customer |
| Address mismatch | Enabled | Flag when billing ≠ shipping country |
| Value threshold | Enabled | Flag orders > $200 (or > $100 for new customers) |
| Blacklist match | Enabled | Block known fraudulent emails/addresses/phones |

**Fraud score threshold**: Orders scoring >= 50/100 are flagged as exceptions.

### Financial Safety

| Setting | Default | Description |
|---------|---------|-------------|
| Cost ceiling | 70% | Supplier cost must be < 70% of sell price |
| Daily spend limit | $1,000 | Auto-ordering pauses when daily spend hits this |
| Auto-forward | Enabled | When disabled, orders queue for manual approval |

### IP Whitelist (CJ Webhooks)

CJ webhook endpoints are IP-restricted to CJ's known IP ranges:
- `47.252.50.116-119`
- `47.88.76.0/24`

You can add custom IPs in the Settings page.

---

## Step 7: Test the Flow

### End-to-End Test Checklist

1. **Tag a test product** with dropship metadata (Step 5)
2. **Place a test order** via the storefront checkout
3. **Pay the order** (Stripe test mode: card `4242 4242 4242 4242`)
4. **Verify ORDER_PAID fires**: Check app logs
   ```bash
   docker compose -f infra/docker-compose.dev.yml logs --tail=50 saleor-dropship-app-dev
   ```
5. **Verify order classified**: Log should show "Classified X lines: Y concrete, Z supplier groups"
6. **Verify fraud check**: Log should show "Fraud check: score=X, passed=true/false"
7. **If passed**: Log shows "Order forwarded successfully"
8. **Check Saleor order metadata**: Should have `dropship.status = "forwarded"` and `dropship.suppliers` with supplier order IDs
9. **Wait for tracking sync** (or trigger manually from Orders page)
10. **Verify fulfillment created** when tracking number arrives

### Testing Fraud Detection

Place an order that triggers fraud rules:
- **Velocity**: Place 4+ orders in quick succession with the same email
- **Value threshold**: Place a $250+ order with a new customer account
- **Address mismatch**: Use different countries for billing and shipping

Check the **Exceptions** page — flagged orders should appear for review.

### Testing Exception Handling

1. Go to **Exceptions** in the app dashboard
2. Find a flagged order
3. **Approve**: Forwards the order to the supplier
4. **Reject**: Cancels the order (manual refund needed)

---

## Admin Dashboard Pages

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/` | Overview stats, recent orders, alerts |
| Suppliers | `/suppliers` | Supplier list, connection status, toggle on/off |
| Orders | `/orders` | Synced orders with status filters |
| Exceptions | `/exceptions` | Fraud/cost flagged orders — approve or reject |
| Settings | `/settings` | Fraud rules, cost ceiling, daily limit, IP whitelist |
| Audit Log | `/audit` | Complete trail of all API calls and actions |

---

## Monitoring & Troubleshooting

### View Logs

```bash
# Real-time logs
docker compose -f infra/docker-compose.dev.yml logs -f saleor-dropship-app-dev

# Last 200 lines
docker compose -f infra/docker-compose.dev.yml logs --tail=200 saleor-dropship-app-dev
```

### Check Background Jobs

Background jobs run on BullMQ with Redis. To inspect:

```bash
# Connect to Redis and check queues
docker exec -it saleor-redis-dev redis-cli

# List all dropship queues
KEYS dropship:*

# Check tracking sync queue
LLEN bull:dropship:tracking-sync:wait
LLEN bull:dropship:tracking-sync:active
LLEN bull:dropship:tracking-sync:failed
```

### Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| App won't start | Missing dependencies | `docker exec -it saleor-dropship-app-dev pnpm install` |
| Webhooks not firing | App not registered | Re-register via Dashboard > Apps |
| Webhooks not firing | Wrong webhook URL | Check `APP_API_BASE_URL` in env |
| Orders not forwarding | Dropship disabled | Check Settings > "Orchestration Enabled" toggle |
| Orders not forwarding | No dropship metadata | Verify product metadata has `dropship.supplier` |
| Fraud false positives | Thresholds too low | Adjust in Settings > Fraud Detection |
| CJ webhooks blocked | IP not whitelisted | Add CJ IPs in Settings > IP Whitelist |
| Background jobs stuck | Redis connection lost | Check `REDIS_URL` env, restart container |
| Credentials not saved | Missing `SECRET_KEY` | Set `SECRET_KEY` in env, restart |

### Restart Procedure

```bash
# Simple restart
docker compose -f infra/docker-compose.dev.yml restart saleor-dropship-app-dev

# Full rebuild (after dependency changes)
docker compose -f infra/docker-compose.dev.yml up -d --force-recreate saleor-dropship-app-dev

# Check health after restart
docker compose -f infra/docker-compose.dev.yml ps saleor-dropship-app-dev
```

---

## Production Deployment Checklist

### Security

- [ ] Set `SECRET_KEY` to a strong random value (`openssl rand -hex 32`)
- [ ] Set `NODE_ENV=production` (forces encryption key requirement)
- [ ] Verify AliExpress OAuth token is fresh (< 11 months old)
- [ ] Verify CJ access token is active
- [ ] Review and tighten fraud thresholds for your market
- [ ] Set appropriate daily spend limit
- [ ] Verify CJ webhook IP whitelist matches current CJ infrastructure

### Infrastructure

- [ ] Redis is persistent (not ephemeral) for BullMQ job state
- [ ] App has network access to both AliExpress and CJ APIs
- [ ] Saleor API URL is correct (not localhost)
- [ ] Tunnel URL (or public URL) is set for CJ webhook delivery
- [ ] Container health checks are configured
- [ ] Log aggregation is set up (the app logs JSON via @saleor/apps-logger)

### Testing

- [ ] Place a test order with a dropship product
- [ ] Verify order is forwarded to supplier
- [ ] Verify tracking sync creates fulfillment
- [ ] Verify fraud detection flags suspicious orders
- [ ] Verify cost ceiling blocks orders above threshold
- [ ] Verify daily spend limit pauses auto-ordering
- [ ] Test exception approval/rejection flow
- [ ] Verify audit log captures all operations

### Monitoring

- [ ] Set up alerts for:
  - Container health check failures
  - Redis connection errors
  - Supplier API errors (check audit log)
  - High exception rate (> 10% of orders)
  - Daily spend limit reached
  - Token expiration warnings

---

## Architecture Reference

```
Customer Order (Saleor)
  └→ ORDER_FULLY_PAID webhook
       │
       ▼
┌─ Dropship Orchestrator ──────────────────────┐
│                                               │
│  1. Fetch full order + line items              │
│  2. Classify: concrete vs dropship             │
│  3. Fraud check (velocity, address, value,     │
│     blacklist) → exception if score >= 50      │
│  4. Cost ceiling check → exception if exceeded │
│  5. Daily spend check → exception if limit hit │
│  6. Forward to supplier adapter (with retries) │
│  7. Store supplier order ID in Saleor metadata │
│  8. Log to audit trail                         │
│                                               │
│  Background Jobs (BullMQ + Redis)             │
│  ├─ Tracking sync (every 2h)                  │
│  ├─ Reconciliation (every 6h)                 │
│  └─ CJ token refresh (every 12d)             │
│                                               │
│  CJ Webhooks (order, logistics, stock)        │
│  ├─ IP whitelisted                            │
│  ├─ Redis-backed deduplication                │
│  └─ Update Saleor order metadata + fulfillment│
└───────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/pages/api/manifest.ts` | App manifest + webhook registration |
| `src/pages/api/register.ts` | App registration + scheduler init |
| `src/pages/api/webhooks/saleor/order-paid.ts` | ORDER_FULLY_PAID webhook handler |
| `src/pages/api/webhooks/cj/*.ts` | CJ webhook endpoints (order, logistics, stock) |
| `src/modules/webhooks/order-paid/use-case.ts` | Core business logic (classify → check → forward) |
| `src/modules/webhooks/order-paid/order-classifier.ts` | Classify lines by supplier |
| `src/modules/suppliers/aliexpress/adapter.ts` | AliExpress API adapter |
| `src/modules/suppliers/cj/adapter.ts` | CJ Dropshipping API adapter |
| `src/modules/fraud/fraud-checker.ts` | Composite fraud scoring (4 rules) |
| `src/modules/pricing/cost-ceiling.ts` | Cost ceiling percentage check |
| `src/modules/jobs/scheduler.ts` | BullMQ job scheduling |
| `src/modules/jobs/scheduler-init.ts` | Lazy scheduler init + graceful shutdown |
| `src/modules/security/ip-whitelist.ts` | CIDR-aware IP whitelisting |
| `src/modules/audit/audit-logger.ts` | Audit trail (1000 entries, encrypted) |
| `src/modules/lib/metadata-manager.ts` | Encrypted credential storage |

---

## What's Next (Phase 2 Features)

These are not implemented yet but designed for future iterations:

1. **Product tagging UI** — Browse/search Saleor products and tag them with dropship metadata directly from the admin dashboard
2. **Email notifications** — Alert admins when exceptions are created or suppliers fail
3. **Stock sync** — Periodic polling of supplier stock levels, auto-update Saleor inventory
4. **Price drift detection** — Alert when supplier cost changes > X% since listing
5. **Margin analytics dashboard** — Revenue vs supplier cost visualization
6. **Auto-pause unhealthy suppliers** — Circuit breaker auto-disables suppliers with high failure rates
7. **Multi-supplier order splitting notification** — Email customers when order is split across suppliers
8. **Bulk import with dropship metadata** — Enhanced Bulk Manager integration
9. **Currency conversion** — Auto-convert supplier costs to store currency for margin calculation
