"use server";

import { executeGraphQL } from "@/lib/graphql";
import {
	CheckoutShippingAddressUpdateDocument,
	type AddressInput,
	CountryCode,
} from "@/gql/graphql";
import type { AddressFormValues } from "../schemas";

interface UpdateShippingAddressResult {
	checkout: {
		id: string;
		shippingMethods: {
			id: string;
			name: string;
			price: { amount: number; currency: string };
			minimumDeliveryDays: number | null;
			maximumDeliveryDays: number | null;
		}[];
	} | null;
	errors: { field: string | null; message: string | null; code: string }[];
}

export async function updateShippingAddress(
	checkoutId: string,
	address: AddressFormValues,
): Promise<UpdateShippingAddressResult> {
	const addressInput: AddressInput = {
		firstName: address.firstName,
		lastName: address.lastName,
		companyName: address.companyName || undefined,
		streetAddress1: address.streetAddress1,
		streetAddress2: address.streetAddress2 || undefined,
		city: address.city,
		cityArea: address.cityArea || undefined,
		country: address.countryCode as CountryCode,
		countryArea: address.countryArea || undefined,
		postalCode: address.postalCode || undefined,
		phone: address.phone || undefined,
	};

	const result = await executeGraphQL(CheckoutShippingAddressUpdateDocument, {
		variables: {
			id: checkoutId,
			shippingAddress: addressInput,
			validationRules: {
				checkRequiredFields: true,
				checkFieldsFormat: true,
				enableFieldsNormalization: true,
			},
		},
		revalidate: 0,
	});

	const errors = (result.checkoutShippingAddressUpdate?.errors ?? []).map((e) => ({
		field: e.field ?? null,
		message: e.message ?? null,
		code: e.code as string,
	}));
	const checkout = result.checkoutShippingAddressUpdate?.checkout ?? null;

	return {
		checkout: checkout
			? {
					id: checkout.id,
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
