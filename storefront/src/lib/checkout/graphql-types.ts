// Re-export GraphQL types from the main generated file.
// These were previously only available in @/checkout/graphql (V1's codegen).
//
// The client-preset codegen generates fragment types with a double-Fragment suffix:
// fragment "CheckoutFragment" → type "CheckoutFragmentFragment"
// We re-export with the short names V2 components expect.

export type {
	CheckoutFragmentFragment as CheckoutFragment,
	AddressFragmentFragment as AddressFragment,
	CheckoutLineFragmentFragment as CheckoutLineFragment,
	CheckoutErrorFragmentFragment as CheckoutErrorFragment,
	GiftCardFragmentFragment as GiftCardFragment,
	PaymentGatewayFragmentFragment as PaymentGatewayFragment,
	ValidationRulesFragmentFragment as ValidationRulesFragment,
	MoneyFragment,
	CountryCode,
} from "@/gql/graphql";
