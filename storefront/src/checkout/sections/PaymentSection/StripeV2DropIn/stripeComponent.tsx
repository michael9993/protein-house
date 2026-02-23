"use client";

import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useMemo, useState, useRef } from "react";
import { CheckoutForm } from "./stripeForm";
import { useCheckout } from "@/checkout/hooks/useCheckout";

interface StripeConfig {
	id?: string;
	data?: {
		stripePublishableKey?: string;
	} | null;
	errors?: Array<{ message: string; field?: string; code?: string }> | null;
}

/**
 * Map channel slug to Stripe locale
 * Stripe supports many locales including Hebrew ("he")
 * See: https://stripe.com/docs/js/appendix/supported_locales
 */
const getStripeLocale = (channelSlug?: string): string => {
	if (!channelSlug) return "en";
	
	// Map channel slugs to Stripe locales
	const localeMap: Record<string, string> = {
		"ils": "he",      // Hebrew for ILS channel
		"usd": "en",      // English for USD channel
		"eur": "en",      // English for EUR channel (or could be "de", "fr", etc.)
		"gbp": "en",      // English for GBP channel
		// Add more channel->locale mappings as needed
	};
	
	return localeMap[channelSlug.toLowerCase()] || "en";
};

/**
 * Extract publishable key from config
 * The publishable key should be in config.data.stripePublishableKey
 * (either from paymentGatewayInitialize mutation or extracted from original gateway config)
 */
const getPublishableKey = (config: StripeConfig): string | null => {
	if (config?.data && typeof config.data === 'object' && 'stripePublishableKey' in config.data) {
		return config.data.stripePublishableKey || null;
	}
	
	return null;
};

export const StripeComponent = ({ config }: { config: StripeConfig }) => {
	const { checkout } = useCheckout();
	const [loadingError, setLoadingError] = useState<string | null>(null);

	// Determine locale based on channel slug
	const stripeLocale = useMemo(() => {
		return getStripeLocale(checkout?.channel?.slug);
	}, [checkout?.channel?.slug]);

	// Extract publishable key - only recreate if the actual key value changes
	const publishableKey = useMemo(() => {
		const key = getPublishableKey(config);
		if (!key && config?.errors && config.errors.length > 0) {
			console.error("Payment gateway initialization errors:", config.errors);
		}
		return key;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [config?.data?.stripePublishableKey]);

	// Create Stripe promise only once per publishable key and locale
	const stripePromise = useMemo(() => {
		if (!publishableKey) {
			console.error("Missing Stripe publishable key", {
				hasData: !!config?.data,
				errors: config?.errors
			});
			setLoadingError("Missing payment gateway configuration");
			return null;
		}

		setLoadingError(null);
		const promise = loadStripe(publishableKey, {
			locale: stripeLocale as any,
		});

		promise.catch((error) => {
			console.error("Error initializing Stripe:", error);
			setLoadingError("Failed to initialize payment system");
		});

		return promise;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [publishableKey, stripeLocale]);

	// ALL hooks must be called before any conditional returns (React Rules of Hooks)
	// Compute amount/currency safely — use 0/usd as fallback when checkout is loading
	const amount = checkout?.totalPrice ? Math.round(checkout.totalPrice.gross.amount * 100) : 0;
	const currency = checkout?.totalPrice?.gross.currency?.toLowerCase() || "usd";
	const previousAmountRef = useRef(amount);
	const previousCurrencyRef = useRef(currency);
	const previousOptionsRef = useRef<StripeElementsOptions | null>(null);

	const stripeOptions: StripeElementsOptions = useMemo(() => {
		if (amount === 0) {
			// Return previous options if checkout is still loading
			if (previousOptionsRef.current) return previousOptionsRef.current;
			return { mode: "payment" as const, amount: 0, currency, appearance: { theme: "stripe" as const }, locale: stripeLocale as any };
		}

		const hasChanged = previousAmountRef.current !== amount || previousCurrencyRef.current !== currency;

		if (!hasChanged && previousOptionsRef.current) {
			return previousOptionsRef.current;
		}

		previousAmountRef.current = amount;
		previousCurrencyRef.current = currency;

		const newOptions: StripeElementsOptions = {
			mode: "payment",
			amount,
			appearance: { theme: "stripe" },
			currency,
			locale: stripeLocale as any,
		};

		previousOptionsRef.current = newOptions;
		return newOptions;
	}, [amount, currency, stripeLocale]);

	const gatewayId = useMemo(() => {
		if (!config.id) return "stripe";
		const parts = config.id.split(/[:.]/);
		if (parts.length === 3 && parts[0] === "app") return parts[1];
		return config.id;
	}, [config.id]);

	// Conditional returns AFTER all hooks
	if (loadingError) {
		return <div style={{ color: "var(--store-error)" }}>{loadingError}</div>;
	}

	if (!stripePromise) {
		return <div>Loading payment system...</div>;
	}

	if (!checkout?.totalPrice) {
		return <div>Loading checkout information...</div>;
	}

	return (
		<Elements
			key={`stripe-${publishableKey}-${stripeLocale}`}
			options={stripeOptions}
			stripe={stripePromise}
		>
			<CheckoutForm gatewayId={gatewayId} />
		</Elements>
	);
};
