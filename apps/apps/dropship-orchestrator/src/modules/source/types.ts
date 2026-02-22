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
  // Multi-warehouse shipping options (populated async)
  warehouseOptions: WarehouseOption[];
  selectedWarehouse: string; // country code (e.g. "CN", "US")
  // UI state
  showVariants: boolean;
}

export interface WarehouseOption {
  origin: string;       // country code: "CN", "US", "DE", etc.
  originLabel: string;  // human label: "China", "United States", etc.
  cheapest: {
    cost: number;
    carrier: string;
    days: string;
  } | null;
  fastest: {
    cost: number;
    carrier: string;
    days: string;
  } | null;
  allOptions: Array<{
    cost: number;
    carrier: string;
    days: string;
  }>;
}

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

export interface CSVOverrides {
  type?: string;
  category?: string;
  gender?: string;
  collections?: string;
}

export function generateCSV(products: SourcedProduct[], markup: number, overrides?: CSVOverrides): string {
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
    "variantMetadata",
    "isPublished",
    "trackInventory",
  ];

  const rows: string[][] = [];

  const oType = overrides?.type;
  const oCategory = overrides?.category;
  const oGender = overrides?.gender;
  const oCollections = overrides?.collections;

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

      // Parse shipping days (e.g. "10-20") into min/max for universal shipping.* metadata
      let shippingEstimateMeta = "";
      const shippingDaysStr = variant.shippingDays || product.shippingDays;
      if (shippingDaysStr) {
        const parts = shippingDaysStr.split("-").map((s) => s.trim());
        const minDays = parts[0] || "";
        const maxDays = parts[1] || parts[0] || "";
        if (minDays) {
          shippingEstimateMeta += `;shipping.estimatedMinDays:${minDays}`;
          shippingEstimateMeta += `;shipping.estimatedMaxDays:${maxDays}`;
        }
      }
      const carrier = variant.shippingCarrier || product.shippingCarrier;
      if (carrier) {
        shippingEstimateMeta += `;shipping.carrier:${carrier}`;
      }

      // Product-level metadata: supplier info + shipping estimates
      // Note: dropship.costPrice is in public metadata for CSV flow.
      // For production, use the direct import pipeline (Phase 3) which stores
      // costPrice in privateMetadata instead.
      const metadataStr = isFirstRow
        ? `dropship.supplier:cj;dropship.costPrice:${variant.price}${shippingMeta}${weightMeta}${shippingEstimateMeta}`
        : "";

      // Variant-level metadata: supplierSku is variant-specific (each CJ variant has a different vid)
      const variantMetadataStr = `dropship.supplierSku:${variant.vid}`;

      // Always include variant image — Bulk Manager needs it for variant-level image assignment
      const variantImgUrl = variant.image || "";

      const row: string[] = [
        isFirstRow ? product.editName : "",
        isFirstRow ? slug : "",
        isFirstRow ? (oType ?? product.editType) : "",
        isFirstRow ? (oCategory ?? product.editCategory) : "",
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
        isFirstRow ? (oGender ?? product.editGender) : "",
        isFirstRow ? (oCollections ?? product.editCollections) : "",
        metadataStr,
        variantMetadataStr,
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

