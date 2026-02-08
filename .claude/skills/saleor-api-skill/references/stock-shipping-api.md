# Stock & Shipping API Reference

Source: https://docs.saleor.io/developer/stock/ + /developer/shipping/ + /api-reference/

## Warehouses

### Warehouse Type

```graphql
type Warehouse implements Node, ObjectWithMetadata {
  id: ID!
  privateMetadata: [MetadataItem!]!
  metadata: [MetadataItem!]!
  name: String!
  slug: String!
  email: String!
  isPrivate: Boolean!
  address: Address!
  companyName: String!
  clickAndCollectOption: WarehouseClickAndCollectOptionEnum!
  shippingZones(before: String, after: String, first: Int, last: Int): ShippingZoneCountableConnection!
  stocks(before: String, after: String, first: Int, last: Int): StockCountableConnection
  externalReference: String
}
```

### WarehouseClickAndCollectOptionEnum

- `LOCAL` — Local stock only (public warehouses only)
- `ALL` — Combined stock across all channel warehouses
- `DISABLED` — No click-and-collect

### Stock Type

```graphql
type Stock implements Node {
  id: ID!
  warehouse: Warehouse!
  productVariant: ProductVariant!
  quantity: Int!
  quantityAllocated: Int!
  quantityReserved: Int!
}
```

## Warehouse Mutations

### createWarehouse

```graphql
createWarehouse(input: WarehouseCreateInput!): WarehouseCreate
```

Permission: `MANAGE_PRODUCTS`

Input: `name`, `slug`, `email`, `address` (AddressInput), `externalReference`

```graphql
mutation {
  createWarehouse(input: {
    name: "Main Warehouse"
    slug: "main-warehouse"
    email: "warehouse@example.com"
    address: {
      streetAddress1: "123 Warehouse St"
      city: "New York"
      country: US
      postalCode: "10001"
    }
  }) {
    warehouse { id name slug }
    errors { field code message }
  }
}
```

### updateWarehouse

```graphql
updateWarehouse(id: ID!, input: WarehouseUpdateInput!): WarehouseUpdate
```

Permission: `MANAGE_PRODUCTS`

Additional fields: `isPrivate`, `clickAndCollectOption`, `addShippingZones`, `removeShippingZones`

### deleteWarehouse

```graphql
deleteWarehouse(id: ID!): WarehouseDelete
```

## Stock Mutations

### productVariantStocksCreate

```graphql
productVariantStocksCreate(
  variantId: ID!
  stocks: [StockInput!]!
): ProductVariantStocksCreate
```

Permission: `MANAGE_PRODUCTS`

```graphql
mutation {
  productVariantStocksCreate(
    variantId: "UHJvZHVjdFZhcmlhbnQ6MQ=="
    stocks: [
      { warehouse: "V2FyZWhvdXNlOjE=", quantity: 100 }
      { warehouse: "V2FyZWhvdXNlOjI=", quantity: 50 }
    ]
  ) {
    productVariant { id stocks { warehouse { name } quantity } }
    errors { field code message }
  }
}
```

### productVariantStocksUpdate

```graphql
productVariantStocksUpdate(
  variantId: ID
  sku: String
  stocks: [StockInput!]!
): ProductVariantStocksUpdate
```

### productVariantStocksDelete

```graphql
productVariantStocksDelete(
  variantId: ID
  sku: String
  warehouseIds: [ID!]
): ProductVariantStocksDelete
```

### productVariantStocksBulkUpdate (Bulk)

Efficient stock management across multiple variants and warehouses.

## Stock Queries

### stocks

```graphql
stocks(
  filter: StockFilterInput
  before: String, after: String, first: Int, last: Int
): StockCountableConnection
```

Permission: `MANAGE_PRODUCTS`

### stock

```graphql
stock(id: ID!): Stock
```

### warehouse / warehouses

```graphql
warehouse(id: ID, externalReference: String): Warehouse
warehouses(
  filter: WarehouseFilterInput
  sortBy: WarehouseSortingInput
  before: String, after: String, first: Int, last: Int
): WarehouseCountableConnection
```

## Stock Allocation & Reservation

### Allocation Strategy

Set per channel via `stockSettings.allocationStrategy`:
- `PRIORITIZE_HIGH_STOCK` — allocate from warehouse with most stock
- `PRIORITIZE_SORTING_ORDER` — allocate from first eligible warehouse in sort order

### Stock Reservation

During checkout, stock is reserved when:
1. Checkout has shipping/billing address
2. Variant has `trackInventory: true`
3. Warehouse has stock for the variant

Reservation expires at `checkout.stockReservationExpires`.

### Querying Available Stock

```graphql
query {
  productVariants(first: 10, channel: "default-channel") {
    edges {
      node {
        id
        name
        quantityAvailable       # Total available across warehouses
        stocks {                # Per-warehouse breakdown
          warehouse { name }
          quantity              # Total in warehouse
          quantityAllocated     # Reserved for orders
          quantityReserved      # Reserved for checkouts
        }
      }
    }
  }
}
```

## Shipping Zones

### ShippingZone Type

```graphql
type ShippingZone implements Node, ObjectWithMetadata {
  id: ID!
  metadata: [MetadataItem!]!
  name: String!
  default: Boolean!
  countries: [CountryDisplay!]!
  shippingMethods: [ShippingMethodType!]
  warehouses: [Warehouse!]!
  channels: [Channel!]!
  description: String
}
```

### ShippingMethodType

```graphql
type ShippingMethodType implements Node, ObjectWithMetadata {
  id: ID!
  metadata: [MetadataItem!]!
  name: String!
  description: JSONString
  type: ShippingMethodTypeEnum      # PRICE or WEIGHT
  channelListings: [ShippingMethodChannelListing!]
  maximumOrderPrice: Money
  minimumOrderPrice: Money
  maximumOrderWeight: Weight
  minimumOrderWeight: Weight
  maximumDeliveryDays: Int
  minimumDeliveryDays: Int
  taxClass: TaxClass
  excludedProducts(before: String, after: String, first: Int, last: Int): ProductCountableConnection
  postalCodeRules: [ShippingMethodPostalCodeRule!]
  translation(languageCode: LanguageCodeEnum!): ShippingMethodTranslation
}
```

### ShippingMethodTypeEnum

- `PRICE` — Rate based on order price
- `WEIGHT` — Rate based on order weight

## Shipping Mutations

### shippingZoneCreate

```graphql
shippingZoneCreate(input: ShippingZoneCreateInput!): ShippingZoneCreate
```

Permission: `MANAGE_SHIPPING`

Input: `name`, `description`, `countries`, `default`, `addWarehouses`, `addChannels`

```graphql
mutation {
  shippingZoneCreate(input: {
    name: "US Domestic"
    countries: ["US"]
    addWarehouses: ["V2FyZWhvdXNlOjE="]
    addChannels: ["Q2hhbm5lbDox"]
  }) {
    shippingZone { id name countries { code country } }
    errors { field code message }
  }
}
```

### shippingZoneUpdate / shippingZoneDelete

```graphql
shippingZoneUpdate(id: ID!, input: ShippingZoneUpdateInput!): ShippingZoneUpdate
shippingZoneDelete(id: ID!): ShippingZoneDelete
```

### shippingPriceCreate

```graphql
shippingPriceCreate(input: ShippingPriceInput!): ShippingPriceCreate
```

Permission: `MANAGE_SHIPPING`

Input: `name`, `description`, `shippingZone` (ID), `type` (PRICE or WEIGHT), `maximumOrderPrice`, `minimumOrderPrice`, `maximumOrderWeight`, `minimumOrderWeight`, `maximumDeliveryDays`, `minimumDeliveryDays`, `addPostalCodeRules`, `inclusionType`

### shippingPriceUpdate / shippingPriceDelete

```graphql
shippingPriceUpdate(id: ID!, input: ShippingPriceInput!): ShippingPriceUpdate
shippingPriceDelete(id: ID!): ShippingPriceDelete
```

### shippingMethodChannelListingUpdate

```graphql
shippingMethodChannelListingUpdate(
  id: ID!
  input: ShippingMethodChannelListingInput!
): ShippingMethodChannelListingUpdate
```

Set shipping price per channel.

## Shipping Queries

### shippingZones

```graphql
shippingZones(
  filter: ShippingZoneFilterInput
  channel: String
  before: String, after: String, first: Int, last: Int
): ShippingZoneCountableConnection
```

Permission: `MANAGE_SHIPPING`

## Webhook Events

Stock-related:
- `PRODUCT_VARIANT_OUT_OF_STOCK` — Variant stock reaches 0
- `PRODUCT_VARIANT_BACK_IN_STOCK` — Variant stock goes above 0
- `PRODUCT_VARIANT_STOCK_UPDATED` — Stock quantity changed
- `WAREHOUSE_CREATED`, `WAREHOUSE_UPDATED`, `WAREHOUSE_DELETED`
- `WAREHOUSE_METADATA_UPDATED`

## Key Concepts

- Warehouses must be assigned to both channels AND shipping zones
- Stock is tracked per warehouse per variant
- `quantityAvailable` = `quantity` - `quantityAllocated` - `quantityReserved`
- Digital products still require warehouse configuration
- Only public warehouses can function as collection points (click-and-collect)
- Warehouse address determines applicable taxes for click-and-collect orders