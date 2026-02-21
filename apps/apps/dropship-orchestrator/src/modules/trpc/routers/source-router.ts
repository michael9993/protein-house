import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { gql } from "graphql-tag";

import { router } from "../trpc-server";
import { protectedClientProcedure } from "../protected-client-procedure";
import { createLogger } from "@/logger";
import { getAccessToken } from "@/modules/suppliers/cj/auth";
import * as cjApi from "@/modules/suppliers/cj/api-client";
import type {
  CJProductInfo,
  CJFreightResult,
  CJProductSearchResult,
  CJCategoryFirst,
} from "@/modules/suppliers/cj/types";

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
            price: v.variantSellPrice,
            suggestPrice: v.variantSugSellPrice ?? p.suggestSellPrice ?? 0,
            image: v.variantImage || undefined,
            weight: v.variantWeight ?? p.productWeight ?? 0,
            attributes,
          };
        });

        // If no variants, create a default from product-level data
        if (variants.length === 0) {
          variants.push({
            vid: p.pid,
            name: "Default",
            sku: p.productSku || "",
            price: p.sellPrice,
            suggestPrice: p.suggestSellPrice ?? 0,
            image: p.productImage || undefined,
            weight: p.productWeight ?? 0,
            attributes: {},
          });
        }

        products.push({
          pid: p.pid,
          name: p.productNameEn,
          description: p.description || "",
          images,
          costPrice: p.sellPrice,
          suggestSellPrice: p.suggestSellPrice ?? 0,
          weight: p.productWeight || 0,
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
});
