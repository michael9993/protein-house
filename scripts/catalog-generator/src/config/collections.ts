export type { Collection } from "./templates/protein-house/collections";

const template = process.env.CATALOG_TEMPLATE || "protein-house";

const mod = template === "starter"
  ? await import("./templates/starter/collections")
  : template === "pawzen"
  ? await import("./templates/pawzen/collections")
  : await import("./templates/protein-house/collections");

export const COLLECTIONS = mod.COLLECTIONS;
