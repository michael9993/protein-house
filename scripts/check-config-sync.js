const fs = require("fs");
const path = require("path");

const heFile = path.join(__dirname, "../apps/apps/storefront-control/sample-config-import.json");
const enFile = path.join(__dirname, "../apps/apps/storefront-control/sample-config-import-en.json");

const he = JSON.parse(fs.readFileSync(heFile, "utf8")).config;
const en = JSON.parse(fs.readFileSync(enFile, "utf8")).config;

let issues = 0;

function compareObjects(heObj, enObj, prefix) {
  if (!heObj || !enObj) return;
  if (typeof heObj !== "object" || typeof enObj !== "object") return;

  const heKeys = Object.keys(heObj).sort();
  const enKeys = Object.keys(enObj).sort();

  const onlyInHe = heKeys.filter((k) => !enKeys.includes(k));
  const onlyInEn = enKeys.filter((k) => !heKeys.includes(k));

  if (onlyInHe.length) {
    console.log(`${prefix}: Only in Hebrew: ${onlyInHe.join(", ")}`);
    issues += onlyInHe.length;
  }
  if (onlyInEn.length) {
    console.log(`${prefix}: Only in English: ${onlyInEn.join(", ")}`);
    issues += onlyInEn.length;
  }
}

// Compare all top-level sections
const allSections = new Set([...Object.keys(he), ...Object.keys(en)]);
for (const section of allSections) {
  if (!he[section]) {
    console.log(`${section}: MISSING in Hebrew`);
    issues++;
    continue;
  }
  if (!en[section]) {
    console.log(`${section}: MISSING in English`);
    issues++;
    continue;
  }

  if (typeof he[section] === "object" && he[section] !== null && !Array.isArray(he[section])) {
    compareObjects(he[section], en[section], section);

    // Go one level deeper for content.*
    if (section === "content" || section === "ui" || section === "homepage") {
      for (const sub of new Set([...Object.keys(he[section]), ...Object.keys(en[section])])) {
        if (typeof he[section][sub] === "object" && he[section][sub] !== null && !Array.isArray(he[section][sub])) {
          compareObjects(he[section][sub], en[section][sub], `${section}.${sub}`);
        }
      }
    }
  }
}

// Check for empty strings in Hebrew content (missing translations)
let emptyCount = 0;
function checkEmpty(obj, prefix) {
  if (!obj || typeof obj !== "object") return;
  for (const [key, val] of Object.entries(obj)) {
    if (val === "" && prefix.startsWith("content")) {
      emptyCount++;
      if (emptyCount <= 10) console.log(`EMPTY: ${prefix}.${key}`);
    }
    if (typeof val === "object" && val !== null && !Array.isArray(val)) {
      checkEmpty(val, `${prefix}.${key}`);
    }
  }
}
checkEmpty(he, "");
if (emptyCount > 10) console.log(`... and ${emptyCount - 10} more empty strings in Hebrew`);
if (emptyCount > 0) console.log(`Total empty strings in Hebrew content: ${emptyCount}`);

console.log(`\nTotal asymmetry issues: ${issues}`);
