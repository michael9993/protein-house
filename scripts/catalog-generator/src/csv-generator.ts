import fs from "fs";
import path from "path";
import { CATEGORIES } from "./config/categories";
import { COLLECTIONS } from "./config/collections";

type Lang = "en" | "he";

function escapeCSV(value: string | number): string {
  if (typeof value === "number") return value.toString();
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function generateCategoriesCSV(lang: Lang) {
  const headers = ["name", "slug", "description", "parent", "backgroundImageUrl", "externalReference", "isPublished"];
  const rows = CATEGORIES.map((cat) => {
    const name = lang === "en" ? cat.name_en : cat.name_he;
    const desc = lang === "en"
      ? (cat.description_en || `${cat.name_en} category`)
      : (cat.description_he || `קטגוריית ${cat.name_he}`);

    return [
      escapeCSV(name),
      escapeCSV(cat.slug),
      escapeCSV(desc),
      escapeCSV(cat.parent || ""),
      escapeCSV(cat.backgroundImageUrl || ""),
      escapeCSV(cat.slug), // Use slug as externalReference for matching
      "Yes",
    ];
  });

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const suffix = lang === "en" ? "" : "-he";
  const outputPath = path.join(__dirname, `../output/categories${suffix}.csv`);
  fs.writeFileSync(outputPath, "\ufeff" + csv, "utf8"); // BOM for UTF-8
  console.log(`✅ Generated: ${outputPath}`);
}

function generateCollectionsCSV(lang: Lang) {
  const headers = ["name", "slug", "description", "backgroundImageUrl", "isPublished"];
  const rows = COLLECTIONS.map((col) => {
    const name = lang === "en" ? col.name_en : col.name_he;
    const desc = lang === "en"
      ? (col.description_en || "")
      : (col.description_he || "");

    return [
      escapeCSV(name),
      escapeCSV(col.slug),
      escapeCSV(desc),
      escapeCSV(col.backgroundImageUrl || ""),
      "Yes",
    ];
  });

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const suffix = lang === "en" ? "" : "-he";
  const outputPath = path.join(__dirname, `../output/collections${suffix}.csv`);
  fs.writeFileSync(outputPath, "\ufeff" + csv, "utf8"); // BOM for UTF-8
  console.log(`✅ Generated: ${outputPath}`);
}

const langArg = process.argv[2]?.toLowerCase();

if (langArg === "he" || langArg === "hebrew") {
  console.log("🚀 Generating Hebrew CSV files...\n");
  generateCategoriesCSV("he");
  generateCollectionsCSV("he");
} else if (langArg === "en" || langArg === "english") {
  console.log("🚀 Generating English CSV files...\n");
  generateCategoriesCSV("en");
  generateCollectionsCSV("en");
} else {
  // Default: generate both
  console.log("🚀 Generating CSV files (English + Hebrew)...\n");
  generateCategoriesCSV("en");
  generateCollectionsCSV("en");
  generateCategoriesCSV("he");
  generateCollectionsCSV("he");
}

console.log("\n✅ CSV files ready for import!");
