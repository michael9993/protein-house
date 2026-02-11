// Template-based product descriptions

export function generateDescription(params: {
  brand: string;
  model: string;
  gender: string;
  type: string;
  material: string;
}) {
  const { brand, model, gender, type, material } = params;

  const descriptions = {
    he: `${model} מבית ${brand} - ${getGenderText_HE(gender)}. עשוי מ${material}, מושלם עבור ${type}. איכות מעולה, נוחות מקסימלית ועיצוב מודרני.`,
    en: `${brand} ${model} for ${gender}. Made from ${material}, perfect for ${type}. Superior quality, maximum comfort, and modern design.`,
  };

  return descriptions;
}

function getGenderText_HE(gender: string): string {
  const map: Record<string, string> = {
    Men: "גברים",
    Women: "נשים",
    Kids: "ילדים",
    Unisex: "יוניסקס",
  };
  return map[gender] || gender;
}

export function generateProductName(params: {
  brand: string;
  model: string;
  model_he: string;
  gender: string;
  type: string;
}) {
  const { brand, model, model_he, gender, type } = params;

  const genderMap_HE: Record<string, string> = {
    Men: "לגברים",
    Women: "לנשים",
    Kids: "לילדים",
    Unisex: "יוניסקס",
  };

  const typeMap_HE: Record<string, string> = {
    shoes: "נעלי",
    tops: "חולצת",
    bottoms: "מכנסי",
    accessories: "",
  };

  const name_he = type === "accessories"
    ? `${model_he} ${brand} ${genderMap_HE[gender] || ""}`
    : `${typeMap_HE[type] || ""} ${brand} ${genderMap_HE[gender]} | ${model_he}`;

  const name_en = `${brand} ${model} ${gender}'s ${type.charAt(0).toUpperCase() + type.slice(1)}`;

  return { name_he, name_en };
}
