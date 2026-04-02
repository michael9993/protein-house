# CJ Dropshipping Integration Guide

Quick-start guide for connecting CJ Dropshipping to the Dropship Orchestrator app. For full documentation, see [SETUP.md](./SETUP.md).

## Prerequisites

- CJ Dropshipping account with API access ([developers.cjdropshipping.com](https://developers.cjdropshipping.com/))
- Saleor platform running with the Dropship Orchestrator app installed
- A public URL for receiving webhooks (Cloudflare tunnel or production domain)

## 1. Environment Setup

Add these to `infra/.env`:

```env
DROPSHIP_APP_PORT=3009
SECRET_KEY=<generate with: openssl rand -hex 32>
REDIS_URL=redis://aura-redis-dev:6379
DROPSHIP_APP_TUNNEL_URL=https://your-domain.com  # Public URL for CJ webhooks
```

Start the container:

```bash
docker compose -f infra/docker-compose.dev.yml up -d aura-dropship-app-dev
```

## 2. Install the App in Saleor

Navigate to **Dashboard > Apps > Install External App** and enter:

```
http://aura-dropship-app:3009/api/manifest
```

Or use the install script:

```powershell
.\infra\platform.ps1 install-apps
```

## 3. Configure CJ Credentials

1. Go to **Dashboard > Apps > Dropship Orchestrator**
2. Navigate to **Suppliers > CJ Dropshipping**
3. Enter your CJ API key
4. Click **Test Connection** to verify

## 4. Register Webhooks in CJ Portal

In your CJ developer portal ([developers.cjdropshipping.com](https://developers.cjdropshipping.com/) > Webhook Settings), register these URLs:

| Event | URL |
|-------|-----|
| Order Status | `https://<YOUR_DOMAIN>/api/webhooks/cj/order` |
| Logistics Update | `https://<YOUR_DOMAIN>/api/webhooks/cj/logistics` |
| Stock Change | `https://<YOUR_DOMAIN>/api/webhooks/cj/stock` |

Replace `<YOUR_DOMAIN>` with your tunnel or production domain.

## 5. Tag Products in Saleor

Each product you want fulfilled by CJ needs private metadata. In **Dashboard > Products > [Product] > Metadata**, add a private metadata entry:

**Key:** `dropship`

**Value (JSON):**

```json
{
  "supplier": "cj",
  "supplierSku": "CJ_VARIANT_VID_HERE",
  "supplierProductId": "CJ_PRODUCT_PID_HERE",
  "costPrice": 5.99,
  "costCurrency": "USD"
}
```

- `supplierSku` is the CJ variant ID (`vid`) from the CJ product page
- `supplierProductId` is the CJ product ID (`pid`)
- `costPrice` is your wholesale cost for margin tracking

Optional shipping metadata (separate keys):

| Key | Value | Example |
|-----|-------|---------|
| `shipping.estimatedMinDays` | Minimum delivery days | `7` |
| `shipping.estimatedMaxDays` | Maximum delivery days | `15` |
| `shipping.carrier` | Default carrier name | `CJ Packet` |

## 6. Configure Settings

Navigate to **Dropship Orchestrator > Settings** and configure:

### General Tab
- **Auto-forward orders:** Enable to automatically send paid orders to CJ
- **Cost ceiling:** Maximum supplier cost as % of sell price (default: 70%)
- **Daily spend limit:** Pause auto-ordering above this USD amount (default: $1,000)

### Fraud Detection Tab
- **Velocity check:** Flag customers placing too many orders too fast
- **Address mismatch:** Flag when billing/shipping addresses differ significantly
- **Value threshold:** Flag high-value orders (lower threshold for new customers)

### IP Whitelist Tab
Add CJ's outbound IP addresses to secure webhook endpoints:

```
47.252.50.116/32
47.252.50.117/32
47.252.50.118/32
47.252.50.119/32
47.88.76.0/24
```

### Blacklist Tab
Add known fraudulent emails, addresses, phone numbers, or IPs as needed.

## 7. Testing Checklist

Run through these steps to verify the integration end-to-end:

- [ ] **Connection:** Test Connection button in CJ config shows success
- [ ] **Product tagging:** At least one product has correct `dropship` metadata
- [ ] **Place a test order:** Purchase a CJ-tagged product on the storefront
- [ ] **Order forwarding:** Check Dropship Orchestrator > Orders for the forwarded order
- [ ] **Webhook delivery:** Verify CJ sends order status updates (check Audit Log)
- [ ] **Tracking sync:** After CJ ships, verify tracking number appears in Saleor fulfillment
- [ ] **Fraud detection:** Place an order that triggers a fraud rule, verify it appears in Exceptions
- [ ] **Cost ceiling:** Verify orders above cost ceiling % are held for review

## 8. Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Auth failed" on Test Connection | Invalid API key | Regenerate key in CJ developer portal |
| Webhooks not received | Wrong URL or IP block | Verify webhook URLs in CJ portal; check IP whitelist |
| Order not forwarded | Product missing metadata | Add `dropship` private metadata with `supplier: "cj"` |
| Order forwarded but stuck | CJ balance insufficient | Top up CJ account balance |
| "Cost ceiling exceeded" | Supplier cost > threshold | Adjust cost ceiling % in Settings, or update product cost |
| "Daily spend limit reached" | Auto-ordering paused | Wait for reset (midnight UTC) or increase limit |
| Duplicate webhook processing | Normal CJ retry behavior | Redis deduplication handles this automatically |
| Tracking not showing | CJ hasn't shipped yet | Tracking appears after CJ fulfills; sync runs every 2h |

## 9. Production Checklist

Before going live:

- [ ] Generate a strong `SECRET_KEY` (`openssl rand -hex 32`)
- [ ] Set `DROPSHIP_APP_TUNNEL_URL` to your production domain
- [ ] Enable IP whitelist with CJ's current outbound IPs
- [ ] Enable fraud detection with appropriate thresholds
- [ ] Set cost ceiling and daily spend limits for your business
- [ ] Verify CJ account has sufficient balance for auto-ordering
- [ ] Test the full order flow with a real CJ product
- [ ] Monitor the Audit Log for the first few days after launch
- [ ] Set up alerts for exception queue items (manual review needed)

## Architecture Overview

```
Customer Order (Saleor)
    |
    v
ORDER_PAID webhook
    |
    v
Order Classifier (reads product metadata)
    |
    v
Fraud Detection (4 rules, score < 50 passes)
    |
    v
Financial Safety (cost ceiling + daily spend)
    |
    v
CJ Adapter (2-step: createOrder -> confirmOrder)
    |
    v
Background Jobs:
  - Tracking sync (every 2h)
  - Reconciliation (every 6h)
  - Token refresh (every 12d)
    |
    v
CJ Webhooks (order status, logistics, stock)
  - Redis deduplication (24h TTL)
  - IP whitelist verification
  - Auto-fulfillment creation in Saleor
```

For the complete config template with all settings and defaults, see [`cj-config.template.yml`](./cj-config.template.yml).
