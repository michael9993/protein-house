/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useCallback } from "react";
import { type CombinedError } from "urql";
import { useAlerts } from "@/checkout/hooks/useAlerts";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import {
	type CheckoutUpdateStateScope,
	useCheckoutUpdateStateChange,
} from "@/checkout/state/updateStateStore";
import { type FormDataBase } from "@/checkout/hooks/useForm";
import {
	type CommonVars,
	type MutationBaseFn,
	type MutationData,
	type MutationSuccessData,
	type MutationVars,
	type ParserFunction,
	type SimpleSubmitFn,
} from "@/checkout/hooks/useSubmit/types";
import { type ApiErrors } from "@/checkout/hooks/useGetParsedErrors/types";
import { extractMutationData, extractMutationErrors } from "@/checkout/hooks/useSubmit/utils";

interface CallbackProps<TData> {
	formData: TData;
	formHelpers?: any;
}

export interface UseSubmitProps<
	TData extends FormDataBase,
	TMutationFn extends MutationBaseFn,
	TErrorCodes extends string = string,
> {
	hideAlerts?: boolean;
	scope?: CheckoutUpdateStateScope;
	onSubmit: (vars: MutationVars<TMutationFn>) => Promise<MutationData<TMutationFn>>;
	parse?: ParserFunction<TData, TMutationFn>;
	onAbort?: (props: CallbackProps<TData>) => void;
	onSuccess?: (props: CallbackProps<TData> & { data: MutationSuccessData<TMutationFn> }) => void;
	onFinished?: () => void;
	onError?: (
		props: CallbackProps<TData> & {
			errors: ApiErrors<TData, TErrorCodes>;
			customErrors: any[];
			graphqlErrors: CombinedError[];
			data?: MutationSuccessData<TMutationFn>;
			rawResult?: MutationData<TMutationFn>;
		},
	) => void;
	extractCustomErrors?: (data: MutationData<TMutationFn>) => any[];
	onStart?: (props: CallbackProps<TData>) => void;
	shouldAbort?:
		| ((props: CallbackProps<TData>) => Promise<boolean>)
		| ((props: CallbackProps<TData>) => boolean);
}

export const useSubmit = <
	TData extends FormDataBase,
	TMutationFn extends MutationBaseFn,
	TErrorCodes extends string = string,
>({
	onSuccess,
	onError,
	onStart,
	onSubmit,
	onAbort,
	scope,
	shouldAbort,
	parse,
	onFinished,
	extractCustomErrors,
	hideAlerts = false,
}: UseSubmitProps<TData, TMutationFn, TErrorCodes>): SimpleSubmitFn<TData, TErrorCodes> => {
	const { setCheckoutUpdateState } = useCheckoutUpdateStateChange(
		// @ts-expect-error -- something is fishy
		scope,
	);
	const { showErrors } = useAlerts();
	const { checkout } = useCheckout();

	const handleSubmit = useCallback(
		async (formData: TData = {} as TData, formHelpers?: any) => {
			const callbackProps: CallbackProps<TData> = { formData, formHelpers };

			onStart?.(callbackProps);

			const shouldAbortSubmit = typeof shouldAbort === "function" ? await shouldAbort(callbackProps) : false;

			if (shouldAbortSubmit) {
				if (typeof onAbort === "function") {
					setCheckoutUpdateState("success");
					onAbort(callbackProps);
				}
				return { hasErrors: false, apiErrors: [], customErrors: [], graphqlErrors: [] };
			}

			setCheckoutUpdateState("loading");

			const commonData: CommonVars = {
				languageCode: "EN_US",
				channel: checkout.channel.slug,
				checkoutId: checkout.id,
			};

			const unparsedMutationVars = { ...formData, ...commonData };

			const result = await onSubmit(
				typeof parse === "function"
					? parse(unparsedMutationVars)
					: (unparsedMutationVars as MutationVars<TMutationFn>),
			);

			const { hasErrors, apiErrors, ...errorsRest } = extractMutationErrors<TData, TMutationFn, TErrorCodes>(
				result,
				extractCustomErrors,
			);

			const { success, data } = extractMutationData(result);

			// Check if order was created even if there are errors (for checkoutComplete)
			// This handles cases where GraphQL returns warnings but order is still created
			// GraphQL can return both data and errors, so we need to check result.data even if result.error exists
			let orderFromRawResult = null;
			if (result.data) {
				const checkoutCompleteData = (result.data as any)?.checkoutComplete;
				orderFromRawResult = checkoutCompleteData?.order;
				
				// Log for debugging
				if (orderFromRawResult) {
					console.log("[useSubmit] ✅ Found order in raw result despite errors:", orderFromRawResult.id);
				} else {
					console.log("[useSubmit] 🔍 Checking for order in raw result:", {
						hasData: !!result.data,
						dataKeys: result.data ? Object.keys(result.data) : [],
						hasCheckoutComplete: !!checkoutCompleteData,
						checkoutCompleteKeys: checkoutCompleteData ? Object.keys(checkoutCompleteData) : [],
					});
				}
			}

			// If we have successful data OR an order was created, treat as success
			const hasSuccessfulData = success && data;
			const hasOrder = hasSuccessfulData || !!orderFromRawResult;

			if (!hasErrors && success) {
				onSuccess?.({ ...callbackProps, data });
				setCheckoutUpdateState("success");

				onFinished?.();
				return { hasErrors, apiErrors, ...errorsRest };
			}

			// If order was created despite errors, call onSuccess instead of onError
			if (hasOrder && orderFromRawResult) {
				// Create a data object with the order for onSuccess
				const orderData = { order: orderFromRawResult };
				onSuccess?.({ ...callbackProps, data: orderData as any });
				setCheckoutUpdateState("success");
				onFinished?.();
				return { hasErrors, apiErrors, ...errorsRest };
			}

			// Call onError, but pass both extracted data and raw result so it can check if order was created
			// The raw result contains the full response structure: result.data?.checkoutComplete?.order
			onError?.({ 
				...callbackProps, 
				errors: apiErrors, 
				...errorsRest, 
				data: data || undefined,
				rawResult: result, // Pass raw result so onError can check result.data directly
			});

			// Only set error state and show alerts if there's no successful data
			// This prevents showing errors when order was created successfully
			if (!hasSuccessfulData) {
				setCheckoutUpdateState("error");

				if (!hideAlerts && scope) {
					showErrors(apiErrors, scope);
				}
			} else {
				// Data exists despite errors - treat as success
				setCheckoutUpdateState("success");
			}

			onFinished?.();
			return { hasErrors, apiErrors, ...errorsRest };
		},
		[
			onStart,
			shouldAbort,
			setCheckoutUpdateState,
			checkout.channel.slug,
			checkout.id,
			onSubmit,
			parse,
			extractCustomErrors,
			onError,
			hideAlerts,
			scope,
			onFinished,
			onAbort,
			onSuccess,
			showErrors,
		],
	);

	return handleSubmit;
};
