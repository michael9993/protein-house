// Protein House — Category definitions (3-level hierarchy)

export interface Category {
  name_he: string;
  name_en: string;
  slug: string;
  parent?: string;
  description_he?: string;
  description_en?: string;
  seoTitle_he?: string;
  seoTitle_en?: string;
  backgroundImageUrl?: string;
  backgroundImageAlt?: string;
}

// ──────────────────────────────────────────────
// L1 — Main categories
// ──────────────────────────────────────────────
const L1_CATEGORIES: Category[] = [
  {
    name_he: "אבקות חלבון",
    name_en: "Protein",
    slug: "protein",
    description_he: "אבקות חלבון מהמותגים המובילים בעולם — מי גבינה, קזאין, צמחי ועוד",
    description_en: "Premium protein powders from the world's leading brands — whey, casein, plant-based and more",
    seoTitle_he: "אבקות חלבון - Protein House",
    seoTitle_en: "Protein - Protein House",
    backgroundImageUrl: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800",
    backgroundImageAlt: "Protein powder supplements",
  },
  {
    name_he: "פרה וורקאאוט",
    name_en: "Pre-Workout",
    slug: "pre-workout",
    description_he: "תוספי פרה וורקאאוט לאנרגיה, מיקוד ופאמפ מקסימלי באימון",
    description_en: "Pre-workout supplements for energy, focus and maximum pump during training",
    seoTitle_he: "פרה וורקאאוט - Protein House",
    seoTitle_en: "Pre-Workout - Protein House",
    backgroundImageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
    backgroundImageAlt: "Pre-workout and gym training",
  },
  {
    name_he: "קריאטין",
    name_en: "Creatine",
    slug: "creatine",
    description_he: "קריאטין מונוהידרט ותערובות קריאטין לכוח, עוצמה ונפח שרירים",
    description_en: "Creatine monohydrate and blends for strength, power and muscle volume",
    seoTitle_he: "קריאטין - Protein House",
    seoTitle_en: "Creatine - Protein House",
    backgroundImageUrl: "https://images.unsplash.com/photo-1546519638405-a2b83c0ea5e6?w=800",
    backgroundImageAlt: "Creatine and strength training",
  },
  {
    name_he: "חומצות אמינו",
    name_en: "Amino Acids",
    slug: "amino-acids",
    description_he: "חומצות אמינו חיוניות — BCAA, EAA, גלוטמין, ל-קרניטין ועוד",
    description_en: "Essential amino acids — BCAA, EAA, glutamine, L-carnitine and more",
    seoTitle_he: "חומצות אמינו - Protein House",
    seoTitle_en: "Amino Acids - Protein House",
    backgroundImageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800",
    backgroundImageAlt: "Amino acid supplements",
  },
  {
    name_he: "שורפי שומן",
    name_en: "Fat Burners",
    slug: "fat-burners",
    description_he: "שורפי שומן תרמוגניים וללא ממריצים לירידה במשקל ודיאטה",
    description_en: "Thermogenic and stimulant-free fat burners for weight loss and dieting",
    seoTitle_he: "שורפי שומן - Protein House",
    seoTitle_en: "Fat Burners - Protein House",
    backgroundImageUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800",
    backgroundImageAlt: "Fat burner supplements",
  },
  {
    name_he: "ויטמינים ובריאות",
    name_en: "Vitamins & Health",
    slug: "vitamins-health",
    description_he: "ויטמינים, מינרלים ותוספי בריאות לאורח חיים בריא ופעיל",
    description_en: "Vitamins, minerals and health supplements for a healthy and active lifestyle",
    seoTitle_he: "ויטמינים ובריאות - Protein House",
    seoTitle_en: "Vitamins & Health - Protein House",
    backgroundImageUrl: "https://images.unsplash.com/photo-1584952811565-c4c4032931e0?w=800",
    backgroundImageAlt: "Vitamins and health supplements",
  },
  {
    name_he: "מזון פונקציונלי",
    name_en: "Functional Foods",
    slug: "functional-foods",
    description_he: "חטיפי חלבון, ממרחי אגוזים, משקאות מוכנים ומזון פונקציונלי",
    description_en: "Protein bars, nut butters, ready-to-drink beverages and functional foods",
    seoTitle_he: "מזון פונקציונלי - Protein House",
    seoTitle_en: "Functional Foods - Protein House",
    backgroundImageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800",
    backgroundImageAlt: "Functional foods and protein bars",
  },
  {
    name_he: "אביזרים",
    name_en: "Accessories",
    slug: "accessories",
    description_he: "שייקרים, תיקי ספורט וציוד אימון לחוויית אימון מושלמת",
    description_en: "Shaker bottles, gym bags and training gear for the ultimate workout experience",
    seoTitle_he: "אביזרים - Protein House",
    seoTitle_en: "Accessories - Protein House",
    backgroundImageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800",
    backgroundImageAlt: "Gym accessories and shaker bottles",
  },
];

// ──────────────────────────────────────────────
// L2 — Subcategories
// ──────────────────────────────────────────────
const L2_CATEGORIES: Category[] = [
  // — Protein subcategories —
  {
    name_he: "חלבון מי גבינה",
    name_en: "Whey Protein",
    slug: "whey-protein",
    parent: "protein",
    description_he: "אבקות חלבון מי גבינה — קונצנטרט, איזולט והידרוליזט",
    description_en: "Whey protein powders — concentrate, isolate and hydrolysate",
    seoTitle_he: "חלבון מי גבינה - Protein House",
    seoTitle_en: "Whey Protein - Protein House",
  },
  {
    name_he: "חלבון קזאין",
    name_en: "Casein Protein",
    slug: "casein-protein",
    parent: "protein",
    description_he: "חלבון קזאין בספיגה איטית — אידיאלי ללפני השינה",
    description_en: "Slow-release casein protein — ideal for before bedtime",
    seoTitle_he: "חלבון קזאין - Protein House",
    seoTitle_en: "Casein Protein - Protein House",
  },
  {
    name_he: "חלבון צמחי",
    name_en: "Plant Protein",
    slug: "plant-protein",
    parent: "protein",
    description_he: "אבקות חלבון צמחי — אפונה, אורז, סויה ותערובות טבעוניות",
    description_en: "Plant-based protein powders — pea, rice, soy and vegan blends",
    seoTitle_he: "חלבון צמחי - Protein House",
    seoTitle_en: "Plant Protein - Protein House",
  },
  {
    name_he: "גיינרים",
    name_en: "Mass Gainers",
    slug: "mass-gainers",
    parent: "protein",
    description_he: "גיינרים לעלייה במסה — קלוריות גבוהות עם חלבון איכותי",
    description_en: "Mass gainers — high-calorie formulas with quality protein",
    seoTitle_he: "גיינרים - Protein House",
    seoTitle_en: "Mass Gainers - Protein House",
  },
  {
    name_he: "חטיפי חלבון",
    name_en: "Protein Bars",
    slug: "protein-bars",
    parent: "protein",
    description_he: "חטיפי חלבון טעימים ומזינים לנשנוש בריא בכל מקום",
    description_en: "Delicious and nutritious protein bars for healthy snacking on the go",
    seoTitle_he: "חטיפי חלבון - Protein House",
    seoTitle_en: "Protein Bars - Protein House",
  },

  // — Pre-Workout subcategories —
  {
    name_he: "פרה וורקאאוט עם ממריצים",
    name_en: "Stimulant Pre-Workout",
    slug: "stim-pre-workout",
    parent: "pre-workout",
    description_he: "פרה וורקאאוט עם קפאין וממריצים לאנרגיה מרבית",
    description_en: "Pre-workout with caffeine and stimulants for maximum energy",
    seoTitle_he: "פרה וורקאאוט עם ממריצים - Protein House",
    seoTitle_en: "Stimulant Pre-Workout - Protein House",
  },
  {
    name_he: "פרה וורקאאוט ללא ממריצים",
    name_en: "Stim-Free Pre-Workout",
    slug: "stim-free-pre-workout",
    parent: "pre-workout",
    description_he: "פרה וורקאאוט ללא קפאין — מתאים לאימונים בשעות הערב",
    description_en: "Caffeine-free pre-workout — suitable for evening training sessions",
    seoTitle_he: "פרה וורקאאוט ללא ממריצים - Protein House",
    seoTitle_en: "Stim-Free Pre-Workout - Protein House",
  },
  {
    name_he: "פורמולות פאמפ",
    name_en: "Pump Formulas",
    slug: "pump-formulas",
    parent: "pre-workout",
    description_he: "פורמולות פאמפ עם ציטרולין, ארגינין וחנקן חמצני",
    description_en: "Pump formulas with citrulline, arginine and nitric oxide boosters",
    seoTitle_he: "פורמולות פאמפ - Protein House",
    seoTitle_en: "Pump Formulas - Protein House",
  },

  // — Creatine subcategories —
  {
    name_he: "קריאטין מונוהידרט",
    name_en: "Creatine Monohydrate",
    slug: "creatine-monohydrate",
    parent: "creatine",
    description_he: "קריאטין מונוהידרט טהור — התוסף הנחקר ביותר בעולם הכושר",
    description_en: "Pure creatine monohydrate — the most researched supplement in fitness",
    seoTitle_he: "קריאטין מונוהידרט - Protein House",
    seoTitle_en: "Creatine Monohydrate - Protein House",
  },
  {
    name_he: "תערובות קריאטין",
    name_en: "Creatine Blends",
    slug: "creatine-blends",
    parent: "creatine",
    description_he: "תערובות קריאטין מתקדמות עם רכיבים משלימים לביצועים מיטביים",
    description_en: "Advanced creatine blends with complementary ingredients for optimal performance",
    seoTitle_he: "תערובות קריאטין - Protein House",
    seoTitle_en: "Creatine Blends - Protein House",
  },

  // — Amino Acids subcategories —
  {
    name_he: "BCAA",
    name_en: "BCAAs",
    slug: "bcaa",
    parent: "amino-acids",
    description_he: "חומצות אמינו מסועפות שרשרת — לאוצין, איזולאוצין ווואלין",
    description_en: "Branched-chain amino acids — leucine, isoleucine and valine",
    seoTitle_he: "BCAA - Protein House",
    seoTitle_en: "BCAAs - Protein House",
  },
  {
    name_he: "EAA",
    name_en: "EAAs",
    slug: "eaa",
    parent: "amino-acids",
    description_he: "כל 9 חומצות האמינו החיוניות בפורמולה אחת מושלמת",
    description_en: "All 9 essential amino acids in one complete formula",
    seoTitle_he: "EAA - Protein House",
    seoTitle_en: "EAAs - Protein House",
  },
  {
    name_he: "ל-קרניטין",
    name_en: "L-Carnitine",
    slug: "l-carnitine",
    parent: "amino-acids",
    description_he: "ל-קרניטין לשריפת שומן, אנרגיה והתאוששות מאימון",
    description_en: "L-Carnitine for fat burning, energy and workout recovery",
    seoTitle_he: "ל-קרניטין - Protein House",
    seoTitle_en: "L-Carnitine - Protein House",
  },
  {
    name_he: "גלוטמין",
    name_en: "Glutamine",
    slug: "glutamine",
    parent: "amino-acids",
    description_he: "גלוטמין לתמיכה במערכת החיסון והתאוששות שרירים",
    description_en: "Glutamine for immune system support and muscle recovery",
    seoTitle_he: "גלוטמין - Protein House",
    seoTitle_en: "Glutamine - Protein House",
  },

  // — Fat Burners subcategories —
  {
    name_he: "תרמוגניים",
    name_en: "Thermogenic",
    slug: "thermogenic",
    parent: "fat-burners",
    description_he: "שורפי שומן תרמוגניים עם ממריצים לשריפת קלוריות מוגברת",
    description_en: "Thermogenic fat burners with stimulants for enhanced calorie burning",
    seoTitle_he: "תרמוגניים - Protein House",
    seoTitle_en: "Thermogenic - Protein House",
  },
  {
    name_he: "שורפי שומן ללא ממריצים",
    name_en: "Stim-Free Fat Burner",
    slug: "stim-free-fat-burner",
    parent: "fat-burners",
    description_he: "שורפי שומן ללא קפאין — מתאימים לשימוש יומיומי ושילוב עם פרה וורקאאוט",
    description_en: "Stimulant-free fat burners — suitable for daily use and stacking with pre-workout",
    seoTitle_he: "שורפי שומן ללא ממריצים - Protein House",
    seoTitle_en: "Stim-Free Fat Burner - Protein House",
  },
  {
    name_he: "CLA ול-קרניטין",
    name_en: "CLA & L-Carnitine",
    slug: "cla-carnitine",
    parent: "fat-burners",
    description_he: "CLA ול-קרניטין לתמיכה בשריפת שומן ושמירה על מסת שריר",
    description_en: "CLA and L-Carnitine for fat burning support and lean muscle preservation",
    seoTitle_he: "CLA ול-קרניטין - Protein House",
    seoTitle_en: "CLA & L-Carnitine - Protein House",
  },

  // — Vitamins & Health subcategories —
  {
    name_he: "מולטי ויטמין",
    name_en: "Multivitamins",
    slug: "multivitamins",
    parent: "vitamins-health",
    description_he: "מולטי ויטמין מקיף לכיסוי כל הצרכים התזונתיים היומיים",
    description_en: "Comprehensive multivitamins to cover all daily nutritional needs",
    seoTitle_he: "מולטי ויטמין - Protein House",
    seoTitle_en: "Multivitamins - Protein House",
  },
  {
    name_he: "אומגה 3",
    name_en: "Omega-3",
    slug: "omega-3",
    parent: "vitamins-health",
    description_he: "שמן דגים ואומגה 3 לבריאות הלב, המוח והמפרקים",
    description_en: "Fish oil and Omega-3 for heart, brain and joint health",
    seoTitle_he: "אומגה 3 - Protein House",
    seoTitle_en: "Omega-3 - Protein House",
  },
  {
    name_he: "תמיכה במפרקים",
    name_en: "Joint Support",
    slug: "joint-support",
    parent: "vitamins-health",
    description_he: "גלוקוזאמין, כונדרואיטין וקולגן לתמיכה במפרקים ורקמות חיבור",
    description_en: "Glucosamine, chondroitin and collagen for joint and connective tissue support",
    seoTitle_he: "תמיכה במפרקים - Protein House",
    seoTitle_en: "Joint Support - Protein House",
  },
  {
    name_he: "ירוקים וסופרפוד",
    name_en: "Greens & Superfoods",
    slug: "greens-superfoods",
    parent: "vitamins-health",
    description_he: "אבקות ירוקים וסופרפוד לחיזוק מערכת החיסון ואנטיאוקסידנטים",
    description_en: "Greens powders and superfoods for immune support and antioxidants",
    seoTitle_he: "ירוקים וסופרפוד - Protein House",
    seoTitle_en: "Greens & Superfoods - Protein House",
  },

  // — Functional Foods subcategories —
  {
    name_he: "חטיפים וחטיפי חלבון",
    name_en: "Protein Bars & Snacks",
    slug: "bars-snacks",
    parent: "functional-foods",
    description_he: "חטיפי חלבון, ופלים ונשנושים בריאים עשירים בחלבון",
    description_en: "Protein bars, wafers and healthy high-protein snacks",
    seoTitle_he: "חטיפים וחטיפי חלבון - Protein House",
    seoTitle_en: "Protein Bars & Snacks - Protein House",
  },
  {
    name_he: "ממרחי אגוזים",
    name_en: "Nut Butters",
    slug: "nut-butters",
    parent: "functional-foods",
    description_he: "ממרחי בוטנים, שקדים ואגוזים — טבעיים ועשירים בחלבון",
    description_en: "Peanut, almond and nut butters — natural and protein-rich",
    seoTitle_he: "ממרחי אגוזים - Protein House",
    seoTitle_en: "Nut Butters - Protein House",
  },
  {
    name_he: "משקאות מוכנים",
    name_en: "Ready-to-Drink",
    slug: "ready-to-drink",
    parent: "functional-foods",
    description_he: "שייקים ומשקאות חלבון מוכנים לשתייה — נוחים ומהירים",
    description_en: "Ready-to-drink protein shakes and beverages — convenient and quick",
    seoTitle_he: "משקאות מוכנים - Protein House",
    seoTitle_en: "Ready-to-Drink - Protein House",
  },

  // — Accessories subcategories —
  {
    name_he: "שייקרים",
    name_en: "Shaker Bottles",
    slug: "shaker-bottles",
    parent: "accessories",
    description_he: "שייקרים וכוסות ערבוב איכותיים לתערובת חלקה ומושלמת",
    description_en: "Quality shaker bottles and mixing cups for a smooth and perfect blend",
    seoTitle_he: "שייקרים - Protein House",
    seoTitle_en: "Shaker Bottles - Protein House",
  },
  {
    name_he: "תיקי ספורט",
    name_en: "Gym Bags",
    slug: "gym-bags",
    parent: "accessories",
    description_he: "תיקי ספורט וכושר מעוצבים ופרקטיים לכל מתאמן",
    description_en: "Stylish and practical gym and sports bags for every athlete",
    seoTitle_he: "תיקי ספורט - Protein House",
    seoTitle_en: "Gym Bags - Protein House",
  },
  {
    name_he: "ציוד אימון",
    name_en: "Training Gear",
    slug: "training-gear",
    parent: "accessories",
    description_he: "כפפות, חגורות, רצועות ואביזרי אימון לביצועים מיטביים",
    description_en: "Gloves, belts, straps and training accessories for optimal performance",
    seoTitle_he: "ציוד אימון - Protein House",
    seoTitle_en: "Training Gear - Protein House",
  },
];

// ──────────────────────────────────────────────
// Combined export
// ──────────────────────────────────────────────
export const CATEGORIES: Category[] = [...L1_CATEGORIES, ...L2_CATEGORIES];
