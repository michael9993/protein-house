import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { MANSOUR_BRANDS } from "./config/mansour";

// ============================================================================
// Column index map (0-based, verified against real Excel headers)
// ============================================================================
const COL = {
  PRODUCT_ID: 0,     // מזהה מוצר
  STATUS: 1,          // סטטוס (1=active)
  NAME: 2,            // שם מוצר
  DESCRIPTION: 3,     // תיאור
  SEO_TITLE: 4,       // כותרת לקידום במנוע חיפוש
  SEO_DESCRIPTION: 5, // תיאור לקידום במנוע חיפוש
  SLUG: 7,            // שם ייחודי לקישור
  MODEL: 9,           // דגם
  SKU: 10,            // מק"ט
  PRICE: 11,          // מחיר (original/base price)
  COST: 12,           // עלות המוצר
  BRAND: 14,          // מותג (usually empty)
  WEIGHT: 22,         // ערך משקל/נפח
  HIDDEN: 23,         // מוסתר
  STOCK: 26,          // כמות במלאי
  IMAGES: 37,         // תמונות (semicolon-separated CDN URLs)
  CATEGORY: 38,       // קטגוריה (hierarchical with " > ")
  FILTERS: 39,        // פילטרים
  DISCOUNT: 41,       // הנחה (sale price)
  DISCOUNT_START: 42, // תאריך התחלה
  DISCOUNT_END: 43,   // תאריך סיום
  OPTIONS: 44,        // אפשרויות מוצר (variant data)
} as const;

// ============================================================================
// Types
// ============================================================================
interface RawProduct {
  rowIndex: number;
  productId: string;
  status: string;
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  slug: string;
  model: string;
  sku: string;
  price: number;
  cost: number | null;
  brand: string;
  weight: number | null;
  stock: number;
  images: string[];
  categoryPath: string;
  filters: string;
  discountPrice: number | null;
  discountStart: string;
  discountEnd: string;
  variantData: string;
}

interface CategoryNode {
  name: string;
  slug: string;
  parent: string;
  description: string;
}

interface CollectionRow {
  name: string;
  slug: string;
  description: string;
  productSlugs: string[];
}

interface ParsedVariant {
  value: string;
  stock: number;
  priceDelta: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s*>\s*/g, "-")
    .replace(/[׳']/g, "")              // Strip Hebrew geresh and apostrophes
    .replace(/[^\u0590-\u05FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function truncSeo(text: string, max = 70): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}

function extractBrand(text: string): string {
  if (!text) return "";
  for (const brand of MANSOUR_BRANDS) {
    for (const pattern of brand.patterns) {
      if (text.includes(pattern)) {
        return brand.name;
      }
    }
  }
  return "";
}

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseImages(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(";")
    .map((u) => u.trim())
    .filter((u) => u.startsWith("http"));
}

function cellStr(cell: ExcelJS.CellValue): string {
  if (cell === null || cell === undefined) return "";
  return String(cell).trim();
}

function cellNum(cell: ExcelJS.CellValue): number {
  if (cell === null || cell === undefined) return 0;
  const n = parseFloat(String(cell));
  return isNaN(n) ? 0 : n;
}

function cellNumOpt(cell: ExcelJS.CellValue): number | null {
  if (cell === null || cell === undefined || String(cell).trim() === "") return null;
  const n = parseFloat(String(cell));
  return isNaN(n) ? null : n;
}

function escapeCSV(value: string | number): string {
  if (typeof value === "number") return value.toString();
  if (!value) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function normalizeSize(value: string): string {
  const v = value.trim().toUpperCase();
  if (v === "3XL") return "XXXL";
  return value.trim();
}

// ============================================================================
// Filter Parser — extracts dynamic attributes from istores filter column
// ============================================================================

const FILTER_NAME_MAP: Record<string, string> = {
  "מסנן מותג": "Brand",
  "מסנן מין": "Gender",
  "מסנן צבע": "Color",
  "מסנן סוג הבגד": "Apparel Type",
  "מסנן סגנון": "Style",
  "מסנן חומר": "Material",
  "מסנן עונה": "Season",
  "מסנן קולקציה": "Collection Filter",
};

// Filters we already handle elsewhere (don't duplicate as attr: columns)
const SKIP_FILTERS = new Set(["סוג המוצר"]);

function parseFilters(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (!raw) return attrs;

  for (const pair of raw.split(",")) {
    const gtIdx = pair.indexOf(">");
    if (gtIdx === -1) continue;
    const key = pair.substring(0, gtIdx).trim();
    const value = pair.substring(gtIdx + 1).trim();
    if (!key || !value || SKIP_FILTERS.has(key)) continue;

    const attrName = FILTER_NAME_MAP[key] || key;
    attrs[attrName] = value;
  }
  return attrs;
}

// ============================================================================
// Variant Parser
// ============================================================================

function parseVariants(raw: string): ParsedVariant[] {
  if (!raw) return [];
  const variants: ParsedVariant[] = [];

  // Format: header ;; variant1 ; variant2 ; variant3 ...
  // Split by single ";" — double ";;" just produces an empty entry which gets filtered
  const parts = raw.split(";").map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.startsWith("שם אפשרות")) continue;

    const valueMatch = part.match(/ערך אפשרות:\s*([^,]+)/);
    const qtyMatch = part.match(/כמות פריטים:\s*(\d+)/);
    const priceMatch = part.match(/מחיר:\s*([\d.]+)/);

    if (valueMatch) {
      variants.push({
        value: normalizeSize(valueMatch[1]),
        stock: qtyMatch ? parseInt(qtyMatch[1]) : 0,
        priceDelta: priceMatch ? parseFloat(priceMatch[1]) : 0,
      });
    }
  }

  return variants;
}

// ============================================================================
// Product Type Detection
// ============================================================================

function detectProductType(
  variants: ParsedVariant[],
  categoryPath: string,
  filters: string,
): string {
  // Check filters first
  if (filters.includes("סוג המוצר>נעליים")) return "Shoes";
  if (filters.includes("סוג המוצר>ביגוד")) {
    if (
      filters.includes("מסנן סוג הבגד>שורט") ||
      filters.includes("מסנן סוג הבגד>מכנס") ||
      filters.includes("מסנן סוג הבגד>טייץ") ||
      filters.includes("מסנן סוג הבגד>חצאית") ||
      categoryPath.includes("מכנס") ||
      categoryPath.includes("טייץ") ||
      categoryPath.includes("שורט")
    ) {
      return "Bottoms";
    }
    return "Tops";
  }

  // Fallback: check category path
  if (categoryPath.includes("נעלי") || categoryPath.includes("נעליים")) return "Shoes";
  if (categoryPath.includes("אביזרים")) return "Accessories";
  if (categoryPath.includes("בגדי") || categoryPath.includes("ביגוד")) return "Tops";

  // Fallback: numeric variants = shoe sizes
  if (variants.length > 0 && variants.every((v) => /^\d+(\.\d+)?$/.test(v.value))) {
    return "Shoes";
  }

  return "Shoes";
}

// ============================================================================
// Category Extraction
// ============================================================================

function cleanCategoryName(raw: string): string {
  // Category names often have duplicated or tag info after comma:
  // "גברים, גברים" or "מכנסיים קצרים, Outlet"
  // Take only the first meaningful part
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  return parts[0] || raw.trim();
}

interface CategoryResult {
  categories: CategoryNode[];
  /** Maps raw category path → slug of the deepest category */
  rawPathToSlug: Map<string, string>;
}

function extractCategories(products: RawProduct[]): CategoryResult {
  // Key: full path (joined cleaned names) for uniqueness
  // Value: CategoryNode
  const categoryMap = new Map<string, CategoryNode>();
  const slugCounter = new Map<string, number>();

  function makeUniqueSlug(base: string): string {
    const count = slugCounter.get(base) || 0;
    slugCounter.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  }

  // Track cleanPath→slug mapping for parent references
  const pathToSlug = new Map<string, string>();
  // Track rawCategoryPath→deepest slug for product assignment
  const rawPathToSlug = new Map<string, string>();

  for (const product of products) {
    if (!product.categoryPath) continue;

    const rawParts = product.categoryPath
      .split(">")
      .map((p) => p.trim())
      .filter(Boolean);
    const cleanParts = rawParts.map(cleanCategoryName);

    for (let i = 0; i < cleanParts.length; i++) {
      const name = cleanParts[i];
      const pathKey = cleanParts.slice(0, i + 1).join(" > ");

      if (categoryMap.has(pathKey)) continue;

      const parentPathKey = i > 0 ? cleanParts.slice(0, i).join(" > ") : "";
      const parentSlug = parentPathKey ? (pathToSlug.get(parentPathKey) || "") : "";

      const baseSlug = slugify(name);
      const slug = makeUniqueSlug(baseSlug);

      pathToSlug.set(pathKey, slug);
      categoryMap.set(pathKey, {
        name,
        slug,
        parent: parentSlug,
        description: "",
      });
    }

    // Map raw path to deepest category slug
    const deepestPathKey = cleanParts.join(" > ");
    rawPathToSlug.set(product.categoryPath, pathToSlug.get(deepestPathKey) || "");
  }

  // Topological sort: parents before children
  const result: CategoryNode[] = [];
  const added = new Set<string>();

  function addWithParents(pathKey: string) {
    if (added.has(pathKey)) return;
    const cat = categoryMap.get(pathKey);
    if (!cat) return;
    // Find parent pathKey
    const parts = pathKey.split(" > ");
    if (parts.length > 1) {
      const parentPathKey = parts.slice(0, -1).join(" > ");
      addWithParents(parentPathKey);
    }
    added.add(pathKey);
    result.push(cat);
  }

  for (const pathKey of categoryMap.keys()) {
    addWithParents(pathKey);
  }

  return { categories: result, rawPathToSlug };
}

// ============================================================================
// Collection Derivation
// ============================================================================

function deriveCollections(products: RawProduct[]): CollectionRow[] {
  const brandMap = new Map<string, string[]>();
  const genderMap = new Map<string, string[]>();
  const saleProducts: string[] = [];

  for (const product of products) {
    const slug = product.slug || slugify(product.name);
    const brand = product.brand || extractBrand(product.name) || extractBrand(product.categoryPath);

    // Brand collections
    if (brand) {
      const brandInfo = MANSOUR_BRANDS.find((b) => b.name === brand);
      const brandSlug = brandInfo?.slug || slugify(brand);
      if (!brandMap.has(brandSlug)) brandMap.set(brandSlug, []);
      brandMap.get(brandSlug)!.push(slug);
    }

    // Gender collections
    const cat = product.categoryPath;
    if (cat.startsWith("גברים")) {
      if (!genderMap.has("mens-collection")) genderMap.set("mens-collection", []);
      genderMap.get("mens-collection")!.push(slug);
    } else if (cat.startsWith("נשים")) {
      if (!genderMap.has("womens-collection")) genderMap.set("womens-collection", []);
      genderMap.get("womens-collection")!.push(slug);
    } else if (cat.includes("ילדים") || cat.includes("ילדות")) {
      if (!genderMap.has("kids-collection")) genderMap.set("kids-collection", []);
      genderMap.get("kids-collection")!.push(slug);
    }

    // Sale collection
    if (product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price) {
      saleProducts.push(slug);
    }
  }

  const collections: CollectionRow[] = [];

  // Brand collections
  for (const [brandSlug, slugs] of brandMap) {
    const brandInfo = MANSOUR_BRANDS.find((b) => b.slug === brandSlug);
    const brandName = brandInfo?.name || brandSlug;
    collections.push({
      name: brandName,
      slug: brandSlug,
      description: `קולקציית ${brandName}`,
      productSlugs: slugs,
    });
  }

  // Gender collections
  const genderNames: Record<string, string> = {
    "mens-collection": "קולקציית גברים",
    "womens-collection": "קולקציית נשים",
    "kids-collection": "קולקציית ילדים",
  };
  for (const [key, slugs] of genderMap) {
    collections.push({
      name: genderNames[key] || key,
      slug: key,
      description: genderNames[key] || key,
      productSlugs: slugs,
    });
  }

  // Sale collection
  if (saleProducts.length > 0) {
    collections.push({
      name: "מבצעים",
      slug: "sale",
      description: "מוצרים במבצע",
      productSlugs: saleProducts,
    });
  }

  // Curated collections (empty for manual population)
  collections.push(
    { name: "מומלצים", slug: "featured-products", description: "מוצרים מומלצים", productSlugs: [] },
    { name: "רבי מכר", slug: "best-sellers", description: "המוצרים הנמכרים ביותר", productSlugs: [] },
    { name: "חדש", slug: "new-arrivals", description: "מוצרים חדשים", productSlugs: [] },
  );

  return collections;
}

// ============================================================================
// CSV Writer
// ============================================================================

function writeCategoriesCSV(categories: CategoryNode[], outputDir: string) {
  const headers = ["name", "slug", "description", "parent", "externalReference", "isPublished"];
  const rows = categories.map((cat) => [
    escapeCSV(cat.name),
    escapeCSV(cat.slug),
    escapeCSV(cat.description),
    escapeCSV(cat.parent),
    escapeCSV(cat.slug),
    "Yes",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const outPath = path.join(outputDir, "categories.csv");
  fs.writeFileSync(outPath, "\ufeff" + csv, "utf8");
  console.log(`  ✅ Written: ${outPath} (${categories.length} categories)`);
}

function writeCollectionsCSV(collections: CollectionRow[], outputDir: string) {
  const headers = ["name", "slug", "description", "productSlugs", "isPublished"];
  const rows = collections.map((col) => [
    escapeCSV(col.name),
    escapeCSV(col.slug),
    escapeCSV(col.description),
    escapeCSV(col.productSlugs.join(";")),
    "Yes",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const outPath = path.join(outputDir, "collections.csv");
  fs.writeFileSync(outPath, "\ufeff" + csv, "utf8");
  console.log(`  ✅ Written: ${outPath} (${collections.length} collections)`);
}

// ============================================================================
// Products Excel Writer
// ============================================================================

async function writeProductsExcel(
  products: RawProduct[],
  categories: CategoryNode[],
  collections: CollectionRow[],
  rawPathToSlug: Map<string, string>,
  outputDir: string,
  dynamicFilterAttrs: string[] = [],
) {
  console.log("Writing products Excel...");

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Products");

  const headers = [
    "name", "slug", "description", "productType", "category",
    "sku", "variantName", "price", "costPrice",
    "stock", "trackInventory",
    "imageUrl", "imageUrl2", "imageUrl3", "imageUrl4", "imageUrl5", "imageAlt",
    "collections", "seoTitle", "seoDescription",
    "attr:Brand", "attr:Gender",
    ...dynamicFilterAttrs.map(a => `attr:${a}`),
    "attr:Model",
    "variantAttr:Shoe size", "variantAttr:Apparel Size",
    "isPublished", "visibleInListings", "chargeTaxes",
    "weight",
    "externalReference", "metadata",
  ];

  ws.addRow(headers);

  // Build product slug → collection slug lookup
  const productCollectionMap = new Map<string, string[]>();
  for (const col of collections) {
    for (const pSlug of col.productSlugs) {
      if (!productCollectionMap.has(pSlug)) productCollectionMap.set(pSlug, []);
      productCollectionMap.get(pSlug)!.push(col.slug);
    }
  }

  let totalVariants = 0;
  let productsWithVariants = 0;
  let productsNoVariants = 0;
  const skuSet = new Set<string>();

  for (const product of products) {
    const brand = product.brand || extractBrand(product.name) || extractBrand(product.categoryPath);
    const variants = parseVariants(product.variantData);
    const productType = detectProductType(variants, product.categoryPath, product.filters);
    const plainDesc = stripHtml(product.description);
    const productSlug = product.slug || slugify(product.name);
    const isPublished = product.status === "1" ? "Yes" : "No";

    // Deepest category slug (from category extraction mapping)
    const categorySlug = rawPathToSlug.get(product.categoryPath) || "";

    // Gender from category
    const gender = product.categoryPath.startsWith("גברים")
      ? "Men"
      : product.categoryPath.startsWith("נשים")
        ? "Women"
        : product.categoryPath.includes("ילדים")
          ? "Kids"
          : "Unisex";

    // Collections for this product
    const productCollections = productCollectionMap.get(productSlug) || [];

    // Images (max 5)
    const images = product.images.slice(0, 5);

    // Metadata: store discount info + original product ID
    const metaParts: string[] = [];
    metaParts.push(`source_id:${product.productId}`);
    if (product.discountPrice && product.discountPrice > 0) {
      metaParts.push(`sale_price:${product.discountPrice}`);
    }
    if (product.discountStart) metaParts.push(`sale_start:${product.discountStart}`);
    if (product.discountEnd) metaParts.push(`sale_end:${product.discountEnd}`);

    // Parse filter attributes for this product
    const filterData = parseFilters(product.filters);

    // Generate unique SKU
    function uniqueSku(base: string): string {
      let sku = base;
      let counter = 1;
      while (skuSet.has(sku)) {
        sku = `${base}-${counter}`;
        counter++;
      }
      skuSet.add(sku);
      return sku;
    }

    if (variants.length === 0) {
      productsNoVariants++;
      totalVariants++;

      const sku = uniqueSku(product.sku || `MSR-${product.productId}`);

      ws.addRow([
        product.name,
        productSlug,
        plainDesc,
        productType,
        categorySlug,
        sku,
        "",
        product.price.toFixed(2),
        product.cost ? product.cost.toFixed(2) : "",
        product.stock,
        "Yes",
        images[0] || "", images[1] || "", images[2] || "", images[3] || "", images[4] || "",
        product.name,
        productCollections.join(";"),
        truncSeo(product.seoTitle || product.name),
        product.seoDescription || plainDesc.slice(0, 160),
        brand,
        gender,
        ...dynamicFilterAttrs.map(a => filterData[a] || ""),
        product.model || "",
        "", "",
        isPublished, "Yes", "Yes",
        product.weight != null ? String(product.weight) : "",
        product.productId,
        metaParts.join(";"),
      ]);
    } else {
      productsWithVariants++;

      variants.forEach((variant, idx) => {
        totalVariants++;
        const isFirst = idx === 0;
        const variantPrice = product.price + variant.priceDelta;
        const baseSku = product.sku
          ? `${product.sku}-${variant.value}`
          : `MSR-${product.productId}-${variant.value}`;
        const sku = uniqueSku(baseSku);
        const isShoeSize = productType === "Shoes";

        ws.addRow([
          isFirst ? product.name : "",
          isFirst ? productSlug : "",
          isFirst ? plainDesc : "",
          isFirst ? productType : "",
          isFirst ? categorySlug : "",
          sku,
          variant.value,
          variantPrice.toFixed(2),
          isFirst && product.cost ? product.cost.toFixed(2) : "",
          variant.stock,
          "Yes",
          isFirst ? (images[0] || "") : "",
          isFirst ? (images[1] || "") : "",
          isFirst ? (images[2] || "") : "",
          isFirst ? (images[3] || "") : "",
          isFirst ? (images[4] || "") : "",
          isFirst ? product.name : "",
          isFirst ? productCollections.join(";") : "",
          isFirst ? truncSeo(product.seoTitle || product.name) : "",
          isFirst ? (product.seoDescription || plainDesc.slice(0, 160)) : "",
          isFirst ? brand : "",
          isFirst ? gender : "",
          ...dynamicFilterAttrs.map(a => isFirst ? (filterData[a] || "") : ""),
          isFirst ? (product.model || "") : "",
          isShoeSize ? variant.value : "",
          !isShoeSize ? variant.value : "",
          isFirst ? isPublished : "",
          isFirst ? "Yes" : "",
          isFirst ? "Yes" : "",
          isFirst ? (product.weight != null ? String(product.weight) : "") : "",
          isFirst ? product.productId : "",
          isFirst ? metaParts.join(";") : "",
        ]);
      });
    }
  }

  // Auto-width columns
  ws.columns.forEach((col) => {
    col.width = 18;
  });

  const outPath = path.join(outputDir, "products.xlsx");
  await wb.xlsx.writeFile(outPath);
  console.log(`  ✅ Written: ${outPath}`);
  console.log(`     Products: ${products.length} (${productsWithVariants} with variants, ${productsNoVariants} single)`);
  console.log(`     Total variant rows: ${totalVariants}`);
  console.log(`     Unique SKUs: ${skuSet.size}`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const inputPath = path.join(__dirname, "../output/product_export.xlsx");
  const outputDir = path.join(__dirname, "../output/mansour");

  console.log("=== Mansour Shoes Import Converter ===\n");
  console.log(`Input:  ${inputPath}`);
  console.log(`Output: ${outputDir}\n`);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // ── Read Excel ──────────────────────────────────────────────────────────
  console.log("Reading Excel file...");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(inputPath);
  const sheet = workbook.worksheets[0];

  if (!sheet) {
    console.error("No worksheet found!");
    process.exit(1);
  }

  // Column index diagnostic mode
  if (process.argv.includes("--columns")) {
    sheet.getRow(1).eachCell((cell, colNumber) => {
      console.log(`  ${colNumber - 1}: ${cell.value}`);
    });
    process.exit(0);
  }

  const rawProducts: RawProduct[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const values = row.values as ExcelJS.CellValue[];
    const get = (idx: number) => values[idx + 1]; // ExcelJS is 1-indexed

    const name = cellStr(get(COL.NAME));
    if (!name) return;

    rawProducts.push({
      rowIndex: rowNumber,
      productId: cellStr(get(COL.PRODUCT_ID)),
      status: cellStr(get(COL.STATUS)),
      name,
      description: cellStr(get(COL.DESCRIPTION)),
      seoTitle: cellStr(get(COL.SEO_TITLE)),
      seoDescription: cellStr(get(COL.SEO_DESCRIPTION)),
      slug: cellStr(get(COL.SLUG)),
      model: cellStr(get(COL.MODEL)),
      sku: cellStr(get(COL.SKU)),
      price: cellNum(get(COL.PRICE)),
      cost: cellNumOpt(get(COL.COST)),
      brand: cellStr(get(COL.BRAND)),
      weight: cellNumOpt(get(COL.WEIGHT)),
      stock: cellNum(get(COL.STOCK)),
      images: parseImages(cellStr(get(COL.IMAGES))),
      categoryPath: cellStr(get(COL.CATEGORY)),
      filters: cellStr(get(COL.FILTERS)),
      discountPrice: cellNumOpt(get(COL.DISCOUNT)),
      discountStart: cellStr(get(COL.DISCOUNT_START)),
      discountEnd: cellStr(get(COL.DISCOUNT_END)),
      variantData: cellStr(get(COL.OPTIONS)),
    });
  });

  console.log(`  Read ${rawProducts.length} products\n`);

  // ── Discover all unique filter attribute names across all products ──
  const allFilterAttrNames = new Set<string>();
  for (const product of rawProducts) {
    const filterAttrs = parseFilters(product.filters);
    for (const attrName of Object.keys(filterAttrs)) {
      // Skip attrs we already have dedicated columns for
      if (attrName === "Brand" || attrName === "Gender") continue;
      allFilterAttrNames.add(attrName);
    }
  }
  const dynamicFilterAttrs = Array.from(allFilterAttrNames).sort();
  console.log(`  Dynamic filter attrs: ${dynamicFilterAttrs.length > 0 ? dynamicFilterAttrs.join(", ") : "(none)"}`);

  // ── Stats ───────────────────────────────────────────────────────────────
  const active = rawProducts.filter((p) => p.status === "1").length;
  const withVariants = rawProducts.filter((p) => parseVariants(p.variantData).length > 0).length;
  const withImages = rawProducts.filter((p) => p.images.length > 0).length;
  const withDiscount = rawProducts.filter((p) => p.discountPrice && p.discountPrice > 0).length;
  const brandsFound = new Map<string, number>();
  for (const p of rawProducts) {
    const b = p.brand || extractBrand(p.name) || extractBrand(p.categoryPath);
    if (b) brandsFound.set(b, (brandsFound.get(b) || 0) + 1);
  }

  console.log("  Stats:");
  console.log(`    Active: ${active} / ${rawProducts.length}`);
  console.log(`    With variants: ${withVariants}`);
  console.log(`    With images: ${withImages}`);
  console.log(`    With discounts: ${withDiscount}`);
  console.log(`    Brands: ${[...brandsFound.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}(${v})`).join(", ")}`);
  console.log();

  // ── Extract Categories ──────────────────────────────────────────────────
  console.log("Extracting categories...");
  const { categories, rawPathToSlug } = extractCategories(rawProducts);
  console.log(`  Found ${categories.length} unique categories\n`);

  // ── Derive Collections ──────────────────────────────────────────────────
  console.log("Deriving collections...");
  const collections = deriveCollections(rawProducts);
  const populated = collections.filter((c) => c.productSlugs.length > 0);
  console.log(`  Created ${collections.length} collections (${populated.length} with products)\n`);

  // ── Write outputs ───────────────────────────────────────────────────────
  console.log("Writing output files...\n");
  writeCategoriesCSV(categories, outputDir);
  writeCollectionsCSV(collections, outputDir);
  await writeProductsExcel(rawProducts, categories, collections, rawPathToSlug, outputDir, dynamicFilterAttrs);

  console.log("\n🎉 Import files ready! Upload via Bulk Manager in order:");
  console.log("   1. Categories  →  output/mansour/categories.csv");
  console.log("   2. Collections →  output/mansour/collections.csv");
  console.log("   3. Products    →  output/mansour/products.xlsx");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
