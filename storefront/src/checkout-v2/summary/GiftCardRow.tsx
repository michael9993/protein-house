"use client";

import { useState, useTransition } from "react";
import { useCheckoutState } from "../CheckoutStateProvider";
import { removePromoCode } from "../_actions/remove-promo-code";
import { useCheckoutText } from "../hooks/useCheckoutText";
import type { CheckoutFragment } from "@/checkout/graphql";

type GiftCard = CheckoutFragment["giftCards"][number];

interface GiftCardRowProps {
	card: GiftCard;
	checkoutId: string;
}

export function GiftCardRow({ card, checkoutId }: GiftCardRowProps) {
	const { state, setCheckout } = useCheckoutState();
	const t = useCheckoutText();
	const checkout = state.checkout;
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	function handleRemove() {
		if (!checkout) return;
		startTransition(async () => {
			const result = await removePromoCode(checkoutId, { promoCodeId: card.id });
			if (result.errors.length > 0) {
				setError(result.errors.map((e) => e.message ?? e.code).join("; "));
				return;
			}
			if (result.checkout) {
				setCheckout({
					...checkout,
					giftCards: checkout.giftCards.filter((gc) => gc.id !== card.id),
					totalPrice: {
						...checkout.totalPrice,
						gross: result.checkout.totalPrice.gross,
					},
				});
			}
		});
	}

	return (
		<div className="flex items-center justify-between py-2 text-sm">
			<div>
				<span className="font-medium text-neutral-700">
					{t.giftCardLabel ?? "Gift card"}: {card.displayCode}
				</span>
				<span className="ms-2 text-neutral-500">
					−{card.currentBalance.amount.toFixed(2)} {card.currentBalance.currency}
				</span>
				{error && <p className="mt-0.5 text-xs text-red-600">{error}</p>}
			</div>
			<button
				type="button"
				onClick={handleRemove}
				disabled={isPending}
				aria-label={`Remove gift card ${card.displayCode}`}
				className="flex min-h-[44px] items-center px-2 text-xs text-neutral-400 hover:text-red-500 disabled:opacity-40"
			>
				{t.removePromoButton ?? "Remove"}
			</button>
		</div>
	);
}
