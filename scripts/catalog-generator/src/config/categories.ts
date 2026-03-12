// Template router — selects catalog data based on CATALOG_TEMPLATE env var.
// Usage:
//   npm run generate                         → Pawzen catalog (default)
//   CATALOG_TEMPLATE=starter npm run generate → Starter catalog

// Re-export types from pawzen (the canonical interface definition)
export type { Category } from "./templates/pawzen/categories";

const template = process.env.CATALOG_TEMPLATE || "pawzen";

const mod = template === "starter"
  ? await import("./templates/starter/categories")
  : await import("./templates/pawzen/categories");

export const CATEGORIES = mod.CATEGORIES;
