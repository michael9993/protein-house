// Barrel export for shared checkout modules.
// Used by checkout-v2/. When checkout/ (V1) is deleted, these files remain.
export * from "./graphql-types";
export * from "./useCheckoutText";
export { UserProvider, useUser } from "./UserContext";
export { countries } from "./countries";
export { getCountryName } from "./locale";
export { getQueryParams } from "./url";
export type { AddressField, AddressFormData, OptionalAddress, ApiAddressField } from "./address-types";
export {
	getFilteredAddressFields,
	getRequiredAddressFields,
	getAddressValidationRulesVariables,
	getOrderedAddressFields,
	getAddressInputData,
	getAddressInputDataFromAddress,
	getAddressFormDataFromAddress,
	getEmptyAddressFormData,
	getEmptyAddress,
	addressFieldsOrder,
	isMatchingAddress,
	isMatchingAddressData,
	getByMatchingAddress,
	isMatchingAddressFormData,
	getAllAddressFieldKeys,
} from "./address-utils";
export type { MightNotExist } from "./globalTypes";
