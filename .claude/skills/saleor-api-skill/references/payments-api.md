# Payments & Transactions API Reference

Source: https://docs.saleor.io/developer/payments/ + /api-reference/payments/

## Key Types

### TransactionItem

```graphql
type TransactionItem implements Node, ObjectWithMetadata {
  id: ID!
  privateMetadata: [MetadataItem!]!
  metadata: [MetadataItem!]!
  createdAt: DateTime!
  modifiedAt: DateTime!
  actions: [TransactionActionEnum!]!
  authorizedAmount: Money!
  authorizePendingAmount: Money!
  chargedAmount: Money!
  chargePendingAmount: Money!
  refundedAmount: Money!
  refundPendingAmount: Money!
  canceledAmount: Money!
  cancelPendingAmount: Money!
  events: [TransactionEvent!]!
  pspReference: String!
  order: Order
  checkout: Checkout
  name: String!
  message: String!
  externalUrl: String
  createdBy: UserOrApp
  paymentMethod: StoredPaymentMethod
}
```

### TransactionEvent

```graphql
type TransactionEvent implements Node {
  id: ID!
  createdAt: DateTime!
  pspReference: String!
  message: String!
  externalUrl: String
  amount: Money!
  type: TransactionEventTypeEnum
  createdBy: UserOrApp
  idempotencyKey: String
}
```

### TransactionEventTypeEnum

Mandatory amount events:
- `AUTHORIZATION_SUCCESS`, `AUTHORIZATION_REQUEST`, `AUTHORIZATION_FAILURE`, `AUTHORIZATION_ADJUSTMENT`, `AUTHORIZATION_ACTION_REQUIRED`
- `CHARGE_SUCCESS`, `CHARGE_REQUEST`, `CHARGE_FAILURE`, `CHARGE_ACTION_REQUIRED`, `CHARGE_BACK`
- `REFUND_SUCCESS`, `REFUND_REQUEST`, `REFUND_FAILURE`, `REFUND_REVERSE`
- `CANCEL_SUCCESS`, `CANCEL_REQUEST`, `CANCEL_FAILURE`
- `INFO`

### TransactionActionEnum

Values: `CHARGE`, `REFUND`, `CANCEL`

## Mutations

### transactionCreate

```graphql
transactionCreate(
  id: ID!                              # Checkout or Order ID
  transaction: TransactionCreateInput!
  transactionEvent: TransactionEventInput
): TransactionCreate
```

Permission: `HANDLE_PAYMENTS` (staff/apps only)

```graphql
mutation {
  transactionCreate(
    id: "T3JkZXI6MQ=="
    transaction: {
      name: "Stripe Payment"
      pspReference: "pi_abc123"
      availableActions: [REFUND, CANCEL]
      amountAuthorized: { amount: 99.99, currency: "USD" }
    }
    transactionEvent: {
      pspReference: "pi_abc123"
      message: "Payment authorized"
    }
  ) {
    transaction { id authorizedAmount { amount } }
    errors { field code message }
  }
}
```

### transactionUpdate

```graphql
transactionUpdate(
  id: ID!                              # Transaction ID
  transaction: TransactionUpdateInput
  transactionEvent: TransactionEventInput
): TransactionUpdate
```

Permission: `HANDLE_PAYMENTS` (staff) or the app that created the transaction

Note: During update, funds moving to a new state should be subtracted from the previous state.

### transactionEventReport

```graphql
transactionEventReport(
  id: ID!                      # Transaction ID
  type: TransactionEventTypeEnum!
  amount: PositiveDecimal!     # Required for SUCCESS/REQUEST types
  pspReference: String!
  time: DateTime
  externalUrl: String
  message: String
  availableActions: [TransactionActionEnum!]
): TransactionEventReport
```

Response includes `alreadyProcessed: Boolean` for deduplication.

```graphql
mutation {
  transactionEventReport(
    id: "VHJhbnNhY3Rpb246MQ=="
    type: CHARGE_SUCCESS
    amount: 99.99
    pspReference: "ch_abc123"
    message: "Payment captured successfully"
    availableActions: [REFUND]
  ) {
    alreadyProcessed
    transaction { id chargedAmount { amount } }
    transactionEvent { id type }
    errors { field code message }
  }
}
```

### transactionRequestAction

```graphql
transactionRequestAction(
  id: ID!                      # Transaction ID
  actionType: TransactionActionEnum!
  amount: PositiveDecimal
): TransactionRequestAction
```

Permission: `HANDLE_PAYMENTS`

Creates `*_REQUEST` event and sends synchronous webhook to the app that created the transaction. Triggers: `TRANSACTION_CHARGE_REQUESTED`, `TRANSACTION_REFUND_REQUESTED`, or `TRANSACTION_CANCELATION_REQUESTED`.

### transactionRequestRefundForGrantedRefund

```graphql
transactionRequestRefundForGrantedRefund(
  grantedRefundId: ID!
  id: ID!                      # Transaction ID
): TransactionRequestRefundForGrantedRefund
```

Creates `REFUND_REQUEST` event with `OrderGrantedRefund` in webhook payload.

## Payment Integration Models

### Model 1: Payment App (Middleware)

Saleor acts as intermediary between frontend and payment app:

1. Frontend calls `transactionInitialize` or `checkoutComplete`
2. Saleor sends sync webhook to payment app
3. Payment app communicates with provider (Stripe/Adyen)
4. Payment app reports back via `transactionEventReport`
5. Saleor updates transaction state

Webhook events:
- `TRANSACTION_INITIALIZE_SESSION` (sync)
- `TRANSACTION_PROCESS_SESSION` (sync)
- `TRANSACTION_CHARGE_REQUESTED` (sync)
- `TRANSACTION_REFUND_REQUESTED` (sync)
- `TRANSACTION_CANCELATION_REQUESTED` (sync)

### Model 2: Direct Backend

Your backend handles payment provider directly:

1. Backend processes payment with provider
2. Backend calls `transactionCreate` to record the payment
3. Backend calls `transactionEventReport` to update status

## Amount Handling

- Amounts are rounded to currency precision (e.g., 2 decimals for USD)
- For failure events without explicit amount, system calculates from corresponding SUCCESS/REQUEST events with same `pspReference`
- Only one `AUTHORIZATION_SUCCESS` event allowed per transaction

## pspReference

- `TransactionItem.pspReference`: Identifies the overall payment (e.g., Stripe PaymentIntent ID)
- `TransactionEvent.pspReference`: Identifies a specific action within the payment

## Automatic Checkout Completion

When `automaticCompletion` is enabled:
- Checkouts with `authorizeStatus = FULL` auto-convert to orders
- Configurable delay via `delay` field (default: 30 minutes)
- `cutOffDate` (ISO 8601) limits eligibility
- Runs every minute, processes up to 20 per cycle

```graphql
mutation {
  channelUpdate(id: "...", input: {
    checkoutSettings: {
      automaticCompletion: {
        enabled: true
        delay: 30
      }
    }
  }) {
    channel { id }
  }
}
```

## Stored Payment Methods

Supported types: `CARD`, `OTHER`

Set via webhooks (`TRANSACTION_INITIALIZE_SESSION`, `TRANSACTION_PROCESS_SESSION`) or mutations (`transactionEventReport`, `transactionCreate`, `transactionUpdate`).

Query stored methods:
```graphql
query {
  checkout(id: "...") {
    storedPaymentMethods(amount: 99.99) {
      id
      type
      name
      data
      gateway { id name }
    }
  }
}
```