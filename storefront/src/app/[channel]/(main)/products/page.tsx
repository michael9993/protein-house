import { Suspense } from "react";
import {
  ProductListFilteredDocument,
  CategoriesForFilterDocument,
  CategoriesForHomepageDocument,
  ProductOrderField,
  OrderDirection,
} from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { storeConfig, DEFAULT_FILTERS_TEXT } from "@/config";
import { fetchStorefrontConfig } from "@/lib/storefront-control";
import { ProductFiltersWrapper } from "./ProductFiltersWrapper";
import { QuickFilters } from "./QuickFilters";
import { ScrollToTopButton } from "./ScrollToTopButton";
import { DesignStyles } from "./DesignStyles";
import { ProductsContent } from "./ProductsContent";
import {
  parseFiltersFromURL,
  parseSortFromURL,
  buildGraphQLFilter,
  buildGraphQLSort,
  hasActiveFilters,
  serializeFiltersToURL,
} from "@/lib/filters";
import type { Category } from "@/ui/components/Filters/ProductFilters";
import { fetchSizesForQuickFilters } from "./fetchSizes";
import { fetchColorsForQuickFilters } from "./fetchColors";
import { computePriceRange } from "@/lib/price-utils";
import { getChannelCurrency } from "@/lib/channel-utils";
import { deriveBrandSlug } from "@/components/home/utils";

// ============================================================================
// Metadata
// ============================================================================

export const metadata = {
  title: `All Products | ${storeConfig.store.name}`,
  description: `Browse all products at ${storeConfig.store.name}. Find the best deals and latest arrivals.`,
};

// ============================================================================
// Helper Functions
// ============================================================================

type CategoryEdge = {
  node: {
    id: string;
    name: string;
    slug: string;
    children?: { edges: CategoryEdge[] };
    products?: { totalCount?: number };
  };
};

function collectCategoryIdsBySlug(
  edges: CategoryEdge[] | null | undefined,
  slugSet: Set<string>,
  out: string[]
): void {
  if (!edges) return;
  for (const { node } of edges) {
    if (node.slug && slugSet.has(node.slug.toLowerCase())) out.push(node.id);
    if (node.children?.edges)
      collectCategoryIdsBySlug(node.children.edges, slugSet, out);
  }
}

function buildCategoriesTreeFromFilterEdges(
  edges: CategoryEdge[] | null | undefined
): Category[] {
  if (!edges?.length) return [];
  return edges.map(({ node }) => ({
    id: node.id,
    name: node.name,
    slug: node.slug,
    productCount: (node as { products?: { totalCount?: number } }).products
      ?.totalCount,
    children: node.children?.edges?.length
      ? buildCategoriesTreeFromFilterEdges(node.children.edges)
      : undefined,
  }));
}

function categoryToFilterShape(
  c: Category
): {
  slug: string;
  name: string;
  children?: Array<{
    slug: string;
    name: string;
    children?: Array<{ slug: string; name: string; children?: unknown[] }>;
  }>;
} {
  return {
    slug: c.slug,
    name: c.name,
    children: c.children?.length
      ? c.children.map((ch) => categoryToFilterShape(ch))
      : undefined,
  };
}

async function fetchCategoriesForFilter(
  channel: string
): Promise<{
  categoryIds: (slugs: string[]) => string[];
  categoriesTree: ReturnType<typeof buildCategoriesTreeFromFilterEdges>;
}> {
  const { categories } = await executeGraphQL(CategoriesForFilterDocument, {
    variables: { first: 30, channel },
    revalidate: 30,
  });
  const edges = (categories?.edges ?? []) as CategoryEdge[];
  return {
    categoryIds: (slugs: string[]) => {
      if (slugs.length === 0) return [];
      const out: string[] = [];
      collectCategoryIdsBySlug(
        edges,
        new Set(slugs.map((s) => s.toLowerCase())),
        out
      );
      return out;
    },
    categoriesTree: buildCategoriesTreeFromFilterEdges(edges),
  };
}

async function getCollectionIdsFromSlugs(
  slugs: string[],
  channel: string
): Promise<string[]> {
  if (slugs.length === 0) return [];

  try {
    const { getServerAuthClient } = await import("@/app/config");
    const saleorApiUrl =
      process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL;

    const authClient = await getServerAuthClient();
    const response = await authClient.fetchWithAuth(saleorApiUrl!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query CollectionsForFilter($channel: String!) {
            collections(channel: $channel, first: 100) {
              edges {
                node {
                  id
                  slug
                }
              }
            }
          }
        `,
        variables: { channel },
      }),
      next: { revalidate: 30 },
    });

    const result = (await response.json()) as {
      data?: { collections?: { edges?: any[] } };
    };
    const slugSet = new Set(slugs.map((s) => s.toLowerCase()));

    return (
      result.data?.collections?.edges
        ?.filter(({ node }: { node: any }) =>
          slugSet.has(node.slug.toLowerCase())
        )
        ?.map(({ node }: { node: any }) => node.id) || []
    );
  } catch {
    return [];
  }
}

function mapQuickFilterChild(edge: { node: any }): {
  id: string;
  slug: string;
  name?: string;
  productCount?: number;
  backgroundImage?: { url: string; alt?: string };
  productImages?: Array<{ url: string; alt?: string }>;
  children?: Array<{ id: string; slug: string; name?: string }>;
} {
  const node = edge.node;
  const children =
    node.children?.edges?.map((e: { node: any }) => ({
      id: e.node.id,
      slug: e.node.slug,
      ...(e.node.name ? { name: e.node.name } : {}),
    })) || [];

  // Extract product images from subcategory products (thumbnails + media)
  const productImages =
    node.products?.edges
      ?.flatMap(({ node: product }: { node: any }) => {
        const imgs: Array<{ url: string; alt?: string }> = [];
        if (product.thumbnail?.url) {
          imgs.push({ url: product.thumbnail.url, alt: product.thumbnail.alt || product.name });
        }
        if (product.media?.length > 0) {
          product.media.slice(0, 2).forEach((media: any) => {
            if (media.url && media.url !== product.thumbnail?.url) {
              imgs.push({ url: media.url, alt: media.alt || product.name });
            }
          });
        }
        return imgs;
      })
      .filter(Boolean)
      .slice(0, 8) || [];

  return {
    id: node.id,
    slug: node.slug,
    ...(node.name ? { name: node.name } : {}),
    productCount: node.products?.totalCount ?? undefined,
    ...(node.backgroundImage
      ? { backgroundImage: { url: node.backgroundImage.url, alt: node.backgroundImage.alt } }
      : {}),
    ...(productImages.length > 0 ? { productImages } : {}),
    ...(children.length > 0 ? { children } : {}),
  };
}

async function fetchCategoriesForQuickFilters(channel: string) {
  try {
    const { categories } = await executeGraphQL(CategoriesForHomepageDocument, {
      variables: { channel, first: 10 },
      revalidate: 30,
    });
    return (
      categories?.edges
        ?.map(({ node }: { node: any }) => {
          const productImages =
            node.products?.edges
              ?.flatMap(({ node: product }: { node: any }) => {
                const images: Array<{ url: string; alt?: string }> = [];
                if (product.thumbnail?.url) {
                  images.push({
                    url: product.thumbnail.url,
                    alt: product.thumbnail.alt || product.name,
                  });
                }
                if (product.media?.length > 0) {
                  product.media.slice(0, 2).forEach((media: any) => {
                    if (media.url)
                      images.push({
                        url: media.url,
                        alt: media.alt || product.name,
                      });
                  });
                }
                return images;
              })
              .filter((img: any) => img.url)
              .slice(0, 8) || [];

          return {
            id: node.id,
            name: node.name,
            slug: node.slug,
            productCount: node.products?.totalCount || 0,
            children: node.children?.edges?.map(mapQuickFilterChild) || [],
            backgroundImage: node.backgroundImage
              ? {
                  url: node.backgroundImage.url,
                  alt: node.backgroundImage.alt,
                }
              : undefined,
            productImages:
              productImages.length > 0 ? productImages : undefined,
          };
        })
        .filter((cat: any) => (cat.productCount ?? 0) > 0) || []
    );
  } catch {
    return [];
  }
}

async function fetchCollectionsForQuickFilters(channel: string) {
  try {
    const { getServerAuthClient } = await import("@/app/config");
    const saleorApiUrl =
      process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL;

    const authClient = await getServerAuthClient();
    const response = await authClient.fetchWithAuth(saleorApiUrl!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query CollectionsForQuickFilters($channel: String!) {
            collections(channel: $channel, first: 10) {
              edges {
                node {
                  id
                  name
                  slug
                  backgroundImage {
                    url
                    alt
                  }
                  products(first: 12) {
                    totalCount
                    edges {
                      node {
                        id
                        name
                        thumbnail {
                          url
                          alt
                        }
                        media {
                          url
                          alt
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { channel },
      }),
      next: { revalidate: 30 },
    });

    const result = (await response.json()) as {
      data?: { collections?: { edges?: any[] } };
    };
    return (
      result.data?.collections?.edges
        ?.map(({ node }: { node: any }) => {
          const productImages =
            node.products?.edges
              ?.flatMap(({ node: product }: { node: any }) => {
                const images: Array<{ url: string; alt?: string }> = [];
                if (product.thumbnail?.url) {
                  images.push({
                    url: product.thumbnail.url,
                    alt: product.thumbnail.alt || product.name,
                  });
                }
                if (product.media?.length > 0) {
                  product.media.slice(0, 2).forEach((media: any) => {
                    if (media.url)
                      images.push({
                        url: media.url,
                        alt: media.alt || product.name,
                      });
                  });
                }
                return images;
              })
              .filter((img: any) => img.url)
              .slice(0, 8) || [];

          return {
            id: node.id,
            name: node.name,
            slug: node.slug,
            productCount: node.products?.totalCount || 0,
            backgroundImage: node.backgroundImage
              ? {
                  url: node.backgroundImage.url,
                  alt: node.backgroundImage.alt,
                }
              : undefined,
            productImages:
              productImages.length > 0 ? productImages : undefined,
          };
        })
        .filter((col: any) => col.productCount > 0) || []
    );
  } catch {
    return [];
  }
}

async function fetchBrandsForQuickFilters(channel: string): Promise<{
  brands: Array<{
    id: string;
    name: string;
    slug: string;
    productCount: number;
    backgroundImage?: { url: string; alt?: string };
    productImages?: Array<{ url: string; alt?: string }>;
  }>;
  attributeSlug: string | null;
  brandSlugMap: Record<string, string[]>;
  reverseBrandSlugMap: Record<string, string>;
}> {
  try {
    const apiUrl =
      process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL;
    if (!apiUrl) return { brands: [], attributeSlug: null, brandSlugMap: {}, reverseBrandSlugMap: {} };
    return await fetchBrandsFromAttributes(apiUrl, channel);
  } catch (error) {
    console.warn("Failed to fetch brands:", error);
    return { brands: [], attributeSlug: null, brandSlugMap: {}, reverseBrandSlugMap: {} };
  }
}

async function fetchBrandsFromAttributes(
  apiUrl: string,
  channel: string
): Promise<{
  brands: Array<{
    id: string;
    name: string;
    slug: string;
    productCount: number;
    backgroundImage?: { url: string; alt?: string };
    productImages?: Array<{ url: string; alt?: string }>;
  }>;
  attributeSlug: string | null;
  brandSlugMap: Record<string, string[]>;
  reverseBrandSlugMap: Record<string, string>;
}> {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query ProductsForBrands($channel: String!) {
            products(first: 100, channel: $channel) {
              edges {
                cursor
                node {
                  id
                  name
                  thumbnail {
                    url
                    alt
                  }
                  media {
                    url
                    alt
                  }
                  attributes {
                    attribute {
                      id
                      name
                      slug
                    }
                    values {
                      id
                      name
                      slug
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { channel },
      }),
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      return { brands: [], attributeSlug: null, brandSlugMap: {}, reverseBrandSlugMap: {} };
    }

    const responseData = (await response.json()) as { data?: any };
    const { data } = responseData;

    if (!data?.products?.edges || data.products.edges.length === 0) {
      return { brands: [], attributeSlug: null, brandSlugMap: {}, reverseBrandSlugMap: {} };
    }

    const brandsMap = new Map<
      string,
      {
        name: string;
        slug: string;
        allSlugs: Set<string>;
        count: number;
        productImages: Map<string, { url: string; alt?: string }>;
      }
    >();
    let detectedAttributeSlug: string | null = null;

    data.products.edges.forEach((edge: any) => {
      const product = edge.node;
      if (!product.attributes || !Array.isArray(product.attributes)) return;

      const brandAttr = product.attributes.find((attr: any) => {
        const attrName = attr?.attribute?.name?.toLowerCase()?.trim();
        const attrSlug = attr?.attribute?.slug?.toLowerCase()?.trim();
        return (
          attrName === "brand" ||
          attrSlug === "brand" ||
          attrSlug === "manufacturer"
        );
      });

      if (brandAttr) {
        if (!detectedAttributeSlug && brandAttr.attribute?.slug) {
          detectedAttributeSlug = brandAttr.attribute.slug;
        }

        const brandValues = brandAttr.values || [];
        if (brandValues.length > 0) {
          const productImages: Array<{ url: string; alt?: string }> = [];
          if (product.thumbnail?.url) {
            productImages.push({
              url: product.thumbnail.url,
              alt: product.thumbnail.alt || product.name,
            });
          }
          if (product.media?.length > 0) {
            product.media.slice(0, 2).forEach((media: any) => {
              if (
                media.url &&
                !productImages.some((img) => img.url === media.url)
              ) {
                productImages.push({
                  url: media.url,
                  alt: media.alt || product.name,
                });
              }
            });
          }

          brandValues.forEach((value: any) => {
            const brandName = value?.name || value?.value;
            if (brandName && typeof brandName === "string" && brandName.trim()) {
              // Dedup by normalized name (not slug) to handle Saleor auto-incremented slugs
              const dedupKey = brandName.toLowerCase().trim();
              // Canonical slug is always name-derived (human-readable URL slug)
              const canonicalSlug = deriveBrandSlug(brandName);
              // Saleor's actual attribute value slug (for GraphQL filter queries)
              const saleorSlug = value.slug;

              if (dedupKey) {
                if (!brandsMap.has(dedupKey)) {
                  brandsMap.set(dedupKey, {
                    name: brandName.trim(),
                    slug: canonicalSlug,
                    allSlugs: new Set<string>(),
                    count: 0,
                    productImages: new Map(),
                  });
                }
                const brandData = brandsMap.get(dedupKey)!;
                brandData.count++;
                // Add Saleor's attribute value slug for GraphQL expansion
                if (saleorSlug) brandData.allSlugs.add(saleorSlug);

                productImages.forEach((img) => {
                  if (img.url && !brandData.productImages.has(img.url)) {
                    brandData.productImages.set(img.url, img);
                  }
                });
              }
            }
          });
        }
      }
    });

    const brands = Array.from(brandsMap.values())
      .map((brand) => {
        const productImagesArray = Array.from(brand.productImages.values())
          .filter((img) => img.url)
          .slice(0, 8);

        const backgroundImage =
          productImagesArray.length > 0
            ? {
                url: productImagesArray[0].url,
                alt: productImagesArray[0].alt || brand.name,
              }
            : undefined;

        return {
          id: `brand-${brand.slug}`,
          name: brand.name,
          slug: brand.slug,
          allSlugs: Array.from(brand.allSlugs),
          productCount: brand.count,
          backgroundImage,
          productImages:
            productImagesArray.length > 0 ? productImagesArray : undefined,
        };
      })
      .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
      .slice(0, 10);

    // Build slug expansion map: canonical slug → all Saleor attribute value slugs
    const brandSlugMap: Record<string, string[]> = {};
    // Build reverse map: any Saleor slug → canonical slug (for old URL backward compat)
    const reverseBrandSlugMap: Record<string, string> = {};
    brands.forEach((b) => {
      brandSlugMap[b.slug] = b.allSlugs;
      b.allSlugs.forEach((saleorSlug: string) => {
        reverseBrandSlugMap[saleorSlug] = b.slug;
      });
    });

    return {
      brands,
      attributeSlug: detectedAttributeSlug || "brand",
      brandSlugMap,
      reverseBrandSlugMap,
    };
  } catch (error) {
    console.warn("Failed to fetch brands from attributes:", error);
    return { brands: [], attributeSlug: "brand", brandSlugMap: {}, reverseBrandSlugMap: {} };
  }
}

// ============================================================================
// Page Component
// ============================================================================

export default async function Page(props: {
  params: Promise<{ channel: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const { channel } = params;

  const filters = parseFiltersFromURL(searchParams);
  const sortValue = parseSortFromURL(searchParams);

  // Href to clear search and keep other filters
  const curParams = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    const s = Array.isArray(v) ? v[0] : v;
    if (s != null && String(s) !== "") curParams.set(k, String(s));
  }
  const clearSearchParams = serializeFiltersToURL(
    { search: undefined },
    curParams
  );
  const clearSearchHref = filters.search
    ? `/${channel}/products${clearSearchParams.toString() ? `?${clearSearchParams.toString()}` : ""}`
    : null;

  // Handle special sort options
  let adjustedFilters = { ...filters };
  if (sortValue && (sortValue as any) === "sale") {
    adjustedFilters.onSale = true;
  }

  const sortVariables = buildGraphQLSort(sortValue);

  // Fetch brands, sizes, and colors first
  const [brandsResult, sizesResult, colorsResult] = await Promise.all([
    fetchBrandsForQuickFilters(channel),
    fetchSizesForQuickFilters(channel),
    fetchColorsForQuickFilters(channel),
  ]);
  const brandsForQuickFilters = brandsResult.brands;
  const brandAttributeSlug = brandsResult.attributeSlug;
  const brandSlugMap = brandsResult.brandSlugMap || {};
  const reverseBrandSlugMap = brandsResult.reverseBrandSlugMap || {};
  const sizeAttributeSlug = sizesResult.attributeSlug || "size";
  const colorAttributeSlug = colorsResult.attributeSlug || "color";

  // Normalize URL brand slugs and expand to Saleor attribute value slugs:
  // 1. Lowercase for case-insensitive matching (?brands=Asics → asics)
  // 2. Reverse-map old Saleor slugs to canonical (?brands=224_13 → asics)
  // 3. Expand canonical slugs to all Saleor slugs for GraphQL query
  if (adjustedFilters.brands.length > 0) {
    const canonicalBrands = adjustedFilters.brands.map((slug) => {
      const lower = slug.toLowerCase();
      return reverseBrandSlugMap[lower] || reverseBrandSlugMap[slug] || lower;
    });
    const uniqueCanonical = [...new Set(canonicalBrands)];

    if (Object.keys(brandSlugMap).length > 0) {
      adjustedFilters = {
        ...adjustedFilters,
        brands: uniqueCanonical.flatMap(
          (slug) => brandSlugMap[slug] || [slug]
        ),
      };
    } else {
      adjustedFilters = { ...adjustedFilters, brands: uniqueCanonical };
    }
  }

  const [categoriesForFilterResult, collectionIds, categoriesForQuickFilters] =
    await Promise.all([
      fetchCategoriesForFilter(channel),
      getCollectionIdsFromSlugs(adjustedFilters.collections, channel),
      fetchCategoriesForQuickFilters(channel),
    ]);
  const categoryIds = categoriesForFilterResult.categoryIds(
    adjustedFilters.categories
  );
  const categoriesForFilter = categoriesForFilterResult.categoriesTree;

  // Build filter with correct attribute slugs
  const graphqlFilter = buildGraphQLFilter({
    filters: adjustedFilters,
    categoryIds,
    collectionIds,
    brandAttributeSlug: brandAttributeSlug ? brandAttributeSlug : undefined,
    sizeAttributeSlug: sizeAttributeSlug ? sizeAttributeSlug : undefined,
    colorAttributeSlug: colorAttributeSlug ? colorAttributeSlug : undefined,
  });

  const [
    { products },
    collectionsForQuickFilters,
    { products: cheapestProducts },
    { products: pricestProducts },
  ] = await Promise.all([
    executeGraphQL(ProductListFilteredDocument, {
      variables: {
        first: 24,
        channel,
        sortBy: sortVariables,
        filter: graphqlFilter,
        search: adjustedFilters.search || undefined,
      },
      revalidate: 10,
    }),
    fetchCollectionsForQuickFilters(channel),
    // Cheapest product — GLOBAL (no filter) so bounds stay stable
    // regardless of which categories/brands/etc the user has selected
    executeGraphQL(ProductListFilteredDocument, {
      variables: {
        first: 1,
        channel,
        sortBy: { field: ProductOrderField.MinimalPrice, direction: OrderDirection.Asc },
      },
      revalidate: 120,
    }),
    // Most expensive product — GLOBAL (no filter) for stable max bound
    executeGraphQL(ProductListFilteredDocument, {
      variables: {
        first: 1,
        channel,
        sortBy: { field: ProductOrderField.MinimalPrice, direction: OrderDirection.Desc },
      },
      revalidate: 120,
    }),
  ]);

  const productCount = products?.totalCount || 0;
  const initialProducts = products?.edges.map(({ node }) => node) || [];
  const hasNextPage = products?.pageInfo.hasNextPage || false;
  const endCursor = products?.pageInfo.endCursor || null;

  // Compute stable price bounds from the two edge-price queries (not from filtered results)
  const allBoundProducts = [
    ...(cheapestProducts?.edges.map(({ node }) => node) || []),
    ...(pricestProducts?.edges.map(({ node }) => node) || []),
  ];
  const {
    minAvailablePrice,
    maxAvailablePrice,
    currencyCode: productsCurrencyCode,
  } = computePriceRange(allBoundProducts);

  let currencyCode = productsCurrencyCode;
  if (!currencyCode && channel) {
    try {
      const channelCurrency = await getChannelCurrency(channel);
      currencyCode = channelCurrency || "";
    } catch (error) {
      console.warn("Failed to fetch channel currency:", error);
    }
  }

  const activeFilters = hasActiveFilters(filters);
  const hasQuickFilters =
    categoriesForQuickFilters.length > 0 ||
    collectionsForQuickFilters.length > 0 ||
    brandsForQuickFilters.length > 0;

  // Fetch dynamic config from storefront-control
  const dynamicConfig = await fetchStorefrontConfig(channel);
  const { branding } = dynamicConfig;
  const filtersText =
    dynamicConfig.content?.filters ||
    storeConfig.content?.filters ||
    DEFAULT_FILTERS_TEXT;

  return (
    <>
      <DesignStyles />
      <div className="min-h-screen bg-white">
        <div className="flex">
          {/* Left Sidebar - Minimal Layout */}
          <aside className="hidden lg:block lg:w-64 lg:flex-shrink-0 lg:border-r lg:border-neutral-100 xl:w-72">
            <div className="sticky top-0 h-screen overflow-y-auto">
              {/* Sidebar Header - Minimal */}
              <div className="border-b border-neutral-100 bg-neutral-50/50 px-5 py-6">
                <h1 className="mb-2 text-xl font-medium tracking-tight text-neutral-800">
                  {filtersText.discoverProducts}
                </h1>
                <p className="text-sm text-neutral-500">
                  {productCount} {filtersText.itemsAvailable}
                </p>
              </div>

              {/* Filters */}
              <div className="px-5 py-5">
                <Suspense fallback={<FiltersSkeleton />}>
                  <ProductFiltersWrapper
                    channel={channel}
                    initialCategories={categoriesForFilter}
                    initialBrands={brandsForQuickFilters}
                    initialSizes={sizesResult.sizes}
                    initialColors={colorsResult.colors}
                    minPrice={minAvailablePrice}
                    maxPrice={maxAvailablePrice}
                    currencyCode={currencyCode}
                  />
                </Suspense>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="min-w-0 flex-1">
            {/* Quick Filters Section - Minimal Design */}
            {hasQuickFilters && (
              <div className="border-b border-neutral-100 bg-neutral-50/50 px-4 sm:px-6 lg:px-8">
                <QuickFilters
                  categories={categoriesForQuickFilters}
                  collections={collectionsForQuickFilters}
                  brands={brandsForQuickFilters}
                  title={filtersText.checkOutOurProducts}
                />
              </div>
            )}

            {/* Products Content - Unified header with display mode toggle */}
            <div className="px-4 py-6 sm:px-6 lg:px-8">
              <ProductsContent
                channel={channel}
                filters={filters}
                productCount={productCount}
                clearSearchHref={clearSearchHref}
                initialProducts={initialProducts}
                hasNextPage={hasNextPage}
                endCursor={endCursor}
                sortBy={sortVariables}
                activeFilters={activeFilters}
                categoriesForFilter={categoriesForFilter}
                brandsForQuickFilters={brandsForQuickFilters}
                sizesForFilters={sizesResult.sizes}
                colorsForFilters={colorsResult.colors}
                collectionsForQuickFilters={collectionsForQuickFilters}
              />
            </div>
          </div>
        </div>
        {/* Mobile scroll-to-top */}
        <ScrollToTopButton />
      </div>
    </>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function FiltersSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 rounded-lg bg-neutral-200" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 rounded bg-neutral-200" />
        ))}
      </div>
    </div>
  );
}
