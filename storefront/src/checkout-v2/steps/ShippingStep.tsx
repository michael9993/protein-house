"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { CountryCode } from "@/lib/checkout/graphql-types";
import { useCheckoutState } from "../CheckoutStateProvider";
import { useCheckoutText } from "../hooks/useCheckoutText";
import { useUser } from "@/lib/checkout/UserContext";
import { AddressForm, type AddressFormHandle } from "../components/AddressForm";
import { SavedAddressList } from "../components/SavedAddressList";
import { AddressSuggestionDialog } from "../components/AddressSuggestionDialog";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { AddressFormValues } from "../schemas";
import { updateShippingAddress } from "../_actions/update-shipping-address";
import { updateBillingAddress } from "../_actions/update-billing-address";
import { createUserAddress } from "../_actions/create-user-address";
import { updateUserAddress } from "../_actions/update-user-address";
import { deleteUserAddress } from "../_actions/delete-user-address";
import { validateAddressExists } from "../_actions/validate-address";
import { setDefaultAddress } from "../_actions/set-default-address";
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
	const { state, dispatch, setMutating, setStepErrors, clearStepErrors, setCheckout, completeStepAndAdvance } =
		useCheckoutState();
	const { user, authenticated, reload } = useUser();

	// billingMatchesShipping lives in the reducer so it survives accordion remounts
	const billingMatchesShipping = state.billingMatchesShipping;
	const setBillingMatchesShipping = useCallback(
		(matches: boolean) => dispatch({ type: "SET_BILLING_MATCHES_SHIPPING", matches }),
		[dispatch],
	);
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

	// Billing form ref (for separate billing address)
	const billingFormRef = useRef<AddressFormHandle>(null);

	// Guard: prevent billing auto-detect from re-running after user interaction or reload
	const billingDetectedRef = useRef(false);

	// Billing address selection state — lives in reducer so it survives accordion remounts
	const [billingMode, setBillingMode] = useState<"saved" | "new">("saved");
	const selectedBillingId = state.selectedBillingId;
	const billingDefaults = state.billingDefaults;
	const setSelectedBillingId = useCallback(
		(id: string | null) => dispatch({ type: "SET_SELECTED_BILLING_ID", id }),
		[dispatch],
	);
	const setBillingDefaults = useCallback(
		(defaults: Partial<AddressFormValues>) => dispatch({ type: "SET_BILLING_DEFAULTS", defaults }),
		[dispatch],
	);
	const [billingFormKey, setBillingFormKey] = useState(0);

	// Shipping edit/delete state
	const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);

	// Billing edit/delete state (independent from shipping)
	const [editingBillingAddressId, setEditingBillingAddressId] = useState<string | null>(null);
	const [showBillingNewForm, setShowBillingNewForm] = useState(false);
	const [deleteBillingConfirmId, setDeleteBillingConfirmId] = useState<string | null>(null);
	const [deletingBilling, setDeletingBilling] = useState(false);

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
		setEditingAddressId(null);
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

	// Auto-detect separate billing address: if user has a different default billing,
	// auto-uncheck "same as shipping" and pre-select the billing address.
	// Guard: skip if billing was already configured (survives remounts via reducer).
	useEffect(() => {
		if (!hasSavedAddresses) return;
		// Skip if billing state was already set (persists in reducer across remounts)
		if (billingDetectedRef.current || !state.billingMatchesShipping || state.selectedBillingId) return;
		billingDetectedRef.current = true;
		const defaultBilling = savedAddresses.find(
			(a: { isDefaultBillingAddress?: boolean }) => a.isDefaultBillingAddress,
		);
		const defaultShippingAddr = savedAddresses.find(
			(a: { isDefaultShippingAddress?: boolean }) => a.isDefaultShippingAddress,
		);
		if (defaultBilling && defaultShippingAddr && defaultBilling.id !== defaultShippingAddr.id) {
			// Even if IDs differ, check if the address content is actually the same
			const sameContent =
				(defaultBilling.firstName ?? "") === (defaultShippingAddr.firstName ?? "") &&
				(defaultBilling.lastName ?? "") === (defaultShippingAddr.lastName ?? "") &&
				(defaultBilling.streetAddress1 ?? "") === (defaultShippingAddr.streetAddress1 ?? "") &&
				(defaultBilling.city ?? "") === (defaultShippingAddr.city ?? "") &&
				(defaultBilling.postalCode ?? "") === (defaultShippingAddr.postalCode ?? "") &&
				(defaultBilling.country?.code ?? "") === (defaultShippingAddr.country?.code ?? "");
			if (sameContent) {
				// Addresses match — keep "same as shipping" checked
				return;
			}
			setBillingMatchesShipping(false);
			setSelectedBillingId(defaultBilling.id);
			setBillingDefaults({
				firstName: defaultBilling.firstName ?? "",
				lastName: defaultBilling.lastName ?? "",
				companyName: defaultBilling.companyName ?? "",
				streetAddress1: defaultBilling.streetAddress1 ?? "",
				streetAddress2: defaultBilling.streetAddress2 ?? "",
				city: defaultBilling.city ?? "",
				cityArea: (defaultBilling as { cityArea?: string }).cityArea ?? "",
				countryCode: defaultBilling.country?.code ?? "IL",
				countryArea: defaultBilling.countryArea ?? "",
				postalCode: defaultBilling.postalCode ?? "",
				phone: defaultBilling.phone ?? "",
			});
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hasSavedAddresses]);

	// Selection fix: when returning to shipping step, match checkout address to saved addresses
	useEffect(() => {
		if (selectedAddressId || !checkoutAddress || !hasSavedAddresses) return;
		const matched = savedAddresses.find(
			(a: {
				firstName?: string | null;
				lastName?: string | null;
				streetAddress1?: string | null;
				city?: string | null;
				postalCode?: string | null;
				country: { code: string };
			}) =>
				a.firstName === checkoutAddress.firstName &&
				a.lastName === checkoutAddress.lastName &&
				a.streetAddress1 === checkoutAddress.streetAddress1 &&
				a.city === checkoutAddress.city &&
				a.postalCode === checkoutAddress.postalCode &&
				a.country.code === (checkoutAddress.country?.code ?? ""),
		);
		if (matched) {
			setSelectedAddressId(matched.id);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [checkoutAddress, hasSavedAddresses, savedAddresses]);

	// ---------------------------------------------------------------------------
	// Edit / Delete handlers
	// ---------------------------------------------------------------------------

	function handleEdit(addressId: string) {
		const addr = savedAddresses.find((a: { id: string }) => a.id === addressId);
		if (!addr) return;
		setEditingAddressId(addressId);
		setShowNewForm(true);
		setFormDefaults({
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
		});
		setFormKey((k) => k + 1);
	}

	function handleDeleteRequest(addressId: string) {
		setDeleteConfirmId(addressId);
	}

	async function handleDeleteConfirm() {
		if (!deleteConfirmId) return;
		setDeleting(true);
		try {
			const result = await deleteUserAddress(deleteConfirmId);
			if (result.success) {
				// If we deleted the currently selected address, clear selection
				if (selectedAddressId === deleteConfirmId) {
					setSelectedAddressId(null);
				}
				// Also clear billing selection if same address was deleted
				if (selectedBillingId === deleteConfirmId) {
					setSelectedBillingId(null);
				}
				await reload();
			}
		} finally {
			setDeleting(false);
			setDeleteConfirmId(null);
		}
	}

	// ---------------------------------------------------------------------------
	// Billing edit / delete handlers (independent from shipping)
	// ---------------------------------------------------------------------------

	function handleBillingEdit(addressId: string) {
		const addr = savedAddresses.find((a: { id: string }) => a.id === addressId);
		if (!addr) return;
		setEditingBillingAddressId(addressId);
		setShowBillingNewForm(true);
		setBillingMode("new");
		setBillingDefaults({
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
		});
		setBillingFormKey((k) => k + 1);
	}

	function handleBillingDeleteRequest(addressId: string) {
		setDeleteBillingConfirmId(addressId);
	}

	async function handleBillingDeleteConfirm() {
		if (!deleteBillingConfirmId) return;
		setDeletingBilling(true);
		try {
			const result = await deleteUserAddress(deleteBillingConfirmId);
			if (result.success) {
				if (selectedBillingId === deleteBillingConfirmId) {
					setSelectedBillingId(null);
				}
				if (selectedAddressId === deleteBillingConfirmId) {
					setSelectedAddressId(null);
				}
				await reload();
			}
		} finally {
			setDeletingBilling(false);
			setDeleteBillingConfirmId(null);
		}
	}

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
		} else if (selectedBillingId && billingMode === "saved") {
			// Use the saved address values selected from the list
			await updateBillingAddress(checkoutId, billingDefaults as AddressFormValues);
		} else if (billingFormRef.current) {
			const valid = await billingFormRef.current.trigger();
			if (!valid) return; // billing form has validation errors — stop
			const billingValues = billingFormRef.current.getValues();
			await updateBillingAddress(checkoutId, billingValues);
		}

		// Persist address to user account + set as default shipping
		if (authenticated) {
			if (editingAddressId) {
				// Update existing address
				const updateResult = await updateUserAddress(editingAddressId, address);
				if (!updateResult.errors.length) {
					await setDefaultAddress(editingAddressId, "SHIPPING");
					await reload();
					setSelectedAddressId(editingAddressId);
				}
				setEditingAddressId(null);
			} else if (selectedAddressId) {
				// Re-selecting an existing address — set it as default shipping
				await setDefaultAddress(selectedAddressId, "SHIPPING");
			} else {
				// Save new address as default shipping
				const saveResult = await createUserAddress(address, "SHIPPING" as any);
				if (!saveResult.errors.length) {
					await reload();
				}
			}
		}

		// Persist billing address to user account + set as default billing
		if (authenticated && !billingMatchesShipping) {
			if (editingBillingAddressId && (billingMode === "new" || showBillingNewForm)) {
				const billingAddr = billingFormRef.current?.getValues();
				if (billingAddr) {
					const updateResult = await updateUserAddress(editingBillingAddressId, billingAddr);
					if (!updateResult.errors.length) {
						await setDefaultAddress(editingBillingAddressId, "BILLING");
						await reload();
						setSelectedBillingId(editingBillingAddressId);
					}
					setEditingBillingAddressId(null);
				}
			} else if (selectedBillingId && billingMode === "saved") {
				// Re-selecting an existing address for billing — set as default billing
				await setDefaultAddress(selectedBillingId, "BILLING");
			} else if ((billingMode === "new" || showBillingNewForm) && !selectedBillingId && billingFormRef.current) {
				const billingAddr = billingFormRef.current.getValues();
				const saveResult = await createUserAddress(billingAddr, "BILLING" as any);
				if (!saveResult.errors.length) {
					await reload();
				}
			}
		} else if (authenticated && billingMatchesShipping && selectedAddressId) {
			// When billing matches shipping, set the shipping address as default billing too
			await setDefaultAddress(selectedAddressId, "BILLING");
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
					name="shipping-address"
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
						setEditingAddressId(null);
						setShowNewForm(true);
						setFormDefaults({});
						setFormKey((k) => k + 1);
					}}
					onEdit={handleEdit}
					onDelete={handleDeleteRequest}
				/>
			)}

			{/* "Back to saved addresses" link when showing new form */}
			{hasSavedAddresses && showNewForm && (
				<button
					type="button"
					onClick={() => {
						setShowNewForm(false);
						setEditingAddressId(null);
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
					&larr; {editingAddressId
						? (t.cancelButton ?? "Cancel")
						: (t.changeAddressButton ?? "Use saved address")}
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

			{/* Separate billing address */}
			{!billingMatchesShipping && (
				<div className="space-y-3">
					<p className="text-sm font-medium text-neutral-700">
						{t.billingAddressTitle ?? "Billing Address"}
					</p>
					<p className="text-sm text-neutral-500">
						{t.billingAddressSubtitle ?? "For your invoice"}
					</p>

					{/* Saved billing address list */}
					{hasSavedAddresses && billingMode === "saved" && !showBillingNewForm && (
						<SavedAddressList
							name="billing-address"
							addresses={savedAddresses}
							selectedId={selectedBillingId}
							onSelect={(addr) => {
								const match = savedAddresses.find(
									(a: { streetAddress1?: string | null; firstName?: string | null; lastName?: string | null }) =>
										a.streetAddress1 === addr.streetAddress1 && a.firstName === addr.firstName && a.lastName === addr.lastName,
								);
								setSelectedBillingId(match?.id ?? null);
								setBillingDefaults(addr);
							}}
							onAddNew={() => {
								setBillingMode("new");
								setShowBillingNewForm(true);
								setSelectedBillingId(null);
								setEditingBillingAddressId(null);
								setBillingDefaults({});
								setBillingFormKey((k) => k + 1);
							}}
							onEdit={handleBillingEdit}
							onDelete={handleBillingDeleteRequest}
						/>
					)}

					{/* "Back to saved billing addresses" link */}
					{hasSavedAddresses && (billingMode === "new" || showBillingNewForm) && (
						<button
							type="button"
							onClick={() => {
								setBillingMode("saved");
								setShowBillingNewForm(false);
								setEditingBillingAddressId(null);
								const prev = savedAddresses.find(
									(a: { id: string }) => a.id === selectedBillingId,
								) ?? savedAddresses.find(
									(a: { isDefaultBillingAddress?: boolean }) => a.isDefaultBillingAddress,
								) ?? savedAddresses[0];
								if (prev) {
									setSelectedBillingId(prev.id);
									setBillingDefaults({
										firstName: prev.firstName ?? "",
										lastName: prev.lastName ?? "",
										companyName: prev.companyName ?? "",
										streetAddress1: prev.streetAddress1 ?? "",
										streetAddress2: prev.streetAddress2 ?? "",
										city: prev.city ?? "",
										cityArea: prev.cityArea ?? "",
										countryCode: prev.country.code,
										countryArea: prev.countryArea ?? "",
										postalCode: prev.postalCode ?? "",
										phone: prev.phone ?? "",
									});
								}
							}}
							className="text-sm text-[var(--store-primary,theme(colors.neutral.900))] underline-offset-2 hover:underline"
						>
							&larr; {editingBillingAddressId
								? (t.cancelButton ?? "Cancel")
								: (t.useSavedAddressButton ?? "Use a saved address")}
						</button>
					)}

					{/* Billing address form (new or editing) */}
					{(billingMode === "new" || showBillingNewForm || !hasSavedAddresses) && (
						<AddressForm
							ref={billingFormRef}
							key={billingFormKey}
							id="billing-address-form"
							defaultValues={billingDefaults}
							onSubmit={async () => {}}
						/>
					)}
				</div>
			)}

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

			{/* Delete confirmation dialog (shipping) */}
			<ConfirmDialog
				open={!!deleteConfirmId}
				title={t.deleteAddressConfirmTitle ?? "Delete address?"}
				message={t.deleteAddressConfirmMessage ?? "This address will be permanently removed from your account."}
				confirmLabel={deleting ? (t.processingText ?? "Processing…") : (t.deleteAddressButton ?? "Delete")}
				cancelLabel={t.cancelButton ?? "Cancel"}
				onConfirm={handleDeleteConfirm}
				onCancel={() => setDeleteConfirmId(null)}
			/>

			{/* Delete confirmation dialog (billing) */}
			<ConfirmDialog
				open={!!deleteBillingConfirmId}
				title={t.deleteAddressConfirmTitle ?? "Delete address?"}
				message={t.deleteAddressConfirmMessage ?? "This address will be permanently removed from your account."}
				confirmLabel={deletingBilling ? (t.processingText ?? "Processing…") : (t.deleteAddressButton ?? "Delete")}
				cancelLabel={t.cancelButton ?? "Cancel"}
				onConfirm={handleBillingDeleteConfirm}
				onCancel={() => setDeleteBillingConfirmId(null)}
			/>
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
