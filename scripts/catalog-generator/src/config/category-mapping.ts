// ============================================================================
// Category Mapping Module
// Maps raw istores product data to clean category slugs via multi-signal cascade
// ============================================================================

// ── Activity detection keywords ─────────────────────────────────────────────
// Searched in: category path, product name, filter column (case-insensitive)

// Specific activity keywords — checked first in priority order
export const ACTIVITY_KEYWORDS: Record<string, string[]> = {
  soccer: [
    "כדורגל", "קטרגל", "soccer", "football", "mercurial", "predator",
    "phantom gx", "copa pure", "tiempo", "x speed", "mundial",
    "academy fg", "academy mg", "elite fg",
  ],
  "sandals-slides": [
    "כפכפ", "סנדל", "sandal", "slide", "flip flop", "כפכף",
    "שלאפ", "נעלי בית",
  ],
  "boots-winter": [
    "מגפ", "חורף", "boot", "winter", "waterproof", "trek",
    "hike", "hiking", "gore-tex", "gtx", "שלג",
  ],
  running: [
    // Hebrew
    "ריצה",
    // English generic
    "running", "run ",
    // Nike running models
    "pegasus", "zoom fly", "vomero", "invincible", "infinity",
    "downshifter", "revolution", "winflo", "structure",
    "air max 270", "air max 90",
    // Adidas running models
    "ultraboost", "supernova", "duramo", "solar glide", "solar boost",
    "adizero", "response", "runfalcon", "questar",
    // ASICS running models
    "gel-cumulus", "gel-kayano", "gel-nimbus", "gt-2000", "gt-1000",
    "gel-excite", "gel-contend", "gel-pulse", "gel-venture",
    "novablast", "magic speed",
    // Under Armour running models
    "hovr phantom", "hovr sonic", "hovr infinite", "hovr machina",
    "charged bandit", "charged rogue", "charged pursuit",
    // Puma running models
    "velocity nitro", "deviate nitro", "magnify nitro",
    // Salomon running models
    "speedcross", "sense ride", "xa pro",
    // Reebok running
    "floatride", "forever floatride",
    // Skechers running models
    "gorun", "go run", "max road",
  ],
  training: [
    // Hebrew
    "אימון", "כושר",
    // English generic
    "training", "trainer", "gym",
    // Nike training models
    "metcon", "free x metcon", "superrep", "renew in-season",
    "legend essential", "mc trainer",
    // Adidas training models
    "dropset", "alphaboost", "gamecourt", "crazyflight",
    "powerlift", "adipower",
    // Under Armour training
    "charged assert", "charged commit", "tribase reign",
    "project rock",
    // Reebok training
    "nano x", "nano ", "flexagon",
    // Puma training
    "cell", "axelion",
  ],
  "walking-comfort": [
    // Hebrew
    "הליכה", "נוחות",
    // English generic
    "walking", "comfort", "walk ",
    // Skechers walking/comfort models
    "go walk", "d'lites", "d lites", "arch fit", "relaxed fit",
    "max cushioning", "equalizer", "summits", "flex appeal",
    "bobs", "gratis", "breathe easy",
    // Lady Comfort
    "lady comfort", "לידי קומפורט",
  ],
};

// Casual keywords — only checked AFTER brand defaults (separate from activity keywords)
export const CASUAL_KEYWORDS = [
  "אופנה", "יומיומי", "casual", "fashion", "air force",
  "stan smith", "superstar", "court vision", "club c",
  "suede classic", "gel-lyte", "forum", "gazelle",
  "אירועים", "סניקרס", "sneaker",
];

// ── Brand defaults (when no specific activity keyword found) ─────────────

export const BRAND_ACTIVITY_DEFAULTS: Record<string, string> = {
  "Nike": "running",           // Generic Nike sport shoes → running (specific models override)
  "Adidas": "running",         // Generic Adidas sport shoes → running (specific models override)
  "Under Armour": "running",
  "ASICS": "running",
  "Salomon": "running",
  "Skechers": "walking-comfort",
  "Lady Comfort": "walking-comfort",
  "Reebok": "training",
  "Puma": "running",
  "Diadora": "casual",
};

// ── Gender detection ────────────────────────────────────────────────────────

export function detectGender(categoryPath: string): "men" | "women" | "kids" {
  const p = categoryPath.toLowerCase();
  if (p.startsWith("גברים")) return "men";
  if (p.startsWith("נשים")) return "women";
  if (
    p.includes("ילדים") || p.includes("ילדות") ||
    p.includes("בנים") || p.includes("בנות") ||
    p.startsWith("kids")
  ) return "kids";
  return "men";
}

// ── Activity detection (multi-signal cascade) ───────────────────────────────
//
// Detection order:
//   1. Specific activity keywords (soccer, sandals, boots, running, training, walking)
//   2. Casual keywords (fashion model names like Air Force 1, Stan Smith)
//   3. Brand defaults (Nike→running, Skechers→walking, ASICS→running, etc.)
//   4. Ultimate fallback → casual

export function detectActivity(
  name: string,
  categoryPath: string,
  filters: string,
  brand: string,
): string {
  const combined = `${categoryPath} ${name} ${filters}`.toLowerCase();

  // Step 1: Check specific activity keywords (high → low priority)
  const priorityOrder = [
    "soccer",
    "sandals-slides",
    "boots-winter",
    "running",
    "training",
    "walking-comfort",
  ];

  for (const activity of priorityOrder) {
    const keywords = ACTIVITY_KEYWORDS[activity];
    if (keywords.some(kw => combined.includes(kw.toLowerCase()))) {
      return activity;
    }
  }

  // Step 2: Check casual keywords (specific fashion/casual models)
  // This runs BEFORE brand defaults so Nike Air Force 1 → casual, not running
  if (CASUAL_KEYWORDS.some(kw => combined.includes(kw.toLowerCase()))) {
    return "casual";
  }

  // Step 3: Brand defaults for generic products without model keywords
  if (brand && BRAND_ACTIVITY_DEFAULTS[brand]) {
    return BRAND_ACTIVITY_DEFAULTS[brand];
  }

  // Step 4: Ultimate fallback
  return "casual";
}

// ── Main mapping function ───────────────────────────────────────────────────

export function mapToCategory(
  product: {
    name: string;
    categoryPath: string;
    filters: string;
    brand: string;
  },
  productType: string,
): string {
  const gender = detectGender(product.categoryPath);

  // Non-shoe product types → L2 category (no L3 subcategories)
  if (productType === "Tops") {
    return gender === "kids" ? "kids-clothing" : `${gender}-tops`;
  }
  if (productType === "Bottoms") {
    return gender === "kids" ? "kids-clothing" : `${gender}-bottoms`;
  }
  if (productType === "Accessories") {
    return gender === "kids" ? "kids-clothing" : `${gender}-tops`;
  }

  // Shoes → detect activity for L3
  const activity = detectActivity(
    product.name,
    product.categoryPath,
    product.filters,
    product.brand,
  );

  // Kids have simplified shoe categories
  if (gender === "kids") {
    if (activity === "sandals-slides") return "kids-sandals-slides";
    if (activity === "casual") return "kids-casual-shoes";
    return "kids-sport-shoes";
  }

  // Men/Women → full activity mapping
  const slugMap: Record<string, string> = {
    "running": `${gender}-running-shoes`,
    "training": `${gender}-training-shoes`,
    "soccer": `${gender}-soccer-shoes`,
    "casual": `${gender}-casual-shoes`,
    "walking-comfort": `${gender}-walking-comfort`,
    "sandals-slides": `${gender}-sandals-slides`,
    "boots-winter": `${gender}-boots-winter`,
  };

  // Women don't have soccer subcategory — map to training
  if (gender === "women" && activity === "soccer") {
    return "women-training-shoes";
  }

  return slugMap[activity] || `${gender}-casual-shoes`;
}

// ── Valid category slugs (for validation) ───────────────────────────────────

export const VALID_CATEGORY_SLUGS = new Set([
  "men", "women", "kids",
  "men-shoes", "men-tops", "men-bottoms",
  "women-shoes", "women-tops", "women-bottoms",
  "kids-shoes", "kids-clothing",
  "men-running-shoes", "men-training-shoes", "men-soccer-shoes",
  "men-casual-shoes", "men-walking-comfort", "men-sandals-slides",
  "men-boots-winter",
  "women-running-shoes", "women-training-shoes",
  "women-casual-shoes", "women-walking-comfort", "women-sandals-slides",
  "women-boots-winter",
  "kids-sport-shoes", "kids-casual-shoes", "kids-sandals-slides",
]);
