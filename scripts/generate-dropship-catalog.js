#!/usr/bin/env node
/**
 * Generates dropship-catalog-30.csv for Bulk Manager import.
 * 30 pet products (10 toys, 8 feeding, 7 comfort, 5 care) with CJ Dropshipping metadata.
 * Run: node scripts/generate-dropship-catalog.js
 */

const fs = require("fs");
const path = require("path");

// ── Product Definitions ──────────────────────────────────────────────────────

const PET_TOYS = [
  { name: "Rope Tug Toy", slug: "rope-tug-toy", petType: "Dogs", cat: "dog-toys", cost: 5, price: 14.99, style: "Interactive", material: "Cotton Rope", prodType: "Tug Toy", colors: ["Blue", "Red"], sizes: ["M", "L"], collections: "new-arrivals;featured-products", desc: "Durable braided rope toy for interactive tug-of-war play and dental health" },
  { name: "Squeaky Plush Duck", slug: "squeaky-plush-duck", petType: "Dogs", cat: "dog-toys", cost: 4, price: 12.99, style: "Plush", material: "Polyester", prodType: "Squeaky Toy", colors: ["Yellow", "Orange"], sizes: ["S", "M"], collections: "new-arrivals;best-sellers", desc: "Soft plush duck toy with built-in squeaker for hours of fun" },
  { name: "Rubber Fetch Ball", slug: "rubber-fetch-ball", petType: "Dogs", cat: "dog-toys", cost: 3, price: 9.99, style: "Active", material: "Natural Rubber", prodType: "Ball", colors: ["Blue", "Green"], sizes: ["S", "M", "L"], collections: "new-arrivals;featured-products", desc: "Bouncy natural rubber ball for fetch games, floats in water" },
  { name: "Cat Feather Wand", slug: "cat-feather-wand", petType: "Cats", cat: "cat-toys", cost: 3, price: 9.99, style: "Interactive", material: "Wood & Feather", prodType: "Wand Toy", colors: ["Multicolor", "Pink"], sizes: ["One Size"], collections: "new-arrivals;featured-products", desc: "Interactive feather wand toy with bell to stimulate natural hunting instincts" },
  { name: "Catnip Mouse Set", slug: "catnip-mouse-set", petType: "Cats", cat: "cat-toys", cost: 4, price: 11.99, style: "Plush", material: "Cotton", prodType: "Catnip Toy", colors: ["Gray", "Brown"], sizes: ["One Size"], collections: "new-arrivals", desc: "Set of 3 catnip-filled mice toys for batting and pouncing play" },
  { name: "Interactive Puzzle Toy", slug: "interactive-puzzle-toy", petType: "Dogs", cat: "dog-toys", cost: 8, price: 24.99, style: "Mental Stimulation", material: "ABS Plastic", prodType: "Puzzle", colors: ["Blue", "Green"], sizes: ["S", "L"], collections: "new-arrivals;best-sellers;featured-products", desc: "Multi-level treat puzzle toy to challenge and engage your dog mentally" },
  { name: "Cat Tunnel Tube", slug: "cat-tunnel-tube", petType: "Cats", cat: "cat-toys", cost: 7, price: 19.99, style: "Active", material: "Polyester", prodType: "Tunnel", colors: ["Blue", "Pink"], sizes: ["One Size"], collections: "new-arrivals", desc: "Collapsible play tunnel with crinkle material and peek-a-boo holes" },
  { name: "Dental Chew Bone", slug: "dental-chew-bone", petType: "Dogs", cat: "dog-toys", cost: 4, price: 13.99, style: "Dental", material: "Nylon", prodType: "Chew Toy", colors: ["Blue", "Green"], sizes: ["S", "M", "L"], collections: "new-arrivals", desc: "Textured dental chew bone that cleans teeth and freshens breath during play" },
  { name: "Laser Pointer Cat Toy", slug: "laser-pointer-cat-toy", petType: "Cats", cat: "cat-toys", cost: 3, price: 8.99, style: "Interactive", material: "Metal", prodType: "Laser Toy", colors: ["Silver", "Black"], sizes: ["One Size"], collections: "new-arrivals", desc: "USB rechargeable laser pointer with multiple patterns for endless chase fun" },
  { name: "Crinkle Ball Pack", slug: "crinkle-ball-pack", petType: "Cats", cat: "cat-toys", cost: 2, price: 7.99, style: "Active", material: "Mylar", prodType: "Ball", colors: ["Multicolor"], sizes: ["One Size"], collections: "new-arrivals", desc: "Pack of 12 lightweight crinkle balls that cats love to bat and chase" },
];

const PET_FEEDING = [
  { name: "Slow Feeder Bowl", slug: "slow-feeder-bowl", petType: "Dogs", cat: "dog-feeding", cost: 7, price: 19.99, style: "Functional", material: "BPA-Free Plastic", prodType: "Food Bowl", colors: ["Green", "Blue"], sizes: ["M", "L"], collections: "new-arrivals;best-sellers", desc: "Anti-gulp slow feeder bowl with maze pattern to promote healthy eating habits" },
  { name: "Elevated Double Bowl", slug: "elevated-double-bowl", petType: "Dogs", cat: "dog-feeding", cost: 12, price: 34.99, style: "Ergonomic", material: "Bamboo & Steel", prodType: "Bowl Stand", colors: ["Natural", "Black"], sizes: ["M", "L"], collections: "new-arrivals;featured-products", desc: "Raised feeding station with bamboo stand and stainless steel bowls for better posture" },
  { name: "Ceramic Cat Bowl", slug: "ceramic-cat-bowl", petType: "Cats", cat: "cat-feeding", cost: 5, price: 16.99, style: "Classic", material: "Ceramic", prodType: "Food Bowl", colors: ["White", "Blue"], sizes: ["S"], collections: "new-arrivals", desc: "Whisker-friendly wide ceramic bowl with non-slip base for comfortable eating" },
  { name: "Automatic Water Fountain", slug: "automatic-water-fountain", petType: "Dogs & Cats", cat: "pet-feeding", cost: 15, price: 42.99, style: "Automatic", material: "BPA-Free Plastic", prodType: "Water Fountain", colors: ["White", "Blue"], sizes: ["One Size"], collections: "new-arrivals;featured-products;best-sellers", desc: "2L circulating water fountain with carbon filter for fresh, clean drinking water" },
  { name: "Travel Water Bottle", slug: "travel-water-bottle", petType: "Dogs", cat: "dog-feeding", cost: 6, price: 17.99, style: "Portable", material: "Silicone & Plastic", prodType: "Water Bottle", colors: ["Blue", "Pink"], sizes: ["S", "L"], collections: "new-arrivals", desc: "Leak-proof portable water bottle with fold-out drinking trough for walks and trips" },
  { name: "Treat Dispensing Ball", slug: "treat-dispensing-ball", petType: "Dogs", cat: "dog-feeding", cost: 5, price: 15.99, style: "Interactive", material: "Natural Rubber", prodType: "Treat Dispenser", colors: ["Red", "Blue"], sizes: ["S", "M"], collections: "new-arrivals", desc: "Adjustable treat-dispensing ball that rewards play with tasty surprises" },
  { name: "Silicone Lick Mat", slug: "silicone-lick-mat", petType: "Dogs & Cats", cat: "pet-feeding", cost: 4, price: 12.99, style: "Enrichment", material: "Food-Grade Silicone", prodType: "Lick Mat", colors: ["Blue", "Green"], sizes: ["S", "M"], collections: "new-arrivals", desc: "Textured lick mat with suction cups for slow feeding and anxiety relief" },
  { name: "Portion Control Scoop", slug: "portion-control-scoop", petType: "Dogs & Cats", cat: "pet-feeding", cost: 3, price: 9.99, style: "Functional", material: "ABS Plastic", prodType: "Feeding Scoop", colors: ["Green", "Gray"], sizes: ["One Size"], collections: "new-arrivals", desc: "Measuring scoop with built-in clip for precise food portions and bag sealing" },
];

const PET_COMFORT = [
  { name: "Calming Donut Bed", slug: "calming-donut-bed", petType: "Dogs", cat: "dog-beds", cost: 14, price: 39.99, style: "Comfort", material: "Faux Fur", prodType: "Pet Bed", colors: ["Gray", "Brown"], sizes: ["M", "L"], collections: "new-arrivals;featured-products;best-sellers", desc: "Ultra-soft plush donut bed with raised rim for head and neck support" },
  { name: "Orthopedic Memory Foam Bed", slug: "orthopedic-memory-foam-bed", petType: "Dogs", cat: "dog-beds", cost: 22, price: 59.99, style: "Orthopedic", material: "Memory Foam", prodType: "Pet Bed", colors: ["Gray", "Navy"], sizes: ["M", "L", "XL"], collections: "new-arrivals;featured-products", desc: "Vet-recommended orthopedic bed with egg-crate memory foam for joint support" },
  { name: "Cat Window Perch", slug: "cat-window-perch", petType: "Cats", cat: "cat-furniture", cost: 10, price: 29.99, style: "Lounging", material: "Metal & Fleece", prodType: "Window Perch", colors: ["Gray", "Beige"], sizes: ["One Size"], collections: "new-arrivals;best-sellers", desc: "Sturdy suction-cup window perch with soft fleece cover for bird watching" },
  { name: "Cozy Fleece Blanket", slug: "cozy-fleece-blanket", petType: "Dogs & Cats", cat: "pet-comfort", cost: 6, price: 18.99, style: "Warmth", material: "Fleece", prodType: "Blanket", colors: ["Gray", "Beige", "Brown"], sizes: ["S", "M", "L"], collections: "new-arrivals", desc: "Super-soft pet blanket with paw print design for beds, sofas, and car seats" },
  { name: "Self-Warming Cat Mat", slug: "self-warming-cat-mat", petType: "Cats", cat: "cat-furniture", cost: 8, price: 22.99, style: "Warmth", material: "Thermal Fabric", prodType: "Warming Mat", colors: ["Gray", "Brown"], sizes: ["S", "M"], collections: "new-arrivals", desc: "Self-heating mat that reflects body heat without electricity for cozy napping" },
  { name: "Portable Travel Crate", slug: "portable-travel-crate", petType: "Dogs & Cats", cat: "pet-comfort", cost: 18, price: 49.99, style: "Travel", material: "Oxford Fabric", prodType: "Travel Crate", colors: ["Gray", "Blue"], sizes: ["S", "M", "L"], collections: "new-arrivals", desc: "Foldable soft-sided travel crate with mesh windows and carrying handles" },
  { name: "Anti-Anxiety Vest", slug: "anti-anxiety-vest", petType: "Dogs", cat: "dog-comfort", cost: 11, price: 32.99, style: "Calming", material: "Breathable Fabric", prodType: "Anxiety Wrap", colors: ["Gray", "Blue"], sizes: ["S", "M", "L", "XL"], collections: "new-arrivals;featured-products", desc: "Gentle compression vest that applies calming pressure during storms and fireworks" },
];

const PET_CARE = [
  { name: "Deshedding Grooming Brush", slug: "deshedding-grooming-brush", petType: "Dogs & Cats", cat: "grooming", cost: 6, price: 17.99, style: "Grooming", material: "Stainless Steel", prodType: "Brush", colors: ["Blue", "Green"], sizes: ["S", "L"], collections: "new-arrivals;best-sellers", desc: "Professional deshedding tool that reduces shedding up to 90% without damaging coat" },
  { name: "Nail Clipper with Guard", slug: "nail-clipper-with-guard", petType: "Dogs & Cats", cat: "grooming", cost: 4, price: 12.99, style: "Grooming", material: "Stainless Steel", prodType: "Nail Clipper", colors: ["Blue", "Pink"], sizes: ["S", "L"], collections: "new-arrivals", desc: "Safety nail clipper with quick-guard sensor and ergonomic non-slip handles" },
  { name: "Paw Balm Stick", slug: "paw-balm-stick", petType: "Dogs", cat: "grooming", cost: 3, price: 11.99, style: "Care", material: "Natural Beeswax", prodType: "Paw Care", colors: ["Natural"], sizes: ["One Size"], collections: "new-arrivals", desc: "All-natural paw balm stick that soothes and protects cracked or dry paw pads" },
  { name: "Pet Shampoo - Oatmeal", slug: "pet-shampoo-oatmeal", petType: "Dogs & Cats", cat: "grooming", cost: 4, price: 14.99, style: "Bath", material: "Natural Ingredients", prodType: "Shampoo", colors: ["Natural"], sizes: ["250ml", "500ml"], collections: "new-arrivals", desc: "Gentle oatmeal shampoo for sensitive skin with aloe vera and vitamin E" },
  { name: "LED Safety Collar", slug: "led-safety-collar", petType: "Dogs", cat: "dog-accessories", cost: 5, price: 16.99, style: "Safety", material: "Nylon & LED", prodType: "Collar", colors: ["Red", "Blue", "Green"], sizes: ["S", "M", "L"], collections: "new-arrivals;featured-products", desc: "USB rechargeable LED collar with 3 light modes for safe nighttime walks" },
];

// ── CSV Generation ───────────────────────────────────────────────────────────

const HEADERS = [
  "name", "productType", "category", "slug", "description",
  "variantName", "sku", "price", "costPrice",
  "variantAttr:Size", "variantAttr:Color",
  "attr:Pet Type", "attr:Material", "attr:Style", "attr:Product Type",
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
    Black: "BLK", White: "WHT", Blue: "BLU", Green: "GRN", Red: "RED",
    Gray: "GRY", Brown: "BRN", Beige: "BGE", Pink: "PNK", Yellow: "YLW",
    Orange: "ORG", Navy: "NVY", Multicolor: "MLT", Silver: "SLV",
    Natural: "NAT", "250ml": "250", "500ml": "500",
  };
  return map[c] || c.substring(0, 3).toUpperCase();
}

const rows = [HEADERS.join(",")];
let productIdx = 0;

function generateProducts(products, skuPrefix, typeLabel) {
  products.forEach((prod) => {
    productIdx++;
    const num = String(productIdx).padStart(3, "0");
    const vidBase = 100000 + productIdx * 100;
    let isFirst = true;

    prod.colors.forEach((color, ci) => {
      prod.sizes.forEach((size, si) => {
        const sku = `DS-${skuPrefix}-${num}-${size.replace(/\s/g, "")}-${colorCode(color)}`;
        const vid = `vid-${vidBase + ci * prod.sizes.length + si}`;
        const meta = `dropship:{"supplier":"cj","supplierSku":"${vid}","costPrice":${prod.cost}};source:cj-dropship`;
        const variantName = `${size} / ${color}`;
        const img = `https://via.placeholder.com/800x800/333/fff?text=${encodeURIComponent(prod.name.replace(/ /g, "+"))}`;

        const fields = {
          variantName,
          sku,
          price: prod.price,
          costPrice: prod.cost,
          "variantAttr:Size": size,
          "variantAttr:Color": color,
          isPublished: "Yes",
          trackInventory: "No",
        };

        if (isFirst) {
          fields.name = prod.name;
          fields.productType = typeLabel;
          fields.category = prod.cat;
          fields.slug = prod.slug;
          fields.description = prod.desc;
          fields["attr:Pet Type"] = prod.petType;
          fields["attr:Material"] = prod.material;
          fields["attr:Style"] = prod.style;
          fields["attr:Product Type"] = prod.prodType;
          fields.imageUrl = img;
          fields.seoTitle = `${prod.name} - Pawzen`;
          fields.seoDescription = prod.desc;
          fields.collections = prod.collections;
          fields.metadata = meta;
          isFirst = false;
        }

        rows.push(buildRow(fields));
      });
    });
  });
}

// ── Generate All Product Types ───────────────────────────────────────────────
generateProducts(PET_TOYS, "PT", "Pet Toys");
generateProducts(PET_FEEDING, "PF", "Pet Feeding");
generateProducts(PET_COMFORT, "PC", "Pet Comfort");
generateProducts(PET_CARE, "PA", "Pet Care");

// ── Write CSV ────────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, "dropship-catalog-30.csv");
fs.writeFileSync(outPath, rows.join("\n"), "utf-8");

const totalProducts = PET_TOYS.length + PET_FEEDING.length + PET_COMFORT.length + PET_CARE.length;
console.log(`Generated ${outPath}`);
console.log(`Total rows: ${rows.length} (1 header + ${rows.length - 1} data)`);
console.log(`Products: ${PET_TOYS.length} toys + ${PET_FEEDING.length} feeding + ${PET_COMFORT.length} comfort + ${PET_CARE.length} care = ${totalProducts}`);
