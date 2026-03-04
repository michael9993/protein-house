"use server";

import { executeGraphQL } from "@/lib/graphql";
import {
	AccountAddressUpdateDocument,
	type AddressInput,
	CountryCode,
} from "@/gql/graphql";
import type { AddressFormValues } from "../schemas";

interface UpdateUserAddressResult {
	address: {
		id: string;
		firstName: string | null;
		lastName: string | null;
		companyName: string | null;
		streetAddress1: string | null;
		streetAddress2: string | null;
		city: string | null;
		cityArea: string | null;
		postalCode: string | null;
		country: { code: string } | null;
		countryArea: string | null;
		phone: string | null;
		isDefaultShippingAddress: boolean;
		isDefaultBillingAddress: boolean;
	} | null;
	errors: { field: string | null; message: string | null; code: string }[];
}

/**
 * Update an existing address on the user's account.
 */
export async function updateUserAddress(
	addressId: string,
	address: AddressFormValues,
): Promise<UpdateUserAddressResult> {
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

	const result = await executeGraphQL(AccountAddressUpdateDocument, {
		variables: { id: addressId, input: addressInput },
		revalidate: 0,
	});

	const data = result.accountAddressUpdate;
	const errors = (data?.errors ?? []).map((e) => ({
		field: e.field ?? null,
		message: e.message ?? null,
		code: e.code as string,
	}));

	return {
		address: data?.address
			? {
					id: data.address.id,
					firstName: data.address.firstName,
					lastName: data.address.lastName,
					companyName: data.address.companyName,
					streetAddress1: data.address.streetAddress1,
					streetAddress2: data.address.streetAddress2,
					city: data.address.city,
					cityArea: data.address.cityArea,
					postalCode: data.address.postalCode,
					country: data.address.country ? { code: data.address.country.code } : null,
					countryArea: data.address.countryArea,
					phone: data.address.phone ?? null,
					isDefaultShippingAddress: data.address.isDefaultShippingAddress ?? false,
					isDefaultBillingAddress: data.address.isDefaultBillingAddress ?? false,
				}
			: null,
		errors,
	};
}
