// ---------------------------------------------------------------------------
// Shared types, constants, and utilities for the Source page
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SourcedProduct {
  pid: string;
  name: string;
  description: string;
  images: string[];
  costPrice: number;
  suggestSellPrice: number;
  weight: number;
  cjProductType: string;
  cjCategoryName: string;
  logisticsType: string;
  status: number;
  supplierName: string;
  variants: Array<{
    vid: string;
    name: string;
    sku: string;
    price: number;
    suggestPrice: number;
    image?: string;
    weight: number;
    attributes: Record<string, string>;
    // Per-variant shipping (populated async)
    shippingCost: number | null;
    shippingCarrier: string;
    shippingDays: string;
  }>;
  // Editable fields
  editName: string;
  editType: string;
  editCategory: string;
  editCollections: string;
  editGender: string;
  // Shipping (populated async)
  shippingCost: number | null;
  shippingCarrier: string;
  shippingDays: string;
  // UI state
  showVariants: boolean;
}

// ---------------------------------------------------------------------------
// Suggestion lists for datalist autocomplete
// ---------------------------------------------------------------------------

export const TYPE_SUGGESTIONS = ["Dropship Product", "Shoes", "Tops", "Bottoms", "Accessories"];
export const GENDER_SUGGESTIONS = ["Men", "Women", "Unisex"];
export const CATEGORY_SUGGESTIONS = [
  "men-running-shoes", "men-casual-shoes", "men-formal-shoes", "men-sandals",
  "women-heels", "women-sneakers", "women-flats", "women-sandals", "women-boots",
  "men-t-shirts", "men-shirts", "men-hoodies", "men-jackets",
  "women-blouses", "women-t-shirts", "women-sweaters", "women-jackets",
  "men-jeans", "men-trousers", "men-shorts",
  "women-jeans", "women-skirts", "women-trousers", "women-shorts",
  "bags", "wallets", "belts", "hats", "sunglasses", "jewelry", "watches",
];

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function generateCSV(products: SourcedProduct[], markup: number): string {
  const hasVariantWeights = products.some((p) =>
    p.variants.some((v) => v.weight > 0),
  );

  // Collect ALL unique variant attribute names across all products
  const allAttrNames = new Set<string>();
  for (const p of products) {
    for (const v of p.variants) {
      for (const key of Object.keys(v.attributes)) {
        allAttrNames.add(key);
      }
    }
  }
  const sortedAttrNames = Array.from(allAttrNames).sort((a, b) => {
    if (a === "Color") return -1;
    if (b === "Color") return 1;
    if (a === "Size") return -1;
    if (b === "Size") return 1;
    return a.localeCompare(b);
  });

  // Check if ANY variant has an image — always include variantImageUrl column
  const hasVariantImages = products.some((p) =>
    p.variants.some((v) => !!v.image),
  );

  const headers = [
    "name",
    "slug",
    "productType",
    "category",
    "description",
    "weight",
    "externalReference",
    "sku",
    "price",
    "costPrice",
    ...(hasVariantWeights ? ["variantWeight"] : []),
    "imageUrl",
    "imageUrl2",
    "imageUrl3",
    "imageUrl4",
    "imageUrl5",
    ...(hasVariantImages ? ["variantImageUrl"] : []),
    ...sortedAttrNames.map((name) => `variantAttr:${name}`),
    "attr:Gender",
    "collections",
    "metadata",
    "isPublished",
    "trackInventory",
  ];

  const rows: string[][] = [];

  for (const product of products) {
    const description = product.description;
    const slug = slugify(product.editName);
    const externalRef = `CJ-${product.pid}`;

    for (let vi = 0; vi < product.variants.length; vi++) {
      const variant = product.variants[vi];
      const isFirstRow = vi === 0;
      const retailPrice = (variant.price * markup).toFixed(2);
      const sku = `DS-CJ-${product.pid}-${variant.vid}`;

      const variantWeight = variant.weight > 0 ? variant.weight.toFixed(2) : "";
      const shippingMeta = variant.shippingCost != null ? `;dropship.shippingCost:${variant.shippingCost}` : "";
      const weightMeta = variantWeight ? `;dropship.variantWeight:${variantWeight}` : "";
      const metadataStr = `dropship.supplier:cj;dropship.supplierSku:${variant.vid};dropship.costPrice:${variant.price}${shippingMeta}${weightMeta}`;

      // Always include variant image — Bulk Manager needs it for variant-level image assignment
      const variantImgUrl = variant.image || "";

      const row: string[] = [
        isFirstRow ? product.editName : "",
        isFirstRow ? slug : "",
        isFirstRow ? product.editType : "",
        isFirstRow ? product.editCategory : "",
        isFirstRow ? description : "",
        isFirstRow && product.weight > 0 ? product.weight.toFixed(2) : "",
        isFirstRow ? externalRef : "",
        sku,
        retailPrice,
        variant.price.toFixed(2),
        ...(hasVariantWeights ? [variantWeight] : []),
        isFirstRow ? (product.images[0] || "") : "",
        isFirstRow ? (product.images[1] || "") : "",
        isFirstRow ? (product.images[2] || "") : "",
        isFirstRow ? (product.images[3] || "") : "",
        isFirstRow ? (product.images[4] || "") : "",
        ...(hasVariantImages ? [variantImgUrl] : []),
        ...sortedAttrNames.map((name) => variant.attributes[name] || ""),
        isFirstRow ? product.editGender : "",
        isFirstRow ? product.editCollections : "",
        metadataStr,
        isFirstRow ? "Yes" : "",
        "No",  // trackInventory — always No for dropship (inventory is at supplier)
      ];

      rows.push(row);
    }
  }

  const csvLines = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ];

  return csvLines.join("\n");
}

// ---------------------------------------------------------------------------
// Shared inline styles
// ---------------------------------------------------------------------------

export const labelStyle = {
  display: "block" as const,
  fontSize: "12px",
  fontWeight: 500 as const,
  marginBottom: "4px",
  color: "#6b6b6f",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

export const inputStyle = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  border: "1px solid #dcdcde",
  borderRadius: "6px",
  padding: "6px 10px",
  fontSize: "13px",
  width: "100%",
  outline: "none",
  backgroundColor: "#fff",
  boxSizing: "border-box" as const,
};

export const textareaStyle = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  border: "1px solid #dcdcde",
  borderRadius: "6px",
  padding: "8px 12px",
  fontSize: "13px",
  width: "100%",
  minHeight: "120px",
  outline: "none",
  resize: "vertical" as const,
  boxSizing: "border-box" as const,
};

export const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
  fontSize: "13px",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

export const thStyle = {
  textAlign: "left" as const,
  padding: "8px 12px",
  borderBottom: "2px solid #e5e5e7",
  fontWeight: 600,
  fontSize: "12px",
  color: "#6b6b6f",
  whiteSpace: "nowrap" as const,
};

export const tdStyle = {
  padding: "8px 12px",
  borderBottom: "1px solid #f0f0f2",
  verticalAlign: "middle" as const,
};

export const smallInputStyle = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  border: "1px solid #dcdcde",
  borderRadius: "4px",
  padding: "4px 8px",
  fontSize: "12px",
  width: "100%",
  outline: "none",
  boxSizing: "border-box" as const,
};

export const refCellStyle = {
  ...tdStyle,
  fontSize: "11px",
  color: "#9ca3af",
};
