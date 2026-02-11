export interface Category {
  name_he: string;
  name_en: string;
  slug: string;
  parent?: string;
  description_he?: string;
  description_en?: string;
  backgroundImageUrl?: string;
}

export const CATEGORIES: Category[] = [
  // Root categories
  { name_he: "גברים", name_en: "Men", slug: "men", backgroundImageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800" },
  { name_he: "נשים", name_en: "Women", slug: "women", backgroundImageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800" },
  { name_he: "ילדים", name_en: "Kids", slug: "kids", backgroundImageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800" },
  { name_he: "מותגים", name_en: "Brands", slug: "brands", backgroundImageUrl: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800" },
  { name_he: "מבצעים", name_en: "Sale", slug: "sale", backgroundImageUrl: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800" },

  // Men > Shoes
  { name_he: "נעליים", name_en: "Shoes", slug: "men-shoes", parent: "men", backgroundImageUrl: "https://images.unsplash.com/photo-1539185441755-769473a23570?w=800" },
  { name_he: "ריצה", name_en: "Running", slug: "men-running", parent: "men-shoes", backgroundImageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800" },
  { name_he: "אימון", name_en: "Training", slug: "men-training", parent: "men-shoes", backgroundImageUrl: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800" },
  { name_he: "כדורגל", name_en: "Soccer", slug: "men-soccer", parent: "men-shoes", backgroundImageUrl: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800" },
  { name_he: "יומיומי", name_en: "Casual", slug: "men-casual", parent: "men-shoes", backgroundImageUrl: "https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=800" },

  // Men > Clothing
  { name_he: "ביגוד", name_en: "Clothing", slug: "men-clothing", parent: "men", backgroundImageUrl: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800" },
  { name_he: "חולצות", name_en: "Tops", slug: "men-tops", parent: "men-clothing", backgroundImageUrl: "https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=800" },
  { name_he: "מכנסיים", name_en: "Bottoms", slug: "men-bottoms", parent: "men-clothing", backgroundImageUrl: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800" },

  // Men > Accessories
  { name_he: "אביזרים", name_en: "Accessories", slug: "men-accessories", parent: "men", backgroundImageUrl: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800" },

  // Women > Shoes
  { name_he: "נעליים", name_en: "Shoes", slug: "women-shoes", parent: "women", backgroundImageUrl: "https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=800" },
  { name_he: "ריצה", name_en: "Running", slug: "women-running", parent: "women-shoes", backgroundImageUrl: "https://images.unsplash.com/photo-1465453869711-7e174808ace9?w=800" },
  { name_he: "אימון", name_en: "Training", slug: "women-training", parent: "women-shoes", backgroundImageUrl: "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800" },
  { name_he: "יומיומי", name_en: "Casual", slug: "women-casual", parent: "women-shoes", backgroundImageUrl: "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800" },

  // Women > Clothing
  { name_he: "ביגוד", name_en: "Clothing", slug: "women-clothing", parent: "women", backgroundImageUrl: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800" },
  { name_he: "חולצות", name_en: "Tops", slug: "women-tops", parent: "women-clothing", backgroundImageUrl: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800" },
  { name_he: "מכנסיים וטייצים", name_en: "Bottoms & Leggings", slug: "women-bottoms", parent: "women-clothing", backgroundImageUrl: "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800" },

  // Women > Accessories
  { name_he: "אביזרים", name_en: "Accessories", slug: "women-accessories", parent: "women", backgroundImageUrl: "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800" },

  // Kids > Shoes
  { name_he: "נעליים", name_en: "Shoes", slug: "kids-shoes", parent: "kids", backgroundImageUrl: "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800" },
  { name_he: "בנים", name_en: "Boys", slug: "kids-boys-shoes", parent: "kids-shoes", backgroundImageUrl: "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=800" },
  { name_he: "בנות", name_en: "Girls", slug: "kids-girls-shoes", parent: "kids-shoes", backgroundImageUrl: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800" },

  // Kids > Clothing
  { name_he: "ביגוד", name_en: "Clothing", slug: "kids-clothing", parent: "kids", backgroundImageUrl: "https://images.unsplash.com/photo-1562183241-b937e95585b6?w=800" },
  { name_he: "בנים", name_en: "Boys", slug: "kids-boys-clothing", parent: "kids-clothing", backgroundImageUrl: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800" },
  { name_he: "בנות", name_en: "Girls", slug: "kids-girls-clothing", parent: "kids-clothing", backgroundImageUrl: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800" },

  // Brands
  { name_he: "Nike", name_en: "Nike", slug: "brand-nike", parent: "brands", backgroundImageUrl: "https://images.unsplash.com/photo-1618898909019-010e4e234c55?w=800" },
  { name_he: "Adidas", name_en: "Adidas", slug: "brand-adidas", parent: "brands", backgroundImageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800" },
  { name_he: "Under Armour", name_en: "Under Armour", slug: "brand-under-armour", parent: "brands", backgroundImageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800" },
  { name_he: "Skechers", name_en: "Skechers", slug: "brand-skechers", parent: "brands", backgroundImageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800" },

  // Sale
  { name_he: "אאוטלט", name_en: "Clearance", slug: "clearance", parent: "sale", backgroundImageUrl: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800" },
  { name_he: "מבזקים", name_en: "Flash Deals", slug: "flash-deals", parent: "sale", backgroundImageUrl: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800" },
];
