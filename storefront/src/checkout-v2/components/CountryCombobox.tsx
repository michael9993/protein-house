"use client";

import { useMemo, useState } from "react";
import {
	Combobox,
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
} from "@headlessui/react";
import type { UseFormSetValue } from "react-hook-form";
import type { FieldError } from "react-hook-form";
import { countries as allCountries } from "@/checkout/lib/consts/countries";
import { getCountryName } from "@/checkout/lib/utils/locale";
import type { CountryCode } from "@/checkout/graphql";
import { useCheckoutText } from "../hooks/useCheckoutText";
import type { AddressFormValues } from "../schemas";

interface CountryComboboxProps {
	value: string;
	onChange: (countryCode: string) => void;
	onBlur?: () => void;
	error?: FieldError | string;
	only?: CountryCode[];
	label?: string;
	required?: boolean;
	/** Passed from RHF to set value (triggers validation) */
	setValue?: UseFormSetValue<AddressFormValues>;
}

interface CountryOption {
	code: CountryCode;
	name: string;
}

/**
 * Country combobox adapted for React Hook Form.
 * Replaces the old Formik-based CountryCombobox.
 */
export function CountryCombobox({
	value,
	onChange,
	onBlur,
	error,
	only = [],
	label,
	required,
}: CountryComboboxProps) {
	const t = useCheckoutText();
	const [query, setQuery] = useState("");

	const countriesToMap = only.length ? only : (allCountries as CountryCode[]);

	const countryOptions = useMemo(
		() =>
			countriesToMap.map((code) => ({
				code,
				name: getCountryName(code),
			})),
		[countriesToMap],
	);

	const filtered = useMemo(
		() =>
			query === ""
				? countryOptions
				: countryOptions.filter(
						(c) =>
							c.name.toLowerCase().includes(query.toLowerCase()) ||
							c.code.toLowerCase().includes(query.toLowerCase()),
					),
		[query, countryOptions],
	);

	const selectedCountry = countryOptions.find((c) => c.code === value) ?? null;
	const errorMessage = typeof error === "string" ? error : error?.message;

	function handleSelect(country: CountryOption | null) {
		if (!country) return;
		onChange(country.code);
		setQuery("");
	}

	return (
		<div className="space-y-1">
			{label && (
				<span className="block text-sm font-medium text-neutral-700">
					{label}
					{required && (
						<span className="ms-0.5 text-red-500" aria-hidden="true">
							*
						</span>
					)}
				</span>
			)}

			<Combobox
				value={selectedCountry}
				onChange={handleSelect}
				onClose={() => setQuery("")}
			>
				<div className="relative">
					<ComboboxInput
						className={[
							"block w-full rounded-lg border px-3 py-2.5 pe-9 text-sm text-neutral-900 shadow-sm",
							"focus:outline-none focus:ring-2 focus:ring-[var(--store-primary,theme(colors.neutral.900))]",
							errorMessage
								? "border-red-400 bg-red-50"
								: "border-neutral-300 bg-white hover:border-neutral-400",
						].join(" ")}
						displayValue={(c: CountryOption | null) => c?.name ?? ""}
						onChange={(e) => setQuery(e.target.value)}
						onBlur={onBlur}
						placeholder={t.countryPlaceholder ?? "Search country..."}
						autoComplete="off"
						aria-invalid={!!errorMessage}
					/>
					<div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3">
						<svg className="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
							<path
								fillRule="evenodd"
								d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
								clipRule="evenodd"
							/>
						</svg>
					</div>
				</div>

				<ComboboxOptions
					anchor="bottom start"
					className="z-50 mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-lg border border-neutral-200 bg-white shadow-lg empty:hidden"
				>
					{filtered.map((country) => (
						<ComboboxOption
							key={country.code}
							value={country}
							className="cursor-pointer select-none px-3 py-2.5 text-sm text-neutral-900 data-[focus]:bg-neutral-50"
						>
							{country.name}
						</ComboboxOption>
					))}
					{filtered.length === 0 && query !== "" && (
						<div className="px-3 py-2.5 text-sm text-neutral-400">
							{t.noCountryFound ?? "No country found"}
						</div>
					)}
				</ComboboxOptions>
			</Combobox>

			{errorMessage && (
				<p className="flex items-center gap-1 text-xs text-red-600" role="alert">
					{errorMessage}
				</p>
			)}
		</div>
	);
}
