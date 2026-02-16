export interface Category {
  name_he: string;
  name_en: string;
  slug: string;
  parent?: string;
  description_he?: string;
  description_en?: string;
  seoTitle_he?: string;
  seoTitle_en?: string;
}

export const CATEGORIES: Category[] = [
  // ── L1: Gender Roots (3) ──────────────────────────────────────────────────
  {
    name_he: "גברים", name_en: "Men", slug: "men",
    description_he: "נעליים וביגוד ספורט לגברים מהמותגים המובילים",
    description_en: "Men's shoes and sportswear from leading brands",
    seoTitle_he: "גברים - מנסור שוז", seoTitle_en: "Men - Mansour Shoes",
  },
  {
    name_he: "נשים", name_en: "Women", slug: "women",
    description_he: "נעליים וביגוד ספורט לנשים מהמותגים המובילים",
    description_en: "Women's shoes and sportswear from leading brands",
    seoTitle_he: "נשים - מנסור שוז", seoTitle_en: "Women - Mansour Shoes",
  },
  {
    name_he: "ילדים", name_en: "Kids", slug: "kids",
    description_he: "נעליים וביגוד ספורט לילדים מהמותגים המובילים",
    description_en: "Kids' shoes and sportswear from leading brands",
    seoTitle_he: "ילדים - מנסור שוז", seoTitle_en: "Kids - Mansour Shoes",
  },

  // ── L2: Product Type (8) ──────────────────────────────────────────────────

  // Men
  {
    name_he: "נעליים", name_en: "Shoes", slug: "men-shoes", parent: "men",
    description_he: "נעליים לגברים - ריצה, אימון, כדורגל, יומיומי ועוד",
    description_en: "Men's shoes - running, training, soccer, casual and more",
    seoTitle_he: "נעליים לגברים - מנסור שוז", seoTitle_en: "Men's Shoes - Mansour Shoes",
  },
  {
    name_he: "ביגוד עליון", name_en: "Tops", slug: "men-tops", parent: "men",
    description_he: "חולצות, קפוצ'ונים וג'קטים לגברים",
    description_en: "Men's t-shirts, hoodies and jackets",
    seoTitle_he: "ביגוד עליון לגברים - מנסור שוז", seoTitle_en: "Men's Tops - Mansour Shoes",
  },
  {
    name_he: "מכנסיים", name_en: "Bottoms", slug: "men-bottoms", parent: "men",
    description_he: "מכנסי ספורט, שורטים וטרנינגים לגברים",
    description_en: "Men's sport pants, shorts and joggers",
    seoTitle_he: "מכנסיים לגברים - מנסור שוז", seoTitle_en: "Men's Bottoms - Mansour Shoes",
  },

  // Women
  {
    name_he: "נעליים", name_en: "Shoes", slug: "women-shoes", parent: "women",
    description_he: "נעליים לנשים - ריצה, אימון, יומיומי, נוחות ועוד",
    description_en: "Women's shoes - running, training, casual, comfort and more",
    seoTitle_he: "נעליים לנשים - מנסור שוז", seoTitle_en: "Women's Shoes - Mansour Shoes",
  },
  {
    name_he: "ביגוד עליון", name_en: "Tops", slug: "women-tops", parent: "women",
    description_he: "חולצות, קפוצ'ונים וג'קטים לנשים",
    description_en: "Women's t-shirts, hoodies and jackets",
    seoTitle_he: "ביגוד עליון לנשים - מנסור שוז", seoTitle_en: "Women's Tops - Mansour Shoes",
  },
  {
    name_he: "מכנסיים ולגינסים", name_en: "Bottoms & Leggings", slug: "women-bottoms", parent: "women",
    description_he: "מכנסי ספורט, לגינסים ושורטים לנשים",
    description_en: "Women's sport pants, leggings and shorts",
    seoTitle_he: "מכנסיים ולגינסים לנשים - מנסור שוז", seoTitle_en: "Women's Bottoms - Mansour Shoes",
  },

  // Kids
  {
    name_he: "נעליים", name_en: "Shoes", slug: "kids-shoes", parent: "kids",
    description_he: "נעליים לילדים - ספורט, יומיומי, סנדלים ועוד",
    description_en: "Kids' shoes - sport, casual, sandals and more",
    seoTitle_he: "נעליים לילדים - מנסור שוז", seoTitle_en: "Kids' Shoes - Mansour Shoes",
  },
  {
    name_he: "ביגוד", name_en: "Clothing", slug: "kids-clothing", parent: "kids",
    description_he: "ביגוד ספורט לילדים - חולצות, מכנסיים ועוד",
    description_en: "Kids' sportswear - tops, bottoms and more",
    seoTitle_he: "ביגוד לילדים - מנסור שוז", seoTitle_en: "Kids' Clothing - Mansour Shoes",
  },

  // ── L3: Men's Shoes (7) ───────────────────────────────────────────────────
  {
    name_he: "נעלי ריצה", name_en: "Running Shoes", slug: "men-running-shoes", parent: "men-shoes",
    description_he: "נעלי ריצה לגברים מ-Nike, Adidas, ASICS ועוד",
    description_en: "Men's running shoes from Nike, Adidas, ASICS and more",
    seoTitle_he: "נעלי ריצה לגברים - מנסור שוז", seoTitle_en: "Men's Running Shoes - Mansour Shoes",
  },
  {
    name_he: "נעלי אימון", name_en: "Training Shoes", slug: "men-training-shoes", parent: "men-shoes",
    description_he: "נעלי אימון וחדר כושר לגברים",
    description_en: "Men's training and gym shoes",
    seoTitle_he: "נעלי אימון לגברים - מנסור שוז", seoTitle_en: "Men's Training Shoes - Mansour Shoes",
  },
  {
    name_he: "נעלי כדורגל", name_en: "Soccer Shoes", slug: "men-soccer-shoes", parent: "men-shoes",
    description_he: "נעלי כדורגל וקטרגל לגברים מ-Nike ו-Adidas",
    description_en: "Men's soccer and futsal shoes from Nike and Adidas",
    seoTitle_he: "נעלי כדורגל לגברים - מנסור שוז", seoTitle_en: "Men's Soccer Shoes - Mansour Shoes",
  },
  {
    name_he: "נעלי יומיום ואופנה", name_en: "Casual & Fashion", slug: "men-casual-shoes", parent: "men-shoes",
    description_he: "נעלי אופנה ויומיום לגברים - סניקרס וקז'ואל",
    description_en: "Men's casual and fashion sneakers",
    seoTitle_he: "נעלי אופנה לגברים - מנסור שוז", seoTitle_en: "Men's Casual Shoes - Mansour Shoes",
  },
  {
    name_he: "נעלי הליכה ונוחות", name_en: "Walking & Comfort", slug: "men-walking-comfort", parent: "men-shoes",
    description_he: "נעלי הליכה ונוחות לגברים - Skechers, Lady Comfort ועוד",
    description_en: "Men's walking and comfort shoes",
    seoTitle_he: "נעלי הליכה לגברים - מנסור שוז", seoTitle_en: "Men's Walking Shoes - Mansour Shoes",
  },
  {
    name_he: "סנדלים וכפכפים", name_en: "Sandals & Slides", slug: "men-sandals-slides", parent: "men-shoes",
    description_he: "סנדלים וכפכפים לגברים",
    description_en: "Men's sandals and slides",
    seoTitle_he: "סנדלים לגברים - מנסור שוז", seoTitle_en: "Men's Sandals - Mansour Shoes",
  },
  {
    name_he: "מגפיים ונעלי חורף", name_en: "Boots & Winter", slug: "men-boots-winter", parent: "men-shoes",
    description_he: "מגפיים ונעלי חורף לגברים",
    description_en: "Men's boots and winter shoes",
    seoTitle_he: "מגפיים לגברים - מנסור שוז", seoTitle_en: "Men's Boots - Mansour Shoes",
  },

  // ── L3: Women's Shoes (6) ─────────────────────────────────────────────────
  {
    name_he: "נעלי ריצה", name_en: "Running Shoes", slug: "women-running-shoes", parent: "women-shoes",
    description_he: "נעלי ריצה לנשים מ-Nike, Adidas, ASICS ועוד",
    description_en: "Women's running shoes from Nike, Adidas, ASICS and more",
    seoTitle_he: "נעלי ריצה לנשים - מנסור שוז", seoTitle_en: "Women's Running Shoes - Mansour Shoes",
  },
  {
    name_he: "נעלי אימון", name_en: "Training Shoes", slug: "women-training-shoes", parent: "women-shoes",
    description_he: "נעלי אימון וחדר כושר לנשים",
    description_en: "Women's training and gym shoes",
    seoTitle_he: "נעלי אימון לנשים - מנסור שוז", seoTitle_en: "Women's Training Shoes - Mansour Shoes",
  },
  {
    name_he: "נעלי יומיום ואופנה", name_en: "Casual & Fashion", slug: "women-casual-shoes", parent: "women-shoes",
    description_he: "נעלי אופנה ויומיום לנשים - סניקרס וקז'ואל",
    description_en: "Women's casual and fashion sneakers",
    seoTitle_he: "נעלי אופנה לנשים - מנסור שוז", seoTitle_en: "Women's Casual Shoes - Mansour Shoes",
  },
  {
    name_he: "נעלי הליכה ונוחות", name_en: "Walking & Comfort", slug: "women-walking-comfort", parent: "women-shoes",
    description_he: "נעלי הליכה ונוחות לנשים - Skechers, Lady Comfort ועוד",
    description_en: "Women's walking and comfort shoes",
    seoTitle_he: "נעלי הליכה לנשים - מנסור שוז", seoTitle_en: "Women's Walking Shoes - Mansour Shoes",
  },
  {
    name_he: "סנדלים וכפכפים", name_en: "Sandals & Slides", slug: "women-sandals-slides", parent: "women-shoes",
    description_he: "סנדלים וכפכפים לנשים",
    description_en: "Women's sandals and slides",
    seoTitle_he: "סנדלים לנשים - מנסור שוז", seoTitle_en: "Women's Sandals - Mansour Shoes",
  },
  {
    name_he: "מגפיים ונעלי חורף", name_en: "Boots & Winter", slug: "women-boots-winter", parent: "women-shoes",
    description_he: "מגפיים ונעלי חורף לנשים",
    description_en: "Women's boots and winter shoes",
    seoTitle_he: "מגפיים לנשים - מנסור שוז", seoTitle_en: "Women's Boots - Mansour Shoes",
  },

  // ── L3: Kids' Shoes (3) ───────────────────────────────────────────────────
  {
    name_he: "נעלי ספורט", name_en: "Sport Shoes", slug: "kids-sport-shoes", parent: "kids-shoes",
    description_he: "נעלי ספורט לילדים - ריצה, אימון ופעילות",
    description_en: "Kids' sport shoes - running, training and active",
    seoTitle_he: "נעלי ספורט לילדים - מנסור שוז", seoTitle_en: "Kids' Sport Shoes - Mansour Shoes",
  },
  {
    name_he: "נעלי יומיום", name_en: "Casual Shoes", slug: "kids-casual-shoes", parent: "kids-shoes",
    description_he: "נעלי יומיום ובית ספר לילדים",
    description_en: "Kids' casual and school shoes",
    seoTitle_he: "נעלי יומיום לילדים - מנסור שוז", seoTitle_en: "Kids' Casual Shoes - Mansour Shoes",
  },
  {
    name_he: "סנדלים וכפכפים", name_en: "Sandals & Slides", slug: "kids-sandals-slides", parent: "kids-shoes",
    description_he: "סנדלים וכפכפים לילדים",
    description_en: "Kids' sandals and slides",
    seoTitle_he: "סנדלים לילדים - מנסור שוז", seoTitle_en: "Kids' Sandals - Mansour Shoes",
  },
];
