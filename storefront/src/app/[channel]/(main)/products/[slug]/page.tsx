import edjsHTML from "editorjs-html";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import { Suspense } from "react";
import xss from "xss";
import { invariant } from "ts-invariant";
import { type WithContext, type Product, type BreadcrumbList } from "schema-dts";
import { ProductDetailsDocument, ProductListDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getLanguageCodeForChannel } from "@/lib/language";
import { formatMoney, formatMoneyRange } from "@/lib/utils";
import { storeConfig } from "@/config";
import { ProductDetailClient } from "./ProductDetailClient";
import { addProductToCartAction } from "../actions";
import { RelatedProductsSection } from "./RelatedProductsSection";
import { RelatedProductsSkeleton } from "@/ui/components/RelatedProducts";
import { RecentlyViewedProducts } from "@/components/RecentlyViewedProducts";

export async function generateMetadata(
	props: {
		params: Promise<{ slug: string; channel: string }>;
		searchParams: Promise<{ variant?: string }>;
	},
	_parent: ResolvingMetadata, // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<Metadata> {
	const [searchParams, params] = await Promise.all([props.searchParams, props.params]);

	const languageCode = getLanguageCodeForChannel(params.channel);
	const { product } = await executeGraphQL(ProductDetailsDocument, {
		variables: {
			slug: decodeURIComponent(params.slug),
			channel: params.channel,
			languageCode,
		},
		revalidate: 60,
	});

	if (!product) {
		notFound();
	}

	const translatedName = product.translation?.name || product.name;
	const productName = product.translation?.seoTitle || product.seoTitle || translatedName;
	const variantName = product.variants?.find(({ id }) => id === searchParams.variant)?.name;
	const productNameAndVariant = variantName ? `${productName} - ${variantName}` : productName;

	const baseUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || "";
	const productPath = `/products/${encodeURIComponent(params.slug)}`;

	return {
		title: `${translatedName} | ${storeConfig.store.name}`,
		description: product.translation?.seoDescription || product.seoDescription || productNameAndVariant,
		alternates: {
			canonical: baseUrl ? baseUrl + productPath : undefined,
			languages: baseUrl
				? {
						"he-IL": `${baseUrl}/ils${productPath}`,
						"en-US": `${baseUrl}/usd${productPath}`,
					}
				: undefined,
		},
		openGraph: product.thumbnail
			? {
					images: [
						{
							url: product.thumbnail.url,
							alt: translatedName,
						},
					],
				}
			: null,
	};
}

export async function generateStaticParams({ params }: { params: { channel: string } }) {
	const { products } = await executeGraphQL(ProductListDocument, {
		revalidate: 60,
		variables: { first: 20, channel: params.channel, languageCode: getLanguageCodeForChannel(params.channel) },
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
	const languageCode = getLanguageCodeForChannel(params.channel);
	const { product } = await executeGraphQL(ProductDetailsDocument, {
		variables: {
			slug: decodeURIComponent(params.slug),
			channel: params.channel,
			languageCode,
		},
		revalidate: 60,
	});

	if (!product) {
		notFound();
	}

	// Parse description (prefer translated)
	const rawDescription = product.translation?.description || product?.description;
	const description = rawDescription ? parser.parse(JSON.parse(rawDescription)) : null;
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

	// Extract brand from product attributes
	const brandAttr = product.attributes?.find(
		(a: any) => a.attribute.slug === "brand" || a.attribute.slug === "manufacturer",
	);
	const brandVal = brandAttr?.values?.[0];
	const brandName = (brandVal ? ((brandVal as any).translation?.name || brandVal.name) : null) || storeConfig.store.name;

	// Rating data
	const rating = (product as any).rating as number | null;
	const reviewCount = ((product as any).reviews?.totalCount as number) || 0;

	// JSON-LD for SEO — Product schema
	const productJsonLd: WithContext<Product> = {
		"@context": "https://schema.org",
		"@type": "Product",
		image: product.thumbnail?.url,
		brand: { "@type": "Brand", name: brandName },
		...(product.category ? { category: product.category.translation?.name || product.category.name } : {}),
		...(selectedVariant?.id ? { sku: selectedVariant.id } : {}),
		...(rating && reviewCount > 0
			? {
					aggregateRating: {
						"@type": "AggregateRating",
						ratingValue: rating,
						reviewCount,
						bestRating: 5,
						worstRating: 1,
					},
				}
			: {}),
		...(selectedVariant
			? {
					name: `${product.translation?.name || product.name} - ${selectedVariant.translation?.name || selectedVariant.name}`,
					description: product.translation?.seoDescription || product.seoDescription || `${product.translation?.name || product.name} - ${selectedVariant.translation?.name || selectedVariant.name}`,
					offers: {
						"@type": "Offer",
						availability: selectedVariant.quantityAvailable
							? "https://schema.org/InStock"
							: "https://schema.org/OutOfStock",
						priceCurrency: selectedVariant.pricing?.price?.gross.currency,
						price: selectedVariant.pricing?.price?.gross.amount,
						url: `${process.env.NEXT_PUBLIC_STOREFRONT_URL || ""}/${params.channel}/products/${params.slug}`,
					},
				}
			: {
					name: product.translation?.name || product.name,
					description: product.translation?.seoDescription || product.seoDescription || (product.translation?.name || product.name),
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

	// BreadcrumbList JSON-LD
	const baseUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || "";
	const breadcrumbJsonLd: WithContext<BreadcrumbList> = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{
				"@type": "ListItem",
				position: 1,
				name: storeConfig.store.name,
				item: `${baseUrl}/${params.channel}`,
			},
			...(product.category
				? [
						{
							"@type": "ListItem" as const,
							position: 2,
							name: product.category.translation?.name || product.category.name,
							item: `${baseUrl}/${params.channel}/products?categories=${product.category.slug}`,
						},
					]
				: []),
			{
				"@type": "ListItem",
				position: product.category ? 3 : 2,
				name: product.translation?.name || product.name,
			},
		],
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(productJsonLd),
				}}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(breadcrumbJsonLd),
				}}
			/>
			<ProductDetailClient
				product={{
					id: product.id,
					name: product.translation?.name || product.name,
					slug: product.slug,
					description: descriptionHtml,
					category: product.category ? (product.category.translation?.name || product.category.name) : null,
					categorySlug: product.category?.slug || null,
					price,
					originalPrice,
					isAvailable,
					priceAmount: currentPrice?.amount,
					priceCurrency: currentPrice?.currency,
					originalPriceAmount: hasDiscount
						? (variantUndiscounted?.amount || productUndiscounted?.amount)
						: undefined,
					images,
					variants: variants.map(v => ({
						id: v.id,
						name: v.translation?.name || v.name,
						quantityAvailable: v.quantityAvailable || 0,
						trackInventory: (v as any).trackInventory ?? true,
						quantityLimitPerCustomer: (v as any).quantityLimitPerCustomer ?? null,
						attributes: v.attributes ? v.attributes.map(attr => ({
							attribute: {
								id: attr.attribute.id,
								name: attr.attribute.translation?.name || attr.attribute.name || "",
								slug: attr.attribute.slug || "",
								inputType: (attr.attribute as any).inputType || null,
							},
							values: attr.values.map(val => ({
								id: val.id,
								name: val.translation?.name || val.name || "",
								slug: val.slug || "",
								value: (val as any).value || null,
							})),
						})) : null,
						pricing: v.pricing,
					})),
					productAttributes: ((product as any).attributes || []).map((a: any) => ({
						attribute: {
							id: a.attribute.id,
							name: a.attribute.translation?.name || a.attribute.name || "",
							slug: a.attribute.slug || "",
							inputType: a.attribute.inputType || null,
							visibleInStorefront: true, // Saleor filters to visible-only for anonymous users
						},
						values: a.values.map((val: any) => ({
							id: val.id,
							name: val.translation?.name || val.name || "",
							slug: val.slug || "",
							value: val.value || null,
							richText: val.richText || null,
							plainText: val.plainText || null,
							boolean: val.boolean ?? null,
							date: val.date || null,
							dateTime: val.dateTime || null,
							file: val.file ? { url: val.file.url, contentType: val.file.contentType || null } : null,
						})),
					})),
					rating: (product as any).rating || null,
					reviewCount: (product as any).reviews?.totalCount || null,
					created: (product as any).created || undefined,
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

			{/* Recently Viewed Products — client-side, localStorage-driven */}
			<RecentlyViewedProducts
				channel={params.channel}
				excludeProductId={product.id}
			/>
		</>
	);
}
