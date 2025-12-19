"use client";

import { useState } from "react";
import Link from "next/link";
import { storeConfig } from "@/config";

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
}

export function AddressesClient({
	channel,
	addresses,
	defaultShippingId,
	defaultBillingId,
}: AddressesClientProps) {
	const { branding } = storeConfig;
	const [showAddForm, setShowAddForm] = useState(false);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-neutral-900">My Addresses</h1>
					<p className="mt-1 text-neutral-500">
						{addresses.length === 0
							? "No addresses saved yet"
							: `${addresses.length} address${addresses.length !== 1 ? "es" : ""} saved`}
					</p>
				</div>
				<button
					onClick={() => setShowAddForm(!showAddForm)}
					className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
					style={{ backgroundColor: branding.colors.primary }}
				>
					<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
					</svg>
					Add Address
				</button>
			</div>

			{/* Add Address Form */}
			{showAddForm && (
				<div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
					<h2 className="mb-4 text-lg font-semibold text-neutral-900">Add New Address</h2>
					<p className="mb-4 text-sm text-neutral-500">
						Adding new addresses requires going through checkout. Your addresses will be saved automatically when you complete a purchase.
					</p>
					<div className="flex gap-3">
						<Link
							href={`/${channel}/products`}
							className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
							style={{ backgroundColor: branding.colors.primary }}
						>
							Continue Shopping
						</Link>
						<button
							onClick={() => setShowAddForm(false)}
							className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			{/* Addresses Grid */}
			{addresses.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-neutral-100">
					<div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
						<svg className="h-10 w-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
						</svg>
					</div>
					<h2 className="mt-6 text-xl font-semibold text-neutral-900">No addresses saved</h2>
					<p className="mt-2 max-w-sm text-neutral-500">
						Your shipping and billing addresses will be saved here when you complete checkout.
					</p>
					<Link
						href={`/${channel}/products`}
						className="mt-6 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
						style={{ backgroundColor: branding.colors.primary }}
					>
						<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
						</svg>
						Start Shopping
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
								className="relative rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-100"
							>
								{/* Badges */}
								<div className="absolute right-4 top-4 flex gap-2">
									{isDefaultShipping && (
										<span
											className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
											style={{ backgroundColor: branding.colors.primary }}
										>
											Default Shipping
										</span>
									)}
									{isDefaultBilling && (
										<span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
											Default Billing
										</span>
									)}
								</div>

								{/* Address Type Icon */}
								<div className="mb-4 flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
										<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
										</svg>
									</div>
									<div>
										<p className="font-semibold text-neutral-900">
											{address.firstName} {address.lastName}
										</p>
										<p className="text-xs text-neutral-500">
											{isDefaultShipping && isDefaultBilling
												? "Shipping & Billing"
												: isDefaultShipping
												? "Shipping Address"
												: isDefaultBilling
												? "Billing Address"
												: "Saved Address"}
										</p>
									</div>
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

								{/* Actions */}
								<div className="mt-4 flex items-center gap-4 border-t border-neutral-100 pt-4">
									<button className="text-sm font-medium text-neutral-600 hover:text-neutral-900">
										Edit
									</button>
									<button className="text-sm font-medium text-red-600 hover:text-red-700">
										Delete
									</button>
									{!isDefaultShipping && (
										<button
											className="text-sm font-medium hover:underline"
											style={{ color: branding.colors.primary }}
										>
											Set as Default
										</button>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

