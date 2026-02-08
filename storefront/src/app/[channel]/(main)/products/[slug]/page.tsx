import edjsHTML from "editorjs-html";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import { Suspense } from "react";
import xss from "xss";
import { invariant } from "ts-invariant";
import { type WithContext, type Product } from "schema-dts";
import { ProductDetailsDocument, ProductListDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { formatMoney, formatMoneyRange } from "@/lib/utils";
import { storeConfig } from "@/config";
import { ProductDetailClient } from "./ProductDetailClient";
import { addProductToCartAction } from "../actions";
import { RelatedProductsSection } from "./RelatedProductsSection";
import { RelatedProductsSkeleton } from "@/ui/components/RelatedProducts";

export async function generateMetadata(
	props: {
		params: Promise<{ slug: string; channel: string }>;
		searchParams: Promise<{ variant?: string }>;
	},
	_parent: ResolvingMetadata, // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<Metadata> {
	const [searchParams, params] = await Promise.all([props.searchParams, props.params]);

	const { product } = await executeGraphQL(ProductDetailsDocument, {
		variables: {
			slug: decodeURIComponent(params.slug),
			channel: params.channel,
		},
		revalidate: 60,
	});

	if (!product) {
		notFound();
	}

	const productName = product.seoTitle || product.name;
	const variantName = product.variants?.find(({ id }) => id === searchParams.variant)?.name;
	const productNameAndVariant = variantName ? `${productName} - ${variantName}` : productName;

	return {
		title: `${product.name} | ${storeConfig.store.name}`,
		description: product.seoDescription || productNameAndVariant,
		alternates: {
			canonical: process.env.NEXT_PUBLIC_STOREFRONT_URL
				? process.env.NEXT_PUBLIC_STOREFRONT_URL + `/products/${encodeURIComponent(params.slug)}`
				: undefined,
		},
		openGraph: product.thumbnail
			? {
					images: [
						{
							url: product.thumbnail.url,
							alt: product.name,
						},
					],
				}
			: null,
	};
}

export async function generateStaticParams({ params }: { params: { channel: string } }) {
	const { products } = await executeGraphQL(ProductListDocument, {
		revalidate: 60,
		variables: { first: 20, channel: params.channel },
		withAuth: false,
	});

	const paths = products?.edges.map(({ node: { slug } }) => ({ slug })) || [];
	return paths;
}

const parser = edjsHTML();

export default async function Page(props: {
	params: Promise<{ slug: string; channel: string }>;
	searchParams: Promise<{ variant?: string }>;
}) {
	const [searchParams, params] = await Promise.all([props.searchParams, props.params]);
	const { product } = await executeGraphQL(ProductDetailsDocument, {
		variables: {
			slug: decodeURIComponent(params.slug),
			channel: params.channel,
		},
		revalidate: 60,
	});

	if (!product) {
		notFound();
	}

	// Parse description
	const description = product?.description ? parser.parse(JSON.parse(product?.description)) : null;
	const descriptionHtml = description ? description.map((content: string) => xss(content)).join("") : null;

	// Build images array
	const images = [
		product.thumbnail && { url: product.thumbnail.url, alt: product.thumbnail.alt },
		...(product.media?.map(m => ({ url: m.url, alt: m.alt })) || []),
	].filter(Boolean) as Array<{ url: string; alt: string | null }>;

	// Get variants info
	const variants = product.variants || [];
	const selectedVariantID = searchParams.variant;
	const selectedVariant = variants.find(({ id }) => id === selectedVariantID);
	const isAvailable = variants.some((variant) => variant.quantityAvailable) ?? false;

	// Calculate price
	const priceRaw = selectedVariant?.pricing?.price?.gross
		? formatMoney(selectedVariant.pricing.price.gross.amount, selectedVariant.pricing.price.gross.currency)
		: isAvailable
			? formatMoneyRange({
					start: product?.pricing?.priceRange?.start?.gross,
					stop: product?.pricing?.priceRange?.stop?.gross,
				})
			: "";
	const price: string = priceRaw || "";

	// Check for discount - from variant or product pricing
	const variantUndiscounted = selectedVariant?.pricing?.priceUndiscounted?.gross;
	const productUndiscounted = product?.pricing?.priceRangeUndiscounted?.start?.gross;
	const currentPrice = selectedVariant?.pricing?.price?.gross || product?.pricing?.priceRange?.start?.gross;
	
	// Determine if there's a discount
	const hasDiscount = variantUndiscounted 
		? (currentPrice && variantUndiscounted.amount > currentPrice.amount)
		: (productUndiscounted && currentPrice && productUndiscounted.amount > currentPrice.amount);
	
	const originalPrice = hasDiscount
		? formatMoney(
			variantUndiscounted?.amount || productUndiscounted?.amount || 0,
			variantUndiscounted?.currency || productUndiscounted?.currency || "USD"
		)
		: null;

	// JSON-LD for SEO
	const productJsonLd: WithContext<Product> = {
		"@context": "https://schema.org",
		"@type": "Product",
		image: product.thumbnail?.url,
		...(selectedVariant
			? {
					name: `${product.name} - ${selectedVariant.name}`,
					description: product.seoDescription || `${product.name} - ${selectedVariant.name}`,
					offers: {
						"@type": "Offer",
						availability: selectedVariant.quantityAvailable
							? "https://schema.org/InStock"
							: "https://schema.org/OutOfStock",
						priceCurrency: selectedVariant.pricing?.price?.gross.currency,
						price: selectedVariant.pricing?.price?.gross.amount,
					},
				}
			: {
					name: product.name,
					description: product.seoDescription || product.name,
					offers: {
						"@type": "AggregateOffer",
						availability: product.variants?.some((variant) => variant.quantityAvailable)
							? "https://schema.org/InStock"
							: "https://schema.org/OutOfStock",
						priceCurrency: product.pricing?.priceRange?.start?.gross.currency,
						lowPrice: product.pricing?.priceRange?.start?.gross.amount,
						highPrice: product.pricing?.priceRange?.stop?.gross.amount,
					},
				}),
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(productJsonLd),
				}}
			/>
			<ProductDetailClient
				product={{
					id: product.id,
					name: product.name,
					slug: product.slug,
					description: descriptionHtml,
					category: product.category?.name || null,
					categorySlug: product.category?.slug || null,
					price,
					originalPrice,
					isAvailable,
					images,
					variants: variants.map(v => ({
						id: v.id,
						name: v.name,
						quantityAvailable: v.quantityAvailable || 0,
						attributes: v.attributes ? v.attributes.map(attr => ({
							attribute: {
								id: attr.attribute.id,
								name: attr.attribute.name || "",
								slug: attr.attribute.slug || "",
							},
							values: attr.values.map(val => ({
								id: val.id,
								name: val.name || "",
								slug: val.slug || "",
							})),
						})) : (null as any),
						pricing: v.pricing,
					})) as any,
					rating: (product as any).rating || null,
					reviewCount: (product as any).reviews?.totalCount || null,
				}}
				selectedVariantId={selectedVariantID}
				channel={params.channel}
				addItemAction={addProductToCartAction}
				productSlug={params.slug}
			/>

			{/* Related Products Section - rendered non-blocking with Suspense */}
			{product.category?.slug && storeConfig.features.relatedProducts && (
				<Suspense fallback={<RelatedProductsSkeleton />}>
					<RelatedProductsSection
						categorySlug={product.category.slug}
						currentProductId={product.id}
						channel={params.channel}
						maxItems={storeConfig.relatedProducts?.maxItems ?? 8}
					/>
				</Suspense>
			)}
		</>
	);
}
