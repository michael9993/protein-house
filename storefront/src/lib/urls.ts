/**
 * Centralized URL builder for the storefront.
 * All product listing / navigation URLs should go through these helpers.
 *
 * "Relative" functions (no channel prefix) → use with <LinkWithChannel>.
 * "withChannel" → use with bare <Link> or router.push().
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProductsUrlParams {
  categories?: string[];
  collections?: string[];
  brands?: string[];
  sizes?: string[];
  colors?: string[];
  inStock?: boolean;
  onSale?: boolean;
  search?: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  sort?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Encode each slug individually, then comma-join. */
function encodeAndJoin(slugs: string[]): string {
  return slugs.map((s) => encodeURIComponent(s)).join(",");
}

function setList(params: URLSearchParams, key: string, values: string[] | undefined) {
  if (values && values.length > 0) {
    params.set(key, encodeAndJoin(values));
  }
}

function setBool(params: URLSearchParams, key: string, value: boolean | undefined) {
  if (value) params.set(key, "true");
}

function setNum(params: URLSearchParams, key: string, value: number | undefined) {
  if (value !== undefined && value !== null) params.set(key, String(value));
}

// ---------------------------------------------------------------------------
// Products listing URL
// ---------------------------------------------------------------------------

/**
 * Build a /products URL with properly encoded filter params.
 * Returns a relative path suitable for use with LinkWithChannel.
 */
export function buildProductsUrl(params: ProductsUrlParams = {}): string {
  const sp = new URLSearchParams();

  setList(sp, "categories", params.categories);
  setList(sp, "collections", params.collections);
  setList(sp, "brands", params.brands);
  setList(sp, "sizes", params.sizes);
  setList(sp, "colors", params.colors);
  setBool(sp, "inStock", params.inStock);
  setBool(sp, "onSale", params.onSale);
  if (params.search) sp.set("q", params.search);
  setNum(sp, "priceMin", params.priceMin);
  setNum(sp, "priceMax", params.priceMax);
  setNum(sp, "rating", params.rating);
  if (params.sort && params.sort !== "recommended") sp.set("sort", params.sort);

  const qs = sp.toString();
  return qs ? `/products?${qs}` : "/products";
}

// ---------------------------------------------------------------------------
// Single-entity URLs (relative)
// ---------------------------------------------------------------------------

/** Product detail page: "/products/nike-air-max" */
export function buildProductUrl(slug: string): string {
  return `/products/${encodeURIComponent(slug)}`;
}

/** Category filter: "/products?categories=running-shoes" */
export function buildCategoryUrl(slug: string): string {
  return `/products?categories=${encodeURIComponent(slug)}`;
}

/**
 * Category with children: "/products?categories=sneakers,boots"
 * Falls back to parent slug if no children provided.
 */
export function buildCategoryUrlFromChildren(parentSlug: string, childSlugs: string[]): string {
  const slugs = childSlugs.length > 0 ? childSlugs : [parentSlug];
  return `/products?categories=${encodeAndJoin(slugs)}`;
}

/** Collection filter: "/products?collections=summer-sale" */
export function buildCollectionUrl(slug: string): string {
  return `/products?collections=${encodeURIComponent(slug)}`;
}

/** Brand filter: "/products?brands=nike" */
export function buildBrandUrl(slug: string): string {
  return `/products?brands=${encodeURIComponent(slug)}`;
}

/** Search page: "/search?q=running+shoes" */
export function buildSearchUrl(query: string): string {
  return `/search?q=${encodeURIComponent(query)}`;
}

// ---------------------------------------------------------------------------
// Channel prefix
// ---------------------------------------------------------------------------

/**
 * Prepend channel to any relative path.
 * External URLs (http/https) pass through unchanged.
 * Replaces the deprecated `normalizeHref` in utils.ts.
 */
export function withChannel(channel: string, path: string): string {
  if (path.startsWith("http")) return path;
  const prefix = `/${encodeURIComponent(channel)}`;
  if (!path.startsWith("/")) return `${prefix}/${path}`;
  return path.startsWith(prefix) ? path : `${prefix}${path}`;
}
