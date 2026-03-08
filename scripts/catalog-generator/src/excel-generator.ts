import ExcelJS from "exceljs";
import path from "path";
import { CATEGORIES } from "./config/categories";
import { COLLECTIONS } from "./config/collections";
import { ALL_PRODUCTS } from "./config/products";
import { getRandomImages } from "./config/images";
import { generateProductName, generateDescription } from "./generators/descriptions";
import { calculatePricing } from "./generators/pricing";
import { generateStockLevels } from "./generators/stock";

// Pet product sizes
const PET_SIZES = ["XS", "S", "M", "L", "XL"];
// Colors
const COLORS = ["Black", "White", "Navy", "Red", "Gray", "Blue", "Green"];

type Lang = "en" | "he";

function wrapEditorJS(text: string): string {
  return JSON.stringify({
    blocks: [{ type: "paragraph", data: { text } }],
  });
}

async function generateExcel(lang: Lang) {
  const langLabel = lang === "en" ? "English" : "Hebrew";
  console.log(`\n🚀 Generating Pawzen Catalog Excel (${langLabel})...\n`);

  const workbook = new ExcelJS.Workbook();

  // Sheet 1: Products
  console.log("📦 Generating Products...");
  const productsSheet = workbook.addWorksheet("Products");

  productsSheet.columns = [
    { header: "name", key: "name", width: 50 },
    { header: "slug", key: "slug", width: 40 },
    { header: "description", key: "description", width: 60 },
    { header: "productType", key: "productType", width: 15 },
    { header: "category", key: "category", width: 25 },
    { header: "sku", key: "sku", width: 20 },
    { header: "variantName", key: "variantName", width: 20 },
    { header: "price", key: "price", width: 10 },
    { header: "costPrice", key: "costPrice", width: 10 },
    { header: "stock:Pawzen Israel Warehouse", key: "stockMain", width: 12 },
    { header: "stock:Pawzen International Warehouse", key: "stockIntl", width: 12 },
    { header: "trackInventory", key: "trackInventory", width: 12 },
    { header: "imageUrl", key: "imageUrl", width: 80 },
    { header: "imageUrl2", key: "imageUrl2", width: 80 },
    { header: "imageUrl3", key: "imageUrl3", width: 80 },
    { header: "imageUrl4", key: "imageUrl4", width: 80 },
    { header: "imageUrl5", key: "imageUrl5", width: 80 },
    { header: "imageAlt", key: "imageAlt", width: 40 },
    { header: "collections", key: "collections", width: 40 },
    { header: "attr:Pet Type", key: "petType", width: 10 },
    { header: "attr:Material", key: "material", width: 15 },
    { header: "attr:Toy Category", key: "style", width: 15 },
    { header: "attr:Feeding Type", key: "productTypeAttr", width: 15 },
    { header: "variantAttr:Size", key: "size", width: 10 },
    { header: "variantAttr:Color", key: "color", width: 10 },
    { header: "isPublished", key: "isPublished", width: 10 },
    { header: "visibleInListings", key: "visibleInListings", width: 15 },
    { header: "chargeTaxes", key: "chargeTaxes", width: 10 },
  ];

  let productCount = 0;
  let variantCount = 0;

  // SKU prefix map for pet product types
  const skuPrefixMap: Record<string, string> = {
    "Pet Toys & Enrichment": "PT",
    "Pet Feeding & Hydration": "PF",
    "Pet Comfort & Living": "PC",
    "Pet Care & Accessories": "PA",
  };

  // Process each product
  for (const product of ALL_PRODUCTS) {
    productCount++;

    // Generate product names and descriptions
    const names = generateProductName({
      model: product.model,
      model_he: product.model_he,
      petType: product.petType,
      type: product.type,
    });

    const descriptions = generateDescription({
      model: product.model,
      petType: product.petType,
      type: product.subType || product.type,
      material: product.material,
    });

    // Pick name/description based on language
    const productName = lang === "en" ? names.name_en : names.name_he;
    const productDescription = lang === "en" ? descriptions.en : descriptions.he;

    // Calculate pricing
    const pricing = calculatePricing(
      product.basePrice_ILS,
      product.basePrice_USD,
      product.discount
    );

    // Generate slug — strip all non-alphanumeric chars (dots, apostrophes, etc.)
    const slug = `${product.petType}-${product.model}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Get images
    const images = getRandomImages(5);

    // All pet products use the same size range
    const sizes = PET_SIZES;

    // Generate stock levels for all variants
    const stockLevels = generateStockLevels(sizes.length);

    // Category name: use translated name for Hebrew
    const categoryName = lang === "en"
      ? product.category
      : (CATEGORIES.find((c) => c.slug === product.category.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))?.name_he || product.category);

    // Determine SKU prefix from product type
    const skuPrefix = skuPrefixMap[product.type] || "PZ";

    // Generate variants
    sizes.forEach((size, index) => {
      variantCount++;
      const isFirstVariant = index === 0;
      const stock = stockLevels[index];

      const row = {
        name: isFirstVariant ? productName : "",
        slug: isFirstVariant ? slug : "",
        description: isFirstVariant ? productDescription : "",
        productType: isFirstVariant ? product.type : "",
        category: isFirstVariant ? product.category : "",
        sku: `PZ-${product.model.replace(/[^a-zA-Z0-9]/g, "").substring(0, 6).toUpperCase()}-${product.petType.substring(0, 1).toUpperCase()}-${size}`,
        variantName: `Size ${size}`,
        price: pricing.price_ILS.toFixed(2),
        costPrice: pricing.costPrice_ILS.toFixed(2),
        stockMain: stock.main.toString(),
        stockIntl: stock.international.toString(),
        trackInventory: "Yes",
        imageUrl: isFirstVariant ? images[0] : "",
        imageUrl2: isFirstVariant ? images[1] : "",
        imageUrl3: isFirstVariant ? images[2] : "",
        imageUrl4: isFirstVariant ? images[3] : "",
        imageUrl5: isFirstVariant ? images[4] : "",
        imageAlt: isFirstVariant ? product.model : "",
        collections: isFirstVariant ? product.collections.join(";") : "",
        brand: "",
        petType: product.petType,
        material: product.material,
        style: product.subType || "",
        productTypeAttr: product.subType || "",
        size: size,
        color: "Black", // Default color
        isPublished: "Yes",
        visibleInListings: "Yes",
        chargeTaxes: "Yes",
      };

      productsSheet.addRow(row);
    });

    if (productCount % 10 === 0) {
      console.log(`  ✓ Processed ${productCount} products (${variantCount} variants)`);
    }
  }

  console.log(`✅ Generated ${productCount} products with ${variantCount} variants\n`);

  // Sheet 2: Categories
  console.log("📁 Generating Categories...");
  const categoriesSheet = workbook.addWorksheet("Categories");

  categoriesSheet.columns = [
    { header: "name", key: "name", width: 40 },
    { header: "slug", key: "slug", width: 30 },
    { header: "description", key: "description", width: 60 },
    { header: "parent", key: "parent", width: 30 },
    { header: "isPublished", key: "isPublished", width: 12 },
  ];

  CATEGORIES.forEach((category) => {
    const catName = lang === "en" ? category.name_en : category.name_he;
    const catDesc = lang === "en"
      ? (category.description_en || `${category.name_en} category`)
      : (category.description_he || `קטגוריית ${category.name_he}`);

    categoriesSheet.addRow({
      name: catName,
      slug: category.slug,
      description: catDesc,
      parent: category.parent || "",
      isPublished: "Yes",
    });
  });

  console.log(`✅ Generated ${CATEGORIES.length} categories\n`);

  // Sheet 3: Collections
  console.log("🏷️  Generating Collections...");
  const collectionsSheet = workbook.addWorksheet("Collections");

  collectionsSheet.columns = [
    { header: "name", key: "name", width: 40 },
    { header: "slug", key: "slug", width: 30 },
    { header: "description", key: "description", width: 60 },
    { header: "isPublished", key: "isPublished", width: 12 },
  ];

  COLLECTIONS.forEach((collection) => {
    const colName = lang === "en" ? collection.name_en : collection.name_he;
    const colDesc = lang === "en"
      ? (collection.description_en || "")
      : (collection.description_he || "");

    collectionsSheet.addRow({
      name: colName,
      slug: collection.slug,
      description: colDesc,
      isPublished: "Yes",
    });
  });

  console.log(`✅ Generated ${COLLECTIONS.length} collections\n`);

  // Save file
  const suffix = lang === "en" ? "" : "-he";
  const outputPath = path.join(__dirname, `../output/pawzen-catalog${suffix}.xlsx`);
  await workbook.xlsx.writeFile(outputPath);

  console.log(`\n🎉 SUCCESS! Excel file generated (${langLabel}):\n   ${outputPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Products: ${productCount}`);
  console.log(`   - Variants: ${variantCount}`);
  console.log(`   - Categories: ${CATEGORIES.length}`);
  console.log(`   - Collections: ${COLLECTIONS.length}`);
}

async function main() {
  const langArg = process.argv[2]?.toLowerCase();

  if (langArg === "he" || langArg === "hebrew") {
    await generateExcel("he");
  } else if (langArg === "en" || langArg === "english") {
    await generateExcel("en");
  } else {
    // Default: generate both
    await generateExcel("en");
    await generateExcel("he");
    console.log("\n✅ Both English and Hebrew Excel files ready for import!");
  }
}

main().catch((error) => {
  console.error("❌ Error generating Excel:", error);
  process.exit(1);
});
