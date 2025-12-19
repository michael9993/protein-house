import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import { ProductListByCollectionDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { SortBy } from "@/ui/components/SortBy";
import { storeConfig } from "@/config";
import { CollectionProductsGrid } from "./CollectionProductsGrid";

export const generateMetadata = async (
	props: { params: Promise<{ slug: string; channel: string }> },
	parent: ResolvingMetadata,
): Promise<Metadata> => {
	const params = await props.params;
	const { collection } = await executeGraphQL(ProductListByCollectionDocument, {
		variables: { slug: params.slug, channel: params.channel },
		revalidate: 60,
	});

	return {
		title: `${collection?.name || "Collection"} | ${storeConfig.store.name}`,
		description: collection?.seoDescription || collection?.description || `Shop ${collection?.name} collection at ${storeConfig.store.name}`,
	};
};

export default async function Page(props: { 
	params: Promise<{ slug: string; channel: string }>;
	searchParams: Promise<{
		sort?: string | string[];
		minPrice?: string | string[];
		maxPrice?: string | string[];
		inStock?: string | string[];
		onSale?: string | string[];
	}>;
}) {
	const [params, searchParams] = await Promise.all([props.params, props.searchParams]);
	const { collection } = await executeGraphQL(ProductListByCollectionDocument, {
		variables: { slug: params.slug, channel: params.channel },
		revalidate: 60,
	});

	if (!collection || !collection.products) {
		notFound();
	}

	const { name, description, products } = collection;
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
						{ label: "Products", href: "/products" },
						{ label: "Collections", href: "/collections" },
						{ label: name },
					]} 
				/>

				{/* Collection Header */}
				<div className="mb-6 text-center sm:mb-8">
					<h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl lg:text-4xl">{name}</h1>
					{description && (
						<p className="mx-auto mt-2 max-w-2xl text-base text-neutral-600 sm:mt-3 sm:text-lg">{description}</p>
					)}
					<p className="mt-1 text-sm text-neutral-500 sm:mt-2">
						{productCount} {productCount === 1 ? "product" : "products"}
					</p>
				</div>

				{/* Toolbar */}
				<div className="mb-4 flex items-center justify-end gap-4 rounded-lg bg-white p-3 shadow-sm sm:mb-6 sm:p-4">
					<span className="text-sm text-neutral-500">
						{productCount} {productCount === 1 ? "result" : "results"}
					</span>
					<SortBy />
				</div>

				{/* Active Filters Tags */}
				{hasActiveFilters && (
					<div className="mb-4 flex flex-wrap items-center justify-center gap-2">
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

				{/* Product Grid */}
				<CollectionProductsGrid
					initialProducts={productList}
					collectionSlug={params.slug}
					channel={params.channel}
					totalCount={productCount}
					minPriceFilter={minPrice}
					maxPriceFilter={maxPrice}
					inStockFilter={inStock}
					onSaleFilter={onSale}
				/>
			</div>
		</div>
	);
}
