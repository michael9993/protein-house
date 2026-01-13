import edjsHTML from "editorjs-html";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import xss from "xss";
import { invariant } from "ts-invariant";
import { type WithContext, type Product } from "schema-dts";
import { ProductDetailsDocument, ProductListDocument } from "@/gql/graphql";
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

		if (!variantId) {
			return { success: false, error: "Variant ID is required" };
		}

		try {
			const checkout = await Checkout.findOrCreate({
				checkoutId: await Checkout.getIdFromCookies(params.channel),
				channel: params.channel,
			});
			invariant(checkout, "This should never happen");

			await Checkout.saveIdToCookie(params.channel, checkout.id);

			// Check if item is already in cart - Saleor reserves stock when items are added
			// If item is already in cart, we need to update quantity instead of adding new lines
			const { CheckoutFindDocument } = await import("@/gql/graphql");
			const { checkout: currentCheckout } = await executeGraphQL(CheckoutFindDocument, {
				variables: { id: checkout.id },
				cache: "no-cache",
			});
			
			const existingLine = currentCheckout?.lines?.find(
				(line: any) => line.variant?.id === decodeURIComponent(variantId)
			);
			
			// Log warehouse and channel info for debugging stock allocation
			const checkoutAny = currentCheckout as any;
			console.log(`[Add Item] Checkout Info (Warehouse Debug):`, {
				checkoutId: checkout.id,
				channel: currentCheckout?.channel?.slug || params.channel,
				channelId: checkoutAny?.channel?.id,
				country: checkoutAny?.country?.code || checkoutAny?.shippingAddress?.country?.code || "Not set",
				shippingAddress: checkoutAny?.shippingAddress ? {
					country: checkoutAny.shippingAddress.country?.code,
				} : null,
				collectionPoint: checkoutAny?.collectionPoint ? {
					id: checkoutAny.collectionPoint.id,
					name: checkoutAny.collectionPoint.name,
				} : null,
				note: "Warehouse allocation depends on channel, country, and shipping address. Make sure the warehouse with stock is assigned to this channel.",
			});
			
			console.log(`[Add Item] Checking existing lines...`, {
				checkoutId: checkout.id,
				variantId: decodeURIComponent(variantId),
				existingLine: existingLine ? {
					id: existingLine.id,
					quantity: existingLine.quantity,
					variantId: existingLine.variant?.id,
				} : null,
				totalLines: currentCheckout?.lines?.length || 0,
				requestedQuantity: quantity,
			});

			// If item is already in cart, add to existing quantity
			if (existingLine) {
				try {
					// Add the requested quantity to the existing quantity
					const newQuantity = existingLine.quantity + quantity;
					console.log(`[Add Item] Item already in cart, adding ${quantity} to existing ${existingLine.quantity} = ${newQuantity}`);
					
					// Use inline GraphQL mutation for updating checkout lines
					// The mutation is defined as a string since graphql-tag is not available in production
					const checkoutLinesUpdateMutation = {
						toString: () => `mutation checkoutLinesUpdate(
							$checkoutId: ID!
							$lines: [CheckoutLineUpdateInput!]!
						) {
							checkoutLinesUpdate(id: $checkoutId, lines: $lines) {
								errors {
									message
									field
									code
								}
								checkout {
									id
									lines {
										id
										quantity
										variant {
											id
										}
									}
								}
							}
						}`,
					} as any;
					
					await executeGraphQL(checkoutLinesUpdateMutation, {
						variables: {
							checkoutId: checkout.id,
							lines: [{
								lineId: existingLine.id,
								quantity: newQuantity,
							}],
						},
						cache: "no-cache",
					});
					
					console.log(`[Add Item] ✅ Successfully updated quantity in cart`);
				} catch (error: any) {
					console.error(`[Add Item] ❌ Failed to update quantity:`, error);
					// Handle GraphQL errors
					if (error instanceof Error && (error.name === "GraphQLError" || error.constructor?.name === "GraphQLError")) {
						// Log detailed error information
						console.error("[Add Item] GraphQL Error Details (Update):", {
							errorName: error.name,
							errorMessage: error.message,
							errorResponse: (error as any).errorResponse,
							fullError: error,
						});
						
						let errorMessage = error.message || "Failed to update item quantity in cart";
						
						// Check if errorResponse has more details
						if ((error as any).errorResponse?.errors) {
							const errors = (error as any).errorResponse.errors;
							console.error("[Add Item] GraphQL Error Array (Update):", errors);
							
							const firstError = errors[0];
							if (firstError) {
								errorMessage = firstError.message || errorMessage;
								
								if (firstError.code === "INSUFFICIENT_STOCK" || firstError.extensions?.code === "INSUFFICIENT_STOCK") {
									errorMessage = "Sorry, there isn't enough stock available. The item may already be in your cart or someone else may have purchased it.";
								}
							}
						}
						
						if (errorMessage.includes("Insufficient stock") || errorMessage.includes("insufficient") || errorMessage.toLowerCase().includes("stock")) {
							// Check if the error mentions a specific size
							const sizeMatch = errorMessage.match(/for (\d+)/);
							if (sizeMatch) {
								const size = sizeMatch[1];
								errorMessage = `Sorry, size ${size} is no longer available. The stock may have been purchased or reserved. Please try a different size or refresh the page to see updated availability.`;
							} else {
								errorMessage = "Sorry, there isn't enough stock available. The item may already be in your cart or someone else may have purchased it. Please refresh the page to see updated availability.";
							}
						}
						
						// Revalidate the product page to refresh stock data
						revalidatePath(`/${params.channel}/products/${params.slug}`);
						
						return { success: false, error: errorMessage };
					}
					throw error;
				}
			} else {
				// Add line with the requested quantity (all at once, not one by one)
				try {
					const { CheckoutAddLinesDocument } = await import("@/gql/graphql");
					await executeGraphQL(CheckoutAddLinesDocument, {
						variables: {
							id: checkout.id,
							lines: [{
								variantId: decodeURIComponent(variantId),
								quantity: quantity,
							}],
						},
						cache: "no-cache",
					});
					
					console.log(`[Add Item] ✅ Successfully added ${quantity} item(s) to cart`);
				} catch (error: any) {
					// Handle GraphQL errors (e.g., insufficient stock)
					// GraphQLError has name "GraphQLError" and contains errorResponse.errors
					if (error instanceof Error && (error.name === "GraphQLError" || error.constructor?.name === "GraphQLError")) {
						// Log detailed error information
						console.error("[Add Item] GraphQL Error Details:", {
							errorName: error.name,
							errorMessage: error.message,
							errorResponse: (error as any).errorResponse,
							fullError: error,
						});
						
						// Extract error message from GraphQL error
						let errorMessage = error.message || "Failed to add item to cart";
						
						// Check if errorResponse has more details
						if ((error as any).errorResponse?.errors) {
							const errors = (error as any).errorResponse.errors;
							console.error("[Add Item] GraphQL Error Array:", errors);
							
							// Try to get more specific error message
							const firstError = errors[0];
							if (firstError) {
								errorMessage = firstError.message || errorMessage;
								
								// Check for specific error codes
								if (firstError.code === "INSUFFICIENT_STOCK" || firstError.extensions?.code === "INSUFFICIENT_STOCK") {
									errorMessage = "Sorry, this item is no longer available in the requested quantity. Please reduce the quantity or choose a different size.";
								}
							}
						}
						
						// Make error message more user-friendly
						if (errorMessage.includes("Insufficient stock") || errorMessage.includes("insufficient") || errorMessage.toLowerCase().includes("stock")) {
							// Check if the error mentions a specific size (e.g., "Insufficient stock for 45")
							const sizeMatch = errorMessage.match(/for (\d+)/);
							if (sizeMatch) {
								const size = sizeMatch[1];
								errorMessage = `Sorry, size ${size} is not available in the warehouse for this channel. The stock may be in a different warehouse or the warehouse may not be assigned to this channel. Please check your Saleor warehouse configuration or try a different size.`;
							} else {
								errorMessage = "Sorry, this item is not available in the warehouse for this channel. The stock may be in a different warehouse or the warehouse may not be assigned to this channel. Please check your Saleor warehouse configuration.";
							}
						}
						
						// Revalidate the product page to refresh stock data
						// params is already resolved in the outer scope
						revalidatePath(`/${params.channel}/products/${params.slug}`);
						
						return { success: false, error: errorMessage };
					}
					
					// Log other errors
					console.error("[Add Item] Non-GraphQL Error:", error);
					// Re-throw other errors
					throw error;
				}
			}

			// CRITICAL: Re-fetch checkout after adding items to get updated state
			// Then ensure checkout is saved to user metadata if user is logged in
			const { getCurrentUser, saveUserCheckoutId } = await import("@/lib/checkout");
			// CheckoutFindDocument is already imported above, reuse it
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
						const updatedCheckoutAny = updatedCheckout as any;
						console.log(`[Add Item]    - Updated checkout user: ${updatedCheckoutAny.user?.id || "none"}`);
						console.log(`[Add Item]    - Updated checkout lines: ${updatedCheckout.lines?.length || 0}`);
						
						if (updatedCheckoutAny.user?.id === currentUser.id) {
							await saveUserCheckoutId(currentUser.id, params.channel, updatedCheckout.id);
							console.log(`[Add Item] ✅ Saved checkout ${updatedCheckout.id} to user metadata (key: checkoutId-${params.channel})`);
							console.log(`[Add Item]    This ensures cart will be restored on next login and syncs across devices`);
						} else {
							const updatedCheckoutAny = updatedCheckout as any;
							console.log(`[Add Item] ⚠️  Warning: Checkout ${updatedCheckout.id} not attached to user ${currentUser.id}`);
							console.log(`[Add Item]    - Expected user: ${currentUser.id}`);
							console.log(`[Add Item]    - Checkout user: ${updatedCheckoutAny.user?.id || "none"}`);
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
								const attachedCheckoutAny = attachedCheckout as any;
								if (attachedCheckout && attachedCheckoutAny.user?.id === currentUser.id) {
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
					const checkoutAny = checkout as any;
					if (checkoutAny.user?.id === currentUser.id) {
						await saveUserCheckoutId(currentUser.id, params.channel, checkout.id);
						console.log(`[Add Item] ✅ Saved checkout ${checkout.id} (fallback - using original checkout)`);
					}
				}
			} else {
				console.log(`[Add Item] ℹ️  User not logged in - checkout not saved to user cookie (guest cart)`);
			}

			// Revalidate both cart and product page to update stock in real-time
			revalidatePath("/cart");
			revalidatePath(`/${params.channel}/products/${params.slug}`);
			console.log(`[Add Item] ✅ Revalidated product page: /${params.channel}/products/${params.slug}`);
			return { success: true };
		} catch (error: any) {
			// Handle any other errors
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
				}}
				selectedVariantId={selectedVariantID}
				channel={params.channel}
				addItemAction={addItem}
			/>
		</>
	);
}
