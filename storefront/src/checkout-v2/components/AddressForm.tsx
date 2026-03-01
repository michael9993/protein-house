"use client";

import { useRef } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CountryCode } from "@/gql/graphql";
import { useCheckoutText } from "../hooks/useCheckoutText";
import { useAddressValidation } from "../hooks/useAddressValidation";
import { useGooglePlaces } from "../hooks/useGooglePlaces";
import { FormField } from "./FormField";
import { CountryCombobox } from "./CountryCombobox";
import { buildAddressSchema, type AddressFormValues } from "../schemas";
import type { AddressField } from "@/checkout/components/AddressForm/types";

type AddressFieldLabel = Exclude<AddressField, "countryCode"> | "country";

interface AddressFormProps {
	/** Form ID — used to link external submit buttons */
	id: string;
	defaultValues?: Partial<AddressFormValues>;
	onSubmit: (values: AddressFormValues) => Promise<void>;
	/** Optional: server-side errors mapped by field name */
	serverErrors?: Partial<Record<AddressField | "countryCode", string>>;
}

/**
 * Full address form with:
 * - React Hook Form + dynamic Zod schema (per-country validation from Saleor)
 * - Google Places Autocomplete (progressive enhancement)
 * - Country-specific field ordering from addressValidationRules
 * - RTL-safe with logical CSS properties
 */
export function AddressForm({ id, defaultValues, onSubmit, serverErrors = {} }: AddressFormProps) {
	const t = useCheckoutText();
	const streetInputRef = useRef<HTMLInputElement | null>(null);

	const {
		register,
		handleSubmit,
		control,
		watch,
		setValue,
		formState: { errors },
	} = useForm<AddressFormValues>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: zodResolver(buildAddressSchema()) as Resolver<AddressFormValues, any>,
		defaultValues: {
			firstName: "",
			lastName: "",
			companyName: "",
			streetAddress1: "",
			streetAddress2: "",
			city: "",
			cityArea: "",
			countryCode: "IL",
			countryArea: "",
			postalCode: "",
			phone: "",
			...defaultValues,
		},
	});

	const countryCode = watch("countryCode") as CountryCode;

	// Load country-specific validation rules
	const { orderedFields, requiredFields } = useAddressValidation(countryCode);

	// Attach Google Places to street address input
	useGooglePlaces(streetInputRef, setValue);

	// Field labels (configurable via storefront control)
	const fieldLabels: Partial<Record<AddressFieldLabel, string>> = {
		firstName: t.firstNameLabel ?? "First name",
		lastName: t.lastNameLabel ?? "Last name",
		companyName: t.companyLabel ?? "Company",
		streetAddress1: t.addressLine1Label ?? "Street address",
		streetAddress2: t.addressLine2Label ?? "Apt, suite, etc.",
		city: t.cityLabel ?? "City",
		cityArea: t.cityAreaLabel ?? "City area",
		country: t.countryLabel ?? "Country",
		countryArea: t.stateLabel ?? "State / Province",
		postalCode: t.postalCodeLabel ?? "Postal code",
		phone: t.phoneLabel ?? "Phone",
	};

	const isRequired = (field: AddressField) =>
		requiredFields.includes(field) || ["firstName", "lastName", "phone"].includes(field);

	const getError = (field: AddressField | "countryCode") =>
		serverErrors[field] || errors[field]?.message;

	function renderField(field: AddressField) {
		const label = fieldLabels[field as AddressFieldLabel] ?? field;
		const required = isRequired(field);
		const error = getError(field);

		if (field === "countryCode") {
			return (
				<Controller
					key="countryCode"
					name="countryCode"
					control={control}
					render={({ field }) => (
						<CountryCombobox
							value={field.value}
							onChange={field.onChange}
							onBlur={field.onBlur}
							label={fieldLabels.country ?? "Country"}
							required
							error={errors.countryCode?.message ?? serverErrors.countryCode}
						/>
					)}
				/>
			);
		}

		if (field === "streetAddress1") {
			// Needs ref for Google Places Autocomplete
			const { ref, ...streetReg } = register("streetAddress1");
			return (
				<FormField
					key={field}
					{...streetReg}
					ref={(el: HTMLInputElement | null) => {
						ref(el);
						streetInputRef.current = el;
					}}
					label={label}
					required={required}
					autoComplete="address-line1"
					error={error}
				/>
			);
		}

		return (
			<FormField
				key={field}
				{...register(field)}
				label={label}
				required={required}
				autoComplete={field === "phone" ? "tel" : undefined}
				error={error}
			/>
		);
	}

	// Build display fields: country first, then Saleor-ordered fields
	// — Remove streetAddress2 (redundant with line 1)
	// — Move companyName after phone
	let reorderedFields = orderedFields.filter((f) => f !== "countryCode" && f !== "streetAddress2");
	const companyIdx = reorderedFields.indexOf("companyName");
	const phoneIdx = reorderedFields.indexOf("phone");
	if (companyIdx !== -1 && phoneIdx !== -1 && companyIdx !== phoneIdx + 1) {
		reorderedFields.splice(companyIdx, 1);
		const newPhoneIdx = reorderedFields.indexOf("phone");
		reorderedFields.splice(newPhoneIdx + 1, 0, "companyName");
	}
	const displayFields: AddressField[] = ["countryCode", ...reorderedFields];

	return (
		<form id={id} onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} noValidate>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{/* First name + Last name always in a row */}
				<FormField
					{...register("firstName")}
					label={fieldLabels.firstName ?? "First name"}
					autoComplete="given-name"
					required
					error={getError("firstName")}
				/>
				<FormField
					{...register("lastName")}
					label={fieldLabels.lastName ?? "Last name"}
					autoComplete="family-name"
					required
					error={getError("lastName")}
				/>

				{/* Country selector — full width */}
				<div className="sm:col-span-2">
					<Controller
						name="countryCode"
						control={control}
						render={({ field }) => (
							<CountryCombobox
								value={field.value}
								onChange={field.onChange}
								onBlur={field.onBlur}
								label={fieldLabels.country ?? "Country"}
								required
								error={errors.countryCode?.message ?? serverErrors.countryCode}
							/>
						)}
					/>
				</div>

				{/* Remaining ordered fields */}
				{displayFields
					.filter((f) => f !== "firstName" && f !== "lastName" && f !== "countryCode")
					.map((field) => (
						<div
							key={field}
							className={
								field === "streetAddress1"
									? "sm:col-span-2"
									: undefined
							}
						>
							{renderField(field)}
						</div>
					))}
			</div>
		</form>
	);
}
