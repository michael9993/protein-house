import "dotenv/config";
import { GraphQLClient, gql } from "graphql-request";
import translate from "google-translate-api-x";
import { CATEGORIES } from "./config/categories";
import { COLLECTIONS } from "./config/collections";
import { ALL_PRODUCTS } from "./config/products";
import { generateProductName, generateDescription } from "./generators/descriptions";

const SALEOR_URL = process.env.SALEOR_URL!;
const SALEOR_TOKEN = process.env.SALEOR_TOKEN!;
const CHANNEL = process.env.SALEOR_CHANNEL || "default-channel";

if (!SALEOR_URL || !SALEOR_TOKEN) {
  console.error("Missing SALEOR_URL or SALEOR_TOKEN in .env");
  process.exit(1);
}

const client = new GraphQLClient(SALEOR_URL, {
  headers: { Authorization: `Bearer ${SALEOR_TOKEN}` },
});

// Both Hebrew language codes — Saleor treats HE and HE_IL as separate locales
const HEBREW_CODES = ["HE", "HE_IL"] as const;

// ============================================================================
// Google Translate Helper
// ============================================================================

const translationCache = new Map<string, string>();

async function translateText(text: string): Promise<string> {
  if (!text?.trim()) return text;
  if (translationCache.has(text)) return translationCache.get(text)!;
  try {
    const result = await translate(text, { from: "en", to: "he" });
    const translated = result.text;
    translationCache.set(text, translated);
    await new Promise((r) => setTimeout(r, 100)); // rate limit
    return translated;
  } catch (err: any) {
    console.warn(`  Google Translate failed for "${text.slice(0, 40)}...": ${err.message?.slice(0, 60)}`);
    return text;
  }
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

async function translateEditorJs(json: string | null | undefined): Promise<string | null> {
  if (!json) return null;
  try {
    const data = JSON.parse(json);
    for (const block of data.blocks || []) {
      if (block.data?.text) {
        block.data.text = await translateText(block.data.text);
      }
    }
    return JSON.stringify(data);
  } catch {
    return null;
  }
}

// ============================================================================
// Hebrew translations for attributes and attribute values (hardcoded maps)
// ============================================================================

const ATTRIBUTE_TRANSLATIONS: Record<string, string> = {
  Brand: "מותג",
  Gender: "מגדר",
  Material: "חומר",
  Style: "סגנון",
  Type: "סוג",
  "Shoe size": "מידת נעל",
  "Apparel Size": "מידת ביגוד",
  Color: "צבע",
};

const ATTRIBUTE_VALUE_TRANSLATIONS: Record<string, string> = {
  // Gender
  Men: "גברים",
  Women: "נשים",
  Kids: "ילדים",
  Unisex: "יוניסקס",
  // Material
  Leather: "עור",
  Synthetic: "סינטטי",
  Mesh: "רשת",
  Canvas: "בד",
  Cotton: "כותנה",
  Polyester: "פוליאסטר",
  Elastane: "אלסטן",
  Nylon: "ניילון",
  Wool: "צמר",
  // Style (Shoes)
  Running: "ריצה",
  Training: "אימון",
  Soccer: "כדורגל",
  Casual: "יומיומי",
  Boots: "מגפיים",
  // Type (Tops/Bottoms/Accessories)
  "T-Shirt": "חולצת טי",
  Hoodie: "קפוצ'ון",
  Jacket: "ג'קט",
  "Tank Top": "גופייה",
  Pants: "מכנסיים",
  Shorts: "מכנסיים קצרים",
  Leggings: "טייצים",
  Joggers: "מכנסי ג'וגר",
  Bag: "תיק",
  Hat: "כובע",
  Socks: "גרביים",
  "Water Bottle": "בקבוק מים",
  Gloves: "כפפות",
  // Colors
  Black: "שחור",
  White: "לבן",
  Navy: "כחול כהה",
  Red: "אדום",
  Gray: "אפור",
  Blue: "כחול",
  Green: "ירוק",
  Pink: "ורוד",
  Orange: "כתום",
  Yellow: "צהוב",
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
      pageInfo {
        hasNextPage
        endCursor
      }
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
      pageInfo {
        hasNextPage
        endCursor
      }
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
      pageInfo {
        hasNextPage
        endCursor
      }
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
              node {
                id
                slug
                name
              }
            }
          }
        }
      }
    }
  }
`;

const FETCH_VOUCHERS = gql`
  query FetchVouchers($first: Int!, $after: String) {
    vouchers(first: $first, after: $after) {
      edges {
        node {
          id
          name
          code
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const FETCH_SHIPPING_ZONES = gql`
  query FetchShippingZones($first: Int!) {
    shippingZones(first: $first) {
      edges {
        node {
          id
          name
          shippingMethods {
            id
            name
            description
          }
        }
      }
    }
  }
`;

// ============================================================================
// GraphQL Mutations — Hebrew Translations
// ============================================================================

const TRANSLATE_CATEGORY = gql`
  mutation TranslateCategory(
    $id: ID!
    $languageCode: LanguageCodeEnum!
    $input: TranslationInput!
  ) {
    categoryTranslate(id: $id, languageCode: $languageCode, input: $input) {
      category {
        id
        name
      }
      errors {
        field
        message
      }
    }
  }
`;

const TRANSLATE_COLLECTION = gql`
  mutation TranslateCollection(
    $id: ID!
    $languageCode: LanguageCodeEnum!
    $input: TranslationInput!
  ) {
    collectionTranslate(id: $id, languageCode: $languageCode, input: $input) {
      collection {
        id
        name
      }
      errors {
        field
        message
      }
    }
  }
`;

const TRANSLATE_PRODUCT = gql`
  mutation TranslateProduct(
    $id: ID!
    $languageCode: LanguageCodeEnum!
    $input: TranslationInput!
  ) {
    productTranslate(id: $id, languageCode: $languageCode, input: $input) {
      product {
        id
        name
      }
      errors {
        field
        message
      }
    }
  }
`;

const TRANSLATE_VARIANT = gql`
  mutation TranslateVariant(
    $id: ID!
    $languageCode: LanguageCodeEnum!
    $input: NameTranslationInput!
  ) {
    productVariantTranslate(
      id: $id
      languageCode: $languageCode
      input: $input
    ) {
      productVariant {
        id
        name
      }
      errors {
        field
        message
      }
    }
  }
`;

const TRANSLATE_ATTRIBUTE = gql`
  mutation TranslateAttribute(
    $id: ID!
    $languageCode: LanguageCodeEnum!
    $input: NameTranslationInput!
  ) {
    attributeTranslate(id: $id, languageCode: $languageCode, input: $input) {
      attribute {
        id
        name
      }
      errors {
        field
        message
      }
    }
  }
`;

const TRANSLATE_ATTRIBUTE_VALUE = gql`
  mutation TranslateAttributeValue(
    $id: ID!
    $languageCode: LanguageCodeEnum!
    $input: AttributeValueTranslationInput!
  ) {
    attributeValueTranslate(
      id: $id
      languageCode: $languageCode
      input: $input
    ) {
      attributeValue {
        id
        name
      }
      errors {
        field
        message
      }
    }
  }
`;

const TRANSLATE_VOUCHER = gql`
  mutation TranslateVoucher(
    $id: ID!
    $languageCode: LanguageCodeEnum!
    $input: NameTranslationInput!
  ) {
    voucherTranslate(id: $id, languageCode: $languageCode, input: $input) {
      voucher {
        id
        name
      }
      errors {
        field
        message
      }
    }
  }
`;

const TRANSLATE_SHIPPING_METHOD = gql`
  mutation TranslateShippingMethod(
    $id: ID!
    $languageCode: LanguageCodeEnum!
    $input: ShippingPriceTranslationInput!
  ) {
    shippingPriceTranslate(
      id: $id
      languageCode: $languageCode
      input: $input
    ) {
      shippingMethod {
        id
        name
      }
      errors {
        field
        message
      }
    }
  }
`;

// ============================================================================
// GraphQL Mutations — English SEO (base entity updates)
// ============================================================================

const UPDATE_CATEGORY_SEO = gql`
  mutation UpdateCategorySeo($id: ID!, $input: CategoryInput!) {
    categoryUpdate(id: $id, input: $input) {
      category {
        id
        seoTitle
        seoDescription
      }
      errors {
        field
        message
      }
    }
  }
`;

const UPDATE_COLLECTION_SEO = gql`
  mutation UpdateCollectionSeo($id: ID!, $input: CollectionInput!) {
    collectionUpdate(id: $id, input: $input) {
      collection {
        id
        seoTitle
        seoDescription
      }
      errors {
        field
        message
      }
    }
  }
`;

const UPDATE_PRODUCT_SEO = gql`
  mutation UpdateProductSeo($id: ID!, $input: ProductInput!) {
    productUpdate(id: $id, input: $input) {
      product {
        id
        seoTitle
        seoDescription
      }
      errors {
        field
        message
      }
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

interface VoucherNode {
  id: string;
  name: string | null;
  code: string | null;
}

interface ShippingZoneNode {
  id: string;
  name: string;
  shippingMethods: {
    id: string;
    name: string;
    description: string | null;
  }[];
}

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

// ============================================================================
// Helpers
// ============================================================================

async function fetchAllPaged<T>(
  query: string,
  rootKey: string,
  extraVars: Record<string, any> = {}
): Promise<T[]> {
  const all: T[] = [];
  let after: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const data: any = await client.request(query, {
      first: 100,
      after,
      ...extraVars,
    });
    const connection = data[rootKey];
    const nodes = connection.edges.map((e: { node: T }) => e.node);
    all.push(...nodes);
    const pageInfo: PageInfo = connection.pageInfo;
    hasNext = pageInfo.hasNextPage;
    after = pageInfo.endCursor;
  }

  return all;
}

function translateVariantName(name: string): string {
  let result = name;
  for (const [en, he] of Object.entries(ATTRIBUTE_VALUE_TRANSLATIONS)) {
    const regex = new RegExp(`\\b${en}\\b`, "gi");
    result = result.replace(regex, he);
  }
  result = result.replace(/\bSize\b/gi, "מידה");
  return result;
}

/**
 * Run a translation mutation for all Hebrew language codes (HE + HE_IL).
 * Returns true if all succeeded, false if any failed.
 */
async function translateToHebrew(
  mutation: string,
  id: string,
  input: any,
  resultKey: string
): Promise<{ ok: boolean; error?: string }> {
  for (const code of HEBREW_CODES) {
    const result: any = await client.request(mutation, {
      id,
      languageCode: code,
      input,
    });
    const payload = result[resultKey];
    if (payload?.errors?.length > 0) {
      return { ok: false, error: payload.errors[0].message };
    }
  }
  return { ok: true };
}

// ============================================================================
// Main
// ============================================================================

async function addTranslations() {
  console.log("=== Saleor Translation Pipeline ===\n");
  console.log(`API: ${SALEOR_URL}`);
  console.log(`Channel: ${CHANNEL}`);
  console.log(`Hebrew codes: ${HEBREW_CODES.join(", ")}`);
  console.log(`Using: Google Translate API + hardcoded maps\n`);

  // ── 1. Fetch all entities ──────────────────────────────────────────────
  console.log("Fetching entities from Saleor...");

  const [saleorCategories, saleorCollections, saleorProducts, saleorVouchers] =
    await Promise.all([
      fetchAllPaged<SaleorNode>(FETCH_CATEGORIES, "categories"),
      fetchAllPaged<SaleorNode>(FETCH_COLLECTIONS, "collections"),
      fetchAllPaged<ProductNode>(FETCH_PRODUCTS, "products"),
      fetchAllPaged<VoucherNode>(FETCH_VOUCHERS, "vouchers"),
    ]);

  // Fetch attributes (not paged)
  const attrData: any = await client.request(FETCH_ATTRIBUTES, { first: 100 });
  const saleorAttributes: AttributeNode[] = attrData.attributes.edges.map(
    (e: any) => e.node
  );

  // Fetch shipping zones (not paged — usually few)
  const shippingData: any = await client.request(FETCH_SHIPPING_ZONES, { first: 100 });
  const saleorShippingZones: ShippingZoneNode[] = shippingData.shippingZones.edges.map(
    (e: any) => e.node
  );
  const allShippingMethods = saleorShippingZones.flatMap((z) => z.shippingMethods);

  const totalVariants = saleorProducts.reduce((sum, p) => sum + p.variants.length, 0);
  const totalAttrValues = saleorAttributes.reduce(
    (sum, a) => sum + a.choices.edges.length, 0
  );

  console.log(`  Categories:       ${saleorCategories.length}`);
  console.log(`  Collections:      ${saleorCollections.length}`);
  console.log(`  Products:         ${saleorProducts.length}`);
  console.log(`  Variants:         ${totalVariants}`);
  console.log(`  Attributes:       ${saleorAttributes.length}`);
  console.log(`  Attribute values: ${totalAttrValues}`);
  console.log(`  Vouchers:         ${saleorVouchers.length}`);
  console.log(`  Shipping methods: ${allShippingMethods.length}\n`);

  // Build lookup maps
  const catBySlug = new Map(saleorCategories.map((c) => [c.slug, c]));
  const colBySlug = new Map(saleorCollections.map((c) => [c.slug, c]));
  const prodBySlug = new Map(saleorProducts.map((p) => [p.slug, p]));

  // =====================================================================
  // PHASE 1: English SEO (populate base entity seoTitle + seoDescription)
  // =====================================================================
  console.log("========== PHASE 1: English SEO ==========\n");

  // ── English SEO: Categories ────────────────────────────────────────────
  let enCatOk = 0, enCatSkip = 0, enCatFail = 0;
  console.log("--- Categories (English SEO) ---");

  for (const cat of CATEGORIES) {
    const saleorCat = catBySlug.get(cat.slug);
    if (!saleorCat) {
      enCatSkip++;
      continue;
    }

    // Only update if SEO fields are empty
    if (saleorCat.seoTitle && saleorCat.seoDescription) {
      enCatSkip++;
      continue;
    }

    try {
      const seoTitle = saleorCat.seoTitle || cat.name_en;
      const seoDescription = saleorCat.seoDescription ||
        (cat.description_en ? cat.description_en.slice(0, 160) : `Shop ${cat.name_en} at the best prices. Browse our collection.`);

      const result: any = await client.request(UPDATE_CATEGORY_SEO, {
        id: saleorCat.id,
        input: { seo: { title: seoTitle, description: seoDescription } },
      });
      if (result.categoryUpdate?.errors?.length > 0) {
        console.log(`  FAIL: "${cat.name_en}" — ${result.categoryUpdate.errors[0].message}`);
        enCatFail++;
      } else {
        enCatOk++;
      }
    } catch (err: any) {
      console.error(`  FAIL: "${cat.name_en}" — ${err.message?.slice(0, 80)}`);
      enCatFail++;
    }
  }
  console.log(`  Result: ${enCatOk} OK, ${enCatSkip} skipped (already set), ${enCatFail} failed\n`);

  // ── English SEO: Collections ───────────────────────────────────────────
  let enColOk = 0, enColSkip = 0, enColFail = 0;
  console.log("--- Collections (English SEO) ---");

  for (const col of COLLECTIONS) {
    const saleorCol = colBySlug.get(col.slug);
    if (!saleorCol) {
      enColSkip++;
      continue;
    }

    if (saleorCol.seoTitle && saleorCol.seoDescription) {
      enColSkip++;
      continue;
    }

    try {
      const seoTitle = saleorCol.seoTitle || col.name_en;
      const seoDescription = saleorCol.seoDescription ||
        (col.description_en ? col.description_en.slice(0, 160) : `Explore our ${col.name_en} collection. Find the best deals.`);

      const result: any = await client.request(UPDATE_COLLECTION_SEO, {
        id: saleorCol.id,
        input: { seo: { title: seoTitle, description: seoDescription } },
      });
      if (result.collectionUpdate?.errors?.length > 0) {
        console.log(`  FAIL: "${col.name_en}" — ${result.collectionUpdate.errors[0].message}`);
        enColFail++;
      } else {
        enColOk++;
      }
    } catch (err: any) {
      console.error(`  FAIL: "${col.name_en}" — ${err.message?.slice(0, 80)}`);
      enColFail++;
    }
  }
  console.log(`  Result: ${enColOk} OK, ${enColSkip} skipped, ${enColFail} failed\n`);

  // ── English SEO: Products ──────────────────────────────────────────────
  let enProdOk = 0, enProdSkip = 0, enProdFail = 0;
  console.log("--- Products (English SEO) ---");

  for (const product of ALL_PRODUCTS) {
    const slug = `${product.brand}-${product.model}-${product.gender}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const saleorProd = prodBySlug.get(slug);
    if (!saleorProd) {
      enProdSkip++;
      continue;
    }

    if (saleorProd.seoTitle && saleorProd.seoDescription) {
      enProdSkip++;
      continue;
    }

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

    try {
      const seoTitle = saleorProd.seoTitle || names.name_en;
      const seoDescription = saleorProd.seoDescription || descriptions.en.slice(0, 160);

      const result: any = await client.request(UPDATE_PRODUCT_SEO, {
        id: saleorProd.id,
        input: { seo: { title: seoTitle, description: seoDescription } },
      });
      if (result.productUpdate?.errors?.length > 0) {
        console.log(`  FAIL: "${names.name_en}" — ${result.productUpdate.errors[0].message}`);
        enProdFail++;
      } else {
        enProdOk++;
      }
    } catch (err: any) {
      console.error(`  FAIL: "${names.name_en}" — ${err.message?.slice(0, 80)}`);
      enProdFail++;
    }

    if (enProdOk % 20 === 0 && enProdOk > 0) {
      console.log(`  ... ${enProdOk} products updated`);
    }
  }
  console.log(`  Result: ${enProdOk} OK, ${enProdSkip} skipped, ${enProdFail} failed\n`);

  // Re-fetch entities to pick up freshly-set English SEO values for Hebrew translation
  // (so we can translate the English seoTitle/seoDescription we just set)
  const [freshCategories, freshCollections, freshProducts] = await Promise.all([
    fetchAllPaged<SaleorNode>(FETCH_CATEGORIES, "categories"),
    fetchAllPaged<SaleorNode>(FETCH_COLLECTIONS, "collections"),
    fetchAllPaged<ProductNode>(FETCH_PRODUCTS, "products"),
  ]);
  const freshCatBySlug = new Map(freshCategories.map((c) => [c.slug, c]));
  const freshColBySlug = new Map(freshCollections.map((c) => [c.slug, c]));
  const freshProdBySlug = new Map(freshProducts.map((p) => [p.slug, p]));

  // =====================================================================
  // PHASE 2: Hebrew Translations (HE + HE_IL)
  // =====================================================================
  console.log("========== PHASE 2: Hebrew Translations (HE + HE_IL) ==========\n");

  // ── 2. Translate Categories ────────────────────────────────────────────
  let catOk = 0, catSkip = 0, catFail = 0;
  console.log("--- Categories (name + description + SEO) ---");

  for (const cat of CATEGORIES) {
    const saleorCat = freshCatBySlug.get(cat.slug);
    if (!saleorCat) {
      catSkip++;
      continue;
    }

    try {
      const input: any = {
        name: cat.name_he,
      };

      if (cat.description_he) {
        input.description = editorJsDescription(cat.description_he);
      }

      // SEO Title: translate from English if non-empty, else use Hebrew name
      if (saleorCat.seoTitle) {
        input.seoTitle = await translateText(saleorCat.seoTitle);
      } else {
        input.seoTitle = cat.name_he;
      }

      // SEO Description: translate from English if non-empty, else auto-generate
      if (saleorCat.seoDescription) {
        input.seoDescription = await translateText(saleorCat.seoDescription);
      } else {
        input.seoDescription = cat.description_he
          ? cat.description_he.slice(0, 160)
          : cat.name_he;
      }

      const { ok, error } = await translateToHebrew(
        TRANSLATE_CATEGORY, saleorCat.id, input, "categoryTranslate"
      );
      if (!ok) {
        console.log(`  FAIL: "${cat.name_en}" — ${error}`);
        catFail++;
      } else {
        catOk++;
      }
    } catch (err: any) {
      console.error(`  FAIL: "${cat.name_en}" — ${err.message?.slice(0, 80)}`);
      catFail++;
    }
  }
  console.log(`  Result: ${catOk} OK, ${catSkip} skipped, ${catFail} failed\n`);

  // ── 3. Translate Collections ───────────────────────────────────────────
  let colOk = 0, colSkip = 0, colFail = 0;
  console.log("--- Collections (name + description + SEO) ---");

  for (const col of COLLECTIONS) {
    const saleorCol = freshColBySlug.get(col.slug);
    if (!saleorCol) {
      colSkip++;
      continue;
    }

    try {
      const input: any = {
        name: col.name_he,
      };

      if (col.description_he) {
        input.description = editorJsDescription(col.description_he);
      }

      if (saleorCol.seoTitle) {
        input.seoTitle = await translateText(saleorCol.seoTitle);
      } else {
        input.seoTitle = col.name_he;
      }

      if (saleorCol.seoDescription) {
        input.seoDescription = await translateText(saleorCol.seoDescription);
      } else {
        input.seoDescription = col.description_he
          ? col.description_he.slice(0, 160)
          : col.name_he;
      }

      const { ok, error } = await translateToHebrew(
        TRANSLATE_COLLECTION, saleorCol.id, input, "collectionTranslate"
      );
      if (!ok) {
        console.log(`  FAIL: "${col.name_en}" — ${error}`);
        colFail++;
      } else {
        colOk++;
      }
    } catch (err: any) {
      console.error(`  FAIL: "${col.name_en}" — ${err.message?.slice(0, 80)}`);
      colFail++;
    }
  }
  console.log(`  Result: ${colOk} OK, ${colSkip} skipped, ${colFail} failed\n`);

  // ── 4. Translate Products ──────────────────────────────────────────────
  let prodOk = 0, prodSkip = 0, prodFail = 0;
  console.log("--- Products (name + description + SEO) ---");

  for (const product of ALL_PRODUCTS) {
    const slug = `${product.brand}-${product.model}-${product.gender}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const saleorProd = freshProdBySlug.get(slug);
    if (!saleorProd) {
      prodSkip++;
      continue;
    }

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

    try {
      const input: any = {
        name: names.name_he,
        description: editorJsDescription(descriptions.he),
      };

      if (saleorProd.seoTitle) {
        input.seoTitle = await translateText(saleorProd.seoTitle);
      } else {
        input.seoTitle = names.name_he;
      }

      if (saleorProd.seoDescription) {
        input.seoDescription = await translateText(saleorProd.seoDescription);
      } else {
        input.seoDescription = descriptions.he.slice(0, 160);
      }

      const { ok, error } = await translateToHebrew(
        TRANSLATE_PRODUCT, saleorProd.id, input, "productTranslate"
      );
      if (!ok) {
        console.log(`  FAIL: "${names.name_en}" — ${error}`);
        prodFail++;
      } else {
        prodOk++;
      }
    } catch (err: any) {
      console.error(`  FAIL: "${names.name_en}" — ${err.message?.slice(0, 80)}`);
      prodFail++;
    }

    if (prodOk % 20 === 0 && prodOk > 0) {
      console.log(`  ... ${prodOk} products translated`);
    }
  }
  console.log(`  Result: ${prodOk} OK, ${prodSkip} skipped, ${prodFail} failed\n`);

  // ── 5. Translate Variants ──────────────────────────────────────────────
  let varOk = 0, varFail = 0;
  console.log("--- Variants ---");

  for (const saleorProd of freshProducts) {
    for (const variant of saleorProd.variants) {
      const hebrewName = translateVariantName(variant.name);
      if (hebrewName === variant.name) continue;

      try {
        const { ok } = await translateToHebrew(
          TRANSLATE_VARIANT, variant.id, { name: hebrewName }, "productVariantTranslate"
        );
        if (!ok) {
          varFail++;
        } else {
          varOk++;
        }
      } catch {
        varFail++;
      }
    }

    if (varOk % 100 === 0 && varOk > 0) {
      console.log(`  ... ${varOk} variants translated`);
    }
  }
  console.log(`  Result: ${varOk} OK, ${varFail} failed\n`);

  // ── 6. Translate Attributes ────────────────────────────────────────────
  let attrOk = 0, attrSkip = 0, attrFail = 0;
  console.log("--- Attributes ---");

  for (const attr of saleorAttributes) {
    let hebrewName = ATTRIBUTE_TRANSLATIONS[attr.name];
    if (!hebrewName) {
      hebrewName = await translateText(attr.name);
      if (hebrewName === attr.name) {
        attrSkip++;
        continue;
      }
    }

    try {
      const { ok, error } = await translateToHebrew(
        TRANSLATE_ATTRIBUTE, attr.id, { name: hebrewName }, "attributeTranslate"
      );
      if (!ok) {
        console.log(`  FAIL: "${attr.name}" — ${error}`);
        attrFail++;
      } else {
        console.log(`  OK: "${attr.name}" → "${hebrewName}"`);
        attrOk++;
      }
    } catch (err: any) {
      console.error(`  FAIL: "${attr.name}" — ${err.message?.slice(0, 80)}`);
      attrFail++;
    }
  }
  console.log(`  Result: ${attrOk} OK, ${attrSkip} skipped, ${attrFail} failed\n`);

  // ── 7. Translate Attribute Values ──────────────────────────────────────
  let valOk = 0, valSkip = 0, valFail = 0;
  console.log("--- Attribute Values ---");

  for (const attr of saleorAttributes) {
    for (const edge of attr.choices.edges) {
      const val = edge.node;
      let hebrewName = ATTRIBUTE_VALUE_TRANSLATIONS[val.name];
      if (!hebrewName) {
        hebrewName = await translateText(val.name);
        if (hebrewName === val.name) {
          valSkip++;
          continue;
        }
      }

      try {
        const { ok } = await translateToHebrew(
          TRANSLATE_ATTRIBUTE_VALUE, val.id, { name: hebrewName }, "attributeValueTranslate"
        );
        if (!ok) {
          valFail++;
        } else {
          valOk++;
        }
      } catch {
        valFail++;
      }
    }
  }
  console.log(`  Result: ${valOk} OK, ${valSkip} skipped, ${valFail} failed\n`);

  // ── 8. Translate Vouchers ──────────────────────────────────────────────
  let vouchOk = 0, vouchSkip = 0, vouchFail = 0;
  console.log("--- Vouchers ---");

  for (const voucher of saleorVouchers) {
    if (!voucher.name) {
      vouchSkip++;
      continue;
    }

    try {
      const hebrewName = await translateText(voucher.name);
      const { ok, error } = await translateToHebrew(
        TRANSLATE_VOUCHER, voucher.id, { name: hebrewName }, "voucherTranslate"
      );
      if (!ok) {
        console.log(`  FAIL: "${voucher.name}" — ${error}`);
        vouchFail++;
      } else {
        console.log(`  OK: "${voucher.name}" → "${hebrewName}"`);
        vouchOk++;
      }
    } catch (err: any) {
      console.error(`  FAIL: "${voucher.name}" — ${err.message?.slice(0, 80)}`);
      vouchFail++;
    }
  }
  console.log(`  Result: ${vouchOk} OK, ${vouchSkip} skipped, ${vouchFail} failed\n`);

  // ── 9. Translate Shipping Methods ──────────────────────────────────────
  let shipOk = 0, shipSkip = 0, shipFail = 0;
  console.log("--- Shipping Methods ---");

  for (const method of allShippingMethods) {
    try {
      const input: any = {};

      if (method.name) {
        input.name = await translateText(method.name);
      } else {
        shipSkip++;
        continue;
      }

      if (method.description) {
        const translatedDesc = await translateEditorJs(method.description);
        if (translatedDesc) {
          input.description = translatedDesc;
        }
      }

      const { ok, error } = await translateToHebrew(
        TRANSLATE_SHIPPING_METHOD, method.id, input, "shippingPriceTranslate"
      );
      if (!ok) {
        console.log(`  FAIL: "${method.name}" — ${error}`);
        shipFail++;
      } else {
        console.log(`  OK: "${method.name}" → "${input.name}"`);
        shipOk++;
      }
    } catch (err: any) {
      console.error(`  FAIL: "${method.name}" — ${err.message?.slice(0, 80)}`);
      shipFail++;
    }
  }
  console.log(`  Result: ${shipOk} OK, ${shipSkip} skipped, ${shipFail} failed\n`);

  // ── Summary ────────────────────────────────────────────────────────────
  const heTotal = catOk + colOk + prodOk + varOk + attrOk + valOk + vouchOk + shipOk;
  const enTotal = enCatOk + enColOk + enProdOk;
  console.log("=== SUMMARY ===");
  console.log("");
  console.log("  English SEO (base entity updates):");
  console.log(`    Categories:       ${enCatOk}/${CATEGORIES.length}`);
  console.log(`    Collections:      ${enColOk}/${COLLECTIONS.length}`);
  console.log(`    Products:         ${enProdOk}/${ALL_PRODUCTS.length}`);
  console.log(`    Subtotal:         ${enTotal}`);
  console.log("");
  console.log(`  Hebrew Translations (×${HEBREW_CODES.length} codes: ${HEBREW_CODES.join(", ")}):`);
  console.log(`    Categories:       ${catOk}/${CATEGORIES.length}`);
  console.log(`    Collections:      ${colOk}/${COLLECTIONS.length}`);
  console.log(`    Products:         ${prodOk}/${ALL_PRODUCTS.length}`);
  console.log(`    Variants:         ${varOk}/${totalVariants}`);
  console.log(`    Attributes:       ${attrOk}/${saleorAttributes.length}`);
  console.log(`    Attribute values: ${valOk}/${totalAttrValues}`);
  console.log(`    Vouchers:         ${vouchOk}/${saleorVouchers.length}`);
  console.log(`    Shipping methods: ${shipOk}/${allShippingMethods.length}`);
  console.log(`    Subtotal:         ${heTotal} entities (×${HEBREW_CODES.length} = ${heTotal * HEBREW_CODES.length} mutations)`);
  console.log("");
  console.log(`  GRAND TOTAL: ${enTotal + heTotal * HEBREW_CODES.length} mutations applied.`);
  console.log(`  Translation cache: ${translationCache.size} unique texts cached.`);
}

addTranslations().catch((error) => {
  console.error("Error adding translations:", error);
  process.exit(1);
});
