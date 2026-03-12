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
  // ── L1: Pet Roots (2) ──────────────────────────────────────────────────────
  {
    name_he: "כלבים", name_en: "Dogs", slug: "dogs",
    description_he: "כל המוצרים לכלבים - צעצועים, מזון, נוחות וטיפוח",
    description_en: "Everything for dogs - toys, feeding, comfort and care",
    seoTitle_he: "מוצרים לכלבים - Pawzen", seoTitle_en: "Dog Products - Pawzen",
  },
  {
    name_he: "חתולים", name_en: "Cats", slug: "cats",
    description_he: "כל המוצרים לחתולים - צעצועים, מזון, נוחות וטיפוח",
    description_en: "Everything for cats - toys, feeding, comfort and care",
    seoTitle_he: "מוצרים לחתולים - Pawzen", seoTitle_en: "Cat Products - Pawzen",
  },

  // ── L2: Dog Categories (5) ─────────────────────────────────────────────────
  {
    name_he: "צעצועים לכלבים", name_en: "Dog Toys", slug: "dog-toys", parent: "dogs",
    description_he: "צעצועים לכלבים - לעיסה, אינטראקטיביים, משיכה ופאזלים",
    description_en: "Dog toys - chew, interactive, fetch and puzzle toys",
    seoTitle_he: "צעצועים לכלבים - Pawzen", seoTitle_en: "Dog Toys - Pawzen",
  },
  {
    name_he: "האכלה לכלבים", name_en: "Dog Feeding", slug: "dog-feeding", parent: "dogs",
    description_he: "קערות, מזרקות מים ומאכילים לכלבים",
    description_en: "Dog bowls, water fountains and feeders",
    seoTitle_he: "האכלה לכלבים - Pawzen", seoTitle_en: "Dog Feeding - Pawzen",
  },
  {
    name_he: "נוחות לכלבים", name_en: "Dog Comfort", slug: "dog-comfort", parent: "dogs",
    description_he: "מיטות, שמיכות, ביגוד ונשאים לכלבים",
    description_en: "Dog beds, blankets, clothing and carriers",
    seoTitle_he: "נוחות לכלבים - Pawzen", seoTitle_en: "Dog Comfort - Pawzen",
  },
  {
    name_he: "טיפוח לכלבים", name_en: "Dog Care", slug: "dog-care", parent: "dogs",
    description_he: "קולרים, רצועות, רתמות וכלי טיפוח לכלבים",
    description_en: "Dog collars, leashes, harnesses and grooming tools",
    seoTitle_he: "טיפוח לכלבים - Pawzen", seoTitle_en: "Dog Care - Pawzen",
  },
  {
    name_he: "טכנולוגיה לכלבים", name_en: "Dog Smart Tech", slug: "dog-smart-tech", parent: "dogs",
    description_he: "מעקב GPS, מאכילים אוטומטיים ומצלמות לחיות מחמד",
    description_en: "GPS trackers, auto feeders and pet cameras",
    seoTitle_he: "טכנולוגיה לכלבים - Pawzen", seoTitle_en: "Dog Smart Tech - Pawzen",
  },

  // ── L2: Cat Categories (5) ─────────────────────────────────────────────────
  {
    name_he: "צעצועים לחתולים", name_en: "Cat Toys", slug: "cat-toys", parent: "cats",
    description_he: "צעצועים לחתולים - נוצות, לייזר, קטניפ ומתקני גירוד",
    description_en: "Cat toys - feather, laser, catnip and scratchers",
    seoTitle_he: "צעצועים לחתולים - Pawzen", seoTitle_en: "Cat Toys - Pawzen",
  },
  {
    name_he: "האכלה לחתולים", name_en: "Cat Feeding", slug: "cat-feeding", parent: "cats",
    description_he: "קערות, מזרקות מים ומאכילים לחתולים",
    description_en: "Cat bowls, water fountains and feeders",
    seoTitle_he: "האכלה לחתולים - Pawzen", seoTitle_en: "Cat Feeding - Pawzen",
  },
  {
    name_he: "נוחות לחתולים", name_en: "Cat Comfort", slug: "cat-comfort", parent: "cats",
    description_he: "מיטות, עצי חתולים, מרפסות חלון וארגזי חול",
    description_en: "Cat beds, trees, window perches and litter accessories",
    seoTitle_he: "נוחות לחתולים - Pawzen", seoTitle_en: "Cat Comfort - Pawzen",
  },
  {
    name_he: "טיפוח לחתולים", name_en: "Cat Care", slug: "cat-care", parent: "cats",
    description_he: "קולרים, כלי טיפוח ומוצרי בריאות לחתולים",
    description_en: "Cat collars, grooming tools and health products",
    seoTitle_he: "טיפוח לחתולים - Pawzen", seoTitle_en: "Cat Care - Pawzen",
  },
  {
    name_he: "טכנולוגיה לחתולים", name_en: "Cat Smart Tech", slug: "cat-smart-tech", parent: "cats",
    description_he: "ארגזי חול אוטומטיים ומאכילים חכמים לחתולים",
    description_en: "Automatic litter boxes and smart feeders for cats",
    seoTitle_he: "טכנולוגיה לחתולים - Pawzen", seoTitle_en: "Cat Smart Tech - Pawzen",
  },

  // ── L3: Dog Toys Subcategories (4) ─────────────────────────────────────────
  {
    name_he: "צעצועי לעיסה", name_en: "Chew Toys", slug: "dog-chew-toys", parent: "dog-toys",
    description_he: "צעצועי לעיסה עמידים לכלבים",
    description_en: "Durable chew toys for dogs",
    seoTitle_he: "צעצועי לעיסה לכלבים - Pawzen", seoTitle_en: "Dog Chew Toys - Pawzen",
  },
  {
    name_he: "צעצועים אינטראקטיביים", name_en: "Interactive Toys", slug: "dog-interactive-toys", parent: "dog-toys",
    description_he: "צעצועים אינטראקטיביים ומשחקי חשיבה לכלבים",
    description_en: "Interactive and brain games for dogs",
    seoTitle_he: "צעצועים אינטראקטיביים לכלבים - Pawzen", seoTitle_en: "Dog Interactive Toys - Pawzen",
  },
  {
    name_he: "משחקי הבאה ושטח", name_en: "Fetch & Outdoor", slug: "dog-fetch-outdoor", parent: "dog-toys",
    description_he: "כדורים, פריסביז וצעצועי חוץ לכלבים",
    description_en: "Balls, frisbees and outdoor toys for dogs",
    seoTitle_he: "צעצועי הבאה לכלבים - Pawzen", seoTitle_en: "Dog Fetch Toys - Pawzen",
  },
  {
    name_he: "פאזלים לכלבים", name_en: "Puzzle Toys", slug: "dog-puzzle-toys", parent: "dog-toys",
    description_he: "צעצועי פאזל והעשרה לכלבים",
    description_en: "Puzzle and enrichment toys for dogs",
    seoTitle_he: "פאזלים לכלבים - Pawzen", seoTitle_en: "Dog Puzzle Toys - Pawzen",
  },

  // ── L3: Dog Feeding Subcategories (3) ──────────────────────────────────────
  {
    name_he: "קערות ומאכילים", name_en: "Bowls & Feeders", slug: "dog-bowls-feeders", parent: "dog-feeding",
    description_he: "קערות אוכל ומאכילים לכלבים",
    description_en: "Food bowls and feeders for dogs",
    seoTitle_he: "קערות לכלבים - Pawzen", seoTitle_en: "Dog Bowls - Pawzen",
  },
  {
    name_he: "מזרקות מים", name_en: "Water Fountains", slug: "dog-water-fountains", parent: "dog-feeding",
    description_he: "מזרקות ומתקני שתייה לכלבים",
    description_en: "Water fountains and dispensers for dogs",
    seoTitle_he: "מזרקות מים לכלבים - Pawzen", seoTitle_en: "Dog Water Fountains - Pawzen",
  },
  {
    name_he: "מאכילים איטיים", name_en: "Slow Feeders", slug: "dog-slow-feeders", parent: "dog-feeding",
    description_he: "קערות האכלה איטית לכלבים",
    description_en: "Slow feeder bowls for dogs",
    seoTitle_he: "מאכילים איטיים לכלבים - Pawzen", seoTitle_en: "Dog Slow Feeders - Pawzen",
  },

  // ── L3: Dog Comfort Subcategories (4) ──────────────────────────────────────
  {
    name_he: "מיטות ומזרנים", name_en: "Beds & Mats", slug: "dog-beds-mats", parent: "dog-comfort",
    description_he: "מיטות ומזרנים נוחים לכלבים",
    description_en: "Comfortable beds and mats for dogs",
    seoTitle_he: "מיטות לכלבים - Pawzen", seoTitle_en: "Dog Beds - Pawzen",
  },
  {
    name_he: "שמיכות", name_en: "Blankets", slug: "dog-blankets", parent: "dog-comfort",
    description_he: "שמיכות רכות וחמות לכלבים",
    description_en: "Soft and warm blankets for dogs",
    seoTitle_he: "שמיכות לכלבים - Pawzen", seoTitle_en: "Dog Blankets - Pawzen",
  },
  {
    name_he: "ביגוד לכלבים", name_en: "Dog Clothing", slug: "dog-clothing", parent: "dog-comfort",
    description_he: "מעילים, סוודרים וביגוד עונתי לכלבים",
    description_en: "Coats, sweaters and seasonal clothing for dogs",
    seoTitle_he: "ביגוד לכלבים - Pawzen", seoTitle_en: "Dog Clothing - Pawzen",
  },
  {
    name_he: "נשאים ותיקי נסיעה", name_en: "Carriers", slug: "dog-carriers", parent: "dog-comfort",
    description_he: "נשאים ותיקי נסיעה לכלבים",
    description_en: "Carriers and travel bags for dogs",
    seoTitle_he: "נשאים לכלבים - Pawzen", seoTitle_en: "Dog Carriers - Pawzen",
  },

  // ── L3: Dog Care Subcategories (4) ─────────────────────────────────────────
  {
    name_he: "כלי טיפוח", name_en: "Grooming Tools", slug: "dog-grooming", parent: "dog-care",
    description_he: "מברשות, קוצצי ציפורניים וכלי טיפוח לכלבים",
    description_en: "Brushes, nail clippers and grooming tools for dogs",
    seoTitle_he: "טיפוח כלבים - Pawzen", seoTitle_en: "Dog Grooming - Pawzen",
  },
  {
    name_he: "קולרים ורצועות", name_en: "Collars & Leashes", slug: "dog-collars-leashes", parent: "dog-care",
    description_he: "קולרים, רצועות וסרטי הולכה לכלבים",
    description_en: "Collars, leashes and walking accessories for dogs",
    seoTitle_he: "קולרים ורצועות לכלבים - Pawzen", seoTitle_en: "Dog Collars & Leashes - Pawzen",
  },
  {
    name_he: "רתמות", name_en: "Harnesses", slug: "dog-harnesses", parent: "dog-care",
    description_he: "רתמות נוחות ובטוחות לכלבים",
    description_en: "Comfortable and safe harnesses for dogs",
    seoTitle_he: "רתמות לכלבים - Pawzen", seoTitle_en: "Dog Harnesses - Pawzen",
  },
  {
    name_he: "בריאות לכלבים", name_en: "Dog Health", slug: "dog-health", parent: "dog-care",
    description_he: "מוצרי בריאות, עזרה ראשונה ותוספי מזון לכלבים",
    description_en: "Health products, first aid and supplements for dogs",
    seoTitle_he: "בריאות כלבים - Pawzen", seoTitle_en: "Dog Health - Pawzen",
  },

  // ── L3: Dog Smart Tech Subcategories (3) ───────────────────────────────────
  {
    name_he: "מעקב GPS", name_en: "GPS Trackers", slug: "dog-gps-trackers", parent: "dog-smart-tech",
    description_he: "מכשירי מעקב GPS לכלבים",
    description_en: "GPS tracking devices for dogs",
    seoTitle_he: "GPS לכלבים - Pawzen", seoTitle_en: "Dog GPS Trackers - Pawzen",
  },
  {
    name_he: "מאכילים אוטומטיים", name_en: "Auto Feeders", slug: "dog-auto-feeders", parent: "dog-smart-tech",
    description_he: "מאכילים אוטומטיים וחכמים לכלבים",
    description_en: "Automatic and smart feeders for dogs",
    seoTitle_he: "מאכילים אוטומטיים לכלבים - Pawzen", seoTitle_en: "Dog Auto Feeders - Pawzen",
  },
  {
    name_he: "מצלמות לחיות מחמד", name_en: "Pet Cameras", slug: "dog-pet-cameras", parent: "dog-smart-tech",
    description_he: "מצלמות לצפייה בכלבים מרחוק",
    description_en: "Cameras for monitoring dogs remotely",
    seoTitle_he: "מצלמות לכלבים - Pawzen", seoTitle_en: "Dog Pet Cameras - Pawzen",
  },

  // ── L3: Cat Toys Subcategories (4) ─────────────────────────────────────────
  {
    name_he: "צעצועי נוצות", name_en: "Feather Toys", slug: "cat-feather-toys", parent: "cat-toys",
    description_he: "צעצועי נוצות ושרביטים לחתולים",
    description_en: "Feather wands and toys for cats",
    seoTitle_he: "צעצועי נוצות לחתולים - Pawzen", seoTitle_en: "Cat Feather Toys - Pawzen",
  },
  {
    name_he: "לייזר ואלקטרוניקה", name_en: "Laser & Electronic", slug: "cat-laser-electronic", parent: "cat-toys",
    description_he: "צעצועי לייזר ואלקטרוניים לחתולים",
    description_en: "Laser and electronic toys for cats",
    seoTitle_he: "צעצועי לייזר לחתולים - Pawzen", seoTitle_en: "Cat Laser Toys - Pawzen",
  },
  {
    name_he: "קטניפ וצעצועים ממולאים", name_en: "Catnip Toys", slug: "cat-catnip-toys", parent: "cat-toys",
    description_he: "צעצועי קטניפ וצעצועים ממולאים לחתולים",
    description_en: "Catnip and stuffed toys for cats",
    seoTitle_he: "צעצועי קטניפ לחתולים - Pawzen", seoTitle_en: "Catnip Toys - Pawzen",
  },
  {
    name_he: "מתקני גירוד", name_en: "Scratchers", slug: "cat-scratchers", parent: "cat-toys",
    description_he: "מתקני גירוד מקרטון, סיזל ועץ לחתולים",
    description_en: "Cardboard, sisal and wood scratchers for cats",
    seoTitle_he: "מתקני גירוד לחתולים - Pawzen", seoTitle_en: "Cat Scratchers - Pawzen",
  },

  // ── L3: Cat Feeding Subcategories (2) ──────────────────────────────────────
  {
    name_he: "קערות ומאכילים", name_en: "Bowls & Feeders", slug: "cat-bowls-feeders", parent: "cat-feeding",
    description_he: "קערות אוכל ומאכילים לחתולים",
    description_en: "Food bowls and feeders for cats",
    seoTitle_he: "קערות לחתולים - Pawzen", seoTitle_en: "Cat Bowls - Pawzen",
  },
  {
    name_he: "מזרקות מים", name_en: "Water Fountains", slug: "cat-water-fountains", parent: "cat-feeding",
    description_he: "מזרקות ומתקני שתייה לחתולים",
    description_en: "Water fountains and dispensers for cats",
    seoTitle_he: "מזרקות מים לחתולים - Pawzen", seoTitle_en: "Cat Water Fountains - Pawzen",
  },

  // ── L3: Cat Comfort Subcategories (4) ──────────────────────────────────────
  {
    name_he: "מיטות לחתולים", name_en: "Cat Beds", slug: "cat-beds", parent: "cat-comfort",
    description_he: "מיטות ומערות נוחות לחתולים",
    description_en: "Comfortable beds and caves for cats",
    seoTitle_he: "מיטות לחתולים - Pawzen", seoTitle_en: "Cat Beds - Pawzen",
  },
  {
    name_he: "עצי חתולים וריהוט", name_en: "Cat Trees & Furniture", slug: "cat-trees-furniture", parent: "cat-comfort",
    description_he: "עצי חתולים, מדפים וריהוט לחתולים",
    description_en: "Cat trees, shelves and furniture",
    seoTitle_he: "עצי חתולים - Pawzen", seoTitle_en: "Cat Trees - Pawzen",
  },
  {
    name_he: "מרפסות חלון", name_en: "Window Perches", slug: "cat-window-perches", parent: "cat-comfort",
    description_he: "מרפסות חלון ומשטחי שכיבה לחתולים",
    description_en: "Window perches and lounging platforms for cats",
    seoTitle_he: "מרפסות חלון לחתולים - Pawzen", seoTitle_en: "Cat Window Perches - Pawzen",
  },
  {
    name_he: "ארגזי חול ואביזרים", name_en: "Litter Accessories", slug: "cat-litter", parent: "cat-comfort",
    description_he: "ארגזי חול, שטיחים ואביזרי נקיון לחתולים",
    description_en: "Litter boxes, mats and cleaning accessories for cats",
    seoTitle_he: "ארגזי חול לחתולים - Pawzen", seoTitle_en: "Cat Litter Accessories - Pawzen",
  },

  // ── L3: Cat Care Subcategories (3) ─────────────────────────────────────────
  {
    name_he: "כלי טיפוח לחתולים", name_en: "Cat Grooming", slug: "cat-grooming", parent: "cat-care",
    description_he: "מברשות וכלי טיפוח לחתולים",
    description_en: "Brushes and grooming tools for cats",
    seoTitle_he: "טיפוח חתולים - Pawzen", seoTitle_en: "Cat Grooming - Pawzen",
  },
  {
    name_he: "קולרים ותגי זיהוי", name_en: "Collars & ID Tags", slug: "cat-collars-id", parent: "cat-care",
    description_he: "קולרים ותגי זיהוי לחתולים",
    description_en: "Collars and ID tags for cats",
    seoTitle_he: "קולרים לחתולים - Pawzen", seoTitle_en: "Cat Collars - Pawzen",
  },
  {
    name_he: "בריאות לחתולים", name_en: "Cat Health", slug: "cat-health", parent: "cat-care",
    description_he: "מוצרי בריאות ותוספי מזון לחתולים",
    description_en: "Health products and supplements for cats",
    seoTitle_he: "בריאות חתולים - Pawzen", seoTitle_en: "Cat Health - Pawzen",
  },

  // ── L3: Cat Smart Tech Subcategories (2) ───────────────────────────────────
  {
    name_he: "ארגזי חול אוטומטיים", name_en: "Auto Litter Boxes", slug: "cat-auto-litter", parent: "cat-smart-tech",
    description_he: "ארגזי חול אוטומטיים וחכמים לחתולים",
    description_en: "Automatic and self-cleaning litter boxes for cats",
    seoTitle_he: "ארגזי חול אוטומטיים - Pawzen", seoTitle_en: "Auto Litter Boxes - Pawzen",
  },
  {
    name_he: "מאכילים חכמים", name_en: "Smart Feeders", slug: "cat-smart-feeders", parent: "cat-smart-tech",
    description_he: "מאכילים חכמים ומתוזמנים לחתולים",
    description_en: "Smart and timed feeders for cats",
    seoTitle_he: "מאכילים חכמים לחתולים - Pawzen", seoTitle_en: "Cat Smart Feeders - Pawzen",
  },
];
