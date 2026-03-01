"use client";

import { useCheckoutText } from "@/checkout-v2/hooks/useCheckoutText";

interface Props {
	channel: string;
}

export function EmptyCart({ channel }: Props) {
	const t = useCheckoutText();

	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
				<svg
					className="h-10 w-10 text-neutral-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
					/>
				</svg>
			</div>
			<h2 className="text-xl font-semibold text-neutral-900">
				{t.emptyCartTitle ?? "Your cart is empty"}
			</h2>
			<p className="mt-2 max-w-md text-sm text-neutral-500">
				{t.emptyCartMessage ?? "Add items to your cart before checking out."}
			</p>
			<a
				href={`/${channel}`}
				className="mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
				style={{ backgroundColor: "var(--store-primary, #6366f1)" }}
			>
				{t.continueShoppingButton ?? "Continue Shopping"}
			</a>
		</div>
	);
}
