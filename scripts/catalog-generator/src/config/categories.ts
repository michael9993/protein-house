export type { Category } from "./templates/protein-house/categories";

const template = process.env.CATALOG_TEMPLATE || "protein-house";

const mod = template === "starter"
  ? await import("./templates/starter/categories")
  : template === "pawzen"
  ? await import("./templates/pawzen/categories")
  : await import("./templates/protein-house/categories");

export const CATEGORIES = mod.CATEGORIES;
