"use client";

import { useState, useTransition } from "react";
import { useCheckoutState } from "../CheckoutStateProvider";
import { useCheckoutText } from "../hooks/useCheckoutText";
import { applyPromoCode } from "../_actions/apply-promo-code";
import { removePromoCode } from "../_actions/remove-promo-code";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { mapPromoCodeError } from "@/lib/checkout/promo-error-map";

interface PromoCodeInputProps {
	checkoutId: string;
}

export function PromoCodeInput({ checkoutId }: PromoCodeInputProps) {
	const { state, setCheckout } = useCheckoutState();
	const t = useCheckoutText();
	const checkout = state.checkout;

	const [isExpanded, setIsExpanded] = useState(false);
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const [confirmPending, setConfirmPending] = useState<string | null>(null);

	const existingVoucher = checkout?.voucherCode ?? null;

	function handleApply() {
		const trimmed = code.trim();
		if (!trimmed) return;

		// If there's already a voucher, ask to confirm replacement
		if (existingVoucher && existingVoucher !== trimmed) {
			const msg = (t.replaceVoucherConfirm ?? "Replace {code}?").replace(
				"{code}",
				existingVoucher,
			);
			setConfirmPending(msg);
			return;
		}

		submitCode(trimmed);
	}

	function submitCode(trimmed: string) {
		if (!checkout) return;
		setError(null);

		startTransition(async () => {
			const result = await applyPromoCode(checkoutId, trimmed);
			if (result.errors.length > 0) {
				setError(result.errors.map((e) => mapPromoCodeError(e.code, t)).join("; "));
				return;
			}
			if (result.checkout) {
				setCheckout({
					...checkout,
					voucherCode: result.checkout.voucherCode ?? null,
					discountName: result.checkout.discountName ?? null,
					discount: result.checkout.discount
						? {
								__typename: "Money" as const,
								currency: result.checkout.discount.currency,
								amount: result.checkout.discount.amount,
							}
						: null,
					totalPrice: {
						...checkout.totalPrice,
						gross: result.checkout.totalPrice.gross,
					},
				});
			}
			setCode("");
			setIsExpanded(false);
		});
	}

	function handleRemoveVoucher() {
		if (!checkout || !existingVoucher) return;
		setError(null);

		startTransition(async () => {
			const result = await removePromoCode(checkoutId, { promoCode: existingVoucher });
			if (result.errors.length > 0) {
				setError(t.promoCodeRemoveError ?? "Failed to remove code");
				return;
			}
			if (result.checkout) {
				setCheckout({
					...checkout,
					voucherCode: result.checkout.voucherCode ?? null,
					discount: result.checkout.discount
						? {
								__typename: "Money" as const,
								currency: result.checkout.discount.currency,
								amount: result.checkout.discount.amount,
							}
						: null,
					totalPrice: {
						...checkout.totalPrice,
						gross: result.checkout.totalPrice.gross,
					},
				});
			}
		});
	}

	return (
		<div className="border-t border-neutral-100 py-3">
			{/* Applied voucher row */}
			{existingVoucher && (
				<div className="mb-2 flex items-center justify-between text-sm">
					<span className="text-neutral-700">
						<span className="font-medium">{checkout?.discountName ?? existingVoucher}</span>
						{checkout?.discount && (
							<span className="ms-2 text-emerald-600">
								−{checkout.discount.amount.toFixed(2)} {checkout.discount.currency}
							</span>
						)}
					</span>
					<button
						type="button"
						aria-label={`Remove voucher ${existingVoucher}`}
						onClick={handleRemoveVoucher}
						disabled={isPending}
						className="flex min-h-[44px] items-center px-2 text-xs text-neutral-400 hover:text-red-500 disabled:opacity-40"
					>
						{t.removePromoButton ?? "Remove"}
					</button>
				</div>
			)}

			{/* Expandable input */}
			{!isExpanded ? (
				<button
					type="button"
					aria-expanded={false}
					onClick={() => setIsExpanded(true)}
					className="flex w-full items-center justify-between rounded-lg border border-dashed border-neutral-300 px-3 py-2.5 text-sm text-neutral-600 transition-colors hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900"
				>
					<span className="flex items-center gap-2">
						<svg className="h-4 w-4 shrink-0 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
						</svg>
						{t.addPromoCodeText ?? "Add promo code or gift card"}
					</span>
					<svg className="h-4 w-4 shrink-0 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
						<path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
					</svg>
				</button>
			) : (
				<div className="space-y-2">
					<div className="flex gap-2">
						<input
							type="text"
							value={code}
							onChange={(e) => {
								setCode(e.target.value);
								setError(null);
							}}
							onKeyDown={(e) => e.key === "Enter" && handleApply()}
							placeholder={t.promoCodePlaceholder ?? "Enter code"}
							className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
							aria-label={t.promoCodeLabel ?? "Promo code or gift card"}
						/>
						<button
							type="button"
							onClick={handleApply}
							disabled={isPending || !code.trim()}
							className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
						>
							{isPending ? "…" : (t.applyPromoButton ?? "Apply")}
						</button>
					</div>

					{error && (
						<p role="alert" className="text-xs text-red-600">
							{error}
						</p>
					)}

					<p className="text-xs text-neutral-400">
						{t.oneVoucherPerOrderHint ?? "One voucher per order. Gift cards can be combined."}
					</p>

					<button
						type="button"
						onClick={() => {
							setIsExpanded(false);
							setCode("");
							setError(null);
						}}
						className="text-xs text-neutral-400 hover:text-neutral-600"
					>
						Cancel
					</button>
				</div>
			)}

			{/* Replace voucher confirmation dialog */}
			<ConfirmDialog
				open={confirmPending !== null}
				title="Replace voucher?"
				message={confirmPending ?? ""}
				confirmLabel="Replace"
				cancelLabel="Cancel"
				onConfirm={() => {
					setConfirmPending(null);
					submitCode(code.trim());
				}}
				onCancel={() => setConfirmPending(null)}
			/>
		</div>
	);
}
