# 🌐 Universal E-Commerce Template Roadmap

## Vision

Create a **universal Saleor e-commerce template** that can be customized for ANY type of store through configuration - no code changes required for basic customization.

---

## ✅ COMPLETED - Dashboard Integration

### CMS Integration

Uses existing Saleor GraphQL API - no custom queries needed!

- [x] **Pages** - Fetch content from Dashboard > Content > Pages

  - Uses existing `PageGetBySlugDocument`
  - About, FAQ, Contact, Privacy Policy, Terms, etc.
  - Rich text content support
  - SEO metadata support

- [x] **Collections** - Fetch from Dashboard > Catalog > Collections

  - Uses existing `ProductListByCollectionDocument`
  - `new-arrivals` - New Arrivals section
  - `best-sellers` - Best Sellers section
  - `sale` - On Sale section
  - `featured-products` - Featured section

- [x] **Menus** - Fetch from Dashboard > Content > Navigation
  - Uses existing `MenuGetBySlugDocument`
  - Footer links (slug: `footer`)
  - Navigation menus (slug: `navbar`)

### CMS Layer (`storefront/src/lib/cms.ts`)

- [x] `getCMSPage()` - Fetch page by slug
- [x] `getCMSMenu()` - Fetch menu items
- [x] `getCollectionProducts()` - Fetch collection products
- [x] Fallback content for when CMS is empty
- [x] Collection slug constants

### Documentation

- [x] **Dashboard Setup Guide** (`docs/DASHBOARD_SETUP_GUIDE.md`)
  - Collection setup instructions
  - Category setup with images
  - Page creation guide
  - Menu configuration
  - Quick setup checklist

---

## ✅ COMPLETED - Foundation

### Store Configuration System

- [x] **Core Configuration Schema** (`storefront/src/config/store.config.ts`)

  - Store information (name, type, contact)
  - Branding (colors, fonts, logos)
  - Feature toggles (wishlist, reviews, etc.)
  - E-commerce settings (shipping, tax, checkout)
  - Homepage sections configuration
  - Page toggles
  - Integrations (analytics, marketing, support)
  - SEO configuration
  - Localization settings

- [x] **Store Type Presets**

  - `physical` - Standard retail
  - `digital` - Downloadable products
  - `food` - Food & grocery delivery
  - `services` - Service-based businesses
  - `mixed` - Combination stores

- [x] **Example Configurations**
  - Sports Store (`examples/sports-store.config.ts`)
  - Digital Store (`examples/digital-store.config.ts`)
  - Food Store (`examples/food-store.config.ts`)
  - Electronics Store (`examples/electronics-store.config.ts`)

### Theme System

- [x] **CSS Variables Integration**

  - All colors configurable
  - Typography configurable
  - Border radius configurable
  - Dark mode support ready

- [x] **Tailwind Integration**

  - Custom color tokens (`store-primary`, `store-secondary`, etc.)
  - Custom font families
  - Custom border radius

- [x] **React Infrastructure**
  - `StoreConfigProvider` - Context provider
  - `useStoreConfig()` - Main hook
  - `useFeature()` - Feature flag hook
  - `useBranding()` - Branding hook
  - `FeatureGate` - Conditional rendering component

---

## 🔵 NEXT STEPS - Priority Order

### Phase 1: Modular Components (Week 1)

#### 1. Homepage Sections (Day 1-2)

Create modular, configurable homepage sections:

```
storefront/src/components/home/
├── HeroSection/
│   ├── HeroImage.tsx      # Static image hero
│   ├── HeroVideo.tsx      # Video background hero
│   ├── HeroSlider.tsx     # Image carousel
│   └── index.tsx          # Smart component that uses config
├── FeaturedCategories.tsx
├── NewArrivals.tsx
├── BestSellers.tsx
├── OnSale.tsx
├── FeaturedBrands.tsx
├── Testimonials.tsx
├── NewsletterSignup.tsx
└── InstagramFeed.tsx
```

Each section should:

- Use `useHomepageConfig()` to check if enabled
- Accept `limit` prop from config
- Be fully styled with store theme variables

#### 2. Feature-Gated Components (Day 2-3)

```
storefront/src/components/features/
├── Wishlist/
│   ├── WishlistButton.tsx
│   ├── WishlistPage.tsx
│   └── WishlistContext.tsx
├── Compare/
│   ├── CompareButton.tsx
│   └── ComparePage.tsx
├── Reviews/
│   ├── ReviewList.tsx
│   ├── ReviewForm.tsx
│   └── StarRating.tsx
└── RecentlyViewed/
    └── RecentlyViewed.tsx
```

#### 3. Navigation & Footer (Day 3-4)

```
storefront/src/components/layout/
├── Header/
│   ├── Logo.tsx           # Uses config.branding.logo
│   ├── Navigation.tsx     # Dynamic menu
│   ├── SearchBar.tsx
│   ├── CartIcon.tsx
│   └── UserMenu.tsx
├── Footer/
│   ├── FooterLinks.tsx    # Dynamic based on pages config
│   ├── SocialLinks.tsx    # Uses config.integrations.social
│   ├── Newsletter.tsx     # Conditional on config
│   └── ContactInfo.tsx    # Uses config.store
└── MobileMenu.tsx
```

### Phase 2: Static Pages (Week 2)

#### 4. Essential Pages

Create template pages that can be customized:

```
storefront/src/app/[channel]/(main)/
├── about/page.tsx         # Conditional on config.pages.aboutUs
├── contact/page.tsx       # Conditional on config.pages.contact
├── faq/page.tsx           # Conditional on config.pages.faq
├── privacy/page.tsx       # Conditional on config.pages.privacyPolicy
├── terms/page.tsx         # Conditional on config.pages.termsOfService
├── shipping/page.tsx      # Conditional on config.pages.shippingPolicy
└── returns/page.tsx       # Conditional on config.pages.returnPolicy
```

#### 5. Content Management

Create a simple content system:

```typescript
// storefront/src/config/content/
├── pages/
│   ├── about.mdx          # Markdown with frontmatter
│   ├── faq.yaml           # FAQ Q&A format
│   └── contact.yaml       # Contact form config
└── content.config.ts      # Content schema
```

### Phase 3: Store Type Specifics (Week 3)

#### 6. Digital Products Support

```typescript
// Features for digital stores
interface DigitalProductFeatures {
  downloadLink: boolean;
  licenseKey: boolean;
  downloadLimit: number;
  accessExpiry: Date | null;
}
```

- [ ] Download delivery page
- [ ] License key display
- [ ] My Downloads account section
- [ ] No-shipping checkout flow

#### 7. Food Delivery Features

```typescript
// Features for food stores
interface FoodDeliveryFeatures {
  deliverySlots: boolean;
  minimumOrder: number;
  deliveryZones: Zone[];
  scheduledOrders: boolean;
}
```

- [ ] Delivery slot picker
- [ ] Minimum order enforcement
- [ ] Delivery zone checker
- [ ] Scheduled order support

#### 8. Service Booking Features

```typescript
// Features for service stores
interface ServiceFeatures {
  calendar: boolean;
  staffSelection: boolean;
  duration: number;
  cancellationPolicy: string;
}
```

- [ ] Booking calendar
- [ ] Time slot selection
- [ ] Staff/provider selection
- [ ] Booking confirmation

### Phase 4: Initialization & Deployment (Week 4)

#### 9. Store Initialization Script

```bash
# Command to create new store from template
npx create-saleor-store my-new-store

# Interactive prompts:
# - Store name?
# - Store type? (physical/digital/food/services/mixed)
# - Primary color?
# - Features to enable?
```

#### 10. Sample Data Seeders

```
infra/scripts/seed/
├── seed-sports-store.ps1
├── seed-digital-store.ps1
├── seed-food-store.ps1
├── seed-electronics-store.ps1
└── seed-base.ps1          # Common data
```

Each seeder creates:

- Sample products (10-20)
- Categories
- Collections
- Sample pages
- Test orders

---

## 📊 Feature Matrix by Store Type

| Feature        | Physical | Digital | Food | Services |
| -------------- | -------- | ------- | ---- | -------- |
| Shipping       | ✅       | ❌      | ✅   | ❌       |
| Downloads      | ❌       | ✅      | ❌   | ❌       |
| Wishlist       | ✅       | ✅      | ❌   | ❌       |
| Compare        | ✅       | ✅      | ❌   | ❌       |
| Reviews        | ✅       | ✅      | ✅   | ✅       |
| Subscriptions  | ❌       | ✅      | ✅   | ✅       |
| Delivery Slots | ❌       | ❌      | ✅   | ✅       |
| Min Order      | ❌       | ❌      | ✅   | ❌       |
| Booking        | ❌       | ❌      | ❌   | ✅       |
| Gift Cards     | ✅       | ✅      | ✅   | ✅       |
| Bundles        | ✅       | ✅      | ✅   | ✅       |

---

## 🎯 Implementation Priority

### Must Have (MVP)

1. ✅ Store Configuration System
2. ✅ Theme CSS Variables
3. ✅ React Hooks & Providers
4. 🔵 Modular Homepage Sections
5. 🔵 Header with Logo/Branding
6. 🔵 Footer with Social/Contact
7. 🔵 Feature-gated Wishlist
8. 🔵 Essential Static Pages

### Should Have (v1.0)

9. 🔵 Product Compare
10. 🔵 Product Reviews
11. 🔵 Recently Viewed
12. 🔵 Store Init Script
13. 🔵 Sample Data Seeders

### Nice to Have (v1.1+)

14. ⚪ Digital Downloads
15. ⚪ Delivery Slots
16. ⚪ Service Booking
17. ⚪ Multi-language
18. ⚪ PWA Features

---

## 🗂️ Current File Structure

```
storefront/src/
├── config/
│   ├── store.config.ts          # ✅ Main config schema
│   ├── index.ts                 # ✅ Active config export
│   ├── README.md                # ✅ Documentation
│   └── examples/
│       ├── index.ts             # ✅ Export examples
│       ├── sports-store.config.ts
│       ├── digital-store.config.ts
│       ├── food-store.config.ts
│       └── electronics-store.config.ts
├── providers/
│   └── StoreConfigProvider.tsx  # ✅ React context
├── app/
│   ├── globals.css              # ✅ Theme CSS variables
│   └── layout.tsx               # ✅ Uses StoreConfigProvider
└── components/
    ├── home/                    # 🔵 TODO
    ├── features/                # 🔵 TODO
    └── layout/                  # 🔵 TODO
```

---

## 🚀 Quick Start for New Clients

### 1. Clone Template

```bash
git clone https://github.com/your-org/saleor-platform new-client
cd new-client
```

### 2. Create Store Config

```bash
cd storefront/src/config
cp examples/[closest-match].config.ts stores/new-client.config.ts
```

### 3. Update Config

Edit `stores/new-client.config.ts`:

- Change store name and contact
- Set brand colors
- Toggle features
- Add integration keys

### 4. Set Active Config

```typescript
// config/index.ts
import { newClientConfig } from "./stores/new-client.config";
export const storeConfig = newClientConfig;
```

### 5. Update Branding

- Replace `/public/logo.svg`
- Replace `/public/favicon.ico`
- Update OG images

### 6. Deploy

```bash
docker-compose -f infra/docker-compose.prod.yml up -d
```

---

## ⏱️ Estimated Timeline

| Phase      | Duration | Deliverable                          |
| ---------- | -------- | ------------------------------------ |
| Foundation | ✅ Done  | Config system, theme, hooks          |
| Phase 1    | 3-4 days | Modular homepage, feature components |
| Phase 2    | 2-3 days | Static pages, content system         |
| Phase 3    | 3-4 days | Store type specific features         |
| Phase 4    | 2-3 days | Init script, seeders                 |

**Total: ~2 weeks to full universal template**

---

_Created: December 17, 2025_
_Status: Phase 1 - Foundation Complete_
