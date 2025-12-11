# WebSockets & Real-Time Updates in Saleor Dashboard

## Current Status

### ✅ What Works
- **Saleor API** supports GraphQL subscriptions over WebSockets
- API runs on **uvicorn (ASGI)** which supports WebSocket connections
- GraphQL schema includes subscription types: `orderCreated`, `orderUpdated`, `orderFulfilled`, etc.

### ❌ What Doesn't Work
- **Dashboard** does NOT use WebSockets for real-time updates
- **OrderList** component uses regular HTTP GraphQL queries
- **No polling** interval configured
- **Apollo Client** only has HTTP link (no WebSocket link)

## Current Behavior

**The dashboard requires manual refresh to see new orders.**

When a new order is created:
1. Order is saved to database ✅
2. Order appears in API queries ✅
3. Dashboard does NOT automatically update ❌
4. User must refresh the page to see new order ⚠️

## How to Verify

### Test WebSocket Support

```powershell
# Run the test script
.\infra\scripts\test-websockets.ps1

# Or manually test with wscat (if installed)
wscat -c ws://localhost:8000/graphql/
```

### Check Dashboard Configuration

The dashboard's Apollo Client is configured in:
- `dashboard/src/graphql/client.ts`

Current setup:
- ✅ HTTP link (for queries/mutations)
- ❌ No WebSocket link (for subscriptions)
- ❌ No polling intervals

## Solutions

### Option 1: Add Polling (Easiest)

Add a polling interval to the OrderList query:

```typescript
// dashboard/src/orders/views/OrderList/OrderList.tsx
const { data } = useOrderListQuery({
  displayLoader: true,
  skip: valueProvider.loading,
  variables: queryVariables,
  pollInterval: 5000, // Poll every 5 seconds
});
```

**Pros:**
- ✅ Easy to implement
- ✅ Works immediately
- ✅ No WebSocket configuration needed

**Cons:**
- ⚠️ Less efficient (constant polling)
- ⚠️ Not truly real-time (up to 5 second delay)

### Option 2: Add WebSocket Subscriptions (Best Practice)

1. **Install WebSocket dependencies:**
   ```bash
   cd dashboard
   pnpm add @apollo/client subscriptions-transport-ws graphql-ws
   ```

2. **Update Apollo Client** to support WebSockets:
   ```typescript
   // dashboard/src/graphql/client.ts
   import { split, HttpLink } from '@apollo/client';
   import { getMainDefinition } from '@apollo/client/utilities';
   import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
   import { createClient } from 'graphql-ws';

   const httpLink = new HttpLink({
     uri: getApiUrl(),
     credentials: 'include',
   });

   const wsLink = new GraphQLWsLink(createClient({
     url: getApiUrl().replace('http://', 'ws://').replace('https://', 'wss://'),
     connectionParams: () => ({
       // Add auth headers if needed
     }),
   }));

   const splitLink = split(
     ({ query }) => {
       const definition = getMainDefinition(query);
       return (
         definition.kind === 'OperationDefinition' &&
         definition.operation === 'subscription'
       );
     },
     wsLink,
     httpLink,
   );
   ```

3. **Add subscription to OrderList:**
   ```typescript
   // Subscribe to orderCreated events
   const { data: subscriptionData } = useSubscription(ORDER_CREATED_SUBSCRIPTION, {
     onData: ({ data }) => {
       // Refetch order list when new order is created
       refetch();
     },
   });
   ```

**Pros:**
- ✅ Truly real-time updates
- ✅ Efficient (only updates when events occur)
- ✅ Best practice for real-time applications

**Cons:**
- ⚠️ More complex to implement
- ⚠️ Requires WebSocket configuration
- ⚠️ Need to handle connection errors/reconnection

### Option 3: Hybrid Approach

Use polling as fallback, WebSockets when available:

```typescript
const { data } = useOrderListQuery({
  displayLoader: true,
  skip: valueProvider.loading,
  variables: queryVariables,
  pollInterval: websocketConnected ? 0 : 5000, // Poll only if WS not connected
});
```

## Testing WebSocket Connection

### Using Browser DevTools

1. Open Dashboard in browser
2. Open DevTools → Network tab
3. Filter by "WS" (WebSocket)
4. Look for connection to `ws://localhost:8000/graphql/`

### Using wscat

```bash
# Install wscat
npm install -g wscat

# Connect to Saleor API
wscat -c ws://localhost:8000/graphql/

# Send subscription query
> {"id":"1","type":"start","payload":{"query":"subscription { orderCreated { order { id number } } }"}}
```

## Troubleshooting

### WebSocket Connection Fails

1. **Check API is running:**
   ```powershell
   docker compose -f infra/docker-compose.dev.yml ps saleor-api
   ```

2. **Check CORS settings:**
   - Verify `ALLOWED_GRAPHQL_ORIGINS` includes dashboard origin
   - For tunnels, ensure tunnel domain is allowed

3. **Check firewall/proxy:**
   - WebSockets require HTTP upgrade
   - Some proxies block WebSocket connections

### Subscriptions Not Working

1. **Verify subscription types in schema:**
   ```graphql
   query {
     __schema {
       subscriptionType {
         fields {
           name
         }
       }
     }
   }
   ```

2. **Check authentication:**
   - WebSocket connections need to include auth tokens
   - Verify `connectionParams` in WebSocket client

## Recommendations

For **development**: Use **Option 1 (Polling)** - simple and sufficient

For **production**: Use **Option 2 (WebSockets)** - more efficient and scalable

## Related Files

- `dashboard/src/graphql/client.ts` - Apollo Client configuration
- `dashboard/src/orders/views/OrderList/OrderList.tsx` - Order list component
- `saleor/saleor/graphql/` - GraphQL schema and subscriptions
- `infra/scripts/test-websockets.ps1` - WebSocket test script

