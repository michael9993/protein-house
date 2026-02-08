# Orders API Reference

Source: https://docs.saleor.io/developer/order/ + /api-reference/orders/

## Key Types

### Order

```graphql
type Order implements Node, ObjectWithMetadata {
  id: ID!
  privateMetadata: [MetadataItem!]!
  metadata: [MetadataItem!]!
  created: DateTime!
  updatedAt: DateTime!
  status: OrderStatus!
  origin: OrderOriginEnum!
  original: ID
  user: User
  userEmail: String
  customerNote: String!
  billingAddress: Address
  shippingAddress: Address
  shippingMethodName: String
  shippingMethods: [ShippingMethod!]!
  availableCollectionPoints: [Warehouse!]!
  deliveryMethod: DeliveryMethod
  isShippingRequired: Boolean!
  shippingPrice: TaxedMoney!
  undiscountedShippingPrice: Money!
  shippingTaxRate: Float!
  shippingTaxClass: TaxClass
  lines: [OrderLine!]!
  fulfillments: [Fulfillment!]!
  channel: Channel!
  total: TaxedMoney!
  undiscountedTotal: TaxedMoney!
  subtotal: TaxedMoney!
  weight: Weight!
  discounts: [OrderDiscount!]!
  voucher: Voucher
  voucherCode: String
  giftCards: [GiftCard!]!
  isPaid: Boolean!
  paymentStatus: PaymentChargeStatusEnum!
  paymentStatusDisplay: String!
  authorizeStatus: OrderAuthorizeStatusEnum!
  chargeStatus: OrderChargeStatusEnum!
  payments: [Payment!]!
  transactions: [TransactionItem!]!
  totalAuthorized: Money!
  totalCharged: Money!
  totalCanceled: Money!
  totalBalance: Money!
  taxExemption: Boolean!
  displayGrossPrices: Boolean!
  grantedRefunds: [OrderGrantedRefund!]!
  totalGrantedRefund: Money!
  totalRefunded: Money!
  totalRefundPending: Money!
  totalRemainingGrant: Money!
  totalAuthorizePending: Money!
  totalChargePending: Money!
  totalCancelPending: Money!
  number: String!
  redirectUrl: String
  externalReference: String
  checkoutId: ID
  events: [OrderEvent!]!
  actions: [OrderAction!]!
  canFinalize: Boolean!
  languageCodeEnum: LanguageCodeEnum!
  invoices: [Invoice!]!
  errors: [OrderError!]!
  statusDisplay: String!
}
```

### OrderStatus Enum

```
DRAFT              # Draft order (not yet confirmed)
UNCONFIRMED        # Created from checkout, not yet confirmed
UNFULFILLED        # Confirmed, awaiting fulfillment
PARTIALLY_FULFILLED
FULFILLED          # All items shipped
PARTIALLY_RETURNED
RETURNED
CANCELED
EXPIRED
```

### OrderOriginEnum

```
CHECKOUT           # Created from customer checkout
DRAFT              # Created as draft order by staff
REISSUE            # Created from existing order (reorder)
BULK_CREATE        # Created via bulk import
```

### OrderAuthorizeStatusEnum / OrderChargeStatusEnum

Values: `NONE`, `PARTIAL`, `FULL`

## Queries

### orders

```graphql
orders(
  sortBy: OrderSortingInput
  filter: OrderFilterInput      # DEPRECATED
  where: OrderWhereInput        # Preferred (Saleor 3.22+)
  channel: String
  search: String
  before: String, after: String, first: Int, last: Int
): OrderCountableConnection
```

Permission: `MANAGE_ORDERS`
Max 100 items per request. Does not trigger external requests (no shipping/tax calculations).

### order

```graphql
order(id: ID, externalReference: String): Order
```

Permission: `MANAGE_ORDERS` for full access. With order ID only: basic details (no user info, events, invoices).

### orderByToken (deprecated)

```graphql
orderByToken(token: UUID!): Order
```

## Mutations

### orderMarkAsPaid

```graphql
orderMarkAsPaid(id: ID!, transactionReference: String): OrderMarkAsPaid
```

Permission: `MANAGE_ORDERS`

### orderFulfill

```graphql
orderFulfill(
  input: OrderFulfillInput!
  order: ID
): OrderFulfill
```

Permission: `MANAGE_ORDERS`
Webhook: `FULFILLMENT_CREATED` (async), `ORDER_FULFILLED` (async, if fully fulfilled)

### orderCancel

```graphql
orderCancel(id: ID!): OrderCancel
```

Permission: `MANAGE_ORDERS`
Webhook: `ORDER_CANCELLED` (async)

### orderUpdate

```graphql
orderUpdate(id: ID!, input: OrderUpdateInput!): OrderUpdate
```

Permission: `MANAGE_ORDERS`
Webhook: `ORDER_UPDATED` (async)

### orderAddNote

```graphql
orderAddNote(order: ID!, input: OrderAddNoteInput!): OrderAddNote
```

Permission: `MANAGE_ORDERS`
Input: `{ message: String! }`

### draftOrderCreate

```graphql
draftOrderCreate(input: DraftOrderCreateInput!): DraftOrderCreate
```

Permission: `MANAGE_ORDERS`
Webhook: `DRAFT_ORDER_CREATED` (async)

Key input fields: `user`, `userEmail`, `channel`, `lines` (variantId + quantity), `billingAddress`, `shippingAddress`, `shippingMethod`, `voucher`, `discount`, `customerNote`, `externalReference`

### draftOrderUpdate

```graphql
draftOrderUpdate(id: ID!, input: DraftOrderInput!): DraftOrderUpdate
```

Permission: `MANAGE_ORDERS`
Webhook: `DRAFT_ORDER_UPDATED` (async)

### draftOrderComplete

```graphql
draftOrderComplete(id: ID!): DraftOrderComplete
```

Permission: `MANAGE_ORDERS`
Webhook: `DRAFT_ORDER_COMPLETED` (async), `ORDER_CREATED` (async)

Transitions draft to unfulfilled status.

### orderConfirm

```graphql
orderConfirm(id: ID!): OrderConfirm
```

Permission: `MANAGE_ORDERS`
Webhook: `ORDER_CONFIRMED` (async)

### orderRefundProducts / orderReturnProducts

```graphql
orderRefundProducts(order: ID!, input: OrderRefundProductsInput!): OrderRefundProducts
orderReturnProducts(order: ID!, input: OrderReturnProductsInput!): OrderReturnProducts
```

Permission: `MANAGE_ORDERS`

## Common Patterns

### Querying Orders with Details

```graphql
query Orders($channel: String!, $first: Int!) {
  orders(channel: $channel, first: $first, sortBy: { field: CREATED_AT, direction: DESC }) {
    edges {
      node {
        id
        number
        status
        created
        total { gross { amount currency } }
        user { email firstName lastName }
        lines {
          productName
          variantName
          quantity
          unitPrice { gross { amount currency } }
          totalPrice { gross { amount currency } }
        }
        fulfillments { status trackingNumber }
        paymentStatus
        authorizeStatus
        chargeStatus
      }
    }
    pageInfo { hasNextPage endCursor }
    totalCount
  }
}
```

### Creating a Draft Order

```graphql
mutation {
  draftOrderCreate(input: {
    channel: "default-channel"
    userEmail: "customer@example.com"
    lines: [
      { variantId: "UHJvZHVjdFZhcmlhbnQ6MQ==", quantity: 2 }
    ]
    shippingAddress: {
      firstName: "John", lastName: "Doe"
      streetAddress1: "123 Main St", city: "New York"
      country: US, postalCode: "10001"
    }
    billingAddress: {
      firstName: "John", lastName: "Doe"
      streetAddress1: "123 Main St", city: "New York"
      country: US, postalCode: "10001"
    }
  }) {
    order { id number status }
    errors { field code message }
  }
}
```

## Key Concepts

- Orders are created from completed checkouts or draft orders
- `automaticallyConfirmAllNewOrders` channel setting controls auto-confirmation
- `allowUnpaidOrders` channel setting allows order creation without payment
- `expireOrdersAfter` (minutes) + `deleteExpiredOrdersAfter` (days) control expiration
- Historical data preserved for deleted products (`productName`, `productSku` on order lines)
- Access control: public data with order ID, private data requires `MANAGE_ORDERS`
- Transaction access requires `MANAGE_CHECKOUTS` + `HANDLE_PAYMENTS`

## Channel Settings

```graphql
# Relevant order settings per channel
automaticallyConfirmAllNewOrders: Boolean
allowUnpaidOrders: Boolean
expireOrdersAfter: Int       # Minutes
deleteExpiredOrdersAfter: Int # Days
markAsPaidStrategy: MarkAsPaidStrategyEnum

# Store-level settings
fulfillmentAutoApprove: Boolean
fulfillmentAllowUnpaid: Boolean
```