// Protein House — Collection definitions

export interface Collection {
  name_he: string;
  name_en: string;
  slug: string;
  description_he?: string;
  description_en?: string;
  type: "goal" | "category" | "price" | "curated" | "special";
  backgroundImageUrl?: string;
  backgroundImageAlt?: string;
}

export const COLLECTIONS: Collection[] = [
  {
    name_he: "מוצרים מומלצים",
    name_en: "Featured Products",
    slug: "featured-products",
    type: "curated",
    description_he: "המוצרים הכי מומלצים שלנו — נבחרו בקפידה על ידי צוות Protein House",
    description_en: "Our top recommended products — hand-picked by the Protein House team",
    backgroundImageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
    backgroundImageAlt: "Featured supplement products",
  },
  {
    name_he: "חדשים",
    name_en: "New Arrivals",
    slug: "new-arrivals",
    type: "special",
    description_he: "מוצרים חדשים שהגיעו לחנות — תמיד עדכניים עם הטרנדים האחרונים",
    description_en: "New products just arrived — always up to date with the latest trends",
    backgroundImageUrl: "https://images.unsplash.com/photo-1627467959547-215b1a09bb85?w=800",
    backgroundImageAlt: "New supplement arrivals",
  },
  {
    name_he: "רבי מכר",
    name_en: "Best Sellers",
    slug: "best-sellers",
    type: "curated",
    description_he: "המוצרים הנמכרים ביותר שלנו — מה שהלקוחות הכי אוהבים",
    description_en: "Our best-selling products — what customers love the most",
    backgroundImageUrl: "https://images.unsplash.com/photo-1579722820308-d74e571900a9?w=800",
    backgroundImageAlt: "Best-selling protein supplements",
  },
  {
    name_he: "מבצעים",
    name_en: "Sale",
    slug: "sale",
    type: "special",
    description_he: "מבצעים והנחות מיוחדות — חסכו בגדול על התוספים האהובים עליכם",
    description_en: "Special sales and discounts — save big on your favorite supplements",
    backgroundImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    backgroundImageAlt: "Supplement sale and discounts",
  },
  {
    name_he: "בניית שריר",
    name_en: "Muscle Building",
    slug: "muscle-building",
    type: "goal",
    description_he: "כל מה שצריך לבניית מסת שריר — חלבון, קריאטין, גיינרים ועוד",
    description_en: "Everything you need for muscle building — protein, creatine, gainers and more",
    backgroundImageUrl: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800",
    backgroundImageAlt: "Muscle building supplements",
  },
  {
    name_he: "ירידה במשקל",
    name_en: "Weight Loss",
    slug: "weight-loss",
    type: "goal",
    description_he: "תוספים לירידה במשקל ודיאטה — שורפי שומן, ל-קרניטין וחלבון דל קלוריות",
    description_en: "Weight loss and diet supplements — fat burners, L-carnitine and low-calorie protein",
    backgroundImageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
    backgroundImageAlt: "Weight loss supplements",
  },
  {
    name_he: "התאוששות",
    name_en: "Recovery",
    slug: "recovery",
    type: "goal",
    description_he: "תוספי התאוששות לאחר אימון — חומצות אמינו, גלוטמין וויטמינים",
    description_en: "Post-workout recovery supplements — amino acids, glutamine and vitamins",
    backgroundImageUrl: "https://images.unsplash.com/photo-1540496905036-5937c10647cc?w=800",
    backgroundImageAlt: "Post-workout recovery supplements",
  },
  {
    name_he: "אנרגיה וביצועים",
    name_en: "Energy & Performance",
    slug: "energy-performance",
    type: "goal",
    description_he: "תוספים לאנרגיה וביצועים מיטביים — פרה וורקאאוט, קפאין וקריאטין",
    description_en: "Energy and performance supplements — pre-workout, caffeine and creatine",
    backgroundImageUrl: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800",
    backgroundImageAlt: "Energy and performance supplements",
  },
  {
    name_he: "קולקציה טבעונית",
    name_en: "Vegan Collection",
    slug: "vegan-collection",
    type: "category",
    description_he: "קולקציה טבעונית מלאה — חלבון צמחי, ויטמינים וחטיפים ללא מוצרים מהחי",
    description_en: "Full vegan collection — plant protein, vitamins and snacks with no animal products",
    backgroundImageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800",
    backgroundImageAlt: "Vegan supplement collection",
  },
  {
    name_he: "ערכת מתחילים",
    name_en: "Beginner Stack",
    slug: "beginner-stack",
    type: "curated",
    description_he: "ערכה מושלמת למתחילים — כל התוספים הבסיסיים שצריך כדי להתחיל",
    description_en: "The perfect beginner stack — all the basic supplements you need to get started",
    backgroundImageUrl: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=800",
    backgroundImageAlt: "Beginner supplement stack",
  },
  {
    name_he: "הכנה לתחרות",
    name_en: "Competition Prep",
    slug: "competition-prep",
    type: "goal",
    description_he: "תוספים להכנה לתחרויות פיתוח גוף — שריפת שומן, שימור שריר ואנרגיה",
    description_en: "Bodybuilding competition prep supplements — fat burning, muscle preservation and energy",
    backgroundImageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800",
    backgroundImageAlt: "Competition prep supplements",
  },
  {
    name_he: "מחירים נוחים",
    name_en: "Budget Friendly",
    slug: "budget-friendly",
    type: "price",
    description_he: "תוספים איכותיים במחירים נוחים — תוצאות מעולות בלי לשבור את הארנק",
    description_en: "Quality supplements at budget-friendly prices — great results without breaking the bank",
    backgroundImageUrl: "https://images.unsplash.com/photo-1567722066597-a6c3f5deade0?w=800",
    backgroundImageAlt: "Budget friendly supplements",
  },
];
