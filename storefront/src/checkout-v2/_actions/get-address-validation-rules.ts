"use server";

import { executeGraphQL } from "@/lib/graphql";
import { AddressValidationRulesDocument, CountryCode } from "@/gql/graphql";

export interface AddressValidationResult {
	addressFormat: string;
	allowedFields: string[];
	requiredFields: string[];
	countryAreaType: string;
	postalCodeType: string;
	cityType: string;
	postalCodeMatchers: string[];
	countryAreaChoices: { raw?: string | null; verbose?: string | null }[];
}

export async function getAddressValidationRules(
	countryCode: string,
): Promise<AddressValidationResult | null> {
	try {
		const result = await executeGraphQL(AddressValidationRulesDocument, {
			variables: { countryCode: countryCode as CountryCode },
			revalidate: 3600, // Cache for 1 hour — rules don't change often
		});
		return result.addressValidationRules ?? null;
	} catch {
		return null;
	}
}
