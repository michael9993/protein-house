import edjsHTML from "editorjs-html";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import xss from "xss";
import { invariant } from "ts-invariant";
import { type WithContext, type Product } from "schema-dts";
import { ProductDetailsDocument, ProductListDocument, CheckoutAddLineDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { formatMoney, formatMoneyRange } from "@/lib/utils";
import * as Checkout from "@/lib/checkout";
import { storeConfig } from "@/config";
import { ProductDetailClient } from "./ProductDetailClient";

export async function generateMetadata(
	props: {
		params: Promise<{ slug: string; channel: string }>;
		searchParams: Promise<{ variant?: string }>;
	},
	parent: ResolvingMetadata,
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
	const price = selectedVariant?.pricing?.price?.gross
		? formatMoney(selectedVariant.pricing.price.gross.amount, selectedVariant.pricing.price.gross.currency)
		: isAvailable
			? formatMoneyRange({
					start: product?.pricing?.priceRange?.start?.gross,
					stop: product?.pricing?.priceRange?.stop?.gross,
				})
			: "";

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

	// Server action for adding to cart
	async function addItem(formData: FormData) {
		"use server";

		const variantId = formData.get("variantId") as string;
		const quantity = parseInt(formData.get("quantity") as string) || 1;

		if (!variantId) return;

		const checkout = await Checkout.findOrCreate({
			checkoutId: await Checkout.getIdFromCookies(params.channel),
			channel: params.channel,
		});
		invariant(checkout, "This should never happen");

		await Checkout.saveIdToCookie(params.channel, checkout.id);

		// Add line (quantity times if needed)
		for (let i = 0; i < quantity; i++) {
			await executeGraphQL(CheckoutAddLineDocument, {
				variables: {
					id: checkout.id,
					productVariantId: decodeURIComponent(variantId),
				},
				cache: "no-cache",
			});
		}

		// CRITICAL: Re-fetch checkout after adding items to get updated state
		// Then ensure checkout is saved to user metadata if user is logged in
		const { getCurrentUser, saveUserCheckoutId } = await import("@/lib/checkout");
		const { CheckoutFindDocument } = await import("@/gql/graphql");
		const currentUser = await getCurrentUser();
		
		console.log(`[Add Item] 🔍 Checking if checkout should be saved to user metadata...`);
		console.log(`[Add Item]    - Current user: ${currentUser?.id || "none"}`);
		console.log(`[Add Item]    - Checkout ID: ${checkout.id}`);
		
		if (currentUser?.id) {
			// Re-fetch checkout to get updated state (with items and user attachment)
			try {
				const { checkout: updatedCheckout } = await executeGraphQL(CheckoutFindDocument, {
					variables: { id: checkout.id },
					cache: "no-cache",
				});
				
				if (updatedCheckout) {
					console.log(`[Add Item]    - Updated checkout user: ${updatedCheckout.user?.id || "none"}`);
					console.log(`[Add Item]    - Updated checkout lines: ${updatedCheckout.lines?.length || 0}`);
					
					if (updatedCheckout.user?.id === currentUser.id) {
						await saveUserCheckoutId(currentUser.id, params.channel, updatedCheckout.id);
						console.log(`[Add Item] ✅ Saved checkout ${updatedCheckout.id} to user metadata (key: checkoutId-${params.channel})`);
						console.log(`[Add Item]    This ensures cart will be restored on next login and syncs across devices`);
					} else {
						console.log(`[Add Item] ⚠️  Warning: Checkout ${updatedCheckout.id} not attached to user ${currentUser.id}`);
						console.log(`[Add Item]    - Expected user: ${currentUser.id}`);
						console.log(`[Add Item]    - Checkout user: ${updatedCheckout.user?.id || "none"}`);
						console.log(`[Add Item]    - Attempting to attach checkout to user...`);
						
						// Try to attach checkout to user
						const { CheckoutCustomerAttachDocument } = await import("@/gql/graphql");
						try {
							await executeGraphQL(CheckoutCustomerAttachDocument, {
								variables: { checkoutId: updatedCheckout.id },
								cache: "no-cache",
							});
							// Re-fetch again to verify attachment
							const { checkout: attachedCheckout } = await executeGraphQL(CheckoutFindDocument, {
								variables: { id: updatedCheckout.id },
								cache: "no-cache",
							});
							if (attachedCheckout && attachedCheckout.user?.id === currentUser.id) {
								await saveUserCheckoutId(currentUser.id, params.channel, attachedCheckout.id);
								console.log(`[Add Item] ✅ Successfully attached and saved checkout ${attachedCheckout.id}`);
							}
						} catch (attachError) {
							console.error(`[Add Item] ❌ Failed to attach checkout to user:`, attachError);
						}
					}
				}
			} catch (error) {
				console.error(`[Add Item] ❌ Error re-fetching checkout:`, error);
				// Fallback: save anyway if checkout was attached before
				if (checkout.user?.id === currentUser.id) {
					await saveUserCheckoutId(currentUser.id, params.channel, checkout.id);
					console.log(`[Add Item] ✅ Saved checkout ${checkout.id} (fallback - using original checkout)`);
				}
			}
		} else {
			console.log(`[Add Item] ℹ️  User not logged in - checkout not saved to user cookie (guest cart)`);
		}

		revalidatePath("/cart");
	}

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
						pricing: v.pricing,
					})),
				}}
				selectedVariantId={selectedVariantID}
				channel={params.channel}
				addItemAction={addItem}
			/>
		</>
	);
}
