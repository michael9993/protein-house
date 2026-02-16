export interface Collection {
  name_he: string;
  name_en: string;
  slug: string;
  description_he?: string;
  description_en?: string;
  type: "brand" | "gender" | "activity" | "price" | "curated" | "special";
}

export const COLLECTIONS: Collection[] = [
  // ── Brand Collections (10) ────────────────────────────────────────────────
  {
    name_he: "Nike", name_en: "Nike", slug: "nike", type: "brand",
    description_he: "כל מוצרי Nike במנסור שוז",
    description_en: "All Nike products at Mansour Shoes",
  },
  {
    name_he: "Adidas", name_en: "Adidas", slug: "adidas", type: "brand",
    description_he: "כל מוצרי Adidas במנסור שוז",
    description_en: "All Adidas products at Mansour Shoes",
  },
  {
    name_he: "Under Armour", name_en: "Under Armour", slug: "under-armour", type: "brand",
    description_he: "כל מוצרי Under Armour במנסור שוז",
    description_en: "All Under Armour products at Mansour Shoes",
  },
  {
    name_he: "Skechers", name_en: "Skechers", slug: "skechers", type: "brand",
    description_he: "כל מוצרי Skechers במנסור שוז",
    description_en: "All Skechers products at Mansour Shoes",
  },
  {
    name_he: "Lady Comfort", name_en: "Lady Comfort", slug: "lady-comfort", type: "brand",
    description_he: "כל מוצרי Lady Comfort במנסור שוז",
    description_en: "All Lady Comfort products at Mansour Shoes",
  },
  {
    name_he: "Reebok", name_en: "Reebok", slug: "reebok", type: "brand",
    description_he: "כל מוצרי Reebok במנסור שוז",
    description_en: "All Reebok products at Mansour Shoes",
  },
  {
    name_he: "Diadora", name_en: "Diadora", slug: "diadora", type: "brand",
    description_he: "כל מוצרי Diadora במנסור שוז",
    description_en: "All Diadora products at Mansour Shoes",
  },
  {
    name_he: "ASICS", name_en: "ASICS", slug: "asics", type: "brand",
    description_he: "כל מוצרי ASICS במנסור שוז",
    description_en: "All ASICS products at Mansour Shoes",
  },
  {
    name_he: "Puma", name_en: "Puma", slug: "puma", type: "brand",
    description_he: "כל מוצרי Puma במנסור שוז",
    description_en: "All Puma products at Mansour Shoes",
  },
  {
    name_he: "Salomon", name_en: "Salomon", slug: "salomon", type: "brand",
    description_he: "כל מוצרי Salomon במנסור שוז",
    description_en: "All Salomon products at Mansour Shoes",
  },

  // ── Gender Segments (3) ───────────────────────────────────────────────────
  {
    name_he: "קולקציית גברים", name_en: "Men's Collection", slug: "mens-collection", type: "gender",
    description_he: "כל המוצרים לגברים",
    description_en: "All men's products",
  },
  {
    name_he: "קולקציית נשים", name_en: "Women's Collection", slug: "womens-collection", type: "gender",
    description_he: "כל המוצרים לנשים",
    description_en: "All women's products",
  },
  {
    name_he: "קולקציית ילדים", name_en: "Kids Collection", slug: "kids-collection", type: "gender",
    description_he: "כל המוצרים לילדים",
    description_en: "All kids' products",
  },

  // ── Activity Collections (6) ──────────────────────────────────────────────
  {
    name_he: "ריצה", name_en: "Running Essentials", slug: "running-essentials", type: "activity",
    description_he: "נעליים וציוד ריצה מהמותגים המובילים",
    description_en: "Running shoes and gear from top brands",
  },
  {
    name_he: "אימון וכושר", name_en: "Training & Fitness", slug: "training-gear", type: "activity",
    description_he: "נעליים וביגוד לאימון וחדר כושר",
    description_en: "Training shoes and apparel for the gym",
  },
  {
    name_he: "כדורגל", name_en: "Soccer Gear", slug: "soccer-gear", type: "activity",
    description_he: "נעלי כדורגל וקטרגל",
    description_en: "Soccer and futsal shoes",
  },
  {
    name_he: "אופנה יומיומית", name_en: "Casual Style", slug: "casual-style", type: "activity",
    description_he: "סניקרס ונעלי אופנה לכל יום",
    description_en: "Everyday sneakers and casual footwear",
  },
  {
    name_he: "הליכה ונוחות", name_en: "Walking & Comfort", slug: "walking-comfort-collection", type: "activity",
    description_he: "נעלי הליכה ונוחות לכל היום",
    description_en: "Walking and comfort shoes for all-day wear",
  },
  {
    name_he: "חורף", name_en: "Winter Collection", slug: "winter-collection", type: "activity",
    description_he: "מגפיים ונעלי חורף חמות ועמידות",
    description_en: "Warm and durable winter boots and shoes",
  },

  // ── Price-Based (3) ───────────────────────────────────────────────────────
  {
    name_he: "עד ₪200", name_en: "Under 200", slug: "under-200", type: "price",
    description_he: "מוצרים במחירים נגישים עד ₪200",
    description_en: "Affordable products under 200",
  },
  {
    name_he: "₪200-₪350", name_en: "200-350 Range", slug: "mid-range", type: "price",
    description_he: "מוצרים באיכות מעולה ב-₪200 עד ₪350",
    description_en: "Great quality products between 200-350",
  },
  {
    name_he: "פרימיום", name_en: "Premium Selection", slug: "premium-selection", type: "price",
    description_he: "מוצרי פרימיום מעל ₪350",
    description_en: "Premium products above 350",
  },

  // ── Curated / Homepage (4) ────────────────────────────────────────────────
  {
    name_he: "חדש באתר", name_en: "New Arrivals", slug: "new-arrivals", type: "curated",
    description_he: "מוצרים חדשים שנוספו לאחרונה",
    description_en: "Recently added new products",
  },
  {
    name_he: "רבי מכר", name_en: "Best Sellers", slug: "best-sellers", type: "curated",
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

  // ── Special (2) ───────────────────────────────────────────────────────────
  {
    name_he: "נעלי בית ספר", name_en: "School Shoes", slug: "school-shoes", type: "special",
    description_he: "נעליים מתאימות לבית ספר",
    description_en: "School-appropriate footwear",
  },
  {
    name_he: "נעלי עבודה", name_en: "Work Shoes", slug: "work-shoes", type: "special",
    description_he: "נעליים מקצועיות ונוחות לעבודה",
    description_en: "Professional and comfortable work shoes",
  },
];
