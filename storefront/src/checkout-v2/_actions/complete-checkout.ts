"use server";

import { executeGraphQL } from "@/lib/graphql";
import { CheckoutCompleteDocument } from "@/gql/graphql";

interface CompleteCheckoutResult {
	orderId: string | null;
	errors: { field: string | null; message: string | null; code: string }[];
}

export async function completeCheckout(
	checkoutId: string,
): Promise<CompleteCheckoutResult> {
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

	return { orderId, errors };
}
