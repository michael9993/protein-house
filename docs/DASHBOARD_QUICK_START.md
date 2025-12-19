# Dashboard Quick Start Guide

Step-by-step instructions for common content management tasks in the Saleor Dashboard.

---

## Accessing the Dashboard

**URL**: `http://localhost:9000` (or your configured dashboard URL)

**Default Credentials** (if using sample data):
- Email: `admin@example.com`
- Password: `admin`

---

## 🏠 Setting Up the Homepage

### Step 1: Create Featured Products Collection

1. Go to **Catalog → Collections**
2. Click **"Create Collection"**
3. Enter:
   - **Name**: `Featured Products`
   - **Slug**: `featured-products` (exact!)
4. Click **"Save"**
5. Click **"Assign Products"**
6. Select 8-12 products for your homepage
7. **Publish** the collection

### Step 2: Create New Arrivals Collection

1. Go to **Catalog → Collections**
2. Click **"Create Collection"**
3. Enter:
   - **Name**: `New Arrivals`
   - **Slug**: `new-arrivals` (exact!)
4. Add your newest products
5. **Publish** the collection

### Step 3: Create Best Sellers Collection

1. Go to **Catalog → Collections**
2. Click **"Create Collection"**
3. Enter:
   - **Name**: `Best Sellers`
   - **Slug**: `best-sellers` (exact!)
4. Add popular products
5. **Publish** the collection

### Step 4: Create Sale Collection

1. Go to **Catalog → Collections**
2. Click **"Create Collection"**
3. Enter:
   - **Name**: `On Sale`
   - **Slug**: `sale` (exact!)
4. Add discounted products
5. **Publish** the collection

---

## 🧭 Setting Up Navigation

### Create Main Menu (Header)

1. Go to **Content → Navigation**
2. Click **"Create Menu"**
3. Enter:
   - **Name**: `Main Navigation`
   - **Slug**: `navbar` (exact!)
4. Click **"Save"**

### Add Menu Items

1. Open the `navbar` menu
2. Click **"Add Menu Item"**
3. For each item, choose type:

**Category Item:**
```
Name: (auto-filled from category)
Type: Category
Link: Select category
```

**Collection Item:**
```
Name: Sale
Type: Collection
Link: Select "On Sale" collection
```

**Page Item:**
```
Name: About Us
Type: Page
Link: Select "About Us" page
```

**Custom URL:**
```
Name: Blog
Type: URL
Link: https://blog.yoursite.com
```

### Example Menu Structure

```
navbar
├── Category: Apparel
├── Category: Footwear  
├── Category: Accessories
├── Collection: Sale
└── Page: About Us
```

---

## 📄 Creating CMS Pages

### About Us Page

1. Go to **Content → Pages**
2. Click **"Create Page"**
3. Enter:
   - **Title**: `About Us`
   - **Slug**: `about` (exact!)
4. **Content** (use rich text editor):
   ```
   # About Our Store
   
   Welcome to [Store Name]! We've been serving customers since [year].
   
   ## Our Mission
   To provide quality products at affordable prices.
   
   ## Our Values
   - Quality
   - Customer Service
   - Sustainability
   ```
5. **SEO Settings**:
   - SEO Title: `About Us | Your Store Name`
   - SEO Description: `Learn about Your Store Name and our commitment to quality.`
6. Toggle **"Published"** → **Save**

### Contact Page

1. Go to **Content → Pages**
2. Click **"Create Page"**
3. Enter:
   - **Title**: `Contact Us`
   - **Slug**: `contact` (exact!)
4. **Content**:
   ```
   # Contact Us
   
   We'd love to hear from you!
   
   ## Customer Service
   - Email: support@yourstore.com
   - Phone: 1-800-XXX-XXXX
   - Hours: Mon-Fri 9am-5pm EST
   
   ## Office Address
   123 Main Street
   City, State 12345
   ```
5. Toggle **"Published"** → **Save**

### FAQ Page

1. Create page with slug: `faq`
2. Format questions as H2 headings:
   ```
   # Frequently Asked Questions
   
   ## How do I track my order?
   You can track your order by logging into your account...
   
   ## What is your return policy?
   We accept returns within 30 days of purchase...
   ```

---

## 📦 Managing Products

### Create a Product

1. Go to **Catalog → Products**
2. Click **"Create Product"**
3. Select **Product Type** (e.g., "Apparel")
4. Fill in:
   - **Name**: Product name
   - **Slug**: Auto-generated (can edit)
   - **Description**: Rich text description
   - **Category**: Select category
5. **Pricing**:
   - Set price per channel
   - Set optional "Compare at" price for discounts
6. **Media**:
   - Upload product images
   - First image = thumbnail
7. **Inventory** (if applicable):
   - Set stock quantity
   - Configure warehouse

### Create Product Variants

1. Open an existing product
2. Go to **Variants** tab
3. If product type has variant attributes:
   - Click **"Create Variants"**
   - Select attribute values (e.g., Size: S, M, L)
4. For each variant:
   - Set SKU
   - Set price (if different from base)
   - Set stock quantity

### Assign Product to Collection

1. Open the product
2. Go to **Organization** section
3. Under **Collections**, click **"Assign to collection"**
4. Select collection(s)
5. **Save**

---

## 📁 Organizing Categories

### Create Parent Category

1. Go to **Catalog → Categories**
2. Click **"Create Category"**
3. Enter:
   - **Name**: `Apparel`
   - **Slug**: `apparel`
   - **Description**: Category description
4. **Background Image**: Upload banner (1920x400px)
5. **SEO Settings**: Title and description
6. **Save**

### Create Subcategory

1. Go to **Catalog → Categories**
2. Click **"Create Category"**
3. Enter:
   - **Name**: `Men's Shirts`
   - **Slug**: `mens-shirts`
   - **Parent Category**: Select `Apparel`
4. **Save**

### Category Structure Example

```
├── Apparel (parent)
│   ├── Men's (child)
│   │   ├── Shirts (grandchild)
│   │   ├── Pants
│   │   └── Jackets
│   └── Women's
│       ├── Dresses
│       └── Tops
├── Footwear
└── Accessories
```

---

## 🏷️ Setting Up Product Filters

### Create Size Attribute

1. Go to **Configuration → Attributes**
2. Click **"Create Attribute"**
3. Enter:
   - **Name**: `Size`
   - **Slug**: `size`
   - **Type**: `Product Attribute`
   - **Input Type**: `Dropdown`
4. **Settings**:
   - ✅ Filterable in Storefront
   - ✅ Filterable in Dashboard
   - ✅ Variant Selection (creates variants)
5. **Values**: Add XS, S, M, L, XL, XXL
6. **Save**

### Create Color Attribute

1. Go to **Configuration → Attributes**
2. Click **"Create Attribute"**
3. Enter:
   - **Name**: `Color`
   - **Slug**: `color`
   - **Type**: `Product Attribute`
   - **Input Type**: `Swatch` or `Dropdown`
4. **Settings**:
   - ✅ Filterable in Storefront
   - ✅ Variant Selection
5. **Values**: Add color options
6. **Save**

### Assign Attributes to Product Type

1. Go to **Configuration → Product Types**
2. Open or create a product type
3. **Product Attributes**: Add descriptive attributes
4. **Variant Attributes**: Add attributes that create variants (Size, Color)
5. **Save**

---

## 💰 Discounts & Sales

### Create a Sale

1. Go to **Discounts → Sales**
2. Click **"Create Sale"**
3. Enter:
   - **Name**: `Summer Sale`
   - **Discount Type**: Percentage or Fixed
   - **Value**: e.g., `20` (for 20% off)
4. **Products**: Assign specific products/categories
5. **Dates**: Set start and end dates
6. **Save**

### Create a Voucher Code

1. Go to **Discounts → Vouchers**
2. Click **"Create Voucher"**
3. Enter:
   - **Code**: `SAVE20`
   - **Discount Type**: Percentage
   - **Value**: `20`
4. **Settings**:
   - Usage limit
   - Per-customer limit
   - Minimum order value
5. **Save**

---

## 🚚 Shipping Configuration

### Create Shipping Zone

1. Go to **Configuration → Shipping**
2. Click **"Create Shipping Zone"**
3. Enter:
   - **Name**: `US Domestic`
   - **Countries**: Select United States
4. **Add Shipping Method**:
   - Name: `Standard Shipping`
   - Price: `$5.99`
   - Delivery time: `5-7 business days`
5. **Add another method**:
   - Name: `Express Shipping`
   - Price: `$14.99`
   - Delivery time: `1-2 business days`
6. **Save**

---

## 👤 Customer Management

### View Customer Details

1. Go to **Customers**
2. Click on a customer
3. View:
   - Order history
   - Addresses
   - Account details
   - Notes

### Create Staff Account

1. Go to **Configuration → Staff**
2. Click **"Invite Staff Member"**
3. Enter email
4. Assign permissions:
   - Full access
   - Or specific permissions
5. Send invitation

---

## 📊 Adding Product Metadata (Custom Data)

### Add Badge to Product

1. Open a product
2. Scroll to **Metadata** section
3. Click **"Add Field"**
4. Enter:
   ```
   Key: badge
   Value: New Arrival
   ```
5. Add another:
   ```
   Key: badge_color
   Value: #3B82F6
   ```
6. **Save**

The storefront will display this badge on the product card.

---

## ✅ Pre-Launch Checklist

Before going live, verify:

### Products
- [ ] All products have images
- [ ] All products have descriptions
- [ ] Prices are set correctly
- [ ] Stock levels are accurate
- [ ] Products assigned to categories

### Collections
- [ ] `featured-products` collection exists
- [ ] `new-arrivals` collection exists
- [ ] `best-sellers` collection exists
- [ ] All collections are published

### Navigation
- [ ] `navbar` menu exists
- [ ] Menu items link correctly
- [ ] Mobile menu works

### Pages
- [ ] `about` page exists and published
- [ ] `contact` page exists and published
- [ ] `faq` page exists and published
- [ ] Terms/Privacy pages exist

### Configuration
- [ ] Shipping zones configured
- [ ] Tax settings configured
- [ ] Payment methods enabled
- [ ] Email templates customized

---

## 🔧 Troubleshooting

### "Content not showing on storefront"

1. **Check if published**: Items must be toggled "Published"
2. **Check channel assignment**: Content must be in the correct channel
3. **Check slug**: Slugs must match exactly (case-sensitive)
4. **Clear cache**: Hard refresh the storefront (Ctrl+Shift+R)

### "Menu not appearing"

1. Verify menu slug is exactly `navbar`
2. Check menu is assigned to the channel
3. Verify menu items are valid (categories/collections exist)

### "Products not filtering"

1. Check attribute is marked "Filterable in Storefront"
2. Verify products have the attribute assigned
3. Run GraphQL codegen if schema changed

---

*Last updated: December 2024*

