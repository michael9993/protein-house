import React from "react";
import { useParams } from "next/navigation";
import { DefaultChannelSlug } from "@/app/config";
import { useCheckoutText } from "@/checkout/hooks/useCheckoutText";

export const EmptyCartPage = () => {
	const params = useParams();
	const text = useCheckoutText();
	
	const getChannel = (): string => {
		// Try to get from Next.js params first
		if (params?.channel) {
			return params.channel as string;
		}
		// Fallback to extracting from URL pathname
		const pathParts = window.location.pathname.split("/");
		const channel = pathParts.find((part, index) => 
			index > 0 && part && part !== "checkout" && part !== "api" && part !== "_next"
		);
		return channel || DefaultChannelSlug;
	};

	const goToStore = () => {
		const channel = getChannel();
		window.location.href = `/${channel}`;
	};

	const goToProducts = () => {
		const channel = getChannel();
		window.location.href = `/${channel}/products`;
	};

	return (
		<div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
			{/* Empty Cart Illustration */}
			<div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full" style={{ backgroundColor: "var(--store-neutral-100)" }}>
				<svg className="h-16 w-16" style={{ color: "var(--store-neutral-400)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path 
						strokeLinecap="round" 
						strokeLinejoin="round" 
						strokeWidth={1.5} 
						d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
					/>
				</svg>
			</div>

			{/* Title */}
			<h2 className="mb-2 text-2xl font-bold" style={{ color: "var(--store-text)" }}>{text.emptyCartTitle || "Your cart is empty"}</h2>
			
			{/* Description */}
			<p className="mb-8" style={{ color: "var(--store-text-muted)" }}>
				{text.emptyCartMessage || "Looks like you haven't added anything to your cart yet. Explore our products and find something you'll love!"}
			</p>

			{/* Actions */}
			<div className="flex flex-col gap-3 sm:flex-row">
				<button
					onClick={goToProducts}
					className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white transition-colors"
					style={{ backgroundColor: "var(--store-primary)" }}
				>
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
					{text.browseProductsButton || "Browse Products"}
				</button>
				<button
					onClick={goToStore}
					className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-6 py-3 text-sm font-medium transition-colors"
					style={{ borderColor: "var(--store-neutral-300)", color: "var(--store-text)" }}
				>
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
					</svg>
					{text.goToHomepageButton || "Go to Homepage"}
				</button>
			</div>

			{/* Suggestions */}
			<div className="mt-12 w-full rounded-lg border p-6" style={{ borderColor: "var(--store-neutral-200)", backgroundColor: "var(--store-surface)" }}>
				<h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--store-text)" }}>{text.needHelpText || "Need help?"}</h3>
				<ul className="space-y-2 text-sm" style={{ color: "var(--store-text-muted)" }}>
					<li className="flex items-center gap-2">
						<svg className="h-4 w-4" style={{ color: "var(--store-success)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
						{text.freeShippingBadge || "Free shipping on orders over $50"}
					</li>
					<li className="flex items-center gap-2">
						<svg className="h-4 w-4" style={{ color: "var(--store-success)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
						{text.easyReturnsBadge || "Easy 30-day returns"}
					</li>
					<li className="flex items-center gap-2">
						<svg className="h-4 w-4" style={{ color: "var(--store-success)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
						{text.securePaymentBadge || "Secure payment processing"}
					</li>
				</ul>
			</div>
		</div>
	);
};
