"use client";

import type { AddressFragment } from "@/checkout/graphql";
import { useCheckoutText } from "../hooks/useCheckoutText";
import type { AddressFormValues } from "../schemas";

interface SavedAddressListProps {
	addresses: AddressFragment[];
	selectedId: string | null;
	onSelect: (address: AddressFormValues) => void;
	onAddNew: () => void;
}

function formatAddress(addr: AddressFragment): string {
	return [addr.streetAddress1, addr.city, addr.country.country].filter(Boolean).join(", ");
}

function addressToFormValues(addr: AddressFragment): AddressFormValues {
	return {
		firstName: addr.firstName ?? "",
		lastName: addr.lastName ?? "",
		companyName: addr.companyName ?? "",
		streetAddress1: addr.streetAddress1 ?? "",
		streetAddress2: addr.streetAddress2 ?? "",
		city: addr.city ?? "",
		cityArea: addr.cityArea ?? "",
		countryCode: addr.country.code,
		countryArea: addr.countryArea ?? "",
		postalCode: addr.postalCode ?? "",
		phone: addr.phone ?? "",
	};
}

/**
 * Saved address selector for authenticated users.
 * Shows radio list of saved addresses + "Add new address" button.
 */
export function SavedAddressList({
	addresses,
	selectedId,
	onSelect,
	onAddNew,
}: SavedAddressListProps) {
	const t = useCheckoutText();

	if (addresses.length === 0) {
		return (
			<div className="text-center text-sm text-neutral-500">
				<p>{t.noSavedAddressesText ?? "You have no saved addresses."}</p>
				<button
					type="button"
					onClick={onAddNew}
					className="mt-2 text-[var(--store-primary,theme(colors.neutral.900))] underline-offset-2 hover:underline"
				>
					{t.addAddressButton ?? "Add address"}
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<fieldset>
				<legend className="sr-only">Saved addresses</legend>
				<div className="space-y-2">
					{addresses.map((addr) => (
						<label
							key={addr.id}
							className={[
								"flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
								selectedId === addr.id
									? "border-[var(--store-primary,theme(colors.neutral.900))] bg-neutral-50"
									: "border-neutral-200 hover:border-neutral-300",
							].join(" ")}
						>
							<input
								type="radio"
								name="savedAddress"
								value={addr.id}
								checked={selectedId === addr.id}
								onChange={() => onSelect(addressToFormValues(addr))}
								className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--store-primary,theme(colors.neutral.900))]"
							/>
							<div className="min-w-0 text-sm">
								<p className="font-medium text-neutral-900">
									{addr.firstName} {addr.lastName}
								</p>
								<p className="truncate text-neutral-500">{formatAddress(addr)}</p>
							</div>
						</label>
					))}
				</div>
			</fieldset>

			<button
				type="button"
				onClick={onAddNew}
				className="mt-1 text-sm text-[var(--store-primary,theme(colors.neutral.900))] underline-offset-2 hover:underline"
			>
				+ {t.addAddressButton ?? "Add new address"}
			</button>
		</div>
	);
}
