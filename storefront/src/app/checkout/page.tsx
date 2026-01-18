import Link from "next/link";
import Image from "next/image";
import { invariant } from "ts-invariant";
import { RootWrapper } from "./pageWrapper";
import { CheckoutBreadcrumbs } from "./CheckoutBreadcrumbs";
import { fetchStorefrontConfig } from "@/lib/storefront-control/fetch-config";

export async function generateMetadata() {
	const config = await fetchStorefrontConfig("default");
	return {
		title: `Checkout${config.store.name ? ` · ${config.store.name}` : ""}`,
	};
}

export default async function CheckoutPage(props: {
	searchParams: Promise<{ checkout?: string; order?: string }>;
}) {
	const searchParams = await props.searchParams;
	const config = await fetchStorefrontConfig("default");
	const { branding, store: _store, content } = config;
	const storeName = _store.name;
	const isOrderConfirmation = !!searchParams.order;
	const checkoutText = content?.checkout;
	
	invariant(process.env.NEXT_PUBLIC_SALEOR_API_URL, "Missing NEXT_PUBLIC_SALEOR_API_URL env variable");

	if (!searchParams.checkout && !searchParams.order) {
		return null;
	}

	return (
		<div className="min-h-dvh bg-gradient-to-b from-neutral-50 to-white print:bg-white animate-fade-in">
			<section className="mx-auto flex min-h-dvh max-w-7xl flex-col p-4 sm:p-8">
				{/* Header */}
				<header className="flex items-center justify-between border-b border-neutral-200 pb-4 print:border-none animate-fade-in-up" style={{ animationDelay: "50ms", animationFillMode: "both" }}>
					<Link 
						aria-label="homepage" 
						href="/"
						className="flex items-center gap-2 text-xl font-bold transition-opacity hover:opacity-80"
						style={{ color: branding.colors.primary }}
					>
						{branding.logo && branding.logo !== "/logo.svg" ? (
							<Image
								src={branding.logo}
								alt={branding.logoAlt || storeName}
								width={120}
								height={32}
								className="h-8 w-auto"
							/>
						) : (
							<>
								<svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
								</svg>
								{storeName}
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
					<RootWrapper saleorApiUrl={process.env.NEXT_PUBLIC_SALEOR_API_URL} />
				</section>

				{/* Footer */}
				<footer className="mt-auto border-t border-neutral-200 pt-6 text-center text-xs text-neutral-500 print:hidden">
					<div className="flex flex-wrap items-center justify-center gap-4">
						<span>© {new Date().getFullYear()} {storeName}</span>
						<span>•</span>
						<Link href="/privacy" className="hover:underline">Privacy Policy</Link>
						<span>•</span>
						<Link href="/terms" className="hover:underline">Terms of Service</Link>
					</div>
					<p className="mt-2">
						Protected by SSL encryption • Your payment info is safe
					</p>
				</footer>
			</section>
		</div>
	);
}
