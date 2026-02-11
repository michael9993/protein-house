/**
 * Homepage Utility Functions
 * Shared helpers for homepage components.
 */

import { type ProductListItemFragment } from "@/gql/graphql";

export const NEW_DAYS = 30;
export const BRAND_ATTRIBUTE_SLUGS = ["brand", "vendor", "manufacturer", "label"];
export const BRAND_IMAGE_ATTRIBUTE_SLUGS = ["brand-image", "brand-logo", "brand_image", "brand_logo"];

/** Derive a human-readable URL slug from a brand name (e.g., "Asics" → "asics", "Dr. Martens" → "dr-martens") */
export const deriveBrandSlug = (name: string): string =>
  name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

export const FALLBACK_BRANDS = [
  "Adidas", "Nike", "Reebok", "New Balance", "Converse",
  "Vans", "Asics", "Crocs", "Dr. Martens", "On", "Under Armour",
];

export const FALLBACK_CATEGORIES = [
  { name: "Running", desc: "Lightweight pace and distance." },
  { name: "Training", desc: "Stability, grip, and power." },
  { name: "Court", desc: "Fast cuts and control." },
  { name: "Outdoor", desc: "Weather-ready traction." },
  { name: "Recovery", desc: "Post-session comfort." },
  { name: "Studio", desc: "Precision fits for movement." },
];

export type BadgeTone = "primary" | "accent" | "muted" | "warning" | "dark";

export type ProductBadge = { label: string; tone: BadgeTone };

export interface DashboardCategoryChild {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  image?: string;
  imageAlt?: string;
}

export interface DashboardCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  imageAlt?: string;
  productCount: number;
  featuredImage?: string;
  children?: DashboardCategoryChild[];
}

/** Placeholder categories for demo/fallback */
export const PLACEHOLDER_CATEGORIES: DashboardCategory[] = [
  { id: "1", name: "Running Shoes", slug: "running-shoes", productCount: 45, children: [
    { id: "1a", name: "Road Running", slug: "road-running", productCount: 20 },
    { id: "1b", name: "Trail Running", slug: "trail-running", productCount: 15 },
    { id: "1c", name: "Track & Field", slug: "track-field", productCount: 10 },
  ]},
  { id: "2", name: "Training Gear", slug: "training-gear", productCount: 38, children: [
    { id: "2a", name: "Gym Shoes", slug: "gym-shoes", productCount: 22 },
    { id: "2b", name: "Cross Training", slug: "cross-training", productCount: 16 },
  ]},
  { id: "3", name: "Sportswear", slug: "sportswear", productCount: 62, children: [
    { id: "3a", name: "T-Shirts", slug: "t-shirts", productCount: 30 },
    { id: "3b", name: "Pants & Shorts", slug: "pants-shorts", productCount: 20 },
    { id: "3c", name: "Jackets", slug: "jackets", productCount: 12 },
  ]},
  { id: "4", name: "Accessories", slug: "accessories", productCount: 54, children: [
    { id: "4a", name: "Bags", slug: "bags", productCount: 18 },
    { id: "4b", name: "Socks", slug: "socks", productCount: 24 },
    { id: "4c", name: "Hats & Caps", slug: "hats-caps", productCount: 12 },
  ]},
  { id: "5", name: "Basketball", slug: "basketball", productCount: 29 },
  { id: "6", name: "Soccer", slug: "soccer", productCount: 41 },
];

export const badgeToneClasses: Record<BadgeTone, string> = {
  primary: "bg-[var(--badge-new-bg)] text-[var(--badge-new-text)]",
  accent: "bg-[var(--badge-sale-bg)] text-[var(--badge-sale-text)]",
  muted: "bg-[var(--badge-featured-bg)] text-[var(--badge-featured-text)]",
  warning: "bg-[var(--badge-lowstock-bg)] text-[var(--badge-lowstock-text)]",
  dark: "bg-[var(--badge-outofstock-bg)] text-[var(--badge-outofstock-text)]",
};

export const getProductImage = (p: ProductListItemFragment | null | undefined) =>
  p?.thumbnail?.url || p?.media?.[0]?.url || null;

export const getProductAlt = (p: ProductListItemFragment | null | undefined) =>
  p?.thumbnail?.alt || p?.media?.[0]?.alt || p?.name || "Product image";

export const getTotalStock = (p: ProductListItemFragment) =>
  p.variants?.reduce((t, v) => t + (v?.quantityAvailable ?? 0), 0) ?? 0;

export const isNewProduct = (created: string) =>
  Date.now() - new Date(created).getTime() < NEW_DAYS * 86_400_000;

export const getProductBrand = (p: ProductListItemFragment, fallback: string) => {
  const attr = p.attributes?.find((e) =>
    e.attribute?.slug ? BRAND_ATTRIBUTE_SLUGS.includes(e.attribute.slug) : false,
  );
  return attr?.values?.[0]?.name || p.collections?.[0]?.name || p.category?.name || fallback;
};

/** Returns brand { name, slug, image } from product attributes using a human-readable name-derived slug */
export const getProductBrandInfo = (p: ProductListItemFragment, fallback: string): { name: string; slug: string; image: string } => {
  const attr = p.attributes?.find((e) =>
    e.attribute?.slug ? BRAND_ATTRIBUTE_SLUGS.includes(e.attribute.slug) : false,
  );
  const value = attr?.values?.[0];
  const name = value?.name || p.collections?.[0]?.name || p.category?.name || fallback;
  const slug = deriveBrandSlug(name);

  // Look for a brand image attribute (FILE type attribute with brand logo)
  const imageAttr = p.attributes?.find((e) =>
    e.attribute?.slug ? BRAND_IMAGE_ATTRIBUTE_SLUGS.includes(e.attribute.slug) : false,
  );
  const image = imageAttr?.values?.[0]?.file?.url || "";

  return { name, slug, image };
};

/** Badge labels interface for translation support */
export interface BadgeLabels {
  outOfStock: string;
  sale: string;
  /** "OFF" text used in discount badges like "-20% OFF" */
  off: string;
  lowStock: string;
  new: string;
  featured: string;
}

/** Default English badge labels */
export const DEFAULT_BADGE_LABELS: BadgeLabels = {
  outOfStock: "Out of stock",
  sale: "Sale",
  off: "OFF",
  lowStock: "Low stock",
  new: "New",
  featured: "Featured",
};

export const getProductBadge = (p: ProductListItemFragment): ProductBadge => {
  return getProductBadgeWithLabels(p, DEFAULT_BADGE_LABELS);
};

/** Get product badge with custom labels (for translation support) */
export const getProductBadgeWithLabels = (
  p: ProductListItemFragment,
  labels: BadgeLabels
): ProductBadge => {
  const stock = getTotalStock(p);
  const cur = p.pricing?.priceRange?.start?.gross;
  const orig = p.pricing?.priceRangeUndiscounted?.start?.gross;
  const sale = Boolean(cur && orig && orig.amount > cur.amount);
  if (stock <= 0) return { label: labels.outOfStock, tone: "dark" };
  if (sale) {
    const discount = getDiscountPercent(p);
    if (discount > 0) return { label: `-${discount}% ${labels.off}`, tone: "accent" };
    return { label: labels.sale, tone: "accent" };
  }
  if (stock <= 5) return { label: labels.lowStock, tone: "warning" };
  if (isNewProduct(p.created)) return { label: labels.new, tone: "primary" };
  return { label: labels.featured, tone: "muted" };
};

export const getDiscountPercent = (p: ProductListItemFragment) => {
  const price = p.pricing?.priceRange?.start?.gross;
  const orig = p.pricing?.priceRangeUndiscounted?.start?.gross;
  if (!price || !orig || orig.amount <= price.amount) return 0;
  return Math.round(((orig.amount - price.amount) / orig.amount) * 100);
};

export const normalizeHref = (channel: string, href: string) => {
  if (href.startsWith("http")) return href;
  const prefix = `/${encodeURIComponent(channel)}`;
  if (!href.startsWith("/")) return `${prefix}/${href}`;
  return href.startsWith(prefix) ? href : `${prefix}${href}`;
};

export const uniqueBy = <T, K extends string | number>(items: T[], key: (i: T) => K | null | undefined) => {
  const m = new Map<K, T>();
  items.forEach((i) => { const k = key(i); if (k && !m.has(k)) m.set(k, i); });
  return Array.from(m.values());
};

// --- Product Card Config Helpers ---

export type HoverEffect = "lift" | "glow" | "border" | "scale" | "none";
export type BadgePosition = "top-start" | "top-end" | "bottom-start" | "bottom-end";
export type ImageFit = "cover" | "contain";

export interface ProductCardConfig {
  hoverEffect?: HoverEffect;
  badgePosition?: BadgePosition;
  showBrandLabel?: boolean;
  showRating?: boolean;
  imageFit?: ImageFit;
}

/** Get badge position CSS classes */
export const getBadgePositionClasses = (position: BadgePosition = "top-start"): string => {
  switch (position) {
    case "top-start": return "start-4 top-4";
    case "top-end": return "end-4 top-4";
    case "bottom-start": return "start-4 bottom-4";
    case "bottom-end": return "end-4 bottom-4";
    default: return "start-4 top-4";
  }
};

/** Get card hover CSS classes (base) */
export const getCardHoverClasses = (effect: HoverEffect = "lift"): string => {
  switch (effect) {
    case "lift": return "hover:-translate-y-1 hover:shadow-2xl";
    case "glow": return "hover:shadow-[0_0_20px_var(--store-primary-focus-ring)]";
    case "border": return "hover:border-[var(--store-primary)]";
    case "scale": return "hover:scale-[1.02]";
    case "none": return "";
    default: return "hover:-translate-y-1 hover:shadow-2xl";
  }
};

export const getCategoryLayoutClass = (index: number, total: number) => {
  const base = "min-h-[240px] sm:min-h-[260px] lg:min-h-[240px]";
  const layouts: Record<number, string[]> = {
    5: ["lg:col-span-7 lg:row-span-2", "lg:col-span-5", "lg:col-span-5", "lg:col-span-6", "lg:col-span-6"],
    6: ["lg:col-span-6 lg:row-span-2", "lg:col-span-6", "lg:col-span-6", "lg:col-span-4", "lg:col-span-4", "lg:col-span-4"],
    9: ["lg:col-span-7 lg:row-span-2", "lg:col-span-5", "lg:col-span-5", "lg:col-span-4", "lg:col-span-4", "lg:col-span-4", "lg:col-span-6", "lg:col-span-3", "lg:col-span-3"],
  };
  const layout = layouts[total];
  return `${base} ${layout?.[index] ?? "lg:col-span-4"}`;
};

/**
 * Parse EditorJS JSON description to plain text
 */
export function parseDescription(desc: string | null | undefined): string {
  if (!desc || desc.trim().length === 0) {
    return "";
  }

  // Try to parse as EditorJS JSON format
  try {
    const parsed = JSON.parse(desc) as {
      blocks?: Array<{ type: string; data: { text: string } }>;
    };
    if (parsed.blocks && Array.isArray(parsed.blocks)) {
      // Extract text from all paragraph blocks
      const texts = parsed.blocks
        .filter((block) => block.type === "paragraph")
        .map((block) => {
          // Clean HTML tags and entities
          return block.data.text
            .replace(/<br\s*\/?>/gi, " ")
            .replace(/<[^>]*>/g, "")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/&nbsp;/g, " ");
        });
      return texts.join(" ") || desc;
    }
  } catch {
    // Not JSON, use as plain text
  }

  return desc;
}
