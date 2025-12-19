# 🛒 Store Configuration System

## Overview

This configuration system allows you to create a **universal e-commerce template** that can be customized for ANY type of store without changing the core code.

## Quick Start

### 1. Choose a Store Type Preset

```typescript
import { createStoreConfig } from '@/config/store.config';

// Create config for a physical product store
const myStore = createStoreConfig('physical', {
  store: {
    name: "My Awesome Store",
    tagline: "Your Perfect Shopping Destination",
  },
  branding: {
    colors: {
      primary: "#FF6B00",  // Your brand color
    },
  },
});
```

### 2. Use Example Configurations

We provide ready-to-use examples for common store types:

| Example | File | Best For |
|---------|------|----------|
| Sports Store | `examples/sports-store.config.ts` | Athletic gear, sports equipment, fitness |
| Digital Store | `examples/digital-store.config.ts` | Software, ebooks, courses, downloads |
| Food Store | `examples/food-store.config.ts` | Restaurants, groceries, meal delivery |
| Electronics | `examples/electronics-store.config.ts` | Tech products, gadgets, accessories |

### 3. Create Your Store Config

```bash
# Copy an example and customize
cp examples/sports-store.config.ts active-store.config.ts
```

Then edit `active-store.config.ts` with your client's details.

---

## Store Types

| Type | Description | Shipping | Special Features |
|------|-------------|----------|------------------|
| `physical` | Traditional retail | ✅ Yes | Standard e-commerce |
| `digital` | Downloadable products | ❌ No | Downloads, licenses |
| `food` | Food & grocery | ✅ Yes | Delivery slots, min order |
| `services` | Service businesses | ❌ No | Booking, appointments |
| `mixed` | Combination | ✅ Optional | All features enabled |

---

## Configuration Sections

### 1. Store Information

```typescript
store: {
  name: "Store Name",           // Displayed in header, emails
  tagline: "Your Tagline",      // Used in hero sections
  type: "physical",             // Store type
  description: "...",           // Meta description
  email: "support@store.com",   // Contact email
  phone: "+1 (555) 123-4567",   // Contact phone
  address: { ... },             // Physical address (optional)
}
```

### 2. Branding & Theme

```typescript
branding: {
  logo: "/logo.svg",
  favicon: "/favicon.ico",
  
  colors: {
    primary: "#2563EB",     // Buttons, links
    secondary: "#1F2937",   // Headers, accents
    accent: "#F59E0B",      // Highlights, badges
    background: "#FFFFFF",  // Page background
    surface: "#F9FAFB",     // Card backgrounds
    text: "#111827",        // Primary text
    textMuted: "#6B7280",   // Secondary text
    success: "#059669",
    warning: "#D97706",
    error: "#DC2626",
  },
  
  typography: {
    fontHeading: "Inter",   // Headings
    fontBody: "Inter",      // Body text
    fontMono: "Fira Code",  // Prices, code
  },
  
  style: {
    borderRadius: "md",     // none | sm | md | lg | full
    buttonStyle: "solid",   // solid | outline | ghost
    cardShadow: "sm",       // none | sm | md | lg
  },
}
```

### 3. Feature Toggles

Enable/disable features per store:

```typescript
features: {
  // Customer Features
  wishlist: true,
  compareProducts: true,      // Great for electronics
  productReviews: true,
  recentlyViewed: true,
  
  // Checkout Features
  guestCheckout: true,
  expressCheckout: false,
  savePaymentMethods: true,
  
  // Product Features
  digitalDownloads: false,    // Enable for digital stores
  subscriptions: false,
  giftCards: true,
  productBundles: true,
  
  // Marketing Features
  newsletter: true,
  promotionalBanners: true,
  abandonedCartEmails: false,
  
  // Social Features
  socialLogin: false,
  shareButtons: true,
  instagramFeed: false,
}
```

### 4. E-commerce Settings

```typescript
ecommerce: {
  currency: {
    default: "USD",
    supported: ["USD", "EUR", "GBP"],
  },
  
  shipping: {
    enabled: true,
    freeShippingThreshold: 50,  // null = no free shipping
    showEstimatedDelivery: true,
    deliverySlots: false,       // For food delivery
  },
  
  tax: {
    showPricesWithTax: false,
    taxIncludedInPrice: false,
  },
  
  inventory: {
    showStockLevel: true,
    lowStockThreshold: 5,
    allowBackorders: false,
  },
  
  checkout: {
    minOrderAmount: null,       // For food delivery
    maxOrderAmount: null,
    termsRequired: true,
  },
}
```

### 5. Homepage Sections

Toggle and configure homepage sections:

```typescript
homepage: {
  sections: {
    hero: { enabled: true, type: "slider" },
    featuredCategories: { enabled: true, limit: 6 },
    newArrivals: { enabled: true, limit: 8 },
    bestSellers: { enabled: true, limit: 8 },
    onSale: { enabled: true, limit: 4 },
    featuredBrands: { enabled: false },
    testimonials: { enabled: true },
    newsletter: { enabled: true },
    instagramFeed: { enabled: false, username: null },
  },
}
```

### 6. Pages

Enable/disable optional pages:

```typescript
pages: {
  aboutUs: true,
  contact: true,
  faq: true,
  blog: false,
  privacyPolicy: true,
  termsOfService: true,
  shippingPolicy: true,    // Disable for digital
  returnPolicy: true,
}
```

### 7. Integrations

Configure third-party services:

```typescript
integrations: {
  analytics: {
    googleAnalyticsId: "GA-XXXXXXX",
    googleTagManagerId: "GTM-XXXXXXX",
    facebookPixelId: null,
    hotjarId: null,
  },
  
  marketing: {
    mailchimpListId: null,
    klaviyoApiKey: null,
  },
  
  support: {
    intercomAppId: null,
    zendeskKey: null,
    crispWebsiteId: null,
  },
  
  social: {
    facebook: "https://facebook.com/store",
    instagram: "https://instagram.com/store",
    twitter: null,
    youtube: null,
    tiktok: null,
    pinterest: null,
  },
}
```

### 8. SEO

```typescript
seo: {
  titleTemplate: "%s | Store Name",
  defaultTitle: "Store Name - Online Shopping",
  defaultDescription: "Shop the best products...",
  defaultImage: "/og-image.jpg",
  twitterHandle: "@store",
}
```

---

## Using Configuration in Components

### React Hook

```typescript
// hooks/useStoreConfig.ts
import { useContext } from 'react';
import { StoreConfigContext } from '@/providers/StoreConfigProvider';

export function useStoreConfig() {
  const config = useContext(StoreConfigContext);
  if (!config) {
    throw new Error('useStoreConfig must be used within StoreConfigProvider');
  }
  return config;
}
```

### In Components

```tsx
function Header() {
  const { store, branding } = useStoreConfig();
  
  return (
    <header>
      <img src={branding.logo} alt={branding.logoAlt} />
      <span>{store.name}</span>
    </header>
  );
}
```

### Feature Flags

```tsx
function ProductCard({ product }) {
  const { features } = useStoreConfig();
  
  return (
    <div>
      <h3>{product.name}</h3>
      <p>{product.price}</p>
      
      {features.wishlist && (
        <WishlistButton productId={product.id} />
      )}
      
      {features.compareProducts && (
        <CompareButton productId={product.id} />
      )}
    </div>
  );
}
```

### Conditional Rendering

```tsx
function Homepage() {
  const { homepage } = useStoreConfig();
  
  return (
    <main>
      {homepage.sections.hero.enabled && (
        <HeroSection type={homepage.sections.hero.type} />
      )}
      
      {homepage.sections.newArrivals.enabled && (
        <NewArrivals limit={homepage.sections.newArrivals.limit} />
      )}
      
      {homepage.sections.newsletter.enabled && (
        <NewsletterSignup />
      )}
    </main>
  );
}
```

---

## CSS Variables

The configuration automatically generates CSS variables:

```typescript
import { getThemeCSSVariables } from '@/config/store.config';

const cssVars = getThemeCSSVariables(config);
// Returns:
// {
//   '--store-primary': '#2563EB',
//   '--store-secondary': '#1F2937',
//   '--store-font-heading': 'Inter',
//   ...
// }
```

Use in CSS:

```css
.button-primary {
  background-color: var(--store-primary);
  border-radius: var(--store-radius);
  font-family: var(--store-font-body);
}
```

---

## New Client Setup Workflow

### 1. Create New Store Config

```bash
cd storefront/src/config
cp examples/[closest-example].config.ts stores/[client-name].config.ts
```

### 2. Update Client Details

Edit the new config file with:
- Store name and contact info
- Brand colors and fonts
- Feature toggles
- Integration API keys

### 3. Set Active Config

```typescript
// config/index.ts
import { clientNameConfig } from './stores/client-name.config';
export const activeConfig = clientNameConfig;
```

### 4. Test Everything

```bash
pnpm dev
# Check all pages render correctly
# Verify colors and fonts
# Test enabled features
```

### 5. Deploy

The same codebase works for all clients - only the config changes!

---

## File Structure

```
storefront/src/config/
├── store.config.ts        # Main config type & defaults
├── index.ts               # Active config export
├── README.md              # This file
└── examples/
    ├── index.ts           # Export all examples
    ├── sports-store.config.ts
    ├── digital-store.config.ts
    ├── food-store.config.ts
    └── electronics-store.config.ts
```

---

## Tips

1. **Start with a preset**: Use `createStoreConfig(storeType, overrides)` to get sensible defaults

2. **Only override what's different**: The merge system handles the rest

3. **Test feature toggles**: Make sure disabled features don't break the UI

4. **Document client-specific changes**: Add comments for custom modifications

5. **Keep sensitive data in .env**: API keys should be environment variables, not hardcoded

---

*This configuration system makes it easy to launch new stores in minutes while maintaining a single, updatable codebase!*

