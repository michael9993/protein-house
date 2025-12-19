# CMS Integration Changes Summary

This document summarizes the changes made to fully integrate the storefront with Saleor Dashboard CMS.

## New GraphQL Queries

### 1. `CategoriesForHomepage.graphql`
Fetches top-level categories for the homepage "Shop by Category" section.

**Dashboard Location**: `Catalog → Categories`

```graphql
query CategoriesForHomepage($channel: String!, $first: Int = 8) {
  categories(first: $first, level: 0) {
    edges {
      node {
        id
        name
        slug
        description
        backgroundImage { url alt }
        products(channel: $channel, first: 1) { totalCount }
        metadata { key value }
      }
    }
  }
}
```

### 2. `CollectionWithMetadata.graphql`
Fetches collection data including metadata for CMS-controlled content.

**Dashboard Location**: `Catalog → Collections`

### 3. `ShopInfo.graphql`
Fetches shop settings and configuration.

**Dashboard Location**: `Configuration → Site Settings`

---

## Updated CMS Library (`src/lib/cms.ts`)

### New Collection Slugs for CMS Content

```typescript
export const cmsCollections = {
  heroBanner: "hero-banner",
  testimonials: "testimonials",
  brands: "brands",
};
```

### New Helper Functions

| Function | Purpose | Dashboard Source |
|----------|---------|------------------|
| `getMetadataValue()` | Extract single metadata value | Any entity metadata |
| `parseMetadataJson()` | Parse JSON from metadata | Any entity metadata |
| `getHeroBannerConfig()` | Hero banner settings | "hero-banner" collection |
| `getTestimonials()` | Customer testimonials | "testimonials" collection |
| `getFeaturedBrands()` | Brand logos | "brands" collection |
| `getFAQContent()` | FAQ Q&A pairs | "faq" page |
| `getAboutPageContent()` | About page content | "about" page |

---

## Homepage Changes (`src/app/[channel]/(main)/page.tsx`)

### Before
- Categories: Hardcoded placeholder data
- Hero: Config-only
- Testimonials: Hardcoded
- Brands: Hardcoded

### After
- Categories: Fetched from `Dashboard → Catalog → Categories`
- Hero: Configurable via "hero-banner" collection metadata
- Testimonials: Configurable via "testimonials" collection metadata
- Brands: Configurable via "brands" collection metadata

### Data Fetching

```typescript
const [
  // Product collections (existing)
  featuredData,
  newArrivalsData,
  bestSellersData,
  saleData,
  allProductsData,
  // NEW: Categories from Dashboard
  categoriesData,
  // NEW: CMS-controlled content
  heroBannerConfig,
  testimonialsData,
  brandsData,
] = await Promise.all([...]);
```

---

## Component Updates

### HeroSection
- Now accepts `cmsConfig` prop from "hero-banner" collection metadata
- Dashboard can control: title, subtitle, CTA text, CTA link, video URL, background image

### Testimonials
- Now accepts `cmsTestimonials` prop from "testimonials" collection metadata
- Falls back to default testimonials if none in CMS

### FeaturedBrands
- Now accepts `cmsBrands` prop from "brands" collection metadata
- Falls back to default brands if none in CMS

### FeaturedCategories
- Now receives real category data from Dashboard
- Displays background images set in Dashboard
- Shows actual product counts

---

## Dashboard Setup Guide

### 1. Categories (Homepage "Shop by Category")

**Location**: `Dashboard → Catalog → Categories`

1. Create top-level categories
2. Set name, slug, description
3. **Upload background image** (required for homepage display)
4. Categories appear automatically on homepage

### 2. Hero Banner Configuration

**Location**: `Dashboard → Catalog → Collections`

1. Create collection with slug: `hero-banner`
2. Add metadata keys:
   - `hero_title` - Main heading
   - `hero_subtitle` - Subheading
   - `hero_cta_text` - Button text
   - `hero_cta_link` - Button URL
   - `hero_video_url` - Video URL (optional, enables video hero)
3. Set collection background image (used as hero background)

### 3. Testimonials

**Location**: `Dashboard → Catalog → Collections`

1. Create collection with slug: `testimonials`
2. Add metadata key `testimonials_json` with JSON:
   ```json
   [
     {
       "id": "1",
       "name": "John Doe",
       "role": "Customer",
       "quote": "Amazing service and products!",
       "rating": 5,
       "image": "/testimonials/john.jpg"
     }
   ]
   ```

### 4. Featured Brands

**Location**: `Dashboard → Catalog → Collections`

1. Create collection with slug: `brands`
2. Add metadata key `brands_json` with JSON:
   ```json
   [
     {
       "id": "1",
       "name": "Nike",
       "logo": "/brands/nike.svg",
       "url": "/collections/nike"
     }
   ]
   ```

---

## Complete CMS Control Matrix

| Storefront Section | Dashboard Location | How to Edit |
|--------------------|-------------------|-------------|
| Navigation Menu | Content → Navigation | Edit "navbar" menu |
| Footer Links | Content → Navigation | Edit "footer" menu |
| Homepage Featured Products | Catalog → Collections | Edit "featured-products" collection |
| Homepage New Arrivals | Catalog → Collections | Edit "new-arrivals" collection |
| Homepage Best Sellers | Catalog → Collections | Edit "best-sellers" collection |
| Homepage Sale Items | Catalog → Collections | Edit "sale" collection |
| Homepage Categories | Catalog → Categories | Create/edit top-level categories |
| Hero Banner | Catalog → Collections | Edit "hero-banner" metadata |
| Testimonials | Catalog → Collections | Edit "testimonials" metadata |
| Featured Brands | Catalog → Collections | Edit "brands" metadata |
| About Page | Content → Pages | Edit "about" page |
| Contact Page | Content → Pages | Edit "contact" page |
| FAQ Page | Content → Pages | Edit "faq" page |
| Privacy Policy | Content → Pages | Edit "privacy-policy" page |
| Terms of Service | Content → Pages | Edit "terms-of-service" page |

---

## Fallback Behavior

If CMS content is not configured:

| Content | Fallback |
|---------|----------|
| Categories | Placeholder categories |
| Hero | Store config defaults |
| Testimonials | Default testimonials |
| Brands | Default brand list |
| Product Collections | General product list |

---

## Testing Checklist

- [ ] Create "hero-banner" collection with metadata → Hero content changes
- [ ] Add background image to collection → Hero background changes
- [ ] Create categories with images → Homepage shows real categories
- [ ] Add "testimonials" collection with JSON → Testimonials update
- [ ] Add "brands" collection with JSON → Brands section updates
- [ ] Edit "navbar" menu → Navigation updates
- [ ] Create/edit CMS pages → Static pages update

---

*Last updated: December 2024*

