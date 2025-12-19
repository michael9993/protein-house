import * as Checkout from "@/lib/checkout";
import { formatMoney } from "@/lib/utils";
import { executeGraphQL } from "@/lib/graphql";
import { CheckoutDeleteLinesDocument, CheckoutAddLinesDocument, CheckoutCreateWithLinesDocument } from "@/gql/graphql";
import { storeConfig } from "@/config";
import { CartClient } from "./CartClient";
import { revalidatePath } from "next/cache";

export const metadata = {
	title: `Shopping Cart | ${storeConfig.store.name}`,
	description: "Review your shopping cart",
};

export default async function Page(props: { params: Promise<{ channel: string }> }) {
	const params = await props.params;
	const checkoutId = await Checkout.getIdFromCookies(params.channel);
	const checkout = await Checkout.find(checkoutId);

	// Server action for deleting lines
	async function deleteLineAction(lineId: string) {
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
		
		revalidatePath("/cart");
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
				quantityAvailable: 99, // Default since it's not in the query
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
		<CartClient
			cart={cartData}
			channel={params.channel}
			deleteLineAction={deleteLineAction}
			createCheckoutWithItems={createCheckoutWithItems}
		/>
	);
}
