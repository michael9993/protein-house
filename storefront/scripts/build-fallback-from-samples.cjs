#!/usr/bin/env node
/**
 * Build storefront-cms-config.json from Storefront Control sample-import files.
 * Use this so the storefront fallback (when no API) uses channel/brand-appropriate
 * defaults from the sample configs (e.g. ILS/Hebrew vs EN).
 *
 * Run from repo root: node storefront/scripts/build-fallback-from-samples.cjs
 * Or from storefront dir: node scripts/build-fallback-from-samples.cjs
 *
 * Reads:
 *   - apps/apps/storefront-control/sample-config-import.json (Hebrew/ILS)
 *   - apps/apps/storefront-control/sample-config-import-en.json (English)
 * Writes:
 *   - storefront/storefront-cms-config.json with channels: { ils, default }
 */

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const storefrontControlDir = path.join(repoRoot, "apps", "apps", "storefront-control");
const sampleHebrew = path.join(storefrontControlDir, "sample-config-import.json");
const sampleEnglish = path.join(storefrontControlDir, "sample-config-import-en.json");
const outPath = path.join(repoRoot, "storefront", "storefront-cms-config.json");

function loadSample(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[build-fallback] Sample not found: ${filePath}`);
    return null;
  }
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return raw.config || raw;
}

const hebrew = loadSample(sampleHebrew);
const english = loadSample(sampleEnglish);

const channels = {};
if (hebrew) {
  channels.ils = hebrew;
  console.log("[build-fallback] Loaded ILS (Hebrew) sample");
}
if (english) {
  channels.default = english;
  const slug = (english.channelSlug || "default").toLowerCase();
  if (slug !== "default") channels[slug] = english;
  console.log("[build-fallback] Loaded EN sample as default");
}

if (Object.keys(channels).length === 0) {
  console.error("[build-fallback] No sample configs found. Ensure sample-config-import.json and sample-config-import-en.json exist under apps/apps/storefront-control/");
  process.exit(1);
}

const payload = {
  schemaVersion: 1,
  exportedAt: new Date().toISOString(),
  channels,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");
console.log(`[build-fallback] Wrote ${outPath} with channels: ${Object.keys(channels).join(", ")}`);
