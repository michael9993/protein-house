// Re-export GraphQL types from the main generated file.
// These were previously only available in @/checkout/graphql (V1's codegen).
//
// The client-preset codegen generates fragment types with a double-Fragment suffix:
// fragment "CheckoutFragment" → type "CheckoutFragmentFragment"
// We re-export with the short names V2 components expect.

import { type CountryCode as CountryCodeEnum } from "@/gql/graphql";

export type {
	CheckoutFragmentFragment as CheckoutFragment,
	AddressFragmentFragment as AddressFragment,
	CheckoutLineFragmentFragment as CheckoutLineFragment,
	CheckoutErrorFragmentFragment as CheckoutErrorFragment,
	GiftCardFragmentFragment as GiftCardFragment,
	PaymentGatewayFragmentFragment as PaymentGatewayFragment,
	ValidationRulesFragmentFragment as ValidationRulesFragment,
	MoneyFragment,
} from "@/gql/graphql";

// V1 codegen generated CountryCode as a string union type ("AD" | "AE" | ...),
// but the main codegen generates it as an enum (CountryCode.Ad = 'AD').
// Template literal type extracts the string values, making string literals assignable.
export type CountryCode = `${CountryCodeEnum}`;
