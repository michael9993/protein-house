export interface Collection {
  name_he: string;
  name_en: string;
  slug: string;
  description_he?: string;
  description_en?: string;
  backgroundImageUrl?: string;
}

export const COLLECTIONS: Collection[] = [
  // Homepage collections
  {
    name_he: "חדש",
    name_en: "New Arrivals",
    slug: "new-arrivals",
    description_he: "מוצרים חדשים",
    description_en: "Latest products",
    backgroundImageUrl: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800",
  },
  {
    name_he: "רבי המכר",
    name_en: "Best Sellers",
    slug: "best-sellers",
    description_he: "המוצרים הנמכרים ביותר",
    description_en: "Top rated products",
    backgroundImageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800",
  },
  {
    name_he: "מבצע",
    name_en: "Sale",
    slug: "sale",
    description_he: "מוצרים במבצע",
    description_en: "Discounted products",
    backgroundImageUrl: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800",
  },
  {
    name_he: "מומלצים",
    name_en: "Featured Products",
    slug: "featured-products",
    description_he: "המוצרים המומלצים שלנו",
    description_en: "Our featured selection",
    backgroundImageUrl: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800",
  },

  // Brand collections
  { name_he: "Nike", name_en: "Nike", slug: "nike", backgroundImageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800" },
  { name_he: "Adidas", name_en: "Adidas", slug: "adidas", backgroundImageUrl: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800" },
  { name_he: "Skechers", name_en: "Skechers", slug: "skechers", backgroundImageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800" },
  { name_he: "ASICS", name_en: "ASICS", slug: "asics", backgroundImageUrl: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=800" },
  { name_he: "Reebok", name_en: "Reebok", slug: "reebok", backgroundImageUrl: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800" },
  { name_he: "Under Armour", name_en: "Under Armour", slug: "under-armour", backgroundImageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800" },
  { name_he: "Puma", name_en: "Puma", slug: "puma", backgroundImageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800" },

  // Gender collections
  {
    name_he: "קולקציית גברים",
    name_en: "Men's Collection",
    slug: "mens-collection",
    backgroundImageUrl: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800",
  },
  {
    name_he: "קולקציית נשים",
    name_en: "Women's Collection",
    slug: "womens-collection",
    backgroundImageUrl: "https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=800",
  },
  {
    name_he: "קולקציית ילדים",
    name_en: "Kids Collection",
    slug: "kids-collection",
    backgroundImageUrl: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800",
  },

  // Seasonal collections
  {
    name_he: "קולקציית קיץ",
    name_en: "Summer Collection",
    slug: "summer-collection",
    backgroundImageUrl: "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800",
  },
  {
    name_he: "קולקציית חורף",
    name_en: "Winter Collection",
    slug: "winter-collection",
    backgroundImageUrl: "https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=800",
  },
  {
    name_he: "ספורט וכושר",
    name_en: "Sport Essentials",
    slug: "sport-essentials",
    backgroundImageUrl: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800",
  },
  {
    name_he: "נעלי עבודה",
    name_en: "Work Shoes",
    slug: "work-shoes",
    backgroundImageUrl: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800",
  },
];
