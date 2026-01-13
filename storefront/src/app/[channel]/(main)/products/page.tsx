import { Suspense } from "react";
import { ProductListFilteredDocument, CategoriesForFilterDocument, CategoriesForHomepageDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { storeConfig } from "@/config";
import { SortBy } from "@/ui/components/SortBy";
import { ProductFiltersWrapper } from "./ProductFiltersWrapper";
import { ProductsGrid } from "./ProductsGrid";
import { QuickFilters } from "./QuickFilters";
import { ActiveFiltersTags } from "./ActiveFiltersTags";
import { ProductSearch } from "./ProductSearch";
import {
  parseFiltersFromURL,
  parseSortFromURL,
  buildGraphQLFilter,
  buildGraphQLSort,
  hasActiveFilters,
} from "@/lib/filters";
import { fetchSizesForQuickFilters } from "./fetchSizes";
import { fetchColorsForQuickFilters } from "./fetchColors";

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

async function getCategoryIdsFromSlugs(slugs: string[], channel: string): Promise<string[]> {
	if (slugs.length === 0) return [];
	
	const { categories } = await executeGraphQL(CategoriesForFilterDocument, {
		variables: { first: 100, channel },
    revalidate: 300,
	});
	
	const categoryIds: string[] = [];
	const slugSet = new Set(slugs.map(s => s.toLowerCase()));
	
	categories?.edges?.forEach(edge => {
		const cat = edge.node;
		if (slugSet.has(cat.slug.toLowerCase())) {
			categoryIds.push(cat.id);
		}
		cat.children?.edges?.forEach(childEdge => {
			const child = childEdge.node;
			if (slugSet.has(child.slug.toLowerCase())) {
				categoryIds.push(child.id);
			}
		});
	});
	
	return categoryIds;
}

async function getCollectionIdsFromSlugs(slugs: string[], channel: string): Promise<string[]> {
	if (slugs.length === 0) return [];
	
	try {
		const { getServerAuthClient } = await import("@/app/config");
		const saleorApiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL;
		
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
			next: { revalidate: 300 },
		});
		
		const result = (await response.json()) as { data?: { collections?: { edges?: any[] } } };
		const slugSet = new Set(slugs.map(s => s.toLowerCase()));
		
		return result.data?.collections?.edges
			?.filter(({ node }: { node: any }) => slugSet.has(node.slug.toLowerCase()))
			?.map(({ node }: { node: any }) => node.id) || [];
	} catch {
		return [];
	}
}

/**
 * Fetch categories for quick filters
 */
async function fetchCategoriesForQuickFilters(channel: string) {
  try {
    const { categories } = await executeGraphQL(CategoriesForHomepageDocument, {
      variables: { channel, first: 10 },
      revalidate: 300,
    });
    return categories?.edges?.map(({ node }: { node: any }) => {
      const productImages = node.products?.edges
        ?.flatMap(({ node: product }: { node: any }) => {
          const images: Array<{ url: string; alt?: string }> = [];
          if (product.thumbnail?.url) {
            images.push({ url: product.thumbnail.url, alt: product.thumbnail.alt || product.name });
          }
          if (product.media?.length > 0) {
            product.media.slice(0, 2).forEach((media: any) => {
              if (media.url) images.push({ url: media.url, alt: media.alt || product.name });
            });
          }
          return images;
        })
        .filter((img: any) => img.url)
        .slice(0, 4) || [];

      return {
        id: node.id,
        name: node.name,
        slug: node.slug,
        productCount: node.products?.totalCount || 0,
        children: node.children?.edges?.map(({ node: child }: { node: any }) => ({
          id: child.id,
          slug: child.slug,
        })) || [],
        backgroundImage: node.backgroundImage ? {
          url: node.backgroundImage.url,
          alt: node.backgroundImage.alt,
        } : undefined,
        productImages: productImages.length > 0 ? productImages : undefined,
      };
    }).filter((cat: any) => cat.productCount > 0) || [];
  } catch {
    return [];
  }
}

/**
 * Fetch collections for quick filters
 */
async function fetchCollectionsForQuickFilters(channel: string) {
  try {
    const { getServerAuthClient } = await import("@/app/config");
    const saleorApiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL;
    
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
                  products(first: 4) {
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
      next: { revalidate: 300 },
    });
    
    const result = (await response.json()) as { data?: { collections?: { edges?: any[] } } };
    return result.data?.collections?.edges
      ?.map(({ node }: { node: any }) => {
        const productImages = node.products?.edges
          ?.flatMap(({ node: product }: { node: any }) => {
            const images: Array<{ url: string; alt?: string }> = [];
            if (product.thumbnail?.url) {
              images.push({ url: product.thumbnail.url, alt: product.thumbnail.alt || product.name });
            }
            if (product.media?.length > 0) {
              product.media.slice(0, 2).forEach((media: any) => {
                if (media.url) images.push({ url: media.url, alt: media.alt || product.name });
              });
            }
            return images;
          })
          .filter((img: any) => img.url)
          .slice(0, 4) || [];

        return {
          id: node.id,
          name: node.name,
          slug: node.slug,
          productCount: node.products?.totalCount || 0,
          backgroundImage: node.backgroundImage ? {
            url: node.backgroundImage.url,
            alt: node.backgroundImage.alt,
          } : undefined,
          productImages: productImages.length > 0 ? productImages : undefined,
        };
      })
      .filter((col: any) => col.productCount > 0) || [];
  } catch {
    return [];
  }
}

/**
 * Fetch brands for quick filters
 */
async function fetchBrandsForQuickFilters(channel: string): Promise<{
  brands: Array<{ id: string; name: string; slug: string; productCount: number }>;
  attributeSlug: string | null;
}> {
  try {
    const apiUrl = process.env.SALEOR_API_URL || process.env.NEXT_PUBLIC_SALEOR_API_URL;
    if (!apiUrl) return { brands: [], attributeSlug: null };
    return await fetchBrandsFromAttributes(apiUrl, channel);
  } catch (error) {
    console.warn("Failed to fetch brands:", error);
    return { brands: [], attributeSlug: null };
  }
}

/**
 * Fallback: Extract brands from product attributes
 */
async function fetchBrandsFromAttributes(apiUrl: string, channel: string): Promise<{
  brands: Array<{ id: string; name: string; slug: string; productCount: number }>;
  attributeSlug: string | null;
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
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return { brands: [], attributeSlug: null };
    }

    const responseData = (await response.json()) as { data?: any };
    const { data } = responseData;
    
    if (!data?.products?.edges || data.products.edges.length === 0) {
      return { brands: [], attributeSlug: null };
    }

    const brandsMap = new Map<string, { name: string; slug: string; count: number }>();
    let detectedAttributeSlug: string | null = null;

    data.products.edges.forEach((edge: any) => {
      const product = edge.node;
      if (!product.attributes || !Array.isArray(product.attributes)) return;

      const brandAttr = product.attributes.find((attr: any) => {
        const attrName = attr?.attribute?.name?.toLowerCase()?.trim();
        const attrSlug = attr?.attribute?.slug?.toLowerCase()?.trim();
        return attrName === "brand" || attrSlug === "brand" || attrSlug === "manufacturer";
      });

      if (brandAttr) {
        if (!detectedAttributeSlug && brandAttr.attribute?.slug) {
          detectedAttributeSlug = brandAttr.attribute.slug;
        }

        const brandValues = brandAttr.values || [];
        if (brandValues.length > 0) {
          brandValues.forEach((value: any) => {
            const brandName = value?.name || value?.value;
            if (brandName && typeof brandName === 'string' && brandName.trim()) {
              const brandSlug = value.slug || 
                brandName.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
              
              if (brandSlug) {
                if (!brandsMap.has(brandSlug)) {
                  brandsMap.set(brandSlug, { name: brandName.trim(), slug: brandSlug, count: 0 });
                }
                brandsMap.get(brandSlug)!.count++;
              }
            }
          });
        }
      }
    });

    const brands = Array.from(brandsMap.values())
      .map((brand) => ({
        id: `brand-${brand.slug}`,
        name: brand.name,
        slug: brand.slug,
        productCount: brand.count,
      }))
      .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
      .slice(0, 10);

    return { 
      brands, 
      attributeSlug: detectedAttributeSlug || "brand"
    };
  } catch (error) {
    console.warn("Failed to fetch brands from attributes:", error);
    return { brands: [], attributeSlug: "brand" };
  }
}

// ============================================================================
// Page Component
// ============================================================================

export default async function Page(props: {
  params: Promise<{ channel: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
  const { channel } = params;

  const filters = parseFiltersFromURL(searchParams);
  const sortValue = parseSortFromURL(searchParams);
  
  // Handle special sort options that require filtering
  let adjustedFilters = { ...filters };
  
  // Apply "sale" filter when sorting by sale
  if (sortValue && (sortValue as any) === "sale") {
    adjustedFilters.onSale = true;
  }
  
  // Apply "newest" - already handled by date-desc sort
  
  const sortVariables = buildGraphQLSort(sortValue);

  // Fetch brands, sizes, and colors first to detect the attribute slugs (needed for filter)
  const [brandsResult, sizesResult, colorsResult] = await Promise.all([
    fetchBrandsForQuickFilters(channel),
    fetchSizesForQuickFilters(channel),
    fetchColorsForQuickFilters(channel),
  ]);
  const brandsForQuickFilters = brandsResult.brands;
  const brandAttributeSlug = brandsResult.attributeSlug;
  const sizeAttributeSlug = sizesResult.attributeSlug || "size"; // Default to "size" if not detected
  const colorAttributeSlug = colorsResult.attributeSlug || "color"; // Default to "color" if not detected

  const [categoryIds, collectionIds] = await Promise.all([
    getCategoryIdsFromSlugs(adjustedFilters.categories, channel),
    getCollectionIdsFromSlugs(adjustedFilters.collections, channel),
  ]);

  // Build filter with correct brand, size, and color attribute slugs
  const graphqlFilter = buildGraphQLFilter({
    filters: adjustedFilters,
    categoryIds,
    collectionIds,
    brandAttributeSlug: brandAttributeSlug ? brandAttributeSlug : undefined,
    sizeAttributeSlug: sizeAttributeSlug ? sizeAttributeSlug : undefined,
    colorAttributeSlug: colorAttributeSlug ? colorAttributeSlug : undefined,
  });

  const [{ products }, categoriesForQuickFilters, collectionsForQuickFilters] = await Promise.all([
    executeGraphQL(ProductListFilteredDocument, {
		variables: {
			first: 24,
        channel,
			sortBy: sortVariables,
        filter: graphqlFilter,
        search: adjustedFilters.search || undefined,
		},
		revalidate: 60,
    }),
    fetchCategoriesForQuickFilters(channel),
    fetchCollectionsForQuickFilters(channel),
  ]);

	const productCount = products?.totalCount || 0;
	const initialProducts = products?.edges.map(({ node }) => node) || [];
	const hasNextPage = products?.pageInfo.hasNextPage || false;
	const endCursor = products?.pageInfo.endCursor || null;

  const activeFilters = hasActiveFilters(filters);
  const hasQuickFilters = categoriesForQuickFilters.length > 0 || collectionsForQuickFilters.length > 0 || brandsForQuickFilters.length > 0;
  const { branding } = storeConfig;

	return (
		<div className="min-h-screen bg-white">
			<div className="flex">
				{/* Left Sidebar - Narrower Width */}
				<aside className="hidden lg:block lg:w-64 xl:w-72 lg:flex-shrink-0 lg:border-r lg:border-neutral-200">
					<div className="sticky top-0 h-screen overflow-y-auto">
						{/* Sidebar Header */}
						<div 
							className="px-5 py-6 border-b border-neutral-200"
							style={{
								background: `linear-gradient(135deg, ${branding.colors.primary}08 0%, transparent 100%)`,
							}}
						>
							<h1 
								className="text-2xl font-bold tracking-tight mb-2"
								style={{ color: branding.colors.text }}
							>
								DISCOVER PRODUCTS
							</h1>
							<p className="text-sm text-neutral-600">
								{productCount} {productCount === 1 ? "item" : "items"} available
							</p>
						</div>

						{/* Filters */}
						<div className="px-5 py-5">
							<Suspense fallback={<FiltersSkeleton />}>
								<ProductFiltersWrapper 
									channel={channel}
									initialBrands={brandsForQuickFilters}
									initialSizes={sizesResult.sizes}
									initialColors={colorsResult.colors}
								/>
							</Suspense>
						</div>
					</div>
				</aside>

				{/* Main Content Area */}
				<div className="flex-1 min-w-0">
					{/* Quick Filters Section with Title */}
					{hasQuickFilters && (
						<div 
							className="border-b border-neutral-200 animate-fade-in-up"
							style={{
								background: `linear-gradient(135deg, ${branding.colors.primary}08 0%, ${branding.colors.secondary}05 50%, transparent 100%)`,
								animationDelay: "100ms",
								animationFillMode: "both",
							}}
						>
							<h2 
								className="px-4 py-3 text-xl font-bold tracking-tight sm:px-6 lg:px-8"
								style={{ color: branding.colors.text }}
							>
								Check Out Our Products
							</h2>
							<div className="w-full">
								<QuickFilters
									categories={categoriesForQuickFilters}
									collections={collectionsForQuickFilters}
									brands={brandsForQuickFilters}
								/>
							</div>
						</div>
					)}

					{/* Products Content */}
					<div className="px-4 py-6 sm:px-6 lg:px-8">
						{/* Results Header with Search */}
						<div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							{/* Mobile Filter Button */}
							<div className="lg:hidden">
								<ProductFiltersWrapper 
									channel={channel} 
									mobileOnly
									initialBrands={brandsForQuickFilters}
									initialSizes={sizesResult.sizes}
									initialColors={colorsResult.colors}
								/>
							</div>
							
							{/* Search, Results & Sort */}
							<div className="flex flex-1 items-center justify-between gap-4 sm:ml-auto lg:ml-0">
								{/* Search Bar - Compact */}
								<div className="flex-1 max-w-md">
									<Suspense fallback={
										<div className="h-9 bg-neutral-100 rounded-md animate-pulse" />
									}>
										<ProductSearch channel={channel} initialSearch={filters.search} />
									</Suspense>
								</div>
								
								{/* Results & Sort */}
								<div className="flex items-center gap-4 flex-shrink-0">
									<div className="text-sm text-neutral-600 whitespace-nowrap">
										{filters.search ? (
											<>
												<span className="font-semibold text-neutral-900">{productCount.toLocaleString()}</span>
												<span className="ml-1">for</span>
												<span className="ml-1 font-semibold text-neutral-900">"{filters.search}"</span>
											</>
										) : (
											<>
												<span className="font-semibold text-neutral-900">{productCount.toLocaleString()}</span>
												<span className="ml-1">results</span>
											</>
										)}
									</div>
									<SortBy />
								</div>
							</div>
						</div>

						{/* Active Filters Tags */}
						{activeFilters && (
							<div className="mb-6">
								<ActiveFiltersTags 
									filters={filters}
									categories={categoriesForQuickFilters}
									collections={collectionsForQuickFilters}
									brands={brandsForQuickFilters}
									sizes={sizesResult.sizes}
									colors={colorsResult.colors}
								/>
							</div>
						)}

						{/* Products Grid */}
						<ProductsGrid
							initialProducts={initialProducts}
							channel={channel}
							totalCount={productCount}
							hasNextPage={hasNextPage}
							endCursor={endCursor}
							sortBy={sortVariables}
							filters={filters}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// Sub-components
// ============================================================================

function FiltersSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-neutral-200 rounded-lg" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-4 bg-neutral-200 rounded" />
        ))}
      </div>
    </div>
  );
}
