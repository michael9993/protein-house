"use client";

import { useState } from "react";
import Image from "next/image";
import { useStoreConfig, useOrderTrackingText, useBranding, useStoreInfo } from "@/providers/StoreConfigProvider";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { OrderDetailsClient } from "@/app/[channel]/(main)/account/orders/[orderId]/OrderDetailsClient";
import type { OrderByIdQuery } from "@/gql/graphql";

interface TrackOrderClientProps {
	channel: string;
}

export function TrackOrderClient({ channel }: TrackOrderClientProps) {
	const { branding } = useStoreConfig();
	const brandingConfig = useBranding();
	const store = useStoreInfo();
	const orderTracking = useOrderTrackingText();
	
	const [orderNumber, setOrderNumber] = useState("");
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [order, setOrder] = useState<NonNullable<OrderByIdQuery["order"]> | null>(null);

	const handleTrackOrder = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			// First, we need to find the order by number and validate email
			// This requires a server action since we need to query the database
			const response = await fetch(`/${channel}/track-order/validate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ orderNumber, email }),
			});

			const data = await response.json();

			if (!response.ok || !data.success) {
				setError(data.error || orderTracking.errorNotFound);
				setIsLoading(false);
				return;
			}

			// Order details are returned from the validation route
			if (data.order) {
				setOrder(data.order);
				setIsLoading(false);
			} else {
				setError(orderTracking.errorNotFound);
				setIsLoading(false);
			}
		} catch (err) {
			console.error("Track order error:", err);
			setError(orderTracking.errorGeneric);
			setIsLoading(false);
		}
	};

	if (order) {
		// Show order details
		return (
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="mb-6">
					<button
						onClick={() => {
							setOrder(null);
							setOrderNumber("");
							setEmail("");
							setError(null);
						}}
						className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
						</svg>
						{orderTracking.backToTracking || "Track Another Order"}
					</button>
					<h1 className="text-3xl font-bold text-neutral-900">
						{orderTracking.orderFoundTitle}
					</h1>
				</div>
				<OrderDetailsClient
					order={order}
					channel={channel}
					orderLinesForReorder={[]}
					reorderAction={async () => ({ success: false, error: "Please create an account to reorder" })}
					hideBackToOrders={true}
				/>
				{/* Create Account CTA */}
				<div className="mt-8 rounded-xl bg-white p-6 shadow-lg ring-1 ring-neutral-200 transition-shadow hover:shadow-xl">
					<div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
						<div className="flex-1">
							<h3 className="text-lg font-semibold text-neutral-900">
								{orderTracking.createAccountTitle}
							</h3>
							<p className="mt-1 text-sm text-neutral-600">
								{orderTracking.createAccountDescription}
							</p>
						</div>
						<LinkWithChannel
							href="/login"
							className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-md"
							style={{ backgroundColor: branding.colors.primary }}
						>
							{orderTracking.createAccountButton}
						</LinkWithChannel>
					</div>
				</div>
			</div>
		);
	}

	// Check if we have a valid logo URL from config
	const hasLogoUrl = brandingConfig.logo && 
		brandingConfig.logo !== "/logo.svg" && 
		brandingConfig.logo.trim() !== "";

	return (
		<div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
			<div className="text-center">
				<div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center">
					{hasLogoUrl ? (
						brandingConfig.logo.startsWith("http") ? (
							<Image
								src={brandingConfig.logo}
								alt={brandingConfig.logoAlt || store.name}
								width={80}
								height={80}
								className="h-20 w-auto object-contain"
								unoptimized
							/>
						) : (
							<img
								src={brandingConfig.logo}
								alt={brandingConfig.logoAlt || store.name}
								className="h-20 w-auto object-contain"
							/>
						)
					) : (
						<div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: `${branding.colors.primary}20` }}>
							<svg
								className="h-8 w-8"
								style={{ color: branding.colors.primary }}
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
					)}
				</div>
				<h1 className="text-3xl font-bold text-neutral-900">
					{orderTracking.title || "Track Your Order"}
				</h1>
				<p className="mt-2 text-neutral-600">
					{orderTracking.description || "Enter your order number and email address to view your order status and tracking information."}
				</p>
			</div>

			<div className="mt-8 rounded-xl bg-white p-8 shadow-lg ring-1 ring-neutral-200 transition-shadow hover:shadow-xl">
				<form onSubmit={handleTrackOrder} className="space-y-6">
					<div>
						<label htmlFor="orderNumber" className="block text-sm font-medium text-neutral-700">
							{orderTracking.orderNumberLabel}
						</label>
						<input
							type="text"
							id="orderNumber"
							required
							value={orderNumber}
							onChange={(e) => setOrderNumber(e.target.value)}
							placeholder={orderTracking.orderNumberPlaceholder}
							className="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-3 shadow-sm focus:border-neutral-500 focus:ring-neutral-500"
						/>
						<p className="mt-1 text-xs text-neutral-500">
							{orderTracking.orderNumberHelp}
						</p>
					</div>

					<div>
						<label htmlFor="email" className="block text-sm font-medium text-neutral-700">
							{orderTracking.emailLabel}
						</label>
						<input
							type="email"
							id="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder={orderTracking.emailPlaceholder}
							className="mt-1 block w-full rounded-lg border border-neutral-300 px-4 py-3 shadow-sm focus:border-neutral-500 focus:ring-neutral-500"
						/>
						<p className="mt-1 text-xs text-neutral-500">
							{orderTracking.emailHelp}
						</p>
					</div>

					{error && (
						<div className="rounded-lg bg-red-50 p-4">
							<div className="flex">
								<div className="flex-shrink-0">
									<svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
										<path
											fillRule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
											clipRule="evenodd"
										/>
									</svg>
								</div>
								<div className="ml-3">
									<p className="text-sm font-medium text-red-800">{error}</p>
								</div>
							</div>
						</div>
					)}

					<button
						type="submit"
						disabled={isLoading}
						className="w-full rounded-lg px-6 py-3 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						style={{ backgroundColor: branding.colors.primary }}
					>
						{isLoading ? (
							<span className="flex items-center justify-center gap-2">
								<svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
								</svg>
								{orderTracking.trackingButton || "Tracking..."}
							</span>
						) : (
							orderTracking.trackButton || "Track Order"
						)}
					</button>
				</form>
			</div>

			<div className="mt-6 text-center">
				<p className="text-sm text-neutral-600">
					{orderTracking.needHelpText}{" "}
					<LinkWithChannel
						href="/contact"
						className="font-medium hover:underline"
						style={{ color: branding.colors.primary }}
					>
						{orderTracking.contactSupportLink}
					</LinkWithChannel>
				</p>
			</div>
		</div>
	);
}
