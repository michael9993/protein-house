"use server";

import { executeGraphQL } from "@/lib/graphql";
import { CheckoutAddPromoCodeDocument } from "@/gql/graphql";

interface ApplyPromoCodeResult {
	checkout: {
		id: string;
		voucherCode: string | null;
		discountName: string | null;
		discount: { amount: number; currency: string } | null;
		totalPrice: { gross: { amount: number; currency: string } };
	} | null;
	errors: { field: string | null; message: string | null; code: string }[];
}

export async function applyPromoCode(
	checkoutId: string,
	promoCode: string,
): Promise<ApplyPromoCodeResult> {
	// Defense-in-depth: validate inputs before sending to GraphQL
	if (!checkoutId || typeof checkoutId !== "string" || checkoutId.length > 512) {
		return { checkout: null, errors: [{ field: "checkoutId", message: "Invalid checkout ID", code: "INVALID" }] };
	}
	if (!promoCode || typeof promoCode !== "string" || promoCode.length > 100) {
		return { checkout: null, errors: [{ field: "promoCode", message: "Invalid promo code", code: "INVALID" }] };
	}

	const result = await executeGraphQL(CheckoutAddPromoCodeDocument, {
		variables: {
			checkoutId,
			promoCode,
		},
		revalidate: 0,
	});

	const errors = (result.checkoutAddPromoCode?.errors ?? []).map((e) => ({
		field: e.field ?? null,
		message: e.message ?? null,
		code: e.code as string,
	}));

	const checkout = result.checkoutAddPromoCode?.checkout ?? null;

	return {
		checkout: checkout
			? {
					id: checkout.id,
					voucherCode: checkout.voucherCode ?? null,
					discountName: checkout.discountName ?? null,
					discount: checkout.discount
						? { amount: checkout.discount.amount, currency: checkout.discount.currency }
						: null,
					totalPrice: {
						gross: {
							amount: checkout.totalPrice.gross.amount,
							currency: checkout.totalPrice.gross.currency,
						},
					},
				}
			: null,
		errors,
	};
}
