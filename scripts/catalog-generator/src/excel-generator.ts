import ExcelJS from "exceljs";
import path from "path";
import { CATEGORIES } from "./config/categories";
import { COLLECTIONS } from "./config/collections";
import { ALL_PRODUCTS } from "./config/products";
import { getRandomImages } from "./config/images";
import { generateProductName, generateDescription } from "./generators/descriptions";
import { calculatePricing } from "./generators/pricing";
import { generateStockLevels } from "./generators/stock";

// Shoe sizes (EU)
const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];
// Apparel sizes
const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
// Colors
const COLORS = ["Black", "White", "Navy", "Red", "Gray", "Blue", "Green"];

async function generateExcel() {
  console.log("🚀 Generating Mansour Catalog Excel...\n");

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
    { header: "stock:Main Warehouse", key: "stockMain", width: 12 },
    { header: "stock:International Warehouse", key: "stockIntl", width: 12 },
    { header: "trackInventory", key: "trackInventory", width: 12 },
    { header: "imageUrl", key: "imageUrl", width: 80 },
    { header: "imageUrl2", key: "imageUrl2", width: 80 },
    { header: "imageUrl3", key: "imageUrl3", width: 80 },
    { header: "imageUrl4", key: "imageUrl4", width: 80 },
    { header: "imageUrl5", key: "imageUrl5", width: 80 },
    { header: "imageAlt", key: "imageAlt", width: 40 },
    { header: "collections", key: "collections", width: 40 },
    { header: "attr:Brand", key: "brand", width: 15 },
    { header: "attr:Gender", key: "gender", width: 10 },
    { header: "attr:Material", key: "material", width: 15 },
    { header: "attr:Style", key: "style", width: 15 },
    { header: "attr:Apparel Type", key: "productTypeAttr", width: 15 },
    { header: "variantAttr:Shoe size", key: "shoeSize", width: 10 },
    { header: "variantAttr:Apparel Size", key: "apparelSize", width: 12 },
    { header: "variantAttr:Color", key: "color", width: 10 },
    { header: "isPublished", key: "isPublished", width: 10 },
    { header: "visibleInListings", key: "visibleInListings", width: 15 },
    { header: "chargeTaxes", key: "chargeTaxes", width: 10 },
  ];

  let productCount = 0;
  let variantCount = 0;

  // Process each product
  for (const product of ALL_PRODUCTS) {
    productCount++;

    // Generate product names and descriptions
    const names = generateProductName({
      brand: product.brand,
      model: product.model,
      model_he: product.model_he,
      gender: product.gender,
      type: product.type,
    });

    const descriptions = generateDescription({
      brand: product.brand,
      model: product.model,
      gender: product.gender,
      type: product.style || product.productType || product.type,
      material: product.material,
    });

    // Calculate pricing
    const pricing = calculatePricing(
      product.basePrice_ILS,
      product.basePrice_USD,
      product.discount
    );

    // Generate slug — strip all non-alphanumeric chars (dots, apostrophes, etc.)
    const slug = `${product.brand}-${product.model}-${product.gender}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Get images
    const images = getRandomImages(5);

    // Determine sizes based on product type
    const sizes = product.type === "shoes" ? SHOE_SIZES : APPAREL_SIZES;
    const sizeAttrKey = product.type === "shoes" ? "shoeSize" : "apparelSize";

    // Generate stock levels for all variants
    const stockLevels = generateStockLevels(sizes.length);

    // Generate variants
    sizes.forEach((size, index) => {
      variantCount++;
      const isFirstVariant = index === 0;
      const stock = stockLevels[index];

      const row = {
        name: isFirstVariant ? names.name_he : "",
        slug: isFirstVariant ? slug : "",
        description: isFirstVariant ? descriptions.he : "",
        productType: isFirstVariant ? product.type.charAt(0).toUpperCase() + product.type.slice(1) : "",
        category: isFirstVariant ? product.category : "",
        sku: `${product.brand.substring(0, 2).toUpperCase()}-${product.model.replace(/[^a-zA-Z0-9]/g, "").substring(0, 6).toUpperCase()}-${product.gender.substring(0, 1).toUpperCase()}-${size}`,
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
        imageAlt: isFirstVariant ? `${product.brand} ${product.model}` : "",
        collections: isFirstVariant ? product.collections.join(";") : "",
        brand: product.brand,
        gender: product.gender,
        material: product.material,
        style: product.style || "",
        productTypeAttr: product.productType || "",
        [sizeAttrKey]: size,
        apparelSize: product.type === "shoes" ? "" : size,
        shoeSize: product.type === "shoes" ? size : "",
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
    categoriesSheet.addRow({
      name: category.name_he,
      slug: category.slug,
      description: category.description_he || `${category.name_he} - קטגוריה`,
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
    collectionsSheet.addRow({
      name: collection.name_he,
      slug: collection.slug,
      description: collection.description_he || "",
      isPublished: "Yes",
    });
  });

  console.log(`✅ Generated ${COLLECTIONS.length} collections\n`);

  // Save file
  const outputPath = path.join(__dirname, "../output/mansour-catalog-100products.xlsx");
  await workbook.xlsx.writeFile(outputPath);

  console.log(`\n🎉 SUCCESS! Excel file generated:\n   ${outputPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Products: ${productCount}`);
  console.log(`   - Variants: ${variantCount}`);
  console.log(`   - Categories: ${CATEGORIES.length}`);
  console.log(`   - Collections: ${COLLECTIONS.length}`);
  console.log(`\n✅ Ready to upload to Bulk Manager!`);
}

generateExcel().catch((error) => {
  console.error("❌ Error generating Excel:", error);
  process.exit(1);
});
