"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useBranding, useAddressesText } from "@/providers/StoreConfigProvider";
import { CheckoutTextProvider, type CheckoutTextConfig } from "@/lib/checkout/useCheckoutText";
import { AddressForm } from "@/checkout-v2/components/AddressForm";
import { ConfirmDialog } from "@/checkout-v2/components/ConfirmDialog";
import { createUserAddress } from "@/checkout-v2/_actions/create-user-address";
import { updateUserAddress } from "@/checkout-v2/_actions/update-user-address";
import { deleteUserAddress } from "@/checkout-v2/_actions/delete-user-address";
import { setDefaultAddress } from "@/checkout-v2/_actions/set-default-address";
import type { AddressFormValues } from "@/checkout-v2/schemas";

interface Address {
	id: string;
	firstName: string;
	lastName: string;
	streetAddress1: string;
	streetAddress2?: string | null;
	city: string;
	cityArea?: string | null;
	postalCode: string;
	country: {
		code: string;
		country: string;
	};
	countryArea?: string | null;
	phone?: string | null;
	isDefaultShippingAddress?: boolean | null;
	isDefaultBillingAddress?: boolean | null;
}

interface AddressesClientProps {
	channel: string;
	addresses: Address[];
	defaultShippingId?: string | null;
	defaultBillingId?: string | null;
	checkoutText?: CheckoutTextConfig;
}

function addressToFormValues(addr: Address): Partial<AddressFormValues> {
	return {
		firstName: addr.firstName ?? "",
		lastName: addr.lastName ?? "",
		companyName: "",
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

export function AddressesClient({
	channel,
	addresses,
	defaultShippingId,
	defaultBillingId,
	checkoutText,
}: AddressesClientProps) {
	const router = useRouter();
	const brandingConfig = useBranding();
	const addressesText = useAddressesText();

	const [editingId, setEditingId] = useState<string | null>(null);
	const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
	const [showAddForm, setShowAddForm] = useState(false);
	const [saving, setSaving] = useState(false);
	const [formKey, setFormKey] = useState(0);

	async function handleAdd(values: AddressFormValues) {
		setSaving(true);
		try {
			const result = await createUserAddress(values, "SHIPPING" as any);
			if (!result.errors.length) {
				setShowAddForm(false);
				router.refresh();
			}
		} finally {
			setSaving(false);
		}
	}

	async function handleEdit(values: AddressFormValues) {
		if (!editingId) return;
		setSaving(true);
		try {
			const result = await updateUserAddress(editingId, values);
			if (!result.errors.length) {
				setEditingId(null);
				router.refresh();
			}
		} finally {
			setSaving(false);
		}
	}

	async function handleDeleteConfirm() {
		if (!deleteConfirmId) return;
		setSaving(true);
		try {
			const result = await deleteUserAddress(deleteConfirmId);
			if (result.success) {
				router.refresh();
			}
		} finally {
			setSaving(false);
			setDeleteConfirmId(null);
		}
	}

	function startEdit(addressId: string) {
		setEditingId(addressId);
		setShowAddForm(false);
		setFormKey((k) => k + 1);
	}

	function startAdd() {
		setShowAddForm(true);
		setEditingId(null);
		setFormKey((k) => k + 1);
	}

	function cancelForm() {
		setEditingId(null);
		setShowAddForm(false);
	}

	async function handleSetDefault(addressId: string, type: "SHIPPING" | "BILLING") {
		setSaving(true);
		try {
			const result = await setDefaultAddress(addressId, type);
			if (result.success) {
				router.refresh();
			}
		} finally {
			setSaving(false);
		}
	}

	const editingAddress = editingId
		? addresses.find((a) => a.id === editingId)
		: null;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-neutral-900">{addressesText.myAddresses}</h1>
					<p className="mt-1 text-neutral-500">
						{addresses.length === 0
							? addressesText.noAddressesYet
							: addressesText.addressesCount.replace("{count}", addresses.length.toString())}
					</p>
				</div>
				<button
					onClick={startAdd}
					className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
					style={{ backgroundColor: brandingConfig.colors.primary }}
				>
					<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
					</svg>
					{addressesText.addAddressButton}
				</button>
			</div>

			{/* Add / Edit Form */}
			{(showAddForm || editingId) && (
				<div className="rounded-lg border border-neutral-200 bg-white p-6">
					<h2 className="mb-4 text-lg font-semibold text-neutral-900">
						{editingId ? addressesText.editAddressTitle : addressesText.addNewAddressTitle}
					</h2>

					<CheckoutTextProvider config={checkoutText}>
						<AddressForm
							key={formKey}
							id="account-address-form"
							defaultValues={editingAddress ? addressToFormValues(editingAddress) : {}}
							onSubmit={editingId ? handleEdit : handleAdd}
						/>
					</CheckoutTextProvider>

					<div className="mt-4 flex items-center gap-3">
						<button
							type="submit"
							form="account-address-form"
							disabled={saving}
							className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
							style={{ backgroundColor: brandingConfig.colors.primary }}
						>
							{saving
								? addressesText.saving
								: editingId
									? addressesText.saveChanges
									: addressesText.addAddressButton}
						</button>
						<button
							type="button"
							onClick={cancelForm}
							className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
						>
							{addressesText.cancel}
						</button>
					</div>
				</div>
			)}

			{/* Addresses Grid */}
			{addresses.length === 0 && !showAddForm ? (
				<div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 px-6 py-16 text-center">
					<p className="text-lg font-semibold text-neutral-900">{addressesText.noAddresses}</p>
					<p className="mt-2 mx-auto max-w-sm text-sm text-neutral-500">
						{addressesText.noAddressesCheckoutMessage}
					</p>
					<Link
						href={`/${channel}/products`}
						className="mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
						style={{ backgroundColor: brandingConfig.colors.primary }}
					>
						{addressesText.startShopping}
					</Link>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2">
					{addresses.map((address) => {
						const isDefaultShipping = address.id === defaultShippingId || address.isDefaultShippingAddress;
						const isDefaultBilling = address.id === defaultBillingId || address.isDefaultBillingAddress;

						return (
							<div
								key={address.id}
								className="relative rounded-lg border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-sm"
							>
								{/* Badges - RTL-aware positioning */}
								<div className="absolute end-4 top-4 flex gap-2 flex-wrap">
									{isDefaultShipping && (
										<span
											className="rounded-full px-2 py-0.5 text-xs font-medium text-white whitespace-nowrap"
											style={{ backgroundColor: brandingConfig.colors.primary }}
										>
											{addressesText.defaultShipping}
										</span>
									)}
									{isDefaultBilling && (
										<span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white whitespace-nowrap">
											{addressesText.defaultBilling}
										</span>
									)}
								</div>

								<div className="mb-3" style={{ paddingInlineEnd: isDefaultShipping || isDefaultBilling ? '5.5rem' : '0' }}>
									<p className="font-medium text-neutral-900 truncate">
										{address.firstName} {address.lastName}
									</p>
									<p className="text-xs text-neutral-500 truncate">
										{isDefaultShipping && isDefaultBilling
											? addressesText.shippingAndBilling
											: isDefaultShipping
											? addressesText.shippingAddress
											: isDefaultBilling
											? addressesText.billingAddress
											: addressesText.savedAddress}
									</p>
								</div>

								{/* Address Details */}
								<div className="space-y-1 text-sm text-neutral-600">
									<p>{address.streetAddress1}</p>
									{address.streetAddress2 && <p>{address.streetAddress2}</p>}
									<p>
										{address.city}
										{address.cityArea && `, ${address.cityArea}`}
										{address.countryArea && `, ${address.countryArea}`} {address.postalCode}
									</p>
									<p>{address.country.country}</p>
									{address.phone && <p className="pt-2">{address.phone}</p>}
								</div>

								{/* Actions - RTL-aware layout */}
								<div className="mt-4 flex items-center gap-4 border-t border-neutral-100 pt-4 flex-wrap">
									<button
										onClick={() => startEdit(address.id)}
										className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900"
									>
										<Pencil className="h-4 w-4" />
										{addressesText.editButton}
									</button>
									<button
										onClick={() => setDeleteConfirmId(address.id)}
										className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
									>
										<Trash2 className="h-4 w-4" />
										{addressesText.deleteButton}
									</button>
									<div className="flex gap-3 ms-auto">
									{!isDefaultShipping && (
										<button
											onClick={() => handleSetDefault(address.id, "SHIPPING")}
											disabled={saving}
											className="text-sm font-medium hover:underline disabled:opacity-50"
											style={{ color: brandingConfig.colors.primary }}
										>
											{addressesText.setAsDefaultShipping ?? "Set as Default Shipping"}
										</button>
									)}
									{!isDefaultBilling && (
										<button
											onClick={() => handleSetDefault(address.id, "BILLING")}
											disabled={saving}
											className="text-sm font-medium text-green-600 hover:underline disabled:opacity-50"
										>
											{addressesText.setAsDefaultBilling ?? "Set as Default Billing"}
										</button>
									)}
								</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Delete confirmation */}
			<ConfirmDialog
				open={!!deleteConfirmId}
				title={addressesText.deleteConfirmTitle}
				message={addressesText.deleteConfirmMessage}
				confirmLabel={saving ? "…" : addressesText.deleteButton}
				cancelLabel={addressesText.cancel}
				onConfirm={handleDeleteConfirm}
				onCancel={() => setDeleteConfirmId(null)}
			/>
		</div>
	);
}
