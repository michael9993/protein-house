"use server";

import { executeGraphQL } from "@/lib/graphql";
import {
	CheckoutDeliveryMethodUpdateDocument,
} from "@/gql/graphql";

interface UpdateDeliveryMethodResult {
	checkout: {
		id: string;
		shippingMethod: {
			id: string;
			name: string;
			price: { amount: number; currency: string };
			minimumDeliveryDays: number | null;
			maximumDeliveryDays: number | null;
		} | null;
		shippingPrice: { gross: { amount: number; currency: string } };
		totalPrice: { gross: { amount: number; currency: string } };
	} | null;
	errors: { field: string | null; message: string | null; code: string }[];
}

export async function updateDeliveryMethod(
	checkoutId: string,
	deliveryMethodId: string,
): Promise<UpdateDeliveryMethodResult> {
	const result = await executeGraphQL(CheckoutDeliveryMethodUpdateDocument, {
		variables: {
			id: checkoutId,
			deliveryMethodId,
		},
		revalidate: 0,
	});

	const errors = (result.checkoutDeliveryMethodUpdate?.errors ?? []).map((e) => ({
		field: e.field ?? null,
		message: e.message ?? null,
		code: e.code as string,
	}));

	const checkout = result.checkoutDeliveryMethodUpdate?.checkout ?? null;

	return {
		checkout: checkout
			? {
					id: checkout.id,
					shippingMethod: checkout.shippingMethod
						? {
								id: checkout.shippingMethod.id,
								name: checkout.shippingMethod.name,
								price: {
									amount: checkout.shippingMethod.price.amount,
									currency: checkout.shippingMethod.price.currency,
								},
								minimumDeliveryDays: checkout.shippingMethod.minimumDeliveryDays ?? null,
								maximumDeliveryDays: checkout.shippingMethod.maximumDeliveryDays ?? null,
							}
						: null,
					shippingPrice: {
						gross: {
							amount: checkout.shippingPrice.gross.amount,
							currency: checkout.shippingPrice.gross.currency,
						},
					},
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
