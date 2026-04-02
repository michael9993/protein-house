/**
 * CMS Integration Layer
 * =====================
 * 
 * This module provides integration between the storefront and Saleor Dashboard CMS.
 * 
 * Dashboard Features Used:
 * - Pages: Create/edit content pages (About, FAQ, Contact, etc.)
 * - Menus: Control navigation and footer links
 * - Collections: Group products for homepage sections
 * - Categories: Organize products into browsable categories
 * - Metadata: Custom data on any entity for flexibility
 * 
 * DASHBOARD SETUP GUIDE:
 * ======================
 * 
 * 1. PAGES (Dashboard > Content > Pages)
 *    Create these pages for static content:
 *    - Slug: "about" - About Us page content
 *    - Slug: "faq" - FAQ page content (JSON format for structured Q&A)
 *    - Slug: "contact" - Contact page additional info
 *    - Slug: "privacy-policy" - Privacy Policy
 *    - Slug: "terms-of-service" - Terms of Service
 *    - Slug: "shipping-policy" - Shipping Policy
 *    - Slug: "return-policy" - Return Policy
 * 
 * 2. MENUS (Dashboard > Content > Navigation)
 *    Create these menus:
 *    - Slug: "navbar" - Main navigation menu
 *    - Slug: "footer" - Footer links menu
 * 
 * 3. COLLECTIONS (Dashboard > Catalog > Collections)
 *    Create these collections for homepage:
 *    - Slug: "featured-products" - Hero/Featured products
 *    - Slug: "new-arrivals" - New Arrivals section
 *    - Slug: "best-sellers" - Best Sellers section
 *    - Slug: "sale" - On Sale section
 *    - Slug: "hero-banner" - Hero banner config (use metadata)
 *    - Slug: "testimonials" - Customer testimonials (use metadata)
 *    - Slug: "brands" - Featured brands (use metadata)
 * 
 *    COLLECTION METADATA KEYS:
 *    hero-banner:
 *      - hero_title: Main heading
 *      - hero_subtitle: Subheading
 *      - hero_cta_text: Button text
 *      - hero_cta_link: Button URL
 *      - hero_video_url: Video URL (for video hero)
 * 
 *    testimonials (add as JSON array in description or metadata):
 *      - testimonials_json: [{"name":"...", "role":"...", "quote":"...", "image":"..."}]
 * 
 *    brands:
 *      - brands_json: [{"name":"...", "logo":"...", "url":"..."}]
 * 
 * 4. CATEGORIES (Dashboard > Catalog > Categories)
 *    Create top-level categories for "Shop by Category" section
 *    Add background images for visual appeal
 *    
 *    CATEGORY METADATA KEYS:
 *      - featured: "true" - Show on homepage
 *      - display_order: "1" - Order on homepage
 */

import { executeGraphQL } from "./graphql";
import {
  PageGetBySlugDocument,
  MenuGetBySlugDocument,
  ProductListByCollectionDocument,
  BrandPagesDocument,
} from "@/gql/graphql";
import { getLanguageCodeForChannel } from "@/lib/language";

export interface CMSPage {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface CMSMenuItem {
  id: string;
  name: string;
  url: string | null | undefined;
  category: { id: string; name: string; slug: string } | null | undefined;
  collection: { id: string; name: string; slug: string } | null | undefined;
  page: { id: string; title: string; slug: string } | null | undefined;
  children?: CMSMenuItem[];
}

export interface CMSCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  backgroundImage: { url: string; alt: string | null } | null;
  productCount: number;
}

export interface CMSCollection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  backgroundImage: { url: string; alt: string | null } | null;
  productCount: number;
}

/**
 * Fetch a CMS page by slug
 * Content is managed in Dashboard > Content > Pages
 */
export async function getCMSPage(slug: string): Promise<CMSPage | null> {
  try {
    const data = await executeGraphQL(PageGetBySlugDocument, {
      variables: { slug },
      revalidate: 60,
    });
    
    if (!data.page) return null;
    
    return {
      id: data.page.id,
      slug: data.page.slug,
      title: data.page.title,
      content: data.page.content ?? null,
      seoTitle: data.page.seoTitle ?? null,
      seoDescription: data.page.seoDescription ?? null,
    };
  } catch (error) {
    console.error(`Failed to fetch CMS page: ${slug}`, error);
    return null;
  }
}

/**
 * Fetch menu items by slug
 * Menus are managed in Dashboard > Content > Navigation
 */
export async function getCMSMenu(slug: string, channel: string): Promise<CMSMenuItem[]> {
  try {
    const data = await executeGraphQL(MenuGetBySlugDocument, {
      variables: { slug, channel, languageCode: getLanguageCodeForChannel(channel) },
      revalidate: 60 * 60,
    });
    
    if (!data.menu?.items) return [];
    
    return data.menu.items.map((item) => ({
      id: item.id,
      name: item.name,
      url: item.url,
      category: item.category,
      collection: item.collection,
      page: item.page,
      children: item.children?.map((child) => ({
        id: child.id,
        name: child.name,
        url: child.url,
        category: child.category,
        collection: child.collection,
        page: child.page,
      })),
    }));
  } catch (error) {
    console.error(`Failed to fetch CMS menu: ${slug}`, error);
    return [];
  }
}

/**
 * Fetch products from a collection
 * Used for homepage sections like New Arrivals, Best Sellers
 */
export async function getCollectionProducts(
  collectionSlug: string,
  channel: string
) {
  try {
    const languageCode = getLanguageCodeForChannel(channel);
    const data = await executeGraphQL(ProductListByCollectionDocument, {
      variables: { slug: collectionSlug, channel, languageCode },
      revalidate: 60,
    });

    return data.collection?.products?.edges.map(({ node }) => node) || [];
  } catch (error) {
    console.error(`Failed to fetch collection products: ${collectionSlug}`, error);
    return [];
  }
}

/**
 * Parse JSON content from a CMS page
 * Useful for structured content like FAQ items
 */
export function parseCMSContent<T>(content: string | null): T | null {
  if (!content) return null;
  
  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

/**
 * Default content for pages when CMS is not configured
 */
export const defaultContent = {
  about: {
    title: "About Us",
    hero: "Our Story",
    mission: "We're on a mission to provide the best products at the best prices.",
  },
  contact: {
    title: "Contact Us",
    hero: "Get in Touch",
    description: "Have a question? We're here to help.",
  },
  faq: {
    title: "FAQ",
    hero: "How Can We Help?",
    description: "Find answers to frequently asked questions.",
  },
};

/**
 * Homepage collection slugs
 * These should match collections created in Dashboard.
 *
 * DATA-DRIVEN BEHAVIOUR (see app/[channel]/(main)/page.tsx):
 * - newArrivals: If this collection has products, they are used (merchant-curated).
 *   Otherwise the storefront fetches products sorted by CREATED_AT DESC (newest first).
 * - bestSellers: If this collection has products, they are used (merchant-curated).
 *   Otherwise the storefront fetches products sorted by RATING DESC (top-rated).
 *   Saleor does not expose "sold count" in the storefront API, so top-rated is the fallback.
 * - featured, sale: Always collection-based (merchant-curated).
 */
export const homepageCollections = {
  featured: "featured-products",
  newArrivals: "new-arrivals",
  bestSellers: "best-sellers",
  sale: "sale",
};

/**
 * Menu slugs used across the site
 */
export const menuSlugs = {
  navbar: "navbar",
  footer: "footer",
};

/**
 * Collection slugs for CMS-controlled content
 */
export const cmsCollections = {
  heroBanner: "hero-banner",
  testimonials: "testimonials",
  brands: "brands",
};

// =============================================================================
// METADATA HELPERS
// =============================================================================

/**
 * Get a metadata value from an array of metadata
 */
export function getMetadataValue(
  metadata: Array<{ key: string; value: string }> | null | undefined,
  key: string
): string | null {
  if (!metadata) return null;
  return metadata.find(m => m.key === key)?.value ?? null;
}

/**
 * Parse JSON from metadata value safely
 */
export function parseMetadataJson<T>(
  metadata: Array<{ key: string; value: string }> | null | undefined,
  key: string
): T | null {
  const value = getMetadataValue(metadata, key);
  if (!value) return null;
  
  try {
    return JSON.parse(value) as T;
  } catch {
    console.error(`Failed to parse metadata JSON for key: ${key}`);
    return null;
  }
}

// =============================================================================
// HERO BANNER
// =============================================================================

export interface HeroBannerConfig {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  videoUrl?: string;
  backgroundImage?: string;
}

/**
 * Fetch hero banner config from collection metadata
 * Create collection "hero-banner" in Dashboard > Catalog > Collections
 * Add metadata keys: hero_title, hero_subtitle, hero_cta_text, hero_cta_link, hero_video_url
 */
export async function getHeroBannerConfig(channel: string): Promise<HeroBannerConfig | null> {
  try {
    const languageCode = getLanguageCodeForChannel(channel);
    const data = await executeGraphQL(ProductListByCollectionDocument, {
      variables: { slug: cmsCollections.heroBanner, channel, languageCode },
      revalidate: 60,
    });
    
    const collection = data.collection;
    if (!collection) return null;
    
    const metadata = collection.metadata;
    
    return {
      title: getMetadataValue(metadata, "hero_title") || "Welcome to Our Store",
      subtitle: getMetadataValue(metadata, "hero_subtitle") || "Discover amazing products",
      ctaText: getMetadataValue(metadata, "hero_cta_text") || "Shop Now",
      ctaLink: getMetadataValue(metadata, "hero_cta_link") || "/products",
      videoUrl: getMetadataValue(metadata, "hero_video_url") || undefined,
      backgroundImage: collection.backgroundImage?.url || undefined,
    };
  } catch (error) {
    console.error("Failed to fetch hero banner config:", error);
    return null;
  }
}

// =============================================================================
// TESTIMONIALS
// =============================================================================

export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  quote: string;
  image?: string;
  rating?: number;
}

/**
 * Fetch testimonials from collection metadata
 * Create collection "testimonials" in Dashboard > Catalog > Collections
 * Add metadata key: testimonials_json with array of testimonials
 */
export async function getTestimonials(channel: string): Promise<Testimonial[]> {
  try {
    const languageCode = getLanguageCodeForChannel(channel);
    const data = await executeGraphQL(ProductListByCollectionDocument, {
      variables: { slug: cmsCollections.testimonials, channel, languageCode },
      revalidate: 60 * 60, // Cache for 1 hour
    });
    
    const collection = data.collection;
    if (!collection) return [];
    
    const testimonials = parseMetadataJson<Testimonial[]>(
      collection.metadata,
      "testimonials_json"
    );
    
    return testimonials || [];
  } catch (error) {
    console.error("Failed to fetch testimonials:", error);
    return [];
  }
}

// =============================================================================
// FEATURED BRANDS
// =============================================================================

export interface FeaturedBrand {
  id: string;
  name: string;
  logo: string;
  url?: string;
}

/**
 * Fetch featured brands from collection metadata
 * Create collection "brands" in Dashboard > Catalog > Collections
 * Add metadata key: brands_json with array of brands
 */
export async function getFeaturedBrands(channel: string): Promise<FeaturedBrand[]> {
  try {
    const languageCode = getLanguageCodeForChannel(channel);
    const data = await executeGraphQL(ProductListByCollectionDocument, {
      variables: { slug: cmsCollections.brands, channel, languageCode },
      revalidate: 60 * 60, // Cache for 1 hour
    });
    
    const collection = data.collection;
    if (!collection) return [];
    
    const brands = parseMetadataJson<FeaturedBrand[]>(
      collection.metadata,
      "brands_json"
    );
    
    return brands || [];
  } catch (error) {
    console.error("Failed to fetch featured brands:", error);
    return [];
  }
}

// =============================================================================
// BRAND LOGOS FROM PAGES
// =============================================================================

/**
 * Fetch brand logos from Saleor Pages of type "Brand"
 * Each brand page has a "brand-logo" file attribute with the logo image.
 * Returns a map of lowercase brand name → logo URL.
 */
export async function getBrandLogos(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const data = await executeGraphQL(BrandPagesDocument, {
      variables: { first: 50 },
      revalidate: 60 * 60,
    });

    const pages = data.pages?.edges ?? [];
    for (const { node } of pages) {
      // Only include pages from the "Brand" page type
      const ptName = node.pageType?.name?.toLowerCase() ?? "";
      if (ptName !== "brand") continue;

      const logoAttr = node.attributes?.find(
        (a) => a.attribute?.slug === "brand-logo" || a.attribute?.slug === "brand-image",
      );
      const logoUrl = logoAttr?.values?.[0]?.file?.url;
      if (logoUrl) {
        map.set(node.title.toLowerCase().trim(), logoUrl);
      }
    }
  } catch (error) {
    console.error("Failed to fetch brand logos:", error);
  }
  return map;
}

// =============================================================================
// FAQ FROM CMS
// =============================================================================

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQCategory {
  name: string;
  icon?: string;
  items: FAQItem[];
}

/**
 * Fetch FAQ content from CMS page
 * Create page "faq" in Dashboard > Content > Pages
 * Content should be JSON: { "categories": [...] }
 */
export async function getFAQContent(): Promise<FAQCategory[] | null> {
  try {
    const page = await getCMSPage("faq");
    if (!page?.content) return null;
    
    const parsed = parseCMSContent<{ categories: FAQCategory[] }>(page.content);
    return parsed?.categories || null;
  } catch (error) {
    console.error("Failed to fetch FAQ content:", error);
    return null;
  }
}

// =============================================================================
// ABOUT PAGE CONTENT
// =============================================================================

export interface AboutPageContent {
  title: string;
  subtitle?: string;
  story?: string;
  mission?: string;
  stats?: Array<{ value: string; label: string }>;
  values?: Array<{ icon: string; title: string; description: string }>;
  team?: Array<{ name: string; role: string; bio: string; image?: string }>;
}

/**
 * Fetch about page structured content
 * Create page "about" in Dashboard > Content > Pages
 * Content can be rich text or JSON structure
 */
export async function getAboutPageContent(): Promise<AboutPageContent | null> {
  try {
    const page = await getCMSPage("about");
    if (!page) return null;
    
    // Try to parse as JSON first
    const jsonContent = parseCMSContent<AboutPageContent>(page.content);
    if (jsonContent) {
      return {
        ...jsonContent,
        title: page.title, // Override with page title from CMS
      };
    }
    
    // Return basic content if not JSON
    return {
      title: page.title,
      story: page.content || undefined,
    };
  } catch (error) {
    console.error("Failed to fetch about page content:", error);
    return null;
  }
}
