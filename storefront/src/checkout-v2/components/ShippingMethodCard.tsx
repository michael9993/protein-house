"use client";

import type { ShippingMethod } from "../types";

interface ShippingMethodCardProps {
	method: ShippingMethod & {
		originalPrice?: { amount: number; currency: string };
		wasFreeByRule?: boolean;
		wasDiscounted?: boolean;
	};
	isSelected: boolean;
	onChange: (id: string) => void;
	showOriginalPrice?: boolean;
}

function deliveryEstimate(min: number | null, max: number | null): string | null {
	if (min === null && max === null) return null;
	const range = min === max ? String(min ?? max) : `${min ?? "?"}-${max ?? "?"}`;
	return `Est. ${range} business days`;
}

export function ShippingMethodCard({ method, isSelected, onChange, showOriginalPrice }: ShippingMethodCardProps) {
	const isFree = method.price.amount === 0;
	const radioId = `delivery-method-${method.id}`;
	const estimate = deliveryEstimate(method.minimumDeliveryDays, method.maximumDeliveryDays);

	const hasDiscount =
		showOriginalPrice !== false &&
		(method.wasFreeByRule || method.wasDiscounted) &&
		method.originalPrice &&
		method.originalPrice.amount !== method.price.amount;

	return (
		<label
			htmlFor={radioId}
			className={[
				"flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
				isSelected
					? "border-neutral-900 bg-neutral-50"
					: "border-neutral-200 hover:border-neutral-400",
			].join(" ")}
		>
			<input
				id={radioId}
				type="radio"
				name="deliveryMethod"
				value={method.id}
				checked={isSelected}
				onChange={() => onChange(method.id)}
				className="mt-0.5 shrink-0 accent-neutral-900"
			/>
			<div className="min-w-0 flex-1">
				<div className="flex items-center justify-between gap-2">
					<span className="font-medium text-neutral-900">{method.name}</span>
					{isFree ? (
						<span className="flex items-center gap-1.5">
							{hasDiscount && (
								<span className="text-xs text-neutral-400 line-through">
									{method.originalPrice!.amount.toFixed(2)} {method.originalPrice!.currency}
								</span>
							)}
							<span className="shrink-0 text-sm font-semibold text-success-600">Free</span>
						</span>
					) : hasDiscount ? (
						<span className="flex items-center gap-1.5">
							<span className="text-xs text-neutral-400 line-through">
								{method.originalPrice!.amount.toFixed(2)} {method.originalPrice!.currency}
							</span>
							<span className="shrink-0 font-medium text-success-600">
								{method.price.amount.toFixed(2)} {method.price.currency}
							</span>
						</span>
					) : (
						<span className="shrink-0 font-medium text-neutral-900">
							{method.price.amount.toFixed(2)} {method.price.currency}
						</span>
					)}
				</div>
				{estimate && <p className="mt-0.5 text-sm text-neutral-500">{estimate}</p>}
			</div>
		</label>
	);
}
