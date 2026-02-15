export interface BrandPattern {
  name: string;
  slug: string;
  patterns: string[];
}

export const MANSOUR_BRANDS: BrandPattern[] = [
  { name: "Nike", slug: "nike", patterns: ["Nike", "nike", "נייק", "NIKE"] },
  { name: "Adidas", slug: "adidas", patterns: ["Adidas", "adidas", "אדידס", "ADIDAS"] },
  { name: "Under Armour", slug: "under-armour", patterns: ["Under Armour", "אנדר ארמור", "UNDER ARMOUR"] },
  { name: "Skechers", slug: "skechers", patterns: ["Skechers", "skechers", "סקצ'רס", "SKECHERS"] },
  { name: "Reebok", slug: "reebok", patterns: ["Reebok", "reebok", "ריבוק", "REEBOK"] },
  { name: "Puma", slug: "puma", patterns: ["Puma", "puma", "פומה", "PUMA"] },
  { name: "Diadora", slug: "diadora", patterns: ["Diadora", "diadora", "דיאדורה", "DIADORA"] },
  { name: "Salomon", slug: "salomon", patterns: ["Salomon", "salomon", "סלומון", "SALOMON"] },
  { name: "Lady Comfort", slug: "lady-comfort", patterns: ["Lady Comfort", "lady comfort", "לידי קומפורט"] },
  { name: "ASICS", slug: "asics", patterns: ["ASICS", "asics", "אסיקס"] },
  { name: "New Balance", slug: "new-balance", patterns: ["New Balance", "ניו באלנס", "NEW BALANCE"] },
  { name: "Fila", slug: "fila", patterns: ["Fila", "fila", "פילה", "FILA"] },
];
