# Adding New CMS Features Guide

Step-by-step guide for adding new Dashboard-controlled content to the storefront.

---

## 🎯 Overview

This guide shows you how to add new CMS features that can be controlled from the Saleor Dashboard. We'll use the **Newsletter Signup** section as an example.

---

## Example: Making Newsletter Signup CMS-Controlled

### Step 1: Create GraphQL Query (if needed)

If you need to fetch new data, create a GraphQL query:

```graphql
# storefront/src/graphql/NewsletterConfig.graphql

query NewsletterConfig($channel: String!) {
  collection(slug: "newsletter-config", channel: $channel) {
    id
    name
    metadata {
      key
      value
    }
  }
}
```

**When to create a new query:**
- Fetching new entity types
- Need specific fields not in existing queries
- Complex filtering requirements

**When to reuse existing queries:**
- Using collections → `ProductListByCollectionDocument`
- Using pages → `PageGetBySlugDocument`
- Using menus → `MenuGetBySlugDocument`

---

### Step 2: Add Helper Function to CMS Library

```typescript
// storefront/src/lib/cms.ts

// Add to cmsCollections constant
export const cmsCollections = {
  heroBanner: "hero-banner",
  testimonials: "testimonials",
  brands: "brands",
  newsletterConfig: "newsletter-config", // NEW
};

// Add interface
export interface NewsletterConfig {
  title: string;
  subtitle: string;
  buttonText: string;
  placeholder?: string;
  successMessage?: string;
  emailListId?: string; // For email service integration
}

// Add helper function
export async function getNewsletterConfig(channel: string): Promise<NewsletterConfig | null> {
  try {
    const data = await executeGraphQL(ProductListByCollectionDocument, {
      variables: { slug: cmsCollections.newsletterConfig, channel },
      revalidate: 60 * 60, // Cache for 1 hour
    });
    
    const collection = data.collection;
    if (!collection) return null;
    
    const metadata = collection.metadata;
    
    return {
      title: getMetadataValue(metadata, "newsletter_title") || "Subscribe to Our Newsletter",
      subtitle: getMetadataValue(metadata, "newsletter_subtitle") || "Get the latest updates",
      buttonText: getMetadataValue(metadata, "newsletter_button_text") || "Subscribe",
      placeholder: getMetadataValue(metadata, "newsletter_placeholder") || "Enter your email",
      successMessage: getMetadataValue(metadata, "newsletter_success") || "Thanks for subscribing!",
      emailListId: getMetadataValue(metadata, "email_list_id") || undefined,
    };
  } catch (error) {
    console.error("Failed to fetch newsletter config:", error);
    return null;
  }
}
```

---

### Step 3: Fetch Data in Page Component

```typescript
// storefront/src/app/[channel]/(main)/page.tsx

import { getNewsletterConfig } from "@/lib/cms";

export default async function Page(props: { params: Promise<{ channel: string }> }) {
  const params = await props.params;
  const { channel } = params;
  
  // Add to Promise.all array
  const [
    // ... existing fetches
    newsletterConfig,
  ] = await Promise.all([
    // ... existing promises
    getNewsletterConfig(channel),
  ]);

  return (
    <HomePage
      // ... existing props
      newsletterConfig={newsletterConfig}
    />
  );
}
```

---

### Step 4: Update Component Props

```typescript
// storefront/src/app/[channel]/(main)/HomePage.tsx

import { type NewsletterConfig } from "@/lib/cms";

interface HomePageProps {
  // ... existing props
  newsletterConfig?: NewsletterConfig | null;
}

export function HomePage({
  // ... existing props
  newsletterConfig,
}: HomePageProps) {
  return (
    <main>
      {/* ... existing sections */}
      
      {/* Newsletter Signup */}
      <NewsletterSignup 
        cmsConfig={newsletterConfig}
      />
    </main>
  );
}
```

---

### Step 5: Update Component to Use CMS Config

```typescript
// storefront/src/components/home/NewsletterSignup.tsx

import { type NewsletterConfig } from "@/lib/cms";

interface NewsletterSignupProps {
  /** CMS config from "newsletter-config" collection */
  cmsConfig?: NewsletterConfig | null;
  // Fallback props (optional, for backwards compatibility)
  title?: string;
  subtitle?: string;
  buttonText?: string;
}

export function NewsletterSignup({
  cmsConfig,
  title: fallbackTitle,
  subtitle: fallbackSubtitle,
  buttonText: fallbackButtonText,
}: NewsletterSignupProps) {
  const { branding } = useStoreConfig();
  
  // Use CMS config if available, otherwise use fallbacks
  const title = cmsConfig?.title || fallbackTitle || "Subscribe to Our Newsletter";
  const subtitle = cmsConfig?.subtitle || fallbackSubtitle || "Get updates";
  const buttonText = cmsConfig?.buttonText || fallbackButtonText || "Subscribe";
  const placeholder = cmsConfig?.placeholder || "Enter your email";
  const successMessage = cmsConfig?.successMessage || "Thanks for subscribing!";

  return (
    <section className="py-16">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-3xl font-bold">{title}</h2>
        <p className="mt-4 text-lg">{subtitle}</p>
        
        <form className="mt-8">
          <input
            type="email"
            placeholder={placeholder}
            className="rounded-lg px-4 py-3"
          />
          <button
            type="submit"
            style={{ backgroundColor: branding.colors.primary }}
          >
            {buttonText}
          </button>
        </form>
      </div>
    </section>
  );
}
```

---

### Step 6: Run GraphQL Codegen

```bash
# Inside Docker container
docker compose -f docker-compose.dev.yml exec saleor-storefront pnpm generate

# Or if you have pnpm locally
cd storefront && pnpm generate
```

---

### Step 7: Test in Dashboard

1. Go to `Dashboard → Catalog → Collections`
2. Create collection:
   - **Name**: "Newsletter Config"
   - **Slug**: `newsletter-config` (exact!)
3. Add metadata:
   ```
   Key: newsletter_title
   Value: Join Our Newsletter
   
   Key: newsletter_subtitle
   Value: Get exclusive deals and updates
   
   Key: newsletter_button_text
   Value: Sign Me Up
   
   Key: newsletter_placeholder
   Value: Your email address
   
   Key: newsletter_success
   Value: Thank you for subscribing!
   ```
4. **Publish** the collection

---

### Step 8: Test in Browser

1. Refresh `http://localhost:3000/default-channel`
2. Scroll to newsletter section
3. **Expected**: Text matches your metadata values

---

## 📋 Pattern Summary

### For Simple Text Content

**Use**: Collection metadata with key-value pairs

```typescript
// 1. Add to cmsCollections
export const cmsCollections = {
  myFeature: "my-feature",
};

// 2. Create helper function
export async function getMyFeatureConfig(channel: string) {
  const data = await executeGraphQL(ProductListByCollectionDocument, {
    variables: { slug: cmsCollections.myFeature, channel },
  });
  
  return {
    title: getMetadataValue(data.collection?.metadata, "title"),
    description: getMetadataValue(data.collection?.metadata, "description"),
  };
}

// 3. Fetch in page
const config = await getMyFeatureConfig(channel);

// 4. Pass to component
<MyComponent cmsConfig={config} />
```

---

### For Structured Data (Arrays, Objects)

**Use**: Collection metadata with JSON

```typescript
// 1. Create interface
export interface MyItem {
  id: string;
  name: string;
  value: string;
}

// 2. Parse JSON from metadata
export async function getMyItems(channel: string): Promise<MyItem[]> {
  const data = await executeGraphQL(ProductListByCollectionDocument, {
    variables: { slug: "my-items", channel },
  });
  
  return parseMetadataJson<MyItem[]>(
    data.collection?.metadata,
    "items_json"
  ) || [];
}

// 3. Dashboard metadata:
// Key: items_json
// Value: [{"id":"1","name":"Item 1","value":"Value 1"}]
```

---

### For Rich Text Content

**Use**: CMS Pages

```typescript
// 1. Fetch page
const page = await getCMSPage("my-page");

// 2. Render content
<div dangerouslySetInnerHTML={{ __html: page.content }} />
```

---

## 🎨 Advanced Example: Product Carousel with CMS Control

### Step 1: Create Interface

```typescript
// storefront/src/lib/cms.ts

export interface ProductCarouselConfig {
  title: string;
  subtitle: string;
  collectionSlug: string; // Which collection to display
  limit: number;
  autoplay: boolean;
  showArrows: boolean;
}
```

### Step 2: Create Helper

```typescript
export async function getProductCarouselConfig(
  channel: string,
  carouselId: string
): Promise<ProductCarouselConfig | null> {
  const data = await executeGraphQL(ProductListByCollectionDocument, {
    variables: { slug: `carousel-${carouselId}`, channel },
  });
  
  const metadata = data.collection?.metadata;
  
  return {
    title: getMetadataValue(metadata, "carousel_title") || "Featured Products",
    subtitle: getMetadataValue(metadata, "carousel_subtitle") || "",
    collectionSlug: getMetadataValue(metadata, "product_collection") || "featured-products",
    limit: parseInt(getMetadataValue(metadata, "limit") || "12"),
    autoplay: getMetadataValue(metadata, "autoplay") === "true",
    showArrows: getMetadataValue(metadata, "show_arrows") !== "false",
  };
}
```

### Step 3: Use in Component

```typescript
// Fetch config
const carouselConfig = await getProductCarouselConfig(channel, "homepage");

// Fetch products from specified collection
const products = await getCollectionProducts(
  carouselConfig?.collectionSlug || "featured-products",
  channel
);

// Render
<ProductCarousel 
  products={products.slice(0, carouselConfig?.limit || 12)}
  title={carouselConfig?.title}
  autoplay={carouselConfig?.autoplay}
  showArrows={carouselConfig?.showArrows}
/>
```

---

## 🔄 Reusable Patterns

### Pattern 1: Simple Text Configuration

```typescript
// For: Titles, subtitles, button text, etc.
getMetadataValue(metadata, "key") || "default"
```

### Pattern 2: Boolean Flags

```typescript
// For: Enable/disable features
getMetadataValue(metadata, "enabled") === "true"
```

### Pattern 3: Number Values

```typescript
// For: Limits, counts, sizes
parseInt(getMetadataValue(metadata, "limit") || "10")
```

### Pattern 4: JSON Arrays

```typescript
// For: Lists of items
parseMetadataJson<Item[]>(metadata, "items_json") || []
```

### Pattern 5: Nested Configuration

```typescript
// For: Complex settings
const config = parseMetadataJson<Config>(metadata, "config_json");
```

---

## ✅ Best Practices

### 1. Always Provide Fallbacks

```typescript
// ✅ Good
const title = cmsConfig?.title || "Default Title";

// ❌ Bad
const title = cmsConfig.title; // Can crash if null
```

### 2. Cache Appropriately

```typescript
// Static content: Cache longer
revalidate: 60 * 60 * 24 // 24 hours

// Dynamic content: Cache shorter
revalidate: 60 // 1 minute
```

### 3. Handle Errors Gracefully

```typescript
try {
  const config = await getConfig(channel);
  return config || null; // Return null, not throw
} catch (error) {
  console.error("Failed to fetch config:", error);
  return null; // Component can use fallbacks
}
```

### 4. Type Everything

```typescript
// ✅ Good
interface MyConfig {
  title: string;
  count: number;
}

// ❌ Bad
const config: any = await getConfig();
```

### 5. Document Dashboard Setup

```typescript
/**
 * DASHBOARD SETUP:
 * 1. Create collection with slug "my-feature"
 * 2. Add metadata keys: title, description
 * 3. Publish collection
 */
```

---

## 🧪 Testing New Features

### 1. Test with CMS Data

- Create collection in Dashboard
- Add metadata
- Verify in browser

### 2. Test Fallbacks

- Delete collection
- Verify fallbacks work
- No errors in console

### 3. Test Edge Cases

- Empty metadata
- Invalid JSON
- Missing required fields

---

## 📚 Common Use Cases

| Feature | Pattern | Metadata Format |
|---------|---------|-----------------|
| Banner text | Simple text | `banner_title`, `banner_subtitle` |
| Button config | Simple text | `button_text`, `button_link` |
| List of items | JSON array | `items_json: [...]` |
| Feature flags | Boolean | `enabled: "true"` |
| Limits/counts | Number | `limit: "10"` |
| Rich content | CMS Page | Full page content |
| Navigation | Menu | Menu items |

---

*Last updated: December 2024*

