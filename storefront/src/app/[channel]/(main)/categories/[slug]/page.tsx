import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import { ProductListByCategoryDocument, OrderDirection, ProductOrderField } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { SortBy } from "@/ui/components/SortBy";
import { storeConfig } from "@/config";
import { CategoryProductsGrid } from "./CategoryProductsGrid";
import { CategoryFiltersButton } from "./CategoryFiltersButton";

export const generateMetadata = async (
	props: { params: Promise<{ slug: string; channel: string }> },
	parent: ResolvingMetadata,
): Promise<Metadata> => {
	const params = await props.params;
	const { category } = await executeGraphQL(ProductListByCategoryDocument, {
		variables: { slug: params.slug, channel: params.channel },
		revalidate: 60,
	});

	return {
		title: `${category?.name || "Category"} | ${storeConfig.store.name}`,
		description: category?.seoDescription || category?.description || `Shop ${category?.name} at ${storeConfig.store.name}`,
	};
};

// Price range definitions for display
const PRICE_RANGE_LABELS: Record<string, string> = {
	"0-25": "Under $25",
	"25-50": "$25 - $50",
	"50-100": "$50 - $100",
	"100-200": "$100 - $200",
	"200+": "Over $200",
};

export default async function Page(props: { 
	params: Promise<{ slug: string; channel: string }>;
	searchParams: Promise<{
		sort?: string | string[];
		priceRanges?: string | string[];
		minPrice?: string | string[];
		maxPrice?: string | string[];
		inStock?: string | string[];
		onSale?: string | string[];
	}>;
}) {
	const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
	const { category } = await executeGraphQL(ProductListByCategoryDocument, {
		variables: { slug: params.slug, channel: params.channel },
		revalidate: 60,
	});

	if (!category || !category.products) {
		notFound();
	}

	const { name, description, products } = category;
	const productList = products.edges.map((e) => e.node);
	const productCount = products.totalCount || productList.length;

	// Parse filter params
	const priceRanges = searchParams.priceRanges 
		? (Array.isArray(searchParams.priceRanges) ? searchParams.priceRanges[0] : searchParams.priceRanges).split(",")
		: [];
	const minPrice = searchParams.minPrice 
		? parseFloat(Array.isArray(searchParams.minPrice) ? searchParams.minPrice[0] : searchParams.minPrice)
		: undefined;
	const maxPrice = searchParams.maxPrice 
		? parseFloat(Array.isArray(searchParams.maxPrice) ? searchParams.maxPrice[0] : searchParams.maxPrice)
		: undefined;
	const inStock = searchParams.inStock === "true";
	const onSale = searchParams.onSale === "true";

	const hasActiveFilters = priceRanges.length > 0 || minPrice !== undefined || maxPrice !== undefined || inStock || onSale;

	return (
		<div className="min-h-screen bg-neutral-50/50">
			<div className="mx-auto w-full max-w-[1920px] px-4 py-6 sm:px-6 lg:px-8">
				{/* Breadcrumbs */}
				<Breadcrumbs 
					items={[
						{ label: "Products", href: "/products" },
						{ label: name },
					]} 
				/>

				{/* Category Header */}
				<div className="mb-6 sm:mb-8">
					<h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl lg:text-4xl">{name}</h1>
					{description && (
						<p className="mt-2 text-base text-neutral-600 sm:mt-3 sm:text-lg">{description}</p>
					)}
					<p className="mt-1 text-sm text-neutral-500 sm:mt-2">
						{productCount} {productCount === 1 ? "product" : "products"}
					</p>
				</div>

				{/* Toolbar */}
				<div className="mb-4 flex flex-col gap-3 rounded-lg bg-white p-3 shadow-sm sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:p-4">
					{/* Mobile Filter Button */}
					<CategoryFiltersButton
						minPrice={minPrice}
						maxPrice={maxPrice}
						inStock={inStock}
						onSale={onSale}
						priceRanges={priceRanges}
					/>
					
					{/* Results count & Sort */}
					<div className="flex items-center justify-between gap-4 sm:ml-auto">
						<span className="text-sm text-neutral-500">
							{productCount} {productCount === 1 ? "result" : "results"}
						</span>
						<SortBy />
					</div>
				</div>

				{/* Active Filters Tags */}
				{hasActiveFilters && (
					<div className="mb-4 flex flex-wrap items-center gap-2">
						<span className="text-sm font-medium text-neutral-600">Active:</span>
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

				{/* Product Grid */}
				<CategoryProductsGrid
					initialProducts={productList}
					categorySlug={params.slug}
					channel={params.channel}
					totalCount={productCount}
					priceRangesFilter={priceRanges}
					minPriceFilter={minPrice}
					maxPriceFilter={maxPrice}
					inStockFilter={inStock}
					onSaleFilter={onSale}
				/>
			</div>
		</div>
	);
}

