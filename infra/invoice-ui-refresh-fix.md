# Fix: Invoice Not Appearing Immediately in Dashboard

## The Problem

After generating an invoice, you need to exit the order and come back to see it. This is because the Dashboard's GraphQL cache doesn't automatically refresh after the invoice webhook completes.

## Why This Happens

```
1. User clicks "Request Invoice" in Dashboard
   ↓
2. Dashboard sends mutation to Saleor
   ↓
3. Saleor creates invoice record
   ↓
4. Dashboard shows success (but invoice data is not in the order query yet)
   ↓
5. Saleor sends INVOICE_REQUESTED webhook to Invoice App (async)
   ↓
6. Invoice App generates PDF and updates invoice
   ↓
7. Dashboard still shows OLD cached data (no PDF URL yet)
```

## Solutions

### Solution 1: Manual Refresh (Current Workaround)
- Exit the order and re-enter
- This forces Dashboard to fetch fresh data

### Solution 2: Auto-refresh after Invoice Request (Dashboard Fix)

The Dashboard needs to refetch the order query after invoice generation. This requires modifying the Dashboard code.

**Location:** `dashboard/src/orders/views/OrderDetailsView` or similar

**Add refetch logic:**
```typescript
const handleInvoiceRequest = async () => {
  await invoiceRequest({ id: orderId });
  
  // Refetch order data to show the new invoice
  await refetchOrder();
  
  // OR invalidate Apollo cache
  apolloClient.cache.evict({ 
    id: `Order:${orderId}`, 
    fieldName: 'invoices' 
  });
};
```

### Solution 3: Polling (Quick Dashboard Fix)

Add automatic polling in the Dashboard to refresh order data every few seconds after invoice request:

```typescript
// Poll for 30 seconds after invoice request
useEffect(() => {
  if (invoiceRequested) {
    const interval = setInterval(() => {
      refetchOrder();
    }, 3000); // Every 3 seconds
    
    setTimeout(() => clearInterval(interval), 30000); // Stop after 30s
    
    return () => clearInterval(interval);
  }
}, [invoiceRequested]);
```

### Solution 4: WebSocket/GraphQL Subscription (Best Long-term)

Use GraphQL subscriptions to listen for invoice updates:

```graphql
subscription OrderInvoiceUpdated($orderId: ID!) {
  event {
    ... on InvoiceRequested {
      invoice {
        id
        url
        number
      }
    }
  }
}
```

## Quick Test Without Code Changes

**Browser Console Workaround:**
1. Open browser DevTools (F12)
2. After requesting invoice, wait 5 seconds
3. Run in console:
```javascript
window.location.reload()
```

This will refresh the entire page and show the invoice.

## Recommendation

For now, **use the manual workaround** (exit and re-enter the order). 

To properly fix this, the **Saleor Dashboard** needs to be updated to either:
- Refetch order data after invoice operations
- Use polling during invoice generation
- Implement GraphQL subscriptions for real-time updates

This is a **Dashboard UX issue**, not an Invoice app issue.

