// Template router — selects catalog data based on CATALOG_TEMPLATE env var.
export type { ProductType, ProductDefinition } from "./templates/protein-house/products";

const template = process.env.CATALOG_TEMPLATE || "protein-house";

const mod = template === "starter"
  ? await import("./templates/starter/products")
  : template === "pawzen"
  ? await import("./templates/pawzen/products")
  : await import("./templates/protein-house/products");

// protein-house exports
export const PROTEIN_PRODUCTS = "PROTEIN_PRODUCTS" in mod ? (mod as any).PROTEIN_PRODUCTS : [];
export const PERFORMANCE_PRODUCTS = "PERFORMANCE_PRODUCTS" in mod ? (mod as any).PERFORMANCE_PRODUCTS : [];
export const LIFESTYLE_PRODUCTS = "LIFESTYLE_PRODUCTS" in mod ? (mod as any).LIFESTYLE_PRODUCTS : [];
export const ALL_PRODUCTS = "ALL_PRODUCTS" in mod ? (mod as any).ALL_PRODUCTS : [];

// Legacy pawzen exports (for backward compatibility)
export const DOG_PRODUCTS = "DOG_PRODUCTS" in mod ? (mod as any).DOG_PRODUCTS : [];
export const CAT_PRODUCTS = "CAT_PRODUCTS" in mod ? (mod as any).CAT_PRODUCTS : [];
