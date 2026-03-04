"use client";

import { useCheckoutText, formatText } from "../hooks/useCheckoutText";
import { useEcommerceSettings } from "@/providers/StoreConfigProvider";

interface FreeShippingIndicatorProps {
	subtotalAmount: number;
	currency: string;
	methods: Array<{ id: string; name: string; price: { amount: number; currency: string } }>;
	selectedMethodId: string | null;
	/** When provided, the nudge becomes clickable and navigates to the delivery step */
	onChangeMethod?: () => void;
}

export function FreeShippingIndicator({
	subtotalAmount,
	currency,
	methods,
	selectedMethodId,
	onChangeMethod,
}: FreeShippingIndicatorProps) {
	const t = useCheckoutText();
	const ecommerce = useEcommerceSettings();
	const threshold = ecommerce?.shipping?.freeShippingThreshold ?? null;

	// Find cheapest free method (price === 0)
	const freeMethod = methods.find((m) => m.price.amount === 0);
	const selectedMethod = selectedMethodId
		? methods.find((m) => m.id === selectedMethodId)
		: null;

	// State 1: Success — user already selected the free method
	if (freeMethod && selectedMethodId === freeMethod.id) {
		return (
			<div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5">
				<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500">
					<svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
						<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<p className="text-sm font-medium text-emerald-800">
					{t.deliveryFreeShippingUnlocked ?? "Free shipping applied!"}
				</p>
			</div>
		);
	}

	// State 2: Nudge — free method available but user picked a paid one
	if (freeMethod && selectedMethod && selectedMethod.price.amount > 0) {
		const savings = `${selectedMethod.price.amount.toFixed(2)} ${selectedMethod.price.currency}`;
		// In-step: user can select directly; summary: needs to navigate back
		const inStepFallback = "You've unlocked free shipping! Select {methodName} to save {amount}";
		const summaryFallback = "You've unlocked free shipping! Go back to delivery and select {methodName} to save {amount}";
		const template = t.deliveryFreeShippingNudge
			?? (onChangeMethod ? summaryFallback : inStepFallback);
		const message = formatText(template, { methodName: freeMethod.name, amount: savings });

		// When onChangeMethod is provided, render as a clickable button
		if (onChangeMethod) {
			return (
				<button
					type="button"
					onClick={onChangeMethod}
					className="flex w-full items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-start transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
				>
					<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
						<svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
						</svg>
					</div>
					<p className="flex-1 text-sm font-medium text-emerald-800">
						{message}
					</p>
					<svg className="h-4 w-4 shrink-0 text-emerald-600 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
						<path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
					</svg>
				</button>
			);
		}

		return (
			<div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5">
				<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
					<svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
						<path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
					</svg>
				</div>
				<p className="text-sm font-medium text-emerald-800">
					{message}
				</p>
			</div>
		);
	}

	// State 3: Progress — no free method yet, but threshold is configured
	if (!freeMethod && threshold && threshold > 0 && subtotalAmount > 0) {
		const remaining = threshold - subtotalAmount;
		if (remaining <= 0) return null;
		const progress = Math.min(100, (subtotalAmount / threshold) * 100);
		const amountStr = `${remaining.toFixed(2)} ${currency}`;
		const template = t.deliveryAddMoreForFreeShipping ?? "Add {amount} more for free shipping";

		return (
			<div className="rounded-lg bg-emerald-50 p-2.5">
				<div className="flex items-center gap-2">
					<div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
						<svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
							<path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
						</svg>
					</div>
					<p className="text-sm font-medium text-emerald-800">
						{formatText(template, { amount: amountStr })}
					</p>
				</div>
				<div className="mt-1.5 ms-8 h-1 overflow-hidden rounded-full bg-emerald-200">
					<div
						className="h-full rounded-full bg-emerald-500 transition-all duration-500"
						style={{ width: `${progress}%` }}
					/>
				</div>
			</div>
		);
	}

	return null;
}
