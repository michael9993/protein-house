import edjsHTML from "editorjs-html";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import xss from "xss";
import { invariant } from "ts-invariant";
import { type WithContext, type Product } from "schema-dts";
import {
	ProductDetailsDocument,
	ProductListDocument,
	CheckoutFindDocument,
	CheckoutAddLinesDocument,
} from "@/gql/graphql";
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

	// Server action for adding to cart
	async function addItem(formData: FormData) {
		"use server";

		const variantId = formData.get("variantId") as string;
		const quantity = parseInt(formData.get("quantity") as string) || 1;
		// Use channel from form so action works even when page was cached with different params
		const channel = (formData.get("channel") as string) || params.channel;

		if (!variantId) {
			return { success: false, error: "Variant ID is required" };
		}

		try {
			// Light-weight checkout resolution: prefer cookie, fallback to create
			// This avoids the heavy findOrCreate logic in the critical path
			let checkoutId = await Checkout.getIdFromCookies(channel);
			let currentCheckout: any = null;

			if (checkoutId) {
				const result = await executeGraphQL(CheckoutFindDocument, {
					variables: { id: checkoutId },
					cache: "no-cache",
				});
				currentCheckout = result.checkout;
			}

			if (!currentCheckout) {
				const result = await Checkout.create({ channel });
				currentCheckout = result.checkoutCreate?.checkout;
				if (currentCheckout) {
					checkoutId = currentCheckout.id;
					await Checkout.saveIdToCookie(channel, checkoutId);
				}
			}

			if (!currentCheckout) {
				return { success: false, error: "Could not create or find cart" };
			}

			const decodedVariantId = decodeURIComponent(variantId);
			const existingLine = currentCheckout?.lines?.find(
				(line: any) => line.variant?.id === decodedVariantId && !(line as { isGift?: boolean }).isGift
			);

			// If item is already in cart as a non-gift line, add to existing quantity.
			// If the only match is a gift line, we add a new line (same product as gift + normal).
			if (existingLine) {
				try {
					const newQuantity = existingLine.quantity + quantity;
					const checkoutLinesUpdateMutation = {
						toString: () => `mutation checkoutLinesUpdate(
							$checkoutId: ID!
							$lines: [CheckoutLineUpdateInput!]!
						) {
							checkoutLinesUpdate(id: $checkoutId, lines: $lines) {
								errors { message field code }
								checkout { id lines { id quantity variant { id } } }
							}
						}`,
					} as any;
					
					const result = await executeGraphQL(checkoutLinesUpdateMutation, {
						variables: {
							checkoutId: currentCheckout.id,
							lines: [{ lineId: existingLine.id, quantity: newQuantity }],
						},
						cache: "no-cache",
					});

					if (result.checkoutLinesUpdate?.errors?.length > 0) {
						return { success: false, error: result.checkoutLinesUpdate.errors[0].message ?? "Failed to update cart" };
					}
					if (!result.checkoutLinesUpdate?.checkout) {
						return { success: false, error: "Cart update did not return checkout" };
					}
				} catch (error: any) {
					console.error(`[Add Item] ❌ Failed to update quantity:`, error);
					revalidatePath(`/${channel}/products/${params.slug}`);
					return { success: false, error: error.message || "Failed to update cart" };
				}
			} else {
				try {
					const result = await executeGraphQL(CheckoutAddLinesDocument, {
						variables: {
							id: currentCheckout.id,
							lines: [{ variantId: decodedVariantId, quantity }],
						},
						cache: "no-cache",
					});

					const addResult = result.checkoutLinesAdd;
					if (addResult?.errors?.length > 0) {
						const msg = addResult.errors[0].message ?? addResult.errors[0].code ?? "Failed to add item to cart";
						return { success: false, error: msg };
					}
					if (!addResult?.checkout) {
						return { success: false, error: "Could not add item to cart. Please try again." };
					}
				} catch (error: any) {
					console.error(`[Add Item] ❌ Failed to add line:`, error);
					revalidatePath(`/${channel}/products/${params.slug}`);
					return { success: false, error: error.message || "Failed to add item to cart" };
				}
			}

			revalidatePath("/cart");
			revalidatePath(`/${channel}/products/${params.slug}`);

			// Persist to user metadata in background
			const { getCurrentUser, saveUserCheckoutId } = await import("@/lib/checkout");
			void getCurrentUser().then((currentUser) => {
				if (!currentUser?.id) return;
				const checkoutUser = (currentCheckout as { user?: { id: string } | null })?.user?.id;
				if (checkoutUser === currentUser.id) {
					return saveUserCheckoutId(currentUser.id, channel, currentCheckout.id);
				}
				return import("@/gql/graphql").then(({ CheckoutCustomerAttachDocument }) =>
					executeGraphQL(CheckoutCustomerAttachDocument, {
						variables: { checkoutId: currentCheckout.id },
						cache: "no-cache",
					}).then(() =>
						saveUserCheckoutId(currentUser.id, channel, currentCheckout.id)
					)
				).catch(() => {});
			}).catch(() => {});

			return { success: true };
		} catch (error: any) {
			const errorMessage = error?.message || "Failed to add item to cart";
			return { success: false, error: errorMessage };
		}
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
				addItemAction={addItem}
			/>
		</>
	);
}
