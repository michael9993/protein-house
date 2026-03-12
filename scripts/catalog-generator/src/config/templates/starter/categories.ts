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
  // -- L1: Root Categories (4) ---------------------------------------------------
  {
    name_he: "ביגוד", name_en: "Clothing", slug: "clothing",
    description_he: "ביגוד לגברים ולנשים",
    description_en: "Clothing for men and women",
    seoTitle_he: "ביגוד", seoTitle_en: "Clothing",
  },
  {
    name_he: "נעליים", name_en: "Shoes", slug: "shoes",
    description_he: "נעליים לכל מטרה",
    description_en: "Shoes for every occasion",
    seoTitle_he: "נעליים", seoTitle_en: "Shoes",
  },
  {
    name_he: "תיקים", name_en: "Bags", slug: "bags",
    description_he: "תיקים ואביזרי נשיאה",
    description_en: "Bags and carrying accessories",
    seoTitle_he: "תיקים", seoTitle_en: "Bags",
  },
  {
    name_he: "אקססוריז", name_en: "Accessories", slug: "accessories",
    description_he: "אביזרים ותכשיטים",
    description_en: "Accessories and jewelry",
    seoTitle_he: "אקססוריז", seoTitle_en: "Accessories",
  },

  // -- L2: Subcategories (4) -----------------------------------------------------
  {
    name_he: "חולצות טי", name_en: "T-Shirts", slug: "t-shirts", parent: "clothing",
    description_he: "חולצות טי בסגנונות מגוונים",
    description_en: "T-shirts in various styles",
    seoTitle_he: "חולצות טי", seoTitle_en: "T-Shirts",
  },
  {
    name_he: "הלבשה עליונה", name_en: "Outerwear", slug: "outerwear", parent: "clothing",
    description_he: "מעילים וז'קטים",
    description_en: "Coats and jackets",
    seoTitle_he: "הלבשה עליונה", seoTitle_en: "Outerwear",
  },
  {
    name_he: "סניקרס", name_en: "Sneakers", slug: "sneakers", parent: "shoes",
    description_he: "נעלי ספורט וסניקרס",
    description_en: "Athletic shoes and sneakers",
    seoTitle_he: "סניקרס", seoTitle_en: "Sneakers",
  },
  {
    name_he: "תיקי גב", name_en: "Backpacks", slug: "backpacks", parent: "bags",
    description_he: "תיקי גב לעבודה ולפנאי",
    description_en: "Backpacks for work and leisure",
    seoTitle_he: "תיקי גב", seoTitle_en: "Backpacks",
  },
];
