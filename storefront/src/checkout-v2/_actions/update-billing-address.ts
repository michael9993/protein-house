"use server";

import { executeGraphQL } from "@/lib/graphql";
import {
	CheckoutBillingAddressUpdateDocument,
	type AddressInput,
	CountryCode,
} from "@/gql/graphql";
import type { AddressFormValues } from "../schemas";

interface UpdateBillingAddressResult {
	errors: { field: string | null; message: string | null; code: string }[];
}

export async function updateBillingAddress(
	checkoutId: string,
	address: AddressFormValues,
): Promise<UpdateBillingAddressResult> {
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

	const result = await executeGraphQL(CheckoutBillingAddressUpdateDocument, {
		variables: {
			id: checkoutId,
			billingAddress: addressInput,
			validationRules: {
				checkRequiredFields: true,
				checkFieldsFormat: true,
				enableFieldsNormalization: true,
			},
		},
		revalidate: 0,
	});

	const errors = (result.checkoutBillingAddressUpdate?.errors ?? []).map((e) => ({
		field: e.field ?? null,
		message: e.message ?? null,
		code: e.code as string,
	}));
	return { errors };
}
