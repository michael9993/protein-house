"use client";

import Image from "next/image";
import type { GetOrderForConfirmationQuery } from "@/gql/graphql";
import { useCheckoutText } from "@/checkout-v2/hooks/useCheckoutText";

type Order = NonNullable<GetOrderForConfirmationQuery["order"]>;

interface Props {
	order: Order;
}

export function OrderSummary({ order }: Props) {
	const t = useCheckoutText();

	function fmt(amount: number, currency: string): string {
		return `${amount.toFixed(2)} ${currency}`;
	}

	const subtotal = order.subtotal.gross;
	const shipping = order.shippingPrice.gross;
	const tax = order.total.tax;
	const total = order.total.gross;
	const voucherDiscount = order.discounts.find((d) => d.type === "VOUCHER");

	return (
		<div className="rounded-xl border border-neutral-200 bg-white p-6">
			<h2 className="mb-4 font-semibold text-neutral-900">
				{t.orderSummaryTitle ?? "Order Summary"}
			</h2>

			{/* Line items */}
			<div className="space-y-3 border-b border-neutral-100 pb-4">
				{order.lines.map((line) => (
					<div key={line.id} className="flex items-start gap-3">
						{line.thumbnail && (
							<div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
								<Image
									src={line.thumbnail.url}
									alt={line.thumbnail.alt ?? line.productName}
									fill
									className="object-cover"
									sizes="56px"
								/>
							</div>
						)}
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium text-neutral-900">{line.productName}</p>
							<p className="truncate text-xs text-neutral-500">{line.variantName}</p>
							<p className="text-xs text-neutral-500">×{line.quantity}</p>
						</div>
						<p className="flex-shrink-0 text-sm font-medium text-neutral-900">
							{fmt(line.totalPrice.gross.amount, line.totalPrice.gross.currency)}
						</p>
					</div>
				))}
			</div>

			{/* Totals */}
			<div className="space-y-2 pt-4 text-sm">
				<div className="flex justify-between text-neutral-600">
					<span>{t.subtotalLabel ?? "Subtotal"}</span>
					<span>{fmt(subtotal.amount, subtotal.currency)}</span>
				</div>

				<div className="flex justify-between text-neutral-600">
					<span>{t.shippingLabel ?? "Shipping"}</span>
					<span>
						{shipping.amount === 0
							? (t.freeShippingLabel ?? "Free")
							: fmt(shipping.amount, shipping.currency)}
					</span>
				</div>

				{voucherDiscount && voucherDiscount.amount.amount > 0 && (
					<div className="flex justify-between text-success-600">
						<span>
							{order.voucher?.code ? `Discount (${order.voucher.code})` : "Discount"}
						</span>
						<span>
							−{fmt(voucherDiscount.amount.amount, voucherDiscount.amount.currency)}
						</span>
					</div>
				)}

				{tax && tax.amount > 0 && (
					<div className="flex justify-between text-xs text-neutral-500">
						<span>{t.taxLabel ?? "Tax"}</span>
						<span>{fmt(tax.amount, tax.currency)}</span>
					</div>
				)}

				<div className="flex justify-between border-t border-neutral-200 pt-2 font-semibold text-neutral-900">
					<span>{t.totalLabel ?? "Total"}</span>
					<span>{fmt(total.amount, total.currency)}</span>
				</div>
			</div>

			{/* Delivery method */}
			{order.deliveryMethod && (
				<div className="mt-4 border-t border-neutral-100 pt-4 text-sm text-neutral-500">
					{order.deliveryMethod.__typename === "ShippingMethod" ? (
						<p>
							<span className="font-medium text-neutral-700">
								{t.deliveryMethodsTitle ?? "Delivery"}:{" "}
							</span>
							{order.deliveryMethod.name}
							{order.deliveryMethod.minimumDeliveryDays != null &&
								order.deliveryMethod.maximumDeliveryDays != null && (
									<span className="ms-1 text-neutral-400">
										({order.deliveryMethod.minimumDeliveryDays}–
										{order.deliveryMethod.maximumDeliveryDays}{" "}
										{"business days"})
									</span>
								)}
						</p>
					) : (
						<p>
							<span className="font-medium text-neutral-700">
								{"Pickup"}:{" "}
							</span>
							{order.deliveryMethod.name}
						</p>
					)}
				</div>
			)}
		</div>
	);
}
