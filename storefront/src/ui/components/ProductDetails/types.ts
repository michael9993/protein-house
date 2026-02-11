/**
 * Shared types for ProductDetail sub-components.
 *
 * These are the *client-side* shapes passed from the server component
 * into ProductDetailClient and its children.
 */

// ---------- Product-level attributes ----------

export interface ProductAttributeValue {
  id: string;
  name: string;
  slug: string;
  /** Hex for SWATCH, null for others */
  value: string | null;
  richText: string | null;
  plainText: string | null;
  boolean: boolean | null;
  date: string | null;
  dateTime: string | null;
  file: { url: string; contentType: string | null } | null;
}

export interface ProductAttribute {
  attribute: {
    id: string;
    name: string;
    slug: string;
    inputType: string | null;
    /** Saleor filters non-visible attributes for anonymous users, so all returned are visible */
    visibleInStorefront?: boolean;
  };
  values: ProductAttributeValue[];
}

// ---------- Variant attributes ----------

export interface VariantAttributeValue {
  id: string;
  name: string;
  slug: string;
  /** Hex color for SWATCH attributes */
  value: string | null;
}

export interface VariantAttribute {
  attribute: {
    id: string;
    name: string;
    slug: string;
    inputType: string | null;
  };
  values: VariantAttributeValue[];
}

// ---------- Enriched variant ----------

export interface EnrichedVariant {
  id: string;
  name: string;
  quantityAvailable: number;
  trackInventory: boolean;
  quantityLimitPerCustomer: number | null;
  attributes?: VariantAttribute[] | null;
  pricing?: {
    price?: { gross: { amount: number; currency: string } } | null;
    priceUndiscounted?: { gross: { amount: number; currency: string } } | null;
  } | null;
}

// ---------- Selection state ----------

/** Maps attribute slug → selected value ID (or null if nothing selected) */
export type SelectionState = Record<string, string | null>;

/** One dimension in the variant selection UI */
export interface SelectionAttributeOption {
  valueId: string;
  valueName: string;
  valueSlug: string;
  /** Hex color (for SWATCH) */
  hex: string | null;
  /** 'available' = in-stock for current combo, 'unavailable' = exists but 0 stock, 'hidden' = no variant with this combo */
  status: "available" | "unavailable" | "hidden";
}

export interface SelectionAttribute {
  attributeId: string;
  attributeSlug: string;
  attributeName: string;
  inputType: string;
  options: SelectionAttributeOption[];
}
