import fs from "fs";
import path from "path";
import { CATEGORIES } from "./config/categories";
import { COLLECTIONS } from "./config/collections";

function escapeCSV(value: string | number): string {
  if (typeof value === "number") return value.toString();
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function generateCategoriesCSV() {
  const headers = ["name", "slug", "description", "parent", "backgroundImageUrl", "externalReference", "isPublished"];
  const rows = CATEGORIES.map((cat) => [
    escapeCSV(cat.name_he),
    escapeCSV(cat.slug),
    escapeCSV(cat.description_he || `${cat.name_he} - קטגוריה`),
    escapeCSV(cat.parent || ""),
    escapeCSV(cat.backgroundImageUrl || ""),
    escapeCSV(cat.slug), // Use slug as externalReference for matching
    "Yes",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const outputPath = path.join(__dirname, "../output/categories.csv");
  fs.writeFileSync(outputPath, "\ufeff" + csv, "utf8"); // BOM for UTF-8
  console.log(`✅ Generated: ${outputPath}`);
}

function generateCollectionsCSV() {
  const headers = ["name", "slug", "description", "backgroundImageUrl", "isPublished"];
  const rows = COLLECTIONS.map((col) => [
    escapeCSV(col.name_he),
    escapeCSV(col.slug),
    escapeCSV(col.description_he || ""),
    escapeCSV(col.backgroundImageUrl || ""),
    "Yes",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const outputPath = path.join(__dirname, "../output/collections.csv");
  fs.writeFileSync(outputPath, "\ufeff" + csv, "utf8"); // BOM for UTF-8
  console.log(`✅ Generated: ${outputPath}`);
}

console.log("🚀 Generating CSV files...\n");
generateCategoriesCSV();
generateCollectionsCSV();
console.log("\n✅ CSV files ready for import!");
