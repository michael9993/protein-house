import { z } from "zod";

// ---------------------------------------------------------------------------
// Contact schema
// ---------------------------------------------------------------------------

export const contactSchema = z
	.object({
		email: z.string().min(1, "required").email("invalidEmail"),
		createAccount: z.boolean().default(false),
		password: z.string().default(""),
	})
	.superRefine((data, ctx) => {
		if (data.createAccount && data.password.length < 8) {
			ctx.addIssue({
				code: z.ZodIssueCode.too_small,
				minimum: 8,
				type: "string",
				inclusive: true,
				path: ["password"],
				message: "passwordMinChars",
			});
		}
	});

export type ContactFormValues = z.infer<typeof contactSchema>;

// ---------------------------------------------------------------------------
// Address schema
// Base schema — extended dynamically by useAddressValidation per country
// ---------------------------------------------------------------------------

export const baseAddressSchema = z.object({
	firstName: z.string().min(1, "required"),
	lastName: z.string().min(1, "required"),
	companyName: z.string().default(""),
	streetAddress1: z.string().min(1, "required"),
	streetAddress2: z.string().default(""),
	city: z.string().min(1, "required"),
	cityArea: z.string().default(""),
	countryCode: z.string().min(2, "required"),
	countryArea: z.string().default(""),
	postalCode: z.string().default(""),
	phone: z.string().min(1, "required"),
});

export type BaseAddressFormValues = z.infer<typeof baseAddressSchema>;

/**
 * Build a dynamic address schema based on Saleor's addressValidationRules
 * for the selected country.
 * @param requiredFields - field names that must be non-empty for this country
 * @param postalCodePattern - regex string for postal code format (e.g. "\\d{5}")
 */
export function buildAddressSchema(options?: {
	requiredFields?: string[];
	postalCodePattern?: string | null;
}) {
	const { requiredFields = [], postalCodePattern } = options ?? {};

	const isRequired = (field: string) => requiredFields.includes(field);

	const postalCodeValidator =
		postalCodePattern
			? z.string().regex(new RegExp(postalCodePattern), "postalCodeFormat")
			: z.string();

	return z.object({
		firstName: z.string().min(1, "required"),
		lastName: z.string().min(1, "required"),
		companyName: z.string().default(""),
		streetAddress1: z.string().min(1, "required"),
		streetAddress2: z.string().default(""),
		city: isRequired("city")
			? z.string().min(1, "required")
			: z.string().default(""),
		cityArea: isRequired("cityArea")
			? z.string().min(1, "required")
			: z.string().default(""),
		countryCode: z.string().min(2, "required"),
		countryArea: isRequired("countryArea")
			? z.string().min(1, "required")
			: z.string().default(""),
		postalCode: isRequired("postalCode")
			? postalCodeValidator.min(1, "required")
			: postalCodeValidator.default(""),
		phone: z.string().min(1, "required"),
	});
}

export type AddressFormValues = z.infer<ReturnType<typeof buildAddressSchema>>;

// ---------------------------------------------------------------------------
// Default address (same as base)
// ---------------------------------------------------------------------------

export const addressSchema = buildAddressSchema();
export const billingAddressSchema = buildAddressSchema();
