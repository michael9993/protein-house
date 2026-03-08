// Template-based pet product descriptions

export function generateDescription(params: {
  model: string;
  petType: string;
  type: string;
  material: string;
}) {
  const { model, petType, type, material } = params;

  const petTypeHe = getPetTypeText_HE(petType);
  const petTypeEn = petType === "Both" ? "dogs and cats" : petType === "Dog" ? "dogs" : "cats";

  const descriptions = {
    he: `${model} - ${petTypeHe}. עשוי מ${material}, מושלם עבור ${type}. איכות מעולה, עמידות גבוהה ועיצוב ידידותי לחיות מחמד.`,
    en: `${model} for ${petTypeEn}. Made from ${material}, perfect for ${type}. Superior quality, durable construction, and pet-friendly design.`,
  };

  return descriptions;
}

function getPetTypeText_HE(petType: string): string {
  const map: Record<string, string> = {
    Dog: "כלבים",
    Cat: "חתולים",
    Both: "כלבים וחתולים",
  };
  return map[petType] || petType;
}

export function generateProductName(params: {
  model: string;
  model_he: string;
  petType: string;
  type: string;
}) {
  const { model, model_he, petType, type } = params;

  const petTypeMap_HE: Record<string, string> = {
    Dog: "לכלבים",
    Cat: "לחתולים",
    Both: "לכלבים וחתולים",
  };

  const petTypeMap_EN: Record<string, string> = {
    Dog: "for Dogs",
    Cat: "for Cats",
    Both: "for Dogs & Cats",
  };

  const name_he = `${model_he} ${petTypeMap_HE[petType] || ""}`.trim();
  const name_en = `${model} ${petTypeMap_EN[petType] || ""}`.trim();

  return { name_he, name_en };
}
