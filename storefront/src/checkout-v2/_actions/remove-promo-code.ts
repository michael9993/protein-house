"use server";

import { executeGraphQL } from "@/lib/graphql";
import { CheckoutRemovePromoCodeDocument } from "@/gql/graphql";

interface RemovePromoCodeResult {
	checkout: {
		id: string;
		voucherCode: string | null;
		discount: { amount: number; currency: string } | null;
		totalPrice: { gross: { amount: number; currency: string } };
	} | null;
	errors: { field: string | null; message: string | null; code: string }[];
}

/** Remove a voucher by code, or a gift card by its ID */
export async function removePromoCode(
	checkoutId: string,
	{ promoCode, promoCodeId }: { promoCode?: string; promoCodeId?: string },
): Promise<RemovePromoCodeResult> {
	const result = await executeGraphQL(CheckoutRemovePromoCodeDocument, {
		variables: {
			checkoutId,
			promoCode,
			promoCodeId,
		},
		revalidate: 0,
	});

	const errors = (result.checkoutRemovePromoCode?.errors ?? []).map((e) => ({
		field: e.field ?? null,
		message: e.message ?? null,
		code: e.code as string,
	}));

	const checkout = result.checkoutRemovePromoCode?.checkout ?? null;

	return {
		checkout: checkout
			? {
					id: checkout.id,
					voucherCode: checkout.voucherCode ?? null,
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
