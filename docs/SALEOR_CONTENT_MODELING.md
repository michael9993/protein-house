# Saleor Content Modeling Guide

A comprehensive guide to managing your storefront content through the Saleor Dashboard.

## Table of Contents

1. [Overview](#overview)
2. [Collections - Homepage Sections](#1-collections---homepage-sections)
3. [Navigation Menus](#2-navigation-menus)
4. [CMS Pages](#3-cms-pages)
5. [Categories](#4-categories)
6. [Product Attributes](#5-product-attributes)
7. [Product Types](#6-product-types)
8. [Metadata](#7-metadata)
9. [Channels](#8-channels)
10. [Practical Examples](#practical-examples)
11. [GraphQL Queries Reference](#graphql-queries-reference)
12. [Best Practices](#best-practices)

---

## Overview

Saleor provides a headless CMS approach where all content is managed through the Dashboard and consumed by the storefront via GraphQL. This separation allows:

- **Non-technical users** to manage content without code changes
- **Developers** to focus on presentation and UX
- **Multi-channel** content management from a single source

### Content Modeling Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SALEOR DASHBOARD                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Catalog    │  │   Content   │  │   Config    │         │
│  ├─────────────┤  ├─────────────┤  ├─────────────┤         │
│  │ • Products  │  │ • Pages     │  │ • Channels  │         │
│  │ • Categories│  │ • Menus     │  │ • Attributes│         │
│  │ • Collections│ │ • Translations│ │ • Warehouses│        │
│  │ • Variants  │  │             │  │ • Shipping  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼ GraphQL API
┌─────────────────────────────────────────────────────────────┐
│                     STOREFRONT                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Homepage   │  │  Navigation │  │  Products   │         │
│  │  (Collections)│ │  (Menus)    │  │  (Catalog)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Static     │  │  Filters    │  │  Search     │         │
│  │  Pages (CMS)│  │  (Attributes)│  │  (Products) │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Quick Reference: Dashboard to Storefront Mapping

| Dashboard Location | Storefront Feature | GraphQL Query |
|-------------------|-------------------|---------------|
| Catalog → Products | Product listing/details | `ProductList`, `ProductDetails` |
| Catalog → Categories | Category pages, filters | `CategoriesForFilter` |
| Catalog → Collections | Homepage sections | `ProductListByCollection` |
| Content → Pages | Static pages (About, FAQ) | `PageGetBySlug` |
| Content → Navigation | Header/footer menus | `MenuGetBySlug` |
| Configuration → Attributes | Product filters | `ProductFilterInput` |

---

## 1. Collections - Homepage Sections

Collections are the primary way to curate product groups for the storefront homepage.

### Dashboard Location
`Dashboard → Catalog → Collections`

### Required Collections for Homepage

Create these collections with **exact slugs** to populate homepage sections:

| Collection Name | Slug | Purpose | Homepage Section |
|-----------------|------|---------|------------------|
| Featured Products | `featured-products` | Hero/banner products | Main featured area |
| New Arrivals | `new-arrivals` | Recently added products | "New Arrivals" section |
| Best Sellers | `best-sellers` | Popular products | "Best Sellers" section |
| On Sale | `sale` | Discounted products | "Sale" section |

### Creating a Collection

1. Go to `Dashboard → Catalog → Collections`
2. Click **"Create Collection"**
3. Fill in:
   - **Name**: Display name (e.g., "Featured Products")
   - **Slug**: URL identifier (e.g., `featured-products`) ⚠️ Must match exactly
   - **Description**: Optional rich text description
   - **Background Image**: Banner image for collection page
   - **SEO Title/Description**: Meta tags for SEO

4. **Add Products**:
   - Click "Assign Products"
   - Select products to include
   - Drag to reorder (first products appear first)

### Collection Settings

```
Collection: Featured Products
├── Visibility: Published ✓
├── Available in channels: default-channel ✓
├── Products: 8-12 recommended for homepage
└── Background Image: 1920x600px recommended
```

### How Storefront Uses Collections

```typescript
// storefront/src/app/[channel]/(main)/page.tsx

// Fetch featured products collection
const featuredData = await executeGraphQL(ProductListByCollectionDocument, {
  variables: { slug: "featured-products", channel },
  revalidate: 60, // Cache for 60 seconds
});

// Extract products
const featuredProducts = featuredData.collection?.products?.edges?.map(
  ({ node }) => node
) || [];
```

### Collection Best Practices

- ✅ Use 8-12 products per homepage section
- ✅ Regularly update "New Arrivals" collection
- ✅ Include high-quality product images
- ✅ Set proper SEO metadata for collection pages
- ❌ Don't create too many homepage collections (performance)
- ❌ Don't leave collections empty

---

## 2. Navigation Menus

Control storefront navigation entirely from the Dashboard.

### Dashboard Location
`Dashboard → Content → Navigation`

### Required Menus

| Menu Name | Slug | Purpose |
|-----------|------|---------|
| Main Navigation | `navbar` | Header navigation |
| Footer Menu | `footer` | Footer links |

### Creating the Navbar Menu

1. Go to `Dashboard → Content → Navigation`
2. Click **"Create Menu"**
3. Set:
   - **Name**: "Main Navigation"
   - **Slug**: `navbar` (exact)

4. **Add Menu Items**:

```
navbar (Main Navigation)
├── [Category] Apparel
│   ├── [Category] Men's Clothing
│   └── [Category] Women's Clothing
├── [Category] Accessories
├── [Collection] Sale
├── [Page] About Us
└── [URL] Blog → https://blog.yoursite.com
```

### Menu Item Types

| Type | Links To | Use Case |
|------|----------|----------|
| **Category** | `/categories/{slug}` | Product categories |
| **Collection** | `/collections/{slug}` | Curated product groups |
| **Page** | `/{slug}` | CMS pages (About, Contact) |
| **URL** | Custom URL | External links, custom routes |

### How Storefront Uses Menus

```typescript
// storefront/src/ui/components/nav/components/NavLinks.tsx

export const NavLinks = async ({ channel }: { channel: string }) => {
  // Fetch menu from Dashboard
  const navLinks = await executeGraphQL(MenuGetBySlugDocument, {
    variables: { slug: "navbar", channel },
    revalidate: 60 * 60 * 24, // Cache for 24 hours
  });

  return (
    <>
      {navLinks.menu?.items?.map((item) => {
        // Category link
        if (item.category) {
          return (
            <NavLink href={`/categories/${item.category.slug}`}>
              {item.category.name}
            </NavLink>
          );
        }
        // Collection link
        if (item.collection) {
          return (
            <NavLink href={`/collections/${item.collection.slug}`}>
              {item.collection.name}
            </NavLink>
          );
        }
        // CMS Page link
        if (item.page) {
          return (
            <NavLink href={`/${item.page.slug}`}>
              {item.page.title}
            </NavLink>
          );
        }
        // Custom URL
        if (item.url) {
          return <NavLink href={item.url}>{item.name}</NavLink>;
        }
        return null;
      })}
    </>
  );
};
```

### Menu GraphQL Query

```graphql
# storefront/src/graphql/MenuGetBySlug.graphql

fragment MenuItem on MenuItem {
  id
  name
  level
  category {
    id
    slug
    name
  }
  collection {
    id
    name
    slug
  }
  page {
    id
    title
    slug
  }
  url
}

query MenuGetBySlug($slug: String!, $channel: String!) {
  menu(slug: $slug, channel: $channel) {
    items {
      ...MenuItem
      children {
        ...MenuItem
      }
    }
  }
}
```

---

## 3. CMS Pages

Create and manage static content pages from the Dashboard.

### Dashboard Location
`Dashboard → Content → Pages`

### Recommended Pages

| Page Title | Slug | Route | Purpose |
|------------|------|-------|---------|
| About Us | `about` | `/about` | Company information |
| Contact | `contact` | `/contact` | Contact form/info |
| FAQ | `faq` | `/faq` | Frequently asked questions |
| Terms of Service | `terms` | `/terms` | Legal terms |
| Privacy Policy | `privacy` | `/privacy` | Privacy information |
| Shipping Info | `shipping` | `/shipping` | Shipping details |
| Returns Policy | `returns` | `/returns` | Return information |

### Creating a CMS Page

1. Go to `Dashboard → Content → Pages`
2. Click **"Create Page"**
3. Fill in:
   - **Title**: Page title
   - **Slug**: URL identifier
   - **Content**: Rich text editor (Editor.js format)
   - **SEO Title**: Meta title
   - **SEO Description**: Meta description
   - **Published**: Toggle to make visible

### Rich Text Editor Features

The Dashboard uses **Editor.js** which supports:

- **Headings** (H1-H6)
- **Paragraphs** with formatting
- **Bulleted/Numbered Lists**
- **Images** with captions
- **Quotes/Blockquotes**
- **Code blocks**
- **Tables**
- **Embedded content**

### Fetching CMS Content in Storefront

```typescript
// storefront/src/lib/cms.ts

import { executeGraphQL } from "@/lib/graphql";
import { PageGetBySlugDocument } from "@/gql/graphql";
import edjsHTML from "editorjs-html";
import xss from "xss";

const parser = edjsHTML();

export async function getCMSPage(slug: string) {
  const { page } = await executeGraphQL(PageGetBySlugDocument, {
    variables: { slug },
    revalidate: 60, // Cache for 1 minute
  });

  if (!page?.content) return null;

  try {
    const contentBlocks = JSON.parse(page.content);
    const htmlBlocks = parser.parse(contentBlocks);
    const sanitizedHtml = htmlBlocks.map((block: string) => xss(block)).join("");

    return {
      title: page.title,
      content: sanitizedHtml,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
    };
  } catch (error) {
    console.error("Failed to parse CMS content:", error);
    return null;
  }
}
```

### Using CMS Content in Pages

```typescript
// storefront/src/app/[channel]/(main)/about/page.tsx

import { getCMSPage } from "@/lib/cms";
import { AboutPage } from "./AboutPage";

export default async function Page() {
  // Fetch about page content from Dashboard
  const cmsPage = await getCMSPage("about");
  
  return <AboutPage cmsContent={cmsPage} />;
}
```

```tsx
// storefront/src/app/[channel]/(main)/about/AboutPage.tsx

interface CMSContent {
  title: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
}

export function AboutPage({ cmsContent }: { cmsContent: CMSContent | null }) {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">
        {cmsContent?.title || "About Us"}
      </h1>
      
      {cmsContent?.content ? (
        // Render CMS content
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: cmsContent.content }}
        />
      ) : (
        // Fallback content
        <div className="prose">
          <p>Welcome to our store. Content coming soon...</p>
        </div>
      )}
    </div>
  );
}
```

---

## 4. Categories

Organize products hierarchically for navigation and filtering.

### Dashboard Location
`Dashboard → Catalog → Categories`

### Category Hierarchy Example

```
├── Apparel
│   ├── Men's
│   │   ├── Shirts
│   │   ├── Pants
│   │   └── Jackets
│   └── Women's
│       ├── Dresses
│       ├── Tops
│       └── Skirts
├── Footwear
│   ├── Running Shoes
│   ├── Casual Shoes
│   └── Sandals
├── Accessories
│   ├── Bags
│   ├── Watches
│   └── Jewelry
└── Sports Equipment
    ├── Fitness
    ├── Outdoor
    └── Team Sports
```

### Creating Categories

1. Go to `Dashboard → Catalog → Categories`
2. Click **"Create Category"**
3. Fill in:
   - **Name**: Display name
   - **Slug**: URL-friendly identifier
   - **Description**: Rich text description
   - **Parent Category**: For nested categories
   - **Background Image**: Category banner (1920x400px recommended)
   - **SEO Title/Description**: Meta tags

### Category Properties

| Property | Description | Best Practice |
|----------|-------------|---------------|
| Name | Display name | Clear, concise (e.g., "Men's Shirts") |
| Slug | URL identifier | lowercase-with-hyphens |
| Description | Category details | 2-3 sentences for SEO |
| Parent | Hierarchy level | Max 3 levels deep |
| Background Image | Banner for category page | High-quality, on-brand |

### Fetching Categories

```typescript
// Fetch all categories for filters
const { categories } = await executeGraphQL(CategoriesForFilterDocument, {
  variables: { channel },
});

// Fetch category with products
const { category } = await executeGraphQL(ProductListByCategoryDocument, {
  variables: { slug: "mens-shirts", channel },
});
```

### Category Page URL Structure

```
/categories/{slug}
/categories/apparel
/categories/mens-shirts
```

---

## 5. Product Attributes

Define custom product characteristics for variants and filtering.

### Dashboard Location
`Dashboard → Configuration → Attributes`

### Common Attributes

| Attribute | Type | Values | Use Case |
|-----------|------|--------|----------|
| Size | Dropdown | XS, S, M, L, XL, XXL | Clothing sizes |
| Color | Swatch | Red, Blue, Green... | Color variants |
| Material | Dropdown | Cotton, Polyester... | Product material |
| Brand | Dropdown | Nike, Adidas... | Brand filtering |
| Pattern | Dropdown | Solid, Striped... | Design pattern |

### Creating an Attribute

1. Go to `Dashboard → Configuration → Attributes`
2. Click **"Create Attribute"**
3. Configure:

```
Attribute: Size
├── Name: Size
├── Slug: size
├── Type: Product Attribute
├── Input Type: Dropdown
├── Values:
│   ├── XS (slug: xs)
│   ├── S (slug: s)
│   ├── M (slug: m)
│   ├── L (slug: l)
│   ├── XL (slug: xl)
│   └── XXL (slug: xxl)
├── Settings:
│   ├── Variant Selection: ✓ (used to create variants)
│   ├── Filterable in Storefront: ✓
│   └── Filterable in Dashboard: ✓
```

### Attribute Input Types

| Input Type | Description | Use Case |
|------------|-------------|----------|
| Dropdown | Single selection | Size, Brand |
| Multiselect | Multiple selections | Features, Tags |
| Swatch | Color/pattern picker | Colors |
| Boolean | True/False | Is Featured, Has Gift Wrap |
| Rich Text | Formatted text | Detailed descriptions |
| Plain Text | Simple text | Serial numbers |
| Numeric | Numbers | Weight, Dimensions |
| Date | Date picker | Release date |
| Reference | Link to other entities | Related products |
| File | File upload | Manuals, certificates |

### Using Attributes for Filtering

```graphql
query ProductsWithFilter($filter: ProductFilterInput) {
  products(filter: $filter, first: 24) {
    edges {
      node {
        name
        attributes {
          attribute {
            name
            slug
          }
          values {
            name
            slug
          }
        }
      }
    }
  }
}

# Variables
{
  "filter": {
    "attributes": [
      {
        "slug": "size",
        "values": ["m", "l"]
      },
      {
        "slug": "color", 
        "values": ["blue"]
      }
    ]
  }
}
```

---

## 6. Product Types

Define templates for different kinds of products.

### Dashboard Location
`Dashboard → Configuration → Product Types`

### Example Product Types

| Product Type | Attributes | Variants | Use Case |
|--------------|------------|----------|----------|
| Apparel | Size, Color, Material | By Size+Color | Clothing |
| Shoes | Size, Color, Width | By Size+Color | Footwear |
| Electronics | Storage, Color | By Storage | Phones, Laptops |
| Books | Format | By Format | Physical/Digital |
| Digital Product | License Type | None | Software, Downloads |
| Gift Card | - | By Amount | Gift cards |

### Creating a Product Type

1. Go to `Dashboard → Configuration → Product Types`
2. Click **"Create Product Type"**
3. Configure:

```
Product Type: Apparel
├── Name: Apparel
├── Shipping Required: ✓
├── Is Digital Product: ✗
├── Product Attributes:
│   ├── Material (defines product)
│   ├── Brand (defines product)
│   └── Care Instructions (defines product)
├── Variant Attributes:
│   ├── Size (creates variants)
│   └── Color (creates variants)
└── Tax Class: Standard Rate
```

### Product Type Settings

| Setting | Description |
|---------|-------------|
| **Shipping Required** | Physical product that needs shipping |
| **Is Digital** | Downloadable product |
| **Product Attributes** | Attributes that describe the product |
| **Variant Attributes** | Attributes that create different variants |
| **Tax Class** | Tax rate category |
| **Weight** | Default weight for shipping |

---

## 7. Metadata

Store custom data on any Saleor entity.

### What Supports Metadata

- Products
- Variants
- Categories
- Collections
- Orders
- Customers
- Checkouts

### Metadata Types

| Type | Visibility | Use Case |
|------|------------|----------|
| **Public Metadata** | Visible via API | Display badges, custom labels |
| **Private Metadata** | Admin only | Internal notes, sync IDs |

### Adding Metadata in Dashboard

1. Open any entity (Product, Category, etc.)
2. Scroll to "Metadata" section
3. Click "Add Field"
4. Enter Key-Value pair

### Common Metadata Use Cases

```json
// Product badge
{
  "badge": "New",
  "badge_color": "#FF5722"
}

// Featured product flag
{
  "is_featured": "true",
  "featured_order": "1"
}

// Third-party integration
{
  "external_id": "12345",
  "sync_status": "synced"
}

// Custom display options
{
  "video_url": "https://youtube.com/...",
  "size_guide_url": "/size-guide-shirts"
}
```

### Accessing Metadata in Storefront

```graphql
query ProductWithMetadata($id: ID!) {
  product(id: $id) {
    name
    metadata {
      key
      value
    }
  }
}
```

```typescript
// Helper to get metadata value
function getMetadataValue(metadata: Array<{key: string, value: string}>, key: string) {
  return metadata.find(m => m.key === key)?.value;
}

// Usage
const badge = getMetadataValue(product.metadata, "badge");
const badgeColor = getMetadataValue(product.metadata, "badge_color");

{badge && (
  <span style={{ backgroundColor: badgeColor }}>
    {badge}
  </span>
)}
```

---

## 8. Channels

Manage multiple storefronts, regions, or brands.

### Dashboard Location
`Dashboard → Configuration → Channels`

### Channel Use Cases

| Scenario | Channels |
|----------|----------|
| Multi-region | `us-store`, `eu-store`, `uk-store` |
| Multi-brand | `brand-a`, `brand-b` |
| B2B + B2C | `retail`, `wholesale` |
| Multi-currency | `usd-channel`, `eur-channel` |

### Channel Configuration

```
Channel: US Store
├── Name: US Store
├── Slug: us-store
├── Currency: USD
├── Default Country: US
├── Shipping Zones: US Domestic, International
├── Warehouses: US East, US West
└── Available Products: All (or selected)
```

### Channel-Specific Content

Each channel can have:
- Different product availability
- Different pricing
- Different shipping zones
- Different tax settings
- Different menus
- Different translations

### URL Structure with Channels

```
/{channel}/                    → Homepage
/{channel}/products            → Product listing
/{channel}/products/{slug}     → Product detail
/{channel}/categories/{slug}   → Category page
/{channel}/cart                → Shopping cart
```

---

## Practical Examples

### Example 1: Creating a Homepage Banner System

**Dashboard Setup:**

1. Create a collection `homepage-banners`
2. Add metadata to the collection:
```json
{
  "banner_title": "Summer Sale",
  "banner_subtitle": "Up to 50% Off",
  "banner_cta": "Shop Now",
  "banner_link": "/collections/sale",
  "banner_image": "https://..."
}
```

**Storefront Implementation:**

```typescript
async function getHomepageBanner(channel: string) {
  const { collection } = await executeGraphQL(CollectionBySlugDocument, {
    variables: { slug: "homepage-banners", channel },
  });
  
  const metadata = collection?.metadata || [];
  
  return {
    title: getMetadataValue(metadata, "banner_title"),
    subtitle: getMetadataValue(metadata, "banner_subtitle"),
    cta: getMetadataValue(metadata, "banner_cta"),
    link: getMetadataValue(metadata, "banner_link"),
    image: getMetadataValue(metadata, "banner_image") || collection?.backgroundImage?.url,
  };
}
```

### Example 2: Dynamic FAQ from CMS Page

**Dashboard Setup:**

1. Create a page with slug `faq`
2. Use Editor.js to create Q&A format:
   - H2 for questions
   - Paragraph for answers

**Storefront Implementation:**

```typescript
// Parse FAQ from CMS content
function parseFAQContent(content: string) {
  const sections = content.split(/<h2[^>]*>/);
  
  return sections.slice(1).map(section => {
    const [question, ...rest] = section.split('</h2>');
    const answer = rest.join('</h2>').replace(/<\/?p>/g, '').trim();
    return { question: question.trim(), answer };
  });
}
```

### Example 3: Product Badges via Metadata

**Dashboard Setup:**

1. Open a product
2. Add metadata:
```json
{
  "badge": "Best Seller",
  "badge_type": "success"
}
```

**Storefront Implementation:**

```tsx
function ProductCard({ product }) {
  const badge = getMetadataValue(product.metadata, "badge");
  const badgeType = getMetadataValue(product.metadata, "badge_type");
  
  const badgeColors = {
    success: "bg-green-500",
    warning: "bg-yellow-500",
    sale: "bg-red-500",
    new: "bg-blue-500",
  };
  
  return (
    <div className="product-card">
      {badge && (
        <span className={`badge ${badgeColors[badgeType] || 'bg-gray-500'}`}>
          {badge}
        </span>
      )}
      {/* ... rest of card */}
    </div>
  );
}
```

---

## GraphQL Queries Reference

### Products

```graphql
# List products with filtering
query ProductListFiltered(
  $first: Int
  $after: String
  $channel: String!
  $filter: ProductFilterInput
  $sortBy: ProductOrder
) {
  products(
    first: $first
    after: $after
    channel: $channel
    filter: $filter
    sortBy: $sortBy
  ) {
    totalCount
    edges {
      node {
        id
        name
        slug
        thumbnail { url alt }
        pricing {
          priceRange {
            start { gross { amount currency } }
          }
        }
        category { name slug }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Collections

```graphql
# Get collection with products
query ProductListByCollection($slug: String!, $channel: String!) {
  collection(slug: $slug, channel: $channel) {
    id
    name
    slug
    description
    backgroundImage { url alt }
    products(first: 20) {
      edges {
        node {
          id
          name
          slug
          thumbnail { url }
          pricing {
            priceRange {
              start { gross { amount currency } }
            }
          }
        }
      }
    }
  }
}
```

### Pages

```graphql
# Get CMS page by slug
query PageGetBySlug($slug: String!) {
  page(slug: $slug) {
    id
    slug
    title
    content
    seoTitle
    seoDescription
  }
}
```

### Menus

```graphql
# Get navigation menu
query MenuGetBySlug($slug: String!, $channel: String!) {
  menu(slug: $slug, channel: $channel) {
    items {
      id
      name
      category { id slug name }
      collection { id slug name }
      page { id slug title }
      url
      children {
        id
        name
        category { id slug name }
        collection { id slug name }
        page { id slug title }
        url
      }
    }
  }
}
```

### Categories

```graphql
# Get categories for filtering
query CategoriesForFilter($channel: String!) {
  categories(first: 100) {
    edges {
      node {
        id
        name
        slug
        level
        children(first: 50) {
          edges {
            node {
              id
              name
              slug
            }
          }
        }
      }
    }
  }
}
```

---

## Best Practices

### Content Organization

| Do ✅ | Don't ❌ |
|-------|---------|
| Use consistent slugs | Use spaces or special characters in slugs |
| Create hierarchy (max 3 levels) | Create deeply nested categories |
| Add SEO metadata to all content | Leave SEO fields empty |
| Use high-quality images | Use low-resolution images |
| Regularly update collections | Let collections become stale |

### Performance

| Do ✅ | Don't ❌ |
|-------|---------|
| Limit homepage collections to 4-5 | Load 10+ collections on homepage |
| Use pagination for large lists | Fetch all products at once |
| Cache GraphQL responses | Make uncached requests |
| Optimize images before upload | Upload uncompressed images |

### SEO

| Do ✅ | Don't ❌ |
|-------|---------|
| Write unique SEO titles/descriptions | Duplicate content across pages |
| Use descriptive slugs | Use numeric or random slugs |
| Add alt text to images | Leave alt text empty |
| Structure content with headings | Use only paragraphs |

### Workflow

1. **Plan your content structure** before creating categories/collections
2. **Create Product Types first** before adding products
3. **Set up Attributes** for filtering before products
4. **Test navigation** after creating menus
5. **Review on staging** before publishing

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Menu not showing | Wrong slug | Use exactly `navbar` |
| Collections empty | Not published | Check "Published" toggle |
| Products not in channel | Channel not assigned | Add product to channel |
| CMS page 404 | Wrong slug | Check page slug matches route |
| Filters not working | Attribute not filterable | Enable "Filterable in Storefront" |

### Debug Checklist

1. ✓ Is the content published?
2. ✓ Is it assigned to the correct channel?
3. ✓ Is the slug exactly correct (case-sensitive)?
4. ✓ Is the GraphQL query using the right variables?
5. ✓ Is caching preventing updates? (Try hard refresh)

---

## Related Documentation

- [Saleor Dashboard Guide](https://docs.saleor.io/docs/dashboard)
- [GraphQL API Reference](https://docs.saleor.io/docs/api-reference)
- [Storefront Configuration](../storefront/src/config/README.md)
- [Store Initialization Script](../infra/scripts/README.md)

---

*Last updated: December 2024*

