// Template router — selects catalog data based on CATALOG_TEMPLATE env var.
// Usage:
//   npm run generate                         → Pawzen catalog (default)
//   CATALOG_TEMPLATE=starter npm run generate → Starter catalog

// Re-export types from pawzen (the canonical interface definition)
export type { Collection } from "./templates/pawzen/collections";

const template = process.env.CATALOG_TEMPLATE || "pawzen";

const mod = template === "starter"
  ? await import("./templates/starter/collections")
  : await import("./templates/pawzen/collections");

export const COLLECTIONS = mod.COLLECTIONS;
