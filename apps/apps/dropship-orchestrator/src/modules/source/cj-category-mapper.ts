/**
 * CJ Category Mapper — pure-function module for category tree resolution,
 * product type suggestions, collection suggestions, and SEO generation.
 *
 * No side effects, no API calls. Takes CJ category tree data and provides
 * lookup + enrichment functions.
 */

import type { CJCategoryFirst } from "@/modules/suppliers/cj/types";

// ---------------------------------------------------------------------------
// Data structures
// ---------------------------------------------------------------------------

export interface CJCategoryPath {
  first: string;      // "Pet Supplies"
  second: string;     // "Grooming"
  third: string;      // "Brushes"
  categoryId: string;
}

/** Map of categoryId → full 3-level path */
export type CJCategoryIndex = Map<string, CJCategoryPath>;

// ---------------------------------------------------------------------------
// Index builder
// ---------------------------------------------------------------------------

/**
 * Flatten the 3-level CJ category tree into a lookup map keyed by categoryId.
 * Only L3 (leaf) nodes carry a categoryId, so we walk the full tree.
 *
 * Note: Some CJ categories may only have 2 levels (no L3 children).
 * Products in those branches won't appear in the index and will fall back
 * to their raw `categoryName` in `resolveCategoryPath`.
 */
export function buildCategoryIndex(tree: CJCategoryFirst[]): CJCategoryIndex {
  const index: CJCategoryIndex = new Map();

  for (const first of tree) {
    for (const second of first.categoryFirstList ?? []) {
      for (const third of second.categorySecondList ?? []) {
        if (third.categoryId) {
          index.set(third.categoryId, {
            first: first.categoryFirstName,
            second: second.categorySecondName,
            third: third.categoryName,
            categoryId: third.categoryId,
          });
        }
      }
    }
  }

  return index;
}

// ---------------------------------------------------------------------------
// Category path resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a product's CJ categoryId + categoryName into a hierarchical path.
 *
 * Returns an array like ["Pet Supplies", "Grooming", "Brushes"].
 * Deduplicates when L2 === L3 (CJ sometimes repeats the same name).
 * Falls back to raw categoryName if the ID isn't in the index.
 */
export function resolveCategoryPath(
  categoryId: string | undefined,
  categoryName: string | undefined,
  index: CJCategoryIndex,
): string[] {
  if (categoryId && index.has(categoryId)) {
    const entry = index.get(categoryId)!;
    const path = [entry.first];

    // Add L2 if different from L1
    if (entry.second && entry.second !== entry.first) {
      path.push(entry.second);
    }

    // Add L3 if different from L2 (dedup)
    if (entry.third && entry.third !== entry.second) {
      path.push(entry.third);
    }

    return path;
  }

  // Fallback: use raw categoryName as single-level
  if (categoryName) {
    return [categoryName];
  }

  return [];
}

// ---------------------------------------------------------------------------
// Product type suggestion
// ---------------------------------------------------------------------------

const PRODUCT_TYPE_MAP: Record<string, string> = {
  "pet supplies": "Pet Products",
  "home & garden": "Home & Garden",
  "home and garden": "Home & Garden",
  "beauty & health": "Beauty & Health",
  "beauty and health": "Beauty & Health",
  "health & beauty": "Beauty & Health",
  "clothing & apparel": "Clothing",
  "clothing": "Clothing",
  "apparel": "Clothing",
  "women's clothing": "Clothing",
  "men's clothing": "Clothing",
  "jewelry & watches": "Accessories",
  "jewelry": "Accessories",
  "watches": "Accessories",
  "accessories": "Accessories",
  "bags & shoes": "Accessories",
  "shoes": "Shoes",
  "toys & hobbies": "Toys & Hobbies",
  "toys": "Toys & Hobbies",
  "sports & outdoors": "Sports & Outdoors",
  "sports & entertainment": "Sports & Outdoors",
  "consumer electronics": "Electronics",
  "electronics": "Electronics",
  "phones & telecommunications": "Electronics",
  "computer & office": "Electronics",
  "automobiles & motorcycles": "Auto Parts",
  "baby & kids": "Baby & Kids",
  "mother & kids": "Baby & Kids",
  "food & beverages": "Food & Beverages",
  "furniture": "Furniture",
  "lights & lighting": "Home & Garden",
  "tools & hardware": "Tools & Hardware",
  "security & protection": "Electronics",
};

/**
 * Suggest a Saleor product type name based on the CJ L1 category.
 * Falls back to "Dropship Product" if no mapping matches.
 */
export function suggestProductType(categoryPath: string[]): string {
  if (categoryPath.length === 0) return "Dropship Product";

  const l1 = categoryPath[0].toLowerCase().trim();
  return PRODUCT_TYPE_MAP[l1] ?? "Dropship Product";
}

// ---------------------------------------------------------------------------
// Collection suggestion
// ---------------------------------------------------------------------------

/**
 * Suggest collections based on category path.
 * L1 becomes a collection name (e.g., "Pet Supplies").
 */
export function suggestCollections(categoryPath: string[]): string[] {
  if (categoryPath.length === 0) return [];
  return [categoryPath[0]];
}

// ---------------------------------------------------------------------------
// SEO generation
// ---------------------------------------------------------------------------

/**
 * Generate SEO title and description for a product.
 * Keeps titles under 60 chars, descriptions under 160 chars.
 */
export function generateProductSeo(
  name: string,
  categoryPath: string[],
  material?: string,
): { title: string; description: string } {
  const categoryContext = categoryPath.length > 0
    ? categoryPath[categoryPath.length - 1]
    : "";

  // Title: product name, trimmed to ~60 chars
  let title = name;
  if (title.length > 60) {
    title = title.substring(0, 57) + "...";
  }

  // Description: combine name, category, material into a compelling snippet
  const parts: string[] = [`Shop ${name}`];
  if (categoryContext) {
    parts.push(`in ${categoryContext}`);
  }
  if (material) {
    parts.push(`made with ${material}`);
  }
  parts.push("— fast worldwide shipping.");

  let description = parts.join(" ");
  if (description.length > 160) {
    description = description.substring(0, 157) + "...";
  }

  return { title, description };
}

/**
 * Generate SEO title and description for a category.
 */
export function generateCategorySeo(
  name: string,
  parentNames: string[],
): { title: string; description: string } {
  const breadcrumb = [...parentNames, name].join(" > ");

  let title = `${name} — Shop by Category`;
  if (title.length > 60) {
    title = name.substring(0, 57) + "...";
  }

  let description = `Browse our ${name} collection.`;
  if (parentNames.length > 0) {
    description = `Browse ${name} in ${parentNames[parentNames.length - 1]}. ${breadcrumb}.`;
  }
  if (description.length > 160) {
    description = description.substring(0, 157) + "...";
  }

  return { title, description };
}

/**
 * Generate SEO title and description for a collection.
 */
export function generateCollectionSeo(
  name: string,
): { title: string; description: string } {
  let title = `${name} Collection`;
  if (title.length > 60) {
    title = name.substring(0, 57) + "...";
  }

  let description = `Explore our curated ${name} collection. Quality products with fast shipping.`;
  if (description.length > 160) {
    description = description.substring(0, 157) + "...";
  }

  return { title, description };
}
