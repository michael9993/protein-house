import clsx from "clsx";
import React, { type FC, useState } from "react";
import { Button } from "@/checkout/components/Button";
import { TextInput } from "@/checkout/components/TextInput";
import { useCheckoutAddPromoCodeMutation } from "@/checkout/graphql";
import { type Classes } from "@/checkout/lib/globalTypes";
import { useFormSubmit } from "@/checkout/hooks/useFormSubmit";
import { FormProvider } from "@/checkout/hooks/useForm/FormProvider";
import { useForm } from "@/checkout/hooks/useForm";

interface PromoCodeFormData {
	promoCode: string;
}

export const PromoCodeAdd: FC<Classes> = ({ className }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [, checkoutAddPromoCode] = useCheckoutAddPromoCodeMutation();

	const onSubmit = useFormSubmit<PromoCodeFormData, typeof checkoutAddPromoCode>({
		scope: "checkoutAddPromoCode",
		onSubmit: checkoutAddPromoCode,
		parse: ({ promoCode, languageCode, checkoutId }) => ({
			promoCode,
			checkoutId,
			languageCode,
		}),
		onSuccess: ({ formHelpers: { resetForm } }) => {
			resetForm();
			setIsExpanded(false);
		},
	});

	const form = useForm<PromoCodeFormData>({
		onSubmit,
		initialValues: { promoCode: "" },
	});
	const {
		values: { promoCode },
	} = form;

	const showApplyButton = promoCode.length > 0;

	return (
		<FormProvider form={form}>
			<div className={clsx("space-y-3", className)}>
				{!isExpanded ? (
					<button
						type="button"
						onClick={() => setIsExpanded(true)}
						className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2.5 text-sm font-medium transition-colors"
						style={{ borderColor: "var(--store-neutral-300)", backgroundColor: "var(--store-surface)", color: "var(--store-neutral-600)" }}
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
						</svg>
						Add promo code or gift card
					</button>
				) : (
					<div className="relative">
						<TextInput 
							required={false} 
							name="promoCode" 
							label="Promo code or gift card" 
						/>
						<div className="absolute bottom-2 right-2 flex gap-1">
							{showApplyButton && (
								<Button
									variant="tertiary"
									ariaLabel="apply"
									label="Apply"
									type="submit"
								/>
							)}
							<button
								type="button"
								onClick={() => setIsExpanded(false)}
								className="rounded p-1.5"
								style={{ color: "var(--store-neutral-400)" }}
							>
								<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					</div>
				)}
			</div>
		</FormProvider>
	);
};
