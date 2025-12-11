# Saleor Shop Configuration Guide

This guide covers configuring your Saleor shop for production use, including channels, products, shipping, payments, and more.

## Prerequisites

- Saleor Core API running and accessible
- Access to Saleor Dashboard (http://localhost:9000/ or production URL)
- Superuser account created

## Step 1: Create a Channel

Channels define where your products are sold (e.g., web store, mobile app, different regions).

### Via Dashboard

1. Log in to Saleor Dashboard
2. Navigate to **Configuration** → **Channels**
3. Click **Create Channel**
4. Fill in:
   - **Name**: `Default Channel` (or your preferred name)
   - **Slug**: `default-channel` (must match `NEXT_PUBLIC_DEFAULT_CHANNEL` in storefront)
   - **Currency**: Select your base currency (e.g., USD, EUR)
   - **Default Country**: Select your primary shipping country
5. Click **Save**

### Via GraphQL

```graphql
mutation {
  channelCreate(
    input: {
      name: "Default Channel"
      slug: "default-channel"
      currencyCode: USD
      defaultCountry: US
      isActive: true
    }
  ) {
    channel {
      id
      name
      slug
    }
    errors {
      field
      message
    }
  }
}
```

## Step 2: Configure Currencies and Countries

### Set Base Currency

1. Navigate to **Configuration** → **Channels**
2. Edit your channel
3. Set **Currency** to your base currency
4. Save

### Configure Shipping Countries

1. Navigate to **Configuration** → **Shipping**
2. Click **Shipping Zones**
3. Create or edit a shipping zone
4. Add countries where you ship
5. Save

## Step 3: Set Up Product Types and Attributes

### Create Product Attributes

Attributes define product characteristics (size, color, material, etc.).

**Via Dashboard:**

1. Navigate to **Catalog** → **Attributes**
2. Click **Create Attribute**
3. Fill in:
   - **Name**: e.g., "Color"
   - **Slug**: auto-generated
   - **Type**: Select type (e.g., DROPDOWN, MULTISELECT)
4. Add **Attribute Values**:
   - Click **Add Value**
   - Enter value name (e.g., "Red", "Blue", "Green")
5. Click **Save**

**Common Attributes:**

- **Color**: DROPDOWN or MULTISELECT
- **Size**: DROPDOWN (S, M, L, XL)
- **Material**: DROPDOWN
- **Brand**: DROPDOWN

### Create Product Types

Product types define the structure of your products.

**Via Dashboard:**

1. Navigate to **Catalog** → **Product Types**
2. Click **Create Product Type**
3. Fill in:
   - **Name**: e.g., "T-Shirt"
   - **Has Variants**: Yes (if product has size/color options)
   - **Is Shipping Required**: Yes (for physical products)
   - **Is Digital**: No (for physical products)
4. Assign **Product Attributes**:
   - Select attributes (e.g., Color, Size)
5. Click **Save**

**Example Product Types:**

- **Simple Product**: No variants (e.g., books, accessories)
- **Variant Product**: Has variants (e.g., clothing with sizes/colors)
- **Digital Product**: Is Digital = Yes (e.g., software, ebooks)

## Step 4: Create Categories and Collections

### Categories

Categories organize your product catalog hierarchically.

**Via Dashboard:**

1. Navigate to **Catalog** → **Categories**
2. Click **Create Category**
3. Fill in:
   - **Name**: e.g., "Clothing"
   - **Description**: Optional
   - **Parent Category**: Optional (for subcategories)
4. Upload **Category Image** (optional)
5. Click **Save**

**Example Structure:**

```
Clothing
├── Men's
│   ├── T-Shirts
│   ├── Pants
│   └── Shoes
└── Women's
    ├── Dresses
    ├── Tops
    └── Accessories
```

### Collections

Collections are curated groups of products (e.g., "Summer Sale", "New Arrivals").

**Via Dashboard:**

1. Navigate to **Catalog** → **Collections**
2. Click **Create Collection**
3. Fill in:
   - **Name**: e.g., "New Arrivals"
   - **Description**: Optional
   - **Published**: Yes (to make visible)
4. Add **Products**:
   - Click **Add Products**
   - Select products to include
5. Click **Save**

## Step 5: Create Products

### Simple Product (No Variants)

1. Navigate to **Catalog** → **Products**
2. Click **Create Product**
3. Fill in **Product Details**:
   - **Name**: Product name
   - **Description**: Rich text description
   - **Category**: Select category
   - **Product Type**: Select product type
   - **Collections**: Optional
4. Add **Product Images**:
   - Upload images (first image is primary)
5. Set **Pricing**:
   - **Price**: Base price
   - **Currency**: Select currency
6. Set **Inventory**:
   - **SKU**: Stock keeping unit
   - **Quantity**: Available quantity
7. **Publish**:
   - Toggle **Published** to make visible
   - Select **Channel** (must match your storefront channel)
8. Click **Save**

### Variant Product (With Size/Color)

1. Follow steps 1-4 above
2. In **Variants** section:
   - Click **Add Variant**
   - Set **Variant Attributes** (e.g., Size: M, Color: Red)
   - Set **Price** (can override base price)
   - Set **SKU** and **Quantity**
   - Upload **Variant Image** (optional)
3. Repeat for each variant combination
4. Click **Save**

## Step 6: Configure Shipping

### Create Shipping Zones

Shipping zones define where you ship and what methods are available.

**Via Dashboard:**

1. Navigate to **Configuration** → **Shipping**
2. Click **Shipping Zones**
3. Click **Create Shipping Zone**
4. Fill in:
   - **Name**: e.g., "United States"
   - **Countries**: Add countries (e.g., United States)
5. Click **Save**

### Create Shipping Methods

**Via Dashboard:**

1. In your shipping zone, click **Add Shipping Method**
2. Select **Shipping Method Type**:
   - **Price Based**: Fixed price or price range
   - **Weight Based**: Based on product weight
3. Fill in:
   - **Name**: e.g., "Standard Shipping"
   - **Description**: Optional
   - **Price**: Shipping cost
   - **Minimum Order Price**: Optional (free shipping threshold)
   - **Maximum Order Price**: Optional
4. Click **Save**

**Example Shipping Methods:**

- **Standard Shipping**: $5.99, 5-7 business days
- **Express Shipping**: $12.99, 2-3 business days
- **Free Shipping**: $0, orders over $50

### Via GraphQL

```graphql
mutation {
  shippingZoneCreate(
    input: {
      name: "United States"
      countries: [US]
      default: true
      addShippingMethods: [
        {
          name: "Standard Shipping"
          type: PRICE
          price: { amount: 5.99, currency: USD }
        }
      ]
    }
  ) {
    shippingZone {
      id
      name
    }
  }
}
```

## Step 7: Configure Payment Gateways

### Stripe Integration

**Prerequisites:**

- Stripe account
- Stripe API keys

**Via Dashboard:**

1. Navigate to **Configuration** → **Payment Methods**
2. Click **Add Payment Provider**
3. Select **Stripe**
4. Fill in:
   - **Publishable Key**: Your Stripe publishable key (pk_...)
   - **Secret Key**: Your Stripe secret key (sk_...)
   - **Webhook Secret**: Your Stripe webhook secret (whsec_...)
5. Click **Save**

**Environment Variables:**

Add to your `.env` file:

```env
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Webhook Configuration:**

1. In Stripe Dashboard, go to **Webhooks**
2. Add endpoint: `https://api.yourdomain.com/webhooks/stripe/`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy webhook secret to Saleor

### Other Payment Providers

Saleor supports multiple payment providers:

- **Braintree**
- **Razorpay**
- **Adyen**
- **Custom providers** (via plugins)

See [Saleor Payment Documentation](https://docs.saleor.io/docs/3.x/developer/payments) for details.

## Step 8: Configure Taxes

### Flat Tax Rate

**Via Dashboard:**

1. Navigate to **Configuration** → **Taxes**
2. Click **Tax Classes**
3. Click **Create Tax Class**
4. Fill in:
   - **Name**: e.g., "Standard Tax"
   - **Rate**: e.g., 8.5% (enter as 8.5)
   - **Country**: Select country
5. Click **Save**

### Tax Exempt Products

1. Edit a product
2. In **Taxes** section:
   - Select **Tax Class**: "Tax Exempt"
   - Or uncheck **Charge Taxes**

### Automated Tax (Avalara)

For automated tax calculation:

1. Sign up for Avalara account
2. Navigate to **Configuration** → **Plugins**
3. Enable **Avalara** plugin
4. Configure with your Avalara credentials

## Step 9: Configure Email

### SMTP Configuration

**Via Environment Variables:**

```env
EMAIL_URL=smtp://username:password@smtp.gmail.com:587/?tls=True
```

**Or individual settings:**

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

**Gmail Setup:**

1. Enable 2-factor authentication
2. Generate app password: [Google Account Settings](https://myaccount.google.com/apppasswords)
3. Use app password in `EMAIL_HOST_PASSWORD`

### Email Templates

Saleor includes default email templates. Customize via Dashboard:

1. Navigate to **Configuration** → **Email Templates**
2. Edit templates as needed

## Step 10: Additional Configuration

### Site Settings

**Via Dashboard:**

1. Navigate to **Configuration** → **Site Settings**
2. Configure:
   - **Site Name**: Your store name
   - **Site Description**: Store description
   - **Header Text**: Optional header message
   - **Footer Text**: Optional footer message

### Staff Management

**Add Staff Members:**

1. Navigate to **Staff** → **Staff Members**
2. Click **Add Staff Member**
3. Fill in email and assign permissions
4. User will receive invitation email

**Permission Levels:**

- **Full Access**: All permissions
- **Limited Access**: Custom permissions (orders, products, etc.)

### Order Settings

**Via Dashboard:**

1. Navigate to **Configuration** → **Order Settings**
2. Configure:
   - **Automatically fulfill non-shippable digital products**: Yes/No
   - **Automatically confirm orders after payment**: Yes/No
   - **Allow unpaid order editing**: Yes/No

## GraphQL Mutation Examples

### Create Product

```graphql
mutation {
  productCreate(
    input: {
      name: "Example Product"
      description: "Product description"
      category: "category-id"
      productType: "product-type-id"
      basePrice: 29.99
      sku: "PROD-001"
      stocks: [{ warehouse: "warehouse-id", quantity: 100 }]
      attributes: [
        { id: "attribute-id", values: ["value-id"] }
      ]
    }
  ) {
    product {
      id
      name
    }
    errors {
      field
      message
    }
  }
}
```

### Create Shipping Zone

```graphql
mutation {
  shippingZoneCreate(
    input: {
      name: "United States"
      countries: [US]
      default: true
    }
  ) {
    shippingZone {
      id
      name
    }
  }
}
```

### Create Collection

```graphql
mutation {
  collectionCreate(
    input: {
      name: "Summer Sale"
      description: "Summer collection"
      isPublished: true
      products: ["product-id-1", "product-id-2"]
    }
  ) {
    collection {
      id
      name
    }
  }
}
```

## Testing Your Configuration

### Test Checkout Flow

1. Add products to cart in storefront
2. Proceed to checkout
3. Verify:
   - Shipping methods appear
   - Payment methods work
   - Taxes calculate correctly
   - Order confirmation email sent

### Test Product Display

1. Verify products appear in storefront
2. Check product details page
3. Test variant selection
4. Verify images load correctly

## Common Issues

### Products Not Showing

- Check product is **Published**
- Verify product is assigned to correct **Channel**
- Ensure channel is **Active**
- Check product has **Stock** and **Price**

### Shipping Not Available

- Verify shipping zone includes customer's country
- Check shipping method is active
- Ensure shipping zone is assigned to channel

### Payment Fails

- Verify payment gateway credentials
- Check webhook configuration
- Review payment gateway logs
- Test with test mode first

## Next Steps

- Set up product imports (CSV, API)
- Configure promotions and discounts
- Set up customer accounts
- Configure order fulfillment
- Set up analytics and tracking

## Additional Resources

- [Saleor Configuration Documentation](https://docs.saleor.io/docs/3.x/user/configuration)
- [Saleor GraphQL API](https://docs.saleor.io/docs/3.x/developer/graphql-api)
- [Saleor Plugins](https://docs.saleor.io/docs/3.x/developer/plugins)

