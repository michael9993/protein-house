"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { buildAddressSchema } from "../schemas";
import { getFilteredAddressFields, getRequiredAddressFields } from "@/lib/checkout/address-utils";
import type { AddressField } from "@/lib/checkout/address-types";
import { getAddressValidationRules, type AddressValidationResult } from "../_actions/get-address-validation-rules";

interface AddressValidationState {
	/** Dynamic Zod schema built from Saleor's validation rules */
	schema: ReturnType<typeof buildAddressSchema>;
	/** Fields to show (ordered per Saleor rules) */
	orderedFields: AddressField[];
	/** Which fields are required for this country */
	requiredFields: AddressField[];
	/** Postal code regex pattern (for client-side hint) */
	postalCodePattern: string | null;
	/** True while validation rules are loading */
	loading: boolean;
}

/**
 * Fetches Saleor's `addressValidationRules` for the given country and builds
 * a dynamic Zod schema with country-specific required fields and postal code format.
 * Uses a server action to fetch rules — works in App Router context (no urql needed).
 */
export function useAddressValidation(countryCode: string): AddressValidationState {
	const [rules, setRules] = useState<AddressValidationResult | null>(null);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		if (!countryCode) return;
		startTransition(async () => {
			const data = await getAddressValidationRules(countryCode);
			setRules(data);
		});
	}, [countryCode]);

	const orderedFields = useMemo(
		() => getFilteredAddressFields(rules?.allowedFields as AddressField[] | undefined ?? []),
		[rules?.allowedFields],
	);

	const requiredFields = useMemo(
		() => getRequiredAddressFields(rules?.requiredFields as AddressField[] | undefined ?? []),
		[rules?.requiredFields],
	);

	const postalCodePattern: string | null = rules?.postalCodeMatchers?.[0] ?? null;

	const schema = useMemo(
		() =>
			buildAddressSchema({
				requiredFields,
				postalCodePattern,
			}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[requiredFields.join(","), postalCodePattern],
	);

	return {
		schema,
		orderedFields,
		requiredFields,
		postalCodePattern,
		loading: isPending,
	};
}

/**
 * Checks whether a field is required for the given country's validation rules.
 */
export function isAddressFieldRequired(field: AddressField, requiredFields: AddressField[]): boolean {
	return requiredFields.includes(field);
}

/**
 * Default fields shown before validation rules load.
 * Shows a complete form rather than empty during loading.
 */
export const DEFAULT_SHOWN_FIELDS: AddressField[] = [
	"firstName",
	"lastName",
	"streetAddress1",
	"streetAddress2",
	"city",
	"postalCode",
	"countryArea",
	"phone",
];
