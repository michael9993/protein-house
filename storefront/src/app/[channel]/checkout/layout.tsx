import { type ReactNode } from "react";
import { CheckoutAuthProvider } from "@/app/checkout/CheckoutAuthProvider";
import { StoreConfigProvider } from "@/providers/StoreConfigProvider";
import { fetchStorefrontConfig } from "@/lib/storefront-control";
import { DirectionSetter } from "@/components/DirectionSetter";
import { resolveDirection } from "@/lib/direction";

/**
 * Checkout layout - standalone layout with StoreConfigProvider
 * but without the main site Header/Footer
 */
export default async function CheckoutLayout(props: {
	children: ReactNode;
	params: Promise<{ channel: string }>;
}) {
	const { channel } = await props.params;
	const storeConfig = await fetchStorefrontConfig(channel);
	
	// Resolve direction server-side
	const resolvedDirection = resolveDirection(storeConfig);
	const resolvedLocale = storeConfig.localization?.defaultLocale || 'en-US';

	return (
		<>
			{/* Blocking inline script for direction */}
			<script
				dangerouslySetInnerHTML={{
					__html: `document.documentElement.setAttribute('dir','${resolvedDirection}');document.documentElement.setAttribute('lang','${resolvedLocale}');`,
				}}
			/>
			<StoreConfigProvider config={storeConfig}>
				<DirectionSetter config={storeConfig} />
				<CheckoutAuthProvider>
					{props.children}
				</CheckoutAuthProvider>
			</StoreConfigProvider>
		</>
	);
}
