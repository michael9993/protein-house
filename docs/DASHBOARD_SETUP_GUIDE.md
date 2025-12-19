# 📊 Saleor Dashboard Setup Guide

This guide explains how to configure your storefront content using the Saleor Dashboard.

## 🔗 Accessing the Dashboard

```
Dashboard URL: http://localhost:9000
Default Login: (created during setup)
```

---

## 📦 1. Setting Up Collections (Homepage Sections)

Collections control which products appear in homepage sections.

### Navigate to: Dashboard > Catalog > Collections

Create these collections with the **exact slugs**:

| Collection Slug | Purpose | Homepage Section |
|----------------|---------|------------------|
| `featured-products` | Main featured products | Hero/Featured |
| `new-arrivals` | Recently added products | "Just Dropped" |
| `best-sellers` | Top selling products | "Fan Favorites" |
| `sale` | Discounted products | "On Sale" |

### Steps to Create a Collection:

1. Click **"Create Collection"**
2. Enter the name (e.g., "New Arrivals")
3. In **"General Information"** > **"Slug"**, enter `new-arrivals`
4. Add a background image (optional, for category pages)
5. Go to **"Products"** tab and add products
6. Click **"Save"**

### Adding Products to Collections:

1. Open the collection
2. Go to **"Products"** tab
3. Click **"Assign Products"**
4. Select products to add
5. Save changes

---

## 📂 2. Setting Up Categories (Shop by Category)

Categories appear in the "Shop by Category" section on the homepage.

### Navigate to: Dashboard > Catalog > Categories

Create top-level categories for your store:

**For a Sports Store:**
- Running Shoes
- Training Gear
- Sportswear
- Accessories
- Basketball
- Soccer
- Tennis
- Swimming

### Steps to Create a Category:

1. Click **"Create Category"**
2. Enter the category name
3. Add a **background image** (important for homepage display!)
4. Set SEO title and description
5. Save

### Important: Add Background Images!

The homepage "Shop by Category" section displays category images.
- Recommended size: 800x600px
- Format: JPG or PNG
- Navigate to category > **"General Information"** > Upload image

---

## 📝 3. Setting Up CMS Pages (Static Pages)

Static pages like About, FAQ, and policies are managed as CMS pages.

### Navigate to: Dashboard > Content > Pages

Create pages with these **exact slugs**:

| Page Slug | Storefront URL | Description |
|-----------|----------------|-------------|
| `about` | /about | About Us page |
| `faq` | /faq | Frequently Asked Questions |
| `contact` | /contact | Contact information |
| `privacy-policy` | /pages/privacy-policy | Privacy Policy |
| `terms-of-service` | /pages/terms-of-service | Terms of Service |
| `shipping-policy` | /pages/shipping-policy | Shipping Policy |
| `return-policy` | /pages/return-policy | Return Policy |

### Steps to Create a Page:

1. Click **"Create Page"**
2. Enter the page title
3. Set the **slug** (exactly as shown above)
4. Add content using the rich text editor
5. Set SEO title and description
6. Publish the page

### Page Content Tips:

- Use the rich text editor for formatting
- Add images and links as needed
- Content supports HTML
- For FAQ, you can use a structured format:

```html
<h3>Question 1</h3>
<p>Answer to question 1...</p>

<h3>Question 2</h3>
<p>Answer to question 2...</p>
```

---

## 🧭 4. Setting Up Navigation Menus

Menus control header navigation and footer links.

### Navigate to: Dashboard > Content > Navigation

Create these menus:

| Menu Slug | Purpose |
|-----------|---------|
| `navbar` | Main header navigation |
| `footer` | Footer links |
| `footer-categories` | Footer category links |
| `footer-pages` | Footer page links |

### Steps to Create a Menu:

1. Click **"Create Menu"**
2. Enter menu name and slug
3. Add menu items:
   - **Category**: Links to a product category
   - **Collection**: Links to a collection
   - **Page**: Links to a CMS page
   - **Custom Link**: Any URL

### Example: Main Navigation (navbar)

```
├── Shop All (link to /products)
├── Categories (dropdown)
│   ├── Running Shoes
│   ├── Training Gear
│   └── Accessories
├── Collections (dropdown)
│   ├── New Arrivals
│   ├── Best Sellers
│   └── Sale
├── About (link to about page)
└── Contact (link to contact page)
```

### Example: Footer Menu

```
├── Shop
│   ├── All Products
│   ├── New Arrivals
│   └── Sale
├── Information
│   ├── About Us
│   ├── Contact
│   └── FAQ
└── Policies
    ├── Privacy Policy
    ├── Terms of Service
    └── Shipping & Returns
```

---

## 🏷️ 5. Setting Up Products

Products are the core of your store.

### Navigate to: Dashboard > Catalog > Products

### Steps to Create a Product:

1. Click **"Create Product"**
2. Fill in basic information:
   - Name
   - Description (supports rich text)
   - Category
3. Add **product images** (multiple recommended)
4. Set up **variants** (size, color, etc.)
5. Set **pricing** for your channel
6. Configure **inventory**
7. Assign to **collections** (New Arrivals, Best Sellers, etc.)
8. Publish the product

### Product Images:

- Recommended: Multiple images per product
- Main image: 1000x1000px minimum
- Format: JPG or PNG
- Show product from multiple angles

---

## 🎨 6. Setting Up Channels

Channels allow multi-currency and multi-country support.

### Navigate to: Dashboard > Configuration > Channels

### Default Channel Setup:

1. Open "Default Channel" (or create new)
2. Configure:
   - **Name**: Your store name
   - **Slug**: `default-channel`
   - **Currency**: USD (or your currency)
   - **Country**: United States (or your country)
3. Save changes

### Multi-Currency Setup:

Create additional channels for different currencies:
- `usd-channel` - US Dollar
- `eur-channel` - Euro
- `gbp-channel` - British Pound

---

## 🚚 7. Setting Up Shipping

Configure shipping methods and zones.

### Navigate to: Dashboard > Configuration > Shipping Methods

### Steps:

1. Create a **Shipping Zone** (e.g., "United States")
2. Add countries to the zone
3. Create **Shipping Methods** within the zone:
   - Standard Shipping ($5.99, 3-5 days)
   - Express Shipping ($12.99, 1-2 days)
   - Free Shipping (orders over $75)

### Free Shipping Threshold:

The storefront displays "Free shipping on orders over $X" based on your config.
Make sure to create a shipping method with:
- Price: $0
- Minimum order value: Your threshold

---

## 💳 8. Setting Up Payments (Stripe)

### Navigate to: Dashboard > Apps > Stripe

1. Install the Stripe app (if not installed)
2. Configure with your Stripe keys:
   - Publishable Key
   - Secret Key
   - Webhook Secret
3. Enable test mode for development

---

## 📧 9. Setting Up Emails (SMTP)

### Navigate to: Dashboard > Apps > SMTP

1. Install the SMTP app
2. Configure SMTP settings:
   - Host
   - Port
   - Username
   - Password
3. Map email events to templates

---

## ✅ Quick Setup Checklist

### Minimum Required for Homepage:

- [ ] Create at least 3 categories with images
- [ ] Create "new-arrivals" collection with products
- [ ] Create "best-sellers" collection with products
- [ ] Add at least 8 products with images
- [ ] Set up shipping methods
- [ ] Configure payment gateway

### Recommended for Full Store:

- [ ] All 4 homepage collections created
- [ ] 8+ categories with images
- [ ] About page content
- [ ] FAQ page content
- [ ] Privacy Policy page
- [ ] Terms of Service page
- [ ] Footer menu configured
- [ ] Header navigation configured
- [ ] Shipping zones set up
- [ ] Email templates configured

---

## 🔄 Content Updates

All content changes in the Dashboard are reflected on the storefront:

| Change | Refresh Time |
|--------|--------------|
| Products | ~1 minute |
| Collections | ~5 minutes |
| Categories | ~5 minutes |
| Pages | ~1 minute |
| Menus | ~1 hour |

To force refresh, restart the storefront:
```bash
cd storefront
pnpm dev
```

---

## 🆘 Troubleshooting

### Products not showing on homepage?

1. Check products are published
2. Check products are in the correct collection
3. Check collection slug is correct (e.g., `new-arrivals`)
4. Check products have channel pricing set

### Categories not showing?

1. Ensure categories have background images
2. Check categories are top-level (not nested)
3. Verify categories have products assigned

### Pages returning 404?

1. Check page slug matches exactly
2. Ensure page is published
3. Verify page is assigned to the channel

---

## 📚 Related Documentation

- [Saleor Dashboard Docs](https://docs.saleor.io/docs/3.x/dashboard)
- [Store Configuration Guide](../storefront/src/config/README.md)
- [Homepage Components](../storefront/src/components/home/README.md)

---

*Last Updated: December 2024*

