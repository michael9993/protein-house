"use server";

import { revalidatePath } from "next/cache";
import { executeGraphQL } from "@/lib/graphql";
import { CheckoutCompleteDocument } from "@/gql/graphql";

interface CompleteCheckoutResult {
	orderId: string | null;
	errors: { field: string | null; message: string | null; code: string }[];
}

export async function completeCheckout(
	checkoutId: string,
): Promise<CompleteCheckoutResult> {
	// Defense-in-depth: validate checkoutId format before sending to GraphQL
	if (!checkoutId || typeof checkoutId !== "string" || checkoutId.length > 512) {
		return { orderId: null, errors: [{ field: "checkoutId", message: "Invalid checkout ID", code: "INVALID" }] };
	}

	const result = await executeGraphQL(CheckoutCompleteDocument, {
		variables: { checkoutId },
		revalidate: 0,
	});

	const cc = result.checkoutComplete;
	const errors = (cc?.errors ?? []).map((e) => ({
		field: e.field ?? null,
		message: e.message ?? null,
		code: e.code as string,
	}));

	// Try to extract orderId even when errors exist (Saleor sometimes returns both)
	const orderId = cc?.order?.id ?? null;

	// Bust the Data Cache after a purchase — inventory/stock may have changed
	if (orderId) {
		revalidatePath("/", "layout");
	}

	return { orderId, errors };
}
