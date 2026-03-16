import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { OrderDirection, ProductOrderField, SearchProductsDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getLanguageCodeForChannel } from "@/lib/language";
import { enhanceSearchQuery } from "@/lib/search/query-enhancer";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { SortBy } from "@/ui/components/SortBy";
import { storeConfig } from "@/config";
import { SearchProductsGrid } from "./SearchProductsGrid";

export const metadata = {
	title: "Search",
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
		exact?: string | string[];
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
	const isExact = searchParams.exact === "1";

	// Enhance the query (typo correction, stemming) unless user forced exact search
	const enhanced = isExact
		? { original: searchValue, corrected: searchValue, alternatives: [] as string[], didYouMean: undefined }
		: await enhanceSearchQuery(searchValue, params.channel, languageCode);

	const { products } = await executeGraphQL(SearchProductsDocument, {
		variables: {
			search: enhanced.corrected,
			channel: params.channel,
			languageCode,
			sortBy: ProductOrderField.Rating,
			sortDirection: OrderDirection.Asc,
			first: 50,
		},
		revalidate: 60,
	});

	// If corrected query returned no results, try alternatives
	let finalProducts = products;
	if ((!products || products.totalCount === 0) && enhanced.alternatives.length > 0) {
		for (const alt of enhanced.alternatives) {
			const altResult = await executeGraphQL(SearchProductsDocument, {
				variables: {
					search: alt,
					channel: params.channel,
					languageCode,
					sortBy: ProductOrderField.Rating,
					sortDirection: OrderDirection.Asc,
					first: 50,
				},
				revalidate: 60,
			});
			if (altResult.products && (altResult.products.totalCount ?? 0) > 0) {
				finalProducts = altResult.products;
				break;
			}
		}
	}

	if (!finalProducts) {
		notFound();
	}

	const productList = finalProducts.edges.map((e) => e.node);
	const productCount = finalProducts.totalCount || productList.length;
	const didYouMean = enhanced.didYouMean;
	const wasAutoCorrected = enhanced.corrected !== searchValue && productCount > 0;

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
							? `Found ${productCount} ${productCount === 1 ? "result" : "results"} for "${wasAutoCorrected ? enhanced.corrected : searchValue}"`
							: `No results found for "${searchValue}"`
						}
					</p>

					{/* "Did you mean?" / auto-correction banner */}
					{wasAutoCorrected && didYouMean && (
						<div className="mt-3 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
							Showing results for <strong className="font-semibold">{enhanced.corrected}</strong>.{" "}
							<Link
								href={`/${params.channel}/search?query=${encodeURIComponent(searchValue)}&exact=1`}
								className="font-medium underline hover:text-blue-600"
							>
								Search instead for &quot;{searchValue}&quot;
							</Link>
						</div>
					)}

					{/* Suggestion when no results and we have a correction */}
					{productCount === 0 && didYouMean && !wasAutoCorrected && (
						<div className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
							Did you mean{" "}
							<Link
								href={`/${params.channel}/search?query=${encodeURIComponent(didYouMean)}`}
								className="font-semibold underline hover:text-amber-600"
							>
								{didYouMean}
							</Link>
							?
						</div>
					)}
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
