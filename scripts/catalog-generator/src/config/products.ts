export type ProductType = "Pet Toys & Enrichment" | "Pet Feeding & Hydration" | "Pet Comfort & Living" | "Pet Care & Accessories";
export type PetType = "Dog" | "Cat" | "Both";

export interface ProductDefinition {
  type: ProductType;
  petType: PetType;
  model: string;
  model_he: string;
  category: string;
  material: string;
  subType?: string; // Toy Category, Feeding Type, Comfort Type, or Accessory Type
  basePrice_ILS: number;
  basePrice_USD: number;
  discount?: number; // 0-0.5 (0% to 50%)
  collections: string[];
}

// Dog Products (30)
export const DOG_PRODUCTS: ProductDefinition[] = [
  // ── Dog Toys (8) ─────────────────────────────────────────────────────────────
  {
    type: "Pet Toys & Enrichment", petType: "Dog",
    model: "Interactive Rope Toy", model_he: "צעצוע חבל אינטראקטיבי",
    category: "dog-interactive-toys", material: "Rope", subType: "Interactive",
    basePrice_ILS: 49, basePrice_USD: 13,
    collections: ["dog-products", "toys-collection", "budget-friendly"],
  },
  {
    type: "Pet Toys & Enrichment", petType: "Dog",
    model: "Rubber Chew Bone", model_he: "עצם לעיסה מגומי",
    category: "dog-chew-toys", material: "Rubber", subType: "Chew",
    basePrice_ILS: 39, basePrice_USD: 10,
    collections: ["dog-products", "toys-collection", "budget-friendly", "best-sellers"],
  },
  {
    type: "Pet Toys & Enrichment", petType: "Dog",
    model: "Tennis Fetch Ball Set", model_he: "סט כדורי טניס להבאה",
    category: "dog-fetch-outdoor", material: "Rubber", subType: "Fetch",
    basePrice_ILS: 35, basePrice_USD: 9,
    collections: ["dog-products", "toys-collection", "budget-friendly"],
  },
  {
    type: "Pet Toys & Enrichment", petType: "Dog",
    model: "Puzzle Treat Feeder", model_he: "מאכיל פאזל לחטיפים",
    category: "dog-puzzle-toys", material: "Plastic", subType: "Puzzle",
    basePrice_ILS: 89, basePrice_USD: 24,
    collections: ["dog-products", "toys-collection", "featured-products"],
  },
  {
    type: "Pet Toys & Enrichment", petType: "Dog",
    model: "Squeaky Plush Bear", model_he: "דובי קטיפה עם צפצפה",
    category: "dog-interactive-toys", material: "Plush", subType: "Comfort",
    basePrice_ILS: 45, basePrice_USD: 12,
    collections: ["dog-products", "toys-collection", "budget-friendly"],
  },
  {
    type: "Pet Toys & Enrichment", petType: "Dog",
    model: "Indestructible Ball", model_he: "כדור בלתי ניתן להריסה",
    category: "dog-chew-toys", material: "Rubber", subType: "Chew",
    basePrice_ILS: 59, basePrice_USD: 16,
    collections: ["dog-products", "toys-collection", "best-sellers"],
  },
  {
    type: "Pet Toys & Enrichment", petType: "Dog",
    model: "Snuffle Mat", model_he: "שטיח הרחה",
    category: "dog-puzzle-toys", material: "Natural", subType: "Puzzle",
    basePrice_ILS: 79, basePrice_USD: 21,
    collections: ["dog-products", "toys-collection", "new-arrivals"],
  },
  {
    type: "Pet Toys & Enrichment", petType: "Dog",
    model: "Tug of War Rope", model_he: "חבל משיכה",
    category: "dog-fetch-outdoor", material: "Rope", subType: "Fetch",
    basePrice_ILS: 42, basePrice_USD: 11,
    collections: ["dog-products", "toys-collection", "budget-friendly"],
  },

  // ── Dog Feeding (5) ──────────────────────────────────────────────────────────
  {
    type: "Pet Feeding & Hydration", petType: "Dog",
    model: "Stainless Steel Bowl Set", model_he: "סט קערות נירוסטה",
    category: "dog-bowls-feeders", material: "Stainless Steel", subType: "Bowl",
    basePrice_ILS: 69, basePrice_USD: 18,
    collections: ["dog-products", "feeding-collection", "budget-friendly", "best-sellers"],
  },
  {
    type: "Pet Feeding & Hydration", petType: "Dog",
    model: "Slow Feeder Bowl", model_he: "קערת האכלה איטית",
    category: "dog-slow-feeders", material: "Plastic", subType: "Slow Feeder",
    basePrice_ILS: 59, basePrice_USD: 16,
    collections: ["dog-products", "feeding-collection", "budget-friendly"],
  },
  {
    type: "Pet Feeding & Hydration", petType: "Dog",
    model: "Water Fountain 2L", model_he: "מזרקת מים 2 ליטר",
    category: "dog-water-fountains", material: "Plastic", subType: "Fountain",
    basePrice_ILS: 149, basePrice_USD: 40,
    collections: ["dog-products", "feeding-collection", "mid-range", "featured-products"],
  },
  {
    type: "Pet Feeding & Hydration", petType: "Dog",
    model: "Travel Water Bottle", model_he: "בקבוק מים לטיולים",
    category: "dog-bowls-feeders", material: "Silicone", subType: "Travel Bowl",
    basePrice_ILS: 55, basePrice_USD: 15,
    collections: ["dog-products", "feeding-collection", "budget-friendly"],
  },
  {
    type: "Pet Feeding & Hydration", petType: "Dog",
    model: "Elevated Double Bowl Stand", model_he: "מעמד קערות כפול מוגבה",
    category: "dog-bowls-feeders", material: "Stainless Steel", subType: "Bowl",
    basePrice_ILS: 129, basePrice_USD: 35,
    collections: ["dog-products", "feeding-collection", "mid-range"],
  },

  // ── Dog Comfort (6) ──────────────────────────────────────────────────────────
  {
    type: "Pet Comfort & Living", petType: "Dog",
    model: "Cooling Mat", model_he: "מזרן קירור",
    category: "dog-beds-mats", material: "Fabric", subType: "Bed",
    basePrice_ILS: 99, basePrice_USD: 27,
    collections: ["dog-products", "comfort-collection", "budget-friendly", "cooling-summer"],
  },
  {
    type: "Pet Comfort & Living", petType: "Dog",
    model: "Orthopedic Memory Foam Bed", model_he: "מיטה אורתופדית מקצף זיכרון",
    category: "dog-beds-mats", material: "Memory Foam", subType: "Bed",
    basePrice_ILS: 299, basePrice_USD: 80,
    collections: ["dog-products", "comfort-collection", "premium-selection", "best-sellers"],
  },
  {
    type: "Pet Comfort & Living", petType: "Dog",
    model: "Fleece Blanket", model_he: "שמיכת פליז",
    category: "dog-blankets", material: "Fleece", subType: "Blanket",
    basePrice_ILS: 69, basePrice_USD: 18,
    collections: ["dog-products", "comfort-collection", "budget-friendly"],
  },
  {
    type: "Pet Comfort & Living", petType: "Dog",
    model: "Winter Puffer Jacket", model_he: "מעיל פוך לחורף",
    category: "dog-clothing", material: "Fabric", subType: "Clothing",
    basePrice_ILS: 149, basePrice_USD: 40,
    collections: ["dog-products", "comfort-collection", "mid-range", "new-arrivals"],
  },
  {
    type: "Pet Comfort & Living", petType: "Dog",
    model: "Waterproof Raincoat", model_he: "מעיל גשם עמיד במים",
    category: "dog-clothing", material: "Fabric", subType: "Clothing",
    basePrice_ILS: 119, basePrice_USD: 32,
    collections: ["dog-products", "comfort-collection", "mid-range"],
  },
  {
    type: "Pet Comfort & Living", petType: "Dog",
    model: "Soft-Sided Carrier", model_he: "נשא רך לנסיעות",
    category: "dog-carriers", material: "Canvas", subType: "Carrier",
    basePrice_ILS: 199, basePrice_USD: 53,
    collections: ["dog-products", "comfort-collection", "mid-range"],
  },

  // ── Dog Care & Accessories (8) ───────────────────────────────────────────────
  {
    type: "Pet Care & Accessories", petType: "Dog",
    model: "Adjustable Harness", model_he: "רתמה מתכווננת",
    category: "dog-harnesses", material: "Nylon", subType: "Harness",
    basePrice_ILS: 109, basePrice_USD: 29,
    collections: ["dog-products", "care-grooming-collection", "mid-range", "best-sellers"],
  },
  {
    type: "Pet Care & Accessories", petType: "Dog",
    model: "Retractable Leash 5m", model_he: "רצועה נמשכת 5 מטר",
    category: "dog-collars-leashes", material: "Nylon", subType: "Leash",
    basePrice_ILS: 79, basePrice_USD: 21,
    collections: ["dog-products", "care-grooming-collection", "budget-friendly"],
  },
  {
    type: "Pet Care & Accessories", petType: "Dog",
    model: "LED Safety Collar", model_he: "קולר LED בטיחותי",
    category: "dog-collars-leashes", material: "Nylon", subType: "Collar",
    basePrice_ILS: 65, basePrice_USD: 17,
    collections: ["dog-products", "care-grooming-collection", "budget-friendly", "new-arrivals"],
  },
  {
    type: "Pet Care & Accessories", petType: "Dog",
    model: "Deshedding Grooming Brush", model_he: "מברשת טיפוח להסרת פרווה",
    category: "dog-grooming", material: "Stainless Steel", subType: "Grooming Tool",
    basePrice_ILS: 55, basePrice_USD: 15,
    collections: ["dog-products", "care-grooming-collection", "budget-friendly"],
  },
  {
    type: "Pet Care & Accessories", petType: "Dog",
    model: "Nail Clipper Kit", model_he: "ערכת קוצצי ציפורניים",
    category: "dog-grooming", material: "Stainless Steel", subType: "Grooming Tool",
    basePrice_ILS: 45, basePrice_USD: 12,
    collections: ["dog-products", "care-grooming-collection", "budget-friendly"],
  },
  {
    type: "Pet Care & Accessories", petType: "Dog",
    model: "Paw Cleaner Cup", model_he: "כוס ניקוי כפות",
    category: "dog-grooming", material: "Silicone", subType: "Grooming Tool",
    basePrice_ILS: 49, basePrice_USD: 13,
    discount: 0.15,
    collections: ["dog-products", "care-grooming-collection", "budget-friendly", "sale"],
  },
  {
    type: "Pet Care & Accessories", petType: "Dog",
    model: "Training Clicker Set", model_he: "סט קליקר לאילוף",
    category: "dog-collars-leashes", material: "Plastic", subType: "Training",
    basePrice_ILS: 29, basePrice_USD: 8,
    collections: ["dog-products", "care-grooming-collection", "budget-friendly"],
  },
  {
    type: "Pet Care & Accessories", petType: "Dog",
    model: "Reflective Safety Vest", model_he: "אפוד זוהר בטיחותי",
    category: "dog-collars-leashes", material: "Nylon", subType: "Collar",
    basePrice_ILS: 75, basePrice_USD: 20,
    collections: ["dog-products", "care-grooming-collection", "budget-friendly"],
  },

  // ── Dog Smart Tech (3) ───────────────────────────────────────────────────────
  // (Note: these use "Pet Care & Accessories" type as closest match)
];

// Cat Products (20)
export const CAT_PRODUCTS: ProductDefinition[] = [
  // ── Cat Toys (6) ─────────────────────────────────────────────────────────────
  {
    type: "Pet Toys & Enrichment", petType: "Cat",
    model: "Feather Wand Toy", model_he: "שרביט נוצות",
    category: "cat-feather-toys", material: "Natural", subType: "Interactive",
    basePrice_ILS: 35, basePrice_USD: 9,
    collections: ["cat-products", "toys-collection", "budget-friendly", "best-sellers"],
  },
  {
    type: "Pet Toys & Enrichment", petType: "Cat",
    model: "Catnip Mouse 3-Pack", model_he: "עכברי קטניפ (3 יח')",
    category: "cat-catnip-toys", material: "Plush", subType: "Comfort",
    basePrice_ILS: 39, basePrice_USD: 10,
    collections: ["cat-products", "toys-collection", "budget-friendly"],
  },
  {
    type: "Pet Toys & Enrichment", petType: "Cat",
    model: "Automatic Laser Pointer", model_he: "מצביע לייזר אוטומטי",
    category: "cat-laser-electronic", material: "Plastic", subType: "Interactive",
    basePrice_ILS: 89, basePrice_USD: 24,
    collections: ["cat-products", "toys-collection", "featured-products"],
  },
  {
    type: "Pet Toys & Enrichment", petType: "Cat",
    model: "Cardboard Scratcher Lounge", model_he: "מתקן גירוד מקרטון",
    category: "cat-scratchers", material: "Natural", subType: "Chew",
    basePrice_ILS: 59, basePrice_USD: 16,
    collections: ["cat-products", "toys-collection", "budget-friendly", "best-sellers"],
  },
  {
    type: "Pet Toys & Enrichment", petType: "Cat",
    model: "Sisal Scratching Post", model_he: "עמוד גירוד סיזל",
    category: "cat-scratchers", material: "Natural", subType: "Chew",
    basePrice_ILS: 99, basePrice_USD: 27,
    collections: ["cat-products", "toys-collection", "mid-range"],
  },
  {
    type: "Pet Toys & Enrichment", petType: "Cat",
    model: "Interactive Ball Track", model_he: "כדור מסלול אינטראקטיבי",
    category: "cat-laser-electronic", material: "Plastic", subType: "Interactive",
    basePrice_ILS: 65, basePrice_USD: 17,
    collections: ["cat-products", "toys-collection", "budget-friendly", "new-arrivals"],
  },

  // ── Cat Feeding (3) ──────────────────────────────────────────────────────────
  {
    type: "Pet Feeding & Hydration", petType: "Cat",
    model: "Ceramic Bowl Set", model_he: "סט קערות קרמיקה",
    category: "cat-bowls-feeders", material: "Ceramic", subType: "Bowl",
    basePrice_ILS: 79, basePrice_USD: 21,
    collections: ["cat-products", "feeding-collection", "budget-friendly"],
  },
  {
    type: "Pet Feeding & Hydration", petType: "Cat",
    model: "Flower Water Fountain", model_he: "מזרקת מים פרח",
    category: "cat-water-fountains", material: "Plastic", subType: "Fountain",
    basePrice_ILS: 139, basePrice_USD: 37,
    collections: ["cat-products", "feeding-collection", "mid-range", "best-sellers"],
  },
  {
    type: "Pet Feeding & Hydration", petType: "Cat",
    model: "Puzzle Slow Feeder", model_he: "מאכיל איטי פאזל",
    category: "cat-bowls-feeders", material: "Plastic", subType: "Slow Feeder",
    basePrice_ILS: 55, basePrice_USD: 15,
    collections: ["cat-products", "feeding-collection", "budget-friendly"],
  },

  // ── Cat Comfort (5) ──────────────────────────────────────────────────────────
  {
    type: "Pet Comfort & Living", petType: "Cat",
    model: "Multi-Level Cat Tree", model_he: "עץ חתולים רב-קומתי",
    category: "cat-trees-furniture", material: "Wood", subType: "House",
    basePrice_ILS: 399, basePrice_USD: 107,
    collections: ["cat-products", "comfort-collection", "premium-selection", "featured-products"],
  },
  {
    type: "Pet Comfort & Living", petType: "Cat",
    model: "Suction Cup Window Perch", model_he: "מרפסת חלון עם ואקום",
    category: "cat-window-perches", material: "Fabric", subType: "Hammock",
    basePrice_ILS: 89, basePrice_USD: 24,
    collections: ["cat-products", "comfort-collection", "budget-friendly", "best-sellers"],
  },
  {
    type: "Pet Comfort & Living", petType: "Cat",
    model: "Donut Calming Bed", model_he: "מיטת דונאט מרגיעה",
    category: "cat-beds", material: "Fleece", subType: "Bed",
    basePrice_ILS: 119, basePrice_USD: 32,
    collections: ["cat-products", "comfort-collection", "mid-range"],
  },
  {
    type: "Pet Comfort & Living", petType: "Cat",
    model: "Cozy Cat Cave", model_he: "מערת חתול נעימה",
    category: "cat-beds", material: "Fleece", subType: "House",
    basePrice_ILS: 139, basePrice_USD: 37,
    collections: ["cat-products", "comfort-collection", "mid-range", "new-arrivals"],
  },
  {
    type: "Pet Comfort & Living", petType: "Cat",
    model: "Self-Warming Heated Pad", model_he: "מזרן חימום עצמי",
    category: "cat-beds", material: "Fabric", subType: "Bed",
    basePrice_ILS: 109, basePrice_USD: 29,
    discount: 0.20,
    collections: ["cat-products", "comfort-collection", "mid-range", "sale"],
  },

  // ── Cat Care (4) ─────────────────────────────────────────────────────────────
  {
    type: "Pet Care & Accessories", petType: "Cat",
    model: "Breakaway Safety Collar", model_he: "קולר בטיחותי נפתח",
    category: "cat-collars-id", material: "Nylon", subType: "Collar",
    basePrice_ILS: 35, basePrice_USD: 9,
    collections: ["cat-products", "care-grooming-collection", "budget-friendly"],
  },
  {
    type: "Pet Care & Accessories", petType: "Cat",
    model: "Self-Grooming Brush Arch", model_he: "קשת טיפוח עצמי",
    category: "cat-grooming", material: "Plastic", subType: "Grooming Tool",
    basePrice_ILS: 49, basePrice_USD: 13,
    collections: ["cat-products", "care-grooming-collection", "budget-friendly"],
  },
  {
    type: "Pet Care & Accessories", petType: "Cat",
    model: "Grooming Glove", model_he: "כפפת טיפוח",
    category: "cat-grooming", material: "Rubber", subType: "Grooming Tool",
    basePrice_ILS: 39, basePrice_USD: 10,
    discount: 0.25,
    collections: ["cat-products", "care-grooming-collection", "budget-friendly", "sale"],
  },
  {
    type: "Pet Care & Accessories", petType: "Cat",
    model: "Litter Trapping Mat", model_he: "שטיח לכידת חול",
    category: "cat-litter", material: "Rubber", subType: "Health",
    basePrice_ILS: 69, basePrice_USD: 18,
    collections: ["cat-products", "care-grooming-collection", "budget-friendly"],
  },

  // ── Cat Enrichment (2) ───────────────────────────────────────────────────────
  {
    type: "Pet Toys & Enrichment", petType: "Cat",
    model: "Collapsible Tunnel Tube", model_he: "מנהרת משחק מתקפלת",
    category: "cat-feather-toys", material: "Plastic", subType: "Interactive",
    basePrice_ILS: 55, basePrice_USD: 15,
    collections: ["cat-products", "toys-collection", "budget-friendly"],
  },
  {
    type: "Pet Comfort & Living", petType: "Cat",
    model: "Radiator Hammock", model_he: "ערסל לרדיאטור",
    category: "cat-window-perches", material: "Fleece", subType: "Hammock",
    basePrice_ILS: 79, basePrice_USD: 21,
    collections: ["cat-products", "comfort-collection", "budget-friendly"],
  },
];

export const ALL_PRODUCTS = [
  ...DOG_PRODUCTS,
  ...CAT_PRODUCTS,
];
