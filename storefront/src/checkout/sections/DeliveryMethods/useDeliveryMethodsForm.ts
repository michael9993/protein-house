import { useCallback, useEffect, useMemo, useRef } from "react";
import { type CountryCode, useCheckoutDeliveryMethodUpdateMutation } from "@/checkout/graphql";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useDebouncedSubmit } from "@/checkout/hooks/useDebouncedSubmit";
import { type ChangeHandler, useForm, type UseFormReturn } from "@/checkout/hooks/useForm";
import { useFormSubmit } from "@/checkout/hooks/useFormSubmit";
import { type MightNotExist } from "@/checkout/lib/globalTypes";
import { getById } from "@/checkout/lib/utils/common";
import { useCheckoutUpdateStateChange } from "@/checkout/state/updateStateStore";

interface DeliveryMethodsFormData {
	selectedMethodId: string | undefined;
}

export const useDeliveryMethodsForm = (): UseFormReturn<DeliveryMethodsFormData> => {
	const { checkout } = useCheckout();
	const shippingMethods = checkout?.shippingMethods || [];
	const shippingAddress = checkout?.shippingAddress;
	const deliveryMethod = checkout?.deliveryMethod;
	const [, updateDeliveryMethod] = useCheckoutDeliveryMethodUpdateMutation();
	const { setCheckoutUpdateState } = useCheckoutUpdateStateChange("checkoutDeliveryMethodUpdate");

	const previousShippingCountry = useRef<MightNotExist<CountryCode>>(
		shippingAddress?.country?.code as CountryCode | undefined,
	);

	// Default to free shipping when available, otherwise lowest price
	const getAutoSetMethod = useCallback(() => {
		if (!shippingMethods.length) {
			return;
		}

		const freeMethod = shippingMethods.find((m) => (m.price?.amount ?? 0) === 0);
		if (freeMethod) {
			return freeMethod;
		}

		const cheapestMethod = shippingMethods.reduce(
			(resultMethod, currentMethod) =>
				(currentMethod.price?.amount ?? 0) < (resultMethod.price?.amount ?? 0)
					? currentMethod
					: resultMethod,
			shippingMethods[0],
		);

		return cheapestMethod;
	}, [shippingMethods]);

	const defaultFormData: DeliveryMethodsFormData = {
		selectedMethodId: deliveryMethod?.id || getAutoSetMethod()?.id,
	};

	const onSubmit = useFormSubmit<DeliveryMethodsFormData, typeof updateDeliveryMethod>(
		useMemo(
			() => ({
				scope: "checkoutDeliveryMethodUpdate",
				onSubmit: updateDeliveryMethod,
				shouldAbort: ({ formData: { selectedMethodId } }) =>
					!selectedMethodId || selectedMethodId === deliveryMethod?.id,
				parse: ({ selectedMethodId, languageCode, checkoutId }) => ({
					deliveryMethodId: selectedMethodId as string,
					languageCode,
					checkoutId,
				}),
				onError: ({ formData: { selectedMethodId }, formHelpers: { setValues } }) => {
					return setValues({ selectedMethodId });
				},
			}),
			[deliveryMethod?.id, updateDeliveryMethod],
		),
	);

	const debouncedSubmit = useDebouncedSubmit(onSubmit);

	const form = useForm<DeliveryMethodsFormData>({
		initialValues: defaultFormData,
		onSubmit: debouncedSubmit,
		initialDirty: true,
	});

	const {
		setFieldValue,
		values: { selectedMethodId },
		handleSubmit,
		handleChange,
	} = form;

	useEffect(() => {
		handleSubmit();
	}, [handleSubmit, selectedMethodId]);

	useEffect(() => {
		const hasShippingCountryChanged = shippingAddress?.country?.code !== previousShippingCountry.current;

		const hasValidMethodSelected = selectedMethodId && shippingMethods.some(getById(selectedMethodId));

		if (hasValidMethodSelected) {
			return;
		}

		void setFieldValue("selectedMethodId", getAutoSetMethod()?.id);

		if (hasShippingCountryChanged) {
			previousShippingCountry.current = shippingAddress?.country?.code as CountryCode;
		}
	}, [
		shippingAddress,
		shippingMethods,
		getAutoSetMethod,
		selectedMethodId,
		setFieldValue,
		form.values.selectedMethodId,
	]);

	const onChange: ChangeHandler = (event) => {
		setCheckoutUpdateState("loading");
		handleChange(event);
	};

	return { ...form, handleChange: onChange };
};
