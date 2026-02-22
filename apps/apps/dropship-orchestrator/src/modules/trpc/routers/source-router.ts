import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { gql } from "graphql-tag";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { uploadProductImage } from "../utils/image-upload";
import { createLogger } from "@/logger";
import { getAccessToken } from "@/modules/suppliers/cj/auth";
import * as cjApi from "@/modules/suppliers/cj/api-client";
import type {
  CJProductInfo,
  CJFreightResult,
  CJProductSearchResult,
  CJCategoryFirst,
} from "@/modules/suppliers/cj/types";
import { slugify, stripHtml } from "@/modules/source/types";

const logger = createLogger("SourceRouter");

const FETCH_APP_METADATA = gql`
  query FetchAppMetadata {
    app {
      id
      privateMetadata {
        key
        value
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// GraphQL mutations for direct Saleor import
// ---------------------------------------------------------------------------

const FIND_PRODUCT_TYPE = gql`
  query FindProductType($slug: String!) {
    productTypes(filter: { slugs: [$slug] }, first: 1) {
      edges {
        node {
          id
          name
          isShippingRequired
          productAttributes { id slug name }
          variantAttributes { id slug name }
        }
      }
    }
  }
`;

const FIND_CATEGORY = gql`
  query FindCategory($slug: String!) {
    categories(filter: { slugs: [$slug] }, first: 1) {
      edges { node { id name } }
    }
  }
`;

const FIND_COLLECTION = gql`
  query FindCollection($slug: String!) {
    collections(filter: { slugs: [$slug] }, first: 1) {
      edges { node { id } }
    }
  }
`;

const FIND_CHANNELS = gql`
  query FindChannels {
    channels {
      id
      slug
      currencyCode
      defaultCountry { code }
    }
  }
`;

// Metadata queries for populating dropdowns in the UI
const LIST_PRODUCT_TYPES = gql`
  query ListProductTypes {
    productTypes(first: 100, sortBy: { field: NAME, direction: ASC }) {
      edges { node { id name slug } }
    }
  }
`;

const LIST_CATEGORIES = gql`
  query ListCategories {
    categories(first: 100, sortBy: { field: NAME, direction: ASC }) {
      edges { node { id name slug level } }
    }
  }
`;

const LIST_COLLECTIONS = gql`
  query ListCollections {
    collections(first: 100, sortBy: { field: NAME, direction: ASC }) {
      edges { node { id name slug } }
    }
  }
`;

const FIND_ATTRIBUTE = gql`
  query FindAttribute($slug: String!) {
    attributes(filter: { slugs: [$slug] }, first: 1) {
      edges { node { id slug inputType choices(first: 100) { edges { node { slug value } } } } }
    }
  }
`;

const FIND_PRODUCT_BY_EXTERNAL_REF = gql`
  query FindProductByExternalRef($externalReference: String!) {
    product(externalReference: $externalReference) {
      id
      name
      externalReference
    }
  }
`;

const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: ProductCreateInput!) {
    productCreate(input: $input) {
      product { id name slug externalReference }
      errors { field code message }
    }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $input: ProductInput!) {
    productUpdate(id: $id, input: $input) {
      product { id name }
      errors { field code message }
    }
  }
`;

const PRODUCT_CHANNEL_LISTING_UPDATE = gql`
  mutation ProductChannelListingUpdate($id: ID!, $input: ProductChannelListingUpdateInput!) {
    productChannelListingUpdate(id: $id, input: $input) {
      product { id }
      errors { field code message }
    }
  }
`;

const CREATE_VARIANT = gql`
  mutation CreateVariant($input: ProductVariantCreateInput!) {
    productVariantCreate(input: $input) {
      productVariant { id name sku }
      errors { field code message }
    }
  }
`;

const UPDATE_PRIVATE_METADATA = gql`
  mutation UpdatePrivateMetadata($id: ID!, $input: [MetadataInput!]!) {
    updatePrivateMetadata(id: $id, input: $input) {
      item { ... on ProductVariant { id } ... on Product { id } }
      errors { field code message }
    }
  }
`;

const UPDATE_PUBLIC_METADATA = gql`
  mutation UpdatePublicMetadata($id: ID!, $input: [MetadataInput!]!) {
    updateMetadata(id: $id, input: $input) {
      item { ... on Product { id } }
      errors { field code message }
    }
  }
`;

const VARIANT_CHANNEL_LISTING_UPDATE = gql`
  mutation VariantChannelListingUpdate($id: ID!, $input: [ProductVariantChannelListingAddInput!]!) {
    productVariantChannelListingUpdate(id: $id, input: $input) {
      variant { id }
      errors { field code message }
    }
  }
`;

const VARIANT_MEDIA_ASSIGN = gql`
  mutation VariantMediaAssign($variantId: ID!, $mediaId: ID!) {
    variantMediaAssign(variantId: $variantId, mediaId: $mediaId) {
      productVariant { id }
      errors { field message }
    }
  }
`;

const UPDATE_PRODUCT_TYPE = gql`
  mutation UpdateProductType($id: ID!, $input: ProductTypeInput!) {
    productTypeUpdate(id: $id, input: $input) {
      productType { id isShippingRequired }
      errors { field code message }
    }
  }
`;

const COLLECTION_ADD_PRODUCTS = gql`
  mutation CollectionAddProducts($collectionId: ID!, $products: [ID!]!) {
    collectionAddProducts(collectionId: $collectionId, products: $products) {
      errors { field code message }
    }
  }
`;

const LIST_WAREHOUSES = gql`
  query ListWarehouses {
    warehouses(first: 10) {
      edges {
        node {
          id
          name
          shippingZones(first: 10) {
            edges {
              node {
                id
                name
                countries { code }
              }
            }
          }
        }
      }
    }
  }
`;

const VARIANT_STOCKS_CREATE = gql`
  mutation VariantStocksCreate($variantId: ID!, $stocks: [StockInput!]!) {
    productVariantStocksCreate(variantId: $variantId, stocks: $stocks) {
      productVariant { id }
      errors { field code message }
    }
  }
`;

const UPDATE_SHIPPING_ZONE = gql`
  mutation UpdateShippingZone($id: ID!, $input: ShippingZoneUpdateInput!) {
    shippingZoneUpdate(id: $id, input: $input) {
      shippingZone { id name countries { code } }
      errors { field code message }
    }
  }
`;

// Helper: run a Saleor mutation and throw on errors
async function saleorMutate<T>(
  client: any,
  mutation: any,
  variables: Record<string, any>,
  label: string,
): Promise<T> {
  const { data, error } = await client.mutation(mutation, variables).toPromise();
  if (error) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `${label}: ${error.message}` });
  }
  // Check for Saleor-level errors in any mutation result field
  const resultKey = Object.keys(data || {}).find((k) => data[k]?.errors?.length > 0);
  if (resultKey) {
    const saleorErrors = data[resultKey].errors;
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${label}: ${saleorErrors.map((e: any) => `${e.field}: ${e.message}`).join("; ")}`,
    });
  }
  return data as T;
}

// Helper: find or resolve a Saleor entity by slug
async function findBySlug(
  client: any,
  query: any,
  slug: string,
  label: string,
): Promise<string | null> {
  const { data } = await client.query(query, { slug }).toPromise();
  const edges = Object.values(data || {}).find((v: any) => v?.edges)  as any;
  return edges?.edges?.[0]?.node?.id ?? null;
}

interface ProductTypeInfo {
  id: string;
  isShippingRequired: boolean;
  productAttributeSlugs: Set<string>;
  variantAttributeSlugs: Set<string>;
}

/** Fetch a product type by slug, including its assigned product & variant attribute slugs. */
async function findProductType(client: any, slug: string): Promise<ProductTypeInfo | null> {
  const { data } = await client.query(FIND_PRODUCT_TYPE, { slug }).toPromise();
  const node = data?.productTypes?.edges?.[0]?.node;
  if (!node) return null;
  return {
    id: node.id,
    isShippingRequired: node.isShippingRequired ?? true,
    productAttributeSlugs: new Set((node.productAttributes || []).map((a: any) => a.slug)),
    variantAttributeSlugs: new Set((node.variantAttributes || []).map((a: any) => a.slug)),
  };
}

async function getCJCredentials(client: any): Promise<string> {
  const { data, error } = await client.query(FETCH_APP_METADATA, {}).toPromise();

  if (error || !data?.app) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch app metadata" });
  }

  const metadata: Record<string, string> = {};
  for (const entry of data.app.privateMetadata || []) {
    metadata[entry.key] = entry.value;
  }

  const credsRaw = metadata["dropship-creds-cj"];
  if (!credsRaw) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "CJ credentials not configured. Go to Suppliers > CJ Dropshipping to set up your API key.",
    });
  }

  let creds: Record<string, string>;
  try {
    creds = JSON.parse(credsRaw);
  } catch {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to parse CJ credentials" });
  }

  if (!creds.apiKey) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "CJ API key not found in credentials. Please configure it in Suppliers > CJ.",
    });
  }

  return creds.apiKey;
}

function extractIdentifier(line: string): { type: "pid" | "sku"; value: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // UUID format: 77501FB4-7146-452E-9889-CDF41697E5CF
  const uuidMatch = trimmed.match(
    /([0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12})/,
  );
  if (uuidMatch) return { type: "pid", value: uuidMatch[1] };

  // Numeric ID from CJ URLs: 1005006839284893
  const numericMatch = trimmed.match(/(\d{10,20})/);
  if (numericMatch) return { type: "pid", value: numericMatch[1] };

  // SKU format: CJJSBGBG01517 (alphanumeric CJ SKU)
  const skuMatch = trimmed.match(/^(CJ[A-Z0-9]{6,30})$/i);
  if (skuMatch) return { type: "sku", value: skuMatch[1] };

  // If it looks like a plain identifier without spaces, try as pid
  if (/^[A-Za-z0-9_-]{5,50}$/.test(trimmed)) return { type: "pid", value: trimmed };

  return null;
}

// ---------------------------------------------------------------------------
// Smart Attribute Classifier — universal, category-agnostic
// ---------------------------------------------------------------------------

const COLOR_NAMES = new Set([
  // Basic
  "black", "white", "red", "blue", "green", "yellow", "orange", "purple",
  "pink", "grey", "gray", "brown", "beige", "navy", "khaki", "olive",
  "gold", "silver", "teal", "cyan", "magenta", "maroon", "coral",
  "ivory", "cream", "tan", "burgundy", "charcoal", "turquoise",
  // Multi-word / extended
  "army green", "dark green", "light green", "forest green", "mint green", "sage green",
  "light blue", "dark blue", "sky blue", "royal blue", "baby blue", "steel blue",
  "rose gold", "hot pink", "light pink", "dark pink", "salmon pink",
  "dark gray", "dark grey", "light gray", "light grey",
  "off white", "pure white", "snow white",
  "wine red", "dark red", "bright red", "cherry red",
  "coffee", "chocolate", "camel", "apricot", "champagne", "lavender",
  "lilac", "plum", "violet", "indigo", "aqua", "peach", "mustard",
  "rose", "ruby", "sapphire", "emerald", "amber", "bronze", "copper",
  "leopard", "camouflage", "camo", "transparent", "clear", "multicolor",
  "nude", "taupe", "mauve", "fuchsia", "lemon", "lime",
  // Additional CJ colors
  "rust", "rust red", "rusty", "rose red", "rose pink",
  "deep blue", "deep green", "deep red", "deep purple",
  "bright blue", "bright green", "bright yellow", "bright orange",
  "light yellow", "light purple", "light orange", "light brown",
  "dark brown", "dark orange", "dark yellow", "dark purple",
  "neon green", "neon pink", "neon orange", "neon yellow",
  "dusty pink", "dusty rose", "dusty blue",
  "powder blue", "powder pink",
  "pale pink", "pale blue", "pale green", "pale yellow",
  "classic black", "classic white",
  "warm gray", "warm grey", "cool gray", "cool grey",
  "sand", "sandstone", "oatmeal", "wheat", "flax",
  "wine", "claret", "berry", "raspberry", "strawberry", "cranberry",
  "watermelon", "flamingo", "bubblegum",
  "denim", "jean blue", "washed blue",
  "moss", "olive green", "hunter green", "pine green",
  "pewter", "gunmetal", "platinum", "titanium",
  "almond", "hazelnut", "mocha", "espresso", "latte", "cocoa",
  "sunset", "sunrise", "blush",
]);

const LETTER_SIZE_RE = /^(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL|6XL|one\s*size|free\s*size)$/i;
const SHOE_SIZE_RE = /^(3[5-9]|4[0-8])(\.\d)?$/;
const STORAGE_RE = /^\d+(GB|TB|MB)$/i;
const VOLUME_RE = /^\d+(\.\d+)?\s*(ml|L|oz|fl\s*oz)$/i;
const POWER_RE = /^\d+(mAh|W|V|A)$/i;
const PLUG_RE = /^(US|EU|UK|AU|CN)\s*(Plug|Standard)?$/i;
const LENGTH_RE = /^\d+(\.\d+)?\s*(cm|mm|m|inch|in|ft|'|")$/i;
const WEIGHT_RE = /^\d+(\.\d+)?\s*(kg|g|lb|oz)$/i;

/**
 * Classifies a variant option value into a named attribute.
 * Returns { attribute: "Color" | "Size" | "Storage" | ... | "Option" }
 */
function classifyVariantValue(value: string): { attribute: string } {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();

  // 1. Color dictionary (exact match, including multi-word)
  if (COLOR_NAMES.has(lower)) return { attribute: "Color" };

  // 1b. Hyphenated multi-word color ("Army-Green" → "army green")
  if (trimmed.includes("-")) {
    const asSpace = trimmed.split("-").join(" ").toLowerCase();
    if (COLOR_NAMES.has(asSpace)) return { attribute: "Color" };
  }

  // 2. Letter sizes
  if (LETTER_SIZE_RE.test(trimmed)) return { attribute: "Size" };

  // 3. Shoe-range numbers (35-48)
  if (SHOE_SIZE_RE.test(trimmed)) return { attribute: "Size" };

  // 4. Storage (64GB, 1TB)
  if (STORAGE_RE.test(trimmed)) return { attribute: "Storage" };

  // 5. Volume (30ml, 1L, 8oz)
  if (VOLUME_RE.test(trimmed)) return { attribute: "Volume" };

  // 6. Power (5000mAh, 65W)
  if (POWER_RE.test(trimmed)) return { attribute: "Power" };

  // 7. Plug type (US Plug, EU Standard)
  if (PLUG_RE.test(trimmed)) return { attribute: "Plug Type" };

  // 8. Length (10cm, 15inch)
  if (LENGTH_RE.test(trimmed)) return { attribute: "Length" };

  // 9. Weight (500g, 2kg)
  if (WEIGHT_RE.test(trimmed)) return { attribute: "Weight" };

  // 10. Generic number 1-999 (not in shoe range) → Size
  if (/^\d{1,3}(\.\d)?$/.test(trimmed)) return { attribute: "Size" };

  // 11. Fallback — still "Option" internally, but callers will convert to Color
  return { attribute: "Option" };
}

/**
 * CJ placeholder color names — these are not real colors, just CJ defaults.
 * When we see these, we treat the product as having no color specified.
 */
const CJ_PLACEHOLDER_COLORS = new Set([
  "image color", "picture color", "as picture", "as shown",
  "default color", "default", "mixed color", "random color",
]);

/**
 * Checks if a value is a recognized size (letter size, shoe size, or plain number).
 */
function isKnownSize(val: string): boolean {
  const trimmed = val.trim();
  return LETTER_SIZE_RE.test(trimmed) || SHOE_SIZE_RE.test(trimmed) || /^\d{1,3}(\.\d)?$/.test(trimmed);
}

/**
 * Tries to split a hyphen-delimited variant value like "Red-S" into
 * separate attributes: { Color: "Red", Size: "S" }.
 *
 * Strategy (in order):
 * 1. Whole string is a known multi-word color → { Color: "..." }
 * 2. Longest color prefix + remaining classified → { Color: "...", Size: "..." }
 * 3. All parts classify to known attributes → { Color: "...", Size: "..." }
 * 4. Last segment is a known size → everything before = Color, last = Size
 *    This is the KEY fallback for CJ products where Color-Size is the pattern.
 *
 * NEVER returns null — always produces at least { Color: "..." } as fallback.
 */
function tryHyphenSplit(val: string): Record<string, string> {
  const parts = val.split("-").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) {
    // Single value, no hyphen to split — just return as Color
    return { Color: val.trim() };
  }

  // 1. Whole string is a known multi-word color ("Army-Green" → "Army Green")
  const wholeAsSpace = parts.join(" ").toLowerCase();
  if (COLOR_NAMES.has(wholeAsSpace)) {
    const titleCase = parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
    return { Color: titleCase };
  }

  // 2. Try longest color prefix first ("Dark-Blue-XL" → Color: "Dark Blue", remaining: "XL")
  for (let i = parts.length - 1; i >= 2; i--) {
    const colorCandidate = parts.slice(0, i).join(" ").toLowerCase();
    if (COLOR_NAMES.has(colorCandidate)) {
      const colorValue = parts
        .slice(0, i)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(" ");
      const remaining = parts.slice(i);
      const result: Record<string, string> = { Color: colorValue };
      const usedAttrs = new Set<string>(["Color"]);
      for (const r of remaining) {
        const { attribute } = classifyVariantValue(r);
        if (attribute !== "Option") {
          let name = attribute;
          if (usedAttrs.has(name)) {
            let suffix = 2;
            while (usedAttrs.has(`${attribute} ${suffix}`)) suffix++;
            name = `${attribute} ${suffix}`;
          }
          usedAttrs.add(name);
          result[name] = r;
        }
      }
      if (Object.keys(result).length > 1) return result;
    }
  }

  // 3. Simple split: classify each part independently
  const classified = parts.map((p) => ({ ...classifyVariantValue(p), value: p }));

  // Only use split if ALL parts classify to known attributes (not "Option")
  if (classified.every((c) => c.attribute !== "Option")) {
    const result: Record<string, string> = {};
    const usedAttrs = new Set<string>();
    for (const c of classified) {
      let name = c.attribute;
      if (usedAttrs.has(name)) {
        let suffix = 2;
        while (usedAttrs.has(`${c.attribute} ${suffix}`)) suffix++;
        name = `${c.attribute} ${suffix}`;
      }
      usedAttrs.add(name);
      result[name] = c.value;
    }
    return result;
  }

  // 4. KEY FALLBACK: If last segment is a recognized size, treat everything before as Color.
  // This handles the most common CJ pattern: "Rose Red-L", "RUST-Xs", "Image color-M"
  const lastPart = parts[parts.length - 1];
  if (isKnownSize(lastPart)) {
    const colorParts = parts.slice(0, -1);
    let colorName = colorParts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");

    // Check if the color is a CJ placeholder
    if (CJ_PLACEHOLDER_COLORS.has(colorName.toLowerCase())) {
      colorName = "Default";
    }

    return { Color: colorName, Size: lastPart };
  }

  // 5. First segment is a recognized size — everything after = Color
  const firstPart = parts[0];
  if (isKnownSize(firstPart)) {
    const colorParts = parts.slice(1);
    let colorName = colorParts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
    if (CJ_PLACEHOLDER_COLORS.has(colorName.toLowerCase())) {
      colorName = "Default";
    }
    return { Size: firstPart, Color: colorName };
  }

  // 6. Ultimate fallback: treat whole value as Color (never output "Option")
  let colorName = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
  if (CJ_PLACEHOLDER_COLORS.has(colorName.toLowerCase())) {
    colorName = "Default";
  }
  return { Color: colorName };
}

export const sourceRouter = router({
  // -------------------------------------------------------------------------
  // Fetch Saleor metadata for UI dropdowns (channels, product types, etc.)
  // -------------------------------------------------------------------------
  saleorMetadata: protectedClientProcedure.query(async ({ ctx }) => {
    const client = ctx.apiClient;

    const [channelRes, typeRes, categoryRes, collectionRes] = await Promise.all([
      client.query(FIND_CHANNELS, {}).toPromise(),
      client.query(LIST_PRODUCT_TYPES, {}).toPromise(),
      client.query(LIST_CATEGORIES, {}).toPromise(),
      client.query(LIST_COLLECTIONS, {}).toPromise(),
    ]);

    const channels: Array<{ id: string; slug: string; currencyCode: string }> =
      (channelRes.data?.channels ?? []).map((c: any) => ({
        id: c.id,
        slug: c.slug,
        currencyCode: c.currencyCode,
      }));

    const productTypes: Array<{ id: string; name: string; slug: string }> =
      (typeRes.data?.productTypes?.edges ?? []).map((e: any) => ({
        id: e.node.id,
        name: e.node.name,
        slug: e.node.slug,
      }));

    const categories: Array<{ id: string; name: string; slug: string; level: number }> =
      (categoryRes.data?.categories?.edges ?? []).map((e: any) => ({
        id: e.node.id,
        name: e.node.name,
        slug: e.node.slug,
        level: e.node.level ?? 0,
      }));

    const collections: Array<{ id: string; name: string; slug: string }> =
      (collectionRes.data?.collections?.edges ?? []).map((e: any) => ({
        id: e.node.id,
        name: e.node.name,
        slug: e.node.slug,
      }));

    return { channels, productTypes, categories, collections };
  }),

  fetchProducts: protectedClientProcedure
    .input(
      z.object({
        urls: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const apiKey = await getCJCredentials(ctx.apiClient);

      // Authenticate with CJ
      const authResult = await getAccessToken(apiKey);
      if (authResult.isErr()) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: `CJ authentication failed: ${authResult.error.message}`,
        });
      }

      const accessToken = authResult.value.accessToken;

      // Extract identifiers from URLs/PIDs/SKUs
      const identifiers: Array<{ type: "pid" | "sku"; value: string }> = [];
      const seen = new Set<string>();

      for (const url of input.urls) {
        const id = extractIdentifier(url);
        if (id) {
          if (!seen.has(id.value)) {
            seen.add(id.value);
            identifiers.push(id);
          }
        }
      }

      if (identifiers.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No valid product IDs found. Paste CJ product URLs, PIDs, UUIDs, or SKUs (one per line).",
        });
      }

      logger.info("Fetching CJ products", { count: identifiers.length });

      // Fetch each product from CJ API
      const products: Array<{
        pid: string;
        name: string;
        description: string;
        images: string[];
        costPrice: number;
        suggestSellPrice: number;
        weight: number;
        cjProductType: string;
        cjCategoryId: string;
        cjCategoryName: string;
        logisticsType: string;
        status: number;
        supplierName: string;
        variants: Array<{
          vid: string;
          name: string;
          sku: string;
          price: number;
          suggestPrice: number;
          image?: string;
          weight: number;
          attributes: Record<string, string>;
        }>;
      }> = [];

      const errors: Array<{ pid: string; error: string }> = [];

      for (const id of identifiers) {
        // Try pid first
        let result = await cjApi.get<CJProductInfo>(
          "/product/query",
          accessToken,
          id.type === "sku" ? { productSku: id.value } : { pid: id.value },
        );

        // If pid failed, retry as productSku
        if (result.isErr() && id.type === "pid") {
          result = await cjApi.get<CJProductInfo>(
            "/product/query",
            accessToken,
            { productSku: id.value },
          );
        }

        if (result.isErr()) {
          errors.push({ pid: id.value, error: result.error.message });
          logger.warn("Failed to fetch CJ product", { id: id.value, error: result.error.message });
          continue;
        }

        const p = result.value;

        const images: string[] = [];
        if (p.productImage) images.push(p.productImage);
        if (p.productImageSet) {
          for (const imgUrl of p.productImageSet) {
            if (!images.includes(imgUrl)) images.push(imgUrl);
          }
        }

        const variants = (p.variants ?? []).map((v) => {
          const attributes: Record<string, string> = {};

          // Priority 1: variantProperty (semicolon-delimited key:value pairs) — rare but authoritative
          if (v.variantProperty && v.variantProperty !== "null" && v.variantProperty !== "[]") {
            for (const pair of v.variantProperty.split(";")) {
              const [key, value] = pair.split(":");
              if (key?.trim() && value?.trim()) {
                attributes[key.trim()] = value.trim();
              }
            }
          }

          // Priority 2: variantKey — the actual variant option value(s)
          if (Object.keys(attributes).length === 0 && v.variantKey) {
            let keyValues: string[];
            try {
              const parsed = JSON.parse(v.variantKey);
              keyValues = Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
            } catch {
              keyValues = [v.variantKey];
            }

            const usedAttrs = new Set<string>();
            for (const val of keyValues) {
              const { attribute } = classifyVariantValue(val);

              // If classifier returned "Option", try splitting hyphenated values
              // e.g., "Red-S" → { Color: "Red", Size: "S" }
              // tryHyphenSplit ALWAYS returns a result (never null) — no "Option" output
              if (attribute === "Option") {
                if (val.includes("-")) {
                  const split = tryHyphenSplit(val);
                  for (const [k, sv] of Object.entries(split)) {
                    if (!usedAttrs.has(k)) {
                      usedAttrs.add(k);
                      attributes[k] = sv;
                    }
                  }
                  continue;
                }
                // Single value that didn't classify — treat as Color
                let colorName = val.trim();
                if (CJ_PLACEHOLDER_COLORS.has(colorName.toLowerCase())) {
                  colorName = "Default";
                }
                if (!usedAttrs.has("Color")) {
                  usedAttrs.add("Color");
                  attributes["Color"] = colorName;
                } else {
                  attributes["Color 2"] = colorName;
                  usedAttrs.add("Color 2");
                }
                continue;
              }

              // Avoid duplicate attribute names — append suffix if needed
              let attrName = attribute;
              if (usedAttrs.has(attrName)) {
                let suffix = 2;
                while (usedAttrs.has(`${attribute} ${suffix}`)) suffix++;
                attrName = `${attribute} ${suffix}`;
              }
              usedAttrs.add(attrName);
              attributes[attrName] = val;
            }
          }

          // Priority 3: Parse from variantNameEn (last resort)
          if (Object.keys(attributes).length === 0 && v.variantNameEn && p.productNameEn) {
            const productNameWords = p.productNameEn.toLowerCase().split(/\s+/);
            const variantWords = v.variantNameEn.split(/\s+/);
            const extra = variantWords.filter(
              (w) => !productNameWords.includes(w.toLowerCase()),
            );
            if (extra.length > 0) {
              const optionValue = extra.join(" ");
              const { attribute } = classifyVariantValue(optionValue);
              if (attribute === "Option") {
                if (optionValue.includes("-")) {
                  // tryHyphenSplit always returns a result
                  Object.assign(attributes, tryHyphenSplit(optionValue));
                } else {
                  // Single unrecognized value → Color (never "Option")
                  let colorName = optionValue.trim();
                  if (CJ_PLACEHOLDER_COLORS.has(colorName.toLowerCase())) {
                    colorName = "Default";
                  }
                  attributes["Color"] = colorName;
                }
              } else {
                attributes[attribute] = optionValue;
              }
            }
          }

          // SAFETY NET: Ensure no "Option" attribute ever reaches the CSV.
          // Rename any remaining "Option" keys to "Color".
          if (attributes["Option"]) {
            const optVal = attributes["Option"];
            delete attributes["Option"];
            if (!attributes["Color"]) {
              let colorName = optVal;
              if (CJ_PLACEHOLDER_COLORS.has(colorName.toLowerCase())) {
                colorName = "Default";
              }
              attributes["Color"] = colorName;
            }
          }

          return {
            vid: v.vid,
            name: v.variantNameEn || v.vid,
            sku: v.variantSku || "",
            price: Number(v.variantSellPrice) || 0,
            suggestPrice: Number(v.variantSugSellPrice ?? p.suggestSellPrice) || 0,
            image: v.variantImage || undefined,
            weight: Number(v.variantWeight ?? p.productWeight) || 0,
            attributes,
          };
        });

        // If no variants, create a default from product-level data
        if (variants.length === 0) {
          variants.push({
            vid: p.pid,
            name: "Default",
            sku: p.productSku || "",
            price: Number(p.sellPrice) || 0,
            suggestPrice: Number(p.suggestSellPrice) || 0,
            image: p.productImage || undefined,
            weight: Number(p.productWeight) || 0,
            attributes: {},
          });
        }

        products.push({
          pid: p.pid,
          name: p.productNameEn,
          description: p.description || "",
          images,
          costPrice: Number(p.sellPrice) || 0,
          suggestSellPrice: Number(p.suggestSellPrice) || 0,
          weight: Number(p.productWeight) || 0,
          cjProductType: p.productType || "",
          cjCategoryId: p.categoryId || "",
          cjCategoryName: p.categoryName || "",
          logisticsType: (p.productProEnSet ?? []).join(", ") || "COMMON",
          status: p.status ?? 0,
          supplierName: p.supplierName ?? "",
          variants,
        });
      }

      logger.info("CJ product fetch complete", {
        fetched: products.length,
        failed: errors.length,
      });

      return { products, errors };
    }),

  fetchShipping: protectedClientProcedure
    .input(
      z.object({
        variants: z.array(
          z.object({
            pid: z.string(),
            vid: z.string(),
            weight: z.number(),
          }),
        ),
        destinationCountry: z.string().default("IL"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const apiKey = await getCJCredentials(ctx.apiClient);
      const authResult = await getAccessToken(apiKey);
      if (authResult.isErr()) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: `CJ authentication failed: ${authResult.error.message}`,
        });
      }

      const accessToken = authResult.value.accessToken;

      // Group variants by rounded weight to minimize API calls
      const weightGroups = new Map<number, typeof input.variants>();
      for (const v of input.variants) {
        const key = Math.round(v.weight);
        if (!weightGroups.has(key)) weightGroups.set(key, []);
        weightGroups.get(key)!.push(v);
      }

      logger.info("Fetching shipping for variants", {
        totalVariants: input.variants.length,
        uniqueWeights: weightGroups.size,
        destination: input.destinationCountry,
      });

      // Fetch shipping for one representative vid per weight group
      const shippingByWeight = new Map<number, {
        shippingCost: number | null;
        carrier: string;
        deliveryDays: string;
      }>();

      for (const [weight, variants] of weightGroups) {
        const representative = variants[0];
        try {
          const freightResult = await cjApi.post<CJFreightResult[]>(
            "/logistic/freightCalculate",
            accessToken,
            {
              startCountryCode: "CN",
              endCountryCode: input.destinationCountry,
              products: [{ quantity: 1, vid: representative.vid }],
            },
          );

          if (freightResult.isErr() || !freightResult.value || freightResult.value.length === 0) {
            shippingByWeight.set(weight, { shippingCost: null, carrier: "", deliveryDays: "" });
            continue;
          }

          // Pick cheapest option
          const options = freightResult.value;
          const cheapest = options.reduce((best, opt) =>
            opt.logisticPrice < best.logisticPrice ? opt : best,
          );

          shippingByWeight.set(weight, {
            shippingCost: cheapest.logisticPrice,
            carrier: cheapest.logisticName,
            deliveryDays: cheapest.logisticAging || "",
          });
        } catch {
          shippingByWeight.set(weight, { shippingCost: null, carrier: "", deliveryDays: "" });
        }
      }

      // Map results back to all variants
      const results = input.variants.map((v) => {
        const shipping = shippingByWeight.get(Math.round(v.weight)) ?? {
          shippingCost: null,
          carrier: "",
          deliveryDays: "",
        };
        return {
          pid: v.pid,
          vid: v.vid,
          ...shipping,
        };
      });

      return { results };
    }),

  // ── Multi-warehouse shipping discovery ──
  // Queries CJ freight API from multiple origin countries to find which
  // warehouses can ship a product and compares cost / speed.
  fetchWarehouseShipping: protectedClientProcedure
    .input(
      z.object({
        products: z.array(
          z.object({
            pid: z.string(),
            vid: z.string(), // representative variant id
          }),
        ),
        destinationCountry: z.string().default("IL"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const apiKey = await getCJCredentials(ctx.apiClient);
      const authResult = await getAccessToken(apiKey);
      if (authResult.isErr()) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: `CJ authentication failed: ${authResult.error.message}`,
        });
      }

      const accessToken = authResult.value.accessToken;

      const CJ_WAREHOUSES: Array<{ code: string; label: string }> = [
        { code: "CN", label: "China" },
        { code: "US", label: "United States" },
        { code: "DE", label: "Germany" },
        { code: "GB", label: "United Kingdom" },
        { code: "AU", label: "Australia" },
        { code: "TH", label: "Thailand" },
      ];

      function parseDaysMin(aging: string): number {
        const match = aging.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 999;
      }

      // For each product, query all warehouses in parallel
      const results: Array<{
        pid: string;
        warehouses: Array<{
          origin: string;
          originLabel: string;
          cheapest: { cost: number; carrier: string; days: string } | null;
          fastest: { cost: number; carrier: string; days: string } | null;
          allOptions: Array<{ cost: number; carrier: string; days: string }>;
        }>;
      }> = [];

      for (const product of input.products) {
        const warehouseQueries = CJ_WAREHOUSES.map(async (wh) => {
          try {
            const freightResult = await cjApi.post<CJFreightResult[]>(
              "/logistic/freightCalculate",
              accessToken,
              {
                startCountryCode: wh.code,
                endCountryCode: input.destinationCountry,
                products: [{ quantity: 1, vid: product.vid }],
              },
            );

            if (freightResult.isErr() || !freightResult.value || freightResult.value.length === 0) {
              return null;
            }

            const allOptions = freightResult.value.map((opt) => ({
              cost: opt.logisticPrice,
              carrier: opt.logisticName,
              days: opt.logisticAging || "",
            }));

            const cheapest = allOptions.reduce((best, opt) =>
              opt.cost < best.cost ? opt : best,
            );
            const fastest = allOptions.reduce((best, opt) =>
              parseDaysMin(opt.days) < parseDaysMin(best.days) ? opt : best,
            );

            return {
              origin: wh.code,
              originLabel: wh.label,
              cheapest,
              fastest,
              allOptions,
            };
          } catch {
            return null;
          }
        });

        const warehouseResults = await Promise.all(warehouseQueries);
        const warehouses = warehouseResults.filter(
          (w): w is NonNullable<typeof w> => w !== null && w.allOptions.length > 0,
        );

        results.push({ pid: product.pid, warehouses });
      }

      return { results };
    }),

  searchProducts: protectedClientProcedure
    .input(
      z.object({
        keyWord: z.string().optional(),
        page: z.number().int().min(1).max(1000).default(1),
        size: z.number().int().min(1).max(200).default(20),
        categoryId: z.string().optional(),
        countryCode: z.string().optional(),
        startSellPrice: z.number().optional(),
        endSellPrice: z.number().optional(),
        sort: z.enum(["default", "price", "priceDesc", "newest", "hot"]).default("default"),
        productFlag: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const apiKey = await getCJCredentials(ctx.apiClient);
      const authResult = await getAccessToken(apiKey);
      if (authResult.isErr()) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: `CJ authentication failed: ${authResult.error.message}`,
        });
      }

      const accessToken = authResult.value.accessToken;

      // Build query params — only include non-empty values
      const params: Record<string, string> = {
        pageNum: String(input.page),
        pageSize: String(input.size),
      };

      if (input.keyWord) params.keyWord = input.keyWord;
      if (input.categoryId) params.categoryId = input.categoryId;
      if (input.countryCode) params.countryCode = input.countryCode;
      if (input.startSellPrice != null) params.startSellPrice = String(input.startSellPrice);
      if (input.endSellPrice != null) params.endSellPrice = String(input.endSellPrice);

      // Map sort enum to CJ API params
      if (input.sort === "price") {
        params.sort = "price";
        params.orderBy = "asc";
      } else if (input.sort === "priceDesc") {
        params.sort = "price";
        params.orderBy = "desc";
      } else if (input.sort === "newest") {
        params.sort = "createAt";
        params.orderBy = "desc";
      } else if (input.sort === "hot") {
        params.sort = "listedNum";
        params.orderBy = "desc";
      }

      if (input.productFlag) params.productFlag = input.productFlag;

      logger.info("Searching CJ products", { keyWord: input.keyWord, page: input.page });

      const result = await cjApi.get<CJProductSearchResult>(
        "/product/listV2",
        accessToken,
        params,
      );

      if (result.isErr()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `CJ search failed: ${result.error.message}`,
        });
      }

      const data = result.value;
      const content = data.content?.[0];
      const productList = content?.productList ?? [];
      const relatedCategories = content?.relatedCategoryList ?? [];

      const products = productList.map((item) => ({
        id: item.id,
        name: item.nameEn,
        sku: item.sku,
        image: item.bigImage,
        sellPrice: parseFloat(item.sellPrice) || 0,
        nowPrice: parseFloat(item.nowPrice) || 0,
        listedNum: item.listedNum ?? 0,
        categoryName: item.threeCategoryName || item.twoCategoryName || item.oneCategoryName || "",
        supplierName: item.supplierName || "",
        inventory: item.warehouseInventoryNum ?? 0,
        freeShipping: item.productType === "1",
        deliveryCycle: item.deliveryCycle || "",
      }));

      return {
        products,
        pagination: {
          page: data.pageNumber,
          pageSize: data.pageSize,
          totalRecords: data.totalRecords,
          totalPages: data.totalPages,
        },
        relatedCategories,
      };
    }),

  getCategories: protectedClientProcedure.query(async ({ ctx }) => {
    const apiKey = await getCJCredentials(ctx.apiClient);
    const authResult = await getAccessToken(apiKey);
    if (authResult.isErr()) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: `CJ authentication failed: ${authResult.error.message}`,
      });
    }

    const accessToken = authResult.value.accessToken;

    const result = await cjApi.get<CJCategoryFirst[]>(
      "/product/getCategory",
      accessToken,
    );

    if (result.isErr()) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `CJ categories failed: ${result.error.message}`,
      });
    }

    // Transform to a flat-ish tree structure for the frontend
    const categories = (result.value ?? []).map((first) => ({
      name: first.categoryFirstName,
      children: (first.categoryFirstList ?? []).map((second) => ({
        name: second.categorySecondName,
        children: (second.categorySecondList ?? []).map((third) => ({
          id: third.categoryId,
          name: third.categoryName,
        })),
      })),
    }));

    return { categories };
  }),

  // -------------------------------------------------------------------------
  // Import sourced products into Aura (mirrors Bulk Manager's proven flow)
  // -------------------------------------------------------------------------

  importToAura: protectedClientProcedure
    .input(
      z.object({
        products: z.array(
          z.object({
            pid: z.string(),
            name: z.string(),
            description: z.string(),
            images: z.array(z.string()),
            costPrice: z.number(),
            weight: z.number(),
            variants: z.array(
              z.object({
                vid: z.string(),
                sku: z.string(),
                price: z.number(),
                weight: z.number(),
                image: z.string().optional(),
                attributes: z.record(z.string()),
                shippingCost: z.number().nullable(),
                shippingCarrier: z.string(),
                shippingDays: z.string(),
              }),
            ),
            editName: z.string(),
            editType: z.string(),
            editCategory: z.string(),
            editCollections: z.string(),
            editGender: z.string(),
            shippingDays: z.string(),
            shippingCarrier: z.string(),
          }),
        ),
        channelSlugs: z.array(z.string()).min(1),
        markup: z.number().min(1).default(2.5),
        ilsRate: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const client = ctx.apiClient;

      // 1. Resolve channels
      const { data: channelData } = await client.query(FIND_CHANNELS, {}).toPromise();
      const allChannels: Array<{ id: string; slug: string; currencyCode: string; defaultCountry?: { code: string } }> =
        channelData?.channels ?? [];
      const selectedChannels = allChannels.filter((c) =>
        input.channelSlugs.includes(c.slug),
      );
      if (selectedChannels.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No valid channels found" });
      }

      // 1b. Resolve warehouse for stock allocation (dropship products need stock entries
      // for Saleor to consider them available for shipping, even with trackInventory=false)
      const { data: warehouseData } = await client.query(LIST_WAREHOUSES, {}).toPromise();
      const warehouseNodes: Array<{
        id: string;
        name: string;
        shippingZones: { edges: Array<{ node: { id: string; name: string; countries: Array<{ code: string }> } }> };
      }> = (warehouseData?.warehouses?.edges ?? []).map((e: any) => e.node);
      const warehouse = warehouseNodes[0];
      const warehouseId = warehouse?.id;
      if (!warehouseId) {
        logger.warn("No warehouses found — variants will be created without stock entries");
      }

      // 1c. Ensure shipping zone covers selected channels' countries
      // Without this, Saleor won't compute shipping methods for those countries
      if (warehouse) {
        const zone = warehouse.shippingZones?.edges?.[0]?.node;
        if (zone) {
          const coveredCountries = new Set(zone.countries.map((c) => c.code));
          const channelCountries = selectedChannels
            .map((ch) => ch.defaultCountry?.code)
            .filter(Boolean) as string[];
          const missingCountries = channelCountries.filter((c) => !coveredCountries.has(c));

          if (missingCountries.length > 0) {
            const allCountries = [...coveredCountries, ...missingCountries];
            try {
              await saleorMutate(client, UPDATE_SHIPPING_ZONE, {
                id: zone.id,
                input: { countries: allCountries },
              }, "Shipping zone update");
              logger.info("Shipping zone updated with missing countries", {
                zone: zone.name,
                added: missingCountries,
              });
            } catch (zoneErr: any) {
              logger.warn("Failed to update shipping zone (non-fatal)", {
                error: zoneErr.message,
              });
            }
          }
        }
      }

      const created: Array<{ id: string; name: string; variantCount: number }> = [];
      const errors: Array<{ name: string; error: string }> = [];

      for (const product of input.products) {
        try {
          // 2. Check for existing product (upsert by externalReference)
          const extRef = `CJ-${product.pid}`;
          const { data: existingData } = await client
            .query(FIND_PRODUCT_BY_EXTERNAL_REF, { externalReference: extRef })
            .toPromise();

          if (existingData?.product?.id) {
            logger.info("Product already exists, skipping creation", {
              name: product.editName,
              id: existingData.product.id,
            });
            created.push({
              id: existingData.product.id,
              name: product.editName,
              variantCount: 0,
            });
            continue;
          }

          // 3. Resolve product type (with its assigned attributes)
          const typeSlug = slugify(product.editType || "dropship-product");
          const productTypeInfo = await findProductType(client, typeSlug);
          if (!productTypeInfo) {
            errors.push({ name: product.editName, error: `Product type "${product.editType}" not found` });
            continue;
          }
          const productTypeId = productTypeInfo.id;

          if (!productTypeInfo.isShippingRequired) {
            logger.warn(
              `Product type "${product.editType}" has isShippingRequired=false — auto-fixing for dropship.`,
            );
            const { data: ptUpdateData } = await client.mutation(UPDATE_PRODUCT_TYPE, {
              id: productTypeInfo.id,
              input: { isShippingRequired: true },
            }).toPromise();
            if (ptUpdateData?.productTypeUpdate?.errors?.length) {
              logger.error("Failed to update product type isShippingRequired", {
                errors: ptUpdateData.productTypeUpdate.errors,
              });
            } else {
              logger.info(`Product type "${product.editType}" updated: isShippingRequired=true`);
              productTypeInfo.isShippingRequired = true;
            }
          }

          // 4. Resolve category
          const categorySlug = product.editCategory || "uncategorized";
          const categoryId = await findBySlug(client, FIND_CATEGORY, categorySlug, "Category");

          // 5. Parse shipping days for metadata
          let minDays = "";
          let maxDays = "";
          const shippingDaysStr =
            product.variants[0]?.shippingDays || product.shippingDays || "";
          if (shippingDaysStr) {
            const parts = shippingDaysStr.split("-").map((s) => s.trim());
            minDays = parts[0] || "";
            maxDays = parts[1] || parts[0] || "";
          }
          const carrier =
            product.variants[0]?.shippingCarrier || product.shippingCarrier || "";

          // 6. Build description as EditorJS JSON (rawHtml block preserves formatting)
          const descHtml = (product.description || "").trim();
          const descText = stripHtml(descHtml);
          const descriptionJson = descHtml
            ? JSON.stringify({
                time: Date.now(),
                version: "2.0.0",
                blocks: [{ type: "rawHtml", data: { html: descHtml, text: descText } }],
              })
            : undefined;

          // 7. Create product
          const publicMetadata: Array<{ key: string; value: string }> = [];
          if (minDays) {
            publicMetadata.push({ key: "shipping.estimatedMinDays", value: minDays });
            publicMetadata.push({ key: "shipping.estimatedMaxDays", value: maxDays });
          }
          if (carrier) {
            publicMetadata.push({ key: "shipping.carrier", value: carrier });
          }

          const productInput: Record<string, any> = {
            name: product.editName,
            slug: slugify(product.editName),
            productType: productTypeId,
            description: descriptionJson,
            weight: product.weight > 0 ? product.weight : undefined,
            externalReference: extRef,
            metadata: publicMetadata,
          };
          // Always include category (Bulk Manager pattern)
          if (categoryId) {
            productInput.category = categoryId;
          } else {
            logger.warn(`Category "${categorySlug}" not found — product will be created without category`);
          }

          if (product.editGender && productTypeInfo.productAttributeSlugs.has("gender")) {
            const genderAttrId = await findBySlug(client, FIND_ATTRIBUTE, "gender", "Gender attr");
            if (genderAttrId) {
              productInput.attributes = [{ id: genderAttrId, values: [product.editGender] }];
            }
          }

          const createResult = await saleorMutate<any>(
            client,
            CREATE_PRODUCT,
            { input: productInput },
            `Create ${product.editName}`,
          );
          const productId = createResult.productCreate.product.id;

          // 8. Set private metadata (dropship.supplier, dropship.costPrice)
          await saleorMutate(client, UPDATE_PRIVATE_METADATA, {
            id: productId,
            input: [
              { key: "dropship.supplier", value: "cj" },
              { key: "dropship.costPrice", value: String(product.costPrice) },
            ],
          }, "Private metadata");

          // 9. Publish to channels (always publish — matches Bulk Manager)
          const channelListings = selectedChannels.map((ch) => ({
            channelId: ch.id,
            isPublished: true,
            visibleInListings: true,
            isAvailableForPurchase: true,
            availableForPurchaseAt: new Date().toISOString(),
          }));
          await saleorMutate(
            client,
            PRODUCT_CHANNEL_LISTING_UPDATE,
            { id: productId, input: { updateChannels: channelListings } },
            "Channel listing",
          );

          // 10. Upload product images via multipart (Bulk Manager pattern)
          const uploadedMediaMap = new Map<string, string>();
          for (const imgUrl of product.images.slice(0, 5)) {
            if (!imgUrl) continue;
            try {
              const imgResult = await uploadProductImage(
                imgUrl,
                productId,
                product.editName,
                ctx.saleorApiUrl,
                ctx.appToken,
              );
              if (imgResult.success && imgResult.id) {
                uploadedMediaMap.set(imgUrl, imgResult.id);
                logger.info("Image uploaded", { productId, mediaId: imgResult.id });
              } else {
                logger.warn("Image upload failed", { url: imgUrl.substring(0, 80), error: imgResult.error });
              }
            } catch (imgErr: any) {
              logger.warn("Image upload error", { url: imgUrl.substring(0, 80), error: imgErr.message });
            }
          }

          // 11. Resolve variant attribute IDs (only assigned ones)
          const attrNames = new Set<string>();
          for (const v of product.variants) {
            for (const key of Object.keys(v.attributes)) {
              attrNames.add(key);
            }
          }
          const attrIdMap = new Map<string, string>();
          for (const name of attrNames) {
            const attrSlug = slugify(name);
            if (!productTypeInfo.variantAttributeSlugs.has(attrSlug)) {
              logger.warn(`Skipping variant attr "${name}" (slug: ${attrSlug}) — not assigned to product type "${product.editType}"`);
              continue;
            }
            const attrId = await findBySlug(client, FIND_ATTRIBUTE, attrSlug, `Attr ${name}`);
            if (attrId) attrIdMap.set(name, attrId);
          }

          // 12. Create variants (Bulk Manager pattern: create → pricing → metadata → image)
          let variantCount = 0;
          for (const variant of product.variants) {
            const sku = `DS-CJ-${product.pid}-${variant.vid}`;

            const variantAttributes: Array<{ id: string; values: string[] }> = [];
            for (const [name, value] of Object.entries(variant.attributes)) {
              const attrId = attrIdMap.get(name);
              if (attrId) {
                variantAttributes.push({ id: attrId, values: [value] });
              }
            }

            try {
              // 12a. Create variant (no inline channelListings)
              const variantResult = await saleorMutate<any>(
                client,
                CREATE_VARIANT,
                {
                  input: {
                    product: productId,
                    sku,
                    trackInventory: false,
                    weight: variant.weight > 0 ? variant.weight : undefined,
                    attributes: variantAttributes,
                  },
                },
                `Variant ${sku}`,
              );

              const variantId = variantResult.productVariantCreate.productVariant.id;

              // 12b. Set variant pricing per channel (separate mutation — more reliable)
              const variantPricing = selectedChannels.map((ch) => {
                let price = variant.price * input.markup;
                let costPrice = variant.price;
                if (ch.currencyCode === "ILS" && input.ilsRate && input.ilsRate > 0) {
                  price = price * input.ilsRate;
                  costPrice = costPrice * input.ilsRate;
                }
                return {
                  channelId: ch.id,
                  price: parseFloat(price.toFixed(2)),
                  costPrice: parseFloat(costPrice.toFixed(2)),
                };
              });

              await saleorMutate(
                client,
                VARIANT_CHANNEL_LISTING_UPDATE,
                { id: variantId, input: variantPricing },
                `Variant pricing ${sku}`,
              );

              // 12c. Set variant private metadata
              await saleorMutate(client, UPDATE_PRIVATE_METADATA, {
                id: variantId,
                input: [{ key: "dropship.supplierSku", value: variant.vid }],
              }, "Variant metadata");

              // 12c2. Allocate stock in warehouse (required for Saleor shipping availability)
              if (warehouseId) {
                try {
                  await saleorMutate(client, VARIANT_STOCKS_CREATE, {
                    variantId,
                    stocks: [{ warehouse: warehouseId, quantity: 1000 }],
                  }, `Stock ${sku}`);
                } catch (stockErr: any) {
                  logger.warn("Stock allocation failed (non-fatal)", {
                    sku,
                    error: stockErr.message,
                  });
                }
              }

              // 12d. Upload + assign variant image (with dedup)
              if (variant.image) {
                const existingMediaId = uploadedMediaMap.get(variant.image);
                if (existingMediaId) {
                  try {
                    await saleorMutate(client, VARIANT_MEDIA_ASSIGN, {
                      variantId,
                      mediaId: existingMediaId,
                    }, "Variant media assign (dedup)");
                  } catch { /* non-fatal */ }
                } else {
                  try {
                    const varImgResult = await uploadProductImage(
                      variant.image,
                      productId,
                      `${sku} variant`,
                      ctx.saleorApiUrl,
                      ctx.appToken,
                    );
                    if (varImgResult.success && varImgResult.id) {
                      uploadedMediaMap.set(variant.image, varImgResult.id);
                      await saleorMutate(client, VARIANT_MEDIA_ASSIGN, {
                        variantId,
                        mediaId: varImgResult.id,
                      }, "Variant media assign");
                    }
                  } catch { /* non-fatal */ }
                }
              }

              variantCount++;
            } catch (varErr: any) {
              logger.warn("Variant creation failed", { sku, error: varErr.message });
            }
          }

          // 13. Add to collections
          if (product.editCollections) {
            const collectionSlugs = product.editCollections
              .split(";")
              .map((s) => s.trim())
              .filter(Boolean);
            for (const colSlug of collectionSlugs) {
              const colId = await findBySlug(client, FIND_COLLECTION, colSlug, "Collection");
              if (colId) {
                try {
                  await saleorMutate(client, COLLECTION_ADD_PRODUCTS, {
                    collectionId: colId,
                    products: [productId],
                  }, "Collection add");
                } catch { /* non-fatal */ }
              }
            }
          }

          created.push({ id: productId, name: product.editName, variantCount });
          logger.info("Product imported", { name: product.editName, id: productId, variants: variantCount });
        } catch (err: any) {
          errors.push({ name: product.editName, error: err.message });
          logger.error("Product import failed", { name: product.editName, error: err.message });
        }
      }

      return { created, errors };
    }),

  // -------------------------------------------------------------------------
  // Refresh already-imported products (re-fetch from CJ, compare, flag drift)
  // -------------------------------------------------------------------------

  refreshProducts: protectedClientProcedure
    .input(
      z.object({
        externalReferences: z.array(z.string()), // e.g. ["CJ-abc123", "CJ-def456"]
        driftThreshold: z.number().min(0).max(100).default(15), // % price drift tolerance
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const client = ctx.apiClient;
      const apiKey = await getCJCredentials(client);
      const authResult = await getAccessToken(apiKey);
      if (authResult.isErr()) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: `CJ authentication failed: ${authResult.error.message}`,
        });
      }
      const accessToken = authResult.value.accessToken;

      const results: Array<{
        externalReference: string;
        name: string;
        status: "ok" | "drift" | "unavailable" | "error";
        priceDrift?: number; // percentage
        oldPrice?: number;
        newPrice?: number;
      }> = [];

      for (const extRef of input.externalReferences) {
        try {
          // Find product in Saleor
          const { data: prodData } = await client
            .query(FIND_PRODUCT_BY_EXTERNAL_REF, { externalReference: extRef })
            .toPromise();

          if (!prodData?.product?.id) {
            results.push({ externalReference: extRef, name: extRef, status: "error" });
            continue;
          }

          // Extract CJ PID from external reference
          const pid = extRef.replace(/^CJ-/, "");

          // Fetch latest from CJ
          const cjResult = await cjApi.get<CJProductInfo>(
            "/product/query",
            accessToken,
            { pid },
          );

          if (cjResult.isErr()) {
            results.push({
              externalReference: extRef,
              name: prodData.product.name,
              status: "error",
            });
            continue;
          }

          const cjProduct = cjResult.value;

          // Check availability
          if (cjProduct.status !== 1 && cjProduct.status !== 0) {
            results.push({
              externalReference: extRef,
              name: prodData.product.name,
              status: "unavailable",
            });
            continue;
          }

          // Compare price drift
          const oldPrice = 0; // Would need to read from variant channelListings
          const newPrice = Number(cjProduct.sellPrice) || 0;
          const drift =
            oldPrice > 0 ? Math.abs((newPrice - oldPrice) / oldPrice) * 100 : 0;

          if (drift > input.driftThreshold) {
            results.push({
              externalReference: extRef,
              name: prodData.product.name,
              status: "drift",
              priceDrift: Math.round(drift * 10) / 10,
              oldPrice,
              newPrice,
            });
          } else {
            results.push({
              externalReference: extRef,
              name: prodData.product.name,
              status: "ok",
            });
          }
        } catch (err: any) {
          results.push({
            externalReference: extRef,
            name: extRef,
            status: "error",
          });
        }
      }

      return { results };
    }),

  // -------------------------------------------------------------------------
  // Fix dropship product availability (retroactive stock + shipping zone fix)
  // Ensures all dropship products have stock entries and shipping zones cover
  // all channel default countries. Run once to fix existing imports.
  // -------------------------------------------------------------------------

  fixDropshipAvailability: protectedClientProcedure
    .mutation(async ({ ctx }) => {
      const client = ctx.apiClient;

      // 1. Get all warehouses with their shipping zones
      const { data: warehouseData } = await client.query(LIST_WAREHOUSES, {}).toPromise();
      const warehouseNodes = (warehouseData?.warehouses?.edges ?? []).map((e: any) => e.node);
      const warehouse = warehouseNodes[0];
      if (!warehouse) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No warehouses found" });
      }

      // 2. Get all channels to determine required countries
      const { data: channelData } = await client.query(FIND_CHANNELS, {}).toPromise();
      const channels: Array<{ id: string; slug: string; currencyCode: string; defaultCountry?: { code: string } }> =
        channelData?.channels ?? [];

      // 3. Ensure shipping zone covers all channel countries
      const zone = warehouse.shippingZones?.edges?.[0]?.node;
      let zoneFixed = false;
      if (zone) {
        const coveredCountries = new Set((zone.countries ?? []).map((c: any) => c.code));
        const channelCountries = channels
          .map((ch) => ch.defaultCountry?.code)
          .filter(Boolean) as string[];
        const missingCountries = channelCountries.filter((c) => !coveredCountries.has(c));

        if (missingCountries.length > 0) {
          const allCountries = [...coveredCountries, ...missingCountries];
          await saleorMutate(client, UPDATE_SHIPPING_ZONE, {
            id: zone.id,
            input: { countries: allCountries },
          }, "Fix shipping zone");
          zoneFixed = true;
          logger.info("Shipping zone fixed", { added: missingCountries });
        }
      }

      // 4. Find all dropship products (have dropship.supplier in metadata)
      const FIND_DROPSHIP_PRODUCTS = gql`
        query FindDropshipProducts($after: String) {
          products(
            filter: { metadata: [{ key: "dropship.supplier" }] }
            first: 100
            after: $after
          ) {
            edges {
              node {
                id
                name
                variants {
                  id
                  sku
                  stocks { warehouse { id } quantity }
                }
              }
            }
            pageInfo { hasNextPage endCursor }
          }
        }
      `;

      let fixedVariants = 0;
      let cursor: string | null = null;
      let hasMore = true;

      while (hasMore) {
        const { data: prodData } = await client
          .query(FIND_DROPSHIP_PRODUCTS, { after: cursor })
          .toPromise();

        const edges = prodData?.products?.edges ?? [];
        for (const edge of edges) {
          const product = edge.node;
          for (const variant of product.variants ?? []) {
            const hasStockInWarehouse = (variant.stocks ?? []).some(
              (s: any) => s.warehouse?.id === warehouse.id,
            );
            if (!hasStockInWarehouse) {
              try {
                await saleorMutate(client, VARIANT_STOCKS_CREATE, {
                  variantId: variant.id,
                  stocks: [{ warehouse: warehouse.id, quantity: 1000 }],
                }, `Fix stock ${variant.sku}`);
                fixedVariants++;
              } catch (e: any) {
                logger.warn("Failed to fix stock for variant", {
                  variantId: variant.id,
                  error: e.message,
                });
              }
            }
          }
        }

        hasMore = prodData?.products?.pageInfo?.hasNextPage ?? false;
        cursor = prodData?.products?.pageInfo?.endCursor ?? null;
      }

      return {
        zoneFixed,
        fixedVariants,
        warehouseName: warehouse.name,
        zoneName: zone?.name ?? "none",
      };
    }),
});
