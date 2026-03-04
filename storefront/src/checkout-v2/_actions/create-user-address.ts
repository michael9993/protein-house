"use server";

import { executeGraphQL } from "@/lib/graphql";
import {
	AccountAddressCreateDocument,
	type AddressInput,
	type AddressTypeEnum,
	CountryCode,
} from "@/gql/graphql";
import type { AddressFormValues } from "../schemas";

interface CreateUserAddressResult {
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
 * Save an address to the user's account (not just the checkout).
 * This persists the address so it appears in their saved addresses list.
 */
export async function createUserAddress(
	address: AddressFormValues,
	type?: AddressTypeEnum,
): Promise<CreateUserAddressResult> {
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

	const result = await executeGraphQL(AccountAddressCreateDocument, {
		variables: { address: addressInput, type: type ?? null },
		revalidate: 0,
	});

	const data = result.accountAddressCreate;
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
