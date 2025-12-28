import { useEffect, useMemo, useRef, useState } from "react";
import { type CountryCode, usePaymentGatewaysInitializeMutation } from "@/checkout/graphql";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useSubmit } from "@/checkout/hooks/useSubmit";
import { type MightNotExist } from "@/checkout/lib/globalTypes";
import { type ParsedPaymentGateways } from "@/checkout/sections/PaymentSection/types";
import { getFilteredPaymentGateways } from "@/checkout/sections/PaymentSection/utils";

export const usePaymentGatewaysInitialize = () => {
	const {
		checkout: { billingAddress },
	} = useCheckout();
	const {
		checkout: { id: checkoutId, availablePaymentGateways },
	} = useCheckout();

	const billingCountry = billingAddress?.country.code as MightNotExist<CountryCode>;

	const [gatewayConfigs, setGatewayConfigs] = useState<ParsedPaymentGateways>([]);
	const previousBillingCountry = useRef(billingCountry);

	// Store original gateways with their config arrays for fallback
	const originalGateways = useMemo(
		() => getFilteredPaymentGateways(availablePaymentGateways),
		[availablePaymentGateways],
	);

	const [{ fetching }, paymentGatewaysInitialize] = usePaymentGatewaysInitializeMutation();

	const onSubmit = useSubmit<{}, typeof paymentGatewaysInitialize>(
		useMemo(
			() => ({
				hideAlerts: true,
				scope: "paymentGatewaysInitialize",
				shouldAbort: () => !availablePaymentGateways.length,
				onSubmit: paymentGatewaysInitialize,
				parse: () => ({
					checkoutId,
					paymentGateways: originalGateways.map(({ config, id }) => ({
						id,
						data: config,
					})),
				}),
				onSuccess: ({ data }) => {
					const parsedConfigs = (data.gatewayConfigs || []) as ParsedPaymentGateways;

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
						} as ParsedPaymentGateways[number];
					});

					if (!mergedConfigs.length) {
						throw new Error("No available payment gateways");
					}

					setGatewayConfigs(mergedConfigs);
				},
				onError: ({ errors }) => {
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
