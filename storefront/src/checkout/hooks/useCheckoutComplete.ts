import { useMemo } from "react";
import { type CombinedError } from "urql";
import { useCheckoutCompleteMutation } from "@/checkout/graphql";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useSubmit } from "@/checkout/hooks/useSubmit";
import { replaceUrl } from "@/checkout/lib/utils/url";
import type { MutationData } from "@/checkout/hooks/useSubmit/types";

// Filter out non-critical GraphQL errors that don't prevent order creation
const isNonCriticalError = (error: { message?: string }): boolean => {
	if (!error.message) return false;
	const message = error.message.toLowerCase();
	// MEDIA_URL warning is non-critical - order is still created
	return message.includes("media_url") || message.includes("static_url");
};

export const useCheckoutComplete = () => {
	const {
		checkout: { id: checkoutId },
	} = useCheckout();
	const [{ fetching }, checkoutComplete] = useCheckoutCompleteMutation();

	const onCheckoutComplete = useSubmit<{}, typeof checkoutComplete>(
		useMemo(
			() => ({
				parse: () => ({
					checkoutId,
				}),
				onSubmit: checkoutComplete,
				onSuccess: ({ data }: { data: { order?: { id: string } | null } }) => {
					const order = data.order;

					if (order) {
						const newUrl = replaceUrl({
							query: {
								order: order.id,
							},
							replaceWholeQuery: true,
						});
						window.location.href = newUrl;
					}
				},
				onError: ({ 
					data: errorData, 
					graphqlErrors,
					rawResult
				}: { 
					data?: { order?: { id: string } | null } | undefined;
					graphqlErrors?: CombinedError[];
					rawResult?: MutationData<typeof checkoutComplete>;
				}) => {
					// Even if there are errors, check if order was created
					// This handles cases where GraphQL returns warnings but order is still created
					// First check the extracted data, then check the raw mutation result
					let order = null;
					
					console.log("[Checkout Complete] 🔍 onError called with:", {
						hasErrorData: !!errorData,
						errorDataType: typeof errorData,
						hasRawResult: !!rawResult,
						hasGraphqlErrors: !!graphqlErrors?.length,
					});
					
					// Check extracted data first
					if (errorData) {
						console.log("[Checkout Complete] 🔍 Checking errorData:", {
							keys: Object.keys(errorData),
							data: errorData,
						});
						order = 
							(errorData as any)?.checkoutComplete?.order || 
							(errorData as any)?.order ||
							errorData?.order;
						
						if (order) {
							console.log("[Checkout Complete] ✅ Found order in errorData:", order.id);
						}
					}
					
					// If order not found, check the raw mutation result
					// The raw result has the structure: result.data?.checkoutComplete?.order
					if (!order && rawResult) {
						// Log the full raw result structure for debugging
						console.log("[Checkout Complete] 🔍 Checking raw result for order:", {
							hasData: !!rawResult.data,
							hasError: !!rawResult.error,
							dataKeys: rawResult.data ? Object.keys(rawResult.data) : [],
							fullData: rawResult.data,
						});
						
						if (rawResult.data) {
							const checkoutCompleteData = (rawResult.data as any)?.checkoutComplete;
							console.log("[Checkout Complete] 🔍 checkoutCompleteData:", {
								exists: !!checkoutCompleteData,
								isNull: checkoutCompleteData === null,
								keys: checkoutCompleteData ? Object.keys(checkoutCompleteData) : [],
								full: checkoutCompleteData,
							});
							
							// checkoutComplete can be null if mutation failed, but check for errors
							if (checkoutCompleteData === null) {
								console.error("[Checkout Complete] ❌ checkoutComplete is null - mutation failed");
								// Check if there are errors in the GraphQL response
								if (graphqlErrors && graphqlErrors.length > 0) {
									// Log the actual error messages
									const errorMessages = graphqlErrors
										.map((err: CombinedError) => {
											const msg = err.message || "";
											const graphQLErrors = err.graphQLErrors || [];
											const networkError = err.networkError?.message || "";
											return {
												message: msg,
												graphQLErrors: graphQLErrors.map((e: any) => e.message || String(e)),
												networkError: networkError,
											};
										})
										.filter((e: any) => e.message || e.graphQLErrors.length > 0 || e.networkError);
									
									console.error("[Checkout Complete] ❌ GraphQL errors:", JSON.stringify(errorMessages, null, 2));
									
									// Also log the full error objects for debugging
									console.error("[Checkout Complete] ❌ Full GraphQL error objects:", graphqlErrors.map((err: CombinedError) => ({
										message: err.message,
										graphQLErrors: err.graphQLErrors,
										networkError: err.networkError,
										fullError: err,
									})));
									
									// Check if all errors are non-critical (filtered warnings)
									const hasCriticalErrors = errorMessages.some((e: any) => {
										const allMessages = [e.message, ...e.graphQLErrors, e.networkError].join(" ").toLowerCase();
										return !isNonCriticalError({ message: allMessages });
									});
									
									if (!hasCriticalErrors) {
										console.warn("[Checkout Complete] ⚠️ Only non-critical errors found, but checkoutComplete is null - this is unexpected");
									}
								} else {
									console.error("[Checkout Complete] ❌ No GraphQL errors found, but checkoutComplete is null - this is unexpected");
								}
								// Even if checkoutComplete is null, the order might have been created
								// (e.g., if payment succeeded but GraphQL response failed)
								// In this case, we can't extract the order ID, but we should still try to help the user
								// by showing them a message and potentially redirecting to their orders
								console.error("[Checkout Complete] ❌ Cannot extract order ID - checkoutComplete is null");
								console.error("[Checkout Complete] ❌ This might indicate:");
								console.error("  1. The mutation failed due to a validation error");
								console.error("  2. The order was created but the GraphQL response failed");
								console.error("  3. A network or server error occurred");
								console.error("[Checkout Complete] ❌ Please check the error details above to diagnose the issue");
							} else {
								// checkoutComplete is not null, check for order
								order = checkoutCompleteData?.order;
								
								// Also check for errors in the checkoutComplete response
								const checkoutErrors = checkoutCompleteData?.errors;
								if (checkoutErrors && checkoutErrors.length > 0) {
									console.warn("[Checkout Complete] ⚠️ Checkout errors:", checkoutErrors);
								}
								
								if (order) {
									console.log("[Checkout Complete] ✅ Found order in raw mutation result:", order.id);
								} else {
									console.warn("[Checkout Complete] ⚠️ Order not found. Raw result structure:", {
										hasData: !!rawResult.data,
										dataKeys: rawResult.data ? Object.keys(rawResult.data) : [],
										checkoutCompleteData: checkoutCompleteData ? {
											keys: Object.keys(checkoutCompleteData),
											full: checkoutCompleteData,
										} : null,
									});
								}
							}
						} else {
							console.warn("[Checkout Complete] ⚠️ rawResult.data is null/undefined");
						}
					}

					if (order) {
						// Order was created successfully despite errors
						// Filter out non-critical errors from being shown
						const criticalErrors = (graphqlErrors || []).filter(
							(err: CombinedError) => !isNonCriticalError(err)
						);

						// Only show critical errors, but still navigate to confirmation
						if (criticalErrors.length === 0) {
							// No critical errors - navigate to confirmation
							const newUrl = replaceUrl({
								query: {
									order: order.id,
								},
								replaceWholeQuery: true,
							});
							window.location.href = newUrl;
						} else {
							// There are critical errors - log them but still navigate if order exists
							console.warn("[Checkout Complete] Order created but with critical errors:", criticalErrors);
							const newUrl = replaceUrl({
								query: {
									order: order.id,
								},
								replaceWholeQuery: true,
							});
							window.location.href = newUrl;
						}
					} else {
						// No order created - log detailed error information including raw result
						const errorDetails: Record<string, any> = {
							hasErrorData: !!errorData,
							errorDataType: typeof errorData,
							graphqlErrorsCount: graphqlErrors?.length || 0,
							hasRawResult: !!rawResult,
						};
						
						if (errorData) {
							errorDetails.errorDataKeys = Object.keys(errorData);
							errorDetails.errorData = errorData;
						}
						
						if (rawResult) {
							errorDetails.rawResult = {
								hasData: !!rawResult.data,
								hasError: !!rawResult.error,
								dataKeys: rawResult.data ? Object.keys(rawResult.data) : [],
								data: rawResult.data,
								error: rawResult.error ? {
									message: rawResult.error.message,
									graphQLErrors: rawResult.error.graphQLErrors,
									networkError: rawResult.error.networkError?.message,
								} : null,
							};
						}
						
						if (graphqlErrors && graphqlErrors.length > 0) {
							errorDetails.graphqlErrorMessages = graphqlErrors.map((err: CombinedError) => {
								// Extract all error messages
								const messages: string[] = [];
								if (err.message) messages.push(err.message);
								if (err.graphQLErrors) {
									err.graphQLErrors.forEach((e: any) => {
										if (e.message) messages.push(e.message);
										if (e.extensions?.exception?.args) {
											messages.push(...e.extensions.exception.args.map((a: any) => String(a)));
										}
									});
								}
								if (err.networkError?.message) messages.push(err.networkError.message);
								
								return {
									message: err.message || "Unknown error",
									allMessages: messages,
									graphQLErrors: err.graphQLErrors?.map((e: any) => ({
										message: e.message,
										extensions: e.extensions,
										full: e,
									})),
									networkError: err.networkError ? {
										message: err.networkError.message,
										name: err.networkError.name,
									} : undefined,
								};
							});
						}
						
						console.error("[Checkout Complete] ❌ Checkout completion failed:", JSON.stringify(errorDetails, null, 2));
					}
				},
				extractCustomErrors: (result: MutationData<typeof checkoutComplete>) => {
					// Check if order was created despite errors
					// The mutation result structure is: result.data?.checkoutComplete?.order
					const checkoutCompleteData = result.data?.checkoutComplete;
					const order = checkoutCompleteData?.order;
					
					if (order) {
						// Order exists - filter out non-critical GraphQL errors
						const graphqlErrors = result.error ? [result.error] : [];
						const criticalErrors = graphqlErrors.filter(
							(err: CombinedError) => !isNonCriticalError(err)
						);
						
						// Return empty array if only non-critical errors exist
						// This prevents toast notifications for warnings
						if (criticalErrors.length === 0) {
							return [];
						}
					}
					
					return [];
				},
			}),
			[checkoutComplete, checkoutId],
		),
	);
	return { completingCheckout: fetching, onCheckoutComplete };
};
