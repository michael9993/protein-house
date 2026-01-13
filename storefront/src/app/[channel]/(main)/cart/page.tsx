import * as Checkout from "@/lib/checkout";
import { executeGraphQL } from "@/lib/graphql";
import { CheckoutDeleteLinesDocument, CheckoutCreateWithLinesDocument } from "@/gql/graphql";
import { storeConfig } from "@/config";
import { CartClient } from "./CartClient";
import { CartRestoreTrigger } from "./CartRestoreTrigger";
import { revalidatePath } from "next/cache";

export const metadata = {
	title: `Shopping Cart | ${storeConfig.store.name}`,
	description: "Review your shopping cart",
};

export default async function Page(props: { params: Promise<{ channel: string }> }) {
	const params = await props.params;
	
	console.log(`[Cart Page] 🔍 Loading cart page for channel: ${params.channel}`);
	
	// Use resolveCheckout which handles:
	// - Restoring user's saved checkout on login
	// - Finding existing session checkout
	// - Creating new checkout if needed
	const { checkout } = await Checkout.resolveCheckout({ channel: params.channel });
	
	console.log(`[Cart Page] ✅ Checkout resolved: ${checkout?.id || "none"}, items: ${checkout?.lines?.length || 0}`);

	// Server action for deleting lines
	async function deleteLineAction(lineId: string, productSlug?: string) {
		"use server";
		
		const currentCheckoutId = await Checkout.getIdFromCookies(params.channel);
		if (!currentCheckoutId) return;
		
		await executeGraphQL(CheckoutDeleteLinesDocument, {
			variables: {
				checkoutId: currentCheckoutId,
				lineIds: [lineId],
			},
			cache: "no-cache",
		});
		
		// Revalidate cart page
		revalidatePath("/cart");
		
		// Revalidate product page if product slug is provided
		// This ensures stock information is updated after deletion
		// Saleor automatically releases stock allocation when lines are deleted
		if (productSlug) {
			revalidatePath(`/${params.channel}/products/${productSlug}`);
			console.log(`[Delete Line] ✅ Revalidated product page: /${params.channel}/products/${productSlug}`);
		}
	}

	// Server action for updating line quantity
	async function updateLineQuantityAction(lineId: string, quantity: number, productSlug?: string) {
		"use server";
		
		const currentCheckoutId = await Checkout.getIdFromCookies(params.channel);
		if (!currentCheckoutId) {
			return { success: false, error: "Cart not found" };
		}
		
		try {
			// Use inline GraphQL mutation for updating checkout lines
			const checkoutLinesUpdateMutation = {
				toString: () => `mutation checkoutLinesUpdate($checkoutId: ID!, $lines: [CheckoutLineUpdateInput!]!) {
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
					checkoutId: currentCheckoutId,
					lines: [{
						lineId: lineId,
						quantity: quantity,
					}],
				},
				cache: "no-cache",
			});
			
			// Revalidate cart page
			revalidatePath("/cart");
			
			// Revalidate product page if product slug is provided
			if (productSlug) {
				revalidatePath(`/${params.channel}/products/${productSlug}`);
			}
			
			return { success: true };
		} catch (error: any) {
			console.error("[Update Quantity] Error:", error);
			
			// Handle GraphQL errors
			if (error instanceof Error && (error.name === "GraphQLError" || error.constructor?.name === "GraphQLError")) {
				let errorMessage = error.message || "Failed to update quantity";
				
				if ((error as any).errorResponse?.errors) {
					const errors = (error as any).errorResponse.errors;
					const firstError = errors[0];
					if (firstError) {
						errorMessage = firstError.message || errorMessage;
						
						if (firstError.code === "INSUFFICIENT_STOCK" || firstError.extensions?.code === "INSUFFICIENT_STOCK") {
							errorMessage = "Sorry, there isn't enough stock available for this quantity.";
						}
					}
				}
				
				return { success: false, error: errorMessage };
			}
			
			return { success: false, error: "Failed to update quantity. Please try again." };
		}
	}

	// Server action for creating a temporary checkout with selected items only
	// This creates a separate checkout for the checkout flow but keeps the original cart intact
	async function createCheckoutWithItems(
		items: { variantId: string; quantity: number }[],
		channelSlug: string
	): Promise<{ checkoutId: string } | null> {
		"use server";

		try {
			if (items.length === 0) return null;
			if (!channelSlug) return null;

			// Create a NEW checkout specifically for this checkout session with the selected items
			const { checkoutCreate } = await executeGraphQL(CheckoutCreateWithLinesDocument, {
				variables: {
					channel: channelSlug,
					lines: items.map(item => ({
						variantId: item.variantId,
						quantity: item.quantity,
					})),
				},
				cache: "no-cache",
			});

			if (checkoutCreate?.errors && checkoutCreate.errors.length > 0) {
				console.error("Error creating checkout:", checkoutCreate.errors);
				return null;
			}

			const newCheckoutId = checkoutCreate?.checkout?.id;
			if (!newCheckoutId) {
				console.error("No checkout ID returned");
				return null;
			}

			// IMPORTANT: Do NOT save the new checkout ID to cookies
			// This keeps the original cart intact while creating a temporary checkout for purchase
			// The original cart items will remain available when user returns
			
			return { checkoutId: newCheckoutId };
		} catch (error) {
			console.error("Error creating checkout with items:", error);
			return null;
		}
	}

	// Transform checkout data for client component
	const cartData = checkout && checkout.lines ? {
		id: checkout.id,
		lines: checkout.lines.map(line => ({
			id: line.id,
			quantity: line.quantity,
			totalPrice: {
				gross: {
					amount: line.totalPrice.gross.amount,
					currency: line.totalPrice.gross.currency,
				},
			},
			// Unit price from variant pricing
			unitPrice: {
				gross: {
					amount: line.variant.pricing?.price?.gross.amount || (line.totalPrice.gross.amount / line.quantity),
					currency: line.variant.pricing?.price?.gross.currency || line.totalPrice.gross.currency,
				},
			},
			variant: {
				id: line.variant.id,
				name: line.variant.name,
				quantityAvailable: line.variant.quantityAvailable || 0,
				attributes: line.variant.attributes && line.variant.attributes.length > 0 ? line.variant.attributes : null,
				pricing: line.variant.pricing ? {
					price: line.variant.pricing.price ? {
						gross: {
							amount: line.variant.pricing.price.gross.amount,
							currency: line.variant.pricing.price.gross.currency,
						},
					} : null,
					priceUndiscounted: line.variant.pricing.priceUndiscounted ? {
						gross: {
							amount: line.variant.pricing.priceUndiscounted.gross.amount,
							currency: line.variant.pricing.priceUndiscounted.gross.currency,
						},
					} : null,
				} : null,
				product: {
					slug: line.variant.product.slug,
					name: line.variant.product.name,
					thumbnail: line.variant.product.thumbnail ? {
						url: line.variant.product.thumbnail.url,
						alt: line.variant.product.thumbnail.alt || null,
					} : null,
					category: line.variant.product.category ? {
						name: line.variant.product.category.name,
					} : null,
				},
			},
		})),
		totalPrice: {
			gross: {
				amount: checkout.totalPrice.gross.amount,
				currency: checkout.totalPrice.gross.currency,
			},
		},
		// Use totalPrice as subtotal since we don't have separate subtotalPrice
		subtotalPrice: {
			gross: {
				amount: checkout.totalPrice.gross.amount,
				currency: checkout.totalPrice.gross.currency,
			},
		},
	} : null;

	return (
		<>
			{/* Client component to trigger cart restore when visiting cart page */}
			{/* This ensures the user's saved cart is restored even if they didn't come from OAuth redirect */}
			<CartRestoreTrigger channel={params.channel} />
			<CartClient
				cart={cartData as any}
				channel={params.channel}
				deleteLineAction={deleteLineAction}
				updateLineQuantityAction={updateLineQuantityAction}
				createCheckoutWithItems={createCheckoutWithItems}
			/>
		</>
	);
}
