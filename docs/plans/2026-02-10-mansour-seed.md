# Mansour Shoes — Tailored Database Seed Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a single `seed_mansour` Django management command that populates a fresh Saleor database with a fully-functional Mansour Shoes e-commerce store — 2 channels (ILS/Hebrew + USD/English), 50 realistic shoe products, categories, 7 collections (4 product + 3 CMS metadata), shipping, taxes, pages, menus, vouchers, sample customers/orders, and storefront config.

**Architecture:** Custom Django management command (`seed_mansour.py`) orchestrating 16 helper modules in `saleor/core/utils/mansour_seed/`. Uses Django ORM directly (same pattern as existing `populatedb.py`). Idempotent via `update_or_create`. Downloads real shoe images from Unsplash during seed. Includes 20 fake customers + 20 orders for dashboard realism. Data-driven design: all product definitions in a single `product_data.py` file that's easy to extend.

**Tech Stack:** Python 3.12, Django ORM, Faker library, urllib for image downloads, Saleor models

---

## Context

The Saleor platform was just rebuilt with `--no-cache` and the PostgreSQL volume was recreated fresh. Migrations have been run but the database contains zero data. The storefront shows "No channels found" errors because it expects specific channels (`ils`, `usd`), collections, categories, products, and CMS config to function.

The existing `populatedb` command creates generic demo data (Channel-USD, Channel-PLN, random products) which doesn't match what the Mansour Shoes storefront expects. We need a tailored seed that creates exactly the right data structure.

### What the Storefront Actually Needs (Deep-Dive Findings)

The homepage (`storefront/src/app/[channel]/(main)/page.tsx`) fires **12 parallel data fetches**:

1. `ProductListByCollectionDocument` x 4 collections: `featured-products`, `new-arrivals`, `best-sellers`, `sale`
2. `ProductsNewestDocument` — fallback for new arrivals (sorted by `CREATED_AT` DESC)
3. `ProductsTopRatedDocument` — fallback for best sellers (sorted by `RATING` DESC)
4. `CategoriesForHomepageDocument` — top-level categories with children + product counts
5. `CollectionsListDocument` — all collections for Collection Mosaic section
6. `getHeroBannerConfig()` — reads `hero-banner` collection **metadata** keys
7. `getTestimonials()` — reads `testimonials` collection **metadata** JSON
8. `getFeaturedBrands()` — reads `brands` collection **metadata** JSON
9. `getBrandLogos()` — brand logos from product attributes

**Badge system** (`storefront/src/components/home/utils.ts`) is fully dynamic:
- **Out of stock** (dark): `totalStock <= 0` (sum of all variant `quantityAvailable`)
- **Sale** (accent): `priceRange.start.gross < priceRangeUndiscounted.start.gross` -> shows `-X% OFF`
- **Low stock** (warning): `totalStock > 0 && totalStock <= 5`
- **New** (primary): `created` within last 30 days (`NEW_DAYS = 30`)
- **Featured** (muted): default fallback badge

**Brand detection** looks for attribute slugs: `["brand", "vendor", "manufacturer", "label"]`

**All UI text** comes from config hooks (64 total) — storefront has zero hardcoded text.

---

## File Structure

```
saleor/saleor/core/
  management/commands/
    seed_mansour.py                     # Main orchestrator (~130 lines)
  utils/
    mansour_seed/
      __init__.py                        # Package init (empty)
      channels.py                        # 2 channels + tax config (~80 lines)
      warehouse.py                       # Warehouse + address (~50 lines)
      shipping.py                        # 2 zones + 4 methods + channel listings (~100 lines)
      attributes.py                      # 6 attributes + values + ProductType (~180 lines)
      categories.py                      # 20 categories (4 top + 16 L2) + Hebrew translations (~120 lines)
      product_data.py                    # Raw data for 50 shoes — data-driven, easy to extend (~500 lines)
      products.py                        # Product creation + variants + stock + images (~300 lines)
      promotions.py                      # Catalogue promotions for sale prices (~80 lines)
      collections.py                     # 7 collections (4 product + 3 CMS metadata) (~150 lines)
      pages.py                           # PageType + 7 pages + Hebrew translations (~200 lines)
      menus.py                           # 2 menus + items linked to categories/collections/pages (~100 lines)
      vouchers.py                        # 3 vouchers + codes + channel listings (~80 lines)
      customers.py                       # 20 fake customers + addresses (~100 lines)
      orders.py                          # 20 orders with lines + payments (~200 lines)
      site_settings.py                   # SiteSettings + company address (~50 lines)
      images.py                          # Image download utility from Unsplash (~60 lines)
```

**Total:** ~2,600 lines across 18 files (promotions.py is new; permission groups + gift cards added to existing files).

---

## Execution Order (Dependency Chain)

The command runs these in strict order:

```
Phase 1 — Foundation (no FK dependencies)
  1. Create superuser (admin@mansourshoes.com)
  2. Create channels: "ils" (ILS/IL) + "usd" (USD/US)
  3. Create TaxConfiguration per channel (ILS=17% flat, USD=0%)
  4. Create TaxClass "Standard VAT" + country rates

Phase 2 — Infrastructure (depends on channels)
  5. Create Address + Warehouse "Mansour Main Warehouse" (Tel Aviv)
  6. Create 2 shipping zones (Israel + International)
  7. Create 4 shipping methods + ShippingMethodChannelListing per channel
  8. Link warehouse <-> channels <-> shipping zones

Phase 3 — Catalog Schema (depends on channels)
  9.  Create 6 attributes: brand, material, gender, style, size, color
  10. Create AttributeValues for each (+ Hebrew translations for color)
  11. Create ProductType "Shoes" + assign product/variant attributes
  12. Create 20 categories (4 top-level + 16 L2) + Hebrew translations
  13. Rebuild MPTT tree (Category.tree.rebuild())

Phase 4 — Products (depends on everything above)
  14. Create 50 products from product_data.py definitions
      - ProductTranslation (Hebrew) per product
      - ProductChannelListing x2 (ils + usd) per product
  15. Create variants (3-8 per product, ~250 total)
      - ProductVariantChannelListing x2 (ILS + USD prices)
  16. Create Stock records with VARIED quantities per variant:
      - 2 products: stock=0 (out of stock badge)
      - 3 products: stock=1-5 per variant (low stock badge)
      - 45 products: stock=50-500 per variant (normal)
  17. Assign product attributes (brand, material, gender, style)
  18. Assign variant attributes (size, color) via AssignedVariantAttribute
  19. Download + attach product images from Unsplash
  20. Backdate created_at:
      - 12 products: within last 7 days (NEW badge)
      - 8 products: 8-30 days ago (still NEW)
      - 30 products: 31-180 days ago (no NEW badge)

Phase 5 — Promotions (depends on products + channels)
  21. Create Promotion + PromotionRule for sale products (catalogue type, percentage)
  22. Call update_variant_relations_for_active_promotion_rules_task()
  23. Call recalculate_discounted_price_for_products_task()
      -> This makes priceRangeUndiscounted > priceRange, triggering Sale badge

Phase 6 — Collections (depends on products)
  24. Create 4 product collections + Hebrew translations + channel listings:
      - featured-products, new-arrivals, best-sellers, sale
  25. Assign products -> collections based on product_data.py flags
  26. Create 3 CMS metadata collections + channel listings:
      - hero-banner: metadata keys (hero_title, hero_subtitle, hero_cta_text, hero_cta_link)
      - testimonials: metadata key (testimonials_json) with 6 testimonials
      - brands: metadata key (brands_json) with 10 brand entries

Phase 7 — Content
  27. Create PageType "General Page"
  28. Create 7 pages (about, contact, faq, etc.) + Hebrew translations

Phase 8 — Navigation (depends on categories, collections, pages)
  29. Create 2 menus: "navbar" + "footer"
  30. Create menu items linking to categories/collections/pages

Phase 9 — Marketing
  31. Create 3 vouchers + codes + channel listings

Phase 10 — Sample Data
  32. Create 20 fake customers with Israeli/US addresses
  33. Create 20 orders with line items, payments, fulfillments, OrderEvents

Phase 11 — Access Control
  34. Create permission groups (Full Access, Customer Support)
  35. Create 2 staff users with group assignments

Phase 12 — Gift Cards
  36. Create 3 sample gift cards (ILS100, ILS200, ILS500)

Phase 13 — Finalization
  37. Configure SiteSettings (company address, menus)
  38. Reset SQL sequences
  39. Update product search vectors
  40. Print post-seed instructions (build storefront config fallback, install apps)
```

---

## Critical Files to Reference

| Purpose | Path | Why |
|---------|------|-----|
| Existing seed command | `saleor/saleor/core/management/commands/populatedb.py` | Pattern for command structure, sequence reset, superuser creation |
| ORM helpers | `saleor/saleor/core/utils/random_data.py` | All create_* functions showing exact model relationships |
| Product models | `saleor/saleor/product/models.py` | Product, Variant, ChannelListing, Media, Collection models |
| Channel model | `saleor/saleor/channel/models.py` | Channel fields and constraints |
| Shipping models | `saleor/saleor/shipping/models.py` | ShippingZone, ShippingMethod, ChannelListing |
| Discount models | `saleor/saleor/discount/models.py` | Promotion, PromotionRule for sale prices |
| Account utils | `saleor/saleor/account/utils.py` | `create_superuser()` function |
| CMS helpers | `storefront/src/lib/cms.ts` | `homepageCollections`, `cmsCollections` slugs, metadata parsing |
| Homepage page | `storefront/src/app/[channel]/(main)/page.tsx` | 12 parallel fetches, all data the homepage needs |
| Badge logic | `storefront/src/components/home/utils.ts` | `getProductBadge()`, stock/price/date thresholds |
| Config fallback builder | `storefront/scripts/build-fallback-from-samples.cjs` | Builds storefront-cms-config.json from sample configs |
| Sample config (Hebrew) | `apps/apps/storefront-control/sample-config-import.json` | Hebrew/ILS channel config |
| Sample config (English) | `apps/apps/storefront-control/sample-config-import-en.json` | English/USD channel config |
| Tax models | `saleor/saleor/tax/models.py` | TaxConfiguration, TaxConfigurationPerCountry, TaxClass |
| Gift card models | `saleor/saleor/giftcard/models.py` | GiftCard, GiftCardTag, GiftCardEvent |

---

## Data Definitions

### Channels (2)

| Slug | Name | Currency | Country | Strategy |
|------|------|----------|---------|----------|
| `ils` | Israel | ILS | IL | transaction_flow / authorization |
| `usd` | International | USD | US | transaction_flow / authorization |

### Categories (20)

| Top-Level (4) | Children |
|----------------|----------|
| Men | Sneakers, Formal, Sandals, Boots, Athletic |
| Women | Sneakers, Heels, Flats, Boots, Sandals |
| Kids | Sneakers, Sandals, School Shoes |
| Accessories | Shoe Care, Insoles, Laces |

### Attributes (6)

| Slug | Type | Values |
|------|------|--------|
| `brand` | DROPDOWN | nike, adidas, puma, new-balance, reebok, asics, converse, vans, skechers, under-armour |
| `size` | DROPDOWN | 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47 |
| `color` | SWATCH | black (#000), white (#FFF), red (#E53935), blue (#1E88E5), navy (#1A237E), grey (#9E9E9E), brown (#795548), green (#43A047), pink (#EC407A), orange (#FB8C00), beige (#D7CCC8), multi (#FF00FF) |
| `material` | DROPDOWN | leather, canvas, suede, mesh, synthetic, rubber, textile |
| `gender` | DROPDOWN | men, women, unisex, kids |
| `style` | DROPDOWN | casual, athletic, formal, outdoor, fashion |

### Collections (7 total: 4 product + 3 CMS metadata)

**Product Collections** (assigned products, shown on homepage):

| Slug | Name (EN) | Name (HE) | Product Count |
|------|-----------|-----------|---------------|
| `featured-products` | Featured Products | Products featured | 8-10 |
| `new-arrivals` | New Arrivals | New on site | 10-12 |
| `best-sellers` | Best Sellers | Top sellers | 8-10 |
| `sale` | Sale | Deals | 8-10 |

**CMS Metadata Collections** (no products assigned, data in collection metadata):

| Slug | Purpose | Metadata Keys |
|------|---------|---------------|
| `hero-banner` | Hero section config | `hero_title`, `hero_subtitle`, `hero_cta_text`, `hero_cta_link`, `hero_video_url` |
| `testimonials` | Customer reviews | `testimonials_json` — array of `{name, role, quote, rating, image}` |
| `brands` | Featured brands | `brands_json` — array of `{name, logo, url}` |

### Products (50) — Distribution by Category

| Category | Count | Price Range (ILS) | Price Range (USD) |
|----------|-------|-------------------|-------------------|
| men-sneakers | 8 | 299-649 | 80-170 |
| men-athletic | 5 | 349-749 | 90-200 |
| men-formal | 3 | 399-699 | 100-180 |
| men-boots | 3 | 449-799 | 120-210 |
| men-sandals | 2 | 149-249 | 40-65 |
| women-sneakers | 6 | 279-599 | 75-160 |
| women-heels | 3 | 299-599 | 80-160 |
| women-flats | 3 | 199-399 | 50-110 |
| women-boots | 3 | 399-699 | 100-180 |
| women-sandals | 2 | 149-299 | 40-80 |
| kids-sneakers | 4 | 149-349 | 40-90 |
| kids-sandals | 2 | 99-199 | 25-50 |
| kids-school | 2 | 149-249 | 40-65 |
| shoe-care | 2 | 49-99 | 12-25 |
| insoles | 1 | 79 | 20 |
| laces | 1 | 29 | 8 |
| **Total** | **50** | | |

### Product Scenario Coverage (Badge System)

| Badge | Trigger | Seed Products | How |
|-------|---------|---------------|-----|
| **Out of stock** (dark) | `totalStock <= 0` | 2 products | Set `Stock.quantity = 0` for all variants |
| **Sale / -X% OFF** (accent) | `price < priceUndiscounted` | 8-10 products | Create `Promotion` + `PromotionRule` with percentage discount |
| **Low stock** (warning) | `0 < totalStock <= 5` | 3 products | Set `Stock.quantity = 1-2` per variant (total <= 5) |
| **New** (primary) | `created` within 30 days | 20 products | Backdate `created_at` to last 7-30 days |
| **Featured** (muted) | Default fallback | ~17 products | Older than 30 days, normal stock, no sale |

### Shipping

| Zone | Countries | Methods |
|------|-----------|---------|
| Israel | IL | Standard (ILS 20, 3-5 days), Express (ILS 45, 1-2 days) |
| International | US, UK, DE, FR, CA, AU | Standard ($12, 7-14 days), Express ($25, 3-5 days) |

### Pages (7)

| Slug | Title (EN) | Title (HE) |
|------|-----------|-----------|
| `about` | About Mansour Shoes | About Mansour Shoes (HE) |
| `contact` | Contact Us | Contact Us (HE) |
| `faq` | FAQ | FAQ (HE) |
| `privacy-policy` | Privacy Policy | Privacy Policy (HE) |
| `terms-of-service` | Terms of Service | Terms of Service (HE) |
| `shipping-policy` | Shipping Policy | Shipping Policy (HE) |
| `return-policy` | Return & Exchange Policy | Return Policy (HE) |

### Vouchers (3)

| Code | Type | Value | Conditions |
|------|------|-------|------------|
| WELCOME10 | ENTIRE_ORDER | 10% | One use per customer |
| FREESHIP | SHIPPING | 100% | No minimum |
| SUMMER25 | ENTIRE_ORDER | Fixed ILS 25/$7 | Min order ILS 200/$60 |

### Images Strategy

Download from Unsplash Source API (free, no auth needed):
- Search terms: "nike sneaker", "adidas shoe", "leather boot", etc.
- Fallback to Saleor placeholder images if download fails
- `--withoutimages` flag to skip (faster dev iteration)

---

## Post-Seed: External App Setup

The database seed creates all the data Saleor core needs. External apps need separate configuration **after** the seed:

| App | Manifest URL | What to Configure |
|-----|-------------|-------------------|
| **Storefront Control** | `http://saleor-storefront-control-app:3004/api/manifest` | Select channel, save config |
| **Stripe** | `http://saleor-stripe-app:3002/api/manifest` | Add Stripe API keys |
| **SMTP** | `http://saleor-smtp-app:3001/api/manifest` | Configure SMTP credentials |
| **Invoices** | `http://saleor-invoice-app:3003/api/manifest` | Company info for invoice PDF |
| **Newsletter** | `http://saleor-newsletter-app:3005/api/manifest` | Auto-configured |
| **Analytics** | `http://saleor-sales-analytics-app:3006/api/manifest` | Auto-configured |
| **Bulk Manager** | `http://saleor-bulk-manager-app:3007/api/manifest` | Auto-configured |

App installation: Dashboard > Apps > Install custom app > paste manifest URL.

---

## Verification Checklist

- [ ] `docker exec saleor-api-dev python manage.py seed_mansour --createsuperuser` runs without errors
- [ ] Running it a second time (idempotent) succeeds without duplicates
- [ ] Dashboard login works at http://localhost:9000 (admin@mansourshoes.com / admin123)
- [ ] Staff login works (manager@mansourshoes.com)
- [ ] Storefront homepage loads with products at http://localhost:3000
- [ ] All 5 badge types visible: New, Sale (-X% OFF), Low stock, Out of stock, Featured
- [ ] Hero section shows content (from `hero-banner` collection metadata)
- [ ] "Shop by Category" shows 4 top-level categories with images
- [ ] Category pages work (`/ils/categories/men-sneakers`) with products
- [ ] Product detail pages work (`/ils/products/nike-air-max-90`) with variants
- [ ] Cart add works (variants have stock)
- [ ] Checkout shipping methods appear (Israel + International zones)
- [ ] Orders visible in dashboard with varied statuses
- [ ] Hebrew content renders correctly on ILS channel (`/ils`)
- [ ] English content renders on USD channel (`/usd`)
- [ ] Collection pages work (featured, new-arrivals, best-sellers, sale)
- [ ] Testimonials section shows customer reviews (from metadata)
- [ ] Brand grid shows 10 brands (from metadata)
- [ ] Voucher codes work (WELCOME10, FREESHIP, SUMMER25)
- [ ] Gift cards visible in dashboard
- [ ] Permission groups created (Full Access, Customer Support)
