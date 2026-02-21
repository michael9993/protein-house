import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { invariant } from "ts-invariant";
import { OrderByIdDocument, CheckoutAddLinesDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getLanguageCodeForChannel } from "@/lib/language";
import * as Checkout from "@/lib/checkout";
import { OrderDetailsClient } from "./OrderDetailsClient";

import { fetchStorefrontConfig } from "@/lib/storefront-control";

export async function generateMetadata({ params }: { params: Promise<{ channel: string; orderId: string }> }) {
	const { channel } = await params;
	const config = await fetchStorefrontConfig(channel);
	const storeName = config.store?.name || "Store";
	const orderLabel = config.content?.orders?.orderLabel || "Order Details";
	return {
		title: `${orderLabel} | ${storeName}`,
		description: config.content?.orders?.trackOrder || "View your order details and tracking information.",
		robots: { index: false, follow: false },
	};
}

export default async function OrderDetailPage({
	params,
}: {
	params: Promise<{ channel: string; orderId: string }>;
}) {
	const { channel, orderId } = await params;

	const languageCode = getLanguageCodeForChannel(channel);

	const { order } = await executeGraphQL(OrderByIdDocument, {
		variables: { id: orderId, languageCode },
		cache: "no-cache",
	});

	if (!order) {
		notFound();
	}

	// Extract order lines for reordering
	const orderLinesForReorder = (order.lines || [])
		.filter((line) => line.variant?.id)
		.map((line) => ({
			variantId: line.variant!.id,
			quantity: line.quantity,
			productName: line.productName || "Unknown Product",
		}));

	// Server action for reordering
	async function reorderItems(formData: FormData): Promise<{ success: boolean; error?: string; itemsAdded?: number }> {
		"use server";

		try {
			const linesJson = formData.get("lines") as string;
			const channelSlug = formData.get("channel") as string;
			const lines = JSON.parse(linesJson) as Array<{ variantId: string; quantity: number; productName: string }>;

			if (lines.length === 0) {
				return { success: false, error: "No items to reorder" };
			}

			if (!channelSlug) {
				return { success: false, error: "Channel not specified" };
			}

			// Get or create checkout
			const checkout = await Checkout.findOrCreate({
				checkoutId: await Checkout.getIdFromCookies(channelSlug),
				channel: channelSlug,
			});
			invariant(checkout, "Failed to create checkout");

			await Checkout.saveIdToCookie(channelSlug, checkout.id);

			// Format lines for the mutation
			const checkoutLines = lines.map((line) => ({
				variantId: line.variantId,
				quantity: line.quantity,
			}));

			// Add all lines at once
			const { checkoutLinesAdd } = await executeGraphQL(CheckoutAddLinesDocument, {
				variables: {
					id: checkout.id,
					lines: checkoutLines,
					languageCode: getLanguageCodeForChannel(channelSlug),
				},
				cache: "no-cache",
			});

			if (checkoutLinesAdd?.errors && checkoutLinesAdd.errors.length > 0) {
				const errorMessage = checkoutLinesAdd.errors
					.map((e) => e.message)
					.filter(Boolean)
					.join(", ");
				return { success: false, error: errorMessage || "Failed to add items to cart" };
			}

			revalidatePath("/cart");
			
			const itemsAdded = lines.reduce((sum, line) => sum + line.quantity, 0);
			return { success: true, itemsAdded };
		} catch (error) {
			console.error("Reorder error:", error);
			return { success: false, error: "An unexpected error occurred" };
		}
	}

	return (
		<OrderDetailsClient
			order={order}
			channel={channel}
			orderLinesForReorder={orderLinesForReorder}
			reorderAction={reorderItems}
		/>
	);
}

