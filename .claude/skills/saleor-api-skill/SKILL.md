---
name: saleor-api-skill
description: Saleor Commerce GraphQL API reference. This skill should be used when writing GraphQL queries/mutations, looking up field types, understanding API patterns for products, checkout, orders, payments, channels, users, discounts, apps, webhooks, stock, and shipping. Covers all major Saleor API domains with type definitions, mutation signatures, usage examples, and custom extensions (newsletter, contact forms, reviews, stock alerts).
---

# Saleor API Reference

Comprehensive GraphQL API reference for the Saleor Commerce platform, organized by domain. Includes both standard Saleor API and custom extensions built for this project.

## Quick Reference

| Task | Operation | Type | Reference File |
|------|-----------|------|----------------|
| List products | `products(channel, where, sortBy, first)` | Query | products-api.md |
| Get product details | `product(id/slug, channel)` | Query | products-api.md |
| Create product | `productCreate(input)` | Mutation | products-api.md |
| Create checkout | `checkoutCreate(input)` | Mutation | checkout-api.md |
| Add to cart | `checkoutLinesAdd(id, lines)` | Mutation | checkout-api.md |
| Complete checkout | `checkoutComplete(id)` | Mutation | checkout-api.md |
| List orders | `orders(channel, where, sortBy, first)` | Query | orders-api.md |
| Get order | `order(id)` | Query | orders-api.md |
| Fulfill order | `orderFulfill(order, input)` | Mutation | orders-api.md |
| Create transaction | `transactionCreate(id, transaction)` | Mutation | payments-api.md |
| Report transaction event | `transactionEventReport(id, type, amount)` | Mutation | payments-api.md |
| List channels | `channels` | Query | channels-api.md |
| Authenticate | `tokenCreate(email, password)` | Mutation | users-auth-api.md |
| Get current user | `me` | Query | users-auth-api.md |
| Create voucher | `voucherCreate(input)` | Mutation | discounts-api.md |
| Apply promo code | `checkoutAddPromoCode(id, promoCode)` | Mutation | discounts-api.md |
| Create webhook | `webhookCreate(input)` | Mutation | apps-webhooks-api.md |
| Check stock | `stocks(filter)` | Query | stock-shipping-api.md |
| Subscribe newsletter | `newsletterSubscribe(email, source, channel)` | Mutation | custom-extensions-api.md |
| Submit contact form | `contactSubmissionCreate(input)` | Mutation | custom-extensions-api.md |
| Create product review | `productReviewCreate(input)` | Mutation | custom-extensions-api.md |

## API Patterns

### Channel-Aware Queries

Most queries accept a `channel` parameter (channel slug string). Products, pricing, stock, and availability are channel-scoped.

```graphql
query {
  products(channel: "default-channel", first: 10) {
    edges { node { name pricing { priceRange { start { gross { amount currency } } } } } }
  }
}
```

### Cursor-Based Pagination

All list queries use Relay-style cursor pagination. Maximum 100 items per request.

```graphql
query Products($after: String) {
  products(first: 20, after: $after, channel: "default-channel") {
    edges { node { id name } cursor }
    pageInfo { hasNextPage endCursor }
    totalCount
  }
}
```

### Filtering

Use `where` (preferred) over deprecated `filter` parameter. Supports `AND`/`OR` logic.

```graphql
query {
  products(where: { name: { oneOf: ["Shoe A", "Shoe B"] } }, channel: "default-channel", first: 10) {
    edges { node { id name } }
  }
}
```

### Sorting

Pass `sortBy` with `field` and `direction` (ASC/DESC).

```graphql
query {
  products(sortBy: { field: CREATED_AT, direction: DESC }, channel: "default-channel", first: 10) {
    edges { node { id name created } }
  }
}
```

### Metadata

Most types implement `ObjectWithMetadata`. Public metadata is accessible to all; private requires permissions.

```graphql
mutation {
  updateMetadata(id: "UHJvZHVjdDox", input: [{ key: "custom_field", value: "data" }]) {
    item { metadata { key value } }
  }
}
```

### Permissions

Operations require specific permissions. Key permissions:
- `MANAGE_PRODUCTS` - products, variants, categories, collections
- `MANAGE_ORDERS` - orders, fulfillments
- `HANDLE_PAYMENTS` - transactions, payments
- `MANAGE_CHECKOUTS` - checkout operations (some)
- `MANAGE_USERS` - customer accounts
- `MANAGE_STAFF` - staff accounts, permission groups
- `MANAGE_DISCOUNTS` - vouchers, promotions
- `MANAGE_CHANNELS` - channel CRUD
- `MANAGE_APPS` - app management
- `MANAGE_CONTACT_SUBMISSIONS` - custom: contact form submissions

### Webhook Events

Mutations trigger async webhook events. Sync webhooks block until response (20s timeout). Subscription query syntax defines payload shape.

```graphql
subscription {
  event {
    ... on ProductUpdated {
      product { id name }
    }
  }
}
```

## Custom Extensions

This project extends standard Saleor with custom API features. See `references/custom-extensions-api.md` for full details.

| Feature | Operations | Permission |
|---------|-----------|------------|
| Newsletter | `newsletterSubscribe`, `newsletterUnsubscribe`, `newsletter_subscription_status` | Public (mutations), MANAGE_USERS (admin queries) |
| Contact Forms | `contactSubmissionCreate`, `contactSubmissionReply`, `contactSubmissionUpdateStatus`, `contactSubmissionDelete`, `contactSubmissionBulkDelete` | Public (create), MANAGE_CONTACT_SUBMISSIONS (admin) |
| Product Reviews | `productReviewCreate`, `productReviewUpdate`, `productReviewDelete`, `markReviewHelpful`, `productReviews` query | Varies |
| Stock Alerts | `stockAlertSubscribe`, `stockAlertUnsubscribe` | Public |
| Invoice Requests | `invoiceRequest(orderId)` | Authenticated |

## Maintenance Workflow

Keep this skill updated when API changes occur.

### When to Update

- After adding or modifying custom Django models in `saleor/saleor/account/models.py`
- After adding or modifying custom GraphQL types in `saleor/saleor/graphql/account/types.py`
- After adding or modifying custom mutations in `saleor/saleor/graphql/account/mutations/account/`
- After adding or modifying custom queries/schema in `saleor/saleor/graphql/account/schema.py`
- After adding or modifying custom filters in `saleor/saleor/graphql/account/filters.py`
- After adding or modifying custom services in `saleor/saleor/account/services/`
- After adding new `.graphql` files in `storefront/src/graphql/`
- After upgrading Saleor core version (check for API changes)

### What to Update

1. Update `references/custom-extensions-api.md` with new/changed models, types, mutations, queries, filters, services
2. Update the Quick Reference table in this SKILL.md if new common operations were added
3. Update the Custom Extensions table if new feature areas were added

### Source Files to Monitor

```
saleor/saleor/account/models.py              # Custom Django models
saleor/saleor/graphql/account/types.py        # Custom GraphQL types
saleor/saleor/graphql/account/schema.py       # Query/mutation registration
saleor/saleor/graphql/account/mutations/account/  # Custom mutation files
saleor/saleor/graphql/account/filters.py      # Custom filters
saleor/saleor/graphql/account/resolvers.py    # Custom resolvers
saleor/saleor/account/services/               # Custom services
saleor/saleor/permission/enums.py             # Custom permissions
storefront/src/graphql/                        # Storefront GraphQL operations
```

## Search Patterns

To find specific content in reference files:

```
# Find a specific mutation
grep -r "mutationName" references/

# Find all mutations in a domain
grep -r "^### " references/products-api.md

# Find type definitions
grep -r "^type " references/

# Find permissions for operations
grep -r "Permission" references/

# Find webhook events
grep -r "webhook\|WEBHOOK\|Webhook" references/

# Find custom operations
grep -r "custom\|Custom\|CUSTOM" references/custom-extensions-api.md
```