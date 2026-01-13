import { useEffect, useMemo, useRef, useState } from "react";
import { type CountryCode, usePaymentGatewaysInitializeMutation } from "@/checkout/graphql";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useSubmit } from "@/checkout/hooks/useSubmit";
import { type MightNotExist } from "@/checkout/lib/globalTypes";
import { type ParsedPaymentGateways } from "@/checkout/sections/PaymentSection/types";
import { getFilteredPaymentGateways } from "@/checkout/sections/PaymentSection/utils";
import { stripeV2GatewayId } from "@/checkout/sections/PaymentSection/StripeV2DropIn/types";

export const usePaymentGatewaysInitialize = () => {
	const { checkout } = useCheckout();
	const billingAddress = checkout?.billingAddress;
	const checkoutId = checkout?.id || "";
	const availablePaymentGateways = checkout?.availablePaymentGateways;

	const billingCountry = billingAddress?.country.code as MightNotExist<CountryCode>;

	const [gatewayConfigs, setGatewayConfigs] = useState<ParsedPaymentGateways>([]);
	const previousBillingCountry = useRef(billingCountry);

	// Store original gateways with their config arrays for fallback
	// Deduplicate: prefer transformed IDs (app:stripe:stripe) over raw IDs (stripe)
	const originalGateways = useMemo(
		() => {
			const filtered = getFilteredPaymentGateways(availablePaymentGateways);
			
			// Deduplicate: prefer transformed IDs over raw IDs
			const deduplicated: typeof filtered = [];
			const seen = new Set<string>();
			
			// First pass: add transformed IDs (app:stripe:stripe, app.stripe.stripe, etc.)
			for (const gw of filtered) {
				if (gw.id.startsWith("app:stripe:") || gw.id.startsWith("app.stripe.") || gw.id === stripeV2GatewayId) {
					if (!seen.has(gw.id)) {
						seen.add(gw.id);
						deduplicated.push(gw);
					}
				}
			}
			
			// Second pass: add raw "stripe" only if no transformed version exists
			for (const gw of filtered) {
				if ((gw.id as string) === "stripe" && !seen.has("stripe") && !deduplicated.some(g => g.id.startsWith("app:stripe:") || g.id.startsWith("app.stripe."))) {
					seen.add("stripe");
					deduplicated.push(gw);
				}
			}
			
			console.log("[PaymentGateways] Original gateways from checkout", {
				availableCount: availablePaymentGateways?.length || 0,
				filteredCount: filtered.length,
				deduplicatedCount: deduplicated.length,
				availableIds: availablePaymentGateways?.map(g => g.id) || [],
				filteredIds: filtered.map(g => g.id),
				deduplicatedIds: deduplicated.map(g => g.id),
			});
			return deduplicated;
		},
		[availablePaymentGateways],
	);

	const [{ fetching }, paymentGatewaysInitialize] = usePaymentGatewaysInitializeMutation();

	const onSubmit = useSubmit<{}, typeof paymentGatewaysInitialize>(
		useMemo(
			() => ({
				hideAlerts: true,
				scope: "paymentGatewaysInitialize",
				// Don't abort if gateways are empty - the mutation might return gateways even if checkout query doesn't have them yet
				shouldAbort: () => false,
				onSubmit: paymentGatewaysInitialize,
				parse: () => ({
					checkoutId,
					// If originalGateways is empty, still try to initialize with empty array
					// The mutation might return gateways that weren't in the checkout query
					paymentGateways: originalGateways.length > 0 
						? originalGateways.map(({ config, id }) => ({
							id,
							data: config,
						}))
						: [],
				}),
				onSuccess: ({ data }) => {
					const rawConfigs = data.gatewayConfigs || [];
					
					// Parse the gateway configs - data field is a JSON string
					const parsedConfigs: ParsedPaymentGateways = rawConfigs.map((config) => {
						let parsedData: any = {};
						if (config.data) {
							try {
								parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
							} catch (e) {
								console.warn("Failed to parse gateway config data", { config, error: e });
							}
						}
						
						return {
							...config,
							data: parsedData,
						} as ParsedPaymentGateways[number];
					});

					console.log("[PaymentGateways] Mutation response", {
						rawConfigsCount: rawConfigs.length,
						parsedConfigsCount: parsedConfigs.length,
						gatewayIds: parsedConfigs.map(c => c.id),
						originalGatewaysCount: originalGateways.length,
						originalGatewayIds: originalGateways.map(g => g.id),
					});

					// If we have mutation results but no original gateways, use mutation results directly
					if (originalGateways.length === 0 && parsedConfigs.length > 0) {
						console.log("[PaymentGateways] Using mutation results directly (no original gateways)");
						setGatewayConfigs(parsedConfigs);
						return;
					}

					// Merge mutation results with original configs
					// If mutation failed for a gateway, extract publishable key from original config as fallback
					const mergedConfigs = originalGateways.map((originalGw) => {
						const mutationResult = parsedConfigs.find((gw) => gw.id === originalGw.id);
						
						// Extract publishable key from original gateway config array
						const originalPublishableKey = originalGw.config?.find(
							(c) => c.field === "stripePublishableKey"
						)?.value;
						
						if (mutationResult) {
							// If mutation succeeded and has data, use it
							if (mutationResult.data && typeof mutationResult.data === 'object' && 'stripePublishableKey' in mutationResult.data) {
								return mutationResult;
							}
							
							// If mutation returned but data is null/empty, use original config
							if (originalPublishableKey) {
								return {
									...mutationResult,
									data: { stripePublishableKey: originalPublishableKey },
								} as ParsedPaymentGateways[number];
							}
							
							// Return mutation result even if it has errors (component will handle it)
							return mutationResult;
						}
						
						// If mutation failed or gateway not in result, use original config
						if (originalPublishableKey) {
							return {
								id: originalGw.id,
								data: { stripePublishableKey: originalPublishableKey },
								errors: null,
							} as ParsedPaymentGateways[number];
						}
						
					// No publishable key found, return error state
					return {
						id: originalGw.id,
						data: null,
						errors: [{ message: "Payment gateway configuration not available", code: "NOT_FOUND" }],
					} as unknown as ParsedPaymentGateways[number];
					});

					// Deduplicate gateways - prefer transformed IDs (app:stripe:stripe) over raw IDs (stripe)
					const deduplicateGateways = (configs: ParsedPaymentGateways): ParsedPaymentGateways => {
						const seen = new Set<string>();
						const result: Array<ParsedPaymentGateways[number]> = [];
						
						// First pass: add transformed IDs (app:stripe:stripe, app.stripe.stripe, etc.)
						for (const config of configs) {
							if (config.id.startsWith("app:stripe:") || config.id.startsWith("app.stripe.") || config.id === stripeV2GatewayId) {
								if (!seen.has(config.id)) {
									seen.add(config.id);
									result.push(config);
								}
							}
						}
						
						// Second pass: add raw "stripe" only if no transformed version exists
						for (const config of configs) {
							if ((config.id as string) === "stripe" && !seen.has("stripe") && !result.some(c => c.id.startsWith("app:stripe:") || c.id.startsWith("app.stripe."))) {
								seen.add("stripe");
								result.push(config);
							}
						}
						
						return result;
					};

					// If we have merged configs, use them; otherwise use mutation results directly
					if (mergedConfigs.length > 0) {
						const deduplicated = deduplicateGateways(mergedConfigs);
						console.log("[PaymentGateways] Using merged configs", { 
							beforeDedup: mergedConfigs.length, 
							afterDedup: deduplicated.length,
							ids: deduplicated.map(c => c.id) 
						});
						setGatewayConfigs(deduplicated);
					} else if (parsedConfigs.length > 0) {
						const deduplicated = deduplicateGateways(parsedConfigs);
						console.log("[PaymentGateways] Using mutation results (no merged configs)", { 
							beforeDedup: parsedConfigs.length,
							afterDedup: deduplicated.length,
							ids: deduplicated.map(c => c.id) 
						});
						setGatewayConfigs(deduplicated);
					} else {
						// Only throw error if we truly have no gateways
						console.error("[PaymentGateways] No gateways available", {
							originalGatewaysCount: originalGateways.length,
							parsedConfigsCount: parsedConfigs.length,
							mergedConfigsCount: mergedConfigs.length,
							rawConfigsCount: rawConfigs.length,
						});
						throw new Error("No available payment gateways");
					}
				},
				onError: ({ errors: _errors }) => {
					// Removed excessive logging
					// On error, fall back to original gateways, extracting publishable key from config array
					const fallbackConfigs = originalGateways.map((gw) => {
						const publishableKey = gw.config?.find((c) => c.field === "stripePublishableKey")?.value;
						
						return {
							id: gw.id,
							data: publishableKey ? { stripePublishableKey: publishableKey } : null,
							errors: null,
						} as ParsedPaymentGateways[number];
					});
					
					setGatewayConfigs(fallbackConfigs);
				},
			}),
			[originalGateways, checkoutId, paymentGatewaysInitialize],
		),
	);

	useEffect(() => {
		void onSubmit();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Only run on mount

	useEffect(() => {
		if (billingCountry !== previousBillingCountry.current) {
			previousBillingCountry.current = billingCountry;
			void onSubmit();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [billingCountry]); // Only depend on billingCountry, not onSubmit to prevent unnecessary reruns

	return {
		fetching,
		availablePaymentGateways: gatewayConfigs || [],
	};
};
