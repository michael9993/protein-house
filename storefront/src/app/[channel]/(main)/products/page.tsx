import { Suspense } from "react";
import {
  ProductListFilteredDocument,
  CategoriesForFilterDocument,
  CategoriesForHomepageDocument,
  ProductOrderField,
  OrderDirection,
} from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getLanguageCodeForChannel } from "@/lib/language";
import { storeConfig, DEFAULT_FILTERS_TEXT } from "@/config";
import { fetchStorefrontConfig } from "@/lib/storefront-control";
import { enhanceSearchQuery } from "@/lib/search/query-enhancer";
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
import { TrackSearch } from "./TrackSearch";

// ============================================================================
// Metadata
// ============================================================================

export const metadata = {
  title: "Products",
  description: `Browse products at ${storeConfig.store.name}. Find the best deals and latest arrivals.`,
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
    name: (node as any).translation?.name || node.name,
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
  const languageCode = getLanguageCodeForChannel(channel);
  const { categories } = await executeGraphQL(CategoriesForFilterDocument, {
    variables: { first: 30, channel, languageCode },
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
      ...(e.node.name ? { name: (e.node as any).translation?.name || e.node.name } : {}),
    })) || [];

  // Extract product images from subcategory products (thumbnails + media)
  const productImages =
    node.products?.edges
      ?.flatMap(({ node: product }: { node: any }) => {
        const imgs: Array<{ url: string; alt?: string }> = [];
        if (product.thumbnail?.url) {
          imgs.push({ url: product.thumbnail.url, alt: product.thumbnail.alt || product.translation?.name || product.name });
        }
        if (product.media?.length > 0) {
          product.media.slice(0, 2).forEach((media: any) => {
            if (media.url && media.url !== product.thumbnail?.url) {
              imgs.push({ url: media.url, alt: media.alt || product.translation?.name || product.name });
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
    ...(node.name ? { name: (node as any).translation?.name || node.name } : {}),
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
    const languageCode = getLanguageCodeForChannel(channel);
    const { categories } = await executeGraphQL(CategoriesForHomepageDocument, {
      variables: { channel, first: 10, languageCode },
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
                    alt: product.thumbnail.alt || product.translation?.name || product.name,
                  });
                }
                if (product.media?.length > 0) {
                  product.media.slice(0, 2).forEach((media: any) => {
                    if (media.url)
                      images.push({
                        url: media.url,
                        alt: media.alt || product.translation?.name || product.name,
                      });
                  });
                }
                return images;
              })
              .filter((img: any) => img.url)
              .slice(0, 8) || [];

          return {
            id: node.id,
            name: node.translation?.name || node.name,
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
          query CollectionsForQuickFilters($channel: String!, $languageCode: LanguageCodeEnum!) {
            collections(channel: $channel, first: 10) {
              edges {
                node {
                  id
                  name
                  translation(languageCode: $languageCode) { name }
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
        variables: { channel, languageCode: getLanguageCodeForChannel(channel) },
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
                    alt: product.thumbnail.alt || product.translation?.name || product.name,
                  });
                }
                if (product.media?.length > 0) {
                  product.media.slice(0, 2).forEach((media: any) => {
                    if (media.url)
                      images.push({
                        url: media.url,
                        alt: media.alt || product.translation?.name || product.name,
                      });
                  });
                }
                return images;
              })
              .filter((img: any) => img.url)
              .slice(0, 8) || [];

          return {
            id: node.id,
            name: node.translation?.name || node.name,
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
    const languageCode = getLanguageCodeForChannel(channel);

    // Two-step approach:
    // 1. Query the brand attribute directly to get ALL brand values (not limited by product count)
    // 2. Query products to get images and counts per brand
    const [attrResponse, productsResponse] = await Promise.all([
      fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query BrandAttributeChoices($languageCode: LanguageCodeEnum!) {
              attributes(filter: { slugs: ["brand"] }, first: 1) {
                edges {
                  node {
                    id
                    slug
                    choices(first: 100) {
                      edges {
                        node {
                          id
                          name
                          slug
                          translation(languageCode: $languageCode) { name }
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
          variables: { languageCode },
        }),
        next: { revalidate: 30 },
      }),
      fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query ProductsForBrandImages($channel: String!, $languageCode: LanguageCodeEnum!) {
              products(first: 250, channel: $channel) {
                edges {
                  node {
                    id
                    name
                    translation(languageCode: $languageCode) { name }
                    thumbnail { url alt }
                    media { url alt }
                    attributes {
                      attribute { slug }
                      values { slug }
                    }
                  }
                }
              }
            }
          `,
          variables: { channel, languageCode },
        }),
        next: { revalidate: 30 },
      }),
    ]);

    if (!attrResponse.ok) {
      return { brands: [], attributeSlug: null, brandSlugMap: {}, reverseBrandSlugMap: {} };
    }

    const attrData = (await attrResponse.json()) as { data?: any };
    const attrNode = attrData.data?.attributes?.edges?.[0]?.node;
    const detectedAttributeSlug: string | null = attrNode?.slug || null;
    const choices = attrNode?.choices?.edges || [];

    if (choices.length === 0) {
      return { brands: [], attributeSlug: detectedAttributeSlug, brandSlugMap: {}, reverseBrandSlugMap: {} };
    }

    // Build brand map from attribute choices (source of truth for ALL brands)
    const brandsMap = new Map<
      string,
      {
        id: string;
        name: string;
        slug: string;
        canonicalSlug: string;
        saleorSlugs: Set<string>;
        count: number;
        productImages: Map<string, { url: string; alt?: string }>;
      }
    >();

    for (const edge of choices) {
      const value = edge.node;
      const brandName = (value?.translation?.name || value?.name)?.trim();
      if (!brandName) continue;

      const dedupKey = brandName.toLowerCase();
      const canonicalSlug = deriveBrandSlug(brandName);
      const saleorSlug = value.slug;

      if (!brandsMap.has(dedupKey)) {
        brandsMap.set(dedupKey, {
          id: value.id || `brand-${canonicalSlug}`,
          name: brandName,
          slug: canonicalSlug,
          canonicalSlug,
          saleorSlugs: new Set<string>(),
          count: 0,
          productImages: new Map(),
        });
      }
      const brandData = brandsMap.get(dedupKey)!;
      if (saleorSlug) brandData.saleorSlugs.add(saleorSlug);
    }

    // Enrich with product images and counts from products query
    if (productsResponse.ok) {
      const productsData = (await productsResponse.json()) as { data?: any };
      const products = productsData.data?.products?.edges || [];

      // Build saleor slug → dedupKey reverse lookup
      const saleorSlugToDedupKey = new Map<string, string>();
      for (const [dedupKey, brandData] of brandsMap) {
        for (const ss of brandData.saleorSlugs) {
          saleorSlugToDedupKey.set(ss, dedupKey);
        }
      }

      for (const prodEdge of products) {
        const product = prodEdge.node;
        if (!product.attributes) continue;

        const brandAttr = product.attributes.find((attr: any) =>
          attr?.attribute?.slug === detectedAttributeSlug ||
          attr?.attribute?.slug === "brand"
        );
        if (!brandAttr?.values?.length) continue;

        for (const val of brandAttr.values) {
          const dedupKey = saleorSlugToDedupKey.get(val.slug);
          if (!dedupKey) continue;

          const brandData = brandsMap.get(dedupKey);
          if (!brandData) continue;

          brandData.count++;
          // Collect product images
          if (product.thumbnail?.url && !brandData.productImages.has(product.thumbnail.url)) {
            brandData.productImages.set(product.thumbnail.url, {
              url: product.thumbnail.url,
              alt: product.thumbnail.alt || product.translation?.name || product.name,
            });
          }
          if (product.media?.length > 0) {
            for (const media of product.media.slice(0, 2)) {
              if (media.url && !brandData.productImages.has(media.url)) {
                brandData.productImages.set(media.url, {
                  url: media.url,
                  alt: media.alt || product.translation?.name || product.name,
                });
              }
            }
          }
        }
      }
    }

    const brands = Array.from(brandsMap.values())
      .map((brand) => {
        const productImagesArray = Array.from(brand.productImages.values())
          .filter((img) => img.url)
          .slice(0, 8);

        const backgroundImage =
          productImagesArray.length > 0
            ? { url: productImagesArray[0].url, alt: productImagesArray[0].alt || brand.name }
            : undefined;

        return {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          allSlugs: Array.from(brand.saleorSlugs),
          productCount: brand.count,
          backgroundImage,
          productImages: productImagesArray.length > 0 ? productImagesArray : undefined,
        };
      })
      .filter((b) => b.productCount > 0)
      .sort((a, b) => (b.productCount || 0) - (a.productCount || 0));

    // Build slug expansion map: canonical slug → all Saleor attribute value slugs
    const brandSlugMap: Record<string, string[]> = {};
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
  const languageCode = getLanguageCodeForChannel(channel);

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
    ? `/products${clearSearchParams.toString() ? `?${clearSearchParams.toString()}` : ""}`
    : null;

  // Enhance search query with fuzzy matching, typo correction, and category detection
  let enhancedSearch: { corrected: string; categorySlug?: string; collectionSlug?: string; alternatives: string[] } | null = null;
  if (filters.search) {
    enhancedSearch = await enhanceSearchQuery(filters.search, channel, languageCode);
  }

  // Handle special sort options
  let adjustedFilters = { ...filters };
  if (sortValue && (sortValue as any) === "sale") {
    adjustedFilters.onSale = true;
  }
  // Apply the enhanced/corrected search term
  if (enhancedSearch && enhancedSearch.corrected !== filters.search) {
    adjustedFilters = { ...adjustedFilters, search: enhancedSearch.corrected };
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

  const [categoriesForFilterResult, collectionIds, saleCollectionIds, categoriesForQuickFilters] =
    await Promise.all([
      fetchCategoriesForFilter(channel),
      getCollectionIdsFromSlugs(adjustedFilters.collections, channel),
      // Resolve "sale" collection for onSale filter
      adjustedFilters.onSale ? getCollectionIdsFromSlugs(["sale"], channel) : Promise.resolve([]),
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
    saleCollectionIds,
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
        languageCode,
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
        languageCode,
        sortBy: { field: ProductOrderField.MinimalPrice, direction: OrderDirection.Asc },
      },
      revalidate: 120,
    }),
    // Most expensive product — GLOBAL (no filter) for stable max bound
    executeGraphQL(ProductListFilteredDocument, {
      variables: {
        first: 1,
        channel,
        languageCode,
        sortBy: { field: ProductOrderField.MinimalPrice, direction: OrderDirection.Desc },
      },
      revalidate: 120,
    }),
  ]);

  let productCount = products?.totalCount || 0;
  let initialProducts = products?.edges.map(({ node }) => node) || [];
  let hasNextPage = products?.pageInfo.hasNextPage || false;
  let endCursor = products?.pageInfo.endCursor || null;

  // Smart fallback: if text search returned 0 results and the query enhancer
  // detected a matching category or collection, retry with those as filters.
  // This makes "pet nests" find products in the "Pet Nests" category even though
  // Saleor's text search only matches product names/descriptions.
  if (productCount === 0 && adjustedFilters.search && enhancedSearch) {
    const fallbackCategorySlugs = enhancedSearch.categorySlug ? [enhancedSearch.categorySlug] : [];
    const fallbackCollectionSlugs = enhancedSearch.collectionSlug ? [enhancedSearch.collectionSlug] : [];
    const hasSmartFallback = fallbackCategorySlugs.length > 0 || fallbackCollectionSlugs.length > 0;

    // Also try alternatives (stemmed/fuzzy variants) as text search
    let altProducts: typeof products = null;
    if (!hasSmartFallback && enhancedSearch.alternatives.length > 0) {
      for (const alt of enhancedSearch.alternatives) {
        if (alt === adjustedFilters.search) continue;
        const altResult = await executeGraphQL(ProductListFilteredDocument, {
          variables: {
            first: 24, channel, languageCode, sortBy: sortVariables,
            filter: graphqlFilter, search: alt,
          },
          revalidate: 10,
        });
        if ((altResult.products?.totalCount || 0) > 0) {
          altProducts = altResult.products;
          break;
        }
      }
    }

    if (hasSmartFallback) {
      // Retry with category/collection filters instead of text search
      const fallbackCategoryIds = categoriesForFilterResult.categoryIds(fallbackCategorySlugs);
      const fallbackCollectionIds = fallbackCollectionSlugs.length > 0
        ? await getCollectionIdsFromSlugs(fallbackCollectionSlugs, channel)
        : [];

      const fallbackFilter = buildGraphQLFilter({
        filters: { ...adjustedFilters, search: undefined, categories: fallbackCategorySlugs, collections: fallbackCollectionSlugs },
        categoryIds: [...categoryIds, ...fallbackCategoryIds],
        collectionIds: [...collectionIds, ...fallbackCollectionIds],
        saleCollectionIds,
        brandAttributeSlug: brandAttributeSlug ? brandAttributeSlug : undefined,
        sizeAttributeSlug: sizeAttributeSlug ? sizeAttributeSlug : undefined,
        colorAttributeSlug: colorAttributeSlug ? colorAttributeSlug : undefined,
      });

      const fallbackResult = await executeGraphQL(ProductListFilteredDocument, {
        variables: {
          first: 24, channel, languageCode, sortBy: sortVariables,
          filter: fallbackFilter,
        },
        revalidate: 10,
      });
      if ((fallbackResult.products?.totalCount || 0) > 0) {
        productCount = fallbackResult.products?.totalCount || 0;
        initialProducts = fallbackResult.products?.edges.map(({ node }) => node) || [];
        hasNextPage = fallbackResult.products?.pageInfo.hasNextPage || false;
        endCursor = fallbackResult.products?.pageInfo.endCursor || null;
      }
    } else if (altProducts) {
      productCount = altProducts.totalCount || 0;
      initialProducts = altProducts.edges.map(({ node }) => node) || [];
      hasNextPage = altProducts.pageInfo.hasNextPage || false;
      endCursor = altProducts.pageInfo.endCursor || null;
    }
  }

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
    } catch {
      // Currency fetch is best-effort
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
      <TrackSearch query={filters.search} />
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
