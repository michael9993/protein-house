import { notFound, redirect } from "next/navigation";
import { OrderDirection, ProductOrderField, SearchProductsDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getLanguageCodeForChannel } from "@/lib/language";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { SortBy } from "@/ui/components/SortBy";
import { storeConfig } from "@/config";
import { SearchProductsGrid } from "./SearchProductsGrid";

export const metadata = {
	title: `Search | ${storeConfig.store.name}`,
	description: `Search products at ${storeConfig.store.name}`,
};

export default async function Page(props: {
	searchParams: Promise<{
		query?: string | string[];
		q?: string | string[];
		sort?: string | string[];
		minPrice?: string | string[];
		maxPrice?: string | string[];
		inStock?: string | string[];
		onSale?: string | string[];
	}>;
	params: Promise<{ channel: string }>;
}) {
	const [searchParams, params] = await Promise.all([props.searchParams, props.params]);

	const searchValue = searchParams.query || searchParams.q;

	if (!searchValue) {
		notFound();
	}

	if (Array.isArray(searchValue)) {
		const firstValidSearchValue = searchValue.find((v) => v.length > 0);
		if (!firstValidSearchValue) {
			notFound();
		}
		redirect(`/search?${new URLSearchParams({ query: firstValidSearchValue }).toString()}`);
	}

	const languageCode = getLanguageCodeForChannel(params.channel);
	const { products } = await executeGraphQL(SearchProductsDocument, {
		variables: {
			search: searchValue,
			channel: params.channel,
			languageCode,
			sortBy: ProductOrderField.Rating,
			sortDirection: OrderDirection.Asc,
			first: 50, // Load more for search
		},
		revalidate: 60,
	});

	if (!products) {
		notFound();
	}

	const productList = products.edges.map((e) => e.node);
	const productCount = products.totalCount || productList.length;

	// Parse filter params
	const minPrice = searchParams.minPrice 
		? parseFloat(Array.isArray(searchParams.minPrice) ? searchParams.minPrice[0] : searchParams.minPrice)
		: undefined;
	const maxPrice = searchParams.maxPrice 
		? parseFloat(Array.isArray(searchParams.maxPrice) ? searchParams.maxPrice[0] : searchParams.maxPrice)
		: undefined;
	const inStock = searchParams.inStock === "true";
	const onSale = searchParams.onSale === "true";

	const hasActiveFilters = minPrice !== undefined || maxPrice !== undefined || inStock || onSale;

	return (
		<div className="min-h-screen bg-neutral-50/50">
			<div className="mx-auto w-full max-w-[1920px] px-4 py-6 sm:px-6 lg:px-8">
				{/* Breadcrumbs */}
				<Breadcrumbs 
					items={[
						{ label: "Search" },
					]} 
				/>

				{/* Search Header */}
				<div className="mb-6 sm:mb-8">
					<h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl lg:text-4xl">
						Search Results
					</h1>
					<p className="mt-1 text-base text-neutral-600 sm:mt-2">
						{productCount > 0 
							? `Found ${productCount} ${productCount === 1 ? "result" : "results"} for "${searchValue}"`
							: `No results found for "${searchValue}"`
						}
					</p>
				</div>

				{productCount > 0 && (
					<>
						{/* Toolbar */}
						<div className="mb-4 flex items-center justify-end gap-4 rounded-lg bg-white p-3 shadow-sm sm:mb-6 sm:p-4">
							<span className="text-sm text-neutral-500">
								{productCount} {productCount === 1 ? "result" : "results"}
							</span>
							<SortBy />
						</div>

						{/* Active Filters Tags */}
						{hasActiveFilters && (
							<div className="mb-4 flex flex-wrap items-center gap-2">
								<span className="text-sm font-medium text-neutral-600">Active:</span>
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

						{/* Products Grid */}
						<SearchProductsGrid
							initialProducts={productList}
							searchQuery={searchValue}
							channel={params.channel}
							totalCount={productCount}
							minPriceFilter={minPrice}
							maxPriceFilter={maxPrice}
							inStockFilter={inStock}
							onSaleFilter={onSale}
						/>
					</>
				)}

				{productCount === 0 && (
					<div className="flex flex-col items-center justify-center rounded-lg bg-white py-16 text-center shadow-sm">
						<svg className="mb-4 h-16 w-16 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
						</svg>
						<p className="text-lg font-medium text-neutral-600">No products found</p>
						<p className="mt-1 text-sm text-neutral-500">Try a different search term</p>
					</div>
				)}
			</div>
		</div>
	);
}
