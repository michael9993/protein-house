"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useBranding, useStoreInfo, useContentConfig } from "@/providers/StoreConfigProvider";

const Root = dynamic(() => import("@/checkout/Root").then((m) => m.Root), { ssr: false });

interface CheckoutBreadcrumbsProps {
	isOrderConfirmation: boolean;
	primaryColor: string;
}

function CheckoutBreadcrumbs({ isOrderConfirmation, primaryColor }: CheckoutBreadcrumbsProps) {
	const content = useContentConfig();
	const checkoutText = content.checkout;
	
	const steps = [
		{ id: 1, name: checkoutText?.shippingStep || "Shipping", completed: true },
		{ id: 2, name: checkoutText?.paymentStep || "Payment", completed: isOrderConfirmation },
		{ id: 3, name: checkoutText?.confirmationStep || "Confirmation", completed: isOrderConfirmation },
	];

	return (
		<nav aria-label="Checkout progress" className="mt-4 print:hidden">
			<ol className="flex items-center justify-center space-x-2 text-sm sm:space-x-4">
				{steps.map((step, index) => (
					<li key={step.id} className="flex items-center">
						<span
							className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
								step.completed
									? "text-white"
									: "bg-neutral-100 text-neutral-500"
							}`}
							style={step.completed ? { backgroundColor: primaryColor } : undefined}
						>
							{step.completed ? (
								<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
									<path
										fillRule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clipRule="evenodd"
									/>
								</svg>
							) : (
								step.id
							)}
						</span>
						<span
							className={`ml-2 hidden sm:inline ${
								step.completed ? "font-medium text-neutral-900" : "text-neutral-500"
							}`}
						>
							{step.name}
						</span>
						{index < steps.length - 1 && (
							<svg
								className="ml-2 h-5 w-5 text-neutral-300 sm:ml-4"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fillRule="evenodd"
									d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
									clipRule="evenodd"
								/>
							</svg>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
}

interface CheckoutPageClientProps {
	saleorApiUrl: string;
	isOrderConfirmation: boolean;
	channel: string;
}

export function CheckoutPageClient({ saleorApiUrl, isOrderConfirmation, channel }: CheckoutPageClientProps) {
	const branding = useBranding();
	const store = useStoreInfo();
	const content = useContentConfig();
	const checkoutText = content.checkout;

	if (!saleorApiUrl) {
		return null;
	}

	return (
		<div className="min-h-dvh bg-gradient-to-b from-neutral-50 to-white print:bg-white animate-fade-in">
			<section className="mx-auto flex min-h-dvh max-w-7xl flex-col p-4 sm:p-8">
				{/* Header */}
				<header className="flex items-center justify-between border-b border-neutral-200 pb-4 print:border-none animate-fade-in-up" style={{ animationDelay: "50ms", animationFillMode: "both" }}>
					<Link 
						aria-label="homepage" 
						href={`/${channel}`}
						className="flex items-center gap-2 text-xl font-bold transition-opacity hover:opacity-80"
						style={{ color: branding.colors.primary }}
					>
						{branding.logo && branding.logo !== "/logo.svg" ? (
							<Image
								src={branding.logo}
								alt={branding.logoAlt || store.name}
								width={120}
								height={32}
								className="h-8 w-auto"
								unoptimized
							/>
						) : (
							<>
								<svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
								</svg>
								{store.name}
							</>
						)}
					</Link>
					<div className="flex items-center gap-2 text-sm text-neutral-500 print:hidden">
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
						<span>{checkoutText?.secureCheckout || "Secure Checkout"}</span>
					</div>
				</header>

				{/* Progress indicator */}
				<div className="animate-fade-in-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
					<CheckoutBreadcrumbs 
						isOrderConfirmation={isOrderConfirmation} 
						primaryColor={branding.colors.primary} 
					/>
				</div>

				{/* Main checkout content */}
				<section className="mb-12 mt-6 flex-1 animate-fade-in-up" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
					<Root saleorApiUrl={saleorApiUrl} checkoutText={checkoutText} />
				</section>

				{/* Footer */}
				<footer className="mt-auto border-t border-neutral-200 pt-6 text-center text-xs text-neutral-500 print:hidden">
					<div className="flex flex-wrap items-center justify-center gap-4">
						<span>© {new Date().getFullYear()} {store.name}</span>
						<span>•</span>
						<Link href={`/${channel}/pages/privacy-policy`} className="hover:underline">
							{checkoutText?.privacyPolicy || checkoutText?.privacyPolicyLinkText || "Privacy Policy"}
						</Link>
						<span>•</span>
						<Link href={`/${channel}/pages/terms-of-service`} className="hover:underline">
							{checkoutText?.termsOfService || checkoutText?.termsOfServiceLinkText || "Terms of Service"}
						</Link>
					</div>
					<p className="mt-2">
						{checkoutText?.securityNote || checkoutText?.sslEncryptionMessage || "Protected by SSL encryption • Your payment info is safe"}
					</p>
				</footer>
			</section>
		</div>
	);
}
