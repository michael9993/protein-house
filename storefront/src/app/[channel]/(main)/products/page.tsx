import { Suspense } from "react";
import { ProductListFilteredDocument, OrderDirection, ProductOrderField, CategoriesForFilterDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { storeConfig } from "@/config";
import { SortBy } from "@/ui/components/SortBy";
import { ProductFiltersWrapper } from "./ProductFiltersWrapper";
import { ProductsGrid } from "./ProductsGrid";

// Helper to get category IDs from slugs
async function getCategoryIdsFromSlugs(slugs: string[], channel: string): Promise<string[]> {
	if (slugs.length === 0) return [];
	
	const { categories } = await executeGraphQL(CategoriesForFilterDocument, {
		variables: { first: 100, channel },
		revalidate: 300, // Cache for 5 minutes
	});
	
	const categoryIds: string[] = [];
	const slugSet = new Set(slugs.map(s => s.toLowerCase()));
	
	categories?.edges?.forEach(edge => {
		const cat = edge.node;
		// Check parent category
		if (slugSet.has(cat.slug.toLowerCase())) {
			categoryIds.push(cat.id);
		}
		// Check children
		cat.children?.edges?.forEach(childEdge => {
			const child = childEdge.node;
			if (slugSet.has(child.slug.toLowerCase())) {
				categoryIds.push(child.id);
			}
		});
	});
	
	return categoryIds;
}

export const metadata = {
	title: `All Products | ${storeConfig.store.name}`,
	description: `Browse all products at ${storeConfig.store.name}. Find the best deals and latest arrivals.`,
};

// Price range definitions for display
const PRICE_RANGE_LABELS: Record<string, string> = {
	"0-25": "Under $25",
	"25-50": "$25 - $50",
	"50-100": "$50 - $100",
	"100-200": "$100 - $200",
	"200+": "Over $200",
};

const getSortVariables = (sortParam?: string | string[]) => {
	const sortValue = Array.isArray(sortParam) ? sortParam[0] : sortParam;

	switch (sortValue) {
		case "price-asc":
			return { field: ProductOrderField.MinimalPrice, direction: OrderDirection.Asc };
		case "price-desc":
			return { field: ProductOrderField.MinimalPrice, direction: OrderDirection.Desc };
		case "newest":
			return { field: ProductOrderField.Date, direction: OrderDirection.Desc };
		case "name-asc":
			return { field: ProductOrderField.Name, direction: OrderDirection.Asc };
		case "name-desc":
			return { field: ProductOrderField.Name, direction: OrderDirection.Desc };
		default:
			return { field: ProductOrderField.Rating, direction: OrderDirection.Desc };
	}
};

export default async function Page(props: {
	params: Promise<{ channel: string }>;
	searchParams: Promise<{
		sort?: string | string[];
		categories?: string | string[];
		priceRanges?: string | string[];
		minPrice?: string | string[];
		maxPrice?: string | string[];
		inStock?: string | string[];
		onSale?: string | string[];
	}>;
}) {
	const searchParams = await props.searchParams;
	const params = await props.params;

	const sortVariables = getSortVariables(searchParams.sort);

	// Parse filter params first
	const selectedCategories = searchParams.categories 
		? (Array.isArray(searchParams.categories) ? searchParams.categories[0] : searchParams.categories).split(",")
		: [];
	
	// New price ranges (multiple checkboxes)
	const priceRanges = searchParams.priceRanges 
		? (Array.isArray(searchParams.priceRanges) ? searchParams.priceRanges[0] : searchParams.priceRanges).split(",")
		: [];
	
	// Legacy min/max price (for backward compatibility)
	const minPrice = searchParams.minPrice 
		? parseFloat(Array.isArray(searchParams.minPrice) ? searchParams.minPrice[0] : searchParams.minPrice)
		: undefined;
	const maxPrice = searchParams.maxPrice 
		? parseFloat(Array.isArray(searchParams.maxPrice) ? searchParams.maxPrice[0] : searchParams.maxPrice)
		: undefined;
	
	const inStock = searchParams.inStock === "true";
	const onSale = searchParams.onSale === "true";

	// Get category IDs from slugs for server-side filtering
	const categoryIds = await getCategoryIdsFromSlugs(selectedCategories, params.channel);

	// Build GraphQL filter
	const buildFilter = () => {
		const filter: Record<string, unknown> = {};
		
		// Category filter - use IDs fetched from slugs
		if (categoryIds.length > 0) {
			filter.categories = categoryIds;
		}
		
		// Price filter - use price ranges or legacy min/max
		if (priceRanges.length > 0) {
			// Convert price ranges to gte/lte
			// Take the widest range to cover all selected ranges
			let minVal = Infinity;
			let maxVal = 0;
			
			priceRanges.forEach(rangeId => {
				const [minStr, maxStr] = rangeId.split("-");
				const min = parseInt(minStr) || 0;
				const max = maxStr === "+" ? Infinity : (parseInt(maxStr) || Infinity);
				if (min < minVal) minVal = min;
				if (max > maxVal) maxVal = max;
			});
			
			if (minVal !== Infinity) {
				filter.price = { gte: minVal, ...(maxVal !== Infinity ? { lte: maxVal } : {}) };
			}
		} else if (minPrice !== undefined || maxPrice !== undefined) {
			filter.price = {
				...(minPrice !== undefined ? { gte: minPrice } : {}),
				...(maxPrice !== undefined ? { lte: maxPrice } : {}),
			};
		}
		
		// Stock filter
		if (inStock) {
			filter.stockAvailability = "IN_STOCK";
		}
		
		// Sale filter - check if discounted
		if (onSale) {
			filter.isAvailable = true;
		}
		
		return Object.keys(filter).length > 0 ? filter : undefined;
	};

	// Fetch initial products with filtering
	const { products } = await executeGraphQL(ProductListFilteredDocument, {
		variables: {
			first: 24,
			channel: params.channel,
			sortBy: sortVariables,
			filter: buildFilter(),
		},
		revalidate: 60,
	});

	const productCount = products?.totalCount || 0;
	const initialProducts = products?.edges.map(({ node }) => node) || [];
	const hasNextPage = products?.pageInfo.hasNextPage || false;
	const endCursor = products?.pageInfo.endCursor || null;

	const hasActiveFilters = selectedCategories.length > 0 || priceRanges.length > 0 || minPrice !== undefined || maxPrice !== undefined || inStock || onSale;

	return (
		<div className="min-h-screen bg-neutral-50/50">
			<div className="mx-auto w-full max-w-[1920px] px-4 py-6 sm:px-6 lg:px-8">
				{/* Breadcrumbs */}
				<Breadcrumbs items={[{ label: "All Products" }]} />

				{/* Page Header */}
				<div className="mb-6 sm:mb-8">
					<h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl lg:text-4xl">
						All Products
					</h1>
					<p className="mt-1 text-sm text-neutral-600 sm:mt-2 sm:text-base">
						{productCount} {productCount === 1 ? "product" : "products"} available
					</p>
				</div>

				<div className="flex gap-6 lg:gap-8">
					{/* Filters Sidebar - Desktop */}
					<aside className="hidden w-64 flex-shrink-0 lg:block">
						<div className="sticky top-24">
							<Suspense fallback={<div className="animate-pulse h-96 bg-neutral-200 rounded-lg" />}>
								<ProductFiltersWrapper 
									channel={params.channel}
									selectedCategories={selectedCategories}
								/>
							</Suspense>
						</div>
					</aside>

					{/* Products Area */}
					<div className="min-w-0 flex-1">
						{/* Toolbar */}
						<div className="mb-4 flex flex-col gap-3 rounded-lg bg-white p-3 shadow-sm sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:p-4">
							{/* Mobile Filter Button */}
							<ProductFiltersWrapper 
								channel={params.channel}
								selectedCategories={selectedCategories}
								mobileOnly
							/>
							
							{/* Results count & Sort */}
							<div className="flex items-center justify-between gap-4 sm:ml-auto">
								<span className="text-sm text-neutral-500">
									{productCount} {productCount === 1 ? "product" : "products"}
								</span>
								<SortBy />
							</div>
						</div>

						{/* Active Filters Tags */}
						{hasActiveFilters && (
							<div className="mb-4 flex flex-wrap items-center gap-2">
								<span className="text-sm font-medium text-neutral-600">Active:</span>
								{selectedCategories.length > 0 && (
									<span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm">
										{selectedCategories.length} {selectedCategories.length === 1 ? "category" : "categories"}
									</span>
								)}
								{priceRanges.map(rangeId => (
									<span key={rangeId} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm">
										{PRICE_RANGE_LABELS[rangeId] || rangeId}
									</span>
								))}
								{minPrice !== undefined && (
									<span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm">
										Min: ${minPrice}
									</span>
								)}
								{maxPrice !== undefined && (
									<span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm">
										Max: ${maxPrice}
									</span>
								)}
								{inStock && (
									<span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm">
										In Stock
									</span>
								)}
								{onSale && (
									<span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm">
										On Sale
									</span>
								)}
							</div>
						)}

						{/* Products Grid with Infinite Scroll */}
						<ProductsGrid
							initialProducts={initialProducts}
							channel={params.channel}
							totalCount={productCount}
							hasNextPage={hasNextPage}
							endCursor={endCursor}
							sortBy={sortVariables}
							categoryFilter={selectedCategories}
							priceRangesFilter={priceRanges}
							minPriceFilter={minPrice}
							maxPriceFilter={maxPrice}
							inStockFilter={inStock}
							onSaleFilter={onSale}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
