# Products API Reference

Source: https://docs.saleor.io/developer/products/ + /api-reference/products/

## Key Types

### Product

```graphql
type Product implements Node, ObjectWithMetadata, ObjectWithAttributes {
  id: ID!
  privateMetadata: [MetadataItem!]!
  privateMetafield(key: String!): String
  privateMetafields(keys: [String!]): Metadata
  metadata: [MetadataItem!]!
  metafield(key: String!): String
  metafields(keys: [String!]): Metadata
  assignedAttribute(slug: String!): AssignedAttribute
  assignedAttributes(limit: PositiveInt = 100): [AssignedAttribute!]!
  seoTitle: String
  seoDescription: String
  name: String!
  description: JSONString
  productType: ProductType!
  slug: String!
  category: Category
  created: DateTime!
  updatedAt: DateTime!
  weight: Weight
  defaultVariant: ProductVariant
  rating: Float
  channel: String
  thumbnail(size: Int, format: ThumbnailFormatEnum = ORIGINAL): Image
  pricing(address: AddressInput): ProductPricingInfo
  isAvailable(address: AddressInput): Boolean
  channelListings: [ProductChannelListing!]
  mediaById(id: ID!): ProductMedia
  variant(id: ID, sku: String): ProductVariant  # deprecated
  variants: [ProductVariant!]  # deprecated
  productVariants(
    filter: ProductVariantFilterInput
    where: ProductVariantWhereInput
    sortBy: ProductVariantSortingInput
    before: String, after: String, first: Int, last: Int
  ): ProductVariantCountableConnection
  media(sortBy: MediaSortingInput): [ProductMedia!]
  collections: [Collection!]
  translation(languageCode: LanguageCodeEnum!): ProductTranslation
  availableForPurchaseAt: DateTime
  isAvailableForPurchase: Boolean
  taxClass: TaxClass
  externalReference: String
}
```

### ProductVariant

```graphql
type ProductVariant implements Node, ObjectWithMetadata, ObjectWithAttributes {
  id: ID!
  privateMetadata: [MetadataItem!]!
  metadata: [MetadataItem!]!
  assignedAttribute(slug: String!): AssignedAttribute
  assignedAttributes(limit: PositiveInt = 100): [AssignedAttribute!]!
  name: String!
  sku: String
  product: Product!
  trackInventory: Boolean!
  quantityLimitPerCustomer: Int
  weight: Weight
  channel: String
  channelListings: [ProductVariantChannelListing!]
  pricing(address: AddressInput): VariantPricingInfo
  margin: Int
  quantityOrdered: Int
  revenue(period: ReportingPeriod): TaxedMoney
  media: [ProductMedia!]
  translation(languageCode: LanguageCodeEnum!): ProductVariantTranslation
  digitalContent: DigitalContent
  stocks(address: AddressInput, countryCode: CountryCode): [Stock!]
  quantityAvailable(address: AddressInput, countryCode: CountryCode): Int
  preorder: PreorderData
  created: DateTime!
  updatedAt: DateTime!
  externalReference: String
}
```

### ProductPricingInfo

```graphql
type ProductPricingInfo {
  onSale: Boolean
  discount: TaxedMoney
  discountLocalCurrency: TaxedMoney
  displayGrossPrices: Boolean!
  priceRange: TaxedMoneyRange
  priceRangeUndiscounted: TaxedMoneyRange
  priceRangeLocalCurrency: TaxedMoneyRange
}
```

### VariantPricingInfo

```graphql
type VariantPricingInfo {
  onSale: Boolean
  discount: TaxedMoney
  discountLocalCurrency: TaxedMoney
  price: TaxedMoney
  priceUndiscounted: TaxedMoney
  priceLocalCurrency: TaxedMoney
}
```

### ProductChannelListing

```graphql
type ProductChannelListing implements Node {
  id: ID!
  publicationDate: Date  # deprecated
  publishedAt: DateTime
  isPublished: Boolean!
  channel: Channel!
  visibleInListings: Boolean!
  availableForPurchaseAt: DateTime
  discountedPrice: Money
  purchaseCost: MoneyRange
  margin: Margin
  pricing(address: AddressInput): ProductPricingInfo
}
```

### Category

```graphql
type Category implements Node, ObjectWithMetadata {
  id: ID!
  metadata: [MetadataItem!]!
  seoTitle: String
  seoDescription: String
  name: String!
  description: JSONString
  slug: String!
  parent: Category
  level: Int!
  ancestors(before: String, after: String, first: Int, last: Int): CategoryCountableConnection
  children(before: String, after: String, first: Int, last: Int): CategoryCountableConnection
  backgroundImage(size: Int, format: ThumbnailFormatEnum = ORIGINAL): Image
  products(channel: String, before: String, after: String, first: Int, last: Int): ProductCountableConnection
  translation(languageCode: LanguageCodeEnum!): CategoryTranslation
}
```

### Collection

```graphql
type Collection implements Node, ObjectWithMetadata {
  id: ID!
  metadata: [MetadataItem!]!
  seoTitle: String
  seoDescription: String
  name: String!
  description: JSONString
  slug: String!
  channel: String
  channelListings: [CollectionChannelListing!]
  backgroundImage(size: Int, format: ThumbnailFormatEnum = ORIGINAL): Image
  products(
    filter: ProductFilterInput
    where: ProductWhereInput
    sortBy: ProductOrder
    before: String, after: String, first: Int, last: Int
  ): ProductCountableConnection
  translation(languageCode: LanguageCodeEnum!): CollectionTranslation
}
```

## Queries

### products

```graphql
products(
  filter: ProductFilterInput       # DEPRECATED - use where
  where: ProductWhereInput         # Preferred filtering
  sortBy: ProductOrder             # Sorting (field + direction)
  search: String                   # Full-text search
  channel: String                  # Channel slug (required for pricing/availability)
  before: String, after: String    # Cursor pagination
  first: Int, last: Int            # Page size (max 100)
): ProductCountableConnection
```

Permission: None for published products. `MANAGE_ORDERS`, `MANAGE_DISCOUNTS`, or `MANAGE_PRODUCTS` for unpublished.

### product

```graphql
product(
  id: ID                  # Product ID
  slug: String            # Product slug
  externalReference: String
  channel: String         # Channel slug
): Product
```

### categories / category

```graphql
categories(
  filter: CategoryFilterInput
  where: CategoryWhereInput
  sortBy: CategorySortingInput
  level: Int               # Filter by nesting level (0 = root)
  before: String, after: String, first: Int, last: Int
): CategoryCountableConnection

category(id: ID, slug: String): Category
```

### collections / collection

```graphql
collections(
  filter: CollectionFilterInput
  where: CollectionWhereInput
  sortBy: CollectionSortingInput
  channel: String
  before: String, after: String, first: Int, last: Int
): CollectionCountableConnection

collection(id: ID, slug: String, channel: String): Collection
```

### productTypes / productType

```graphql
productTypes(
  filter: ProductTypeFilterInput
  sortBy: ProductTypeSortingInput
  before: String, after: String, first: Int, last: Int
): ProductTypeCountableConnection

productType(id: ID!): ProductType
```

## Mutations

### productCreate

```graphql
productCreate(input: ProductCreateInput!): ProductCreate
```

Permission: `MANAGE_PRODUCTS`
Webhook: `PRODUCT_CREATED` (async)

Key input fields: `name`, `slug`, `description`, `productType` (ID), `category` (ID), `attributes`, `seo`, `weight`, `taxClass`, `externalReference`, `metadata`

### productUpdate

```graphql
productUpdate(id: ID!, input: ProductInput!): ProductUpdate
```

Permission: `MANAGE_PRODUCTS`
Webhook: `PRODUCT_UPDATED` (async)

### productDelete

```graphql
productDelete(id: ID!, externalReference: String): ProductDelete
```

Permission: `MANAGE_PRODUCTS`
Webhook: `PRODUCT_DELETED` (async)

### productVariantCreate

```graphql
productVariantCreate(input: ProductVariantCreateInput!): ProductVariantCreate
```

Permission: `MANAGE_PRODUCTS`
Webhook: `PRODUCT_VARIANT_CREATED` (async)

Key input fields: `product` (ID), `sku`, `name`, `trackInventory`, `weight`, `attributes`, `stocks` (warehouse + quantity), `channelListings` (channel + price + costPrice), `quantityLimitPerCustomer`, `externalReference`, `metadata`

### productVariantUpdate

```graphql
productVariantUpdate(
  id: ID
  sku: String
  externalReference: String
  input: ProductVariantInput!
): ProductVariantUpdate
```

Permission: `MANAGE_PRODUCTS`
Webhook: `PRODUCT_VARIANT_UPDATED` (async)

### productVariantStocksCreate

```graphql
productVariantStocksCreate(
  variantId: ID!
  stocks: [StockInput!]!
): ProductVariantStocksCreate
```

Permission: `MANAGE_PRODUCTS`
Input: `StockInput { warehouse: ID!, quantity: Int! }`

### productVariantStocksUpdate

```graphql
productVariantStocksUpdate(
  variantId: ID
  sku: String
  stocks: [StockInput!]!
): ProductVariantStocksUpdate
```

Permission: `MANAGE_PRODUCTS`

### productChannelListingUpdate

```graphql
productChannelListingUpdate(
  id: ID!
  input: ProductChannelListingUpdateInput!
): ProductChannelListingUpdate
```

Permission: `MANAGE_PRODUCTS`

Input includes `updateChannels` (list of channel + isPublished + publishedAt + visibleInListings + availableForPurchaseAt + addVariants + removeVariants) and `removeChannels` (list of channel IDs).

### categoryCreate / categoryUpdate

```graphql
categoryCreate(input: CategoryInput!, parent: ID): CategoryCreate
categoryUpdate(id: ID!, input: CategoryInput!): CategoryUpdate
```

Permission: `MANAGE_PRODUCTS`

### collectionCreate / collectionAddProducts

```graphql
collectionCreate(input: CollectionCreateInput!): CollectionCreate
collectionAddProducts(collectionId: ID!, products: [ID!]!): CollectionAddProducts
```

Permission: `MANAGE_PRODUCTS`

## Common Patterns

### Creating a Product with Variants

```graphql
# Step 1: Create the product
mutation {
  productCreate(input: {
    name: "Running Shoe"
    slug: "running-shoe"
    productType: "UHJvZHVjdFR5cGU6MQ=="
    category: "Q2F0ZWdvcnk6MQ=="
    description: "{\"blocks\": [{\"type\": \"paragraph\", \"data\": {\"text\": \"A comfortable running shoe.\"}}]}"
  }) {
    product { id name }
    errors { field code message }
  }
}

# Step 2: Add channel listing (makes product visible)
mutation {
  productChannelListingUpdate(id: "UHJvZHVjdDox", input: {
    updateChannels: [{
      channelId: "Q2hhbm5lbDox"
      isPublished: true
      visibleInListings: true
      availableForPurchaseAt: "2024-01-01T00:00:00Z"
    }]
  }) {
    product { id channelListings { channel { slug } isPublished } }
    errors { field code message }
  }
}

# Step 3: Create variant with pricing and stock
mutation {
  productVariantCreate(input: {
    product: "UHJvZHVjdDox"
    name: "Size 42"
    sku: "SHOE-42"
    trackInventory: true
    stocks: [{ warehouse: "V2FyZWhvdXNlOjE=", quantity: 100 }]
    channelListings: [{
      channelId: "Q2hhbm5lbDox"
      price: "99.99"
      costPrice: "45.00"
    }]
    attributes: [{ id: "QXR0cmlidXRlOjE=", values: ["42"] }]
  }) {
    productVariant { id name sku }
    errors { field code message }
  }
}
```

### Querying Products with Pricing

```graphql
query ProductsWithPricing($channel: String!, $first: Int!) {
  products(channel: $channel, first: $first) {
    edges {
      node {
        id
        name
        slug
        thumbnail { url alt }
        pricing {
          onSale
          priceRange {
            start { gross { amount currency } }
            stop { gross { amount currency } }
          }
          priceRangeUndiscounted {
            start { gross { amount currency } }
          }
          discount { gross { amount currency } }
        }
        category { name slug }
        productVariants(first: 10) {
          edges {
            node {
              id name sku
              quantityAvailable
              pricing {
                price { gross { amount currency } }
                priceUndiscounted { gross { amount currency } }
                onSale
              }
            }
          }
        }
      }
    }
    pageInfo { hasNextPage endCursor }
    totalCount
  }
}
```

### Filtering Products by Attribute

```graphql
query {
  products(
    where: {
      attributes: [{ slug: "color", values: ["red", "blue"] }]
    }
    channel: "default-channel"
    first: 20
  ) {
    edges { node { id name } }
  }
}
```

## Key Concepts

- **Product Types** define which attributes apply to products and variants
- **Variants** represent purchasable items (required even for single-variant products)
- **Prices and stock are variant-level**, not product-level
- **Channel listing** required to make products visible on a storefront
- **Categories** are hierarchical (one per product); **Collections** are flat (many per product)
- Products must be assigned to channels before variants can be listed in those channels