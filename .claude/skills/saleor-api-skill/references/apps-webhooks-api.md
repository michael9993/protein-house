# Apps & Webhooks API Reference

Source: https://docs.saleor.io/developer/extending/ + /api-reference/apps/ + /api-reference/webhooks/

## App Architecture

Saleor Apps are technology-agnostic web applications that communicate with Saleor through webhooks and GraphQL API. They extend platform functionality for payments, notifications, tax calculation, search, and more.

## Key Types

### App

```graphql
type App implements Node, ObjectWithMetadata {
  id: ID!
  privateMetadata: [MetadataItem!]!
  metadata: [MetadataItem!]!
  permissions: [Permission!]
  created: DateTime
  isActive: Boolean
  name: String
  type: AppTypeEnum
  tokens: [AppToken!]
  webhooks: [Webhook!]
  aboutApp: String
  dataPrivacy: String
  dataPrivacyUrl: String
  homepageUrl: String
  supportUrl: String
  configurationUrl: String
  appUrl: String
  manifestUrl: String
  version: String
  accessToken: String
  author: String
  extensions: [AppExtension!]!
  brand: AppBrand
}
```

### AppTypeEnum

- `LOCAL` — installed from manifest URL, receives webhooks
- `THIRDPARTY` — installed from Saleor App Store

### Webhook

```graphql
type Webhook implements Node {
  id: ID!
  name: String!
  events: [WebhookEvent!]! # deprecated
  syncEvents: [WebhookEventSync!]!
  asyncEvents: [WebhookEventAsync!]!
  app: App!
  targetUrl: String!
  isActive: Boolean!
  secretKey: String
  subscriptionQuery: String
  customHeaders: JSONString
}
```

## App Mutations

### appCreate

```graphql
appCreate(input: AppInput!): AppCreate
```

Permission: `MANAGE_APPS`

Input: `name`, `permissions` (list of PermissionEnum), `isActive`

### appInstall

```graphql
appInstall(input: AppInstallInput!): AppInstall
```

Permission: `MANAGE_APPS`

Input: `appName`, `manifestUrl`, `permissions`, `activateAfterInstallation`

### appUpdate

```graphql
appUpdate(id: ID!, input: AppInput!): AppUpdate
```

### appDelete

```graphql
appDelete(id: ID!): AppDelete
```

### appTokenCreate

```graphql
appTokenCreate(input: AppTokenInput!): AppTokenCreate
```

Permission: `MANAGE_APPS`

Input: `name`, `app` (App ID)

### appActivate / appDeactivate

```graphql
appActivate(id: ID!): AppActivate
appDeactivate(id: ID!): AppDeactivate
```

## Webhook Mutations

### webhookCreate

```graphql
webhookCreate(input: WebhookCreateInput!): WebhookCreate
```

Permission: `MANAGE_APPS` or the owning app

Input: `name`, `targetUrl`, `events` (deprecated), `asyncEvents`, `syncEvents`, `app` (ID), `isActive`, `secretKey`, `query` (subscription query), `customHeaders`

```graphql
mutation {
  webhookCreate(input: {
    name: "Product Updates"
    targetUrl: "https://myapp.example.com/webhooks/products"
    asyncEvents: [PRODUCT_CREATED, PRODUCT_UPDATED, PRODUCT_DELETED]
    app: "QXBwOjE="
    isActive: true
    query: "subscription { event { ... on ProductUpdated { product { id name slug } } } }"
  }) {
    webhook { id name isActive }
    errors { field code message }
  }
}
```

### webhookUpdate

```graphql
webhookUpdate(id: ID!, input: WebhookUpdateInput!): WebhookUpdate
```

### webhookDelete

```graphql
webhookDelete(id: ID!): WebhookDelete
```

### webhookDryRun

```graphql
webhookDryRun(objectId: ID!, query: String!): WebhookDryRun
```

Tests webhook payload without sending actual request (async events only).

## Webhook Events

### Synchronous Events

Block the request until response (20s timeout: 2s connection + 18s response). Used for:

- **Shipping**: `SHIPPING_LIST_METHODS_FOR_CHECKOUT`, `FILTER_SHIPPING_METHODS`
- **Tax**: `CHECKOUT_CALCULATE_TAXES`, `ORDER_CALCULATE_TAXES`
- **Transactions**: `TRANSACTION_INITIALIZE_SESSION`, `TRANSACTION_PROCESS_SESSION`, `TRANSACTION_CHARGE_REQUESTED`, `TRANSACTION_REFUND_REQUESTED`, `TRANSACTION_CANCELATION_REQUESTED`
- **Payment**: `PAYMENT_GATEWAY_INITIALIZE_SESSION`, `PAYMENT_LIST_GATEWAYS`, `PAYMENT_METHOD_INITIALIZE_TOKENIZATION`, `LIST_STORED_PAYMENT_METHODS`
- **Checkout**: `CHECKOUT_FILTER_SHIPPING_METHODS`

### Asynchronous Events

Processed after request completion, no response delay. Major categories:

**Products**: `PRODUCT_CREATED`, `PRODUCT_UPDATED`, `PRODUCT_DELETED`, `PRODUCT_VARIANT_CREATED`, `PRODUCT_VARIANT_UPDATED`, `PRODUCT_VARIANT_DELETED`, `PRODUCT_VARIANT_BACK_IN_STOCK`, `PRODUCT_VARIANT_OUT_OF_STOCK`

**Orders**: `ORDER_CREATED`, `ORDER_CONFIRMED`, `ORDER_UPDATED`, `ORDER_FULFILLED`, `ORDER_CANCELLED`, `ORDER_EXPIRED`, `ORDER_PAID`, `ORDER_REFUNDED`

**Checkout**: `CHECKOUT_CREATED`, `CHECKOUT_UPDATED`, `CHECKOUT_FULLY_PAID`

**Fulfillment**: `FULFILLMENT_CREATED`, `FULFILLMENT_CANCELED`, `FULFILLMENT_APPROVED`, `FULFILLMENT_TRACKING_NUMBER_UPDATED`

**Customers**: `CUSTOMER_CREATED`, `CUSTOMER_UPDATED`, `CUSTOMER_METADATA_UPDATED`

**Notifications**: `NOTIFY_USER`

## Subscription Query Syntax

Webhook payloads use GraphQL subscription syntax to define shape:

```graphql
subscription {
  event {
    ... on ProductUpdated {
      product {
        id
        name
        slug
        pricing(channel: "default-channel") {
          priceRange { start { gross { amount currency } } }
        }
      }
    }
  }
}
```

Response format:
```json
{
  "event": "PRODUCT_UPDATED",
  "data": {
    "object": { "id": "...", "name": "...", "slug": "...", "pricing": { ... } }
  }
}
```

## Webhook HTTP Headers

Standard headers included in every webhook request:
- `Saleor-Event` — Event type identifier
- `Saleor-Domain` — Saleor domain
- `Saleor-Signature` — HMAC payload verification
- `Saleor-Api-Url` — GraphQL endpoint URL

Custom headers: max 5 per webhook, max 998 chars each. Only `Authorization` and `X-*` prefixed headers allowed.

## HMAC Signature Verification

Verify webhook authenticity using HMAC-SHA256:

```python
import hmac
import hashlib

def verify_signature(payload: bytes, signature: str, secret_key: str) -> bool:
    expected = hmac.new(
        secret_key.encode("utf-8"),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
```

## App Manifest Structure

Apps are installed via manifest URL. Key manifest fields:

```json
{
  "id": "my-saleor-app",
  "version": "1.0.0",
  "name": "My Saleor App",
  "about": "Description of the app",
  "permissions": ["MANAGE_ORDERS", "MANAGE_PRODUCTS"],
  "appUrl": "https://myapp.example.com",
  "configurationUrl": "https://myapp.example.com/configuration",
  "tokenTargetUrl": "https://myapp.example.com/api/register",
  "webhooks": [
    {
      "name": "Order Created",
      "asyncEvents": ["ORDER_CREATED"],
      "query": "subscription { event { ... on OrderCreated { order { id number } } } }",
      "targetUrl": "https://myapp.example.com/api/webhooks/order-created",
      "isActive": true
    }
  ],
  "extensions": []
}
```

## App Queries

### apps

```graphql
apps(
  filter: AppFilterInput
  sortBy: AppSortingInput
  before: String, after: String, first: Int, last: Int
): AppCountableConnection
```

Permission: `MANAGE_APPS`

### app

```graphql
app(id: ID!): App
```

## Performance Constraints

- Maximum 20-second HTTP round-trip for sync webhooks
- 2s connection timeout + 18s response timeout
- Multiple sync webhooks compound latency
- Cold starts in serverless environments can cause delays