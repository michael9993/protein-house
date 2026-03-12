// Template router — selects catalog data based on CATALOG_TEMPLATE env var.
// Usage:
//   npm run generate                         → Pawzen catalog (default)
//   CATALOG_TEMPLATE=starter npm run generate → Starter catalog
//
// All imports from this file resolve to the selected template at runtime.

// Re-export types from pawzen (the canonical interface definition)
export type { ProductType, PetType, ProductDefinition } from "./templates/pawzen/products";

const template = process.env.CATALOG_TEMPLATE || "pawzen";

const mod = template === "starter"
  ? await import("./templates/starter/products")
  : await import("./templates/pawzen/products");

export const DOG_PRODUCTS = mod.DOG_PRODUCTS;
export const CAT_PRODUCTS = mod.CAT_PRODUCTS;
export const ALL_PRODUCTS = mod.ALL_PRODUCTS;
