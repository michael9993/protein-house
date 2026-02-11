import { ProductDefinition } from "./products";

// Generate Tops (30 products)
export const TOPS_PRODUCTS: ProductDefinition[] = [
  // Nike Tops (8)
  { type: "tops", brand: "Nike", model: "Dri-FIT T-Shirt", model_he: "חולצת דריי-פיט", gender: "Men", category: "men-tops", material: "Polyester", productType: "T-Shirt", basePrice_ILS: 149, basePrice_USD: 40, collections: ["nike", "mens-collection"] },
  { type: "tops", brand: "Nike", model: "Sportswear Club Tee", model_he: "חולצת ספורט קלאב", gender: "Women", category: "women-tops", material: "Cotton", productType: "T-Shirt", basePrice_ILS: 129, basePrice_USD: 35, discount: 0.15, collections: ["nike", "womens-collection", "sale"] },
  { type: "tops", brand: "Nike", model: "Therma-FIT Hoodie", model_he: "קפוצ'ון תרמה-פיט", gender: "Men", category: "men-tops", material: "Polyester", productType: "Hoodie", basePrice_ILS: 399, basePrice_USD: 108, collections: ["nike", "mens-collection", "best-sellers"] },
  { type: "tops", brand: "Nike", model: "Essential Fleece Hoodie", model_he: "קפוצ'ון פליז", gender: "Women", category: "women-tops", material: "Cotton", productType: "Hoodie", basePrice_ILS: 349, basePrice_USD: 94, collections: ["nike", "womens-collection"] },
  { type: "tops", brand: "Nike", model: "Windrunner Jacket", model_he: "ג'קט ווינדראנר", gender: "Men", category: "men-tops", material: "Nylon", productType: "Jacket", basePrice_ILS: 499, basePrice_USD: 135, collections: ["nike", "mens-collection", "featured-products"] },
  { type: "tops", brand: "Nike", model: "Track Jacket", model_he: "ג'קט טרק", gender: "Women", category: "women-tops", material: "Polyester", productType: "Jacket", basePrice_ILS: 449, basePrice_USD: 121, discount: 0.20, collections: ["nike", "womens-collection", "sale"] },
  { type: "tops", brand: "Nike", model: "Miler Tank", model_he: "גופיית מיילר", gender: "Men", category: "men-tops", material: "Polyester", productType: "Tank Top", basePrice_ILS: 99, basePrice_USD: 27, collections: ["nike", "mens-collection"] },
  { type: "tops", brand: "Nike", model: "Pro Tank", model_he: "גופיית פרו", gender: "Women", category: "women-tops", material: "Polyester", productType: "Tank Top", basePrice_ILS: 119, basePrice_USD: 32, collections: ["nike", "womens-collection"] },

  // Adidas Tops (8)
  { type: "tops", brand: "Adidas", model: "Essentials 3-Stripes Tee", model_he: "חולצת 3 פסים", gender: "Men", category: "men-tops", material: "Cotton", productType: "T-Shirt", basePrice_ILS: 139, basePrice_USD: 38, collections: ["adidas", "mens-collection", "best-sellers"] },
  { type: "tops", brand: "Adidas", model: "Trefoil Tee", model_he: "חולצת טרפויל", gender: "Women", category: "women-tops", material: "Cotton", productType: "T-Shirt", basePrice_ILS: 129, basePrice_USD: 35, collections: ["adidas", "womens-collection"] },
  { type: "tops", brand: "Adidas", model: "Z.N.E. Hoodie", model_he: "קפוצ'ון Z.N.E", gender: "Men", category: "men-tops", material: "Cotton", productType: "Hoodie", basePrice_ILS: 449, basePrice_USD: 121, collections: ["adidas", "mens-collection", "featured-products"] },
  { type: "tops", brand: "Adidas", model: "Essentials Hoodie", model_he: "קפוצ'ון אסנשלס", gender: "Women", category: "women-tops", material: "Cotton", productType: "Hoodie", basePrice_ILS: 329, basePrice_USD: 89, discount: 0.25, collections: ["adidas", "womens-collection", "sale"] },
  { type: "tops", brand: "Adidas", model: "Tiro Track Jacket", model_he: "ג'קט טירו", gender: "Men", category: "men-tops", material: "Polyester", productType: "Jacket", basePrice_ILS: 379, basePrice_USD: 102, collections: ["adidas", "mens-collection"] },
  { type: "tops", brand: "Adidas", model: "Designed 2 Move Jacket", model_he: "ג'קט D2M", gender: "Women", category: "women-tops", material: "Polyester", productType: "Jacket", basePrice_ILS: 349, basePrice_USD: 94, collections: ["adidas", "womens-collection"] },
  { type: "tops", brand: "Adidas", model: "Own The Run Singlet", model_he: "גופיית OTR", gender: "Men", category: "men-tops", material: "Polyester", productType: "Tank Top", basePrice_ILS: 89, basePrice_USD: 24, collections: ["adidas", "mens-collection"] },
  { type: "tops", brand: "Adidas", model: "Alphaskin Tank", model_he: "גופיית אלפהסקין", gender: "Women", category: "women-tops", material: "Elastane", productType: "Tank Top", basePrice_ILS: 109, basePrice_USD: 29, collections: ["adidas", "womens-collection"] },

  // Under Armour Tops (7)
  { type: "tops", brand: "Under Armour", model: "Tech 2.0 Tee", model_he: "חולצת טק 2.0", gender: "Men", category: "men-tops", material: "Polyester", productType: "T-Shirt", basePrice_ILS: 149, basePrice_USD: 40, collections: ["under-armour", "mens-collection"] },
  { type: "tops", brand: "Under Armour", model: "Sportstyle Logo Tee", model_he: "חולצת לוגו", gender: "Women", category: "women-tops", material: "Cotton", productType: "T-Shirt", basePrice_ILS: 129, basePrice_USD: 35, collections: ["under-armour", "womens-collection"] },
  { type: "tops", brand: "Under Armour", model: "Rival Fleece Hoodie", model_he: "קפוצ'ון רייבל", gender: "Men", category: "men-tops", material: "Cotton", productType: "Hoodie", basePrice_ILS: 379, basePrice_USD: 102, discount: 0.15, collections: ["under-armour", "mens-collection", "sale"] },
  { type: "tops", brand: "Under Armour", model: "Armour Sport Hoodie", model_he: "קפוצ'ון ספורט", gender: "Women", category: "women-tops", material: "Polyester", productType: "Hoodie", basePrice_ILS: 349, basePrice_USD: 94, collections: ["under-armour", "womens-collection"] },
  { type: "tops", brand: "Under Armour", model: "Unstoppable Jacket", model_he: "ג'קט אנסטופבל", gender: "Men", category: "men-tops", material: "Polyester", productType: "Jacket", basePrice_ILS: 499, basePrice_USD: 135, collections: ["under-armour", "mens-collection"] },
  { type: "tops", brand: "Under Armour", model: "Tech Tank", model_he: "גופיית טק", gender: "Men", category: "men-tops", material: "Polyester", productType: "Tank Top", basePrice_ILS: 99, basePrice_USD: 27, collections: ["under-armour", "mens-collection"] },
  { type: "tops", brand: "Under Armour", model: "Fly-By Tank", model_he: "גופיית פליי-ביי", gender: "Women", category: "women-tops", material: "Polyester", productType: "Tank Top", basePrice_ILS: 109, basePrice_USD: 29, collections: ["under-armour", "womens-collection"] },

  // Puma, Reebok, Skechers Tops (7)
  { type: "tops", brand: "Puma", model: "Essentials Logo Tee", model_he: "חולצת לוגו", gender: "Men", category: "men-tops", material: "Cotton", productType: "T-Shirt", basePrice_ILS: 119, basePrice_USD: 32, collections: ["puma", "mens-collection"] },
  { type: "tops", brand: "Puma", model: "Graphic Tee", model_he: "חולצת גרפיקה", gender: "Women", category: "women-tops", material: "Cotton", productType: "T-Shirt", basePrice_ILS: 129, basePrice_USD: 35, discount: 0.30, collections: ["puma", "womens-collection", "sale"] },
  { type: "tops", brand: "Reebok", model: "Workout Ready Tee", model_he: "חולצת וורקאאוט", gender: "Men", category: "men-tops", material: "Polyester", productType: "T-Shirt", basePrice_ILS: 139, basePrice_USD: 38, collections: ["reebok", "mens-collection"] },
  { type: "tops", brand: "Reebok", model: "Identity Hoodie", model_he: "קפוצ'ון אידנטיטי", gender: "Women", category: "women-tops", material: "Cotton", productType: "Hoodie", basePrice_ILS: 329, basePrice_USD: 89, collections: ["reebok", "womens-collection"] },
  { type: "tops", brand: "Skechers", model: "Go Walk Tee", model_he: "חולצת גו ווק", gender: "Men", category: "men-tops", material: "Polyester", productType: "T-Shirt", basePrice_ILS: 99, basePrice_USD: 27, collections: ["skechers", "mens-collection"] },
  { type: "tops", brand: "ASICS", model: "Race Tee", model_he: "חולצת ריצה", gender: "Men", category: "men-tops", material: "Polyester", productType: "T-Shirt", basePrice_ILS: 129, basePrice_USD: 35, collections: ["asics", "mens-collection"] },
  { type: "tops", brand: "ASICS", model: "Katakana Jacket", model_he: "ג'קט קטקנה", gender: "Women", category: "women-tops", material: "Polyester", productType: "Jacket", basePrice_ILS: 399, basePrice_USD: 108, collections: ["asics", "womens-collection"] },
];

// Generate Bottoms (20 products)
export const BOTTOMS_PRODUCTS: ProductDefinition[] = [
  // Nike Bottoms (6)
  { type: "bottoms", brand: "Nike", model: "Dri-FIT Pants", model_he: "מכנסי דריי-פיט", gender: "Men", category: "men-bottoms", material: "Polyester", productType: "Pants", basePrice_ILS: 299, basePrice_USD: 81, collections: ["nike", "mens-collection"] },
  { type: "bottoms", brand: "Nike", model: "Sportswear Club Fleece Pants", model_he: "מכנסי פליז", gender: "Women", category: "women-bottoms", material: "Cotton", productType: "Pants", basePrice_ILS: 249, basePrice_USD: 67, discount: 0.15, collections: ["nike", "womens-collection", "sale"] },
  { type: "bottoms", brand: "Nike", model: "Challenger Shorts", model_he: "מכנסי צ'לנג'ר קצרים", gender: "Men", category: "men-bottoms", material: "Polyester", productType: "Shorts", basePrice_ILS: 179, basePrice_USD: 48, collections: ["nike", "mens-collection"] },
  { type: "bottoms", brand: "Nike", model: "Tempo Shorts", model_he: "מכנסי טמפו קצרים", gender: "Women", category: "women-bottoms", material: "Polyester", productType: "Shorts", basePrice_ILS: 159, basePrice_USD: 43, collections: ["nike", "womens-collection"] },
  { type: "bottoms", brand: "Nike", model: "One Leggings", model_he: "טייץ וואן", gender: "Women", category: "women-bottoms", material: "Elastane", productType: "Leggings", basePrice_ILS: 249, basePrice_USD: 67, collections: ["nike", "womens-collection", "best-sellers"] },
  { type: "bottoms", brand: "Nike", model: "Pro Leggings", model_he: "טייץ פרו", gender: "Women", category: "women-bottoms", material: "Elastane", productType: "Leggings", basePrice_ILS: 279, basePrice_USD: 75, collections: ["nike", "womens-collection"] },

  // Adidas Bottoms (6)
  { type: "bottoms", brand: "Adidas", model: "Tiro Track Pants", model_he: "מכנסי טירו", gender: "Men", category: "men-bottoms", material: "Polyester", productType: "Pants", basePrice_ILS: 249, basePrice_USD: 67, collections: ["adidas", "mens-collection", "best-sellers"] },
  { type: "bottoms", brand: "Adidas", model: "Essentials 3-Stripes Pants", model_he: "מכנסי 3 פסים", gender: "Women", category: "women-bottoms", material: "Cotton", productType: "Pants", basePrice_ILS: 229, basePrice_USD: 62, collections: ["adidas", "womens-collection"] },
  { type: "bottoms", brand: "Adidas", model: "Designed 2 Move Shorts", model_he: "מכנסי D2M קצרים", gender: "Men", category: "men-bottoms", material: "Polyester", productType: "Shorts", basePrice_ILS: 149, basePrice_USD: 40, collections: ["adidas", "mens-collection"] },
  { type: "bottoms", brand: "Adidas", model: "Pacer Shorts", model_he: "מכנסי פייסר קצרים", gender: "Women", category: "women-bottoms", material: "Polyester", productType: "Shorts", basePrice_ILS: 139, basePrice_USD: 38, discount: 0.20, collections: ["adidas", "womens-collection", "sale"] },
  { type: "bottoms", brand: "Adidas", model: "Believe This Leggings", model_he: "טייץ ביליב דיס", gender: "Women", category: "women-bottoms", material: "Elastane", productType: "Leggings", basePrice_ILS: 249, basePrice_USD: 67, collections: ["adidas", "womens-collection", "best-sellers"] },
  { type: "bottoms", brand: "Adidas", model: "Techfit Leggings", model_he: "טייץ טכפיט", gender: "Women", category: "women-bottoms", material: "Elastane", productType: "Leggings", basePrice_ILS: 279, basePrice_USD: 75, collections: ["adidas", "womens-collection"] },

  // Under Armour Bottoms (4)
  { type: "bottoms", brand: "Under Armour", model: "Rival Fleece Joggers", model_he: "ג'וגרס רייבל", gender: "Men", category: "men-bottoms", material: "Cotton", productType: "Joggers", basePrice_ILS: 299, basePrice_USD: 81, collections: ["under-armour", "mens-collection"] },
  { type: "bottoms", brand: "Under Armour", model: "Tech Mesh Shorts", model_he: "מכנסי טק קצרים", gender: "Men", category: "men-bottoms", material: "Polyester", productType: "Shorts", basePrice_ILS: 169, basePrice_USD: 46, collections: ["under-armour", "mens-collection"] },
  { type: "bottoms", brand: "Under Armour", model: "Fly Fast Tights", model_he: "טייץ פליי פאסט", gender: "Women", category: "women-bottoms", material: "Elastane", productType: "Leggings", basePrice_ILS: 269, basePrice_USD: 73, discount: 0.15, collections: ["under-armour", "womens-collection", "sale"] },
  { type: "bottoms", brand: "Under Armour", model: "Meridian Leggings", model_he: "טייץ מרידיאן", gender: "Women", category: "women-bottoms", material: "Elastane", productType: "Leggings", basePrice_ILS: 289, basePrice_USD: 78, collections: ["under-armour", "womens-collection"] },

  // Puma, Reebok (4)
  { type: "bottoms", brand: "Puma", model: "Essentials Pants", model_he: "מכנסי אסנשלס", gender: "Men", category: "men-bottoms", material: "Cotton", productType: "Pants", basePrice_ILS: 199, basePrice_USD: 54, collections: ["puma", "mens-collection"] },
  { type: "bottoms", brand: "Puma", model: "Active Shorts", model_he: "מכנסי אקטיב קצרים", gender: "Women", category: "women-bottoms", material: "Polyester", productType: "Shorts", basePrice_ILS: 129, basePrice_USD: 35, discount: 0.25, collections: ["puma", "womens-collection", "sale"] },
  { type: "bottoms", brand: "Reebok", model: "Workout Ready Pants", model_he: "מכנסי וורקאאוט", gender: "Men", category: "men-bottoms", material: "Polyester", productType: "Pants", basePrice_ILS: 229, basePrice_USD: 62, collections: ["reebok", "mens-collection"] },
  { type: "bottoms", brand: "Reebok", model: "Lux Leggings", model_he: "טייץ לוקס", gender: "Women", category: "women-bottoms", material: "Elastane", productType: "Leggings", basePrice_ILS: 249, basePrice_USD: 67, collections: ["reebok", "womens-collection"] },
];

// Generate Accessories (10 products)
export const ACCESSORIES_PRODUCTS: ProductDefinition[] = [
  { type: "accessories", brand: "Nike", model: "Brasilia Backpack", model_he: "תיק גב ברסיליה", gender: "Unisex", category: "men-accessories", material: "Polyester", productType: "Bag", basePrice_ILS: 149, basePrice_USD: 40, collections: ["nike"] },
  { type: "accessories", brand: "Adidas", model: "Classic Backpack", model_he: "תיק גב קלאסי", gender: "Unisex", category: "men-accessories", material: "Polyester", productType: "Bag", basePrice_ILS: 129, basePrice_USD: 35, discount: 0.15, collections: ["adidas", "sale"] },
  { type: "accessories", brand: "Under Armour", model: "Hustle Backpack", model_he: "תיק גב האסל", gender: "Unisex", category: "men-accessories", material: "Polyester", productType: "Bag", basePrice_ILS: 179, basePrice_USD: 48, collections: ["under-armour"] },
  { type: "accessories", brand: "Nike", model: "Futura Cap", model_he: "כובע פיוצ'רה", gender: "Unisex", category: "men-accessories", material: "Cotton", productType: "Hat", basePrice_ILS: 89, basePrice_USD: 24, collections: ["nike", "best-sellers"] },
  { type: "accessories", brand: "Adidas", model: "Baseball Cap", model_he: "כובע בייסבול", gender: "Unisex", category: "men-accessories", material: "Cotton", productType: "Hat", basePrice_ILS: 79, basePrice_USD: 21, collections: ["adidas"] },
  { type: "accessories", brand: "Puma", model: "Essentials Cap", model_he: "כובע אסנשלס", gender: "Unisex", category: "men-accessories", material: "Cotton", productType: "Hat", basePrice_ILS: 69, basePrice_USD: 19, discount: 0.20, collections: ["puma", "sale"] },
  { type: "accessories", brand: "Nike", model: "Everyday Cushion Socks (3 Pack)", model_he: "גרביים קושן (3 זוגות)", gender: "Unisex", category: "men-accessories", material: "Cotton", productType: "Socks", basePrice_ILS: 59, basePrice_USD: 16, collections: ["nike"] },
  { type: "accessories", brand: "Adidas", model: "Cushioned Crew Socks (3 Pack)", model_he: "גרביים (3 זוגות)", gender: "Unisex", category: "men-accessories", material: "Cotton", productType: "Socks", basePrice_ILS: 49, basePrice_USD: 13, collections: ["adidas"] },
  { type: "accessories", brand: "Nike", model: "HyperCharge Water Bottle", model_he: "בקבוק מים היפרצ'רג'", gender: "Unisex", category: "men-accessories", material: "Plastic", productType: "Water Bottle", basePrice_ILS: 79, basePrice_USD: 21, collections: ["nike"] },
  { type: "accessories", brand: "Under Armour", model: "Sideline Squeeze Bottle", model_he: "בקבוק מים סייד לייט", gender: "Unisex", category: "men-accessories", material: "Plastic", productType: "Water Bottle", basePrice_ILS: 69, basePrice_USD: 19, collections: ["under-armour"] },
];
