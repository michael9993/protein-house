"use server";

import { executeGraphQL } from "@/lib/graphql";
import { CheckoutLinesUpdateDocument } from "@/gql/graphql";

interface ShippingMethodData {
	id: string;
	name: string;
	price: { amount: number; currency: string };
	minimumDeliveryDays: number | null;
	maximumDeliveryDays: number | null;
}

interface LineData {
	id: string;
	quantity: number;
	totalPrice: { gross: { amount: number; currency: string } };
	variant: {
		id: string;
		product: { name: string };
		pricing: { price: { gross: { amount: number; currency: string } } | null } | null;
	};
}

interface UpdateLineQuantityResult {
	checkout: {
		id: string;
		lines: LineData[];
		subtotalPrice: { gross: { amount: number; currency: string } };
		totalPrice: { gross: { amount: number; currency: string } };
		shippingPrice: { gross: { amount: number; currency: string } } | null;
		shippingMethods: ShippingMethodData[];
	} | null;
	errors: { field: string | null; message: string | null; code: string }[];
}

export async function updateLineQuantity(
	checkoutId: string,
	lineId: string,
	quantity: number,
): Promise<UpdateLineQuantityResult> {
	const result = await executeGraphQL(CheckoutLinesUpdateDocument, {
		variables: {
			checkoutId,
			lines: [{ lineId, quantity }],
		},
		revalidate: 0,
	});

	const errors = (result.checkoutLinesUpdate?.errors ?? []).map((e) => ({
		field: e.field ?? null,
		message: e.message ?? null,
		code: e.code as string,
	}));

	const checkout = result.checkoutLinesUpdate?.checkout ?? null;

	return {
		checkout: checkout
			? {
					id: checkout.id,
					lines: checkout.lines.map((line) => ({
						id: line.id,
						quantity: line.quantity,
						totalPrice: {
							gross: {
								amount: line.totalPrice.gross.amount,
								currency: line.totalPrice.gross.currency,
							},
						},
						variant: {
							id: line.variant.id,
							product: { name: line.variant.product.name },
							pricing: line.variant.pricing
								? {
										price: line.variant.pricing.price
											? {
													gross: {
														amount: line.variant.pricing.price.gross.amount,
														currency: line.variant.pricing.price.gross.currency,
													},
												}
											: null,
									}
								: null,
						},
					})),
					subtotalPrice: {
						gross: {
							amount: checkout.subtotalPrice.gross.amount,
							currency: checkout.subtotalPrice.gross.currency,
						},
					},
					totalPrice: {
						gross: {
							amount: checkout.totalPrice.gross.amount,
							currency: checkout.totalPrice.gross.currency,
						},
					},
					shippingPrice: checkout.shippingPrice
						? {
								gross: {
									amount: checkout.shippingPrice.gross.amount,
									currency: checkout.shippingPrice.gross.currency,
								},
							}
						: null,
					shippingMethods: (checkout.shippingMethods ?? []).map((m) => ({
						id: m.id,
						name: m.name,
						price: { amount: m.price.amount, currency: m.price.currency },
						minimumDeliveryDays: m.minimumDeliveryDays ?? null,
						maximumDeliveryDays: m.maximumDeliveryDays ?? null,
					})),
				}
			: null,
		errors,
	};
}
