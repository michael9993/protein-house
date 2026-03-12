export interface Collection {
  name_he: string;
  name_en: string;
  slug: string;
  description_he?: string;
  description_en?: string;
  type: "pet" | "category" | "price" | "curated" | "special";
}

export const COLLECTIONS: Collection[] = [
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
    name_he: "מבצעים", name_en: "Sale", slug: "sale", type: "special",
    description_he: "מוצרים במבצע והנחות מיוחדות",
    description_en: "Discounted products and special offers",
  },
  {
    name_he: "מומלצים", name_en: "Featured Products", slug: "featured-products", type: "curated",
    description_he: "המוצרים המומלצים שלנו",
    description_en: "Our featured selection",
  },
];
