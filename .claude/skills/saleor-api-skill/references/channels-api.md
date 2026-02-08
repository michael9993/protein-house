# Channels API Reference

Source: https://docs.saleor.io/developer/channels/ + /api-reference/channels/

## Key Types

### Channel

```graphql
type Channel implements Node, ObjectWithMetadata {
  id: ID!
  privateMetadata: [MetadataItem!]!
  metadata: [MetadataItem!]!
  slug: String!
  name: String!
  isActive: Boolean!
  currencyCode: String!
  hasOrders: Boolean!
  defaultCountry: CountryDisplay!
  countries: [CountryDisplay!]!
  availableShippingMethodsPerCountry(countries: [CountryCode!]): [ShippingMethodsPerCountry!]
  stockSettings: StockSettings!
  orderSettings: OrderSettings!
  checkoutSettings: CheckoutSettings!
  paymentSettings: PaymentSettings!
  warehouses: [Warehouse!]!
}
```

### StockSettings

```graphql
type StockSettings {
  allocationStrategy: AllocationStrategyEnum!
}
```

AllocationStrategyEnum: `PRIORITIZE_HIGH_STOCK`, `PRIORITIZE_SORTING_ORDER`

### OrderSettings

```graphql
type OrderSettings {
  automaticallyConfirmAllNewOrders: Boolean!
  automaticallyFulfillNonShippableGiftCard: Boolean!
  expireOrdersAfter: Minute!
  deleteExpiredOrdersAfter: Day!
  markAsPaidStrategy: MarkAsPaidStrategyEnum!
  allowUnpaidOrders: Boolean!
  includeDraftOrderInVoucherUsage: Boolean!
}
```

### CheckoutSettings

```graphql
type CheckoutSettings {
  useLegacyErrorFlow: Boolean!
  automaticCompletion: AutomaticCompletion
}
```

## Queries

### channels

```graphql
channels: [Channel!]
```

Permission: `AUTHENTICATED_APP`, `AUTHENTICATED_STAFF_USER`, or `MANAGE_CHANNELS` (for full details)

### channel

```graphql
channel(id: ID, slug: String): Channel
```

## Mutations

### channelCreate

```graphql
channelCreate(input: ChannelCreateInput!): ChannelCreate
```

Permission: `MANAGE_CHANNELS`

Key input fields:
- `name` (required), `slug` (required), `currencyCode` (required)
- `defaultCountry` (required)
- `countries` — list of country codes
- `isActive` — whether channel is live
- `addWarehouses` — warehouse IDs to assign
- `stockSettings` — allocation strategy
- `orderSettings` — order behavior config
- `checkoutSettings` — checkout behavior config
- `paymentSettings` — payment config

```graphql
mutation {
  channelCreate(input: {
    name: "US Store"
    slug: "us-store"
    currencyCode: "USD"
    defaultCountry: US
    countries: [US, CA]
    isActive: true
    addWarehouses: ["V2FyZWhvdXNlOjE="]
    orderSettings: {
      automaticallyConfirmAllNewOrders: true
      allowUnpaidOrders: false
      expireOrdersAfter: 1440
      deleteExpiredOrdersAfter: 60
    }
  }) {
    channel { id slug name currencyCode }
    errors { field code message }
  }
}
```

### channelUpdate

```graphql
channelUpdate(id: ID!, input: ChannelUpdateInput!): ChannelUpdate
```

Permission: `MANAGE_CHANNELS`

Additional input fields vs create:
- `addWarehouses` / `removeWarehouses`
- `addShippingZones` / `removeShippingZones`

### channelDelete

```graphql
channelDelete(id: ID!, input: ChannelDeleteInput): ChannelDelete
```

Permission: `MANAGE_CHANNELS`
Input: `{ channelId: ID! }` — target channel to migrate existing orders/checkouts to before deletion.

### channelActivate / channelDeactivate

```graphql
channelActivate(id: ID!): ChannelActivate
channelDeactivate(id: ID!): ChannelDeactivate
```

Permission: `MANAGE_CHANNELS`

## Multi-Channel Architecture

### Channel Scoping

Channels determine:
- **Currency** — each channel has one currency
- **Product availability** — products must be listed in a channel to appear
- **Pricing** — variant prices are per-channel
- **Stock** — warehouse assignment is per-channel
- **Shipping** — shipping zones are assigned to channels
- **Payment** — payment gateways are per-channel
- **Discounts** — vouchers and promotions can be channel-specific
- **Tax** — tax configuration can vary by channel

### Channel-Aware Query Pattern

```graphql
# Products scoped to channel
query { products(channel: "us-store", first: 10) { edges { node { name } } } }

# Checkout created in channel
mutation { checkoutCreate(input: { channel: "us-store", lines: [...] }) { checkout { id } } }

# Orders filtered by channel
query { orders(channel: "us-store", first: 10) { edges { node { number } } } }
```

### Warehouse-Channel Assignment

Warehouses must be assigned to channels to serve orders from those channels:

```graphql
mutation {
  channelUpdate(id: "Q2hhbm5lbDox", input: {
    addWarehouses: ["V2FyZWhvdXNlOjE=", "V2FyZWhvdXNlOjI="]
  }) {
    channel { warehouses { id name } }
  }
}
```

### This Project's Channels

| Channel | Slug | Currency | Language | Direction |
|---------|------|----------|----------|-----------|
| Israel | ILS | Israeli Shekel | Hebrew | RTL |
| International | USD | US Dollar | English | LTR |

Default channel: `NEXT_PUBLIC_DEFAULT_CHANNEL` env var.