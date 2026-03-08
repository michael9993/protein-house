export interface Collection {
  name_he: string;
  name_en: string;
  slug: string;
  description_he?: string;
  description_en?: string;
  type: "pet" | "category" | "price" | "curated" | "special";
}

export const COLLECTIONS: Collection[] = [
  // ── By Pet (2) ───────────────────────────────────────────────────────────────
  {
    name_he: "מוצרים לכלבים", name_en: "Dog Products", slug: "dog-products", type: "pet",
    description_he: "כל המוצרים לכלבים ב-Pawzen",
    description_en: "All dog products at Pawzen",
  },
  {
    name_he: "מוצרים לחתולים", name_en: "Cat Products", slug: "cat-products", type: "pet",
    description_he: "כל המוצרים לחתולים ב-Pawzen",
    description_en: "All cat products at Pawzen",
  },

  // ── By Category (5) ─────────────────────────────────────────────────────────
  {
    name_he: "צעצועים", name_en: "Toys", slug: "toys-collection", type: "category",
    description_he: "כל הצעצועים לכלבים ולחתולים",
    description_en: "All toys for dogs and cats",
  },
  {
    name_he: "האכלה", name_en: "Feeding", slug: "feeding-collection", type: "category",
    description_he: "קערות, מזרקות מים ומאכילים",
    description_en: "Bowls, water fountains and feeders",
  },
  {
    name_he: "נוחות", name_en: "Comfort", slug: "comfort-collection", type: "category",
    description_he: "מיטות, שמיכות, ביגוד ונשאים",
    description_en: "Beds, blankets, clothing and carriers",
  },
  {
    name_he: "טיפוח", name_en: "Care & Grooming", slug: "care-grooming-collection", type: "category",
    description_he: "קולרים, רצועות, כלי טיפוח ומוצרי בריאות",
    description_en: "Collars, leashes, grooming tools and health products",
  },
  {
    name_he: "טכנולוגיה חכמה", name_en: "Smart Tech", slug: "smart-tech-collection", type: "category",
    description_he: "GPS, מאכילים אוטומטיים ומצלמות",
    description_en: "GPS trackers, auto feeders and pet cameras",
  },

  // ── By Price (3) ─────────────────────────────────────────────────────────────
  {
    name_he: "עד 100 ש\"ח", name_en: "Under 25 USD", slug: "budget-friendly", type: "price",
    description_he: "מוצרים במחירים נגישים עד 100 ש\"ח",
    description_en: "Affordable products under $25",
  },
  {
    name_he: "100-250 ש\"ח", name_en: "Mid Range", slug: "mid-range", type: "price",
    description_he: "מוצרים באיכות מעולה ב-100 עד 250 ש\"ח",
    description_en: "Great quality products between $25-$65",
  },
  {
    name_he: "פרימיום 250+ ש\"ח", name_en: "Premium Selection", slug: "premium-selection", type: "price",
    description_he: "מוצרי פרימיום מעל 250 ש\"ח",
    description_en: "Premium products above $65",
  },

  // ── Curated (4) ──────────────────────────────────────────────────────────────
  {
    name_he: "חדשים", name_en: "New Arrivals", slug: "new-arrivals", type: "curated",
    description_he: "מוצרים חדשים שנוספו לאחרונה",
    description_en: "Recently added new products",
  },
  {
    name_he: "הנמכרים ביותר", name_en: "Best Sellers", slug: "best-sellers", type: "curated",
    description_he: "המוצרים הנמכרים ביותר",
    description_en: "Our top selling products",
  },
  {
    name_he: "מומלצים", name_en: "Featured Products", slug: "featured-products", type: "curated",
    description_he: "המוצרים המומלצים שלנו",
    description_en: "Our featured selection",
  },
  {
    name_he: "מבצעים", name_en: "Sale", slug: "sale", type: "curated",
    description_he: "מוצרים במבצע והנחות מיוחדות",
    description_en: "Discounted products and special offers",
  },

  // ── Special (2) ──────────────────────────────────────────────────────────────
  {
    name_he: "קיץ וקירור", name_en: "Cooling & Summer", slug: "cooling-summer", type: "special",
    description_he: "מוצרי קיץ וקירור לחיות מחמד",
    description_en: "Summer and cooling products for pets",
  },
  {
    name_he: "סטים למתנה", name_en: "Gift Sets", slug: "gift-sets", type: "special",
    description_he: "סטים מושלמים למתנה לבעלי חיות מחמד",
    description_en: "Perfect gift sets for pet owners",
  },
];
