"use client";

import Link from "next/link";

interface CheckoutBreadcrumbsProps {
	isOrderConfirmation: boolean;
	primaryColor: string;
}

export function CheckoutBreadcrumbs({ isOrderConfirmation, primaryColor }: CheckoutBreadcrumbsProps) {
	return (
		<div className="mt-6 flex items-center justify-center gap-2 text-sm print:hidden">
			{/* Cart */}
			<Link 
				href="/" 
				className="flex items-center gap-1.5 text-neutral-500 transition-colors hover:text-neutral-700"
			>
				<span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-xs font-medium text-neutral-600">
					1
				</span>
				<span>Cart</span>
			</Link>

			{/* Separator */}
			<svg className="h-4 w-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
			</svg>

			{/* Checkout */}
			<div 
				className="flex items-center gap-1.5"
				style={{ color: !isOrderConfirmation ? primaryColor : undefined }}
			>
				<span 
					className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
					style={{ 
						backgroundColor: isOrderConfirmation ? '#22c55e' : primaryColor,
						color: 'white'
					}}
				>
					{isOrderConfirmation ? (
						<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
						</svg>
					) : (
						'2'
					)}
				</span>
				<span className={isOrderConfirmation ? "text-neutral-500" : "font-medium"}>
					Checkout
				</span>
			</div>

			{/* Separator */}
			<svg className="h-4 w-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
			</svg>

			{/* Confirmation */}
			<div 
				className="flex items-center gap-1.5"
				style={{ color: isOrderConfirmation ? primaryColor : undefined }}
			>
				<span 
					className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium"
					style={{ 
						backgroundColor: isOrderConfirmation ? primaryColor : '#e5e5e5',
						color: isOrderConfirmation ? 'white' : '#737373'
					}}
				>
					{isOrderConfirmation ? (
						<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
						</svg>
					) : (
						'3'
					)}
				</span>
				<span className={isOrderConfirmation ? "font-medium" : "text-neutral-400"}>
					Confirmation
				</span>
			</div>
		</div>
	);
}

