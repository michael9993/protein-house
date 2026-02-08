# Discounts API Reference

Source: https://docs.saleor.io/developer/discounts/ + /api-reference/discounts/

## Discount Classification

### Three Primary Types

1. **Promotions** — Automatically applied without user action
2. **Vouchers** — Require customer code entry during checkout
3. **Manual Discounts** — Applied by staff users

### Application Order

**Line-level discounts** (applied first, modify base prices):
- Catalogue promotions
- Specific product vouchers
- Once-per-order vouchers
- Shipping vouchers
- Manual line discounts

**Order-level discounts** (applied to subtotal/shipping, propagated to lines):
- Order promotions
- Entire order vouchers
- Manual order discounts

### Value Types

- **Fixed** — Absolute amount deducted
- **Percentage** — Proportional reduction

## Promotions

### promotionCreate

```graphql
promotionCreate(input: PromotionCreateInput!): PromotionCreate
```

Permission: `MANAGE_DISCOUNTS`
Webhook: `PROMOTION_CREATED` (async)

Input fields: `name`, `description`, `startDate`, `endDate`, `type` (CATALOGUE or ORDER)

```graphql
mutation {
  promotionCreate(input: {
    name: "Summer Sale"
    type: CATALOGUE
    startDate: "2024-06-01T00:00:00Z"
    endDate: "2024-08-31T23:59:59Z"
  }) {
    promotion { id name type }
    errors { field code message }
  }
}
```

### promotionUpdate

```graphql
promotionUpdate(id: ID!, input: PromotionUpdateInput!): PromotionUpdate
```

Permission: `MANAGE_DISCOUNTS`

### promotionDelete

```graphql
promotionDelete(id: ID!): PromotionDelete
```

Permission: `MANAGE_DISCOUNTS`

### promotionRuleCreate

```graphql
promotionRuleCreate(input: PromotionRuleCreateInput!): PromotionRuleCreate
```

Permission: `MANAGE_DISCOUNTS`

Input: `name`, `promotion` (ID), `channels` (IDs), `rewardValue`, `rewardValueType` (FIXED or PERCENTAGE), `cataloguePredicate` or `orderPredicate`, `rewardType`

```graphql
mutation {
  promotionRuleCreate(input: {
    name: "20% off shoes"
    promotion: "UHJvbW90aW9uOjE="
    channels: ["Q2hhbm5lbDox"]
    rewardValueType: PERCENTAGE
    rewardValue: 20
    cataloguePredicate: {
      categoryPredicate: { ids: ["Q2F0ZWdvcnk6MQ=="] }
    }
  }) {
    promotionRule { id name }
    errors { field code message }
  }
}
```

### promotionRuleUpdate / promotionRuleDelete

```graphql
promotionRuleUpdate(id: ID!, input: PromotionRuleUpdateInput!): PromotionRuleUpdate
promotionRuleDelete(id: ID!): PromotionRuleDelete
```

## Vouchers

### voucherCreate

```graphql
voucherCreate(input: VoucherInput!): VoucherCreate
```

Permission: `MANAGE_DISCOUNTS`

Input fields: `type` (ENTIRE_ORDER, SPECIFIC_PRODUCT, SHIPPING), `name`, `code`, `discountValueType` (FIXED or PERCENTAGE), `startDate`, `endDate`, `usageLimit`, `applyOncePerOrder`, `applyOncePerCustomer`, `onlyForStaff`, `minCheckoutItemsQuantity`, `countries`, `addCodes` (bulk code generation)

```graphql
mutation {
  voucherCreate(input: {
    type: ENTIRE_ORDER
    name: "Welcome Discount"
    code: "WELCOME10"
    discountValueType: PERCENTAGE
    startDate: "2024-01-01T00:00:00Z"
    usageLimit: 1000
    applyOncePerCustomer: true
  }) {
    voucher { id code }
    errors { field code message }
  }
}
```

### voucherUpdate

```graphql
voucherUpdate(id: ID!, input: VoucherInput!): VoucherUpdate
```

### voucherDelete

```graphql
voucherDelete(id: ID!): VoucherDelete
```

### voucherChannelListingUpdate

```graphql
voucherChannelListingUpdate(
  id: ID!
  input: VoucherChannelListingInput!
): VoucherChannelListingUpdate
```

Set discount value per channel:
```graphql
mutation {
  voucherChannelListingUpdate(id: "Vm91Y2hlcjox", input: {
    addChannels: [{
      channelId: "Q2hhbm5lbDox"
      discountValue: 10
      minAmountSpent: 50
    }]
  }) {
    voucher { id channelListings { channel { slug } discountValue minSpent { amount } } }
  }
}
```

## Voucher Types

| Type | Behavior |
|------|----------|
| `ENTIRE_ORDER` | Discount on entire order subtotal |
| `SPECIFIC_PRODUCT` | Discount on specific products only (requires product/collection/category assignment) |
| `SHIPPING` | Free or discounted shipping |

### Special Flags

- `applyOncePerOrder: true` — applies to cheapest qualifying line only
- `applyOncePerCustomer: true` — customer can use voucher only once
- `onlyForStaff: true` — restricted to staff accounts

## Gift Cards

### giftCardCreate

```graphql
giftCardCreate(input: GiftCardCreateInput!): GiftCardCreate
```

Permission: `MANAGE_GIFT_CARD`

Input: `balance` (MoneyInput, required), `userEmail`, `expiryDate`, `isActive`, `code`, `note`, `addTags`, `channel`

```graphql
mutation {
  giftCardCreate(input: {
    balance: { amount: 50, currency: "USD" }
    userEmail: "customer@example.com"
    isActive: true
    channel: "default-channel"
  }) {
    giftCard { id code initialBalance { amount } currentBalance { amount } }
    errors { field code message }
  }
}
```

### giftCardUpdate

```graphql
giftCardUpdate(id: ID!, input: GiftCardUpdateInput!): GiftCardUpdate
```

## Vouchers vs. Gift Cards

| Aspect | Vouchers | Gift Cards |
|--------|----------|-----------|
| Target | Reduce subtotal, unit price, or shipping | Reduce total checkout price |
| Scope | Channel-specific | Per currency, multi-channel |
| Application | Condition-dependent | Universal redemption |
| API | Same mutations: `checkoutAddPromoCode` / `checkoutRemovePromoCode` |

## Applying Discounts to Checkout

Both vouchers and gift cards use the same mutation:

```graphql
mutation {
  checkoutAddPromoCode(id: "Q2hlY2tvdXQ6...", promoCode: "WELCOME10") {
    checkout {
      discount { amount currency }
      voucherCode
      giftCards { id currentBalance { amount } }
      totalPrice { gross { amount currency } }
    }
    errors { field code message }
  }
}
```

Remove:
```graphql
mutation {
  checkoutRemovePromoCode(id: "Q2hlY2tvdXQ6...", promoCode: "WELCOME10") {
    checkout { totalPrice { gross { amount } } }
    errors { field code message }
  }
}
```

## Manual Discounts (Staff Only)

### orderDiscountAdd

```graphql
orderDiscountAdd(orderId: ID!, input: OrderDiscountCommonInput!): OrderDiscountAdd
```

Permission: `MANAGE_ORDERS`

Input: `valueType` (FIXED or PERCENTAGE), `value`, `reason`

### orderLineDiscountUpdate

```graphql
orderLineDiscountUpdate(
  orderLineId: ID!
  input: OrderDiscountCommonInput!
): OrderLineDiscountUpdate
```

## Queries

### vouchers

```graphql
vouchers(
  filter: VoucherFilterInput
  sortBy: VoucherSortingInput
  channel: String
  before: String, after: String, first: Int, last: Int
): VoucherCountableConnection
```

Permission: `MANAGE_DISCOUNTS`

### promotions

```graphql
promotions(
  where: PromotionWhereInput
  sortBy: PromotionSortingInput
  before: String, after: String, first: Int, last: Int
): PromotionCountableConnection
```

Permission: `MANAGE_DISCOUNTS`

### giftCards

```graphql
giftCards(
  filter: GiftCardFilterInput
  sortBy: GiftCardSortingInput
  before: String, after: String, first: Int, last: Int
): GiftCardCountableConnection
```

Permission: `MANAGE_GIFT_CARD`