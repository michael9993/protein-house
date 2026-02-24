import clsx from "clsx";
import React, { type FC, useState } from "react";
import { Button } from "@/checkout/components/Button";
import { TextInput } from "@/checkout/components/TextInput";
import { useCheckoutAddPromoCodeMutation } from "@/checkout/graphql";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { type Classes } from "@/checkout/lib/globalTypes";
import { useFormSubmit } from "@/checkout/hooks/useFormSubmit";
import { FormProvider } from "@/checkout/hooks/useForm/FormProvider";
import { useForm } from "@/checkout/hooks/useForm";
import { useCheckoutText, formatText } from "@/checkout/hooks/useCheckoutText";
import { getLanguageCodeForChannel } from "@/checkout/lib/utils/language";

interface PromoCodeFormData {
	promoCode: string;
}

export const PromoCodeAdd: FC<Classes> = ({ className }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const [codesToTry, setCodesToTry] = useState<string[]>([]);
	const [applying, setApplying] = useState(false);
	const { checkout } = useCheckout();
	const [, checkoutAddPromoCode] = useCheckoutAddPromoCodeMutation();
	const text = useCheckoutText();

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
			setCodesToTry([]);
			setIsExpanded(false);
		},
	});

	const form = useForm<PromoCodeFormData>({
		onSubmit,
		initialValues: { promoCode: "" },
	});
	const {
		values: { promoCode },
		setFieldValue,
		handleSubmit,
	} = form;

	const showApplyButton = promoCode.length > 0 || codesToTry.length > 0;

	const handleAddCode = () => {
		const code = promoCode.trim().toUpperCase();
		if (!code || codesToTry.includes(code)) return;
		setCodesToTry((prev) => [...prev, code]);
		setFieldValue("promoCode", "");
	};

	const handleRemoveCode = (index: number) => {
		setCodesToTry((prev) => prev.filter((_, i) => i !== index));
	};

	const maybeConfirmReplace = (): boolean => {
		if (!checkout?.voucherCode) return true;
		const msg = formatText(
			text.replaceVoucherConfirm ?? "Only one voucher can be used per order. Applying this code will replace {code}. Continue?",
			{ code: checkout.voucherCode },
		);
		return window.confirm(msg);
	};

	const handleApplyAll = async () => {
		if (!checkout?.id) return;
		const toTry = promoCode.trim() ? [promoCode.trim().toUpperCase(), ...codesToTry] : [...codesToTry];
		if (toTry.length > 0 && checkout.voucherCode && !maybeConfirmReplace()) return;
		setApplying(true);
		let applied = false;
		for (const code of toTry) {
			try {
				const result = await checkoutAddPromoCode({
					checkoutId: checkout.id,
					promoCode: code,
					languageCode: getLanguageCodeForChannel(checkout.channel?.slug),
				});
				if (result.data?.checkoutAddPromoCode?.checkout?.voucherCode) {
					applied = true;
					break;
				}
			} catch {
				// try next
			}
		}
		setApplying(false);
		if (applied) {
			setCodesToTry([]);
			setFieldValue("promoCode", "");
			setIsExpanded(false);
		}
	};

	return (
		<FormProvider form={form}>
			<div className={clsx("space-y-3", className)} dir="auto">
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
						{text.addPromoCodeText || "Add promo code or gift card"}
					</button>
				) : (
					<div className="relative space-y-2">
						<div dir="auto" className="flex flex-col gap-2">
							<TextInput
								required={false}
								name="promoCode"
								label={text.promoCodeLabel || "Promo code or gift card"}
								dir="auto"
								style={{ paddingInlineEnd: "6rem" }}
							/>
							<div className="flex flex-wrap gap-2" style={{ marginInlineStart: 0 }}>
								<Button
									variant="tertiary"
									ariaLabel={text.addPromoCodeText || "Add code"}
									label={text.addPromoCodeText || "Add code"}
									type="button"
									onClick={handleAddCode}
									disabled={!promoCode.trim()}
								/>
								{codesToTry.length > 0 && (
									<Button
										variant="tertiary"
										ariaLabel={text.applyPromoButton || "Apply"}
										label={applying ? "…" : (text.applyPromoButton || "Apply")}
										type="button"
										onClick={handleApplyAll}
										disabled={applying}
									/>
								)}
							</div>
						</div>
						{codesToTry.length > 0 && (
							<ul className="flex flex-wrap gap-1.5" dir="auto">
								{codesToTry.map((code, index) => (
									<li
										key={`${code}-${index}`}
										className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
										style={{ borderColor: "var(--store-neutral-200)", color: "var(--store-text)" }}
									>
										<span>{code}</span>
										<button
											type="button"
											onClick={() => handleRemoveCode(index)}
											className="rounded p-0.5 hover:opacity-70"
											aria-label="Remove code"
										>
											<svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									</li>
								))}
							</ul>
						)}
						<div className="absolute bottom-2 flex gap-1" style={{ insetInlineEnd: "0.5rem" }}>
							{showApplyButton && codesToTry.length === 0 && (
								<Button
									variant="tertiary"
									ariaLabel={text.applyPromoButton || "apply"}
									label={text.applyPromoButton || "Apply"}
									type="button"
									onClick={() => {
										if (checkout?.voucherCode && promoCode.trim() && !maybeConfirmReplace()) return;
										handleSubmit();
									}}
								/>
							)}
							<button
								type="button"
								onClick={() => setIsExpanded(false)}
								className="rounded p-1.5"
								style={{ color: "var(--store-neutral-400)" }}
								aria-label="Close"
							>
								<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<p className="text-xs" style={{ color: "var(--store-text-muted)" }}>
							{text.oneVoucherPerOrderHint ?? "One voucher per order. Gift cards can be combined."}
						</p>
					</div>
				)}
			</div>
		</FormProvider>
	);
};
