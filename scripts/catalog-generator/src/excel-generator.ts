/**
 * Excel catalog generator for Protein House.
 * Generates a 3-sheet workbook: Products, Categories, Collections.
 *
 * Usage:
 *   tsx src/excel-generator.ts         # English names + ILS pricing
 *   tsx src/excel-generator.ts en      # English names + ILS pricing
 *   tsx src/excel-generator.ts he      # Hebrew names + ILS pricing
 *   tsx src/excel-generator.ts en usd  # English names + USD pricing
 */

import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";

import { ALL_PRODUCTS } from "./config/products.js";
import { CATEGORIES } from "./config/categories.js";
import { COLLECTIONS } from "./config/collections.js";
import { IMAGE_URLS } from "./config/images.js";
import { calculatePricing } from "./generators/pricing.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "output");

const lang = (process.argv[2] || "en").toLowerCase();
const currency = (process.argv[3] || "ils").toLowerCase() as "ils" | "usd";

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getImages(idx: number, count = 3): string[] {
  const start = idx % IMAGE_URLS.length;
  return Array.from({ length: count }, (_, i) => IMAGE_URLS[(start + i) % IMAGE_URLS.length]);
}

function buildProductDescription(p: typeof ALL_PRODUCTS[0]): string {
  const parts: string[] = [`${p.model} by ${p.brand}.`];
  if (p.proteinSource) parts.push(`Protein source: ${p.proteinSource}.`);
  if (p.goal?.length) parts.push(`Goals: ${p.goal.join(", ")}.`);
  if (p.dietaryTags?.length) parts.push(p.dietaryTags.join(", ") + ".");
  if (p.stimLevel) parts.push(`Stimulant level: ${p.stimLevel}.`);
  return parts.join(" ");
}

function buildProductDescriptionHe(p: typeof ALL_PRODUCTS[0]): string {
  const goalMap: Record<string, string> = {
    "Muscle Building": "בניית שריר",
    "Weight Loss": "ירידה במשקל",
    "Recovery": "התאוששות",
    "Energy": "אנרגיה",
    "Performance": "ביצועים",
    "Health": "בריאות",
  };
  const goals = p.goal?.map((g) => goalMap[g] || g).join(", ");
  const parts: string[] = [`${p.model_he} של ${p.brand}.`];
  if (p.proteinSource) parts.push(`מקור חלבון: ${p.proteinSource}.`);
  if (goals) parts.push(`מטרות: ${goals}.`);
  return parts.join(" ");
}

async function generate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Protein House Catalog Generator";
  workbook.created = new Date();

  // ─── Sheet 1: Products ──────────────────────────────────────────────────────
  const productsSheet = workbook.addWorksheet("Products");
  productsSheet.columns = [
    { header: "name",        key: "name",        width: 45 },
    { header: "slug",        key: "slug",        width: 45 },
    { header: "description", key: "description", width: 80 },
    { header: "productType", key: "productType", width: 22 },
    { header: "category",    key: "category",    width: 20 },
    { header: "brand",       key: "brand",       width: 18 },
    { header: "collections", key: "collections", width: 40 },
    { header: "price",       key: "price",       width: 10 },
    { header: "costPrice",   key: "costPrice",   width: 10 },
    { header: "stock",       key: "stock",       width: 8  },
    { header: "sku",         key: "sku",         width: 18 },
    { header: "weight",      key: "weight",      width: 8  },
    { header: "imageUrl",    key: "imageUrl",    width: 60 },
    { header: "imageUrl2",   key: "imageUrl2",   width: 60 },
    { header: "imageUrl3",   key: "imageUrl3",   width: 60 },
    { header: "imageAlt",    key: "imageAlt",    width: 40 },
    { header: "isPublished", key: "isPublished", width: 12 },
    { header: "visibleInListings", key: "visibleInListings", width: 16 },
    { header: "seoTitle",    key: "seoTitle",    width: 45 },
    { header: "seoDescription", key: "seoDescription", width: 80 },
  ];

  // Bold header row
  productsSheet.getRow(1).font = { bold: true };
  productsSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9EAD3" },
  };

  ALL_PRODUCTS.forEach((p, i) => {
    const pricing = calculatePricing(p.basePrice_ILS, p.basePrice_USD, p.discount);
    const price = currency === "usd" ? pricing.price_USD : pricing.price_ILS;
    const costPrice = currency === "usd" ? pricing.costPrice_USD : pricing.costPrice_ILS;
    const name = lang === "he" ? p.model_he : p.model;
    const description = lang === "he" ? buildProductDescriptionHe(p) : buildProductDescription(p);
    const slug = toSlug(`${p.brand}-${p.model}`);
    const sku = `${p.brand.slice(0, 3).toUpperCase()}-${p.category.slice(0, 4).toUpperCase()}-${String(i + 1).padStart(3, "0")}`;
    const images = getImages(i);
    const collections = p.collections.join(";");

    productsSheet.addRow({
      name,
      slug,
      description,
      productType: p.type,
      category: p.category,
      brand: p.brand,
      collections,
      price,
      costPrice,
      stock: 50,
      sku,
      weight: 1.0,
      imageUrl: images[0],
      imageUrl2: images[1],
      imageUrl3: images[2],
      imageAlt: `${p.brand} ${p.model}`,
      isPublished: "Yes",
      visibleInListings: "Yes",
      seoTitle: `${p.model} - Protein House`,
      seoDescription: buildProductDescription(p),
    });
  });

  // ─── Sheet 2: Categories ────────────────────────────────────────────────────
  const categoriesSheet = workbook.addWorksheet("Categories");
  categoriesSheet.columns = [
    { header: "name",                key: "name",                width: 35 },
    { header: "slug",                key: "slug",                width: 30 },
    { header: "description",         key: "description",         width: 80 },
    { header: "parent",              key: "parent",              width: 20 },
    { header: "backgroundImageUrl",  key: "backgroundImageUrl",  width: 60 },
    { header: "backgroundImageAlt",  key: "backgroundImageAlt",  width: 40 },
    { header: "seoTitle",            key: "seoTitle",            width: 45 },
    { header: "seoDescription",      key: "seoDescription",      width: 80 },
  ];

  categoriesSheet.getRow(1).font = { bold: true };
  categoriesSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFCFE2F3" },
  };

  CATEGORIES.forEach((c) => {
    const name = lang === "he" ? c.name_he : c.name_en;
    const description = lang === "he" ? (c.description_he || "") : (c.description_en || "");
    const seoTitle = lang === "he" ? (c.seoTitle_he || "") : (c.seoTitle_en || "");

    categoriesSheet.addRow({
      name,
      slug: c.slug,
      description,
      parent: c.parent || "",
      backgroundImageUrl: c.backgroundImageUrl || "",
      backgroundImageAlt: c.backgroundImageAlt || name,
      seoTitle,
      seoDescription: description,
    });
  });

  // ─── Sheet 3: Collections ───────────────────────────────────────────────────
  const collectionsSheet = workbook.addWorksheet("Collections");
  collectionsSheet.columns = [
    { header: "name",                key: "name",                width: 35 },
    { header: "slug",                key: "slug",                width: 30 },
    { header: "description",         key: "description",         width: 80 },
    { header: "backgroundImageUrl",  key: "backgroundImageUrl",  width: 60 },
    { header: "backgroundImageAlt",  key: "backgroundImageAlt",  width: 40 },
    { header: "isPublished",         key: "isPublished",         width: 12 },
    { header: "seoTitle",            key: "seoTitle",            width: 45 },
    { header: "seoDescription",      key: "seoDescription",      width: 80 },
  ];

  collectionsSheet.getRow(1).font = { bold: true };
  collectionsSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFF2CC" },
  };

  COLLECTIONS.forEach((col) => {
    const name = lang === "he" ? col.name_he : col.name_en;
    const description = lang === "he" ? (col.description_he || "") : (col.description_en || "");

    collectionsSheet.addRow({
      name,
      slug: col.slug,
      description,
      backgroundImageUrl: col.backgroundImageUrl || "",
      backgroundImageAlt: col.backgroundImageAlt || name,
      isPublished: "Yes",
      seoTitle: `${name} - Protein House`,
      seoDescription: description,
    });
  });

  // ─── Write output ───────────────────────────────────────────────────────────
  const suffix = lang === "he" ? "he" : "en";
  const outputPath = path.join(OUTPUT_DIR, `protein-house-catalog-${suffix}.xlsx`);
  await workbook.xlsx.writeFile(outputPath);

  const productCount = ALL_PRODUCTS.length;
  const catCount = CATEGORIES.length;
  const colCount = COLLECTIONS.length;
  console.log(`✓ Generated ${outputPath}`);
  console.log(`  Products: ${productCount} rows`);
  console.log(`  Categories: ${catCount} rows`);
  console.log(`  Collections: ${colCount} rows`);
}

generate().catch((err) => {
  console.error("Generator failed:", err);
  process.exit(1);
});
