import camelCase from "lodash-es/camelCase";
import { useCallback, useMemo } from "react";
import {
	type CountryCode,
	useAddressValidationRulesQuery,
	type ValidationRulesFragment,
} from "@/checkout/graphql";
import { type OptionalAddress, type AddressField } from "@/checkout/components/AddressForm/types";
import { defaultCountry } from "@/checkout/lib/consts/countries";
import { getOrderedAddressFields, getRequiredAddressFields } from "@/checkout/components/AddressForm/utils";
import { useCheckoutText } from "@/checkout/hooks/useCheckoutText";

export type AddressFieldLabel = Exclude<AddressField, "countryCode"> | "country";

export type LocalizedAddressFieldLabel =
	| "province"
	| "district"
	| "state"
	| "zip"
	| "postal"
	| "postTown"
	| "prefecture";

export const useAddressFormUtils = (countryCode: CountryCode = defaultCountry) => {
	const text = useCheckoutText();
	const [{ data }] = useAddressValidationRulesQuery({
		variables: { countryCode },
	});

	const validationRules = data?.addressValidationRules as ValidationRulesFragment;

	const { countryAreaType, postalCodeType, cityType } = validationRules || {};

	// Address field labels from storefront control config
	const addressFieldMessages: Record<AddressFieldLabel, string> = useMemo(() => ({
		city: text.cityLabel || "City",
		firstName: text.firstNameLabel || "First name",
		countryArea: text.countryAreaLabel || "Country area",
		lastName: text.lastNameLabel || "Last name",
		country: text.countryLabel || "Country",
		cityArea: text.cityAreaLabel || "City area",
		postalCode: text.postalCodeLabel || "Postal code",
		companyName: text.companyLabel || "Company",
		streetAddress1: text.addressLine1Label || "Street address",
		streetAddress2: text.addressLine2Label || "Street address (continue)",
		phone: text.phoneLabel || "Phone number",
	}), [text]);

	// Localized field labels from storefront control config
	const localizedAddressFieldMessages: Record<LocalizedAddressFieldLabel, string> = useMemo(() => ({
		province: text.provinceLabel || "Province",
		district: text.districtLabel || "District",
		state: text.stateLabel || "State",
		zip: text.zipCodeLabel || "Zip code",
		postal: text.postalCodeLabel || "Postal code",
		postTown: text.postTownLabel || "Post town",
		prefecture: text.prefectureLabel || "Prefecture",
	}), [text]);

	const localizedFields = useMemo(
		() => ({
			countryArea: countryAreaType,
			city: cityType,
			postalCode: postalCodeType,
		}),
		[cityType, countryAreaType, postalCodeType],
	);

	const isRequiredField = useCallback(
		(field: AddressField) =>
			getRequiredAddressFields(validationRules?.requiredFields as AddressField[]).includes(field),
		[validationRules?.requiredFields],
	);

	const getMissingFieldsFromAddress = useCallback(
		(address: OptionalAddress) => {
			if (!address) {
				return [];
			}

			return Object.entries(address).reduce((result, [fieldName, fieldValue]) => {
				if (!isRequiredField(fieldName as AddressField)) {
					return result;
				}

				return !!fieldValue ? result : ([...result, fieldName] as AddressField[]);
			}, [] as AddressField[]);
		},
		[isRequiredField],
	);

	const hasAllRequiredFields = useCallback(
		(address: OptionalAddress) => !getMissingFieldsFromAddress(address).length,
		[getMissingFieldsFromAddress],
	);

	const getLocalizedFieldLabel = useCallback((field: AddressField, localizedField?: string) => {
		try {
			const translatedLabel =
				localizedAddressFieldMessages[camelCase(localizedField) as LocalizedAddressFieldLabel];
			return translatedLabel;
		} catch (e) {
			console.warn(`Missing translation: ${localizedField}`);
			return addressFieldMessages[camelCase(field) as AddressFieldLabel];
		}
	}, [localizedAddressFieldMessages, addressFieldMessages]);

	const getFieldLabel = useCallback(
		(field: AddressField) => {
			const localizedField = localizedFields[field as keyof typeof localizedFields];

			const isLocalizedField = !!localizedField && localizedField !== field;

			if (isLocalizedField) {
				return getLocalizedFieldLabel(
					field,
					localizedFields[field as keyof typeof localizedFields] as LocalizedAddressFieldLabel,
				);
			}

			return addressFieldMessages[field as AddressFieldLabel];
		},
		[getLocalizedFieldLabel, localizedFields, addressFieldMessages],
	);

	const orderedAddressFields = getOrderedAddressFields(validationRules?.allowedFields as AddressField[]);

	return {
		orderedAddressFields,
		getFieldLabel,
		isRequiredField,
		hasAllRequiredFields,
		getMissingFieldsFromAddress,
		...validationRules,
		allowedFields: validationRules?.allowedFields as AddressField[] | undefined,
	};
};
