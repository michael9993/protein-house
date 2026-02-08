# Checkout API Reference

Source: https://docs.saleor.io/developer/checkout/ + /api-reference/checkout/

## Key Types

### Checkout

```graphql
type Checkout implements Node, ObjectWithMetadata {
  id: ID!
  privateMetadata: [MetadataItem!]!
  privateMetafield(key: String!): String
  privateMetafields(keys: [String!]): Metadata
  metadata: [MetadataItem!]!
  metafield(key: String!): String
  metafields(keys: [String!]): Metadata
  created: DateTime!
  updatedAt: DateTime!
  user: User
  channel: Channel!
  billingAddress: Address
  shippingAddress: Address
  customerNote: String!
  discount: Money
  discountName: String
  translatedDiscountName: String
  voucher: Voucher
  voucherCode: String
  shippingMethods: [ShippingMethod!]!
  availableCollectionPoints: [Warehouse!]!
  availablePaymentGateways: [PaymentGateway!]!
  email: String
  giftCards: [GiftCard!]!
  isShippingRequired: Boolean!
  quantity: Int!
  stockReservationExpires: DateTime
  lines: [CheckoutLine!]!
  shippingPrice: TaxedMoney!
  delivery: Delivery
  subtotalPrice: TaxedMoney!
  taxExemption: Boolean!
  token: UUID!
  totalPrice: TaxedMoney!
  totalBalance: Money!
  languageCode: LanguageCodeEnum!
  transactions: [TransactionItem!]
  displayGrossPrices: Boolean!
  authorizeStatus: CheckoutAuthorizeStatusEnum!
  chargeStatus: CheckoutChargeStatusEnum!
  storedPaymentMethods(amount: PositiveDecimal): [StoredPaymentMethod!]
  problems: [CheckoutProblem!]
}
```

### CheckoutLine

```graphql
type CheckoutLine implements Node, ObjectWithMetadata {
  id: ID!
  metadata: [MetadataItem!]!
  variant: ProductVariant!
  quantity: Int!
  unitPrice: TaxedMoney!
  undiscountedUnitPrice: Money!
  totalPrice: TaxedMoney!
  undiscountedTotalPrice: Money!
  requiresShipping: Boolean!
  isGift: Boolean!
  problems: [CheckoutLineProblem!]
}
```

### CheckoutAuthorizeStatusEnum

Values: `NONE`, `PARTIAL`, `FULL`

### CheckoutChargeStatusEnum

Values: `NONE`, `PARTIAL`, `FULL`, `OVERCHARGED`

## Queries

### checkout

```graphql
checkout(id: ID): Checkout
```

Accessible to anyone with the checkout ID (UUID). Some fields require permissions:
- `user`, `transactions`: require auth or `MANAGE_CHECKOUTS`
- `privateMetadata`: requires `MANAGE_CHECKOUTS`

### checkouts

```graphql
checkouts(
  sortBy: CheckoutSortingInput
  filter: CheckoutFilterInput
  channel: String
  before: String, after: String, first: Int, last: Int
): CheckoutCountableConnection
```

Permission: `MANAGE_CHECKOUTS` or `MANAGE_ORDERS`

Filter by `authorizeStatus` to find paid checkouts:
```graphql
query {
  checkouts(first: 10, filter: { authorizeStatus: [PARTIAL, FULL] }) {
    edges { node { id totalBalance { amount } } }
    totalCount
  }
}
```

## Mutations

### checkoutCreate

```graphql
checkoutCreate(input: CheckoutCreateInput!): CheckoutCreate
```

Webhook: `CHECKOUT_CREATED` (async)

```graphql
mutation {
  checkoutCreate(input: {
    channel: "default-channel"
    lines: [{ variantId: "UHJvZHVjdFZhcmlhbnQ6MQ==", quantity: 1 }]
    email: "customer@example.com"
  }) {
    checkout {
      id
      totalPrice { gross { amount currency } }
      isShippingRequired
      shippingMethods { id name }
      availableCollectionPoints { id name clickAndCollectOption }
      availablePaymentGateways { id name config { field value } }
    }
    errors { field code }
  }
}
```

Notes:
- Checkout is assigned to a channel on creation (cannot change later)
- Signed checkouts (with auth token) are linked to the user
- Anonymous checkouts identified by UUID only
- `skipValidation` requires `HANDLE_CHECKOUTS` + `AUTHENTICATED_APP`

### checkoutLinesAdd

```graphql
checkoutLinesAdd(id: ID, lines: [CheckoutLineInput!]!): CheckoutLinesAdd
```

Webhook: `CHECKOUT_UPDATED` (async)

```graphql
mutation {
  checkoutLinesAdd(
    id: "Q2hlY2tvdXQ6..."
    lines: [{ variantId: "UHJvZHVjdFZhcmlhbnQ6MQ==", quantity: 2 }]
  ) {
    checkout { id lines { variant { name } quantity } totalPrice { gross { amount } } }
    errors { field code message }
  }
}
```

### checkoutLinesUpdate

```graphql
checkoutLinesUpdate(id: ID, lines: [CheckoutLineUpdateInput!]!): CheckoutLinesUpdate
```

Note: Setting quantity to 0 removes the line automatically.

### checkoutLinesDelete

```graphql
checkoutLinesDelete(id: ID, linesIds: [ID!]!): CheckoutLinesDelete
```

### checkoutEmailUpdate

```graphql
checkoutEmailUpdate(id: ID, email: String!): CheckoutEmailUpdate
```

Sets email for anonymous checkouts (required before completion).

### checkoutShippingAddressUpdate

```graphql
checkoutShippingAddressUpdate(
  id: ID
  shippingAddress: AddressInput!
  validationRules: CheckoutAddressValidationRules
): CheckoutShippingAddressUpdate
```

Webhook: `CHECKOUT_UPDATED` (async)

### checkoutBillingAddressUpdate

```graphql
checkoutBillingAddressUpdate(
  id: ID
  billingAddress: AddressInput!
  validationRules: CheckoutAddressValidationRules
): CheckoutBillingAddressUpdate
```

### checkoutDeliveryMethodUpdate

```graphql
checkoutDeliveryMethodUpdate(
  id: ID
  deliveryMethodId: ID
  token: UUID  # deprecated
): CheckoutDeliveryMethodUpdate
```

Pass a shipping method ID or warehouse ID (for click-and-collect).

### checkoutAddPromoCode

```graphql
checkoutAddPromoCode(
  id: ID
  promoCode: String!
): CheckoutAddPromoCode
```

Works for both voucher codes and gift card codes.

### checkoutRemovePromoCode

```graphql
checkoutRemovePromoCode(
  id: ID
  promoCode: String
  promoCodeId: ID
): CheckoutRemovePromoCode
```

### checkoutCustomerAttach

```graphql
checkoutCustomerAttach(
  id: ID
  customerId: ID
): CheckoutCustomerAttach
```

Converts anonymous checkout to signed checkout (when guest logs in).

### checkoutCustomerDetach

```graphql
checkoutCustomerDetach(id: ID): CheckoutCustomerDetach
```

### checkoutComplete

```graphql
checkoutComplete(
  id: ID
  metadata: [MetadataInput!]
  paymentData: JSONString
  redirectUrl: String
  storeSource: Boolean = false
): CheckoutComplete
```

Webhook: `ORDER_CREATED` (async)

Requirements for completion:
1. Valid required addresses (unless `skipValidation` used)
2. Valid delivery method and address
3. All selected products in stock
4. Payments processed (unless `allowUnpaidOrders` channel setting or total = 0)

### orderCreateFromCheckout

```graphql
orderCreateFromCheckout(id: ID!, metadata: [MetadataInput!], privateMetadata: [MetadataInput!], removeCheckout: Boolean = true): OrderCreateFromCheckout
```

Permission: `HANDLE_CHECKOUTS`
Creates order without payment validation.

## Lifecycle

### Flow

1. **Create** checkout with channel and optional lines
2. **Add lines** (products/variants)
3. **Set addresses** (shipping + billing)
4. **Choose delivery** method (shipping or click-and-collect)
5. **Apply discounts** (promo codes / gift cards)
6. **Process payment** (via payment app or transaction API)
7. **Complete** checkout → creates Order

### Authentication States

- **Signed checkout**: Created with valid auth token, linked to User ID
- **Anonymous checkout**: Created without auth, identified by UUID only
- Guest-to-user conversion via `checkoutCustomerAttach`

### Anonymous Order Completion

System performs email-based user lookup:
- Existing account: order assigned automatically
- Non-existent account: tracked; future account creation attaches previous guest orders

### Expiration & Cleanup

Unfinished checkouts auto-delete:
- Empty checkouts: 6 hours
- Anonymous with items: 30 days
- User checkouts with items: 90 days

### Abandoned Checkout Fund Release

Checkouts inactive beyond `CHECKOUT_TTL_BEFORE_RELEASING_FUNDS` (default 6 hours) trigger:
- `TRANSACTION_CANCELATION_REQUESTED` for authorized funds
- `TRANSACTION_REFUND_REQUESTED` for charged funds

### Automatic Checkout Completion

When `automaticCompletion` is enabled in channel settings:
- Converts fully-covered checkouts to orders when `authorizeStatus` = FULL
- Configurable delay (default: 30 minutes)
- Processes up to 20 checkouts per minute cycle