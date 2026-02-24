import { useState, useMemo } from "react";
import {
	Combobox,
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
} from "@headlessui/react";
import { type CountryCode } from "@/checkout/graphql";
import { countries as allCountries } from "@/checkout/lib/consts/countries";
import { getCountryName } from "@/checkout/lib/utils/locale";
import { useFormContext } from "@/checkout/hooks/useForm";
import { useCheckoutText } from "@/checkout/hooks/useCheckoutText";
import { type AddressFormData } from "@/checkout/components/AddressForm/types";

interface CountryOption {
	code: CountryCode;
	name: string;
}

interface CountryComboboxProps {
	only?: CountryCode[];
}

export const CountryCombobox = ({ only = [] }: CountryComboboxProps) => {
	const text = useCheckoutText();
	const { values, handleChange, handleBlur, touched, errors } =
		useFormContext<AddressFormData>();
	const [query, setQuery] = useState("");

	const countriesToMap = only.length ? only : allCountries;

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

	const selectedCountry =
		countryOptions.find((c) => c.code === values.countryCode) ?? null;

	const handleSelect = (country: CountryOption | null) => {
		if (!country) return;

		// Create synthetic event compatible with Formik + auto-save wrapper.
		// The auto-save onChange checks event.target.name === "countryCode"
		// to update validation rules, then calls partialSubmit().
		const syntheticEvent = {
			target: { name: "countryCode", value: country.code },
			currentTarget: { name: "countryCode", value: country.code },
			persist: () => {},
		} as unknown as React.ChangeEvent<HTMLSelectElement>;

		handleChange(syntheticEvent);
	};

	const handleInputBlur = () => {
		const syntheticEvent = {
			target: { name: "countryCode", value: values.countryCode },
			currentTarget: { name: "countryCode", value: values.countryCode },
			persist: () => {},
		} as unknown as React.FocusEvent<HTMLInputElement>;

		handleBlur(syntheticEvent);
	};

	const error = touched.countryCode ? (errors.countryCode as string) : undefined;

	return (
		<div className="space-y-0.5">
			<label className="flex flex-col">
				<span className="auth-label text-xs">
					{text.countryLabel || "Country"}
				</span>
				<Combobox
					value={selectedCountry}
					onChange={handleSelect}
					onClose={() => setQuery("")}
				>
					<div className="relative mt-1">
						<ComboboxInput
							className="auth-input block w-full rounded-md border py-2 pe-9 ps-3 shadow-sm focus:outline-none"
							displayValue={(c: CountryOption | null) => c?.name ?? ""}
							onChange={(e) => setQuery(e.target.value)}
							onBlur={handleInputBlur}
							placeholder={text.countryPlaceholder || "Search country..."}
							autoComplete="off"
						/>
						<div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3">
							<svg
								className="h-4 w-4"
								style={{ color: "var(--store-neutral-400)" }}
								viewBox="0 0 20 20"
								fill="currentColor"
								aria-hidden="true"
							>
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
						className="z-50 mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-md border shadow-lg empty:hidden"
						style={{
							backgroundColor: "var(--store-bg, #fff)",
							borderColor: "var(--store-neutral-200)",
						}}
					>
						{filtered.map((country) => (
							<ComboboxOption
								key={country.code}
								value={country}
								className="cursor-pointer select-none px-3 py-2.5 text-sm data-[focus]:bg-[var(--store-neutral-100)]"
								style={{ color: "var(--store-text)" }}
							>
								{country.name}
							</ComboboxOption>
						))}
						{filtered.length === 0 && query !== "" && (
							<div
								className="px-3 py-2.5 text-sm"
								style={{ color: "var(--store-neutral-400)" }}
							>
								{text.noCountryFound || "No country found"}
							</div>
						)}
					</ComboboxOptions>
				</Combobox>
			</label>
			{error && (
				<p className="text-sm" style={{ color: "var(--store-error-text)" }}>
					{error}
				</p>
			)}
		</div>
	);
};
