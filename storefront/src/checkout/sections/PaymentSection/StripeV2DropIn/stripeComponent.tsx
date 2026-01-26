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
	}, [config?.data?.stripePublishableKey]);
	
	// Create Stripe promise only once per publishable key and locale
	// CRITICAL: Only depend on publishableKey and locale, not config object
	// This prevents recreating the promise when config object reference changes
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
		// Pass locale to loadStripe for automatic UI translation
		const promise = loadStripe(publishableKey, {
			locale: stripeLocale as any, // Stripe locale type
		});
		
		// Handle initialization errors
		promise.catch((error) => {
			console.error("Error initializing Stripe:", error);
			setLoadingError("Failed to initialize payment system");
		});
		
		return promise;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [publishableKey, stripeLocale]); // Depend on publishableKey and locale

	if (loadingError) {
		return <div style={{ color: "var(--store-error)" }}>{loadingError}</div>;
	}

	if (!stripePromise) {
		return <div>Loading payment system...</div>;
	}

	// Memoize stripeOptions to prevent Elements from re-initializing
	// Use ref to track previous values and only update when they actually change
	if (!checkout?.totalPrice) {
		return <div>Loading checkout information...</div>;
	}
	const amount = Math.round(checkout.totalPrice.gross.amount * 100);
	const currency = checkout.totalPrice.gross.currency?.toLowerCase() || "usd";
	const previousAmountRef = useRef(amount);
	const previousCurrencyRef = useRef(currency);
	const previousOptionsRef = useRef<StripeElementsOptions | null>(null);
	
	// Only update options if amount, currency, or locale actually changed
	// This prevents unnecessary re-initialization of Elements when Link is selected
	const stripeOptions: StripeElementsOptions = useMemo(() => {
		const hasChanged = previousAmountRef.current !== amount || previousCurrencyRef.current !== currency;
		
		// If nothing changed and we have previous options, return them to prevent recreation
		if (!hasChanged && previousOptionsRef.current) {
			return previousOptionsRef.current;
		}
		
		// Update refs
		previousAmountRef.current = amount;
		previousCurrencyRef.current = currency;
		
		// Create new options
		// Note: paymentMethodTypes should be in PaymentElement options, not Elements options
		const newOptions: StripeElementsOptions = {
			mode: "payment",
			amount,
			appearance: { theme: "stripe" },
			currency,
			locale: stripeLocale as any, // Add locale for Hebrew/English support
		};
		
		// Store for next comparison
		previousOptionsRef.current = newOptions;
		
		return newOptions;
	}, [amount, currency, stripeLocale]);

	// Extract the app identifier from the gateway ID
	// Gateway ID from list is "app:stripe:stripe" but transaction needs just "stripe"
	const extractAppIdentifier = (fullId: string): string => {
		// Parse "app:stripe:stripe" or "app.stripe.stripe" to extract "stripe"
		const parts = fullId.split(/[:.]/);
		if (parts.length === 3 && parts[0] === "app") {
			return parts[1]; // Return the app identifier
		}
		return fullId; // Return as-is if not in expected format
	};
	
	const gatewayId = config.id ? extractAppIdentifier(config.id) : "stripe";

	// Pass the promise directly - Elements accepts Promise<Stripe | null>
	// and will handle the async initialization
	// Use stable key based on publishableKey and locale to prevent re-mounting
	// Don't include amount/currency in key to prevent remounts when totals change
	// This prevents jittery UI when Link is selected or payment method changes
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
