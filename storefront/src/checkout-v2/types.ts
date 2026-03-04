import type { CheckoutFragment } from "@/lib/checkout/graphql-types";

/** Checkout accordion step indices */
export type StepIndex = 0 | 1 | 2 | 3;

export const STEP_CONTACT = 0 as const;
export const STEP_SHIPPING = 1 as const;
export const STEP_DELIVERY = 2 as const;
export const STEP_PAYMENT = 3 as const;

/** Step labels for progress bar rendering */
export const STEP_LABELS = ["contact", "shipping", "delivery", "payment"] as const;
export type StepLabel = (typeof STEP_LABELS)[number];

/** Mutation scope — tracks which async operation is in-flight */
export type MutatingScope =
	| "email"
	| "address"
	| "billing"
	| "delivery"
	| "payment"
	| "promo"
	| "lines"
	| null;

/** Checkout page state managed by useReducer */
export interface CheckoutState {
	checkout: CheckoutFragment | null;
	activeStep: StepIndex;
	completedSteps: Set<number>;
	mutating: MutatingScope;
	stepErrors: Map<number, string[]>;
	billingMatchesShipping: boolean;
	/** Optimistic line updates — revert on error */
	optimisticLines: Map<string, { quantity: number } | "removed">;
}

/** All actions dispatched to the checkout reducer */
export type CheckoutAction =
	| { type: "SET_CHECKOUT"; checkout: CheckoutFragment }
	| { type: "OPEN_STEP"; step: StepIndex }
	| { type: "COMPLETE_STEP"; step: StepIndex }
	| { type: "UNCOMPLETE_STEP"; step: StepIndex }
	| { type: "SET_MUTATING"; scope: MutatingScope }
	| { type: "SET_STEP_ERRORS"; step: StepIndex; errors: string[] }
	| { type: "CLEAR_STEP_ERRORS"; step: StepIndex }
	| { type: "SET_BILLING_MATCHES_SHIPPING"; matches: boolean }
	| { type: "OPTIMISTIC_QUANTITY"; lineId: string; quantity: number }
	| { type: "OPTIMISTIC_REMOVE_LINE"; lineId: string }
	| { type: "REVERT_OPTIMISTIC" };

/** Address form values (shared between shipping and billing) */
export interface AddressFormValues {
	firstName: string;
	lastName: string;
	companyName: string;
	streetAddress1: string;
	streetAddress2: string;
	city: string;
	cityArea: string;
	countryCode: string;
	countryArea: string;
	postalCode: string;
	phone: string;
}

/** Contact form values */
export interface ContactFormValues {
	email: string;
	createAccount: boolean;
	password: string;
}

/** Shipping method from Saleor checkout */
export interface ShippingMethod {
	id: string;
	name: string;
	price: { currency: string; amount: number };
	minimumDeliveryDays: number | null;
	maximumDeliveryDays: number | null;
}

/** Address suggestion from Google Address Validation API */
export interface AddressSuggestion {
	verdict: "CONFIRMED" | "UNCONFIRMED_BUT_PLAUSIBLE" | "UNCONFIRMED";
	suggestedAddress?: AddressFormValues;
	formattedAddress?: string;
}
