#!/usr/bin/env node
/**
 * Generates dropship-catalog-30.csv for Bulk Manager import.
 * 30 products (20 shoes, 5 tops, 5 accessories) with CJ Dropshipping metadata.
 * Run: node scripts/generate-dropship-catalog.js
 */

const fs = require("fs");
const path = require("path");

// ── Product Definitions ──────────────────────────────────────────────────────

const SHOES = [
  { name: "Urban Mesh Runner", slug: "urban-mesh-runner", gender: "Men", cat: "men-running-shoes", cost: 14, price: 39.99, style: "Running", material: "Mesh", colors: ["Black", "Navy"], collections: "new-arrivals;running-essentials;featured-products", desc: "Lightweight mesh running shoe with breathable upper and responsive cushioning for everyday runs" },
  { name: "Classic Canvas Low-Top", slug: "classic-canvas-low-top", gender: "Men", cat: "men-casual-shoes", cost: 10, price: 29.99, style: "Casual", material: "Canvas", colors: ["Black", "White"], collections: "new-arrivals;casual-style;under-200", desc: "Timeless canvas sneaker with vulcanized rubber sole and clean minimal design" },
  { name: "Retro Chunky Dad Sneaker", slug: "retro-chunky-dad-sneaker", gender: "Men", cat: "men-casual-shoes", cost: 16, price: 44.99, style: "Fashion", material: "Synthetic", colors: ["Black", "Gray"], collections: "new-arrivals;casual-style;featured-products", desc: "Bold chunky sneaker with retro-inspired silhouette and multi-layer sole unit" },
  { name: "Breathable Knit Trainer", slug: "breathable-knit-trainer", gender: "Men", cat: "men-training-shoes", cost: 12, price: 34.99, style: "Training", material: "Knit", colors: ["Black", "Red"], collections: "new-arrivals;training-gear", desc: "Flexible knit training shoe with supportive midfoot cage for gym and cross-training" },
  { name: "Street High-Top Basketball", slug: "street-high-top-basketball", gender: "Men", cat: "men-casual-shoes", cost: 18, price: 49.99, style: "Fashion", material: "Synthetic", colors: ["Black", "White"], collections: "new-arrivals;casual-style;featured-products;best-sellers", desc: "Street-ready high-top with padded ankle collar and premium court-style outsole" },
  { name: "Minimalist White Leather", slug: "minimalist-white-leather", gender: "Men", cat: "men-casual-shoes", cost: 15, price: 42.99, style: "Casual", material: "Leather", colors: ["White", "Beige"], collections: "new-arrivals;casual-style;featured-products", desc: "Clean white leather sneaker with minimalist design for versatile everyday styling" },
  { name: "Air Cushion Sport Runner", slug: "air-cushion-sport-runner", gender: "Men", cat: "men-running-shoes", cost: 16, price: 45.99, style: "Running", material: "Mesh", colors: ["Black", "Blue"], collections: "new-arrivals;running-essentials;best-sellers", desc: "Performance running shoe with visible air cushion unit and engineered mesh upper" },
  { name: "Suede Retro Skate Shoe", slug: "suede-retro-skate-shoe", gender: "Men", cat: "men-casual-shoes", cost: 13, price: 37.99, style: "Casual", material: "Suede", colors: ["Black", "Brown"], collections: "new-arrivals;casual-style", desc: "Classic suede skate shoe with reinforced toe cap and grippy gum rubber outsole" },
  { name: "Memory Foam Slip-On", slug: "memory-foam-slip-on-men", gender: "Men", cat: "men-walking-comfort", cost: 11, price: 32.99, style: "Comfort", material: "Knit", colors: ["Black", "Gray"], collections: "new-arrivals;walking-comfort-collection", desc: "Easy slip-on walking shoe with memory foam insole for all-day cushioned comfort" },
  { name: "Reflective Night Runner", slug: "reflective-night-runner", gender: "Men", cat: "men-running-shoes", cost: 17, price: 47.99, style: "Running", material: "Mesh", colors: ["Black", "Neon Green"], collections: "new-arrivals;running-essentials;featured-products", desc: "High-visibility running shoe with 360-degree reflective details for safe night runs" },
  { name: "All-Black Stealth Trainer", slug: "all-black-stealth-trainer", gender: "Men", cat: "men-training-shoes", cost: 14, price: 39.99, style: "Training", material: "Synthetic", colors: ["Black", "Dark Gray"], collections: "new-arrivals;training-gear;best-sellers", desc: "Murdered-out training shoe with non-marking outsole and lateral stability support" },
  { name: "Colorblock Retro Jogger", slug: "colorblock-retro-jogger", gender: "Men", cat: "men-casual-shoes", cost: 15, price: 42.99, style: "Fashion", material: "Synthetic", colors: ["White", "Red"], collections: "new-arrivals;casual-style", desc: "Retro-inspired jogger sneaker with bold colorblock panels and EVA midsole" },
  { name: "Chunky Platform Sneaker", slug: "chunky-platform-sneaker-w", gender: "Women", cat: "women-casual-shoes", cost: 16, price: 44.99, style: "Fashion", material: "Synthetic", colors: ["White", "Pink"], collections: "new-arrivals;casual-style;featured-products;best-sellers", desc: "Trend-setting chunky platform sneaker with 5cm sole height and padded collar" },
  { name: "Pastel Knit Sock Sneaker", slug: "pastel-knit-sock-sneaker", gender: "Women", cat: "women-casual-shoes", cost: 13, price: 36.99, style: "Fashion", material: "Knit", colors: ["Pink", "Lavender"], collections: "new-arrivals;casual-style", desc: "Lightweight sock-style sneaker in soft pastel tones with flexible knit upper" },
  { name: "Lightweight Mesh Runner", slug: "lightweight-mesh-runner-w", gender: "Women", cat: "women-running-shoes", cost: 14, price: 39.99, style: "Running", material: "Mesh", colors: ["Black", "Coral"], collections: "new-arrivals;running-essentials", desc: "Featherlight women's running shoe with breathable mesh and responsive foam midsole" },
  { name: "Butterfly Print Fashion", slug: "butterfly-print-fashion", gender: "Women", cat: "women-casual-shoes", cost: 12, price: 34.99, style: "Fashion", material: "Canvas", colors: ["White", "Multicolor"], collections: "new-arrivals;casual-style", desc: "Eye-catching fashion sneaker with butterfly print canvas upper and white sole" },
  { name: "White Platform Court Shoe", slug: "white-platform-court-shoe", gender: "Women", cat: "women-casual-shoes", cost: 15, price: 42.99, style: "Fashion", material: "Leather", colors: ["White", "Gold"], collections: "new-arrivals;casual-style;featured-products", desc: "Elevated court sneaker with platform sole and subtle metallic accent details" },
  { name: "Color Block Lifestyle", slug: "color-block-lifestyle-w", gender: "Women", cat: "women-casual-shoes", cost: 13, price: 37.99, style: "Fashion", material: "Synthetic", colors: ["Black", "Pink"], collections: "new-arrivals;casual-style", desc: "Sporty lifestyle sneaker with bold color blocking and comfortable cushioned insole" },
  { name: "Memory Foam Walking Shoe", slug: "memory-foam-walking-shoe-w", gender: "Women", cat: "women-walking-comfort", cost: 11, price: 32.99, style: "Comfort", material: "Knit", colors: ["Black", "Gray"], collections: "new-arrivals;walking-comfort-collection", desc: "Ultra-comfortable walking shoe with premium memory foam and lightweight knit upper" },
  { name: "Canvas Classic Slip-On", slug: "canvas-classic-slip-on-w", gender: "Women", cat: "women-casual-shoes", cost: 9, price: 27.99, style: "Casual", material: "Canvas", colors: ["Black", "Navy"], collections: "new-arrivals;casual-style;under-200", desc: "Easy-on canvas slip-on with elastic gore panels and cushioned footbed" },
];

const TOPS = [
  { name: "Oversized Graphic Tee", slug: "oversized-graphic-tee", gender: "Men", cat: "men-tops", cost: 8, price: 25.99, type: "T-Shirt", material: "Cotton", colors: ["Black", "White"], collections: "new-arrivals;casual-style", desc: "Relaxed fit graphic tee with drop shoulder and premium cotton construction" },
  { name: "Zip-Up Windbreaker", slug: "zip-up-windbreaker", gender: "Men", cat: "men-tops", cost: 18, price: 49.99, type: "Jacket", material: "Polyester", colors: ["Black", "Navy"], collections: "new-arrivals;featured-products", desc: "Lightweight windbreaker jacket with full zip, hood, and water-resistant finish" },
  { name: "Vintage Wash Crew Sweatshirt", slug: "vintage-wash-crew-sweatshirt", gender: "Men", cat: "men-tops", cost: 14, price: 39.99, type: "Sweatshirt", material: "Cotton Blend", colors: ["Black", "Charcoal"], collections: "new-arrivals;casual-style;best-sellers", desc: "Pre-washed crew neck sweatshirt with lived-in feel and brushed fleece interior" },
  { name: "Cropped Street Hoodie", slug: "cropped-street-hoodie", gender: "Women", cat: "women-tops", cost: 12, price: 34.99, type: "Hoodie", material: "Cotton Blend", colors: ["Black", "Pink"], collections: "new-arrivals;casual-style", desc: "Trendy cropped hoodie with kangaroo pocket and adjustable drawstring hood" },
  { name: "Color Block Tank Top", slug: "color-block-tank-top", gender: "Women", cat: "women-tops", cost: 7, price: 22.99, type: "Tank Top", material: "Polyester", colors: ["Black", "White"], collections: "new-arrivals;casual-style", desc: "Breathable color block tank with racerback design for workouts and casual wear" },
];

const ACCESSORIES = [
  { name: "Streetwear Baseball Cap", slug: "streetwear-baseball-cap", cost: 5, price: 18.99, material: "Cotton", colors: ["Black", "White"], collections: "new-arrivals;casual-style", desc: "Adjustable cotton baseball cap with embroidered logo and curved brim" },
  { name: "Sport Crossbody Sling Bag", slug: "sport-crossbody-sling-bag", cost: 8, price: 26.99, material: "Nylon", colors: ["Black", "Gray"], collections: "new-arrivals;casual-style", desc: "Compact crossbody sling bag with multiple compartments and adjustable strap" },
  { name: "Cushioned Athletic Socks 3-Pack", slug: "cushioned-athletic-socks-3pack", cost: 4, price: 14.99, material: "Cotton Blend", colors: ["Black", "White"], collections: "new-arrivals", desc: "Three-pack of cushioned athletic crew socks with arch support and moisture wicking" },
  { name: "Premium Shoe Cleaning Kit", slug: "premium-shoe-cleaning-kit", cost: 6, price: 19.99, material: "Mixed", colors: ["Black", "Clear"], collections: "new-arrivals", desc: "Complete shoe care kit with cleaning solution, brush, microfiber cloth, and carrying case" },
  { name: "Reflective Drawstring Backpack", slug: "reflective-drawstring-backpack", cost: 7, price: 24.99, material: "Polyester", colors: ["Black", "Gray"], collections: "new-arrivals;casual-style", desc: "Lightweight drawstring backpack with reflective strips and interior zip pocket" },
];

// ── Size Definitions ─────────────────────────────────────────────────────────

const MEN_SIZES = ["40", "41", "42", "43", "44", "45"];
const WOMEN_SIZES = ["36", "37", "38", "39", "40", "41"];
const APPAREL_SIZES = ["S", "M", "L", "XL"];

// ── CSV Generation ───────────────────────────────────────────────────────────

const HEADERS = [
  "name", "productType", "category", "slug", "description",
  "variantName", "sku", "price", "costPrice",
  "variantAttr:Shoe size", "variantAttr:Color", "variantAttr:Apparel Size",
  "attr:Gender", "attr:Material", "attr:Style", "attr:Apparel Type",
  "imageUrl", "seoTitle", "seoDescription",
  "collections", "metadata", "isPublished", "trackInventory"
];

function escapeCSV(val) {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildRow(fields) {
  return HEADERS.map((h) => escapeCSV(fields[h] || "")).join(",");
}

function colorCode(c) {
  const map = {
    Black: "BLK", White: "WHT", Navy: "NVY", Gray: "GRY", Red: "RED",
    Blue: "BLU", Brown: "BRN", Beige: "BGE", "Neon Green": "NGR",
    "Dark Gray": "DGR", Pink: "PNK", Lavender: "LAV", Coral: "CRL",
    Multicolor: "MLT", Gold: "GLD", Charcoal: "CHR", Clear: "CLR",
  };
  return map[c] || c.substring(0, 3).toUpperCase();
}

const rows = [HEADERS.join(",")];
let shoeIdx = 0;
let topIdx = 0;
let accIdx = 0;

// ── Generate Shoes ───────────────────────────────────────────────────────────
SHOES.forEach((shoe) => {
  shoeIdx++;
  const num = String(shoeIdx).padStart(3, "0");
  const sizes = shoe.gender === "Women" ? WOMEN_SIZES : MEN_SIZES;
  const vidBase = 100000 + shoeIdx * 100;
  let isFirst = true;

  shoe.colors.forEach((color, ci) => {
    sizes.forEach((size, si) => {
      const sku = `DS-SH-${num}-${size}-${colorCode(color)}`;
      const vid = `vid-${vidBase + ci * sizes.length + si}`;
      const meta = `dropship:{"supplier":"cj","supplierSku":"${vid}","costPrice":${shoe.cost}};source:cj-dropship`;
      const variantName = `${size} / ${color}`;
      const img = `https://via.placeholder.com/800x800/333/fff?text=${encodeURIComponent(shoe.name.replace(/ /g, "+"))}`;

      const fields = {
        variantName,
        sku,
        price: shoe.price,
        costPrice: shoe.cost,
        "variantAttr:Shoe size": size,
        "variantAttr:Color": color,
        isPublished: "Yes",
        trackInventory: "No",
      };

      if (isFirst) {
        fields.name = shoe.name;
        fields.productType = "Shoes";
        fields.category = shoe.cat;
        fields.slug = shoe.slug;
        fields.description = shoe.desc;
        fields["attr:Gender"] = shoe.gender;
        fields["attr:Material"] = shoe.material;
        fields["attr:Style"] = shoe.style;
        fields.imageUrl = img;
        fields.seoTitle = `${shoe.name} - Mansour Shoes`;
        fields.seoDescription = shoe.desc;
        fields.collections = shoe.collections;
        fields.metadata = meta;
        isFirst = false;
      }

      rows.push(buildRow(fields));
    });
  });
});

// ── Generate Tops ────────────────────────────────────────────────────────────
TOPS.forEach((top) => {
  topIdx++;
  const num = String(20 + topIdx).padStart(3, "0");
  const vidBase = 200000 + topIdx * 100;
  let isFirst = true;

  top.colors.forEach((color, ci) => {
    APPAREL_SIZES.forEach((size, si) => {
      const sku = `DS-TOP-${num}-${size}-${colorCode(color)}`;
      const vid = `vid-${vidBase + ci * APPAREL_SIZES.length + si}`;
      const meta = `dropship:{"supplier":"cj","supplierSku":"${vid}","costPrice":${top.cost}};source:cj-dropship`;
      const variantName = `${size} / ${color}`;
      const img = `https://via.placeholder.com/800x800/333/fff?text=${encodeURIComponent(top.name.replace(/ /g, "+"))}`;

      const fields = {
        variantName,
        sku,
        price: top.price,
        costPrice: top.cost,
        "variantAttr:Apparel Size": size,
        "variantAttr:Color": color,
        isPublished: "Yes",
        trackInventory: "No",
      };

      if (isFirst) {
        fields.name = top.name;
        fields.productType = "Tops";
        fields.category = top.cat;
        fields.slug = top.slug;
        fields.description = top.desc;
        fields["attr:Gender"] = top.gender;
        fields["attr:Material"] = top.material;
        fields["attr:Apparel Type"] = top.type;
        fields.imageUrl = img;
        fields.seoTitle = `${top.name} - Mansour Shoes`;
        fields.seoDescription = top.desc;
        fields.collections = top.collections;
        fields.metadata = meta;
        isFirst = false;
      }

      rows.push(buildRow(fields));
    });
  });
});

// ── Generate Accessories ─────────────────────────────────────────────────────
ACCESSORIES.forEach((acc) => {
  accIdx++;
  const num = String(25 + accIdx).padStart(3, "0");
  const vidBase = 300000 + accIdx * 100;
  let isFirst = true;

  acc.colors.forEach((color, ci) => {
    const sku = `DS-ACC-${num}-${colorCode(color)}`;
    const vid = `vid-${vidBase + ci}`;
    const meta = `dropship:{"supplier":"cj","supplierSku":"${vid}","costPrice":${acc.cost}};source:cj-dropship`;
    const variantName = color;
    const img = `https://via.placeholder.com/800x800/333/fff?text=${encodeURIComponent(acc.name.replace(/ /g, "+"))}`;

    const fields = {
      variantName,
      sku,
      price: acc.price,
      costPrice: acc.cost,
      "variantAttr:Color": color,
      isPublished: "Yes",
      trackInventory: "No",
    };

    if (isFirst) {
      fields.name = acc.name;
      fields.productType = "Accessories";
      fields.slug = acc.slug;
      fields.description = acc.desc;
      fields["attr:Material"] = acc.material;
      fields.imageUrl = img;
      fields.seoTitle = `${acc.name} - Mansour Shoes`;
      fields.seoDescription = acc.desc;
      fields.collections = acc.collections;
      fields.metadata = meta;
      isFirst = false;
    }

    rows.push(buildRow(fields));
  });
});

// ── Write CSV ────────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, "dropship-catalog-30.csv");
fs.writeFileSync(outPath, rows.join("\n"), "utf-8");

console.log(`Generated ${outPath}`);
console.log(`Total rows: ${rows.length} (1 header + ${rows.length - 1} data)`);
console.log(`Products: ${SHOES.length} shoes + ${TOPS.length} tops + ${ACCESSORIES.length} accessories = ${SHOES.length + TOPS.length + ACCESSORIES.length}`);
console.log(`Variant rows: ${rows.length - 1} (${SHOES.length * 12} shoe + ${TOPS.length * 8} top + ${ACCESSORIES.length * 2} accessory)`);
