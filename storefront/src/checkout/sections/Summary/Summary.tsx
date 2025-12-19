import { type FC } from "react";
import clsx from "clsx";
import { SummaryItem, type SummaryLine } from "./SummaryItem";
import { PromoCodeAdd } from "./PromoCodeAdd";
import { SummaryMoneyRow } from "./SummaryMoneyRow";
import { SummaryPromoCodeRow } from "./SummaryPromoCodeRow";
import { SummaryItemMoneyEditableSection } from "./SummaryItemMoneyEditableSection";
import { ChevronDownIcon } from "@/checkout/ui-kit/icons";

import { getFormattedMoney } from "@/checkout/lib/utils/money";
import { Divider, Money } from "@/checkout/components";
import {
	type CheckoutLineFragment,
	type GiftCardFragment,
	type Money as MoneyType,
	type OrderLineFragment,
} from "@/checkout/graphql";
import { SummaryItemMoneySection } from "@/checkout/sections/Summary/SummaryItemMoneySection";
import { type GrossMoney, type GrossMoneyWithTax } from "@/checkout/lib/globalTypes";

interface SummaryProps {
	editable?: boolean;
	lines: SummaryLine[];
	totalPrice?: GrossMoneyWithTax;
	subtotalPrice?: GrossMoney;
	giftCards?: GiftCardFragment[];
	voucherCode?: string | null;
	discount?: MoneyType | null;
	shippingPrice: GrossMoney;
}

export const Summary: FC<SummaryProps> = ({
	editable = true,
	lines,
	totalPrice,
	subtotalPrice,
	giftCards = [],
	voucherCode,
	shippingPrice,
	discount,
}) => {
	const itemCount = lines.reduce((sum, line) => sum + (line.quantity || 1), 0);

	return (
		<div className="sticky top-8 h-fit w-full print:static">
			{/* Summary Card */}
			<div className="rounded-xl border border-neutral-200 bg-white shadow-sm print:shadow-none print:border-neutral-300">
				{/* Header */}
				<div className="border-b border-neutral-100 px-6 py-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold text-neutral-900">Order Summary</h2>
						<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-sm font-medium text-neutral-600">
							{itemCount} {itemCount === 1 ? "item" : "items"}
						</span>
					</div>
				</div>

				{/* Products List */}
				<details open className="group">
					<summary className="flex cursor-pointer items-center justify-between px-6 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
						<span className="flex items-center gap-2">
							<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
							</svg>
							Products
						</span>
						<ChevronDownIcon className="h-4 w-4 transition-transform group-open:rotate-180" />
					</summary>
					<ul className="max-h-80 overflow-y-auto px-4 pb-2" data-testid="SummaryProductList">
						{lines.map((line) => (
							<SummaryItem line={line} key={line?.id}>
								{editable ? (
									<SummaryItemMoneyEditableSection line={line as CheckoutLineFragment} />
								) : (
									<SummaryItemMoneySection line={line as OrderLineFragment} />
								)}
							</SummaryItem>
						))}
					</ul>
				</details>

				{/* Promo Code Section - Hidden in print */}
				{editable && (
					<div className="border-t border-neutral-100 px-6 py-4 print:hidden">
						<PromoCodeAdd />
					</div>
				)}

				{/* Price Breakdown */}
				<div className="border-t border-neutral-100 px-6 py-4">
					<div className="space-y-3">
						<SummaryMoneyRow label="Subtotal" money={subtotalPrice?.gross} ariaLabel="subtotal price" />
						
						{voucherCode && (
							<SummaryPromoCodeRow
								editable={editable}
								promoCode={voucherCode}
								ariaLabel="voucher"
								label={`Voucher: ${voucherCode}`}
								money={discount}
								negative
							/>
						)}
						
						{giftCards.map(({ currentBalance, displayCode, id }) => (
							<SummaryPromoCodeRow
								key={id}
								editable={editable}
								promoCodeId={id}
								ariaLabel="gift card"
								label={`Gift Card: •••• ${displayCode}`}
								money={currentBalance}
								negative
							/>
						))}
						
						<SummaryMoneyRow 
							label="Shipping" 
							ariaLabel="shipping cost" 
							money={shippingPrice?.gross} 
						/>
					</div>
				</div>

				{/* Total */}
				<div className="rounded-b-xl bg-neutral-50 px-6 py-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-lg font-bold text-neutral-900">Total</p>
							<p className="text-xs text-neutral-500">
								Includes {getFormattedMoney(totalPrice?.tax)} tax
							</p>
						</div>
						<Money 
							ariaLabel="total price" 
							money={totalPrice?.gross} 
							data-testid="totalOrderPrice"
							className="text-xl font-bold text-neutral-900"
						/>
					</div>
				</div>
			</div>

			{/* Security Badge - Hidden in print */}
			<div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-500 print:hidden">
				<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
				</svg>
				<span>Secure 256-bit SSL encryption</span>
			</div>
		</div>
	);
};
