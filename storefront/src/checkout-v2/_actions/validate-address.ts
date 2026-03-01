"use server";

import type { AddressFormValues } from "../schemas";
import type { AddressSuggestion } from "../types";

/**
 * Google Address Validation API — Layer 3 validation.
 * Verifies address actually exists (soft validation — user can skip).
 * API key is server-side only (GOOGLE_ADDRESS_VALIDATION_API_KEY).
 */
export async function validateAddressExists(
	address: AddressFormValues,
): Promise<AddressSuggestion> {
	const apiKey = process.env.GOOGLE_ADDRESS_VALIDATION_API_KEY;

	// If no API key configured, skip validation
	if (!apiKey) {
		return { verdict: "CONFIRMED" };
	}

	try {
		const response = await fetch(
			`https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					address: {
						regionCode: address.countryCode,
						postalCode: address.postalCode,
						locality: address.city,
						administrativeArea: address.countryArea,
						addressLines: [address.streetAddress1, address.streetAddress2].filter(Boolean),
					},
				}),
				// 8s timeout — don't block checkout for slow validation
				signal: AbortSignal.timeout(8000),
			},
		);

		if (!response.ok) {
			// API error — skip validation rather than block checkout
			return { verdict: "CONFIRMED" };
		}

		const data = (await response.json()) as {
			result?: {
				verdict?: {
					validationGranularity?: string;
					addressComplete?: boolean;
				};
				address?: {
					formattedAddress?: string;
					postalAddress?: {
						regionCode?: string;
						postalCode?: string;
						locality?: string;
						administrativeArea?: string;
						addressLines?: string[];
					};
				};
			};
		};

		const granularity = data.result?.verdict?.validationGranularity ?? "";
		const addressComplete = data.result?.verdict?.addressComplete ?? false;

		// Map granularity to our verdict
		let verdict: AddressSuggestion["verdict"];
		if (
			addressComplete &&
			["PREMISE", "SUB_PREMISE", "ROUTE"].includes(granularity)
		) {
			verdict = "CONFIRMED";
		} else if (["BLOCK", "ROUTE", "BLOCK_GROUP"].includes(granularity)) {
			verdict = "UNCONFIRMED_BUT_PLAUSIBLE";
		} else {
			verdict = "UNCONFIRMED";
		}

		// Build suggested address if available
		const postal = data.result?.address?.postalAddress;
		const suggestedAddress: AddressFormValues | undefined = postal
			? {
					firstName: address.firstName,
					lastName: address.lastName,
					companyName: address.companyName,
					streetAddress1: postal.addressLines?.[0] ?? address.streetAddress1,
					streetAddress2: postal.addressLines?.[1] ?? address.streetAddress2,
					city: postal.locality ?? address.city,
					cityArea: address.cityArea,
					countryCode: postal.regionCode ?? address.countryCode,
					countryArea: postal.administrativeArea ?? address.countryArea,
					postalCode: postal.postalCode ?? address.postalCode,
					phone: address.phone,
				}
			: undefined;

		return {
			verdict,
			suggestedAddress,
			formattedAddress: data.result?.address?.formattedAddress,
		};
	} catch {
		// Network error or timeout — skip validation
		return { verdict: "CONFIRMED" };
	}
}
