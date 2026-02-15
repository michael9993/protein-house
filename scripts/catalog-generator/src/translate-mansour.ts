/**
 * Mansour Shoes Translation Script
 *
 * Source data is in HEBREW. This script adds ENGLISH translations for the USD channel.
 *
 * Product names often contain both languages: "שם עברי | English Name"
 * For descriptions, categories, and collections: uses Google Translate (he → en).
 *
 * Usage:
 *   npm run translate:mansour              — full run
 *   npm run translate:mansour -- --dry-run  — preview only, no mutations
 */
import "dotenv/config";
import { GraphQLClient, gql } from "graphql-request";
import translate from "google-translate-api-x";

const SALEOR_URL = process.env.SALEOR_URL!;
const SALEOR_TOKEN = process.env.SALEOR_TOKEN!;

if (!SALEOR_URL || !SALEOR_TOKEN) {
  console.error("Missing SALEOR_URL or SALEOR_TOKEN in .env");
  process.exit(1);
}

const client = new GraphQLClient(SALEOR_URL, {
  headers: { Authorization: `Bearer ${SALEOR_TOKEN}` },
});

const DRY_RUN = process.argv.includes("--dry-run");
const ENGLISH_CODE = "EN";

// ============================================================================
// Google Translate Helper (Hebrew → English)
// ============================================================================

const translationCache = new Map<string, string>();

async function heToEn(text: string): Promise<string> {
  if (!text?.trim()) return text;
  if (translationCache.has(text)) return translationCache.get(text)!;
  try {
    const result = await translate(text, { from: "he", to: "en" });
    const translated = result.text;
    translationCache.set(text, translated);
    await new Promise((r) => setTimeout(r, 100)); // rate limit
    return translated;
  } catch (err: any) {
    console.warn(`  Translate failed for "${text.slice(0, 40)}...": ${err.message?.slice(0, 60)}`);
    return text;
  }
}

// ============================================================================
// Name Splitter — extracts English part from bilingual names
// ============================================================================

function extractEnglishName(name: string): string | null {
  // Format: "שם עברי | English Name" or "שם עברי | English Name FJ3363"
  const pipeIndex = name.indexOf("|");
  if (pipeIndex === -1) return null;

  const englishPart = name.substring(pipeIndex + 1).trim();
  // Verify it actually contains latin characters
  if (/[a-zA-Z]/.test(englishPart)) {
    return englishPart;
  }
  return null;
}

function extractHebrewName(name: string): string {
  const pipeIndex = name.indexOf("|");
  if (pipeIndex === -1) return name.trim();
  return name.substring(0, pipeIndex).trim();
}

// ============================================================================
// EditorJS Helpers
// ============================================================================

function editorJsDescription(text: string): string {
  return JSON.stringify({
    blocks: [{ type: "paragraph", data: { text } }],
  });
}

function extractEditorJsText(json: string | null | undefined): string | null {
  if (!json) return null;
  try {
    const data = JSON.parse(json);
    return (
      data.blocks
        ?.map((b: any) => b.data?.text || "")
        .join(" ")
        .trim() || null
    );
  } catch {
    return null;
  }
}

// ============================================================================
// Reverse Attribute Translation Map (Hebrew → English)
// ============================================================================

const HE_TO_EN_ATTRIBUTES: Record<string, string> = {
  "מותג": "Brand",
  "מגדר": "Gender",
  "חומר": "Material",
  "סגנון": "Style",
  "סוג": "Type",
  "מידת נעל": "Shoe size",
  "מידת ביגוד": "Apparel Size",
  "צבע": "Color",
};

const HE_TO_EN_VALUES: Record<string, string> = {
  "גברים": "Men",
  "נשים": "Women",
  "ילדים": "Kids",
  "יוניסקס": "Unisex",
  "עור": "Leather",
  "סינטטי": "Synthetic",
  "רשת": "Mesh",
  "בד": "Canvas",
  "כותנה": "Cotton",
  "פוליאסטר": "Polyester",
  "אלסטן": "Elastane",
  "ניילון": "Nylon",
  "צמר": "Wool",
  "ריצה": "Running",
  "אימון": "Training",
  "כדורגל": "Soccer",
  "יומיומי": "Casual",
  "מגפיים": "Boots",
  "חולצת טי": "T-Shirt",
  "קפוצ'ון": "Hoodie",
  "ג'קט": "Jacket",
  "גופייה": "Tank Top",
  "מכנסיים": "Pants",
  "מכנסיים קצרים": "Shorts",
  "טייצים": "Leggings",
  "מכנסי ג'וגר": "Joggers",
  "תיק": "Bag",
  "כובע": "Hat",
  "גרביים": "Socks",
  "בקבוק מים": "Water Bottle",
  "כפפות": "Gloves",
  "שחור": "Black",
  "לבן": "White",
  "כחול כהה": "Navy",
  "אדום": "Red",
  "אפור": "Gray",
  "כחול": "Blue",
  "ירוק": "Green",
  "ורוד": "Pink",
  "כתום": "Orange",
  "צהוב": "Yellow",
};

// ============================================================================
// GraphQL Queries
// ============================================================================

const FETCH_CATEGORIES = gql`
  query FetchCategories($first: Int!, $after: String) {
    categories(first: $first, after: $after) {
      edges {
        node {
          id
          slug
          name
          description
          seoTitle
          seoDescription
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const FETCH_COLLECTIONS = gql`
  query FetchCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      edges {
        node {
          id
          slug
          name
          description
          seoTitle
          seoDescription
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const FETCH_PRODUCTS = gql`
  query FetchProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          id
          slug
          name
          description
          seoTitle
          seoDescription
          variants {
            id
            name
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const FETCH_ATTRIBUTES = gql`
  query FetchAttributes($first: Int!) {
    attributes(first: $first) {
      edges {
        node {
          id
          slug
          name
          choices(first: 100) {
            edges {
              node { id slug name }
            }
          }
        }
      }
    }
  }
`;

// ============================================================================
// GraphQL Mutations — English Translations
// ============================================================================

const TRANSLATE_CATEGORY = gql`
  mutation TranslateCategory($id: ID!, $languageCode: LanguageCodeEnum!, $input: TranslationInput!) {
    categoryTranslate(id: $id, languageCode: $languageCode, input: $input) {
      category { id name }
      errors { field message }
    }
  }
`;

const TRANSLATE_COLLECTION = gql`
  mutation TranslateCollection($id: ID!, $languageCode: LanguageCodeEnum!, $input: TranslationInput!) {
    collectionTranslate(id: $id, languageCode: $languageCode, input: $input) {
      collection { id name }
      errors { field message }
    }
  }
`;

const TRANSLATE_PRODUCT = gql`
  mutation TranslateProduct($id: ID!, $languageCode: LanguageCodeEnum!, $input: TranslationInput!) {
    productTranslate(id: $id, languageCode: $languageCode, input: $input) {
      product { id name }
      errors { field message }
    }
  }
`;

const TRANSLATE_VARIANT = gql`
  mutation TranslateVariant($id: ID!, $languageCode: LanguageCodeEnum!, $input: NameTranslationInput!) {
    productVariantTranslate(id: $id, languageCode: $languageCode, input: $input) {
      productVariant { id name }
      errors { field message }
    }
  }
`;

const TRANSLATE_ATTRIBUTE = gql`
  mutation TranslateAttribute($id: ID!, $languageCode: LanguageCodeEnum!, $input: NameTranslationInput!) {
    attributeTranslate(id: $id, languageCode: $languageCode, input: $input) {
      attribute { id name }
      errors { field message }
    }
  }
`;

const TRANSLATE_ATTRIBUTE_VALUE = gql`
  mutation TranslateAttributeValue($id: ID!, $languageCode: LanguageCodeEnum!, $input: AttributeValueTranslationInput!) {
    attributeValueTranslate(id: $id, languageCode: $languageCode, input: $input) {
      attributeValue { id name }
      errors { field message }
    }
  }
`;

// ============================================================================
// Types
// ============================================================================

interface SaleorNode {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

interface ProductNode extends SaleorNode {
  variants: { id: string; name: string }[];
}

interface AttributeNode {
  id: string;
  slug: string;
  name: string;
  choices: { edges: { node: { id: string; slug: string; name: string } }[] };
}

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

// ============================================================================
// Helpers
// ============================================================================

async function fetchAllPaged<T>(query: string, rootKey: string): Promise<T[]> {
  const all: T[] = [];
  let after: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const data: any = await client.request(query, { first: 100, after });
    const connection = data[rootKey];
    all.push(...connection.edges.map((e: { node: T }) => e.node));
    const pageInfo: PageInfo = connection.pageInfo;
    hasNext = pageInfo.hasNextPage;
    after = pageInfo.endCursor;
  }

  return all;
}

async function translateToEnglish(
  mutation: string,
  id: string,
  input: any,
  resultKey: string,
): Promise<{ ok: boolean; error?: string }> {
  if (DRY_RUN) return { ok: true };

  const result: any = await client.request(mutation, {
    id,
    languageCode: ENGLISH_CODE,
    input,
  });
  const payload = result[resultKey];
  if (payload?.errors?.length > 0) {
    return { ok: false, error: payload.errors[0].message };
  }
  return { ok: true };
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log("=== Mansour Shoes Translation (Hebrew → English) ===\n");
  console.log(`API: ${SALEOR_URL}`);
  console.log(`Target: ${ENGLISH_CODE} language code`);
  if (DRY_RUN) console.log("MODE: DRY RUN (no mutations)\n");
  else console.log("MODE: LIVE\n");

  // ── Fetch all entities ────────────────────────────────────────────────
  console.log("Fetching entities from Saleor...");
  const [categories, collections, products] = await Promise.all([
    fetchAllPaged<SaleorNode>(FETCH_CATEGORIES, "categories"),
    fetchAllPaged<SaleorNode>(FETCH_COLLECTIONS, "collections"),
    fetchAllPaged<ProductNode>(FETCH_PRODUCTS, "products"),
  ]);

  const attrData: any = await client.request(FETCH_ATTRIBUTES, { first: 100 });
  const attributes: AttributeNode[] = attrData.attributes.edges.map((e: any) => e.node);

  const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0);
  const totalAttrValues = attributes.reduce((sum, a) => sum + a.choices.edges.length, 0);

  console.log(`  Categories:       ${categories.length}`);
  console.log(`  Collections:      ${collections.length}`);
  console.log(`  Products:         ${products.length}`);
  console.log(`  Variants:         ${totalVariants}`);
  console.log(`  Attributes:       ${attributes.length}`);
  console.log(`  Attribute values: ${totalAttrValues}\n`);

  // ── 1. Translate Categories ───────────────────────────────────────────
  let catOk = 0, catFail = 0;
  console.log("--- Categories (Hebrew → English) ---");

  for (const cat of categories) {
    try {
      const enName = await heToEn(cat.name);
      const input: any = { name: enName };

      // Description
      const descText = extractEditorJsText(cat.description as string);
      if (descText) {
        const enDesc = await heToEn(descText);
        input.description = editorJsDescription(enDesc);
      }

      // SEO
      input.seoTitle = cat.seoTitle ? await heToEn(cat.seoTitle) : enName;
      input.seoDescription = cat.seoDescription
        ? await heToEn(cat.seoDescription)
        : `Shop ${enName} at Mansour Shoes`;

      const { ok, error } = await translateToEnglish(
        TRANSLATE_CATEGORY, cat.id, input, "categoryTranslate",
      );
      if (!ok) {
        console.log(`  FAIL: "${cat.name}" — ${error}`);
        catFail++;
      } else {
        catOk++;
      }
    } catch (err: any) {
      console.error(`  FAIL: "${cat.name}" — ${err.message?.slice(0, 80)}`);
      catFail++;
    }
  }
  console.log(`  Result: ${catOk} OK, ${catFail} failed\n`);

  // ── 2. Translate Collections ──────────────────────────────────────────
  let colOk = 0, colFail = 0;
  console.log("--- Collections (Hebrew → English) ---");

  for (const col of collections) {
    try {
      const enName = await heToEn(col.name);
      const input: any = { name: enName };

      const descText = extractEditorJsText(col.description as string);
      if (descText) {
        const enDesc = await heToEn(descText);
        input.description = editorJsDescription(enDesc);
      }

      input.seoTitle = col.seoTitle ? await heToEn(col.seoTitle) : enName;
      input.seoDescription = col.seoDescription
        ? await heToEn(col.seoDescription)
        : `Explore our ${enName} collection`;

      const { ok, error } = await translateToEnglish(
        TRANSLATE_COLLECTION, col.id, input, "collectionTranslate",
      );
      if (!ok) {
        console.log(`  FAIL: "${col.name}" — ${error}`);
        colFail++;
      } else {
        colOk++;
      }
    } catch (err: any) {
      console.error(`  FAIL: "${col.name}" — ${err.message?.slice(0, 80)}`);
      colFail++;
    }
  }
  console.log(`  Result: ${colOk} OK, ${colFail} failed\n`);

  // ── 3. Translate Products ─────────────────────────────────────────────
  let prodOk = 0, prodFail = 0;
  let prodFromPipe = 0, prodFromGoogle = 0;
  console.log("--- Products (Hebrew → English) ---");

  for (const product of products) {
    try {
      // Try extracting English name from "Hebrew | English" format
      const pipeEnName = extractEnglishName(product.name);
      let enName: string;

      if (pipeEnName) {
        enName = pipeEnName;
        prodFromPipe++;
      } else {
        enName = await heToEn(product.name);
        prodFromGoogle++;
      }

      const input: any = { name: enName };

      // Description — translate from Hebrew
      const descText = extractEditorJsText(product.description as string);
      if (descText) {
        const enDesc = await heToEn(descText);
        input.description = editorJsDescription(enDesc);
      }

      // SEO
      input.seoTitle = pipeEnName || (product.seoTitle ? await heToEn(product.seoTitle) : enName);
      input.seoDescription = product.seoDescription
        ? await heToEn(product.seoDescription)
        : `Buy ${enName} online at Mansour Shoes`;

      const { ok, error } = await translateToEnglish(
        TRANSLATE_PRODUCT, product.id, input, "productTranslate",
      );
      if (!ok) {
        console.log(`  FAIL: "${product.name.slice(0, 50)}" — ${error}`);
        prodFail++;
      } else {
        prodOk++;
      }

      if (prodOk % 50 === 0 && prodOk > 0) {
        console.log(`  ... ${prodOk} products translated`);
      }
    } catch (err: any) {
      console.error(`  FAIL: "${product.name.slice(0, 50)}" — ${err.message?.slice(0, 80)}`);
      prodFail++;
    }
  }
  console.log(`  Result: ${prodOk} OK, ${prodFail} failed`);
  console.log(`  Sources: ${prodFromPipe} from pipe split, ${prodFromGoogle} via Google Translate\n`);

  // ── 4. Translate Variants ─────────────────────────────────────────────
  let varOk = 0, varFail = 0, varSkip = 0;
  console.log("--- Variants ---");

  for (const product of products) {
    for (const variant of product.variants) {
      // Variant names are typically size values (XS, 42, etc.) — no translation needed
      // But some may have Hebrew text
      const isHebrew = /[\u0590-\u05FF]/.test(variant.name);
      if (!isHebrew) {
        varSkip++;
        continue;
      }

      try {
        // Check hardcoded map first
        let enName = HE_TO_EN_VALUES[variant.name];
        if (!enName) {
          enName = await heToEn(variant.name);
        }

        const { ok } = await translateToEnglish(
          TRANSLATE_VARIANT, variant.id, { name: enName }, "productVariantTranslate",
        );
        if (ok) varOk++;
        else varFail++;
      } catch {
        varFail++;
      }
    }

    if (varOk % 100 === 0 && varOk > 0) {
      console.log(`  ... ${varOk} variants translated`);
    }
  }
  console.log(`  Result: ${varOk} OK, ${varSkip} skipped (already English), ${varFail} failed\n`);

  // ── 5. Translate Attributes ───────────────────────────────────────────
  let attrOk = 0, attrSkip = 0, attrFail = 0;
  console.log("--- Attributes ---");

  for (const attr of attributes) {
    // Check if name needs translation (contains Hebrew)
    const isHebrew = /[\u0590-\u05FF]/.test(attr.name);
    if (!isHebrew) {
      attrSkip++;
      continue;
    }

    let enName = HE_TO_EN_ATTRIBUTES[attr.name];
    if (!enName) {
      enName = await heToEn(attr.name);
    }

    try {
      const { ok, error } = await translateToEnglish(
        TRANSLATE_ATTRIBUTE, attr.id, { name: enName }, "attributeTranslate",
      );
      if (!ok) {
        console.log(`  FAIL: "${attr.name}" — ${error}`);
        attrFail++;
      } else {
        console.log(`  OK: "${attr.name}" → "${enName}"`);
        attrOk++;
      }
    } catch (err: any) {
      console.error(`  FAIL: "${attr.name}" — ${err.message?.slice(0, 80)}`);
      attrFail++;
    }
  }
  console.log(`  Result: ${attrOk} OK, ${attrSkip} skipped (already English), ${attrFail} failed\n`);

  // ── 6. Translate Attribute Values ─────────────────────────────────────
  let valOk = 0, valSkip = 0, valFail = 0;
  console.log("--- Attribute Values ---");

  for (const attr of attributes) {
    for (const edge of attr.choices.edges) {
      const val = edge.node;
      const isHebrew = /[\u0590-\u05FF]/.test(val.name);
      if (!isHebrew) {
        valSkip++;
        continue;
      }

      let enName = HE_TO_EN_VALUES[val.name];
      if (!enName) {
        enName = await heToEn(val.name);
      }

      try {
        const { ok } = await translateToEnglish(
          TRANSLATE_ATTRIBUTE_VALUE, val.id, { name: enName }, "attributeValueTranslate",
        );
        if (ok) valOk++;
        else valFail++;
      } catch {
        valFail++;
      }
    }
  }
  console.log(`  Result: ${valOk} OK, ${valSkip} skipped (already English), ${valFail} failed\n`);

  // ── Summary ──────────────────────────────────────────────────────────
  const total = catOk + colOk + prodOk + varOk + attrOk + valOk;
  console.log("=== SUMMARY ===\n");
  console.log(`  Categories:       ${catOk}/${categories.length}`);
  console.log(`  Collections:      ${colOk}/${collections.length}`);
  console.log(`  Products:         ${prodOk}/${products.length} (${prodFromPipe} pipe, ${prodFromGoogle} Google)`);
  console.log(`  Variants:         ${varOk} translated, ${varSkip} already English`);
  console.log(`  Attributes:       ${attrOk} translated, ${attrSkip} already English`);
  console.log(`  Attribute values: ${valOk} translated, ${valSkip} already English`);
  console.log(`\n  TOTAL: ${total} English translations applied.`);
  console.log(`  Translation cache: ${translationCache.size} unique texts.`);
  if (DRY_RUN) console.log("\n  (DRY RUN — no mutations were sent)");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
