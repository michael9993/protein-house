"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCheckoutState } from "../CheckoutStateProvider";
import { useCheckoutText } from "../hooks/useCheckoutText";
import { updateLineQuantity } from "../_actions/update-line-quantity";
import { removeLine } from "../_actions/remove-line";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { STEP_DELIVERY, STEP_PAYMENT } from "../types";
import type { CheckoutFragment } from "@/lib/checkout/graphql-types";

type CheckoutLine = CheckoutFragment["lines"][number];

interface SummaryLineItemProps {
	line: CheckoutLine;
	checkoutId: string;
}


/** Derive consistent shippingPrice + totalPrice after a cart line mutation.
 *  Saleor recalculates shippingMethods[].price but NOT the checkout-level
 *  shippingPrice/totalPrice until checkoutDeliveryMethodUpdate is called.
 *  We fix totalPrice via delta correction: no hardcoded thresholds needed. */
function deriveShippingAndTotal(
	checkout: CheckoutFragment,
	serverResult: {
		subtotalPrice: { gross: { amount: number; currency: string } };
		totalPrice: { gross: { amount: number; currency: string } };
		shippingPrice: { gross: { amount: number; currency: string } } | null;
		shippingMethods: Array<{ id: string; price: { amount: number; currency: string } }>;
	},
) {
	const selectedId = (checkout.deliveryMethod as Record<string, unknown> | null)?.id;
	const updatedMethod = selectedId
		? serverResult.shippingMethods.find((m) => m.id === selectedId)
		: null;

	let shippingGross: { amount: number; currency: string };
	if (updatedMethod) {
		shippingGross = { amount: updatedMethod.price.amount, currency: updatedMethod.price.currency };
	} else if (serverResult.shippingPrice) {
		shippingGross = serverResult.shippingPrice.gross;
	} else {
		shippingGross = checkout.shippingPrice?.gross ?? { amount: 0, currency: serverResult.subtotalPrice.gross.currency };
	}

	// Correct totalPrice by the delta between server's stale shipping and our derived shipping
	const serverShipping = serverResult.shippingPrice?.gross?.amount ?? 0;
	const derivedShipping = shippingGross.amount;
	const shippingDelta = derivedShipping - serverShipping;

	return {
		shippingPrice: { ...checkout.shippingPrice, gross: shippingGross },
		totalPrice: {
			...checkout.totalPrice,
			gross: {
				amount: Math.max(0, serverResult.totalPrice.gross.amount + shippingDelta),
				currency: serverResult.totalPrice.gross.currency,
			},
		},
	};
}

export function SummaryLineItem({ line, checkoutId }: SummaryLineItemProps) {
	const { state, dispatch, setCheckout, visibleLines, setStepErrors } = useCheckoutState();
	const [isPending, startTransition] = useTransition();
	const [showEmptyCartConfirm, setShowEmptyCartConfirm] = useState(false);
	const router = useRouter();
	const params = useParams();
	const t = useCheckoutText();
	const checkout = state.checkout;
	const channel = (params?.channel as string) || "";

	/** Check if the currently selected delivery method still exists in the updated methods list */
	function isDeliveryMethodGone(newMethods: Array<{ id: string }>) {
		const currentId = (checkout?.deliveryMethod as Record<string, unknown> | null)?.id as string | undefined;
		if (!currentId || newMethods.length === 0) return false;
		return !newMethods.some((m) => m.id === currentId);
	}

	/** When selected delivery method disappears, clear it and re-open the delivery step */
	function handleDeliveryMethodInvalidated() {
		dispatch({ type: "UNCOMPLETE_STEP", step: STEP_DELIVERY });
		dispatch({ type: "UNCOMPLETE_STEP", step: STEP_PAYMENT });
		dispatch({ type: "OPEN_STEP", step: STEP_DELIVERY });
		setStepErrors(STEP_DELIVERY, [
			t.deliveryMethodUnavailable ?? "Your selected shipping method is no longer available. Please choose another.",
		]);
	}

	const productName =
		line.variant?.product?.name ??
		line.variant?.name ??
		"Product";
	const variantName = line.variant?.name;
	const image =
		line.variant?.media?.[0]?.url ??
		line.variant?.product?.media?.[0]?.url ??
		line.variant?.product?.thumbnail?.url ??
		null;
	const imageAlt =
		line.variant?.media?.[0]?.alt ??
		line.variant?.product?.media?.[0]?.alt ??
		line.variant?.product?.thumbnail?.alt ??
		productName;
	const unitPrice = line.unitPrice?.gross;
	const totalPrice = line.totalPrice?.gross;

	function handleQuantityChange(newQty: number) {
		if (newQty < 1 || !checkout) return;

		// Optimistic update
		dispatch({ type: "OPTIMISTIC_QUANTITY", lineId: line.id, quantity: newQty });

		startTransition(async () => {
			const result = await updateLineQuantity(checkoutId, line.id, newQty);
			if (result.errors.length > 0) {
				dispatch({ type: "REVERT_OPTIMISTIC" });
				return;
			}
			if (result.checkout) {
				const methodGone = isDeliveryMethodGone(result.checkout.shippingMethods);
				const currency = result.checkout.subtotalPrice.gross.currency;

				setCheckout({
					...checkout,
					lines: result.checkout.lines
						.map((l) => {
							const existing = checkout.lines.find((el) => el.id === l.id);
							if (!existing) return null;
							return {
								...existing,
								quantity: l.quantity,
								totalPrice: {
									...existing.totalPrice,
									gross: l.totalPrice.gross,
								},
							};
						})
						.filter((l): l is NonNullable<typeof l> => l !== null),
					subtotalPrice: {
						...checkout.subtotalPrice,
						gross: result.checkout.subtotalPrice.gross,
					},
					shippingMethods: result.checkout.shippingMethods.length > 0
						? result.checkout.shippingMethods as typeof checkout.shippingMethods
						: checkout.shippingMethods,
					...(methodGone
						? {
							deliveryMethod: null as unknown as typeof checkout.deliveryMethod,
							shippingPrice: { ...checkout.shippingPrice, gross: { amount: 0, currency } },
							totalPrice: { ...checkout.totalPrice, gross: result.checkout.subtotalPrice.gross },
						}
						: deriveShippingAndTotal(checkout, result.checkout)),
				});

				if (methodGone) handleDeliveryMethodInvalidated();
			}
		});
	}

	function handleRemove() {
		if (!checkout) return;

		// If this is the last visible item, confirm before removing
		if (visibleLines.length === 1) {
			setShowEmptyCartConfirm(true);
			return;
		}

		performRemove();
	}

	function performRemove() {
		if (!checkout) return;

		// Optimistic remove
		dispatch({ type: "OPTIMISTIC_REMOVE_LINE", lineId: line.id });

		startTransition(async () => {
			const result = await removeLine(checkoutId, line.id);
			if (result.errors.length > 0) {
				dispatch({ type: "REVERT_OPTIMISTIC" });
				return;
			}

			// If this was the last item, redirect to homepage immediately
			// (before setCheckout to avoid rendering the checkout page with 0 lines)
			if (visibleLines.length === 1) {
				window.dispatchEvent(new CustomEvent("cart-updated"));
				router.replace(channel ? `/${channel}` : "/");
				return;
			}

			if (result.checkout) {
				const methodGone = isDeliveryMethodGone(result.checkout.shippingMethods);
				const currency = result.checkout.subtotalPrice.gross.currency;

				setCheckout({
					...checkout,
					lines: result.checkout.lines
						.map((l) => {
							const existing = checkout.lines.find((el) => el.id === l.id);
							if (!existing) return null;
							return {
								...existing,
								quantity: l.quantity,
								totalPrice: {
									...existing.totalPrice,
									gross: l.totalPrice.gross,
								},
							};
						})
						.filter((l): l is NonNullable<typeof l> => l !== null),
					subtotalPrice: {
						...checkout.subtotalPrice,
						gross: result.checkout.subtotalPrice.gross,
					},
					shippingMethods: result.checkout.shippingMethods.length > 0
						? result.checkout.shippingMethods as typeof checkout.shippingMethods
						: checkout.shippingMethods,
					...(methodGone
						? {
							deliveryMethod: null as unknown as typeof checkout.deliveryMethod,
							shippingPrice: { ...checkout.shippingPrice, gross: { amount: 0, currency } },
							totalPrice: { ...checkout.totalPrice, gross: result.checkout.subtotalPrice.gross },
						}
						: deriveShippingAndTotal(checkout, result.checkout)),
				});

				if (methodGone) handleDeliveryMethodInvalidated();
			}
		});
	}

	return (
		<div
			className={[
				"flex items-start gap-3 py-3 transition-opacity",
				isPending ? "opacity-50" : "",
			].join(" ")}
		>
			{/* Product thumbnail */}
			<div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
				{image ? (
					<img
						src={image}
						alt={imageAlt}
						className="h-full w-full object-cover"
						loading="lazy"
					/>
				) : (
					<div className="h-full w-full bg-neutral-100" aria-hidden="true" />
				)}
			</div>

			{/* Details */}
			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium text-neutral-900">{productName}</p>
				{variantName && variantName !== productName && (
					<p className="text-xs text-neutral-500">{variantName}</p>
				)}

				{/* Quantity stepper — 44×44px touch targets per WCAG 2.5.5 */}
				<div className="mt-1.5 flex items-center gap-2">
					<div className="flex items-center rounded-md border border-neutral-200">
						<button
							type="button"
							aria-label={`Decrease quantity of ${productName}`}
							onClick={() => handleQuantityChange(line.quantity - 1)}
							disabled={isPending || line.quantity <= 1}
							className="flex h-11 w-11 items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
						>
							−
						</button>
						<span
							className="min-w-[2rem] text-center text-sm text-neutral-900"
							aria-label={`Quantity: ${line.quantity}`}
						>
							{line.quantity}
						</span>
						<button
							type="button"
							aria-label={`Increase quantity of ${productName}`}
							onClick={() => handleQuantityChange(line.quantity + 1)}
							disabled={isPending}
							className="flex h-11 w-11 items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
						>
							+
						</button>
					</div>

					<button
						type="button"
						aria-label={`Remove ${productName}`}
						onClick={handleRemove}
						disabled={isPending}
						className="flex min-h-[44px] w-11 items-center justify-center text-neutral-300 hover:text-error-500 disabled:opacity-40"
					>
						<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			{/* Price */}
			<div className="text-end shrink-0">
				<p className="text-sm font-medium text-neutral-900">
					{totalPrice ? `${totalPrice.amount.toFixed(2)} ${totalPrice.currency}` : "—"}
				</p>
				{unitPrice && line.quantity > 1 && (
					<p className="text-xs text-neutral-400">
						{unitPrice.amount.toFixed(2)} × {line.quantity}
					</p>
				)}
			</div>

			{/* Empty cart confirmation dialog */}
			<ConfirmDialog
				open={showEmptyCartConfirm}
				title={t.emptyCartConfirmTitle ?? "Remove last item?"}
				message={t.emptyCartConfirmMessage ?? "This will empty your cart and take you back to the store."}
				confirmLabel={t.emptyCartConfirmButton ?? "Empty cart"}
				cancelLabel={t.emptyCartCancelButton ?? "Keep shopping"}
				onConfirm={() => {
					setShowEmptyCartConfirm(false);
					performRemove();
				}}
				onCancel={() => setShowEmptyCartConfirm(false)}
			/>
		</div>
	);
}
