"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { CountryCode } from "@/lib/checkout/graphql-types";
import { useCheckoutState } from "../CheckoutStateProvider";
import { useCheckoutText } from "../hooks/useCheckoutText";
import { useAddressValidation } from "../hooks/useAddressValidation";
import { useUser } from "@/lib/checkout/UserContext";
import { AddressForm } from "../components/AddressForm";
import { SavedAddressList } from "../components/SavedAddressList";
import { AddressSuggestionDialog } from "../components/AddressSuggestionDialog";
import { buildAddressSchema, type AddressFormValues } from "../schemas";
import { updateShippingAddress } from "../_actions/update-shipping-address";
import { updateBillingAddress } from "../_actions/update-billing-address";
import { validateAddressExists } from "../_actions/validate-address";
import { STEP_SHIPPING } from "../types";
import type { AddressSuggestion } from "../types";

// ---------------------------------------------------------------------------
// ShippingStep — address form + billing toggle + Continue flow
// ---------------------------------------------------------------------------

interface ShippingStepProps {
	checkoutId: string;
}

export function ShippingStep({ checkoutId }: ShippingStepProps) {
	const t = useCheckoutText();
	const { state, setMutating, setStepErrors, clearStepErrors, setCheckout, completeStepAndAdvance } =
		useCheckoutState();
	const { user, authenticated } = useUser();

	const [billingMatchesShipping, setBillingMatchesShipping] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [suggestion, setSuggestion] = useState<{
		data: AddressSuggestion;
		address: AddressFormValues;
		resolve: (addr: AddressFormValues) => void;
	} | null>(null);

	// Saved address selection state
	const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
	const [formKey, setFormKey] = useState(0);
	const [showNewForm, setShowNewForm] = useState(false);

	const checkoutAddress = state.checkout?.shippingAddress;
	const savedAddresses = user?.addresses ?? [];
	const hasSavedAddresses = authenticated && savedAddresses.length > 0;

	// Default values from existing checkout data (e.g. browser back)
	const defaultShipping: Partial<AddressFormValues> = checkoutAddress
		? {
				firstName: checkoutAddress.firstName ?? "",
				lastName: checkoutAddress.lastName ?? "",
				companyName: checkoutAddress.companyName ?? "",
				streetAddress1: checkoutAddress.streetAddress1 ?? "",
				streetAddress2: checkoutAddress.streetAddress2 ?? "",
				city: checkoutAddress.city ?? "",
				cityArea: checkoutAddress.cityArea ?? "",
				countryCode: checkoutAddress.country?.code ?? "IL",
				countryArea: checkoutAddress.countryArea ?? "",
				postalCode: checkoutAddress.postalCode ?? "",
				phone: checkoutAddress.phone ?? "",
			}
		: {};

	// Auto-fill from user's default shipping address when logged in and no checkout address
	const [formDefaults, setFormDefaults] = useState<Partial<AddressFormValues>>(defaultShipping);

	const applyAddress = useCallback((addr: {
		id: string;
		firstName?: string | null;
		lastName?: string | null;
		companyName?: string | null;
		streetAddress1?: string | null;
		streetAddress2?: string | null;
		city?: string | null;
		cityArea?: string | null;
		postalCode?: string | null;
		country?: { code: string } | null;
		countryArea?: string | null;
		phone?: string | null;
	}) => {
		setSelectedAddressId(addr.id);
		setShowNewForm(false);
		setFormDefaults({
			firstName: addr.firstName ?? "",
			lastName: addr.lastName ?? "",
			companyName: addr.companyName ?? "",
			streetAddress1: addr.streetAddress1 ?? "",
			streetAddress2: addr.streetAddress2 ?? "",
			city: addr.city ?? "",
			cityArea: addr.cityArea ?? "",
			countryCode: addr.country?.code ?? "IL",
			countryArea: addr.countryArea ?? "",
			postalCode: addr.postalCode ?? "",
			phone: addr.phone ?? "",
		});
		setFormKey((k) => k + 1);
	}, []);

	// When user data loads and checkout has no address, auto-select default shipping address
	useEffect(() => {
		if (!hasSavedAddresses || checkoutAddress) return;
		const defaultAddr = savedAddresses.find(
			(a: { isDefaultShippingAddress?: boolean }) => a.isDefaultShippingAddress,
		) ?? savedAddresses[0];
		if (defaultAddr) {
			applyAddress(defaultAddr);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hasSavedAddresses]);

	// ---------------------------------------------------------------------------
	// Validate + save flow
	// ---------------------------------------------------------------------------

	async function handleSave(address: AddressFormValues): Promise<void> {
		if (!checkoutId) return;
		setSubmitting(true);
		setMutating("address");
		clearStepErrors(STEP_SHIPPING);

		try {
			// Layer 3: Google Address Validation (soft — user can skip)
			const validation = await validateAddressExists(address);

			if (validation.verdict !== "CONFIRMED") {
				// Show suggestion dialog and wait for user decision
				const resolvedAddress = await new Promise<AddressFormValues>((resolve) => {
					setSuggestion({ data: validation, address, resolve });
				});
				setSuggestion(null);
				await saveToSaleor(resolvedAddress);
			} else {
				await saveToSaleor(address);
			}
		} finally {
			setSubmitting(false);
			setMutating(null);
		}
	}

	async function saveToSaleor(address: AddressFormValues) {
		// Save shipping address (Saleor fires SHIPPING_LIST_METHODS_FOR_CHECKOUT sync webhook here)
		const result = await updateShippingAddress(checkoutId, address);

		if (result.errors.length) {
			setStepErrors(
				STEP_SHIPPING,
				result.errors.map((e) => e.message ?? "Unknown error"),
			);
			return;
		}

		// Save billing address (same as shipping or separate)
		if (billingMatchesShipping) {
			await updateBillingAddress(checkoutId, address);
		}

		// Persist address + shipping methods into checkout state so Edit re-populates the form
		if (result.checkout && state.checkout) {
			setCheckout({
				...state.checkout,
				id: result.checkout.id,
				shippingMethods: result.checkout.shippingMethods,
				shippingAddress: {
					...state.checkout.shippingAddress,
					firstName: address.firstName,
					lastName: address.lastName,
					companyName: address.companyName,
					streetAddress1: address.streetAddress1,
					streetAddress2: address.streetAddress2 ?? "",
					city: address.city,
					cityArea: address.cityArea ?? "",
					countryArea: address.countryArea ?? "",
					postalCode: address.postalCode ?? "",
					phone: address.phone ?? "",
					country: { code: address.countryCode },
				},
			} as typeof state.checkout);
		}

		completeStepAndAdvance(STEP_SHIPPING);
	}

	const stepErrors = state.stepErrors.get(STEP_SHIPPING);

	return (
		<div className="space-y-6">
			<p className="text-sm text-neutral-500">
				{t.shippingAddressSubtitle ?? "Where should we deliver?"}
			</p>

			{/* Saved address selector for logged-in users */}
			{hasSavedAddresses && !showNewForm && (
				<SavedAddressList
					addresses={savedAddresses}
					selectedId={selectedAddressId}
					onSelect={(values) => {
						const matched = savedAddresses.find(
							(a: { streetAddress1?: string | null }) => a.streetAddress1 === values.streetAddress1,
						);
						if (matched) applyAddress(matched);
					}}
					onAddNew={() => {
						setSelectedAddressId(null);
						setShowNewForm(true);
						setFormDefaults({});
						setFormKey((k) => k + 1);
					}}
				/>
			)}

			{/* "Back to saved addresses" link when showing new form */}
			{hasSavedAddresses && showNewForm && (
				<button
					type="button"
					onClick={() => {
						setShowNewForm(false);
						// Re-select previously selected or default
						const prev = savedAddresses.find(
							(a: { id: string }) => a.id === selectedAddressId,
						) ?? savedAddresses.find(
							(a: { isDefaultShippingAddress?: boolean }) => a.isDefaultShippingAddress,
						) ?? savedAddresses[0];
						if (prev) applyAddress(prev);
					}}
					className="text-sm text-[var(--store-primary,theme(colors.neutral.900))] underline-offset-2 hover:underline"
				>
					&larr; {t.changeAddressButton ?? "Use saved address"}
				</button>
			)}

			{/* Address form — submits via external button (form id) */}
			<AddressForm
				key={formKey}
				id="shipping-address-form"
				defaultValues={formDefaults}
				onSubmit={handleSave}
			/>

			{/* Server-side errors */}
			{stepErrors?.map((msg) => (
				<p key={msg} className="text-sm text-red-600" role="alert">
					{msg}
				</p>
			))}

			{/* Billing address toggle */}
			<div className="border-t border-neutral-100 pt-4">
				<label className="flex cursor-pointer items-center gap-3">
					<input
						type="checkbox"
						checked={billingMatchesShipping}
						onChange={(e) => setBillingMatchesShipping(e.target.checked)}
						className="h-4 w-4 rounded border-neutral-300 accent-[var(--store-primary,theme(colors.neutral.900))]"
					/>
					<span className="text-sm text-neutral-700">
						{t.useSameAsShipping ?? "Use shipping address as billing address"}
					</span>
				</label>
			</div>

			{/* Continue button */}
			<div className="flex justify-end">
				<button
					type="submit"
					form="shipping-address-form"
					disabled={submitting}
					className="rounded-lg bg-[var(--store-primary,theme(colors.neutral.900))] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{submitting ? (t.savingAddressText ?? "Saving…") : (t.continueButtonText ?? "Continue")}
				</button>
			</div>

			{/* Address suggestion dialog */}
			{suggestion && (
				<AddressSuggestionDialog
					originalAddress={suggestion.address}
					suggestion={suggestion.data}
					onAccept={(addr) => suggestion.resolve(addr)}
					onKeepOriginal={() => suggestion.resolve(suggestion.address)}
					onClose={() => {
						setSuggestion(null);
						setSubmitting(false);
						setMutating(null);
					}}
				/>
			)}
		</div>
	);
}

/** Collapsed summary shown in AccordionStep header */
export function ShippingSummary({ address }: { address: AddressFormValues }) {
	return (
		<span className="truncate">
			{[address.streetAddress1, address.city, address.countryCode].filter(Boolean).join(", ")}
		</span>
	);
}
