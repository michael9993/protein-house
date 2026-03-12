// Starter template product types — these must match the product type names
// defined in your store's config.yml (Saleor infrastructure).
// Customize these to match your store's product type setup.
export type ProductType = "Clothing" | "Shoes" | "Bags" | "Accessories";
export type PetType = "Dog" | "Cat" | "Both"; // Not used in starter, kept for interface compat

export interface ProductDefinition {
  type: ProductType;
  petType: PetType;       // Starter uses "Both" as placeholder (field required for compat)
  model: string;
  model_he: string;
  category: string;       // Must match a category slug from categories.ts
  material: string;
  subType?: string;
  basePrice_ILS: number;
  basePrice_USD: number;
  discount?: number;      // 0-0.5 (0% to 50%)
  collections: string[];  // Must match collection slugs from collections.ts
}

// ── T-Shirts (5) ──────────────────────────────────────────────────────────────
const T_SHIRTS: ProductDefinition[] = [
  {
    type: "Clothing", petType: "Both",
    model: "Classic Cotton Tee", model_he: "חולצת כותנה קלאסית",
    category: "t-shirts", material: "Cotton", subType: "Basic",
    basePrice_ILS: 89, basePrice_USD: 24,
    collections: ["new-arrivals", "best-sellers"],
  },
  {
    type: "Clothing", petType: "Both",
    model: "Oversized Graphic Tee", model_he: "חולצה גרפית אוברסייז",
    category: "t-shirts", material: "Cotton", subType: "Graphic",
    basePrice_ILS: 119, basePrice_USD: 32,
    collections: ["new-arrivals", "featured-products"],
  },
  {
    type: "Clothing", petType: "Both",
    model: "V-Neck Slim Fit Tee", model_he: "חולצת וי צמודה",
    category: "t-shirts", material: "Cotton Blend", subType: "Basic",
    basePrice_ILS: 99, basePrice_USD: 27,
    collections: ["best-sellers"],
  },
  {
    type: "Clothing", petType: "Both",
    model: "Striped Long Sleeve Tee", model_he: "חולצת פסים שרוול ארוך",
    category: "t-shirts", material: "Cotton", subType: "Long Sleeve",
    basePrice_ILS: 129, basePrice_USD: 35,
    collections: ["new-arrivals"],
  },
  {
    type: "Clothing", petType: "Both",
    model: "Premium Pocket Tee", model_he: "חולצת כיס פרימיום",
    category: "t-shirts", material: "Organic Cotton", subType: "Basic",
    basePrice_ILS: 149, basePrice_USD: 40,
    discount: 0.15,
    collections: ["sale", "featured-products"],
  },
];

// ── Sneakers (5) ──────────────────────────────────────────────────────────────
const SNEAKERS: ProductDefinition[] = [
  {
    type: "Shoes", petType: "Both",
    model: "Urban Runner", model_he: "נעלי ריצה אורבניות",
    category: "sneakers", material: "Mesh", subType: "Running",
    basePrice_ILS: 349, basePrice_USD: 95,
    collections: ["best-sellers", "featured-products"],
  },
  {
    type: "Shoes", petType: "Both",
    model: "Canvas Low Top", model_he: "סניקרס קנבס נמוכות",
    category: "sneakers", material: "Canvas", subType: "Casual",
    basePrice_ILS: 199, basePrice_USD: 54,
    collections: ["new-arrivals"],
  },
  {
    type: "Shoes", petType: "Both",
    model: "Leather High Top", model_he: "סניקרס עור גבוהות",
    category: "sneakers", material: "Leather", subType: "High Top",
    basePrice_ILS: 449, basePrice_USD: 120,
    collections: ["featured-products"],
  },
  {
    type: "Shoes", petType: "Both",
    model: "Slip-On Comfort", model_he: "נעלי סליפ-און נוחות",
    category: "sneakers", material: "Knit", subType: "Casual",
    basePrice_ILS: 249, basePrice_USD: 67,
    discount: 0.20,
    collections: ["sale", "best-sellers"],
  },
  {
    type: "Shoes", petType: "Both",
    model: "Retro Sport Trainer", model_he: "נעלי ספורט רטרו",
    category: "sneakers", material: "Suede", subType: "Retro",
    basePrice_ILS: 399, basePrice_USD: 108,
    collections: ["new-arrivals", "featured-products"],
  },
];

// ── Bags (5) ──────────────────────────────────────────────────────────────────
const BAGS: ProductDefinition[] = [
  {
    type: "Bags", petType: "Both",
    model: "Everyday Backpack", model_he: "תיק גב יומיומי",
    category: "backpacks", material: "Nylon", subType: "Daypack",
    basePrice_ILS: 199, basePrice_USD: 54,
    collections: ["best-sellers"],
  },
  {
    type: "Bags", petType: "Both",
    model: "Laptop Backpack 15\"", model_he: "תיק גב למחשב נייד 15\"",
    category: "backpacks", material: "Polyester", subType: "Laptop",
    basePrice_ILS: 279, basePrice_USD: 75,
    collections: ["featured-products", "best-sellers"],
  },
  {
    type: "Bags", petType: "Both",
    model: "Canvas Tote Bag", model_he: "תיק טוט מקנבס",
    category: "bags", material: "Canvas", subType: "Tote",
    basePrice_ILS: 129, basePrice_USD: 35,
    collections: ["new-arrivals"],
  },
  {
    type: "Bags", petType: "Both",
    model: "Leather Crossbody Bag", model_he: "תיק צד מעור",
    category: "bags", material: "Leather", subType: "Crossbody",
    basePrice_ILS: 349, basePrice_USD: 95,
    collections: ["featured-products"],
  },
  {
    type: "Bags", petType: "Both",
    model: "Travel Duffel Bag", model_he: "תיק נסיעות דאפל",
    category: "bags", material: "Nylon", subType: "Duffel",
    basePrice_ILS: 249, basePrice_USD: 67,
    discount: 0.10,
    collections: ["sale"],
  },
];

// ── Accessories (5) ──────────────────────────────────────────────────────────
const ACCESSORIES: ProductDefinition[] = [
  {
    type: "Accessories", petType: "Both",
    model: "Minimalist Watch", model_he: "שעון מינימליסטי",
    category: "accessories", material: "Stainless Steel", subType: "Watch",
    basePrice_ILS: 399, basePrice_USD: 108,
    collections: ["featured-products", "best-sellers"],
  },
  {
    type: "Accessories", petType: "Both",
    model: "Polarized Sunglasses", model_he: "משקפי שמש מקוטבות",
    category: "accessories", material: "Acetate", subType: "Eyewear",
    basePrice_ILS: 249, basePrice_USD: 67,
    collections: ["new-arrivals"],
  },
  {
    type: "Accessories", petType: "Both",
    model: "Leather Belt", model_he: "חגורת עור",
    category: "accessories", material: "Leather", subType: "Belt",
    basePrice_ILS: 149, basePrice_USD: 40,
    collections: ["best-sellers"],
  },
  {
    type: "Accessories", petType: "Both",
    model: "Wool Beanie", model_he: "כובע גרב צמר",
    category: "accessories", material: "Wool", subType: "Hat",
    basePrice_ILS: 79, basePrice_USD: 21,
    discount: 0.25,
    collections: ["sale", "new-arrivals"],
  },
  {
    type: "Accessories", petType: "Both",
    model: "Silk Scarf", model_he: "צעיף משי",
    category: "accessories", material: "Silk", subType: "Scarf",
    basePrice_ILS: 199, basePrice_USD: 54,
    collections: ["featured-products"],
  },
];

// Combined exports (same names as pawzen template for compatibility)
export const DOG_PRODUCTS: ProductDefinition[] = []; // Not applicable for starter
export const CAT_PRODUCTS: ProductDefinition[] = []; // Not applicable for starter

export const ALL_PRODUCTS: ProductDefinition[] = [
  ...T_SHIRTS,
  ...SNEAKERS,
  ...BAGS,
  ...ACCESSORIES,
];
